import React from 'react';

const VideoEvidence = () => {
  // Storing the explicit Facebook frame URLs from your payload
  const videoUrls = [
    "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F1509402224214339%2F&show_text=false&width=267&t=0",
    "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F1758101605187442%2F&show_text=false&width=267&t=0",
    "https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fweb.facebook.com%2Freel%2F1947822149206019%2F&show_text=false&width=267&t=0"
  ];

  return (
    <section className="w-full bg-white py-12 px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Section Heading */}
        <h2 className="text-3xl lg:text-4xl font-serif text-center text-black mb-12 tracking-wide">
          Actual Clinic Highlights
        </h2>

        {/* Responsive Grid Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center items-center">
          {videoUrls.map((url, index) => (
            <div 
              key={index} 
              className="w-66.75 h-119 bg-slate-50 rounded-2xl overflow-hidden shadow-md border border-slate-100 hover:shadow-lg transition-shadow duration-300"
            >
              <iframe 
                src={url} 
                width="267" 
                height="476" 
                style={{ border: 'none', overflow: 'hidden' }} 
                scrolling="no" 
                frameBorder="0" 
                allowFullScreen={true} 
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                title={`Matienzo Dental Clinic Reel ${index + 1}`}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default VideoEvidence;