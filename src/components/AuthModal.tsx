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
  const { loginWithGoogle, loginWithEmail, signupWithEmail, loginAsGuest } = useAuth();
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

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled or failed.');
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
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex flex-col gap-1.5 animate-shake">
            <div>{error}</div>
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
            {(error.toLowerCase().includes('no account found') || error.toLowerCase().includes('create an account')) && mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="self-start text-[11px] font-bold text-[#8B1E3F] underline cursor-pointer hover:text-[#721532]"
              >
                👉 Switch to Create Account
              </button>
            )}
          </div>
        )}

        {/* 1-Click Google Sign In */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full mb-4 py-2.5 px-4 rounded-xl border border-[#D5C2C6] bg-white hover:bg-[#FFFDFB] text-xs font-semibold text-[#4A1525] shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-[#EADBDA] w-full" />
          <span className="bg-[#FAF7F2] px-3 text-[11px] font-semibold uppercase tracking-wider text-[#8C6B73]">
            or with email
          </span>
        </div>

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
