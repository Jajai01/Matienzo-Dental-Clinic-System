import React, { useState, useEffect } from 'react';
import logo_no_bg from "../assets/logo_no_bg.png";
import hero_page from "../assets/Hero_Page.png";
import ModernNavbar from './Navbar';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

import RibbonSection from '../components/Ribbon';
import ServicesSection from '../components/services_section';
import QuoteSection from '../components/qoute';
import GallerySlideshow from '../components/galery';
import VideoEvidence from '../components/videos';
import Footer from '../components/footer';

const HomePage = () => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [approvedTestimonials, setApprovedTestimonials] = useState([]);
  
  // Feedback Form State
  const [feedbackForm, setFeedbackForm] = useState({ name: '', message: '', rating: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  // Fetch approved reviews on load
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/testimonials/approved`);
        if (res.data.success) {
          setApprovedTestimonials(res.data.testimonials);
        }
      } catch (err) {
        console.error("Failed to load testimonials");
      }
    };
    fetchReviews();
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/testimonials`, feedbackForm);
      if (res.data.success) {
        toast.success(res.data.message);
        setFeedbackForm({ name: '', message: '', rating: 5 });
      }
    } catch (error) {
      toast.error("Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    { question: "What are your clinic operating hours?", answer: "We are open from Monday to Sunday, 8:00 AM to 4:00 PM." },
    { question: "Do you accept walk-in patients?", answer: "Yes, walk-ins are welcome! Booking an appointment online is recommended." },
    { question: "What payment methods do you accept?", answer: "We accept Cash, GCash and Bank Transfer. Transactions should be paid in person." },
    { question: "How do I access my dental records?", answer: "Register for a Patient Account to view your medical history and prescriptions." }
  ];

  // Common Conditions & Treatments Data
  const conditionsAndTreatments = [
    {
      condition: "Tooth Decay (Cavities)",
      symptoms: "Toothache, visible holes, or sensitivity to sweet, hot, or cold foods.",
      treatment: "Tooth Restoration (Pasta)",
      treatmentDesc: "We clean out the decay and seal the tooth with composite resin to restore its strength and appearance."
    },
    {
      condition: "Bleeding Gums (Gingivitis)",
      symptoms: "Red, swollen, or bleeding gums, especially when brushing or flossing.",
      treatment: "Oral Prophylaxis (Deep Cleaning)",
      treatmentDesc: "Professional removal of plaque and tartar buildup to prevent severe gum disease and tooth loss."
    },
    {
      condition: "Impacted Wisdom Tooth",
      symptoms: "Severe jaw pain, swollen gums at the back of the mouth, or difficulty opening your mouth.",
      treatment: "Oral Surgery (Odontectomy)",
      treatmentDesc: "Safe and painless surgical extraction of the problematic wisdom tooth to relieve pressure and prevent infection."
    },
    {
      condition: "Missing Teeth",
      symptoms: "Difficulty chewing, speech issues, or shifting of remaining teeth.",
      treatment: "Dentures or Fixed Bridges",
      treatmentDesc: "Custom-fitted removable dentures or permanent bridges to restore your confident smile and bite function."
    },
    {
      condition: "Severe Tooth Infection",
      symptoms: "Throbbing pain, facial swelling, or a persistent bad taste in the mouth.",
      treatment: "Root Canal or Extraction",
      treatmentDesc: "Treating the infected pulp to save the tooth, or a safe extraction if the tooth is beyond repair."
    },
    {
      condition: "Heavily Damaged Tooth",
      symptoms: "Cracked, broken, or severely worn down teeth.",
      treatment: "Jacket Crown",
      treatmentDesc: "A protective, tooth-shaped cap placed over the damaged tooth to restore its shape, size, and strength."
    }
  ];

  const mapQuery = encodeURIComponent("Matienzo Compound, Sitio 1 Brgy San Juan, Santa Cruz, Laguna");

  return (
    <div className="w-full min-h-screen bg-white flex flex-col font-sans">
      
      {/* 1. Hero Section */}
      <div 
        className="relative w-full min-h-screen bg-cover bg-right md:bg-center bg-no-repeat overflow-hidden text-slate-800 flex flex-col justify-between"
        style={{ backgroundImage: `url(${hero_page})` }}
      >
        <header className="w-full max-w-7xl mx-auto px-6 pt-4 flex items-start justify-between relative z-50 shrink-0">
          <div className="p-3 w-40 h-40 lg:w-36 lg:h-36 flex items-center justify-center">
            <img src={logo_no_bg} alt="Matienzo Dental Clinic Logo" className="max-w-full max-h-full object-contain scale-170" />
          </div>
          <ModernNavbar page="home"/>
        </header>

        <main className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 items-center grow relative z-10 pb-8 lg:pb-12">
          <div className="max-w-xl space-y-4 lg:space-y-5 bg-white/40 backdrop-blur-[2px] p-5 rounded-2xl md:bg-transparent md:backdrop-blur-none">
            <span className="text-xs lg:text-lg font-bold tracking-wide text-[#D4AF37] block">Matienzo Dental Clinic</span>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Book your appointment <br /> in minutes
            </h1>
            <p className="max-w-md text-xs lg:text-sm font-medium text-slate-800 leading-relaxed">
              Since February 2, 2002, we've been bringing bright, healthy smiles to our community. Trust your family's dental health to experienced hands.
            </p>
            <div className="pt-2">
              <Link to="/register" className="bg-[#1A1510] text-[#D4AF37] hover:bg-[#2A231B] px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-colors inline-block text-center">
                Book an Appointment
              </Link>
            </div>
          </div>
          <div className="hidden md:block pointer-events-none h-full" aria-hidden="true" />
        </main>
      </div>

      <RibbonSection />
      <ServicesSection />
      <QuoteSection />

      {/* ========================================================
          NEW: COMMON CONDITIONS & TREATMENTS SECTION
          ======================================================== */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full bg-slate-50 rounded-4xl my-12 shadow-sm border border-slate-100">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase bg-black/5 px-4 py-2 rounded-full inline-block mb-4">Patient Guide</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Common Conditions & Treatments</h2>
          <p className="text-slate-500 mt-4 font-medium max-w-2xl mx-auto">Not sure what you need? Here are the most common dental issues our patients face and how we fix them.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {conditionsAndTreatments.map((item, index) => (
            <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden">
              {/* Decorative top border */}
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-[#D4AF37] transition-colors"></div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.condition}</h3>
                <p className="text-sm text-slate-500 italic">" {item.symptoms} "</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Recommended Treatment</span>
                <h4 className="text-base font-bold text-[#D4AF37] mb-2">{item.treatment}</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{item.treatmentDesc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/services" className="inline-block bg-slate-900 text-white hover:bg-slate-800 px-8 py-3.5 rounded-full text-sm font-bold tracking-wide transition-all shadow-md">
            View All Services & Prices
          </Link>
        </div>
      </section>

      {/* ========================================================
          DYNAMIC APPROVED TESTIMONIALS & SUBMISSION SECTION
          ======================================================== */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Patient Testimonials</h2>
          <p className="text-slate-500 mt-2 font-medium">Read what our community has to say about our care.</p>
        </div>

        {/* Display Approved Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {approvedTestimonials.map((item) => (
            <div key={item._id} className="bg-slate-50 border border-slate-200/80 p-8 rounded-3xl flex flex-col justify-between shadow-sm">
              <p className="text-slate-700 text-sm font-medium leading-relaxed mb-6 italic">"{item.message}"</p>
              <div>
                <div className="text-amber-500 font-bold mb-1">{"★".repeat(item.rating)}</div>
                <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
              </div>
            </div>
          ))}
          {approvedTestimonials.length === 0 && (
            <div className="col-span-3 text-center text-slate-400 py-10 font-medium">
              No testimonials published yet. Be the first to leave feedback below!
            </div>
          )}
        </div>

        {/* Leave Feedback Form */}
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 max-w-3xl mx-auto shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-10 blur-[80px] pointer-events-none"></div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Share Your Experience</h3>
          <p className="text-slate-400 text-xs mb-8">We value your opinion! Your feedback will be reviewed before publication.</p>

          <form onSubmit={handleFeedbackSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={feedbackForm.name}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37] transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Rating</label>
                <select 
                  value={feedbackForm.rating}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37] transition cursor-pointer"
                >
                  <option value={5}>★★★★★ (5 Stars - Excellent)</option>
                  <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                  <option value={3}>★★★☆☆ (3 Stars - Good)</option>
                  <option value={2}>★★☆☆☆ (2 Stars - Fair)</option>
                  <option value={1}>★☆☆☆☆ (1 Star - Poor)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Your Message</label>
              <textarea 
                required
                rows={4}
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                placeholder="Write your review here..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37] transition resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#D4AF37] text-slate-950 font-black py-4 rounded-xl hover:bg-amber-400 transition cursor-pointer shadow-lg"
            >
              {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
            </button>
          </form>
        </div>
      </section>

      <GallerySlideshow/>
      <VideoEvidence/>

      {/* FAQ & Map Sections */}
      <section className="py-20 px-6 max-w-4xl mx-auto w-full bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h2>
          <p className="text-slate-500 mt-2 font-medium">Everything you need to know about your visit and our services.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className={`border transition-all duration-300 rounded-2xl overflow-hidden ${openFAQ === index ? 'border-[#D4AF37] bg-white shadow-md' : 'border-slate-200 bg-white shadow-sm'}`}>
              <button onClick={() => toggleFAQ(index)} className="w-full flex items-center justify-between p-6 text-left focus:outline-none cursor-pointer">
                <span className={`font-bold text-base md:text-lg ${openFAQ === index ? 'text-[#D4AF37]' : 'text-slate-800'}`}>{faq.question}</span>
                <span className={`transform transition-transform duration-300 flex items-center justify-center w-8 h-8 rounded-full ${openFAQ === index ? 'bg-[#D4AF37]/10 text-[#D4AF37] rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </button>
              <div className={`transition-all duration-300 ease-in-out ${openFAQ === index ? 'max-h-40 opacity-100 pb-6 px-6' : 'max-h-0 opacity-0 overflow-hidden px-6'}`}>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Visit Our Clinic</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
              Located in the heart of <br className="hidden md:block" />Santa Cruz, Laguna.
            </h2>
            <p className="text-slate-600 text-base mb-8 leading-relaxed font-medium max-w-lg">
              Our clinic is equipped with modern facilities designed to provide a comfortable and relaxing environment for all your dental needs.
            </p>
          </div>
          <div className="w-full h-100 md:h-125 bg-slate-200 rounded-3xl overflow-hidden shadow-xl border-4 border-white relative group">
            <iframe 
              title="Matienzo Dental Clinic Location"
              src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      <Footer/>
    </div>
  );
};

export default HomePage;