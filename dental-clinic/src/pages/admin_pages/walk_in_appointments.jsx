import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';

const AdminWalkInAppointments = ({ admin, setAdmin }) => {
  const todayDate = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    service: 'Consultation',
    selectedDate: todayDate,
    selectedTimeSlot: '', 
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const uniqueServices = [
    'Consultation',
    'Oral Prophylaxis (Cleaning)',
    'Tooth Restoration (Pasta)',
    'Tooth Extraction (Bunot)',
    'Fixed Bridge and Jacket Crown',
    'Removable Dentures (Pustiso)',
    'Oral Surgery (Wisdom Tooth Removal)'
  ];

  const getAvailableTimeSlots = () => {
    const allSlots = [
      '08:00 AM - 08:30 AM',
      '08:30 AM - 09:00 AM',
      '09:00 AM - 09:30 AM',
      '09:30 AM - 10:00 AM',
      '10:00 AM - 10:30 AM',
      '10:30 AM - 11:00 AM',
      '11:00 AM - 11:30 AM',
      '11:30 AM - 12:00 PM',
      '01:00 PM - 01:30 PM',
      '01:30 PM - 02:00 PM',
      '02:00 PM - 02:30 PM',
      '02:30 PM - 03:00 PM',
      '03:00 PM - 03:30 PM',
      '03:30 PM - 04:00 PM',
    ];

    if (formData.selectedDate !== todayDate) return allSlots;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    return allSlots.filter(slot => {
      const startTimeStr = slot.split('-')[0].trim();
      const [time, modifier] = startTimeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      if (hours > currentHour) return true;
      if (hours === currentHour && minutes > currentMinutes) return true;
      return false;
    });
  };

  const availableSlots = getAvailableTimeSlots();

  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.includes(formData.selectedTimeSlot)) {
      setFormData(prev => ({ ...prev, selectedTimeSlot: availableSlots[0] }));
    } else if (availableSlots.length === 0) {
      setFormData(prev => ({ ...prev, selectedTimeSlot: '' }));
    }
  }, [formData.selectedDate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (availableSlots.length === 0) {
      setFeedback({ type: 'error', message: 'No more available time slots for the selected date.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const appointmentData = {
        patientId: `WALKIN-${Date.now()}`, 
        patientName: `${formData.firstName} ${formData.lastName}`.trim(),
        service: formData.service,
        selectedDate: formData.selectedDate,
        selectedTimeSlot: formData.selectedTimeSlot,
        status: 'Confirmed', 
        referenceCode: `WK-${Math.floor(1000 + Math.random() * 9000)}`,
        dentist: 'Dra. Anne-Dumas Matienzo' // 🔑 FIX: Hardcoded to your specific doctor
      };

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/appointments`, appointmentData);

      if (res.data.success) {
        setFeedback({ type: 'success', message: `Success! ${formData.firstName}'s walk-in appointment is confirmed.` });
        
        setFormData({
          firstName: '',
          lastName: '',
          contactNumber: '',
          service: 'Consultation',
          selectedDate: todayDate,
          selectedTimeSlot: getAvailableTimeSlots()[0] || '',
          notes: ''
        });
      }
    } catch (error) {
      console.error("Error booking walk-in:", error);
      setFeedback({ type: 'error', message: 'Failed to book the appointment. Please check the server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      {/* 🔑 FIX: Anchored to the left with strict padding (pl-[100px]). Stripped all centering classes! */}
      <main className="flex-1 pt-12.5 pr-8 pb-8 pl-25 min-h-screen text-left">
        
        {/* 🔑 FIX: Removed mx-auto. Kept max-w-4xl so it doesn't stretch infinitely, but stays locked left. */}
        <div className="w-full max-w-4xl space-y-8 block">
          
          <div className="border-b border-slate-200 pb-6 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Walk-in Registration</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Instantly register unregistered guests or emergency patients into the schedule.</p>
          </div>

          {feedback.message && (
            <div className={`p-4 rounded-xl text-sm font-bold shadow-sm ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {feedback.message}
            </div>
          )}

          <div className="bg-white border-2 border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-8 py-5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Fast-Track Booking Form</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">No patient account required.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8 text-left">
              
              {/* Patient Info Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">1. Patient Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">First Name *</label>
                    <input 
                      type="text" name="firstName" required
                      value={formData.firstName} onChange={handleChange}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-amber-500 focus:ring-0 outline-none transition-all"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Last Name *</label>
                    <input 
                      type="text" name="lastName" required
                      value={formData.lastName} onChange={handleChange}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-amber-500 focus:ring-0 outline-none transition-all"
                      placeholder="Dela Cruz"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Contact Number (Optional)</label>
                    <input 
                      type="text" name="contactNumber"
                      value={formData.contactNumber} onChange={handleChange}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-amber-500 focus:ring-0 outline-none transition-all"
                      placeholder="0912 345 6789"
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">2. Clinical Assignment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 🔑 FIX: Added Read-Only Dentist View */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Attending Practitioner</label>
                    <div className="w-full border border-slate-200 bg-slate-100/70 rounded-xl px-4 py-3 text-sm text-slate-800 font-bold tracking-wide">
                      👩‍⚕️ Dra. Anne-Dumas Matienzo
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Primary Service *</label>
                    <select 
                      name="service" required
                      value={formData.service} onChange={handleChange}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-amber-500 focus:ring-0 outline-none transition-all bg-white"
                    >
                      {uniqueServices.map(service => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Date *</label>
                    <input 
                      type="date" name="selectedDate" required
                      min={todayDate}
                      value={formData.selectedDate} onChange={handleChange}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-amber-500 focus:ring-0 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Time Slot *</label>
                    <select 
                      name="selectedTimeSlot" required
                      value={formData.selectedTimeSlot} onChange={handleChange}
                      disabled={availableSlots.length === 0}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-amber-500 focus:ring-0 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {availableSlots.length > 0 ? (
                        availableSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))
                      ) : (
                        <option value="">No available slots today</option>
                      )}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Internal Notes (Optional)</label>
                    <textarea 
                      name="notes" rows="2"
                      value={formData.notes} onChange={handleChange}
                      className="w-full border-2 border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:border-amber-500 focus:ring-0 outline-none transition-all"
                      placeholder="E.g., Patient is experiencing severe toothache."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="pt-6 border-t border-slate-100 flex justify-start">
                {/* Kept your black and gold theme! */}
                <button 
                  type="submit" 
                  disabled={isSubmitting || availableSlots.length === 0}
                  className="bg-slate-950 hover:bg-black text-amber-400 font-bold py-3 px-8 rounded-xl shadow-md border border-amber-500/30 focus:ring-4 focus:ring-amber-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Registering...' : 'Register Walk-in Patient'}
                </button>
              </div>

            </form>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminWalkInAppointments;