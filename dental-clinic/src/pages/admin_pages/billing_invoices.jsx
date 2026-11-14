import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';
import { toast, Toaster } from 'react-hot-toast';

const BillingInvoices = ({ admin, setAdmin }) => {
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Math & Billing States
  const [billingAmount, setBillingAmount] = useState('');
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' or 'percent'
  const [discountValue, setDiscountValue] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/appointments`);
      if (res.data && res.data.appointments) {
        setAppointments(res.data.appointments);
      }
    } catch (error) {
      console.error("Failed to fetch billing records:", error);
      toast.error("Could not load billing records.");
    }
  };

  // Format Helper
  const formatCurrency = (amount) => {
    if (isNaN(amount) || amount === null) return '₱0.00';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  // 🧠 AUTOMATIC DISCOUNT CALCULATOR
  const basePrice = parseFloat(billingAmount) || 0;
  const rawDiscount = parseFloat(discountValue) || 0;
  
  let calculatedDiscountInPesos = 0;
  if (discountType === 'percent') {
    calculatedDiscountInPesos = basePrice * (rawDiscount / 100);
  } else {
    calculatedDiscountInPesos = rawDiscount;
  }

  // Prevent negative totals if they accidentally discount more than the price
  const finalTotal = Math.max(0, basePrice - calculatedDiscountInPesos);

  // 1. SAVE BASE AMOUNT ONLY (Draft state)
  const handleSaveAmount = async () => {
    if (!selectedTransaction || basePrice <= 0) return;
    setIsSaving(true);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/appointments/${selectedTransaction._id}/billing`, {
        billingAmount: basePrice
      });
      
      setAppointments(appointments.map(a => 
        a._id === selectedTransaction._id ? { ...a, billingAmount: basePrice } : a
      ));
      
      setSelectedTransaction({ ...selectedTransaction, billingAmount: basePrice });
      
      toast.success("Base billing amount saved.");
    } catch (error) {
      toast.error("Failed to save billing data");
    } finally {
      setIsSaving(false);
    }
  };

  // 2. MARK AS PAID (Finalize with discounts and references)
  const handleMarkPaid = async () => {
    if (basePrice <= 0) {
      toast.error("Base price must be saved before processing payment.");
      return;
    }

    setIsPaying(true);
    try {
      const payload = {
        paymentStatus: 'Paid',
        billingAmount: basePrice,
        discountApplied: calculatedDiscountInPesos,
        finalAmountPaid: finalTotal,
        paymentReference: paymentReference || 'CASH-OTC',
        paymentDate: new Date()
      };

      await axios.patch(`${import.meta.env.VITE_API_URL}/${selectedTransaction._id}/pay`, payload);
      
      fetchAppointments();
      setSelectedTransaction(null);
      setBillingAmount('');
      setDiscountValue('');
      setPaymentReference('');
      
      toast.success("Payment verified and receipt generated!");
    } catch (error) {
      console.error("Payment Error:", error); 
      toast.error("Error updating status");
    } finally {
      setIsPaying(false);
    }
  };

  // 🔑 FILTER LOGIC: Strict matching
  const filtered = appointments.filter(a => {
    const status = (a.status || "").trim().toLowerCase();
    const isReady = status === "confirmed" || status === "completed";
    
    const paymentStatus = (a.paymentStatus || "").trim().toLowerCase();
    const isUnpaid = paymentStatus !== "paid";
    
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch = search === "" || 
      (a.patientName || "").toLowerCase().includes(search) || 
      (a.referenceCode || "").toLowerCase().includes(search);
      
    return isReady && isUnpaid && matchesSearch;
  });

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Toaster position="top-right" />
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 flex flex-col p-8 h-full">
        <header className="mb-6">
          <h1 className="text-3xl font-black text-slate-950">Billing & Point of Sale</h1>
          <p className="text-slate-500 font-medium">Manage pending payments, apply discounts, and record Cash/GCash.</p>
        </header>
        
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
          
          {/* LEFT: Searchable List */}
          <div className="col-span-5 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col min-h-0 shadow-sm">
            <input 
              type="text" 
              placeholder="Search by name or reference..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4 focus:ring-2 focus:ring-[#D4AF37]/50 outline-none transition"
            />
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {filtered.length > 0 ? filtered.map(t => (
                <button 
                  key={t._id} 
                  onClick={() => { 
                    setSelectedTransaction(t); 
                    setBillingAmount(t.billingAmount || ''); 
                    setDiscountType('fixed');
                    setDiscountValue('');
                    setPaymentReference('');
                  }}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${selectedTransaction?._id === t._id ? 'border-slate-800 bg-slate-50 shadow-sm' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <div className="font-bold text-sm text-slate-900">{t.patientName}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{t.referenceCode} • {t.service}</div>
                </button>
              )) : (
                <div className="text-center mt-10 text-slate-400 italic font-medium">No unpaid invoices found.</div>
              )}
            </div>
          </div>

          {/* RIGHT: Billing Details & Discount Math */}
          <div className="col-span-7 bg-white border border-slate-200 rounded-3xl p-8 flex flex-col min-h-0 overflow-y-auto custom-scrollbar shadow-sm">
            {selectedTransaction ? (
              <div className="max-w-md mx-auto w-full space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight">{selectedTransaction.patientName}</h2>
                  <p className="text-slate-500 text-xs font-medium mt-1">{selectedTransaction.service} • {selectedTransaction.selectedDate}</p>
                </div>
                
                {/* Base Price Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Base Service Amount (PHP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 font-bold text-slate-400 text-lg">₱</span>
                    <input 
                      type="number" min="0" step="any"
                      value={billingAmount}
                      onChange={(e) => setBillingAmount(e.target.value)}
                      className="w-full text-xl font-black bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-[#D4AF37] transition"
                    />
                  </div>
                </div>

                {/* Discount Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Discount Type</label>
                    <select 
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="fixed">Fixed (₱)</option>
                      <option value="percent">Percent (%)</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Value</label>
                    <input 
                      type="number" min="0" step="any"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:border-[#D4AF37] focus:outline-none"
                      placeholder={discountType === 'percent' ? "e.g., 10 for 10%" : "e.g., 200 for ₱200 off"}
                    />
                  </div>
                </div>

                {/* Payment Reference Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">GCash / Receipt Reference</label>
                  <input 
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Ref No. (Leave blank if Cash)"
                  />
                </div>

                {/* Total Calculation Display */}
                <div className="bg-slate-950 rounded-2xl p-6 space-y-3 mt-4">
                  <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <span>Subtotal</span>
                    <span>{formatCurrency(basePrice)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-4">
                    <span>Discount {discountType === 'percent' && rawDiscount > 0 ? `(${rawDiscount}%)` : ''}</span>
                    <span>- {formatCurrency(calculatedDiscountInPesos)}</span>
                  </div>
                  <div className="flex justify-between text-white text-xl font-black pt-2">
                    <span>Total Due</span>
                    <span className="text-[#D4AF37]">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    onClick={handleSaveAmount} 
                    disabled={isSaving}
                    className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all text-xs uppercase tracking-wider"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft Base Amount'}
                  </button>
                  
                  {selectedTransaction.billingAmount && (
                    <button 
                      onClick={handleMarkPaid} 
                      disabled={isPaying}
                      className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg text-sm uppercase tracking-widest"
                    >
                      {isPaying ? 'Processing...' : 'CONFIRM PAYMENT & FINALIZE'}
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center text-slate-400 font-medium italic m-auto">
                <span className="text-4xl block mb-3">🧾</span>
                Select a transaction from the list to process payment.
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default BillingInvoices;