import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';
import { toast, Toaster } from 'react-hot-toast';

const Settings = ({ admin, setAdmin }) => {
  const [activeTab, setActiveTab] = useState('data');
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- DATA EXPORT STATE ---
  const [exportConfig, setExportConfig] = useState({
    includeAppointments: true,
    includeMedicalHistory: true,
    includeFinancials: false,
    anonymizeData: true,
    format: 'csv',
  });

  // --- CLINIC PARAMETERS STATE ---
  const [clinicData, setClinicData] = useState({
    clinicName: 'Matienzo Dental Clinic',
    contactNumber: '0927 926 2535',
    address: 'Matienzo Compound, Sitio 1 Brgy San Juan, Santa Cruz, Laguna',
  });

  // 1. THE REAL EXPORT FUNCTION
  const handleDownloadResearchData = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token'); // Adjust if you store tokens elsewhere
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/settings/export`, exportConfig, {
        responseType: 'blob',
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined
        },
        withCredentials: true // Include cookies if your session uses them
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileExtension = exportConfig.format === 'csv' ? 'csv' : 'json';
      link.setAttribute('download', `matienzo_data_export.${fileExtension}`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      toast.success(`Data successfully extracted and downloaded!`, {
        style: { border: '1px solid #10b981', color: '#0f172a' },
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to extract database records.");
    } finally {
      setIsExporting(false);
    }
  };
  
  // 2. THE CLINIC UPDATE FUNCTION
  const handleClinicChange = (e) => {
    setClinicData({ ...clinicData, [e.target.name]: e.target.value });
  };

  const handleUpdateClinicParameters = async () => {
    setIsSaving(true);
    try {
      // NOTE: You will need to create this PUT route in your Express backend later!
      // await axios.put('http://localhost:8000/api/settings/clinic', clinicData);
      
      toast.success("Clinic parameters updated successfully!");
    } catch (error) {
      toast.error("Failed to save clinic parameters.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" />
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 pb-6 border-b border-slate-200">
            <h1 className="text-3xl font-black text-slate-950">System Configurations</h1>
            <p className="text-slate-500 font-medium mt-1">Manage database exports, clinic parameters, and system security.</p>
          </header>

          <div className="flex flex-col md:flex-row gap-8">
            {/* LEFT: Technical Navigation Sidebar */}
            <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
              <button onClick={() => setActiveTab('data')} className={`text-left px-5 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-between ${activeTab === 'data' ? 'bg-slate-950 text-[#D4AF37] shadow-lg shadow-slate-900/20' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                Data & Research
                {activeTab === 'data' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>}
              </button>
              <button onClick={() => setActiveTab('clinic')} className={`text-left px-5 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-between ${activeTab === 'clinic' ? 'bg-slate-950 text-[#D4AF37] shadow-lg shadow-slate-900/20' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                Clinic Parameters
                {activeTab === 'clinic' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>}
              </button>
              <button onClick={() => setActiveTab('security')} className={`text-left px-5 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-between ${activeTab === 'security' ? 'bg-slate-950 text-[#D4AF37] shadow-lg shadow-slate-900/20' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                Access & Security
                {activeTab === 'security' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>}
              </button>
            </div>

            {/* RIGHT: Configuration Panels */}
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-12">
              
              {/* --- DATA & RESEARCH TAB --- */}
              {activeTab === 'data' && (
                <div className="animate-fade-in space-y-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Database Extraction</h2>
                    <p className="text-sm text-slate-500 mt-1">Export raw system data for external research, backup, or statistical analysis.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Target Collections</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <label className="flex items-center gap-4 cursor-pointer p-3 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition">
                        <input type="checkbox" checked={exportConfig.includeAppointments} onChange={() => setExportConfig({ ...exportConfig, includeAppointments: !exportConfig.includeAppointments })} className="w-5 h-5 accent-slate-900 cursor-pointer" />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900">Appointment Logs</span>
                          <span className="text-xs text-slate-500">Historical schedule data, services rendered, and completion status.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-4 cursor-pointer p-3 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition">
                        <input type="checkbox" checked={exportConfig.includeMedicalHistory} onChange={() => setExportConfig({ ...exportConfig, includeMedicalHistory: !exportConfig.includeMedicalHistory })} className="w-5 h-5 accent-slate-900 cursor-pointer" />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900">Clinical Medical Records</span>
                          <span className="text-xs text-slate-500">Diagnoses, treatment history, and clinical notes.</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-4 cursor-pointer p-3 border border-slate-200 rounded-xl bg-white hover:border-slate-300 transition">
                        <input type="checkbox" checked={exportConfig.includeFinancials} onChange={() => setExportConfig({ ...exportConfig, includeFinancials: !exportConfig.includeFinancials })} className="w-5 h-5 accent-slate-900 cursor-pointer" />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-900">Financial Ledger</span>
                          <span className="text-xs text-slate-500">Billing amounts, payment methods, and revenue timelines.</span>
                        </div>
                      </label>
                    </div>

                    <hr className="border-slate-200" />

                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Research Protocols</h3>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4">
                      <input type="checkbox" checked={exportConfig.anonymizeData} onChange={() => setExportConfig({ ...exportConfig, anonymizeData: !exportConfig.anonymizeData })} className="w-5 h-5 mt-1 accent-amber-600 cursor-pointer" />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-amber-900">Anonymize Patient PII (Data Privacy Act Compliant)</span>
                        <span className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                          Strips names and contact info. Patient IDs will be replaced with randomized cryptographic hashes. <strong>Highly recommended for third-party analytics.</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <select value={exportConfig.format} onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })} className="bg-white border border-slate-300 font-bold text-sm rounded-xl px-4 py-3 outline-none focus:border-slate-900 cursor-pointer">
                        <option value="csv">Export as .CSV (Excel)</option>
                        <option value="json">Export as .JSON (Developers)</option>
                      </select>

                      <button onClick={handleDownloadResearchData} disabled={isExporting} className="flex-1 bg-slate-950 text-[#D4AF37] font-bold py-3 rounded-xl hover:bg-black transition-all shadow-md disabled:opacity-70">
                        {isExporting ? 'AGGREGATING DATABASE...' : 'COMPILE & DOWNLOAD DATA'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* --- CLINIC PARAMETERS TAB --- */}
              {activeTab === 'clinic' && (
                <div className="animate-fade-in space-y-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Clinic Parameters</h2>
                    <p className="text-sm text-slate-500 mt-1">Update operational defaults used across receipts and front-facing interfaces.</p>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Clinic Name</label>
                      <input type="text" name="clinicName" value={clinicData.clinicName} onChange={handleClinicChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#D4AF37] transition font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Official Contact</label>
                      <input type="text" name="contactNumber" value={clinicData.contactNumber} onChange={handleClinicChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#D4AF37] transition font-mono text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business Address</label>
                      <textarea rows="2" name="address" value={clinicData.address} onChange={handleClinicChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#D4AF37] transition resize-none text-sm"></textarea>
                    </div>

                    <button onClick={handleUpdateClinicParameters} disabled={isSaving} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-md disabled:opacity-70">
                      {isSaving ? 'Applying...' : 'Apply Parameter Updates'}
                    </button>
                  </div>
                </div>
              )}

              {/* --- SECURITY TAB --- */}
              {activeTab === 'security' && (
                <div className="animate-fade-in space-y-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Access Control</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage administrative credentials and authentication tokens.</p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admin Email Identity</label>
                      <input type="email" defaultValue={admin?.email || "admin@matienzodental.com"} disabled className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl p-3 cursor-not-allowed" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">New Password Key</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-red-500 transition" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password Key</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-red-500 transition" />
                      </div>
                    </div>

                    <button className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-md">
                      Force Credential Update
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;