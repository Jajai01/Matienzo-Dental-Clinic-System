import React, { useState } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';
import { toast, Toaster } from 'react-hot-toast';

const AdminEmailBroadcast = ({ admin, setAdmin }) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    targetGroup: 'notifications' // 'notifications' or 'promotions'
  });
  
  const [isSending, setIsSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill out both subject and message.");
      return;
    }
    setShowConfirmModal(true);
  };

  const executeSendBroadcast = async () => {
    setShowConfirmModal(false); 
    setIsSending(true);
    toast.loading("Dispatching emails...", { id: 'broadcast' });

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/send-broadcast`, formData);
      if (res.data && res.data.success) {
        toast.success(res.data.message, { id: 'broadcast' });
        setFormData({ subject: '', message: '', targetGroup: 'notifications' });
      } else {
        toast.error(res.data.message || "Failed to send broadcast.", { id: 'broadcast' });
      }
    } catch (error) {
      console.error("Broadcast error:", error);
      toast.error("Server error while sending emails.", { id: 'broadcast' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden">
      <Toaster position="top-right" />
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 flex flex-col p-8 h-full overflow-y-auto relative">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email Broadcast Center</h1>
          <p className="text-sm text-slate-500 mt-1">Send targeted announcements or promotional offers exclusively to users who opted in.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pb-10">
          
          {/* LEFT COLUMN: COMPOSER FORM */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Compose Email</h2>
            
            <form onSubmit={handlePreSubmit} className="space-y-6">
              
              {/* Target Group Selector */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Target Audience</label>
                <select 
                  value={formData.targetGroup} 
                  onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] transition font-medium text-sm cursor-pointer"
                >
                  <option value="notifications">Users with Email Notifications Enabled (Reminders & Updates)</option>
                  <option value="promotions">Users with Promotion Toggles Enabled (Marketing & Offers)</option>
                </select>
              </div>

              {/* Subject Line */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Email Subject</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject} 
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] transition text-sm" 
                  placeholder="e.g., Important Clinic Schedule Update" 
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Message Content</label>
                <textarea 
                  required
                  rows={8}
                  value={formData.message} 
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#D4AF37] transition text-sm resize-none" 
                  placeholder="Type your announcement or promotional message here..." 
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isSending} 
                className="w-full bg-slate-900 text-[#D4AF37] font-bold py-4 rounded-xl hover:bg-slate-800 transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
                    SENDING EMAILS...
                  </>
                ) : (
                  'REVIEW & SEND BROADCAST'
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: LIVE EMAIL PREVIEW */}
          <div className="bg-slate-200/50 border border-slate-300 rounded-3xl p-6 shadow-inner sticky top-0 flex flex-col min-h-125">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Live Patient Inbox Preview</h2>
            
            {/* Mock Email Client Container */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden flex-1 flex flex-col border border-slate-200">
              
              {/* Mock Window Header */}
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="flex-1 text-center text-xs font-medium text-slate-500">
                  New Message
                </div>
              </div>

              {/* Mock Email Headers */}
              <div className="px-6 py-4 border-b border-slate-100 bg-white space-y-2 text-sm">
                <div className="flex items-start">
                  <span className="text-slate-400 w-16 shrink-0">From:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    Matienzo Dental Clinic <span className="text-slate-400 font-normal">&lt;noreply@matienzodental.com&gt;</span>
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-slate-400 w-16 shrink-0">To:</span>
                  <span className="text-slate-600">Opted-in Patients</span>
                </div>
                <div className="flex items-start pt-2 border-t border-slate-50">
                  <span className="text-slate-400 w-16 shrink-0 mt-0.5">Subject:</span>
                  <span className="font-bold text-slate-900 text-base">
                    {formData.subject || <span className="text-slate-300 italic font-normal">No subject provided...</span>}
                  </span>
                </div>
              </div>

              {/* Mock Email Body */}
              <div className="p-6 bg-white flex-1 overflow-y-auto">
                {/* Styled Email Template Content */}
                <div className="max-w-full">
                  
                  {/* Brand Header inside email */}
                  <div className="mb-6 pb-4 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">MATIENZO DENTAL</h3>
                  </div>

                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm font-medium">
                    {formData.message || <span className="text-slate-300 italic font-normal">Start typing your message to see the preview here...</span>}
                  </p>

                  {/* Email Footer */}
                  <div className="mt-12 pt-6 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed">
                    <p>Matienzo Dental Clinic • Calamba, Laguna</p>
                    <p className="mt-2">
                      You are receiving this email because you opted into 
                      {formData.targetGroup === 'notifications' ? ' Account Notifications' : ' Promotional Offers'} in your Patient Portal preferences. 
                      You can manage your notification settings at any time by logging into your account.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* CUSTOM CONFIRMATION MODAL */}
        {showConfirmModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fadeIn">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Confirm Broadcast</h3>
              </div>
              
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                You are about to send an email to all users who opted into <strong className="text-slate-800">{formData.targetGroup === 'notifications' ? 'Email Notifications' : 'Promotions & Offers'}</strong>. This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeSendBroadcast}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-[#D4AF37] hover:bg-slate-800 transition shadow-md cursor-pointer"
                >
                  Yes, Send Emails
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminEmailBroadcast;