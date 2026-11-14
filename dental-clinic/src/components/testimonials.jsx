import React from 'react';

// Importing assets exactly from the testimonies directory shown in image_a0df32.png
import donImg from '../assets/testimonies/don_torres.png';
import austinImg from '../assets/testimonies/austin_guerzo.png';
import luzImg from '../assets/testimonies/luz_torres.png';

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      image: donImg,
      text: "Maraming salamat kay Dra. Anne sa napakabait at maalagang serbisyo sa amin.",
      author: "Don T.",
      cardBg: "bg-[#E9C663]", // Warm Gold
    },
    {
      id: 2,
      image: austinImg,
      text: "Salamat nang marami kay Dra. Anne! Napakahusay at may totoong malasakit sa pasyente",
      author: "Austin G.",
      cardBg: "bg-[#111111]", // Solid Black
    },
    {
      id: 3,
      image: luzImg,
      text: "Kahanga-hanga ang dedikasyon ni Dra. Anne—mararamdaman mo talaga ang alaga at pag-asikaso niya.",
      author: "Luz T.",
      cardBg: "bg-[#CBD3D7]", // Soft Silver/Gray
    },
  ];

  return (
    <section className="w-full bg-white py-16 px-6 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Heading */}
        <h2 className="text-4xl font-serif text-center text-black mb-20 tracking-wide">
          Patient’s Testimonials
        </h2>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 justify-items-center items-stretch">
          {testimonials.map((item) => (
            <div 
              key={item.id} 
              className={`relative ${item.cardBg} rounded-[2.5rem] p-5 w-full max-w-72.5 min-h-80 flex flex-col justify-end shadow-md`}
            >
              
              {/* Floating Circular Avatar */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full overflow-hidden shadow-md bg-slate-100 flex items-center justify-center">
                <img 
                  src={item.image} 
                  alt={`Patient portrait ${item.id}`} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Inner White Container for Quote Content */}
              <div className="bg-white rounded-4xl p-6 pt-8 w-full h-full flex flex-col justify-between text-left min-h-55">
                <p className="text-xs lg:text-sm font-medium text-slate-800 leading-relaxed tracking-normal">
                  {item.text}
                </p>
                
                <span className="text-xs lg:text-sm font-semibold text-slate-700 block mt-4">
                  {item.author}
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;