import React, { useState, useEffect } from 'react';
import ConsoleSidebar from '../sidebar';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast'; 

const Appointment = ({ user, setUser }) => {
  // --- Form Local States ---
  const [service, setService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // --- Modal State for Cancellation ---
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  // --- Database States ---
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 📅 NEW: Blocked Dates State
  const [blockedDates, setBlockedDates] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  // 1. 🧠 FETCH DATA ON PAGE LOAD
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const patientId = user?.patientId || user?._id;
        if (!patientId) return;

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/patient/${patientId}`);
        const allAppointments = response.data.appointments;

        // Find the most recent active appointment for the banner
        const active = allAppointments.find(
          app => ['Pending Review', 'Confirmed', 'Rescheduled'].includes(app.status)
        );

        setActiveAppointment(active || null);
        setAppointmentHistory(allAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // 📅 NEW: Fetch blocked dates from the backend
    const fetchBlockedDates = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/blocked-dates`);
        if (res.data.success) {
          // Store just the array of date strings for easy checking
          setBlockedDates(res.data.blockedDates.map(d => d.date));
        }
      } catch (error) {
        console.error("Error fetching blocked dates:", error);
      }
    };

    fetchAppointments();
    fetchBlockedDates();
  }, [user]);

  // 2. 🧠 SUBMIT NEW APPOINTMENT
  const submitAppointmentForm = async (e) => {
    e.preventDefault(); 

    if (!selectedTimeSlot) {
      toast.error("Please select an available 30-minute time slot.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        patientId: user?.patientId || user?._id,
        patientName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Unregistered Patient',
        patientEmail: user?.email, 
        dentist: 'Dra. Anne-Dumas Matienzo',
        service: service,
        selectedDate: selectedDate,
        selectedTimeSlot: selectedTimeSlot,
        notes: notes
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/appointments`, payload);

      if (response.status === 201 || response.status === 200) {
        toast.success("Appointment requested successfully! The admin will review it shortly."); 
        
        const newAppt = response.data.appointment;
        
        setActiveAppointment(newAppt); 
        setAppointmentHistory([newAppt, ...appointmentHistory]); 

        setService('');
        setSelectedDate('');
        setSelectedTimeSlot('');
        setNotes('');
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error(error.response?.data?.message || "Failed to book appointment. Please try again."); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. 🧠 HANDLE CANCELLATION REQUEST EXECUTION
  const handleConfirmCancellation = async () => {
    if (!appointmentToCancel) return;

    setIsCancelling(true);
    try {
      const payload = {
        patientEmail: user?.email 
      };

      const response = await axios.patch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentToCancel._id}/cancel`, payload);

      if (response.status === 200) {
        toast.success("Appointment cancelled successfully.");
        
        // Update local UI states immediately
        setActiveAppointment(null);
        setAppointmentHistory(prev => 
          prev.map(app => app._id === appointmentToCancel._id ? { ...app, status: 'Cancelled' } : app)
        );
        setIsCancelModalOpen(false);
        setAppointmentToCancel(null);
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.response?.data?.message || "Failed to cancel appointment.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper to check if a specific time slot has already passed today
  const isTimeSlotPassed = (slotTimeStr) => {
    if (selectedDate !== today) return false;

    const [time, modifier] = slotTimeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    
    if (hours === 12 && modifier === 'AM') hours = 0;
    if (modifier === 'PM' && hours < 12) hours += 12;

    const slotTime = new Date();
    slotTime.setHours(hours, parseInt(minutes, 10), 0, 0);
    const now = new Date();

    return slotTime < now; 
  };

  // 30-Minute Dynamic Time Slot Matrix
  const availableSlots = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', 
    '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', 
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', 
    '03:00 PM', '03:30 PM'
  ];

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending Review': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rescheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'Completed': return 'bg-slate-100 text-slate-700 border-slate-300';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans relative">
      
      <Toaster position="top-right" /> 

      <ConsoleSidebar user={user} setUser={setUser} />

      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <div className="max-w-6xl w-full mx-auto p-8 md:p-10 space-y-8 flex-1">
          
          <div className="border-b border-slate-200 pb-6 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Appointment Management
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Schedule your next dental treatment or keep track of your clinical historical visit sequence.
            </p>
          </div>

          {/* 1. ACTIVE LIVE APPOINTMENT NOTIFICATION COMPONENT */}
          {isLoading ? (
            <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center justify-center min-h-25">
              <span className="w-5 h-5 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : activeAppointment ? (
            <div className="bg-white border-2 border-slate-200/80 rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fadeIn">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Reservation</span>
                  <span className={`text-[11px] font-extrabold border rounded-full px-3 py-0.5 uppercase tracking-wide ${getStatusBadgeStyle(activeAppointment.status)}`}>
                    {activeAppointment.status}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950 tracking-tight">
                    {activeAppointment.service}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>📅 <strong>{activeAppointment.selectedDate}</strong> at <strong>{activeAppointment.selectedTimeSlot}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>👩‍⚕️ {activeAppointment.dentist}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => {
                    setAppointmentToCancel(activeAppointment);
                    setIsCancelModalOpen(true);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Request Cancellation
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50/50 border-2 border-blue-100 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-2xl mb-2">📅</span>
              <h3 className="text-sm font-bold text-blue-900">No Active Appointments</h3>
              <p className="text-xs text-blue-700/80 font-medium mt-1">Use the form below to request a new schedule.</p>
            </div>
          )}

          {/* 2. CORE INTERACTION BLOCK GRID SPLIT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT 2/3 COLUMN: BOOKING APPLICATION ENGINE */}
            <div className="lg:col-span-2 bg-white border-2 border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-950 tracking-tight">Book an Appointment Slot</h2>
                <div className="h-0.5 w-10 bg-[#D4AF37] mt-1.5 rounded"></div>
              </div>

              <form onSubmit={submitAppointmentForm} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Attending Practitioner</label>
                    <div className="w-full border border-slate-200 bg-slate-100/70 rounded-xl px-4 py-3 text-sm text-slate-800 font-bold tracking-wide">
                      Dra. Anne-Dumas Matienzo
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Select Treatment Service</label>
                    <select 
                      required
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer text-slate-800 font-medium"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                    >
                      <option value="" disabled hidden>Choose treatment type...</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Oral Prophylaxis (Cleaning)">Oral Prophylaxis (Cleaning)</option>
                      <option value="Tooth Restoration (Pasta)">Tooth Restoration (Pasta)</option>
                      <option value="Tooth Extraction (Bunot)">Tooth Extraction (Bunot)</option>
                      <option value="Fixed Bridge and Jacket Crown">Fixed Bridge and Jacket Crown</option>
                      <option value="Removable Dentures (Pustiso)">Removable Dentures (Pustiso)</option>
                      <option value="Oral Surgery (Wisdom Tooth Removal)">Oral Surgery (Wisdom Tooth Removal)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Target Booking Date</label>
                  <input 
                    type="date"
                    required
                    min={today}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 font-medium cursor-pointer"
                    value={selectedDate}
                    onChange={(e) => {
                      const selected = e.target.value;
                      // 📅 NEW: Check if the selected date is in the blocked dates array
                      if (blockedDates.includes(selected)) {
                        toast.error("The doctor is not available on this date. Please choose another date.");
                        setSelectedDate('');
                        setSelectedTimeSlot('');
                      } else {
                        setSelectedDate(selected);
                        setSelectedTimeSlot('');
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Available 30-Min Windows</label>
                  {selectedDate ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {availableSlots.map((slot) => {
                        const isPassed = isTimeSlotPassed(slot);
                        
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isPassed}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`py-2.5 text-xs font-bold border rounded-xl text-center transition-all ${
                              isPassed 
                                ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed'
                                : selectedTimeSlot === slot
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10 scale-[1.02] cursor-pointer'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 text-center">
                      💡 Please pick a reservation date above to unlock real-time available 30-minute intervals.
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Additional Medical Notes / Symptoms (Optional)</label>
                  <textarea 
                    rows="3"
                    placeholder="Describe any dental pain or specific requirements here..."
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-800 resize-none placeholder-slate-400"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={isSubmitting} 
                    className="w-full bg-slate-950 text-[#D4AF37] hover:bg-slate-900 disabled:opacity-70 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-md active:scale-[0.99] cursor-pointer"
                  >
                    {isSubmitting ? 'Processing Request...' : 'Request Appointment Authorization →'}
                  </button>
                </div>

              </form>
            </div>

            {/* RIGHT 1/3 COLUMN: CHECKLIST */}
            <div className="space-y-6">
              <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-3">Clinic Guidelines</h3>
                <div className="h-0.5 w-6 bg-blue-600 mb-4 rounded"></div>
                
                <ul className="space-y-4 text-xs text-slate-600 font-medium leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-500 text-sm mt-0.5">⚙️</span>
                    <span><strong>One Operation Per Booking:</strong> Each slot has a maximum cap of <strong>30 minutes</strong>. If you require multiple procedures (e.g., Pasta <em>and</em> Cleaning), you must book two separate slots.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 text-sm mt-0.5">🔒</span>
                    <span><strong>Unclickable Slots / Days:</strong> If a specific calendar day or time button is grayed out or rejected, it means that time has passed, is already occupied, or the doctor is unavailable.</span>
                  </li>
                  {/* 💳 NEW: explicit payment guideline regarding Cash/GCash vs HMO */}
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-500 text-sm mt-0.5">💳</span>
                    <span><strong>Payment Methods:</strong> The clinic currently accepts <strong>Cash, GCash, and Bank Transfer</strong>. We do not accept HMOs or Insurance cards at this time.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-blue-500 text-sm mt-0.5">▪</span>
                    <span>Please arrive exactly <strong>15 minutes prior</strong> to your reservation check-in target window.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* 3. HISTORICAL DATATABLE SECTION LAYER */}
          <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm text-left">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-950 tracking-tight">Historical Treatment Logs</h2>
              <div className="h-0.5 w-10 bg-slate-400 mt-1.5 rounded"></div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Log Reference</th>
                    <th className="px-6 py-3.5">Treatment Date</th>
                    <th className="px-6 py-3.5">Assigned Service</th>
                    <th className="px-6 py-3.5">Dentist Name</th>
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Loading history...</td>
                    </tr>
                  ) : appointmentHistory.length > 0 ? (
                    appointmentHistory.map((row) => (
                       <tr key={row._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-400">
                        {row.referenceCode}
                      </td>
                        <td className="px-6 py-4 text-slate-950 font-semibold">{row.selectedDate}</td>
                        <td className="px-6 py-4">{row.service}</td>
                        <td className="px-6 py-4 text-slate-500">{row.dentist}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeStyle(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                        <span className="block text-2xl mb-2">📂</span>
                        No treatment history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================== */}
      {/* CANCELLATION CONFIRMATION MODAL OVERLAY   */}
      {/* ========================================== */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-fadeIn relative">
            
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl mb-4">
              ⚠️
            </div>

            <h2 className="text-xl font-bold text-slate-950 tracking-tight mb-1">Cancel Appointment</h2>
            <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to cancel your reservation for <strong className="text-slate-800">{appointmentToCancel?.service}</strong> on <strong className="text-slate-800">{appointmentToCancel?.selectedDate}</strong>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setAppointmentToCancel(null);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Keep Appointment
              </button>
              <button 
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancellation}
                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-70"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Appointment;