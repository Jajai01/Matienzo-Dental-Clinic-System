import React from 'react';
import yearsIcon from "../assets/Ribbons/24_years.png";
import patientsIcon from "../assets/Ribbons/Patient_icon.png";
import toothIcon from "../assets/Ribbons/tooth.png";

const RibbonSection = () => {
  return (
    <section className="w-full bg-white py-6 border-b border-slate-100 font-sans">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 items-start justify-items-center text-center">
        
        {/* Item 1: Services */}
        <div className="flex flex-col items-center max-w-45">
          <div className="w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center mb-2">
            <img 
              src={toothIcon} 
              alt="Tooth icon" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <p className="text-xs lg:text-sm font-medium text-slate-800 leading-tight">
            7 services
          </p>
        </div>

        {/* Item 2: Experience */}
        <div className="flex flex-col items-center max-w-45">
          <div className="w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center mb-2">
            <img 
              src={yearsIcon} 
              alt="24 Years icon" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <p className="text-xs lg:text-sm font-medium text-slate-800 leading-tight">
            More than two decades in service
          </p>
        </div>

        {/* Item 3: Patients */}
        <div className="flex flex-col items-center max-w-45">
          <div className="w-20 h-20 lg:w-24 lg:h-24 flex items-center justify-center mb-2">
            <img 
              src={patientsIcon} 
              alt="Patients icon" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <p className="text-xs lg:text-sm font-medium text-slate-800 leading-tight">
            500+ Patients
          </p>
        </div>

      </div>
    </section>
  );
};

export default RibbonSection;