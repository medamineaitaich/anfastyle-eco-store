import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../services/api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [message, setMessage] = useState<{ type: '' | 'success' | 'error'; text: string }>({ type: '', text: '' });

  const resetData = useMemo(() => {
    const key = searchParams.get('key') || searchParams.get('rp_key') || '';
    const login = searchParams.get('login') || searchParams.get('rp_login') || '';
    return { key, login };
  }, [searchParams]);

  const hasToken = Boolean(resetData.key && resetData.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!hasToken) {
      setMessage({ type: 'error', text: 'This reset link is invalid. Please request a new one.' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    if (password !== password2) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/store/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: resetData.key,
          login: resetData.login,
          password,
          password2,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data?.error || 'Unable to reset password right now. Please try again.' });
        return;
      }

      setPassword('');
      setPassword2('');
      setMessage({ type: 'success', text: data?.message || 'Password updated successfully. You can now sign in.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-20 bg-cream min-h-screen flex items-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white p-10 rounded-3xl shadow-sm">
          <h1 className="text-4xl font-serif mb-2 text-center">Reset Password</h1>
          <p className="text-primary/60 mb-8 text-center">Choose a new password for your account.</p>

          {message.text && (
            <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {!hasToken ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">
              This reset link is missing required data. Please request a new password reset email.
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-widest text-primary/50">New Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-4 pr-14 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none"
                    placeholder="At least 6 characters"
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

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Confirm New Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword2 ? 'text' : 'password'}
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="w-full px-6 py-4 pr-14 bg-cream/30 border border-primary/10 rounded-xl focus:outline-none"
                    placeholder="Repeat password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2((v) => !v)}
                    className="absolute inset-y-0 right-4 text-primary/60 hover:text-primary"
                    aria-label={showPassword2 ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showPassword2 ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-cream py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all shadow-xl disabled:opacity-50 flex justify-center items-center"
              >
                {isLoading ? <div className="w-6 h-6 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : 'Save Password'}
              </button>
            </form>
          )}

          <p className="mt-8 text-sm text-primary/60 text-center">
            Back to{' '}
            <Link className="text-secondary font-bold hover:underline" to="/account">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
