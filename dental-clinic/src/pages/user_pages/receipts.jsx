import React, { useState, useEffect } from 'react';
import ConsoleSidebar from '../sidebar';
import axios from 'axios';

const Receipts = ({ user, setUser }) => {
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🧠 FETCH DATA ON PAGE LOAD
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const patientId = user?.patientId || user?._id;
        if (!patientId) return;

        // We use the exact same endpoint as the Appointments page!
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/patient/${patientId}`);
        
        // Filter out cancelled appointments, as they won't have receipts
        const activeRecords = response.data.appointments.filter(app => app.status !== 'Cancelled');
        
        setReceipts(activeRecords);
      } catch (error) {
        console.error("Error fetching receipts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipts();
  }, [user]);

  // Format numbers to Philippine Peso (PHP)
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '---';
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP' 
    }).format(amount);
  };

  const getPaymentBadgeStyle = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Unpaid': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans relative">
      
      <ConsoleSidebar user={user} setUser={setUser} />

      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <div className="max-w-6xl w-full mx-auto p-8 md:p-10 space-y-8 flex-1">
          
          {/* HEADER */}
          <div className="border-b border-slate-200 pb-6 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Billing & Receipts
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              View your transaction history, applied discounts, and official payment records for Cash and GCash.
            </p>
          </div>

          {/* MAIN DATATABLE */}
          <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm text-left">
            <div className="mb-5 flex justify-between items-end">
              <div>
                <h2 className="text-lg font-bold text-slate-950 tracking-tight">Transaction Ledger</h2>
                <div className="h-0.5 w-10 bg-[#D4AF37] mt-1.5 rounded"></div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Reference / Date</th>
                    <th className="px-6 py-3.5">Treatment</th>
                    <th className="px-6 py-3.5 text-right">Base Price</th>
                    <th className="px-6 py-3.5 text-right">Discount</th>
                    <th className="px-6 py-3.5 text-right font-black text-slate-800">Final Amount</th>
                    <th className="px-6 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                        <span className="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                        <p>Loading financial records...</p>
                      </td>
                    </tr>
                  ) : receipts.length > 0 ? (
                    receipts.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-slate-400 font-bold">{row.referenceCode}</div>
                          <div className="text-slate-950 font-semibold mt-0.5">{row.selectedDate}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="block text-slate-800 font-bold">{row.service}</span>
                          {row.paymentReference && (
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                              Ref: {row.paymentReference}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500">
                          {formatCurrency(row.billingAmount)}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                          {row.discountApplied > 0 ? `-${formatCurrency(row.discountApplied)}` : '---'}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">
                          {formatCurrency(row.finalAmountPaid)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide inline-block ${getPaymentBadgeStyle(row.paymentStatus)}`}>
                            {row.paymentStatus || 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                        <span className="block text-2xl mb-2">🧾</span>
                        No billing records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                <strong className="text-slate-700">Payment Reminder:</strong> The clinic only accepts Cash, GCash and Bank Transfer payments over the counter. If an appointment is marked as "Unpaid," the total amount will be settled at the clinic after your procedure.
              </p>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Receipts;