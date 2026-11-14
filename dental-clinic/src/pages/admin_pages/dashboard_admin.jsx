import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 
import AdminSidebar from '../adminsidebar'; 

const AdminDashboard = ({ user, admin, setAdmin }) => {
  const [pendingCount, setPendingCount] = useState(0);
  
  // ==========================================
  // 📢 ANNOUNCEMENT STATES
  // ==========================================
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', tags: 'General' });
  const [feedbackModal, setFeedbackModal] = useState({ show: false, title: '', message: '', isError: false });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

  // ==========================================
  // 📅 BLOCKED DATES STATES
  // ==========================================
  const [blockedDates, setBlockedDates] = useState([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");
  const [unblockModal, setUnblockModal] = useState({ show: false, dateId: null, dateString: '' });

  // ==========================================
  // 💬 FLOATING CHAT WIDGET & NAME MAP STATES
  // ==========================================
  const [chats, setChats] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [locallyRead, setLocallyRead] = useState([]); 
  const [patientNamesMap, setPatientNamesMap] = useState({}); 
  const chatScrollRef = useRef(null);

  // ==========================================
  // 🔑 UNIQUE NAME RESOLUTION HELPERS (Declared Once)
  // ==========================================
  const getPatientDisplayName = (chat) => {
    if (!chat) return "Patient Inquiry";
    
    // Check if the chat document embeds the name directly
    if (chat.patientName) return chat.patientName;
    if (chat.name) return chat.name;
    if (chat.user?.firstName && chat.user?.lastName) {
      return `${chat.user.firstName} ${chat.user.lastName}`;
    }

    // Check all possible ID keys against our fetched map dictionary
    const possibleId = chat.patientId || chat.userId || chat.senderId || chat._id;
    if (possibleId && patientNamesMap[possibleId]) {
      return patientNamesMap[possibleId];
    }
    
    // If we only have an ID string, let's see if it's stored in the map loosely
    if (possibleId) {
      // Return a cleaner formatted string or the ID if nothing else matches
      return `Patient ID: ${possibleId}`;
    }
    
    return "Unknown Patient";
  };

  const getInitials = (chat) => {
    const displayName = getPatientDisplayName(chat);
    if (!displayName || displayName.startsWith("Patient")) return "PT";
    return displayName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // ==========================================
  // 🔄 DYNAMIC DATA FETCHING
  // ==========================================
  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Appointments
      const aptRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/appointments`).catch(() => null);
      if (aptRes?.data?.success) {
        const activeAppointments = aptRes.data.appointments.filter(
          apt => apt.status === 'Pending Review' || apt.status === 'Confirmed'
        );
        setPendingCount(activeAppointments.length);
      }

      // 2. Fetch Announcements
      const annRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/announcements`).catch(() => null);
      if (annRes?.data?.success) {
        setAnnouncements(annRes.data.announcements);
      }

      // 3. Map User IDs / Patient IDs to Real Names
      const nameMap = {};
      const usersRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`).catch(() => null);
      if (usersRes?.data) {
        const userList = usersRes.data.users || usersRes.data;
        if (Array.isArray(userList)) {
          userList.forEach(u => {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
            if (u.patientId && fullName) nameMap[u.patientId] = fullName;
            if (u._id && fullName) nameMap[u._id] = fullName;
          });
        }
      }

      const recordsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/medical-records/all`).catch(() => null);
      if (recordsRes?.data?.records) {
        recordsRes.data.records.forEach(rec => {
          if (rec.patientId && rec.patientName) {
            nameMap[rec.patientId] = rec.patientName;
          }
        });
      }
      setPatientNamesMap(nameMap);

      // 4. Fetch Chats
      const chatRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/chats`).catch(()=> null);
      if (chatRes?.data) {
        const chatArray = chatRes.data.chats || chatRes.data.data || chatRes.data.messages || (Array.isArray(chatRes.data) ? chatRes.data : []);
        setChats(chatArray);
        
        setActiveChat(currentActive => {
          if (!currentActive) return null;
          return chatArray.find(c => c._id === currentActive._id) || currentActive;
        });
      }

      // 5. Fetch Blocked Dates
      const blockedRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/blocked-dates`).catch(() => null);
      if (blockedRes?.data?.success) {
        setBlockedDates(blockedRes.data.blockedDates);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  useEffect(() => {
    const maintainOnlineStatus = async () => {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/doctor-status`, { isActive: true });
      } catch (error) {
        // Silently fail on network hiccup
      }
    };

    fetchDashboardData();
    maintainOnlineStatus();

    const intervalId = setInterval(() => {
      fetchDashboardData();
      maintainOnlineStatus(); 
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeChat]);

  // ==========================================
  // 📢 ANNOUNCEMENT LOGIC
  // ==========================================
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = typeof newAnnouncement.tags === 'string' 
        ? newAnnouncement.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : ['General'];
      
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const currentAdmin = admin || user;
      const authorName = currentAdmin?.firstName 
        ? `${currentAdmin.firstName} ${currentAdmin.lastName || ''}`.trim() 
        : 'Clinic Admin';

      const payload = {
        title: newAnnouncement.title,
        message: newAnnouncement.message,
        tags: tagsArray,
        author: authorName
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/announcements`, 
        payload,
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
      );

      if (res.data.success || res.data.announcement) {
        const newEntry = res.data.announcement || res.data.data;
        setAnnouncements([newEntry, ...announcements]);
        setShowModal(false);
        setNewAnnouncement({ title: '', message: '', tags: 'General' });
        
        setFeedbackModal({
          show: true,
          title: 'Broadcast Published',
          message: 'Your announcement has been successfully pinned to all patient dashboards.',
          isError: false
        });
      }
    } catch (error) {
      console.error("Failed to post announcement:", error);
      setFeedbackModal({
        show: true,
        title: 'Action Failed',
        message: error.response?.data?.message || "Failed to post broadcast.",
        isError: true
      });
    }
  };

  const promptDeleteAnnouncement = (id) => {
    setDeleteModal({ show: true, id });
  };

  const confirmDeleteAnnouncement = async () => {
    const id = deleteModal.id;
    setDeleteModal({ show: false, id: null });
    if (!id) return;

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/announcements/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined }
      });
      setAnnouncements(announcements.filter(a => a._id !== id));
      setFeedbackModal({
        show: true,
        title: 'Announcement Deleted',
        message: 'The broadcast has been successfully removed.',
        isError: false
      });
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  // ==========================================
  // 📅 BLOCKED DATES LOGIC
  // ==========================================
  const handleAddBlockedDate = async (e) => {
    e.preventDefault();
    if (!newBlockedDate) return;
    
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/blocked-dates`, {
        date: newBlockedDate,
        reason: newBlockedReason || 'Doctor not available'
      });
      
      if (res.data.success) {
        setBlockedDates([...blockedDates, res.data.blockedDate]);
        setNewBlockedDate("");
        setNewBlockedReason("");
      }
    } catch (error) {
      console.error("Failed to block date", error);
      alert(error.response?.data?.message || "Failed to add date.");
    }
  };

  const promptUnblockDate = (dateObj) => {
    const formattedDate = new Date(dateObj.date).toLocaleDateString(undefined, { 
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
    });
    setUnblockModal({ show: true, dateId: dateObj._id, dateString: formattedDate });
  };

  const executeUnblockDate = async () => {
    const id = unblockModal.dateId;
    setUnblockModal({ show: false, dateId: null, dateString: '' });
    if (!id) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/blocked-dates/${id}`);
      setBlockedDates(blockedDates.filter(d => d._id !== id));
    } catch (error) {
      console.error("Failed to remove blocked date", error);
    }
  };

  // ==========================================
  // 💬 CHAT LOGIC
  // ==========================================
  const isChatUnread = (chat) => {
    if (!chat.messages || chat.messages.length === 0) return false;
    const lastMsg = chat.messages[chat.messages.length - 1];
    return lastMsg.sender === 'patient' && !locallyRead.includes(chat._id);
  };

  const totalUnreadCount = chats.filter(isChatUnread).length;

  const handleOpenChat = (chat) => {
    setActiveChat(chat);
    if (!locallyRead.includes(chat._id)) {
      setLocallyRead([...locallyRead, chat._id]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChat) return;

    const newMessage = {
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChats = chats.map(c => {
      if (c._id === activeChat._id) {
        return { ...c, messages: [...c.messages, { sender: 'doctor', ...newMessage }] };
      }
      return c;
    });
    setChats(updatedChats);
    setActiveChat(updatedChats.find(c => c._id === activeChat._id));
    setReplyText("");

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/chats/${activeChat._id}/message`, newMessage);
    } catch (error) {
      console.error("Failed to send reply to backend", error);
    }
  };

  const operationalActions = [
    { title: "Appointments Queue", desc: "Monitor incoming slot reservations, approve pending patient times, and assign clinical dental rooms.", path: "/admin-appointments", actionText: "Manage queue", badge: pendingCount > 0 ? `${pendingCount} Pending` : null },
    { title: "Walk-in Registration", desc: "Instantly check in dynamic walk-in patients, look up fast files, and insert unexpected emergencies.", path: "/admin-walk-in", actionText: "Open walk-in portal" },
    { title: "Create New Receipt", desc: "Generate active transaction point-of-sale breakdowns immediately following a procedure.", path: "/admin-receipts", actionText: "Issue new receipt" }
  ];

  const coreRecords = [
    { title: "Patient Records System", desc: "Access full electronic health records, check digital historical files, and update progress charts.", path: "/admin-records", actionText: "View medical records" },
    { title: "Billing & Invoices Matrix", desc: "Track historical cash collection cycles, manage unresolved balance alerts, and coordinate HMOs.", path: "/admin-billings", actionText: "Financial ledger" },
    { title: "Installment & Loan Tracker", desc: "Track active patient payment plans, monthly installments, and legacy transfer accounts.", path: "/admin/installments", actionText: "Manage loan plans" }
  ];

  const systemicControls = [
    { title: "Statistics & Analytics Engine", desc: "Analyze quarterly clinical growth charts, track client volume trajectories, and study comprehensive treatment performance trends.", path: "/admin-statistics", actionText: "View system reports", badge: "Monthly Update" },
    { title: "Inventory & Supplies", desc: "Monitor clinic dental materials, stocks, equipment status, and supply thresholds.", path: "/admin-inventory", actionText: "Manage stock inventory" },
    { title: "Clinic System Settings", desc: "Configure working practitioner hour shifts, adjust core billing parameters, and handle database access rules.", path: "/admin-settings", actionText: "Modify global configurations" }
  ];

  return (
    <div className="flex w-full min-h-screen bg-slate-50 font-sans antialiased text-slate-900 relative">
      <AdminSidebar user={user} admin={admin} setAdmin={setAdmin} />

      <main className="flex-1 px-8 py-10 max-w-5xl mx-auto flex flex-col justify-between">
        <div>
          <div className="border-b-2 border-slate-200 pb-8 mb-8 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
              Matienzo Clinic Operations Desk
            </h1>
            <p className="text-base text-slate-500 font-medium leading-relaxed max-w-2xl">
              Centralized platform for processing client flow, tracking practice earnings, maintaining clinical data integrity, and authorizing operational documents.
            </p>
          </div>

          {/* 📢 ANNOUNCEMENTS */}
          <div className="mb-12 bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
            <div className="flex justify-between items-center mb-6 pl-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Global Clinic Broadcasts</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Announcements pinned here are immediately visible on all Patient Dashboards.</p>
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                + Post Announcement
              </button>
            </div>

            <div className="space-y-3 pl-4">
              {announcements.length > 0 ? announcements.map((ann, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-800">{ann.title}</h3>
                      {ann.tags?.map(tag => (
                        <span key={tag} className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-2">{ann.message}</p>
                    <span className="text-[10px] text-slate-400 font-semibold">Posted {new Date(ann.createdAt).toLocaleDateString()} by {ann.author}</span>
                  </div>
                  <div className="flex items-start shrink-0">
                    <button 
                      onClick={() => promptDeleteAnnouncement(ann._id)}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-400 italic py-4">No active broadcasts running.</div>
              )}
            </div>
          </div>

          {/* 📅 SCHEDULE MANAGEMENT */}
          <div className="mb-12 bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Schedule Management</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Select dates when the doctor is unavailable. Patients will be automatically notified by email.</p>
            
            <div className="flex flex-col md:flex-row gap-6">
              <form onSubmit={handleAddBlockedDate} className="flex-1 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Date to Block *</label>
                  <input 
                    type="date" 
                    required
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Seminar, Holiday, Leave"
                    value={newBlockedReason}
                    onChange={(e) => setNewBlockedReason(e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                  />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">
                  Block Date & Notify Patients
                </button>
              </form>

              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Currently Blocked Dates</h3>
                <div className="space-y-2 max-h-62.5 overflow-y-auto custom-scrollbar pr-2">
                  {blockedDates.length > 0 ? blockedDates.map((dateObj) => (
                    <div key={dateObj._id} className="flex justify-between items-center bg-red-50 border border-red-100 p-4 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-red-700">
                          {new Date(dateObj.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-red-500 font-medium mt-0.5">{dateObj.reason}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => promptUnblockDate(dateObj)}
                        className="text-[10px] font-bold bg-white text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-600 hover:text-white transition-colors shadow-sm cursor-pointer"
                      >
                        Unblock
                      </button>
                    </div>
                  )) : (
                    <div className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-xl border border-slate-100 text-center flex flex-col items-center justify-center h-full">
                      <span className="text-2xl mb-2">🗓️</span>
                      No dates are currently blocked.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pl-1">Live Daily Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {operationalActions.map((card, idx) => (
                <div key={idx} className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 hover:shadow-md hover:border-blue-500">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">{card.title}</h3>
                      {card.badge && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-md">{card.badge}</span>}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{card.desc}</p>
                  </div>
                  <Link to={card.path} className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline inline-block mt-auto">
                    {card.actionText} &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pl-1">Clinical Records & Billing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coreRecords.map((card, idx) => (
                <div key={idx} className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 hover:shadow-md hover:border-slate-400">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight mb-2">{card.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{card.desc}</p>
                  </div>
                  <Link to={card.path} className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline inline-block mt-auto">
                    {card.actionText} &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pl-1">Insights & Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {systemicControls.map((card, idx) => (
                <div key={idx} className="bg-white border-2 border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-150 hover:shadow-md hover:border-slate-400">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight">{card.title}</h3>
                      {card.badge && <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md">{card.badge}</span>}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">{card.desc}</p>
                  </div>
                  <Link to={card.path} className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline inline-block mt-auto">
                    {card.actionText} &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="mt-16 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-medium gap-4">
          <div className="flex items-center gap-5"></div>
          <div className="font-semibold text-slate-700">Matienzo Management Core</div>
        </footer>
      </main>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Draft New Broadcast</h2>
            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Headline</label>
                <input 
                  type="text" required
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Holiday Schedule Update"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Message</label>
                <textarea 
                  required rows="4"
                  value={newAnnouncement.message}
                  onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Type the full announcement details here..."
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tags (Comma separated)</label>
                <input 
                  type="text"
                  value={newAnnouncement.tags}
                  onChange={e => setNewAnnouncement({...newAnnouncement, tags: e.target.value})}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Urgent, Promo, Policy"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm cursor-pointer">Publish Broadcast</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center text-xl mb-4">🗑️</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Announcement</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">Are you sure you want to delete this broadcast?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ show: false, id: null })} className="flex-1 bg-slate-100 text-slate-700 text-xs font-bold py-2.5 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={confirmDeleteAnnouncement} className="flex-1 bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {unblockModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm text-center">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl mb-4 bg-amber-100 text-amber-600">⚠️</div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Unblock Date?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">Are you sure you want to unblock <span className="font-bold text-slate-900">{unblockModal.dateString}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setUnblockModal({ show: false, dateId: null, dateString: '' })} className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={executeUnblockDate} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl cursor-pointer">Unblock</button>
            </div>
          </div>
        </div>
      )}

      {feedbackModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl mb-4 ${feedbackModal.isError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {feedbackModal.isError ? '⚠️' : '✓'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{feedbackModal.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">{feedbackModal.message}</p>
            <button onClick={() => setFeedbackModal({ show: false, title: '', message: '', isError: false })} className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer">Okay</button>
          </div>
        </div>
      )}

      {/* 💬 FLOATING CHAT WIDGET */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="mb-4 w-96 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-4xl overflow-hidden flex flex-col transition-all origin-bottom-right animate-in zoom-in-95 duration-200" style={{ height: '500px' }}>
            <div className="bg-slate-950 px-6 py-5 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                {activeChat && (
                  <button onClick={() => setActiveChat(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                )}
                <div>
                  <h3 className="font-bold tracking-wide text-sm">{activeChat ? getPatientDisplayName(activeChat) : 'Patient Inquiries'}</h3>
                  <p className="text-[10px] text-[#D4AF37] font-medium uppercase tracking-widest mt-0.5">{activeChat ? `ID: ${activeChat.patientId}` : 'Inbox'}</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white bg-white/10 rounded-full p-1.5 transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 bg-[#fbfbfd] overflow-hidden relative">
              {!activeChat ? (
                <div className="h-full overflow-y-auto custom-scrollbar p-2">
                  {chats.length > 0 ? chats.map(chat => (
                    <div 
                      key={chat._id} 
                      onClick={() => handleOpenChat(chat)}
                      className="flex items-center gap-4 p-4 hover:bg-slate-100 rounded-2xl cursor-pointer transition-colors relative"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-[#D4AF37] flex items-center justify-center font-bold text-sm shrink-0 border-2 border-white shadow-sm">
                        {getInitials(chat)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{getPatientDisplayName(chat)}</h4>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {chat.messages?.[chat.messages.length - 1]?.time}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${isChatUnread(chat) ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>
                          {chat.messages?.[chat.messages.length - 1]?.text || 'No messages yet'}
                        </p>
                      </div>
                      {isChatUnread(chat) && (
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 shadow-sm shadow-red-500/50"></div>
                      )}
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <span className="text-4xl mb-2">📬</span>
                      <p className="text-xs font-semibold">No messages yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                    {activeChat.messages?.map((msg, i) => {
                      const isClinic = msg.sender === 'doctor';
                      return (
                        <div key={i} className={`flex flex-col ${isClinic ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[80%] px-4 py-2.5 text-sm font-medium ${
                            isClinic 
                              ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 mt-1.5 px-1">{msg.time}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                      <input 
                        type="text" 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type a reply..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button 
                        type="submit" 
                        disabled={!replyText.trim()}
                        className="absolute right-1.5 p-2 bg-[#D4AF37] text-slate-950 rounded-full hover:bg-[#c29e2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="relative bg-slate-950 text-[#D4AF37] p-4 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-slate-900 cursor-pointer"
        >
          {isChatOpen ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          )}

          {totalUnreadCount > 0 && !isChatOpen && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#fbfbfd] shadow-sm animate-bounce">
              {totalUnreadCount}
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;