import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import logo_no_bg from "../assets/logo_no_bg.png";

const AdminSidebar = ({ admin, setAdmin }) => {
  const navigate = useNavigate();
  
  // State for badges
  const [pendingCount, setPendingCount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [messageBadgeCount, setMessageBadgeCount] = useState(0); // 🔑 Unique patients messaging badge

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        // 1. Fetch appointments for appointment & billing badges
        const aptRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/appointments/appointments`);
        if (aptRes.data && aptRes.data.appointments) {
          const allAppointments = aptRes.data.appointments;

          const activeAppointments = allAppointments.filter(
            apt => apt.status === 'Pending Review' || apt.status === 'Confirmed'
          );
          setPendingCount(activeAppointments.length);

          const unpaidBilling = allAppointments.filter(apt => {
            const status = (apt.status || "").trim().toLowerCase();
            const paymentStatus = (apt.paymentStatus || "").trim().toLowerCase();
            return status === "confirmed" && paymentStatus !== "paid";
          });
          setUnpaidCount(unpaidBilling.length);
        }

        // 2. Fetch support/chat messages to count unique patients who messaged
        const msgRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/support/messages`); 
        const messages = msgRes.data?.messages || msgRes.data || [];
        
        if (Array.isArray(messages)) {
          // Count unique patients who sent messages
          const uniquePatients = new Set(
            messages
              .filter(msg => msg.senderModel === 'User' || msg.senderType === 'patient' || !msg.isAdmin)
              .map(msg => msg.patientId || msg.userId || msg.email || msg.sender)
          );
          setMessageBadgeCount(uniquePatients.size);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar badge data", error);
      }
    };

    fetchSidebarData();
    
    // Poll every 30 seconds to keep live chat counts updated
    const interval = setInterval(fetchSidebarData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminLogout = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/doctor-status`, { 
        isActive: false 
      });
    } catch (error) {
      console.error("Failed to update doctor offline status:", error);
    }

    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData'); 
    
    if (setAdmin) {
      setAdmin(null);
    }
    
    navigate('/admin'); 
  };

  const adminMenuGroups = [
    {
      groupName: "Main",
      items: [
        { 
          id: 'admin-dashboard', 
          label: 'Dashboard', 
          path: '/admin-dashboard',
          badge: messageBadgeCount > 0 ? messageBadgeCount : null // 🔑 Moved chat message badge here
        }
      ]
    },
    {
      groupName: "Patient Intake",
      items: [
        { 
          id: 'admin-appointments', 
          label: 'Appointments', 
          path: '/admin-appointments', 
          badge: pendingCount > 0 ? pendingCount : null 
        },
        { id: 'admin-walkin', label: 'Walk-in Appointment', path: '/admin-walk-in' }
      ]
    },
    {
      groupName: "Clinical History",
      items: [
        { id: 'admin-records', label: 'Patient Records', path: '/admin-records' },
        { id: 'admin-prescriptions', label: 'Prescription', path: '/admin-prescriptions' }
      ]
    },
    {
      groupName: "Financial Ledgers",
      items: [
        { id: 'admin-receipt', label: 'Make Receipt', path: '/admin-receipts' },
        { 
          id: 'admin-billing', 
          label: 'Billing & Invoices', 
          path: '/admin-billings',
          badge: unpaidCount > 0 ? unpaidCount : null 
        },
        { id: 'admin-installments', label: 'Installments', path: '/admin/installments' }
      ]
    },
    {
      groupName: "Management",
      items: [
        { id: 'admin-analytics', label: 'Statistics & Analytics', path: '/admin-statistics' },
        { id: 'admin-inventory', label: 'Inventory & Supplies', path: '/admin-inventory' },
        { id: 'admin-broadcast', label: 'Email Broadcast', path: '/admin-broadcast' },
        { id: 'admin-testimonials', label: 'Patient Testimonials', path: '/admin-testimonials' },
        { id: 'admin-settings', label: 'Settings', path: '/admin-settings' },
        { id: 'admin-support', label: 'Help & Support', path: '/admin-support' }
      ]
    }
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-5 select-none font-sans shrink-0 overflow-y-auto z-40 text-slate-200">
      
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-5 mb-6 border-b border-slate-800">
          <div className="w-9 h-9 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full p-1 shadow-sm">
            <img 
              src={logo_no_bg} 
              alt="Matienzo Dental Clinic Logo" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white">
              Matienzo Dental
            </span>
            <span className="text-xs font-bold text-[#D4AF37] tracking-wide uppercase">
              Admin Console
            </span>
          </div>
        </div>

        {/* Navigation Stream */}
        <nav className="space-y-5">
          {adminMenuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1">
                {group.groupName}
              </span>
              
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === '/admin-dashboard'} 
                    className={({ isActive }) =>
                      `w-full flex items-center justify-between px-3 py-2 rounded-r-full text-[13px] tracking-wide transition-all ${
                        isActive 
                          ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-bold -ml-5 pl-8 border-l-2 border-[#D4AF37]' 
                          : 'text-slate-400 font-semibold hover:text-white hover:bg-slate-900'
                      }`
                    }
                  >
                    <span>{item.label}</span>
                    
                    {/* Badge Rendering */}
                    {item.badge && (
                      <span className="bg-[#D4AF37] text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
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

      {/* Admin Identity Status */}
      <div className="pt-4 mt-6 border-t border-slate-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white truncate max-w-30 block">
            {admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}` : "System Admin"}
          </span>
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span> 
            Session Live
          </span>
        </div>
        
        <button 
          onClick={handleAdminLogout}
          className="text-slate-400 font-bold hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
        >
          Exit
        </button>
      </div>

    </aside>
  );
};

export default AdminSidebar;