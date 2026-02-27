import React from 'react';

export const Newsletter = () => (
  <section className="bg-secondary/20 py-20">
    <div className="max-w-4xl mx-auto px-4 text-center">
      <h2 className="text-3xl md:text-4xl font-serif mb-4">Join the Ecosystem</h2>
      <p className="text-primary/70 mb-8 max-w-lg mx-auto">
        Subscribe to receive updates, access to exclusive deals, and permaculture tips delivered to your inbox.
      </p>
      <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="Enter your email"
          className="flex-grow px-6 py-4 bg-cream border border-primary/20 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button className="bg-primary text-cream px-8 py-4 rounded-full font-bold hover:bg-accent transition-all">
          Subscribe
        </button>
      </form>
    </div>
  </section>
);
