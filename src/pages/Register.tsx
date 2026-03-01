import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { apiUrl } from '../services/api';

interface RegisterProps {
  onLogin: (user: any) => void;
}

export const Register = ({ onLogin }: RegisterProps) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const handleForgotPassword = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address first.' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(apiUrl('/api/store/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data?.error || 'Unable to send reset email right now.' });
        return;
      }

      setMessage({ type: 'success', text: data?.message || 'If this email exists, a password reset link has been sent.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isSignIn) {
        const res = await fetch(apiUrl('/api/store/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setMessage({ type: 'error', text: data?.error || 'Invalid email or password' });
          return;
        }

        if (!data?.token) {
          setMessage({ type: 'error', text: 'Login failed: missing token in response.' });
          return;
        }

        onLogin({
          firstName: data?.user?.first_name || '',
          lastName: data?.user?.last_name || '',
          email: data?.user?.email || email,
          address: '',
        });
      } else {
        const res = await fetch(apiUrl('/api/store/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            password2,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setMessage({ type: 'error', text: data?.error || 'Registration failed.' });
          return;
        }

        setMessage({ type: 'success', text: 'Registration successful! You can now sign in.' });
        setIsSignIn(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-20 bg-cream min-h-screen flex items-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white p-10 rounded-3xl shadow-sm text-center">
          <h1 className="text-4xl font-serif mb-2">{isSignIn ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-primary/60 mb-8">{isSignIn ? 'Sign in to your account' : 'Create your account with email and password'}</p>

          {message.text && (
            <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  title="Password must be at least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 pr-14 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-4 text-primary/60 hover:text-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {isSignIn && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-sm text-secondary font-semibold hover:underline disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              </div>
            )}
            {!isSignIn && (
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Confirm Password</label>
                <div className="relative">
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    title="Passwords must match"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="w-full px-6 py-4 pr-14 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-4 text-primary/60 hover:text-primary"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
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
            {isSignIn ? "Don't have an account?" : 'Already have an account?'}{' '}
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
