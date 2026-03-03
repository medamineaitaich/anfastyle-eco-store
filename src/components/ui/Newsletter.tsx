import React, { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setMessage({ type: 'error', text: 'Enter a valid email address.' });
      return;
    }

    setMessage({ type: 'success', text: 'Thanks for subscribing. You are on the list.' });
    setEmail('');
  };

  return (
    <section className="bg-secondary/20 py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-serif mb-4">Join the Ecosystem</h2>
        <p className="text-primary/70 mb-8 max-w-lg mx-auto">
          Subscribe to receive updates, access to exclusive deals, and permaculture tips delivered to your inbox.
        </p>
        <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-grow px-6 py-4 bg-cream border border-primary/20 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button type="submit" className="bg-primary text-cream px-8 py-4 rounded-full font-bold hover:bg-accent transition-all">
            Subscribe
          </button>
        </form>
        {message.text && (
          <p className={`mt-4 text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
};
