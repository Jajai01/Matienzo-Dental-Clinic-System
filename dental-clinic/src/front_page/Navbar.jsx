import React from 'react';
import { Link } from 'react-router-dom'; 

const ModernNavbar = ({ page }) => {
  return (
    <div className="w-full flex justify-end p-4 font-sans">
      {/* Unified Pill-Shaped Container */}
      <div className="bg-white rounded-full shadow-lg px-8 py-3 flex items-center gap-10 border border-slate-100 w-full max-w-4xl justify-between">
        
        {/* Navigation Links Group */}
        <nav className="flex items-center gap-20 text-xs lg:text-sm font-semibold text-[#D4AF37]">
          
          {/* Home Link */}
          <div className="relative py-1">
            <Link to="/" className={`transition-opacity ${page === 'home' ? 'opacity-100' : 'hover:opacity-80 text-opacity-80'}`}>
              Home
            </Link>
            {page === 'home' && (
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-600 rounded"></div>
            )}
          </div>

          {/* Services Link */}
          <div className="relative py-1">
            <Link to="/services" className={`transition-opacity ${page === 'services' ? 'opacity-100' : 'hover:opacity-80 text-opacity-80'}`}>
              Services
            </Link>
            {page === 'services' && (
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-600 rounded"></div>
            )}
          </div>

          {/* About Link */}
          <div className="relative py-1">
            <Link to="/about" className={`transition-opacity ${page === 'about' ? 'opacity-100' : 'hover:opacity-80 text-opacity-80'}`}>
              About
            </Link>
            {page === 'about' && (
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-600 rounded"></div>
            )}
          </div>

          {/* Contact Link */}
          <div className="relative py-1">
            <Link to="/contact" className={`transition-opacity ${page === 'contact' ? 'opacity-100' : 'hover:opacity-80 text-opacity-80'}`}>
              Contact
            </Link>
            {page === 'contact' && (
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-600 rounded"></div>
            )}
          </div>

        </nav>

        {/* Action Buttons Group */}
        <div className="flex items-center gap-3">
          <Link to="/register" className="bg-[#1A1510] text-[#D4AF37] hover:bg-[#2A231B] px-8 py-2 rounded-full text-xs lg:text-sm font-bold tracking-wide transition-colors whitespace-nowrap text-center">
            Register
          </Link>
          <Link to="/login" className="bg-[#1A1510] text-[#D4AF37] hover:bg-[#2A231B] px-6 py-2 rounded-full text-xs lg:text-sm font-bold tracking-wide transition-colors whitespace-nowrap text-center">
            Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ModernNavbar;