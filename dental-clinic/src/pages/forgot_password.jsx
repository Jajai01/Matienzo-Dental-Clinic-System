import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo_no_bg from "../assets/logo_no_bg.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      // 🔑 Calls your backend route to generate the token and send the email
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
      setMessage(response.data.message || 'If an account with that email exists, a reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      <div className="mb-6">
        <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-[#D4AF37] transition-colors flex items-center gap-2">
          ← Back to Login
        </Link>
      </div>

      <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-4xl shadow-xl border border-slate-100 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D4AF37]"></div>

        <div className="w-24 h-24 flex items-center justify-center mb-4">
          <img src={logo_no_bg} alt="Matienzo Dental Clinic Logo" className="max-w-full max-h-full object-contain scale-125" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed">
            Enter the email address associated with your account and we will send you a secure link to reset your password.
          </p>
        </div>

        {message && <div className="w-full bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-xl p-3 mb-4 border border-emerald-100 text-center animate-fadeIn">{message}</div>}
        {error && <div className="w-full bg-red-50 text-red-600 text-xs font-semibold rounded-xl p-3 mb-4 border border-red-100 text-center animate-fadeIn">{error}</div>}

        <form onSubmit={handleForgotPassword} className="w-full space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 tracking-wide block">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="name@example.com"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all bg-slate-50/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#1A1510] text-[#D4AF37] hover:bg-[#2A231B] disabled:bg-slate-300 disabled:text-slate-500 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-lg text-center"
            >
              {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;