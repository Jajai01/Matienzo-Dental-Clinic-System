import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import ConsoleSidebar from '../sidebar';

const AccountPreference = ({ user, setUser }) => {
  // ==========================================
  // 1. PREFERENCES STATE
  // ==========================================
  const [preferences, setPreferences] = useState({
    notifyEmail: true,
    notifyMarketing: false,
    twoFactorAuth: false,
    allowClinicalResearch: true 
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modal & Password States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Visibility (Eye Patch) States
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Resolve user identifier safely (_id or patientId)
  const userId = user?._id || user?.patientId;

  // ==========================================
  // 2. FETCH CURRENT PREFERENCES ON LOAD
  // ==========================================
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) {
        console.warn("⚠️ No user ID or patientId found in user prop:", user);
        setIsLoading(false);
        return;
      }
      
      try {
        console.log(`📥 Fetching preferences for user identifier: ${userId}`);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile/${userId}/preferences`);
        console.log("📥 Preferences response:", res.data);
        
        if (res.data && res.data.preferences) {
          setPreferences(res.data.preferences);
        }
      } catch (error) {
        console.error("❌ Failed to fetch preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreferences();
  }, [user, userId]);

  // ==========================================
  // 3. HANDLERS
  // ==========================================
  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error("User session missing. Please log in again.");
      return;
    }

    setIsSaving(true);
    
    try {
      console.log(`💾 Saving preferences for ${userId}:`, preferences);
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/profile/${userId}/preferences`, preferences);
      console.log("💾 Save response:", res.data);
      
      if (res.data.success) {
        // 🔑 FIXED: Update state with server response so local state matches backend permanently
        if (res.data.preferences) {
          setPreferences(res.data.preferences);
        }
        toast.success("Preferences updated successfully!", { style: { border: '1px solid #10b981' }});
      }
    } catch (error) {
      console.error("❌ Save preferences error:", error);
      toast.error("Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("New passwords do not match!");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/profile/${userId}/change-password`, {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new
      });

      if (res.data.success) {
        toast.success("Password changed securely!", { style: { border: '1px solid #10b981' }});
        setPasswordForm({ current: '', new: '', confirm: '' });
        setIsPasswordModalOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password. Check current password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // FULL DATABASE PDF DATA EXPORT HANDLER
  const handleDataExport = async () => {
    const loadingToastId = toast.loading("Compiling your medical records...");
    setIsExporting(true);

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile/${userId}/export`);
      const { appointments, medicalRecord } = response.data;

      const doc = new jsPDF();
      let yPos = 20;

      const checkPageBreak = (spaceNeeded) => {
        if (yPos + spaceNeeded > 280) {
          doc.addPage();
          yPos = 20;
        }
      };

      // --- HEADER ---
      doc.setFillColor(212, 175, 55); 
      doc.rect(0, 0, doc.internal.pageSize.width, 8, 'F');
      
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); 
      doc.setFont("helvetica", "bold");
      yPos += 10;
      doc.text("Matienzo Dental Clinic", 20, yPos);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139); 
      doc.setFont("helvetica", "normal");
      yPos += 6;
      doc.text("Comprehensive Patient Data Archive", 20, yPos);
      yPos += 6;
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos);
      
      // --- PATIENT INFO ---
      yPos += 15;
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("Patient Information", 20, yPos);
      
      yPos += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${user?.firstName || 'N/A'} ${user?.lastName || ''}`, 20, yPos);
      doc.text(`Email: ${user?.email || 'N/A'}`, 110, yPos);
      yPos += 6;
      doc.text(`System ID: ${userId}`, 20, yPos);

      // --- CLINICAL DIAGNOSIS & HISTORY ---
      yPos += 20;
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Clinical History & Diagnoses", 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPos += 10;

      if (medicalRecord && medicalRecord.history.length > 0) {
        medicalRecord.history.forEach((record) => {
          checkPageBreak(25);
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.text(`${record.date} — Attending: ${record.dentist}`, 20, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(71, 85, 105);
          doc.text(`Diagnosis: ${record.diagnosis}`, 25, yPos);
          yPos += 5;
          doc.text(`Treatment: ${record.treatment}`, 25, yPos);
          yPos += 10; 
        });
      } else {
        doc.text("No medical history logs found in the system.", 20, yPos);
        yPos += 10;
      }

      // --- PRESCRIPTIONS ---
      yPos += 10;
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("Prescription Ledger", 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPos += 10;

      if (medicalRecord && medicalRecord.prescriptions.length > 0) {
        medicalRecord.prescriptions.forEach((rx) => {
          checkPageBreak(20);
          doc.setFont("helvetica", "bold");
          doc.text(`• ${rx.medicine} (${rx.status})`, 20, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(`Date: ${rx.date}`, 140, yPos);
          yPos += 5;
          doc.text(`Dosage: ${rx.dosage}`, 25, yPos);
          yPos += 8;
        });
      } else {
        doc.text("No prescription logs found in the system.", 20, yPos);
        yPos += 10;
      }

      // --- APPOINTMENT TRANSACTIONS ---
      yPos += 10;
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("Appointment & Transaction Logs", 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      yPos += 10;

      if (appointments && appointments.length > 0) {
        appointments.forEach((apt) => {
          checkPageBreak(25);
          doc.setFont("helvetica", "bold");
          doc.text(`${apt.referenceCode || ''} — ${apt.service || ''}`, 20, yPos);
          
          if (apt.status === "Completed") doc.setTextColor(16, 185, 129);
          else if (apt.status === "Cancelled") doc.setTextColor(239, 68, 68);
          else doc.setTextColor(59, 130, 246);
          
          doc.text(`[${apt.status}]`, 160, yPos);
          
          doc.setTextColor(71, 85, 105);
          doc.setFont("helvetica", "normal");
          yPos += 5;
          doc.text(`Schedule: ${apt.selectedDate} at ${apt.selectedTimeSlot}`, 25, yPos);
          yPos += 5;
          doc.text(`Payment: ${apt.paymentStatus} (${apt.paymentMethod}) ${apt.billingAmount ? `- PHP ${apt.billingAmount}` : ''}`, 25, yPos);
          yPos += 10;
        });
      } else {
        doc.text("No appointment transactions found.", 20, yPos);
      }

      doc.save(`Matienzo_Medical_Record_${user?.firstName || 'Patient'}.pdf`);
      toast.success("Medical Data Archive downloaded securely!", { id: loadingToastId });

    } catch (error) {
      console.error("PDF Export failed:", error);
      toast.error("Failed to generate PDF. Make sure your server is running.", { id: loadingToastId });
    } finally {
      setIsExporting(false);
    }
  };

  const ToggleSwitch = ({ isOn, onClick, disabled = false }) => (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
        disabled ? 'opacity-50 cursor-not-allowed bg-slate-300' : 'cursor-pointer shadow-inner'
      } ${!disabled && (isOn ? 'bg-emerald-500' : 'bg-slate-300')}`}
    >
      <span className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 shadow-sm ${isOn ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans relative">
      <Toaster position="top-right" />
      <ConsoleSidebar user={user} setUser={setUser} />

      <main className="flex-1 pl-64 min-h-screen flex flex-col pb-12">
        <div className="max-w-4xl w-full mx-auto p-8 md:p-10 flex-1">
          
          <div className="border-b border-slate-200 pb-6 text-left mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Preferences & Security</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Manage how the clinic contacts you, secure your account, and control your data privacy.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#D4AF37] rounded-full animate-spin"></div>
            </div>
          ) : (
            <form onSubmit={handleSaveChanges} className="space-y-8 animate-fadeIn">
              
              {/* SECTION 1: NOTIFICATION RULES */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-950 tracking-tight">Notification Settings</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Control how you receive updates about your appointments and billing.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Important Email Notifications</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Receive appointment reminders, clinical updates, and digital receipts.</p>
                    </div>
                    <ToggleSwitch isOn={preferences.notifyEmail} onClick={() => handleToggle('notifyEmail')} />
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Marketing & Promotional Offers</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Receive occasional promotional discounts and clinic announcements.</p>
                    </div>
                    <ToggleSwitch isOn={preferences.notifyMarketing} onClick={() => handleToggle('notifyMarketing')} />
                  </div>
                </div>
              </div>

              {/* SECTION 2: SECURITY & AUTHENTICATION */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-950 tracking-tight">Account Security</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Keep your medical records secure by maintaining strong login credentials.</p>
                </div>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Account Password</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">It's a good idea to use a strong password that you're not using elsewhere.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="text-xs font-bold text-slate-950 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer"
                    >
                      Change Password
                    </button>
                  </div>
                  
                  {/* 🔑 FIXED (Bug #13): Two-Factor Authentication marked as not available */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl opacity-80">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</h4>
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">Currently Unavailable</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Require a security code sent to your email when logging in. (Not available in this release)</p>
                    </div>
                    <ToggleSwitch isOn={false} disabled={true} onClick={() => {}} />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PRIVACY & DATA EXPORT */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-950 tracking-tight">Data Privacy</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Manage how your medical and clinical data is handled by the clinic.</p>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-slate-100 mb-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Allow Data for Clinical Research</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Permit the clinic to use your anonymized x-rays and diagnosis data for medical research.</p>
                  </div>
                  <ToggleSwitch isOn={preferences.allowClinicalResearch} onClick={() => handleToggle('allowClinicalResearch')} />
                </div>
                <div className="border border-blue-200 bg-blue-50/50 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-blue-900 mb-1">Request Medical Records Export</h4>
                  <p className="text-xs text-blue-800/80 font-medium mb-4">
                    Download a complete PDF archive containing your diagnosis history, prescriptions, and appointment logs.
                  </p>
                  <button 
                    type="button" 
                    disabled={isExporting}
                    onClick={handleDataExport}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? 'Compiling PDF...' : 'Download My Records ↓'}
                  </button>
                </div>
              </div>

              {/* SUBMIT ACTION ROW */}
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-all text-slate-600 hover:bg-slate-100 cursor-pointer">
                  Discard Changes
                </button>
                <button type="submit" disabled={isSaving} className="bg-slate-950 text-[#D4AF37] hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-sm cursor-pointer">
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* 4. CHANGE PASSWORD MODAL WITH EYE ICONS */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-fadeIn relative">
            
            <h2 className="text-xl font-bold text-slate-950 tracking-tight mb-1">Change Password</h2>
            <p className="text-xs font-medium text-slate-500 mb-6">Ensure your new password is at least 8 characters long.</p>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrent ? "text" : "password"} 
                    required
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-10 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCurrent ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">New Password</label>
                <div className="relative">
                  <input 
                    type={showNew ? "text" : "password"} 
                    required minLength="8"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-10 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNew ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showConfirm ? "text" : "password"} 
                    required minLength="8"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 pr-10 text-sm bg-slate-50/50 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-medium"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setIsPasswordModalOpen(false); setPasswordForm({ current: '', new: '', confirm: '' }); }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-950 hover:bg-slate-800 text-[#D4AF37] shadow-md transition-all cursor-pointer disabled:opacity-70"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AccountPreference;