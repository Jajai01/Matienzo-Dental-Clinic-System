import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-[#111111] text-white py-12 px-6 font-sans text-sm tracking-wide">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        
        {/* Left Side: Navigation Links from image_a169fb.png */}
        <div className="flex flex-col space-y-4 text-left min-w-37.5">
          <Link to="/services" className="hover:text-[#D4AF37] transition-colors text-slate-300">
            Services
          </Link>
          <Link to="/contact" className="hover:text-[#D4AF37] transition-colors text-slate-300">
            Contact
          </Link>
          <Link to="/about" className="hover:text-[#D4AF37] transition-colors text-slate-300">
            About
          </Link>
          {/* Maintained the layout spelling 'Regiter' from mockup if desired, or change to Register */}
          <Link to="/register" className="hover:text-[#D4AF37] transition-colors text-slate-300">
            Register
          </Link>
          <Link to="/login" className="hover:text-[#D4AF37] transition-colors text-slate-300">
            Log in
          </Link>
        </div>

        {/* Right Side: Contact Details & Interactive Badges */}
        <div className="flex flex-col space-y-5 text-left max-w-md md:text-left">
          <div>
            <p className="text-slate-300 mb-2">You can also contact us through:</p>
            <div className="flex items-center gap-3">
              
              {/* Gmail Icon Link */}
              <a 
                href="mailto:matienzoanne1234@gmail.com" 
                className="hover:scale-110 transition-transform"
                title="Email us"
              >
                <svg className="w-7 h-7" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M45 16.2V38c0 2.2-1.8 4-4 4H34V24L24 31L14 24V42H7c-2.2 0-4-1.8-4-4V16.2c0-1.7 1-3.2 2.5-3.8l16.5-6.6c1.3-.5 2.7-.5 4 0l16.5 6.6c1.5.6 2.5 2.1 2.5 3.8z" fill="#E41E26"/>
                  <path d="M34 42h7c2.2 0 4-1.8 4-4V16.2c0-1.7-1-3.2-2.5-3.8L34 19v23z" fill="#B6151A"/>
                  <path d="M34 24v18H14V24l10 7 10-7z" fill="#EAEAEA"/>
                  <path d="M14 42H7c-2.2 0-4-1.8-4-4V16.2c0-1.7 1-3.2 2.5-3.8L14 19v23z" fill="#C9181E"/>
                  <path d="M24 28L3 13.5V16.2c0 1.7 1 3.2 2.5 3.8L24 28z" fill="#9F1014"/>
                  <path d="M24 28l21-14.5V16.2c0 1.7-1 3.2-2.5 3.8L24 28z" fill="#9F1014"/>
                </svg>
              </a>

              {/* Facebook Icon Link */}
              <a 
                href="https://web.facebook.com/drannedumasmatienzo" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:scale-110 transition-transform"
                title="Visit our Facebook page"
              >
                <svg className="w-7 h-7 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

            </div>
          </div>

          {/* Physical Address Details */}
          <div className="text-slate-300 space-y-1 text-xs sm:text-sm font-light leading-relaxed">
            <p className="font-medium text-white">For walk-ins find us at</p>
            <p>Clinic Address: Matienzo Compound,</p>
            <p>Sitio 1 Brgy San Juan, Santa Cruz,</p>
            <p>Laguna</p>
            <p className="text-slate-400 italic mt-1">( In Front of Emilio Jacinto Shrine )</p>
          </div>
        </div>

      </div>

      {/* Center Base Copyright Statement */}
      <div className="w-full text-center text-xs text-slate-500 mt-12 border-t border-slate-800/60 pt-6">
        © 2026 Matienzo Dental Clinic . All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;