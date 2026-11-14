import React, { useState } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast'; // 🔑 Imported toast notifications
import logo_no_bg from "../assets/logo_no_bg.png";
import ModernNavbar from './Navbar'; 
import Footer from '../components/footer';

const ContactPage = () => {
  // --- FORM STATES ---
  const [dentistForm, setDentistForm] = useState({ 
    fullName: '', 
    email: '', 
    reason: 'Price Inquiry', 
    concern: '' 
  });

  const [devForm, setDevForm] = useState({ 
    fullName: '', 
    email: '', 
    reason: 'Improvement Suggestion', 
    concern: '' 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- SUBMISSION HANDLER ---
  const handleMessageSubmit = async (e, target, formData, setFormState) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // 🔑 Added a loading toast that we can dismiss/update later
    const loadingToastId = toast.loading('Sending your message...');
    
    try {
      // Sends the data to the Nodemailer Express endpoint
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/contact`, {
        ...formData,
        target: target // Tells the backend whether to email Dra. Anne or the Dev
      });

      if (response.status === 200) {
        // 🔑 Replaced alert with success toast
        toast.success('Message sent successfully!', { id: loadingToastId });
        
        // Reset form to default state after sending
        setFormState({ fullName: '', email: '', reason: formData.reason, concern: '' });
      }
    } catch (error) {
      console.error("Failed to send:", error);
      // 🔑 Replaced alert with error toast
      toast.error('Failed to send message. Please try again.', { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between font-sans text-slate-800">
      
      {/* 🔑 Mount the Toaster so notifications can render */}
      <Toaster position="top-center" />

      {/* --- HEADER NAVIGATION AREA --- */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-4 flex items-start justify-between relative z-50 shrink-0">
        <div className="p-3 w-40 h-40 lg:w-36 lg:h-36 flex items-center justify-center">
          <img 
            src={logo_no_bg} 
            alt="Matienzo Dental Clinic Logo" 
            className="max-w-full max-h-full object-contain scale-150"
          />
        </div>
        <ModernNavbar page="contact" />
      </header>

      {/* --- MAIN CONTENT AREA: CONTACT FORMS --- */}
      <main className="grow w-full max-w-3xl mx-auto px-6 py-12 space-y-20">
        
        {/* --- SECTION 1: CONTACT THE GENERAL DENTIST --- */}
        <section className="space-y-6">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-900 tracking-tight">
            Contact the General Dentist
          </h1>
          
          <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] p-8 md:p-12 max-w-2xl mx-auto">
            <form 
              onSubmit={(e) => handleMessageSubmit(e, 'dentist', dentistForm, setDentistForm)}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={dentistForm.fullName}
                    onChange={(e) => setDentistForm({...dentistForm, fullName: e.target.value})}
                    className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Email</label>
                  <input 
                    type="email" 
                    required
                    value={dentistForm.email}
                    onChange={(e) => setDentistForm({...dentistForm, email: e.target.value})}
                    className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Reason</label>
                <select 
                  value={dentistForm.reason}
                  onChange={(e) => setDentistForm({...dentistForm, reason: e.target.value})}
                  className="w-full border border-slate-400 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-slate-600 text-slate-700 cursor-pointer"
                >
                  <option value="Price Inquiry">Price Inquiry</option>
                  <option value="Appointment Schedule">Appointment Schedule</option>
                  <option value="Consultation Follow-up">Consultation Follow-up</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Concern</label>
                <textarea 
                  rows={6}
                  required
                  value={dentistForm.concern}
                  onChange={(e) => setDentistForm({...dentistForm, concern: e.target.value})}
                  className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-600 resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-[#1A1514] text-white hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed font-bold text-sm px-10 py-3 rounded-full tracking-wide transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* --- SECTION 2: CONTACT THE DEVELOPER --- */}
        <section className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 tracking-tight">
            Contact the Developer
          </h2>
          
          <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] p-8 md:p-12 max-w-2xl mx-auto">
            <form 
              onSubmit={(e) => handleMessageSubmit(e, 'developer', devForm, setDevForm)}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={devForm.fullName}
                    onChange={(e) => setDevForm({...devForm, fullName: e.target.value})}
                    className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">Email</label>
                  <input 
                    type="email" 
                    required
                    value={devForm.email}
                    onChange={(e) => setDevForm({...devForm, email: e.target.value})}
                    className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Reason</label>
                <select 
                  value={devForm.reason}
                  onChange={(e) => setDevForm({...devForm, reason: e.target.value})}
                  className="w-full border border-slate-400 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-slate-600 text-slate-700 cursor-pointer"
                >
                  <option value="Improvement Suggestion">Improvement Suggestion</option>
                  <option value="Bug Report">Bug Report</option>
                  <option value="Technical Inquiry">Technical Inquiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Concern</label>
                <textarea 
                  rows={6}
                  required
                  value={devForm.concern}
                  onChange={(e) => setDevForm({...devForm, concern: e.target.value})}
                  className="w-full border border-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-600 resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-[#1A1514] text-white hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed font-bold text-sm px-10 py-3 rounded-full tracking-wide transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </section>

      </main>

      {/* --- FOOTER MOUNT --- */}
      <Footer />

    </div>
  );
};

export default ContactPage;