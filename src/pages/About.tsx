import React from 'react';

export const About = () => (
  <div className="py-20 bg-cream min-h-screen">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
          <img 
            src="https://picsum.photos/seed/about/1000/1000" 
            alt="Our Story" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="space-y-8">
          <h1 className="text-5xl font-serif leading-tight">Rooted in Nature, <br /> <span className="italic text-secondary">Designed for Change.</span></h1>
          <p className="text-lg text-primary/70 leading-relaxed">
            Anfastyle was born from a simple observation: the patterns of nature are the most beautiful designs in existence. We believe that what we wear should reflect our values and our connection to the Earth.
          </p>
          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="space-y-2">
              <h4 className="text-4xl font-serif text-secondary">100%</h4>
              <p className="text-xs font-bold uppercase tracking-widest text-primary/40">Eco-Conscious Designs</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-4xl font-serif text-secondary">5k+</h4>
              <p className="text-xs font-bold uppercase tracking-widest text-primary/40">Earth Lovers Joined</p>
            </div>
          </div>
          <p className="text-primary/70 leading-relaxed">
            Our mission is to spread awareness about permaculture, composting, and environmental stewardship through high-quality, beautifully designed apparel. Every purchase supports our efforts to promote sustainable living practices globally.
          </p>
        </div>
      </div>
    </div>
  </div>
);
