import React, { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import logo_no_bg from "../assets/logo_no_bg.png";

const AdminLoginPage = ({admin, setAdmin}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => { 
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/admin`, { email, password });

      if (response.status === 200 && response.data.token) {
        
        // 🔑 1. Tell the server the doctor is now ONLINE
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/doctor-status`, { 
            isActive: true 
          });
        } catch (statusError) {
          console.error("Failed to update doctor online status, but login will proceed.", statusError);
        }

        // 2. Save BOTH the token and the admin data stringified
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminData', JSON.stringify(response.data.success)); 
        
        setAdmin(response.data.success);
        navigate('/admin-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid admin credentials. Please try again.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#1A1510] flex flex-col justify-center items-center p-6 font-sans relative overflow-hidden">
      {/* Decorative Geometric Background Gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Back to Patient Site Link */}
      <div className="mb-6 z-10">
        <Link 
          to="/" 
          className="text-xs font-bold text-slate-400 hover:text-[#D4AF37] transition-colors flex items-center gap-2 tracking-wide uppercase"
        >
          ← Return to Main Website
        </Link>
      </div>

      {/* Main Administrative Secure Card Frame */}
      <div className="bg-[#231D19] w-full max-w-md p-8 md:p-10 rounded-[2rem] shadow-2xl border border-slate-800 flex flex-col items-center relative z-10">
        
        {/* Subtle Top Indicator Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D4AF37] rounded-t-[2rem]"></div>

        {/* Brand Logo Display */}
        <div className="w-24 h-24 flex items-center justify-center mb-3 bg-white/5 rounded-full p-3 border border-slate-700/50">
          <img 
            src={logo_no_bg} 
            alt="Matienzo Dental Clinic Logo" 
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Heading Panel */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-black text-white tracking-widest uppercase">
            Admin Console
          </h1>
          <div className="h-0.5 w-12 bg-[#D4AF37] mx-auto mt-2 rounded"></div>
          <p className="text-[11px] font-semibold text-slate-400 mt-2 tracking-wide">
            Authorized Personnel Gateway Only
          </p>
        </div>

        {error && (
          <div className="w-full bg-red-500/10 text-red-400 text-xs font-semibold rounded-xl p-3 mb-4 border border-red-500/20 text-center animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="w-full space-y-5">
          
          {/* Admin ID / Email Field Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block">
              Admin Email
            </label>
            <input 
              type="email" 
              required
              placeholder="admin@matienzodental.com"
              className="w-full border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all bg-[#1A1510]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Secure Passphrase Field Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 tracking-wider uppercase block">
              Security Passphrase
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••••••"
              className="w-full border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all bg-[#1A1510]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Verification Multi-Factor Note Area */}
          <div className="bg-[#1A1510] border border-slate-800 p-3 rounded-xl text-[11px] text-slate-400 font-medium leading-relaxed">
            💡 <span className="text-slate-300 font-bold">Security Note:</span> Session token data will automatically expire after 2 hours of inactivity to secure client medical profiles.
          </div>

          {/* Administrative Execution Trigger Button */}
          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full bg-[#D4AF37] text-[#1A1510] hover:bg-[#e5c14e] py-3.5 rounded-full font-black text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-[#D4AF37]/10 active:scale-[0.99]"
            >
              Authenticate & Enter →
            </button>
          </div>
        </form>
      </div>

      {/* Console Copyright Notice Container */}
      <div className="text-center mt-8 space-y-1 z-10">
        <p className="text-[10px] text-slate-600 tracking-widest">
          © 2026 MATIENZO DENTAL CLINIC MANAGEMENT NODE
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;