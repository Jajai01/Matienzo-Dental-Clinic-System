import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConsoleSidebar from '../sidebar';
import axios from 'axios';

const ListAppointments = ({ user, setUser }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All'); 

  // 1. 🧠 FETCH DATA ON PAGE LOAD
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const patientId = user?.patientId || user?._id;
        if (!patientId) {
          setIsLoading(false);
          return;
        }

        // Hitting the exact same endpoint we created in the appointmentController
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/patient/${patientId}`);
        setAppointments(response.data.appointments);
        
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  // --- Visual Helper Functions ---
  const getAdminStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending Review': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPaymentBadge = (status) => {
    if (status === 'Paid') return 'bg-emerald-100 text-emerald-800';
    if (status === 'Unpaid') return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-500';
  };

  // Apply quick filters
  const filteredAppointments = appointments.filter(appt => {
    if (filter === 'All') return true;
    if (filter === 'Unpaid') return appt.paymentStatus === 'Unpaid' && appt.status !== 'Cancelled';
    return appt.status === filter;
  });

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      
      {/* Permanent Fixed Left Sidebar */}
      <ConsoleSidebar user={user} setUser={setUser} />

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <div className="max-w-6xl w-full mx-auto p-8 md:p-10 space-y-8 flex-1">
          
          {/* Header Row */}
          <div className="border-b border-slate-200 pb-6 text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                My Appointments
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Track your requested schedules and review administrative confirmations.
              </p>
            </div>
            
            {/* Quick Action Book Button */}
            <Link 
              to={`/user/appointment/${user?.patientId || user?._id}`}
              className="bg-slate-950 hover:bg-slate-800 text-[#D4AF37] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm shrink-0 text-center"
            >
              + New Appointment
            </Link>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Confirmed', 'Completed', 'Unpaid'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  filter === f 
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* MAIN DATA TABLE WRAPPER */}
          <div className="bg-white border-2 border-slate-200/80 rounded-3xl shadow-sm overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                
                {/* Table Header */}
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4">Ref ID</th>
                    <th className="px-6 py-4">Treatment & Schedule</th>
                    <th className="px-6 py-4">Admin Status</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4 text-right">Details</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 text-sm">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                        <span className="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin inline-block mb-2"></span>
                        <br />
                        Loading ledger...
                      </td>
                    </tr>
                  ) : filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appt) => (
                      <tr key={appt._id} className="hover:bg-slate-50/50 transition-colors">
                        
                        {/* 1. Reference ID */}
                        <td className="px-6 py-5 font-mono text-xs font-semibold text-slate-400">
                          {appt.referenceCode}
                        </td>

                        {/* 2. Treatment & Schedule Block */}
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{appt.service}</span>
                            <span className="text-xs text-slate-500 font-medium mt-0.5">
                              {appt.selectedDate} {appt.selectedTimeSlot}
                            </span>
                          </div>
                        </td>

                        {/* 3. Admin Confirmation Status */}
                        <td className="px-6 py-5">
                          <span className={`border rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${getAdminStatusBadge(appt.status)}`}>
                            {appt.status}
                          </span>
                        </td>

                        {/* 4. Financial Status */}
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getPaymentBadge(appt.paymentStatus)}`}>
                            {appt.paymentStatus}
                          </span>
                        </td>

                        {/* 5. Cleaned Details Column (Settle Bill removed) */}
                        <td className="px-6 py-5 text-right">
                          <span className="text-xs text-slate-400 font-medium italic">
                            Logged in system
                          </span>
                        </td>

                      </tr>
                    ))
                  ) : (
                    /* Empty State Fallback */
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                        No appointments found matching this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination Spacer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Showing {filteredAppointments.length} records</span>
              <span className="text-slate-400">Matienzo Dental Secure Ledger</span>
            </div>
            
          </div>

        </div>
      </main>

    </div>
  );
};

export default ListAppointments;