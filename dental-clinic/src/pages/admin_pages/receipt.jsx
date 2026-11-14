import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';
import { toast, Toaster } from 'react-hot-toast';

import clinicLogo from '../../assets/logo_no_bg.png'; 

const AdminReceipts = ({ admin, setAdmin }) => {
  const [appointments, setAppointments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
      toast.error("Could not load receipt data.");
    }
  };

  const paidAppointments = appointments.filter(a => {
    const isPaid = a.paymentStatus === "Paid";
    const matchesSearch = (a.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.referenceCode?.toLowerCase().includes(searchQuery.toLowerCase()));
    return isPaid && matchesSearch;
  });

  // 🔑 UPDATED LOGIC: Consolidate identical services and add Quantity multipliers
  const groupedTransactions = Object.values(paidAppointments.reduce((acc, curr) => {
    const key = `${curr.patientName}_${curr.selectedDate}`;
    
    if (!acc[key]) {
      acc[key] = {
        id: key,
        patientName: curr.patientName,
        selectedDate: curr.selectedDate,
        referenceCode: curr.referenceCode,
        services: [],
        totalAmount: 0
      };
    }

    const serviceName = curr.service;
    const serviceCost = Number(curr.billingAmount) || 0;
    
    // Check if this specific service is already listed for this patient today
    const existingServiceIndex = acc[key].services.findIndex(s => s.name === serviceName);

    if (existingServiceIndex > -1) {
      // If it exists, increase quantity and add to the combined cost
      acc[key].services[existingServiceIndex].quantity += 1;
      acc[key].services[existingServiceIndex].cost += serviceCost;
    } else {
      // If it doesn't exist, add it with a quantity of 1
      acc[key].services.push({ 
        name: serviceName, 
        cost: serviceCost,
        quantity: 1 
      });
    }

    acc[key].totalAmount += serviceCost;
    return acc;
  }, {}));

  const handleDownloadPDF = async () => {
    if (!selectedGroup) return;
    
    setIsGenerating(true);
    toast.loading("Requesting PDF from server...", { id: 'pdf-toast' });

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/appointments/generate-receipt`, {
        patientName: selectedGroup.patientName,
        selectedDate: selectedGroup.selectedDate,
        services: selectedGroup.services,
        totalAmount: selectedGroup.totalAmount,
        referenceCode: selectedGroup.referenceCode
      }, {
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Official_Receipt_${selectedGroup.patientName.replace(/\s+/g, '_')}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove(); 
      
      toast.success("PDF Downloaded Successfully!", { id: 'pdf-toast', style: { border: '1px solid #D4AF37', color: '#0f172a' }});
    } catch (error) {
      console.error("Backend PDF Error:", error);
      toast.error("Failed to fetch PDF from server.", { id: 'pdf-toast' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Toaster position="top-right" />
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 flex flex-col p-8 h-full">
        <header className="mb-6">
          <h1 className="text-3xl font-black text-slate-950">Official Receipts</h1>
          <p className="text-slate-500 font-medium">Generate grouped PDF receipts for completed payments.</p>
        </header>
        
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
          
          <div className="col-span-5 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col min-h-0 shadow-sm">
            <input 
              type="text" 
              placeholder="Search by patient name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl p-4 mb-4 focus:ring-2 focus:ring-[#D4AF37]/50 outline-none transition"
            />
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {groupedTransactions.length > 0 ? groupedTransactions.map(group => (
                <button 
                  key={group.id} 
                  onClick={() => setSelectedGroup(group)}
                  className={`w-full p-4 rounded-xl border transition-all text-left ${selectedGroup?.id === group.id ? 'border-[#D4AF37] bg-amber-50' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-sm text-slate-900">{group.patientName}</div>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Paid</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {group.selectedDate} • {group.services.length} {group.services.length === 1 ? 'Service' : 'Services'}
                  </div>
                </button>
              )) : (
                <div className="text-center mt-10 text-slate-400 italic">No paid transactions found.</div>
              )}
            </div>
          </div>

          <div className="col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 overflow-y-auto min-h-0 shadow-sm relative">
            {selectedGroup ? (
              <div className="w-full max-w-md mx-auto flex flex-col justify-center min-h-full py-4">
                
                <div className="bg-white border-2 border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 relative flex flex-col mb-6 shrink-0">
                  <div className="absolute top-0 left-0 w-full h-2 bg-[#D4AF37] rounded-t-xl"></div>
                  
                  <div className="text-center mb-6 mt-2">
                    <img 
                      src={clinicLogo} 
                      alt="Matienzo Dental Clinic Logo" 
                      className="h-20 mx-auto mb-3 object-contain"
                    />
                    <h2 className="text-xl font-black text-slate-950 uppercase tracking-widest">Matienzo Dental Clinic</h2>
                    <p className="text-[10px] font-bold text-slate-500 mt-2">Matienzo Compound, Sitio 1 Brgy San Juan, Santa Cruz, Laguna</p>
                    <p className="text-[9px] text-slate-400">(In Front of Emilio Jacinto Shrine)</p>
                    <p className="text-[10px] text-slate-500 mt-2">Tel: 0927 926 2535</p>
                    <div className="w-16 h-[1px] bg-slate-200 mx-auto mt-4"></div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Date:</span>
                      <span className="font-bold text-slate-900">{selectedGroup.selectedDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Patient:</span>
                      <span className="font-bold text-slate-900">{selectedGroup.patientName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Ref Code:</span>
                      <span className="font-mono text-xs font-bold text-slate-900">{selectedGroup.referenceCode}</span>
                    </div>
                    
                    <div className="border-t-2 border-dashed border-slate-200 my-4"></div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Operations / Services</p>
                      {/* 🔑 UI UPDATED TO SHOW MULTIPLIER (e.g. "2x Pasta") */}
                      {selectedGroup.services.map((svc, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 font-medium">
                            {svc.quantity > 1 ? <span className="font-bold text-slate-900 mr-1">{svc.quantity}x</span> : ''}
                            {svc.name}
                          </span>
                          <span className="font-bold text-slate-900">₱{svc.cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Grand Total</span>
                      <span className="text-3xl font-black text-[#D4AF37]">₱{selectedGroup.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleDownloadPDF} 
                  disabled={isGenerating}
                  className="w-full bg-slate-950 text-[#D4AF37] font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-xl flex justify-center items-center gap-3 shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {isGenerating ? 'GENERATING PDF...' : 'DOWNLOAD OFFICIAL PDF'}
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium italic">
                Select a completed transaction to generate an official receipt.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReceipts;