import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from '../adminsidebar';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// 🔑 BULLETPROOF DATE PARSER
const buildSafeDate = (dateStr, timeStr) => {
  try {
    const cleanDate = dateStr.replace(/\//g, '-');
    const [year, month, day] = cleanDate.split('-').map(Number);

    const cleanTime = timeStr.trim();
    const [time, modifier] = cleanTime.split(/\s+/); 
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier) {
      if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }

    return new Date(year, month - 1, day, hours || 0, minutes || 0);
  } catch (error) {
    return new Date(); 
  }
};

const AppointmentsAdmin = ({ admin, setAdmin }) => {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [rawAppointments, setRawAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');

  const [filterOption, setFilterOption] = useState('upcoming'); 
  const [serviceFilter, setServiceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Modals
  const [selectedEventModal, setSelectedEventModal] = useState({ show: false, appointment: null });
  const [cancelModal, setCancelModal] = useState({ show: false, appointment: null, reason: '' });
  const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '', isError: false });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterOption, serviceFilter, statusFilter, yearFilter]);

  // Fetch Appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/appointments`);
        
        if (res.data.success) {
          const apts = res.data.appointments || [];
          setRawAppointments(apts);

          const events = apts.map(apt => {
            if (!apt.selectedDate || !apt.selectedTimeSlot) return null;

            const startTimeString = apt.selectedTimeSlot.split('-')[0].trim();
            const startDate = buildSafeDate(apt.selectedDate, startTimeString);
            
            const endDate = new Date(startDate);
            endDate.setHours(startDate.getHours() + 1);

            return {
              id: apt._id,
              title: `${apt.patientName} - ${apt.service}`, // 🔑 Fixed stray diff syntax error here
              start: startDate,
              end: endDate,
              resource: apt 
            };
          });

          const validEvents = events.filter(event => event !== null);
          setCalendarEvents(validEvents);
        }
      } catch (error) {
        console.error("Error fetching admin appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const eventStyleGetter = (event) => {
    const status = event.resource.status;
    let backgroundColor = '#3b82f6'; 

    if (status === 'Pending Review') backgroundColor = '#f59e0b'; 
    if (status === 'Confirmed') backgroundColor = '#10b981'; 
    if (status === 'Completed') backgroundColor = '#64748b'; 
    if (status === 'Cancelled') backgroundColor = '#ef4444'; 

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.95,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '3px 6px'
      }
    };
  };

  const handleStatusClick = async (appointment) => {
    let nextStatus = '';
    
    if (appointment.status === 'Pending Review') nextStatus = 'Confirmed';
    else if (appointment.status === 'Confirmed') nextStatus = 'Completed';
    
    else return;

    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/appointments/admin/appointments/${appointment._id}/status`, { 
        newStatus: nextStatus 
      });

      if (res.data.success) {
        setRawAppointments(prev => prev.map(apt => 
          apt._id === appointment._id ? { ...apt, status: nextStatus } : apt
        ));
        
        setCalendarEvents(prev => prev.map(event => 
          event.id === appointment._id ? { ...event, resource: { ...event.resource, status: nextStatus } } : event
        ));

        setFeedbackModal({
          show: true,
          title: 'Status Updated',
          message: `Appointment successfully marked as ${nextStatus}.`,
          isError: false
        });
      }
    } catch (error) {
      console.error("Failed to update appointment status", error);
      setFeedbackModal({
        show: true,
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update appointment status.',
        isError: true
      });
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    const { appointment, reason } = cancelModal;
    if (!appointment) return;

    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/appointments/admin/appointments/${appointment._id}/status`, { 
        newStatus: 'Cancelled',
        cancellationReason: reason || 'Doctor emergency / Unforeseen schedule conflict',
        patientEmail: appointment.patientEmail // 🔑 Explicitly passing patient email to prevent lookup misses
      });

      if (res.data.success) {
        setRawAppointments(prev => prev.map(apt => 
          apt._id === appointment._id ? { ...apt, status: 'Cancelled' } : apt
        ));
        
        setCalendarEvents(prev => prev.map(event => 
          event.id === appointment._id ? { ...event, resource: { ...event.resource, status: 'Cancelled' } } : event
        ));

        setCancelModal({ show: false, appointment: null, reason: '' });
        setSelectedEventModal({ show: false, appointment: null });

        setFeedbackModal({
          show: true,
          title: 'Appointment Cancelled',
          message: 'The appointment has been cancelled and an email notification has been dispatched to the patient.',
          isError: false
        });
      }
    } catch (error) {
      console.error("Failed to cancel appointment", error);
      setFeedbackModal({
        show: true,
        title: 'Cancellation Failed',
        message: error.response?.data?.message || "Failed to cancel appointment and send email.",
        isError: true
      });
    }
  };

  const uniqueServices = [
    'All', 'Consultation', 'Oral Prophylaxis (Cleaning)', 'Tooth Restoration (Pasta)', 
    'Tooth Extraction (Bunot)', 'Fixed Bridge and Jacket Crown', 'Removable Dentures (Pustiso)', 'Oral Surgery (Wisdom Tooth Removal)'
  ];
  
  const uniqueYears = ['All', ...new Set(rawAppointments.map(a => {
      if(!a.selectedDate) return null;
      return a.selectedDate.split('-')[0];
  }).filter(Boolean))].sort((a, b) => b - a); 
  
  const statuses = ['All', 'Pending Review', 'Confirmed', 'Completed', 'Cancelled'];

  const getSortedAndFilteredList = () => {
    const today = new Date();

    let listWithDates = rawAppointments.map(apt => {
      if (!apt.selectedDate || !apt.selectedTimeSlot) return null;
      const startTimeString = apt.selectedTimeSlot.split('-')[0].trim();
      return { ...apt, parsedDate: buildSafeDate(apt.selectedDate, startTimeString) };
    }).filter(apt => apt !== null);

    if (filterOption === 'upcoming') {
      listWithDates = listWithDates.filter(apt => apt.parsedDate >= today).sort((a, b) => a.parsedDate - b.parsedDate);
    } else if (filterOption === 'past') {
      listWithDates = listWithDates.filter(apt => apt.parsedDate < today).sort((a, b) => b.parsedDate - a.parsedDate);
    } else {
      listWithDates = listWithDates.sort((a, b) => Math.abs(a.parsedDate - today) - Math.abs(b.parsedDate - today));
    }

    if (serviceFilter !== 'All') listWithDates = listWithDates.filter(apt => apt.service === serviceFilter);
    if (statusFilter !== 'All') listWithDates = listWithDates.filter(apt => apt.status === statusFilter);
    if (yearFilter !== 'All') listWithDates = listWithDates.filter(apt => apt.parsedDate.getFullYear().toString() === yearFilter);

    return listWithDates;
  };

  const fullFilteredList = getSortedAndFilteredList();
  const totalPages = Math.ceil(fullFilteredList.length / ITEMS_PER_PAGE) || 1;
  const displayList = fullFilteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 antialiased font-sans relative">
      <AdminSidebar admin={admin} setAdmin={setAdmin} />
      
      <main className="flex-1 pt-[50px] px-6 md:px-8 pb-8 min-h-screen">
        <div className="w-full space-y-8">
          
          <div className="border-b border-slate-200 pb-6 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Master Schedule</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Manage and view all booked clinic appointments.</p>
          </div>

          <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm">
            {isLoading ? (
              <div className="h-[500px] flex items-center justify-center">
                <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : (
              <div style={{ height: '550px' }} className="calendar-container">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  date={currentDate}
                  onNavigate={(newDate) => setCurrentDate(newDate)}
                  view={currentView}
                  onView={(newView) => setCurrentView(newView)}
                  defaultView="week"
                  views={['month', 'week', 'day']}
                  step={30} 
                  timeslots={2} 
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={(event) => setSelectedEventModal({ show: true, appointment: event.resource })}
                />
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-slate-100 pb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient Roster <span className="text-sm font-semibold text-slate-400 ml-2">({fullFilteredList.length} total)</span></h2>
              
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                <button onClick={() => setFilterOption('upcoming')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterOption === 'upcoming' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Upcoming</button>
                <button onClick={() => setFilterOption('past')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterOption === 'past' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Past</button>
                <button onClick={() => setFilterOption('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterOption === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Service Filter</label>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl p-2.5" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                  {uniqueServices.map(service => <option key={service} value={service}>{service}</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Status Filter</label>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl p-2.5" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Year</label>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl p-2.5" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                  {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-50 border-y border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <div className="col-span-3">Patient Name</div>
              <div className="col-span-3">Service</div>
              <div className="col-span-3">Schedule</div>
              <div className="col-span-3 text-right">Status</div>
            </div>

            <div className="space-y-2">
              {displayList.length > 0 ? displayList.map(apt => (
                <div key={apt._id} className="grid grid-cols-12 gap-4 px-4 py-4 bg-white border border-slate-100 hover:border-blue-100 hover:shadow-sm rounded-xl items-center transition-all">
                  <div className="col-span-3 flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{apt.patientName}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{apt.referenceCode}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-xs font-semibold text-slate-700">{apt.service}</span>
                  </div>
                  <div className="col-span-3 flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{apt.selectedDate}</span>
                    <span className="text-xs font-medium text-slate-500 mt-0.5">{apt.selectedTimeSlot}</span>
                  </div>
                  
                  <div className="col-span-3 flex justify-end gap-2 items-center">
                    {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                      <button
                        onClick={() => setCancelModal({ show: true, appointment: apt, reason: '' })}
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-200"
                      >
                        Cancel
                      </button>
                    )}
                    <button 
                      onClick={() => handleStatusClick(apt)}
                      disabled={apt.status === 'Completed' || apt.status === 'Cancelled'}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${
                        apt.status === 'Pending Review' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer shadow-sm' :
                        apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer shadow-sm' :
                        apt.status === 'Completed' ? 'bg-slate-200 text-slate-700 cursor-default' :
                        apt.status === 'Cancelled' ? 'bg-red-100 text-red-700 cursor-default' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {apt.status}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 text-sm text-slate-500 font-medium italic">
                  No appointments match these filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Event Details Modal */}
      {selectedEventModal.show && selectedEventModal.appointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Appointment Details</h3>
            <div className="space-y-3 text-xs mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div><strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Patient Name</strong> <span className="text-sm font-bold text-slate-800">{selectedEventModal.appointment.patientName}</span></div>
              <div><strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Service</strong> <span className="text-sm font-semibold text-slate-800">{selectedEventModal.appointment.service}</span></div>
              <div><strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Date & Time</strong> <span className="text-sm font-bold text-slate-800">{selectedEventModal.appointment.selectedDate} ({selectedEventModal.appointment.selectedTimeSlot})</span></div>
              <div><strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Reference Code</strong> <span className="font-mono font-bold text-blue-600">{selectedEventModal.appointment.referenceCode}</span></div>
              <div><strong className="text-slate-400 uppercase tracking-wider block text-[10px]">Current Status</strong> <span className="font-bold text-slate-700">{selectedEventModal.appointment.status}</span></div>
            </div>
            <div className="flex gap-3">
              {selectedEventModal.appointment.status !== 'Completed' && selectedEventModal.appointment.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={() => {
                    const apt = selectedEventModal.appointment;
                    setSelectedEventModal({ show: false, appointment: null });
                    setCancelModal({ show: true, appointment: apt, reason: '' });
                  }}
                  className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Cancel Appointment
                </button>
              )}
              <button type="button" onClick={() => setSelectedEventModal({ show: false, appointment: null })} className="flex-1 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Reason Modal */}
      {cancelModal.show && cancelModal.appointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Cancel Appointment</h3>
            <p className="text-xs text-slate-500 mb-4">Provide a cancellation reason. An email notification will be automatically dispatched to <strong className="text-slate-800">{cancelModal.appointment.patientName}</strong>.</p>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason for Cancellation *</label>
                <textarea required rows="3" placeholder="e.g., Unforeseen medical emergency..." value={cancelModal.reason} onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })} className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:border-red-500 focus:outline-none"></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCancelModal({ show: false, appointment: null, reason: '' })} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold py-2.5 rounded-xl transition-all">Back</button>
                <button type="submit" className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm">Confirm & Email Patient</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Feedback Modal */}
      {feedbackModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm text-center">
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl mb-4 ${feedbackModal.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {feedbackModal.isError ? '⚠️' : '✓'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{feedbackModal.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">{feedbackModal.message}</p>
            <button type="button" onClick={() => setFeedbackModal({ show: false, title: '', message: '', isError: false })} className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-sm">Okay</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AppointmentsAdmin;