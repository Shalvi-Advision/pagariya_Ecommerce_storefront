import React from 'react';

const AboutUsPage = () => {
  const images = [
    '/images/page1.jpg',
    '/images/page2.jpg',
    '/images/page3.jpg',
    '/images/page4.jpg',
    '/images/page5.jpg',
    '/images/page6.jpg',
    '/images/page7.jpg',
    '/images/page8.jpg',
  ];

  return (
    <div className="bg-white min-h-screen py-6">
      <div className="w-full flex flex-col items-center">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Page ${index + 1}`}
            className="w-full max-w-[250mm] aspect-[210/297] object-contain block"
            loading={index < 2 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </div>
  );
};

export default AboutUsPage;