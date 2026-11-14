import React from 'react';
import { Link } from 'react-router-dom';
import logo_no_bg from "../assets/logo_no_bg.png";
import hero_page from "../assets/Hero_Page.png"; 
import ModernNavbar from './Navbar';

// Importing assets from the services_pictures folder
import fixedBridgeImg from '../assets/services_pictures/fixed_bridge.png';
import pastaImg from '../assets/services_pictures/pasta.png';
import toothExtractionImg from '../assets/services_pictures/tooth_extraction.png';
import denturesRemovalImg from '../assets/services_pictures/dentures_removal.png';
import wisdomExtractionImg from '../assets/services_pictures/wisdom_extraction.png';
import consultationImg from '../assets/services_pictures/consultation.png'; 
import cleaning from '../assets/services_pictures/cleaning.png'; 
import Footer from '../components/footer';

const ServicePage = () => {
  // Service list array
  const servicesList = [
    {
      id: 1,
      title: "Consultation",
      description: "A comprehensive assessment of your oral health. Using advanced diagnostics, we identify potential issues early and discuss the best treatment options to keep your teeth in top shape.",
      image: consultationImg,
      isReversed: false,
    },
    {
      id: 2,
      title: "Oral Prophylaxis (Cleaning)",
      description: "The ultimate defense against cavities and gum disease. Professional dental cleaning keeps your teeth bright, your gums healthy, and your breath fresh. A simple routine visit that saves your smile for the long run.",
      image: cleaning,
      isReversed: true,
    },
    {
      id: 3,
      title: "Tooth Restoration (Pasta)",
      description: "Stop tooth decay before it turns into a painful problem. Our gentle restoration process cleans out cavities and seals your teeth, protecting them from further damage and bringing back your comfortable, worry-free bite.",
      image: pastaImg,
      isReversed: false,
    },
    {
      id: 4,
      title: "Tooth Extraction (Bunot)",
      description: "When a tooth can no longer be saved, a safe extraction is the best way to protect your overall oral health. We ensure a smooth, precise procedure that prevents infections from spreading, paving the way for a healthier mouth.",
      image: toothExtractionImg,
      isReversed: true,
    },
    {
      id: 5,
      title: "Removable Dentures (Pustiso)",
      description: "A beautiful, complete smile is still within reach. We create high-quality, durable dentures tailored specifically to the unique shape of your jaw. Enjoy a secure, comfortable fit that perfectly restores both your facial structure and chewing power.",
      image: denturesRemovalImg,
      isReversed: false,
    },
    {
      id: 6,
      title: "Oral Surgery (Wisdom Tooth Removal)",
      description: "Advanced care for complex dental needs. From wisdom teeth removal to corrective procedures, our oral surgery services are performed with the highest surgical safety standards, precise techniques, and gentle care to ensure a smooth, comfortable recovery.",
      image: wisdomExtractionImg,
      isReversed: true,
    },
    {
      id: 7,
      title: "Fixed Bridge and Jacket Crown",
      description: "Permanent solutions for missing or heavily damaged teeth. Our high-quality crowns and bridges restore full biting power, support your natural facial structure, and prevent neighboring teeth from shifting, giving you a strong, lifetime smile.",
      image: fixedBridgeImg,
      isReversed: false,
    }
  ];

  // Price List categories extracted from PDA Laguna Chapter Guidelines
  const priceCategories = [
    {
      category: "Consultation & Preventive",
      items: [
        { name: "Consultation (Asepsis Fee Included)", price: "₱700.00" },
        { name: "Oral Prophylaxis - Light", price: "₱1,000.00" },
        { name: "Oral Prophylaxis - Moderate", price: "₱1,500.00" },
        { name: "Oral Prophylaxis - Heavy", price: "₱2,000.00" },
        { name: "Diagnostic X-Ray (Panoramic / Cephalometric)", price: "₱1,200.00" },
        { name: "Periapical X-Ray", price: "₱500.00" }
      ]
    },
    {
      category: "Restorative & Fillings",
      items: [
        { name: "Light Cured Restoration (Class I)", price: "₱1,000.00" },
        { name: "Light Cured Restoration (Class II / III)", price: "₱1,500.00" },
        { name: "Light Cured Restoration (Class IV)", price: "₱2,000.00" },
        { name: "Temporary Filling", price: "₱1,000.00" },
        { name: "Glass Ionomer Filling", price: "₱1,000.00 / scoop" },
        { name: "Diastema Closure (per surface)", price: "₱3,000.00" }
      ]
    },
    {
      category: "Surgery & Extractions",
      items: [
        { name: "Simple Tooth Extraction (Anterior)", price: "₱1,000.00" },
        { name: "Simple Tooth Extraction (Posterior)", price: "₱2,000.00" },
        { name: "Third Molar Extraction / Wisdom Tooth", price: "₱3,500.00" },
        { name: "Complicated Extraction (Without Bone Reduction)", price: "₱2,500.00" },
        { name: "Odontectomy", price: "₱15,000.00" },
        { name: "Suturing", price: "₱500.00" }
      ]
    },
    {
      category: "Crowns, Bridges & Root Canal",
      items: [
        { name: "Plastic Jacket Crown", price: "₱5,000.00 / unit" },
        { name: "Porcelain Fused to Metal (Non-Precious)", price: "₱8,500.00 / unit" },
        { name: "All Porcelain / Emax Crown", price: "₱25,000++ / unit" },
        { name: "Root Canal Treatment", price: "₱10,000+++ / canal" },
        { name: "Post and Core (Fiber Post)", price: "₱5,000.00 / unit" }
      ]
    }
  ];

  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between">
      
      {/* --- HERO SECTION WITH BACKGROUND --- */}
      <div 
        className="relative w-full min-h-[85vh] lg:min-h-screen bg-cover bg-right md:bg-center bg-no-repeat overflow-hidden font-sans text-slate-800 flex flex-col justify-between shadow-sm"
        style={{ backgroundImage: `url(${hero_page})` }}
      >
        <header className="w-full max-w-7xl mx-auto px-6 pt-4 flex items-start justify-between relative z-50 shrink-0">
          <div className="p-3 w-40 h-40 lg:w-36 lg:h-36 flex items-center justify-center">
            <img 
              src={logo_no_bg} 
              alt="Matienzo Dental Clinic Logo" 
              className="max-w-full max-h-full object-contain scale-150"
            />
          </div>
          <ModernNavbar page="services" />
        </header>

        <main className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 items-center grow relative z-10 pb-16 lg:pb-24">
          <div className="max-w-md space-y-6 bg-white/30 backdrop-blur-[1px] p-6 rounded-2xl md:bg-transparent md:backdrop-blur-none">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.2]">
              Check out services offered <br />
              by <span className="text-[#D4AF37]">Matienzo Dental Clinic</span>
            </h1>
            <div className="pt-2">
              <Link 
                to="/register" 
                className="inline-block bg-black text-[#D4AF37] hover:bg-[#1A1510] px-8 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg whitespace-nowrap text-center"
              >
                Book an Appointment
              </Link>
            </div>
          </div>
          <div className="hidden md:block pointer-events-none h-full" aria-hidden="true" />
        </main>
      </div>

      {/* --- SERVICES EXPLANATION SECTION --- */}
      <section className="w-full bg-white py-20 px-6 font-sans">
        <div className="max-w-5xl mx-auto">
          
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-20 tracking-wide">
            Services
          </h2>

          <div className="space-y-24 md:space-y-32">
            {servicesList.map((service) => (
              <div 
                key={service.id}
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center ${
                  service.isReversed ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={`w-full max-w-md mx-auto aspect-4/3 rounded-4xl overflow-hidden shadow-sm bg-slate-50 ${
                  service.isReversed ? 'md:order-last' : 'md:order-first'
                }`}>
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>

                <div className="space-y-4 max-w-md mx-auto md:mx-0">
                  <div className="inline-block">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {service.title}
                    </h3>
                    <div className="w-16 h-1 bg-black mt-1 rounded"></div>
                  </div>
                  <p className="text-sm lg:text-base text-slate-700 font-normal leading-relaxed text-justify">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* --- OFFICIAL PRICE LIST BOARD SECTION --- */}
          <div className="mt-32">
            <div className="text-center mb-12">
              <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase bg-black/5 px-3 py-1 rounded-full">Transparent Pricing</span>
              <h3 className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">Recommended Dental Service Fees</h3>
              <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">Standard minimum rates following professional dental association guidelines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {priceCategories.map((cat, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center justify-between">
                    <span>{cat.category}</span>
                  </h4>
                  <div className="space-y-3">
                    {cat.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 pr-4">{item.name}</span>
                        <span className="font-semibold text-slate-900 whitespace-nowrap bg-white px-3 py-1 rounded-xl shadow-2xs border border-slate-100">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prices Vary Disclaimer Notice */}
          <div className="mt-16 text-left border-t border-slate-100 pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-red-600 text-sm md:text-base font-semibold tracking-wide italic">
              * Prices may vary depending on the scope of operation and clinical requirements. Dental X-rays are not included unless specified.
            </p>
            <Link 
              to="/register" 
              className="bg-black text-[#D4AF37] hover:bg-[#1A1510] px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm whitespace-nowrap"
            >
              Book Consultation Now
            </Link>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServicePage;