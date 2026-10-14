import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Mail, Lock, User, Sparkles, ArrowRight, Heart } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signup',
  onSuccess,
}) => {
  const { loginWithEmail, signupWithEmail, loginAsGuest } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your name');
        }
        await signupWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setSubmitting(true);
    try {
      await loginAsGuest(name || 'Creator');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Guest login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-2xl sm:rounded-3xl border border-[#EADBDA] shadow-2xl p-5 sm:p-8 text-[#241318] max-h-[94vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#8C6B73] hover:text-[#4A1525] hover:bg-white/80 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F2] border border-[#F5CDD3] text-xs font-semibold text-[#8B1E3F] mb-3">
            <Heart className="w-3.5 h-3.5 fill-[#8B1E3F]" />
            <span>Eyan mi · My Person</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#4A1525]">
            {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs sm:text-sm text-[#8C6B73] mt-1">
            {mode === 'signup'
              ? 'Start crafting intimate letters and celebrations for your favorite people'
              : 'Log in to manage your celebrations and view your special moments'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex flex-col gap-2 animate-shake">
            <div className="leading-relaxed">{error}</div>

            {(error.toLowerCase().includes('already registered') || error.toLowerCase().includes('already in use') || error.toLowerCase().includes('switch to sign in')) && mode === 'signup' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="self-start text-[11px] font-bold text-[#8B1E3F] underline cursor-pointer hover:text-[#721532]"
              >
                👉 Switch to Sign In with this email
              </button>
            )}
            {(error.toLowerCase().includes('no account found') || error.toLowerCase().includes('create an account') || error.toLowerCase().includes('create free account')) && mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="self-start text-[11px] font-bold text-[#8B1E3F] underline cursor-pointer hover:text-[#721532]"
              >
                👉 Switch to Create Free Account
              </button>
            )}
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#4A1525] mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C6B73] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ayomide"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-white text-xs font-medium focus:outline-[#8B1E3F]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#4A1525] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C6B73] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-white text-xs font-medium focus:outline-[#8B1E3F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A1525] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C6B73] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D5C2C6] bg-white text-xs font-medium focus:outline-[#8B1E3F]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-[#8B1E3F] hover:bg-[#721532] text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 disabled:opacity-50"
          >
            <span>{mode === 'signup' ? 'Create Free Account' : 'Sign In to Eyan mi'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center text-xs text-[#8C6B73]">
          {mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-[#8B1E3F] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New to Eyan mi?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-[#8B1E3F] hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          )}
        </div>

        {/* Quick Demo Guest Button */}
        <div className="mt-4 pt-4 border-t border-[#EADBDA] text-center">
          <button
            type="button"
            onClick={handleGuest}
            disabled={submitting}
            className="text-[11px] font-semibold text-[#8C6B73] hover:text-[#4A1525] underline cursor-pointer"
          >
            Or continue as Instant Guest Creator
          </button>
        </div>
      </div>
    </div>
  );
};
