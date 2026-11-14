import React from 'react';
import { Link } from 'react-router-dom';
import logo_no_bg from "../assets/logo_no_bg.png";
import ModernNavbar from './Navbar';
import Footer from '../components/footer';

// Image imports
import drAnneImg from '../assets/Dr_Anne.png';
import lucilleImg from '../assets/Developer.png'; 

const AboutPage = () => {
  return (
    <div className="w-full min-h-screen bg-white flex flex-col justify-between">
      
      {/* --- HEADER NAVIGATION AREA --- */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-4 flex items-start justify-between relative z-50 shrink-0">
        <div className="p-3 w-40 h-40 lg:w-36 lg:h-36 flex items-center justify-center">
          <img 
            src={logo_no_bg} 
            alt="Matienzo Dental Clinic Logo" 
            className="max-w-full max-h-full object-contain scale-150"
          />
        </div>
        
        <ModernNavbar page="about" />
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="grow w-full max-w-5xl mx-auto px-6 py-12 font-sans space-y-20">
        
        {/* SECTION 1: ABOUT THE TEAM */}
        <section>
          <h1 className="text-3xl md:text-4xl font-extrabold text-center text-slate-900 mb-16 tracking-tight">
            About the Team
          </h1>

          <div className="space-y-20 md:space-y-28 max-w-4xl mx-auto">
            
            {/* PROFILE 1: Dra. Anne Dumas-Matienzo */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
              <div className="md:col-span-5 flex flex-col items-center text-center">
                <div className="w-64 h-64 md:w-full md:h-auto aspect-4/5 overflow-hidden rounded-2xl shadow-sm bg-slate-50 mb-4">
                  <img 
                    src={drAnneImg} 
                    alt="Dra. Anne Dumas-Matienzo" 
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Dra. Anne Dumas-Matienzo</h2>
                <p className="text-sm font-semibold text-slate-500">General Dentist</p>
              </div>

              <div className="md:col-span-7 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Meet Dr. Matienzo, your General Dentist</h3>
                <p className="text-xs lg:text-sm text-slate-700 leading-relaxed text-justify font-normal">
                  With 24 years of dedicated experience in the dental industry, Dr. Matienzo blends master-level clinical expertise with a warm, motherly touch. A proud alumna of Centro Escolar University, her rich journey spans public health service at the Caloocan Health Center (2002–2010) and years of refining her craft at top international firms, including Al Mossahary and Panorama Clinic (2013–2019). Since November 2019, she has been bringing her global standards of care to Matienzo Dental Clinic. When she isn't creating beautiful, healthy smiles, she is a devoted mother of two. Her decades of experience ensure that you and your family are always in the gentlest, most capable hands.
                </p>
                <div className="pt-2">
                  <Link 
                    to="/contact" 
                    className="inline-block bg-black text-[#D4AF37] hover:bg-[#1A1510] px-6 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors"
                  >
                    Send a message!
                  </Link>
                </div>
              </div>
            </div>

            {/* PROFILE 2: Lucille Rebenque Torres */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
              <div className="md:col-span-5 flex flex-col items-center text-center">
                <div className="w-64 h-64 md:w-full md:h-auto aspect-4/5 overflow-hidden rounded-2xl shadow-sm bg-slate-50 mb-4">
                  <img 
                    src={lucilleImg} 
                    alt="Lucille Rebenque Torres" 
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Lucille Rebenque Torres</h2>
                <p className="text-sm font-semibold text-slate-500">Full Stack Developer</p>
              </div>

              <div className="md:col-span-7 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Meet the Developer</h3>
                <p className="text-xs lg:text-sm text-slate-700 leading-relaxed text-justify font-normal">
                  Lucille R. Torres is the lead Full-Stack Developer behind the Matienzo Dental Clinic System. A 23-year-old, 4th-year Computer Science student, Lucille engineered this comprehensive platform as part of her OJT milestone. From designing the modern patient-facing frontend to building the secure backend database and hardware thermal printer integrations, she bridges technical precision with real-world healthcare solutions.
                </p>
                <div className="pt-2">
                  <Link 
                    to="/contact" 
                    className="inline-block bg-black text-[#D4AF37] hover:bg-[#1A1510] px-6 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors"
                  >
                    Send a message!
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* --- INFOGRAPHIC 1: CLINIC EXPERIENCE & METRICS --- */}
        <section className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Clinic Milestones</span>
            <h2 className="text-2xl md:text-3xl font-black mt-1">Excellence in Numbers</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-3xl md:text-4xl font-extrabold text-[#D4AF37]">24+</span>
              <p className="text-xs font-medium text-slate-300 mt-2">Years Clinical Experience</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-3xl md:text-4xl font-extrabold text-[#D4AF37]">2019</span>
              <p className="text-xs font-medium text-slate-300 mt-2">Clinic Established</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-3xl md:text-4xl font-extrabold text-[#D4AF37]">100%</span>
              <p className="text-xs font-medium text-slate-300 mt-2">Digitalized Records</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-3xl md:text-4xl font-extrabold text-[#D4AF37]">4-Way</span>
              <p className="text-xs font-medium text-slate-300 mt-2">Specialized Care Disciplines</p>
            </div>
          </div>
        </section>

        {/* --- INFOGRAPHIC 2: ODONTOLOGY & DENTAL SCIENCE GUIDE --- */}
        <section className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200/80">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Educational Guide</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Understanding Odontology</h2>
            <p className="text-xs md:text-sm text-slate-600 mt-2">
              Odontology is the scientific study of the structure, development, and diseases of teeth.
            </p>
          </div>

          {/* Tooth Structure Anatomy Breakdown */}
          <div className="mb-12">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 text-center">
              Anatomy of a Tooth
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#D4AF37] flex items-center justify-center font-bold text-xs mb-3">01</div>
                <h4 className="font-bold text-slate-900 text-sm">Enamel</h4>
                <p className="text-xs text-slate-600 mt-1">The calcified outer shell—the hardest substance in the human body protecting internal nerves.</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#D4AF37] flex items-center justify-center font-bold text-xs mb-3">02</div>
                <h4 className="font-bold text-slate-900 text-sm">Dentin</h4>
                <p className="text-xs text-slate-600 mt-1">The living porous tissue beneath enamel that transmits temperature sensations to nerves.</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#D4AF37] flex items-center justify-center font-bold text-xs mb-3">03</div>
                <h4 className="font-bold text-slate-900 text-sm">Pulp Chamber</h4>
                <p className="text-xs text-slate-600 mt-1">The soft center containing vital blood vessels and nerves nourishing the tooth structure.</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#D4AF37] flex items-center justify-center font-bold text-xs mb-3">04</div>
                <h4 className="font-bold text-slate-900 text-sm">Root Canal & Bone</h4>
                <p className="text-xs text-slate-600 mt-1">Anchors the tooth securely to the jawbone via periodontal ligament fibers.</p>
              </div>
            </div>
          </div>

          {/* Core Branches Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 text-center">
              Key Pillars of Dental Treatment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-[#D4AF37] uppercase">Preventive Care</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">Prophylaxis & Sealants</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Regular cleanings, fluoride treatments, and routine examinations prevent plaque calcification and early enamel decay.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-[#D4AF37] uppercase">Restorative</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">Fillings, Crowns & Endodontics</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Repairing damaged teeth using bio-compatible composite materials, crowns, or root canal therapy to restore full bite functionality.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-[#D4AF37] uppercase">Orthodontics</span>
                <h4 className="text-base font-bold text-slate-900 mt-1">Realignment & Braces</h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Correcting malocclusions, bite misalignments, and crowded tooth positioning for long-term oral health and aesthetic balance.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* --- FOOTER MOUNT BLOCK --- */}
      <Footer />

    </div>
  );
};

export default AboutPage;