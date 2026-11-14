import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConsoleSidebar from '../sidebar';

const HelpSupport = ({ user, setUser }) => {
  // ==========================================
  // 1. STATE & MOCK DATA
  // ==========================================
  const [activeFaq, setActiveFaq] = useState(null);
  
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  // 🔑 Dynamic Clinic Settings State
  const [clinicSettings, setClinicSettings] = useState({
    businessName: 'Matienzo Dental Clinic',
    dentistName: 'Dra. Anne Dumas-Matienzo',
    prcNumber: '0000000',
    contactNumber: '0927 926 2535',
    address: 'Matienzo Compound, Sitio 1 Brgy San Juan, Santa Cruz, Laguna',
    email: 'matienzo.dentalclinic@gmail.com',
    operatingHours: 'Monday - Sunday | 8:00 AM - 4:00 PM'
  });

  const faqs = [
    {
      id: 1,
      question: "What is the clinic's cancellation policy?",
      answer: "We require at least a 24-hour notice if you need to cancel or reschedule your appointment. This allows us to offer the time slot to another patient."
    },
    {
      id: 2,
      question: "How does the 30-minute booking rule work?",
      answer: "Each appointment slot is capped at 30 minutes for a single operation. If you need multiple treatments (e.g., both Pasta and Cleaning), you must book two separate consecutive slots so our dentist has adequate time."
    },
    {
      id: 3,
      question: "Do you give discounts?",
      answer: "Yes, give discounts if you pay after the operation/transaction."
    },
    {
      id: 4,
      question: "What should I do if I have a dental emergency?",
      answer: "For severe pain, bleeding, or trauma outside of our regular operating hours, please proceed to the nearest hospital emergency room. During clinic hours, you may book a walk-in consultation slot."
    }
  ];

  // ==========================================
  // 2. FETCH CLINIC SETTINGS ON LOAD
  // ==========================================
  useEffect(() => {
    const fetchClinicSettings = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/clinic`);
        if (res.data && res.data.success && res.data.settings) {
          setClinicSettings(res.data.settings);
        }
      } catch (error) {
        console.log("Using default fallback clinic settings");
      }
    };
    fetchClinicSettings();
  }, []);

  // ==========================================
  // 3. HANDLERS
  // ==========================================
  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        patientId: user?.patientId || user?._id,
        patientName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        patientEmail: user?.email,
        subject: ticketForm.subject,
        message: ticketForm.message
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/tickets`, payload);

      if (response.status === 201 || response.status === 200) {
        setTicketSent(true);
        setTicketForm({ subject: '', message: '' });
        
        setTimeout(() => setTicketSent(false), 4000);
      }
    } catch (error) {
      console.error("Error sending ticket:", error);
      alert(error.response?.data?.message || "Failed to send message. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans relative">
      
      {/* Permanent Fixed Left Sidebar */}
      <ConsoleSidebar user={user} setUser={setUser} />

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col pb-12">
        <div className="max-w-6xl w-full mx-auto p-8 md:p-10 flex-1">
          
          {/* Header Row */}
          <div className="border-b border-slate-200 pb-6 text-left mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Help & Support Center
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Find answers to common questions, review our guidelines, or send a message to our support desk.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ========================================== */}
            {/* LEFT COLUMN (7/12): FAQS & SUPPORT TICKET  */}
            {/* ========================================== */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* FAQ Accordion */}
              <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950 tracking-tight mb-6">Frequently Asked Questions</h2>
                
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div 
                      key={faq.id} 
                      className={`border rounded-xl transition-all overflow-hidden ${
                        activeFaq === faq.id ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <button 
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none cursor-pointer"
                      >
                        <span className="text-sm font-bold text-slate-800">{faq.question}</span>
                        <span className={`text-slate-400 font-bold transition-transform duration-300 ${activeFaq === faq.id ? 'rotate-180 text-blue-600' : ''}`}>
                          ↓
                        </span>
                      </button>
                      
                      {/* Expandable Content */}
                      <div className={`px-5 transition-all duration-300 ease-in-out ${activeFaq === faq.id ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed pt-1 border-t border-slate-100">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Support Ticket Form */}
              <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-8 shadow-sm relative overflow-hidden">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-950 tracking-tight">Send us a message</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Need help with an invoice, technical issue, or account change? Let us know.</p>
                </div>

                {ticketSent ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center animate-fadeIn">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                      ✓
                    </div>
                    <h3 className="text-sm font-bold text-emerald-900 mb-1">Message Sent Successfully</h3>
                    <p className="text-xs text-emerald-700 font-medium">Our support desk will reply to your registered email address within 24 hours.</p>
                    <button 
                      onClick={() => setTicketSent(false)}
                      className="mt-4 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-widest cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Subject / Topic</label>
                      <select 
                        required
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium cursor-pointer"
                      >
                        <option value="" disabled hidden>Select a category...</option>
                        <option value="Billing & Payments">Billing & Payments</option>
                        <option value="Account Settings">Account Settings & Technical</option>
                        <option value="Appointment Issue">Appointment Issue</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Your Message</label>
                      <textarea 
                        required
                        rows="4"
                        placeholder="Please describe your issue in detail..."
                        value={ticketForm.message}
                        onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-all font-medium resize-none"
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-slate-950 text-[#D4AF37] hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? 'Sending Message...' : 'Submit Support Ticket'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

            </div>

            {/* ========================================== */}
            {/* RIGHT COLUMN (5/12): CONTACT & LOCATION    */}
            {/* ========================================== */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Dynamic Clinic Info Card */}
              <div className="bg-slate-950 text-white rounded-3xl p-8 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-3xl"></div>
                
                <h2 className="text-lg font-bold text-[#D4AF37] tracking-tight mb-2 relative z-10">{clinicSettings.businessName}</h2>
                <p className="text-xs text-slate-400 font-semibold mb-6 relative z-10">Head Dentist: {clinicSettings.dentistName} (PRC: {clinicSettings.prcNumber})</p>

                <div className="space-y-5 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm shrink-0">📍</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Location</h4>
                      <p className="text-sm font-medium leading-relaxed">{clinicSettings.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm shrink-0">🕒</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Operating Hours</h4>
                      <p className="text-sm font-medium leading-relaxed text-emerald-400">{clinicSettings.operatingHours}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 border-t border-slate-800 pt-5 mt-2">
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm shrink-0">📞</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Details</h4>
                      <p className="text-sm font-medium leading-relaxed hover:text-[#D4AF37] cursor-pointer transition-colors">{clinicSettings.contactNumber}</p>
                      <p className="text-sm font-medium hover:text-[#D4AF37] cursor-pointer transition-colors">{clinicSettings.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Reminder Alert */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="text-2xl mt-0.5">💬</div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-1">Need Clinical Advice?</h4>
                  <p className="text-xs text-blue-800/80 font-medium leading-relaxed">
                    If you have a medical question about your diagnosis, prescription, or recent procedure, please use the direct chat feature in your <a href={`/user/medical-record/${user?.patientId || user?._id}`} className="font-bold underline hover:text-blue-600 transition-colors">Medical Record tab</a> to speak directly with {clinicSettings.dentistName}.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>

    </div>
  );
};

export default HelpSupport;