import React, { useState } from 'react';

const GallerySlideshow = () => {
  // Automatically generates ["p1.jpg", "p2.jpg", ..., "p23.jpg"] 
  // plus your standalone "14.jpg"
  const images = [
    ...Array.from({ length: 23 }, (_, i) => `p${i + 1}.jpg`),
    "14.jpg"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Helper logic to show a moving window of max 5 dots so it doesn't overflow
  const getVisibleDots = () => {
    const totalDots = images.length;
    if (totalDots <= 5) return images.map((_, i) => i);
    
    let start = Math.max(0, currentIndex - 2);
    let end = Math.min(totalDots - 1, currentIndex + 2);
    
    if (start === 0) end = 4;
    if (end === totalDots - 1) start = totalDots - 5;
    
    const dots = [];
    for (let i = start; i <= end; i++) {
      dots.push(i);
    }
    return dots;
  };

  return (
    <section className="w-full bg-white py-12 px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Main Frame Container */}
        <div className="bg-[#F5F5F5] rounded-[2.5rem] p-6 md:p-10 flex items-center justify-between relative shadow-sm">
          
          {/* Left Arrow Button */}
          <button 
            onClick={handlePrev}
            className="text-slate-700 hover:text-slate-900 transition-colors p-2 z-10 focus:outline-none shrink-0"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Core Image Canvas */}
          <div className="w-full max-w-2xl aspect-4/3 mx-4 rounded-3xl overflow-hidden shadow-md bg-slate-200 relative">
            <img 
              src={`/customers/${images[currentIndex]}`}
              alt={`Evidence of clinical work ${currentIndex + 1}`}
              className="w-full h-full object-cover select-none pointer-events-none transition-all duration-300"
            />
            
            {/* Optional subtle photo counter badge in the corner */}
            <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Right Arrow Button */}
          <button 
            onClick={handleNext}
            className="text-slate-700 hover:text-slate-900 transition-colors p-2 z-10 focus:outline-none shrink-0"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Clean Pagination Dots Panel */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {getVisibleDots().map((index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
                  currentIndex === index ? "bg-black w-6" : "bg-black/40 w-2.5"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default GallerySlideshow;