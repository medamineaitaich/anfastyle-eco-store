import React from 'react';

export const Contact = () => (
  <div className="py-20 bg-cream min-h-screen">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center mb-20">
        <h1 className="text-5xl font-serif mb-6">Get in Touch</h1>
        <p className="text-xl text-primary/70">Have questions about our products or your order? We're here to help you grow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-sm">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Full Name</label>
              <input type="text" className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Email Address</label>
              <input type="email" className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none" placeholder="john@example.com" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Subject</label>
              <input type="text" className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none" placeholder="How can we help?" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Message</label>
              <textarea rows={6} className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none resize-none" placeholder="Tell us more..."></textarea>
            </div>
            <button className="md:col-span-2 bg-primary text-cream py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-xl">
              Send Message
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-primary/5">
            <h3 className="font-bold uppercase tracking-widest text-xs text-primary/40 mb-4">Email Us</h3>
            <p className="text-lg font-medium">contact@anfastyle.com</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-primary/5">
            <h3 className="font-bold uppercase tracking-widest text-xs text-primary/40 mb-4">Visit Us</h3>
            <p className="text-sm leading-relaxed">
              1209 MOUNTAIN ROAD PL NE STE R<br />
              Albuquerque, NM 87110<br />
              USA
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-primary/5">
            <h3 className="font-bold uppercase tracking-widest text-xs text-primary/40 mb-4">Call Us</h3>
            <p className="text-lg font-medium">+1 (202) 773-7432</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
