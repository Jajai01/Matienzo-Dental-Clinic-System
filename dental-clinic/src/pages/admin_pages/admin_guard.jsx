import React from 'react';
import { Link } from 'react-router-dom';

const AdminGuard = ({ admin, children }) => {
  // If admin state is null or empty, intercept navigation and show a crisp security alert
  if (!admin) {
    return (
      <div className="w-full min-h-screen bg-[#1A1510] flex flex-col justify-center items-center p-6 font-sans text-center relative overflow-hidden">
        {/* Decorative alert ambient background lights */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-[#231D19] w-full max-w-md p-8 md:p-10 rounded-4xl shadow-2xl border border-red-950/30 flex flex-col items-center relative z-10">
          {/* Crimson Warning Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600 rounded-t-4xl"></div>

          {/* Secure Shield Icon Aspect */}
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4 border border-red-500/20">
            ⚠️
          </div>

          <h1 className="text-xl font-black text-white tracking-wider uppercase mb-2">
            403 - Not Authorized
          </h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
            Access Denied. This zone is strictly restricted to authorized clinic staff. Please log in with valid system administrative credentials to proceed.
          </p>

          <Link
            to="/admin"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-full font-bold text-xs tracking-widest uppercase transition-all shadow-lg active:scale-[0.99]"
          >
            Go to Admin Login →
          </Link>
        </div>
      </div>
    );
  }

  // If authorized, seamlessly load the protected component
  return children;
};

export default AdminGuard;