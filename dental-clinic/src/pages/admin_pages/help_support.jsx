import React, { useState } from 'react';
import AdminSidebar from '../adminsidebar';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
const AdminSupport = ({ admin, setAdmin }) => {
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [ticketData, setTicketData] = useState({
    subject: '',
    urgency: 'Normal',
    message: ''
  });

  // 🔑 EXPANDED KNOWLEDGE BASE: Deep systemic logic tailored to the clinic
  const faqs = [
    {
      question: "How do I mark an appointment as Paid?",
      answer: "Navigate to the 'Billing & Invoices' tab. Search for the patient's name, input the final service amount in the right-hand panel, click 'Save Billing Amount', and then click the green 'MARK AS PAID' button. This updates the master financial ledger."
    },
    {
      question: "Do I need to manually update a patient's Medical Record after a visit?",
      answer: "No. The system utilizes automated data pushing. The moment you change an appointment's status to 'Completed' in the main queue, the system automatically extracts the service details and injects them into the patient's permanent Medical Record history."
    },
    {
      question: "How do I notify all patients about a sudden clinic closure or holiday?",
      answer: "Use the 'Global Clinic Broadcasts' section on the main Admin Dashboard. Click '+ Post Announcement'. Any message you publish here is immediately pinned to the top of every logged-in patient's personal dashboard."
    },
    {
      question: "What happens when I cancel a patient's appointment?",
      answer: "The appointment status is permanently changed to 'Cancelled' and that specific 30-minute time slot is instantly unlocked in the database, allowing other patients to book it online. The billing status will remain 'Unpaid'."
    },
    {
      question: "How do I handle an emergency walk-in patient?",
      answer: "Use the 'Walk-in Appointment' portal. This specialized form bypasses the standard 'Pending Review' queue and instantly inserts the patient into the active daily timeline, ensuring their clinical records are tracked immediately."
    },
    {
      question: "Why was I logged out of the Admin Console automatically?",
      answer: "For Data Privacy Act compliance, the Admin Console utilizes a strict 2-hour inactivity token. If the system detects no network requests for 120 minutes, your session is securely destroyed to protect patient medical profiles. You must re-authenticate."
    },
    {
      question: "Can I reprint an Official PDF Receipt for an old transaction?",
      answer: "Yes. Navigate to the 'Make Receipt' tab. The system dynamically renders the A5 PDF document using the clinic's official letterhead. Simply input the past reference code and services, and the system will generate a fresh, downloadable file."
    },
    {
      question: "How often does the Statistics & Analytics engine update?",
      answer: "The engine runs in real-time. The moment you approve an appointment, mark an invoice as paid, or post a new expense, the underlying MongoDB aggregation pipelines instantly recalculate the quarterly growth charts and revenue trajectories."
    },
    {
      question: "Where can I download the raw database for external research?",
      answer: "Go to 'Settings' > 'Data & Research'. You can select specific collections (Appointments, Records, Financials) and export them as a CSV or JSON file. Ensure the 'Anonymize Patient PII' toggle is active to safely hash names and IDs before exporting."
    },
    {
      question: "How do I update the clinic's operating hours and contact info?",
      answer: "Go to 'Settings' > 'Clinic Parameters'. Updating the opening time, closing time, or official phone number here will automatically update the patient-facing booking portal and the letterheads of future PDF receipts."
    }
  ];

  // Robust search filter matching both question and answer text
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTicketChange = (e) => {
    setTicketData({ ...ticketData, [e.target.name]: e.target.value });
  };

 const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 🔑 Send the ticket data to your new Express route
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings/support-ticket`, {
        subject: ticketData.subject,
        urgency: ticketData.urgency,
        message: ticketData.message,
        // Send the logged-in admin's name so you know who is asking for help
        adminName: admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}` : 'System Admin'
      });

      toast.success("Support ticket sent directly to Developer (Lucille)!", {
        style: { border: '1px solid #10b981', color: '#0f172a' },
      });
      
      // Clear the form on success
      setTicketData({ subject: '', urgency: 'Normal', message: '' });
      
    } catch (error) {
      console.error("Failed to send ticket:", error);
      toast.error("Failed to dispatch ticket. Please check your network.", {
        style: { border: '1px solid #ef4444', color: '#0f172a' },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" />
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          
          <header className="mb-8 pb-6 border-b border-slate-200 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-950">Help & IT Support</h1>
              <p className="text-slate-500 font-medium mt-1">Access operational guidelines or contact technical support.</p>
            </div>
            
            {/* Live System Status Indicator */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Status</span>
                <span className="text-xs font-bold text-emerald-600">All Systems Operational</span>
              </div>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
          </header>

          <div className="flex flex-col md:flex-row gap-8">
            
            {/* LEFT: Navigation Tabs */}
            <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
              <button 
                onClick={() => setActiveTab('faq')}
                className={`text-left px-5 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-between ${
                  activeTab === 'faq' 
                    ? 'bg-slate-950 text-[#D4AF37] shadow-lg shadow-slate-900/20' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                Documentation & FAQs
                {activeTab === 'faq' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>}
              </button>
              
              <button 
                onClick={() => setActiveTab('ticket')}
                className={`text-left px-5 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-between ${
                  activeTab === 'ticket' 
                    ? 'bg-slate-950 text-[#D4AF37] shadow-lg shadow-slate-900/20' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                Contact IT Helpdesk
                {activeTab === 'ticket' && <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>}
              </button>
            </div>

            {/* RIGHT: Content Area */}
            <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-12 min-h-[500px]">
              
              {/* --- FAQ SECTION --- */}
              {activeTab === 'faq' && (
                <div className="animate-fade-in space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Knowledge Base</h2>
                    <p className="text-sm text-slate-500 mt-1">Search for quick answers regarding clinic operations.</p>
                  </div>

                  <input 
                    type="text" 
                    placeholder="Search by keyword (e.g., 'Receipt', 'Cancel', 'Walk-in')..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#D4AF37] transition font-medium"
                  />

                  <div className="space-y-4 mt-6 h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => (
                      <div key={index} className="border border-slate-100 bg-slate-50 p-5 rounded-2xl hover:border-slate-300 transition-colors">
                        <h3 className="text-sm font-bold text-slate-900 mb-2">{faq.question}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )) : (
                      <div className="text-center py-10 text-slate-400 font-medium italic">
                        No articles found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- SUPPORT TICKET SECTION --- */}
              {activeTab === 'ticket' && (
                <div className="animate-fade-in space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Submit a Support Ticket</h2>
                    <p className="text-sm text-slate-500 mt-1">Report a system bug, database error, or request a feature modification.</p>
                  </div>

                  <form onSubmit={handleSubmitTicket} className="space-y-5 mt-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Issue Subject</label>
                        <input 
                          type="text" 
                          name="subject"
                          required
                          value={ticketData.subject}
                          onChange={handleTicketChange}
                          placeholder="e.g., Cannot generate PDF receipt"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#D4AF37] transition text-sm font-medium" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Urgency Level</label>
                        <select 
                          name="urgency"
                          value={ticketData.urgency}
                          onChange={handleTicketChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#D4AF37] transition text-sm font-bold cursor-pointer"
                        >
                          <option value="Low">Low - Minor bug, workflow uninterrupted</option>
                          <option value="Normal">Normal - Standard IT request</option>
                          <option value="High">High - Workflow heavily impacted</option>
                          <option value="Critical">Critical - System down or data loss</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detailed Description</label>
                      <textarea 
                        name="message"
                        required
                        rows="6"
                        value={ticketData.message}
                        onChange={handleTicketChange}
                        placeholder="Please describe exactly what happened and the steps to reproduce the issue..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-[#D4AF37] transition resize-none text-sm leading-relaxed"
                      ></textarea>
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="px-8 py-3.5 bg-slate-950 text-[#D4AF37] font-bold rounded-xl hover:bg-black transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto"
                      >
                        {isSubmitting ? 'Transmitting to IT...' : 'Submit Support Ticket'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSupport;