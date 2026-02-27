import React, { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface RegisterProps {
  onLogin: (user: any) => void;
}

export const Register = ({ onLogin }: RegisterProps) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Mock authentication
    setTimeout(() => {
      setIsLoading(false);
      if (isSignIn) {
        // Mock Sign In Success
        onLogin({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          address: '123 Nature Way, Eco City, 90210'
        });
      } else {
        // Mock Registration Success
        setMessage({ type: 'success', text: 'Registration successful! You can now sign in.' });
        setIsSignIn(true);
      }
    }, 1500);
  };

  return (
    <div className="py-20 bg-cream min-h-screen flex items-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white p-10 rounded-3xl shadow-sm text-center">
          <h1 className="text-4xl font-serif mb-2">{isSignIn ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-primary/60 mb-8">{isSignIn ? 'Sign in to your account' : 'Join our eco-conscious community'}</p>

          {message.text && (
            <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isSignIn && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">First Name</label>
                  <input required type="text" className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none" />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Last Name</label>
                  <input required type="text" className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none" />
                </div>
              </div>
            )}
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Email Address</label>
              <input required type="email" className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none" placeholder="email@example.com" />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Password</label>
              <input required type="password" title="Password must be at least 8 characters" className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none" placeholder="••••••••" />
            </div>
            {!isSignIn && (
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Confirm Password</label>
                <input required type="password" title="Passwords must match" className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none" placeholder="••••••••" />
              </div>
            )}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-cream py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-xl disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
              ) : (
                isSignIn ? 'Sign In' : 'Register'
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-primary/60">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => {
                setIsSignIn(!isSignIn);
                setMessage({ type: '', text: '' });
              }} 
              className="text-secondary font-bold hover:underline"
            >
              {isSignIn ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
