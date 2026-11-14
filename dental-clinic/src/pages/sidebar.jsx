import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; 
import logo_no_bg from "../assets/logo_no_bg.png";
import axios from 'axios';

const ConsoleSidebar = ({ user, setUser }) => { 
  const navigate = useNavigate();

  const menuGroups = [
    {
      groupName: "Main",
      items: [
        { id: 'dashboard', label: 'Dashboard', path: `/user/dashboard/${user?.patientId}` }
      ]
    },
    {
      groupName: "Scheduling",
      items: [
        { id: 'book-appointment', label: 'Book an Appointment', path: `/user/appointment/${user?.patientId}`} ,
        { id: 'appointments-list', label: 'List of Appointments', path: `/user/list-appointments/${user?.patientId}` }
      ]
    },
    {
      groupName: "Health & Consult",
      items: [
        { id: 'medical-records', label: 'Medical Record & Chat with Doctor', path: `/user/medical-record/${user?.patientId}`, badge: "Live" }
      ]
    },{
      groupName: "Receipts",
      items: [
        { id: 'receipts', label: 'Receipts', path: `/user/receipts/` }
      ]
    },
    {
      groupName: "Account",
      items: [
        { id: 'profile', label: 'Profile Settings', path: `/user/profile-settings/${user?.patientId}` },
        { id: 'settings', label: 'Account Preferences', path: `/user/account-preference/${user?.patientId}` },
        { id: 'support', label: 'Help & Support', path: `/user/help-support/${user?.patientId}` }
      ]
    }
  ];

  const handleSignOut = async (e) => {
    e.preventDefault();
    
    // 1. Attempt to update status to offline in the database
    try {
      const patientId = user?.patientId;
      if (patientId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/status/${patientId}`, { 
          status: 'offline' 
        });
      }
    } catch (error) {
      console.error("Failed to update status to offline on logout:", error);
    }

    // 2. Clear local storage and reset state
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    if (setUser) setUser(null); 
    
    // 3. Redirect
    navigate('/login'); 
  };

  // 🔑 HELPER 1: Generate initials (e.g., "Lucille Torres" -> "LT")
  const getInitials = () => {
    if (!user || !user.firstName || !user.lastName) return "GU"; // Default to Guest User
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  // 🔑 HELPER 2: Pick a stable color based on the unique user string hash
  const getAvatarBgColor = () => {
    if (!user) return 'bg-slate-500'; // Default fallback
    
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-600', 
      'bg-emerald-600', 'bg-teal-600', 'bg-cyan-600', 
      'bg-indigo-600', 'bg-violet-600', 'bg-fuchsia-600'
    ];
    
    const nameString = `${user.firstName}${user.lastName}`;
    let charHashSum = 0;
    for (let i = 0; i < nameString.length; i++) {
      charHashSum += nameString.charCodeAt(i);
    }
    
    return colors[charHashSum % colors.length];
  };

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-white border-r-2 border-slate-200 flex flex-col justify-between p-5 select-none font-sans shrink-0 overflow-y-auto z-50">
      
      <div>
        {/* Brand / Identity Headers */}
        <div className="flex items-center gap-3 pb-5 mb-6 border-b-2 border-slate-100">
          <div className="w-9 h-9 flex items-center justify-center bg-slate-50 border-2 border-slate-200 rounded-full p-1 shadow-sm">
            <img 
              src={logo_no_bg} 
              alt="Matienzo Dental Clinic Logo" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900">
              Matienzo Dental Clinic
            </span>
            <span className="text-xs font-semibold text-blue-600">
            </span>
          </div>
        </div>

        {/* Navigation Option Items List */}
        <nav className="space-y-5">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 block mb-1">
                {group.groupName}
              </span>
              
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === '/user/dashboard'} 
                    className={({ isActive }) =>
                      `w-full flex items-center justify-between px-3 py-2.5 rounded-r-full text-[14px] tracking-wide transition-all ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 font-bold -ml-5 pl-8' 
                          : 'text-slate-700 font-semibold hover:text-slate-950 hover:bg-slate-100'
                      }`
                    }
                  >
                    <span>{item.label}</span>
                    
                    {item.badge && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Status Profile Bar */}
      <div className="pt-4 mt-6 border-t-2 border-slate-200 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          
          <div className={`w-9 h-9 ${getAvatarBgColor()} text-white text-xs font-black flex items-center justify-center rounded-full shrink-0 shadow-sm uppercase tracking-wider select-none`}>
            {getInitials()}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            {/* 🔑 FIXED: Removed 'truncate' and added 'break-words leading-tight' so long names wrap fully */}
            <span className="text-xs font-bold text-slate-950 wrap-break-word leading-tight block">
              {user ? `${user.firstName} ${user.lastName}` : "Guest User"}
            </span>
            <span className="text-xs font-medium text-slate-500"></span>
          </div>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="text-slate-700 font-bold hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0"
        >
          Sign out
        </button>
      </div>

    </aside>
  );
};

export default ConsoleSidebar;