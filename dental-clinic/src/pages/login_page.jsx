import React, { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import logo_no_bg from "../assets/logo_no_bg.png";

const LoginPage = ({ user, setUser, setAdmin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setErrorMessage(''); 
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      const { role, user: loggedInUser, token } = response.data;

      // 🔑 1. ADMIN BRANCH: Route to admin dashboard if role is admin
      if (role === 'admin') {
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminData', JSON.stringify(loggedInUser));
        if (setAdmin) setAdmin(loggedInUser);
        navigate('/admin-dashboard');
        return;
      }

      // 🔑 2. PATIENT BRANCH: Handle patient online status and dashboard routing
      if (loggedInUser) {
        try {
          await axios.patch(`${import.meta.env.VITE_API_URL}/api/users/status/${loggedInUser.patientId}`, { 
            status: 'online' 
          });
          loggedInUser.isOnline = true;
        } catch (statusError) {
          console.error("Failed to set online status on login", statusError);
        }

        localStorage.setItem('userData', JSON.stringify(loggedInUser));
        setUser(loggedInUser); 
        
        navigate(`/user/dashboard/${loggedInUser.patientId}`); 
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Invalid email or password');
      console.error("Login error:", error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      
      {/* Decorative Top Back-to-Home Indicator link */}
      <div className="mb-6">
        <Link 
          to="/" 
          className="text-xs font-semibold text-slate-500 hover:text-[#D4AF37] transition-colors flex items-center gap-2"
        >
          ← Back to Homepage
        </Link>
      </div>

      {/* Main Login Card Frame */}
      <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-4xl shadow-xl border border-slate-100 flex flex-col items-center relative overflow-hidden">
        
        {/* Subtle top accent border line in gold */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D4AF37]"></div>

        {/* Branding Logo Block */}
        <div className="w-28 h-28 flex items-center justify-center mb-4">
          <img 
            src={logo_no_bg} 
            alt="Matienzo Dental Clinic Logo" 
            className="max-w-full max-h-full object-contain scale-125"
          />
        </div>

        {/* Heading Typography Area */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Please log in to access your portal
          </p>
        </div>

        {errorMessage && (
          <div className="w-full bg-red-50 text-red-600 text-xs font-semibold rounded-xl p-3 mb-4 border border-red-100 text-center animate-fadeIn">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-5">
          
          {/* Email Input Field Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 tracking-wide block">
              Email Address
            </label>
            <input 
              type="email" 
              required
              placeholder="name@example.com"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all bg-slate-50/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Input Field Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 tracking-wide block">
              Password
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all bg-slate-50/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Layout Row: Remember Me & Forgot Password Anchor links */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-[#1A1510] rounded border-slate-300 focus:ring-0 cursor-pointer"
              />
              Remember me
            </label>
            <Link 
              to="/forgot-password" 
              className="text-[#D4AF37] hover:underline font-bold transition-all"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Main Action Button using clinic brand colors */}
          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full bg-[#1A1510] text-[#D4AF37] hover:bg-[#2A231B] py-3.5 rounded-full font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg text-center active:scale-[0.99]"
            >
              Login
            </button>
          </div>

        </form>

        {/* Footer Redirect Navigation */}
        <div className="text-xs text-slate-500 text-center mt-8 font-medium">
          Don't have an account yet?{' '}
          <Link 
            to="/register" 
            className="text-[#D4AF37] hover:underline font-bold transition-all ml-1"
          >
            Register here
          </Link>
        </div>

      </div>

      {/* Copyright Notice */}
      <p className="text-[10px] text-slate-400 text-center mt-6 tracking-wider">
        © 2026 Matienzo Dental Clinic. All rights reserved.
      </p>

    </div>
  );
};

export default LoginPage;