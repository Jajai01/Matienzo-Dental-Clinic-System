import React from 'react';
import logoWithBg from "../assets/logo.jpg";

const QuoteSection = () => {
  return (
    <>
      {/* Dynamic Google Fonts injection for the elegant cursive serif script */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,500&display=swap');
          .elegant-script {
            font-family: 'Playfair Display', serif;
            font-style: italic;
          }
        `}
      </style>

      {/* Increased height to custom pixel ranges (500px to 600px) to make the section much taller and grander */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 h-125 lg:h-150 overflow-hidden">
        
        {/* Left Panel: Solid Black Logo Display */}
        <div className="bg-black flex items-center justify-center p-12 h-full">
          {/* Upped container size to let the emblem graphic scale naturally inside the taller section */}
          <div className="w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 flex items-center justify-center">
            <img 
              src={logoWithBg} 
              alt="Matienzo Dental Clinic Logo with Background" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Right Panel: Soft Cream Stylized Typography */}
        <div className="bg-[#F3E5AB]/50 flex items-center pl-12 pr-6 sm:pl-20 lg:pl-28 py-12 h-full">
          {/* Text sizes bumped to text-4xl / text-6xl to match the new majestic height scales perfectly */}
          <blockquote className="elegant-script text-4xl sm:text-5xl lg:text-6xl text-slate-900 font-medium tracking-wide max-w-md lg:max-w-xl leading-[1.4]">
            “Gentle care <br /> 
            for a <br /> 
            lifetime <br /> 
            of smiles.”
          </blockquote>
        </div>

      </section>
    </>
  );
};

export default QuoteSection;