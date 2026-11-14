import React from 'react';

// Importing assets from the services_pictures directory based on image_a004fc.png
import cleaningImg from '../assets/services_pictures/cleaning.png';
import consultationImg from '../assets/services_pictures/consultation.png';
import denturesImg from '../assets/services_pictures/dentures_removal.png';
import fixedBridgeImg from '../assets/services_pictures/fixed_bridge.png';
import pastaImg from '../assets/services_pictures/pasta.png';
import toothExtractionImg from '../assets/services_pictures/tooth_extraction.png';
import wisdomExtractionImg from '../assets/services_pictures/wisdom_extraction.png';

const ServicesSection = () => {
  // Array holding the text configurations matching image_9ffdb7.png
  const servicesList = [
    {
      id: 1,
      title: "Consultation",
      subtitle: "",
      image: consultationImg,
    },
    {
      id: 2,
      title: "Oral Prophylaxis",
      subtitle: "(Cleaning)",
      image: cleaningImg,
    },
    {
      id: 3,
      title: "Tooth Restoration",
      subtitle: "(Pasta)",
      image: pastaImg,
    },
    {
      id: 4,
      title: "Tooth Extraction",
      subtitle: "(Bunot)",
      image: toothExtractionImg,
    },
    {
      id: 5,
      title: "Removable Dentures",
      subtitle: "(Pustiso)",
      image: denturesImg,
    },
    {
      id: 6,
      title: "Oral Surgery",
      subtitle: "(wisdom tooth removal)",
      image: wisdomExtractionImg,
    },
    {
      id: 7,
      title: "Fixed Bridge and Jacket Crown",
      subtitle: "",
      image: fixedBridgeImg,
    },
  ];

  return (
    <section className="w-full bg-white py-12 px-6 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Main Title Head */}
        <h2 className="text-4xl font-bold text-center text-black mb-12 tracking-tight">
          Services
        </h2>

        {/* Dynamic Card Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center">
          {servicesList.map((service) => (
            <div 
              key={service.id} 
              className={`bg-white border border-slate-200 rounded-[2.5rem] shadow-md hover:shadow-lg transition-shadow p-5 flex flex-col items-center justify-between text-center w-64 h-72 ${
                service.id === 7 ? "md:col-span-3 md:mx-auto" : ""
              }`}
            >
              {/* Card Thumbnail Frame */}
              <div className="w-full h-40 bg-slate-50 rounded-3xl overflow-hidden flex items-center justify-center">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text Meta Fields */}
              <div className="mt-4 flex flex-col justify-center items-center grow">
                <h3 className="text-base font-semibold leading-snug text-slate-900">
                  {service.title}
                </h3>
                {service.subtitle && (
                  <p className="text-sm font-medium text-slate-700 mt-0.5">
                    {service.subtitle}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ServicesSection;