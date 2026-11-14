import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ConsoleSidebar from '../sidebar';

const Dashboard = ({ user, setUser }) => {
  // 🔑 Dynamic Announcements State
  const [announcements, setAnnouncements] = useState([]);

  // 🔑 Fetch Announcements on load
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/announcements`);
        if (res.data.success) {
          setAnnouncements(res.data.announcements);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      }
    };

    fetchAnnouncements();
  }, []);

  const coreServices = [
    {
      title: "Appointment Tab",
      desc: "Schedule a routine cleaning, dental checkup, or coordinate specialized care with our available oral health practitioners.",
      path: `/user/appointment/${user?.patientId}`,
      actionText: "Book an appointment"
    },
    {
      title: "List of Appointments",
      desc: "Track active time confirmations, view admin confirmation and payment updates.",
      path: `/user/list-appointments/${user?.patientId}`,
      actionText: "See your schedule"
    },
    {
      title: "Medical Record & Chat with Doctor",
      desc: "Review diagnosis reports, dental x-ray folders, prescriptions, and message your attending dentist on a secure network channel.",
      path: `/user/medical-record/${user?.patientId}`,
      actionText: "Open medical files",
      badge: "Active Support"
    },
  ];

  const managementServices = [
    {
      title: "Receipts",
      desc: "View and download your digital payment receipts and transaction records.",
      path: `/user/receipts`,
      actionText: "View receipts"
    },
    {
      title: "Profile Settings",
      desc: "Update your contact information, phone number, address details, and manage companion or dependent child dental records.",
      path: `/user/profile-settings/${user?.patientId}`,
      actionText: "Update profile information"
    },
    {
      title: "Account Preferences & Security",
      desc: "Adjust account notification rules, login authentication methods, and manage access sharing permissions.",
      path: `/user/account-preference/${user?.patientId}`,
      actionText: "Open system preferences"
    },
    {
      title: "Help & Support Center",
      desc: "Find answers to frequently asked clinic questions, review pre-op guidelines, or contact our customer desk directly.",
      path: `/user/help-support/${user?.patientId}`,
      actionText: "Visit help center"
    }
  ];

  return (
    <div className="flex w-full min-h-screen bg-white font-sans antialiased text-slate-900">
      
      <ConsoleSidebar user={user} setUser={setUser} />

      <main className="flex-1 pl-64 min-h-screen flex flex-col justify-between">
        <div className="px-8 py-10 max-w-4xl mx-auto w-full">
          
          {/* Top Header Row */}
          <div className="border-b border-slate-200 pb-8 mb-8 text-left">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
              Welcome back, {user?.firstName || 'Patient'}
            </h1>
            <p className="text-base text-slate-700 font-normal leading-relaxed max-w-2xl">
              Manage your medical schedule, personal health data, and privacy settings to make the Matienzo Dental Portal work better for you.
            </p>
          </div>

          {/* 📢 DYNAMIC ANNOUNCEMENT BANNER(S) */}
          {announcements.length > 0 && (
            <div className="mb-10 space-y-4">
              {announcements.map((ann) => (
                <div key={ann._id} className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 text-lg border border-blue-200">
                    📢
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-blue-900 tracking-tight">
                        {ann.title}
                      </h3>
                      {ann.tags && ann.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold uppercase tracking-wider bg-white text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-blue-800/80 font-medium leading-relaxed mb-2">
                      {ann.message}
                    </p>
                    <p className="text-[10px] text-blue-600/60 font-semibold">
                      Posted {new Date(ann.createdAt).toLocaleDateString()} by {ann.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION 1: CLINICAL OPERATIONS */}
          <div className="space-y-4 mb-10">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pl-1">
              Clinical Services
            </h2>
            
            <div className="space-y-3">
              {coreServices.map((card, idx) => (
                <div 
                  key={idx}
                  className="bg-white border-2 border-slate-200/80 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 hover:shadow-md hover:border-blue-500"
                >
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-950 tracking-tight">
                        {card.title}
                      </h3>
                      {card.badge && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-0.5 rounded-full border border-blue-200">
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 font-normal leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  
                  <div className="sm:text-right shrink-0">
                    <Link 
                      to={card.path}
                      className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all inline-block whitespace-nowrap"
                    >
                      {card.actionText}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: MANAGEMENT & ACCOUNTS */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pl-1">
              Account & Utilities
            </h2>
            
            <div className="space-y-3">
              {managementServices.map((card, idx) => (
                <div 
                  key={idx}
                  className="bg-white border-2 border-slate-200/80 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 hover:shadow-md hover:border-blue-500"
                >
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-bold text-slate-950 tracking-tight mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-700 font-normal leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  
                  <div className="sm:text-right shrink-0">
                    <Link 
                      to={card.path}
                      className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition-all inline-block whitespace-nowrap"
                    >
                      {card.actionText}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Structural Footer Area */}
        <footer className="mt-16 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-600 font-medium gap-4 px-8 max-w-4xl mx-auto w-full pb-8">
          <div className="flex items-center gap-5"></div>
          <div className="font-semibold text-slate-800">Matienzo Dental Clinic • v{user?.app_version || '1.0'}</div>
        </footer>

      </main>

    </div>
  );
};

export default Dashboard;