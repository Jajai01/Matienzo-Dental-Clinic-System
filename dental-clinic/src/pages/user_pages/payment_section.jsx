import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import ConsoleSidebar from '../sidebar';

const PaymentSection = ({ user, setUser }) => {
  const [searchParams] = useSearchParams();
  const incomingRef = searchParams.get('ref');

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [appointments, setAppointments] = useState([]);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(''); // 'gcash' or 'cash'
  const [gcashRefNumber, setGcashRefNumber] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const fetchBillingHistory = async () => {
    if (!user?.patientId) return;
    
    setIsLoading(true);
    try {
      // 🧠 Fetch the user's specific appointments
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/patient/${user.patientId}`);
      
      if (res.data && res.data.appointments) {
        // Filter out cancelled appointments, keep Confirmed and Completed ones for billing
        const validBills = res.data.appointments.filter(
          apt => apt.status !== 'Cancelled' && apt.status !== 'Pending Review'
        );
        
        // Sort: Unpaid/Verifying first, then Paid
        validBills.sort((a, b) => {
          const statusA = (a.paymentStatus || 'Unpaid').toLowerCase();
          const statusB = (b.paymentStatus || 'Unpaid').toLowerCase();
          if (statusA === 'paid' && statusB !== 'paid') return 1;
          if (statusA !== 'paid' && statusB === 'paid') return -1;
          return new Date(b.appointmentDate) - new Date(a.appointmentDate);
        });

        setAppointments(validBills);

        // Auto-select logic for the active invoice
        if (incomingRef) {
          const target = validBills.find(inv => inv._id === incomingRef);
          if (target) setActiveInvoice(target);
        } else {
          // Find the first one that needs attention (Unpaid or Verifying)
          const needsAttention = validBills.find(inv => 
            (inv.paymentStatus || 'Unpaid') !== 'Paid'
          );
          setActiveInvoice(needsAttention || null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch billing data", error);
      toast.error("Unable to load billing history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, [user, incomingRef]);

  // Reset form when changing active invoice
  useEffect(() => {
    setPaymentMethod('');
    setGcashRefNumber('');
  }, [activeInvoice]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 🧠 Update the appointment payment details in the backend
      await axios.put(`${import.meta.env.VITE_API_URL}/api/appointments/${activeInvoice._id}/payment-intent`, {
        paymentMethod: paymentMethod === 'gcash' ? 'GCash' : 'Cash',
        paymentReference: paymentMethod === 'gcash' ? gcashRefNumber : 'Pay at Counter',
        paymentStatus: 'Verifying' // Changes status so admin knows to check it
      });

      toast.success("Payment details submitted for verification!", {
        style: { border: '1px solid #D4AF37', color: '#0f172a' },
      });
      
      // Refresh the data to show the new "Verifying" status
      fetchBillingHistory();
      
    } catch (error) {
      toast.error("Failed to submit payment details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // UI HELPERS
  // ==========================================
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'TBD';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Unpaid').toLowerCase();
    if (s === 'paid') return 'bg-emerald-100/80 text-emerald-700 border-emerald-200/50';
    if (s === 'unpaid') return 'bg-rose-100/80 text-rose-700 border-rose-200/50';
    if (s === 'verifying') return 'bg-amber-100/80 text-amber-700 border-amber-200/50';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  // Safe getter for payment status
  const currentStatus = (activeInvoice?.paymentStatus || 'Unpaid').toLowerCase();

  return (
    <div className="flex w-full min-h-screen bg-[#fbfbfd] text-slate-900 antialiased font-sans selection:bg-[#D4AF37] selection:text-white">
      <Toaster position="top-right" />
      
      <ConsoleSidebar user={user} setUser={setUser} />

      <main className="flex-1 pl-64 min-h-screen flex flex-col relative overflow-hidden">
        {/* Soft background glow for Apple-like aesthetic */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl w-full mx-auto p-8 md:p-12 space-y-10 flex-1 relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-950 tracking-tight">Billing & Payments</h1>
              <p className="text-sm text-slate-500 mt-2 font-medium max-w-lg leading-relaxed">
                Manage your outstanding clinic balances, submit GCash transaction codes securely, and review your official receipts.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#D4AF37] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* ========================================== */}
              {/* LEFT COLUMN (7/12): ACTIVE PAYMENT PORTAL  */}
              {/* ========================================== */}
              <div className="lg:col-span-7 space-y-6">
                
                {activeInvoice ? (
                  <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all duration-500 relative overflow-hidden">
                    
                    {/* Status Ribbon */}
                    {currentStatus === 'paid' && (
                      <div className="absolute top-0 left-0 w-full h-2 bg-emerald-400"></div>
                    )}
                    {currentStatus === 'verifying' && (
                      <div className="absolute top-0 left-0 w-full h-2 bg-amber-400"></div>
                    )}
                    
                    <div className="flex items-start justify-between mb-8 pb-8 border-b border-slate-100/80">
                      <div>
                        <h2 className="text-2xl font-black text-slate-950 tracking-tight">Invoice Details</h2>
                        <p className="text-[11px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest font-mono">Ref: {activeInvoice._id.substring(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Due</span>
                        <span className="text-3xl font-black text-slate-950 tracking-tight">
                          {formatCurrency(activeInvoice.billingAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-10">
                      <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Procedure</span>
                        <p className="text-sm font-bold text-slate-800">{activeInvoice.service}</p>
                      </div>
                      <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date</span>
                        <p className="text-sm font-bold text-slate-800">{new Date(activeInvoice.appointmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>

                    {/* DYNAMIC PAYMENT UI BASED ON STATUS */}
                    {currentStatus === 'unpaid' && (
                      <div className="space-y-6 animate-fade-in">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Select Payment Method</h3>
                        <div className="grid grid-cols-2 gap-4">
                          
                          <button 
                            type="button"
                            onClick={() => setPaymentMethod('gcash')}
                            className={`flex flex-col items-center justify-center p-5 border-2 rounded-2xl transition-all duration-300 active:scale-[0.98] ${
                              paymentMethod === 'gcash' 
                                ? 'border-blue-500 bg-blue-50/30 shadow-md ring-4 ring-blue-500/10' 
                                : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-3xl mb-3">📱</span>
                            <span className={`text-sm font-bold ${paymentMethod === 'gcash' ? 'text-blue-700' : 'text-slate-600'}`}>GCash</span>
                          </button>

                          <button 
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex flex-col items-center justify-center p-5 border-2 rounded-2xl transition-all duration-300 active:scale-[0.98] ${
                              paymentMethod === 'cash' 
                                ? 'border-emerald-500 bg-emerald-50/30 shadow-md ring-4 ring-emerald-500/10' 
                                : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-3xl mb-3">💵</span>
                            <span className={`text-sm font-bold ${paymentMethod === 'cash' ? 'text-emerald-700' : 'text-slate-600'}`}>Pay in Cash</span>
                          </button>

                        </div>

                        {/* GCash Inputs */}
                        {paymentMethod === 'gcash' && (
                          <div className="mt-8 pt-8 border-t border-slate-100 animate-fade-in">
                            <div className="flex flex-col sm:flex-row gap-8 items-start">
                              <div className="w-32 h-32 bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest px-2">Clinic GCash<br/>QR Code Here</span>
                              </div>
                              <div className="flex-1 w-full space-y-5">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">Scan to Pay via GCash</p>
                                  <p className="text-[13px] text-slate-500 font-medium mt-1.5 leading-relaxed">Please transfer the exact amount and enter the 13-digit reference number below for verification.</p>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">GCash Reference No.</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. 1002938475612"
                                    value={gcashRefNumber}
                                    onChange={(e) => setGcashRefNumber(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cash Info */}
                        {paymentMethod === 'cash' && (
                          <div className="mt-8 pt-8 border-t border-slate-100 animate-fade-in">
                            <div className="bg-slate-950 rounded-2xl p-6 flex items-start gap-4 shadow-lg shadow-slate-900/10">
                              <span className="text-[#D4AF37] text-xl">ℹ️</span>
                              <p className="text-[13px] text-slate-300 font-medium leading-relaxed">
                                You have selected <strong className="text-white">Cash Payment</strong>. Please proceed to the clinic's reception desk to settle this balance. Your invoice status will update automatically once the admin receives your payment.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4">
                          <button 
                            onClick={handlePaymentSubmit}
                            disabled={!paymentMethod || (paymentMethod === 'gcash' && gcashRefNumber.length < 8) || isSubmitting}
                            className="w-full bg-[#D4AF37] text-slate-950 hover:bg-[#c4a130] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed py-4 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-300 active:scale-[0.99] shadow-lg shadow-[#D4AF37]/20 disabled:shadow-none"
                          >
                            {isSubmitting ? 'Processing...' : paymentMethod === 'gcash' ? 'Submit for Verification' : 'Confirm Cash Intention'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* LOCK SCREEN: VERIFYING STATE */}
                    {currentStatus === 'verifying' && (
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8 text-center animate-fade-in mt-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-amber-500 text-2xl mx-auto mb-4 shadow-sm">
                          ⏳
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Verification in Progress</h3>
                        <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                          Your payment details have been submitted. The clinic admin is currently verifying your transaction. This page will update once settled.
                        </p>
                        {activeInvoice.paymentMethod === 'GCash' && (
                          <p className="text-[11px] font-bold text-amber-700/80 mt-4 uppercase tracking-widest font-mono">
                            Ref: {activeInvoice.paymentReference}
                          </p>
                        )}
                      </div>
                    )}

                    {/* LOCK SCREEN: PAID STATE */}
                    {currentStatus === 'paid' && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center animate-fade-in mt-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-500 text-2xl mx-auto mb-4 shadow-sm">
                          ✓
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Payment Settled</h3>
                        <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                          This invoice has been successfully paid via {activeInvoice.paymentMethod || 'the clinic'}. Thank you!
                        </p>
                      </div>
                    )}

                  </div>
                ) : (
                  /* EMPTY STATE */
                  <div className="bg-white rounded-3xl p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center flex flex-col items-center justify-center min-h-[500px]">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-4xl mb-6">
                      ✨
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">You're all caught up!</h2>
                    <p className="text-sm text-slate-500 font-medium max-w-sm leading-relaxed">
                      You have no outstanding balances. Any new invoices generated after your future treatments will securely appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* ========================================== */}
              {/* RIGHT COLUMN (5/12): FINANCIAL LEDGER      */}
              {/* ========================================== */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col max-h-[700px]">
                  <div className="mb-6 flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Billing Ledger</h3>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">
                      {appointments.length} Records
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
                    {appointments.length > 0 ? appointments.map((inv) => {
                      const isSelected = activeInvoice?._id === inv._id;
                      const invStatus = (inv.paymentStatus || 'Unpaid').toLowerCase();
                      
                      return (
                        <div 
                          key={inv._id} 
                          onClick={() => setActiveInvoice(inv)}
                          className={`border p-5 rounded-2xl transition-all duration-300 cursor-pointer ${
                            isSelected 
                              ? 'border-[#D4AF37] bg-yellow-50/30 shadow-[0_4px_20px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/50' 
                              : invStatus === 'paid'
                                ? 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 opacity-70 hover:opacity-100'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${isSelected ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
                              {inv._id.substring(0, 8)}
                            </span>
                            <span className={`border px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadge(inv.paymentStatus)}`}>
                              {inv.paymentStatus || 'Unpaid'}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="pr-4">
                              <h4 className="text-sm font-bold text-slate-900 leading-tight">{inv.service}</h4>
                              <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                                {new Date(inv.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <span className={`text-base font-black tracking-tight shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-slate-900'}`}>
                              {formatCurrency(inv.billingAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-10">
                        <p className="text-sm text-slate-400 font-medium italic">No billing history found.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Apple-style Info Card */}
                <div className="bg-slate-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                  {/* Soft background glow */}
                  <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#D4AF37]/20 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                    <span>🏥</span> HMO & Insurance
                  </h3>
                  <p className="text-[13px] text-slate-300 font-medium leading-relaxed relative z-10 opacity-90">
                    Covered by corporate dental insurance? Please present your physical or digital card at the reception desk before treatment. We will update your ledger automatically once coverage is verified.
                  </p>
                </div>

              </div>

            </div>
          )}
        </div>
      </main>

    </div>
  );
};

export default PaymentSection;