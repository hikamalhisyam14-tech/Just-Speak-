import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
}) => {
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedLang, setSelectedLang] = useState<Language>(user?.selectedLanguage || 'en');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        await register(email.trim(), name.trim(), password, selectedLang);
      } else {
        await login(email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3C2A21]/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFF9F2] dark:bg-[#201A16] border border-[#F2EDE4] dark:border-[#332720] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-2xl transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] hover:bg-[#F2EDE4] dark:hover:bg-[#2D241F] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#3C2A21] dark:bg-[#2D241F] text-[#FDFBF7] flex items-center justify-center font-serif font-black text-2xl mx-auto mb-3 shadow-md border border-[#4A3930]">
            JS
          </div>
          <h2 className="font-serif font-black text-2xl text-[#3C2A21] dark:text-[#FDFBF7] uppercase">
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-[#736B5E] dark:text-[#A89F93] mt-1 font-serif italic">
            {mode === 'signup'
              ? 'Save your progress, maintain daily streaks, and prepare for 365 topics.'
              : 'Log in to continue your speaking challenge.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-serif font-bold text-[#736B5E] dark:text-[#D1C7BA] mb-1.5 uppercase tracking-wider">
                Your Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#A69D91] dark:text-[#8C8073] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full pl-11 pr-4 py-3 bg-[#FFFFFF] dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] rounded-full text-sm text-[#3C2A21] dark:text-[#FDFBF7] placeholder:text-[#A69D91] dark:placeholder:text-[#8C8073] focus:outline-none focus:ring-2 focus:ring-[#E97D3B] focus:border-transparent transition-all"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-serif font-bold text-[#736B5E] dark:text-[#D1C7BA] mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A69D91] dark:text-[#8C8073] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-[#FFFFFF] dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] rounded-full text-sm text-[#3C2A21] dark:text-[#FDFBF7] placeholder:text-[#A69D91] dark:placeholder:text-[#8C8073] focus:outline-none focus:ring-2 focus:ring-[#E97D3B] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif font-bold text-[#736B5E] dark:text-[#D1C7BA] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A69D91] dark:text-[#8C8073] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-[#FFFFFF] dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] rounded-full text-sm text-[#3C2A21] dark:text-[#FDFBF7] placeholder:text-[#A69D91] dark:placeholder:text-[#8C8073] focus:outline-none focus:ring-2 focus:ring-[#E97D3B] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Language selection during signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-serif font-bold text-[#736B5E] dark:text-[#D1C7BA] mb-1.5 uppercase tracking-wider">
                Preferred Practice Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLang('en')}
                  className={`py-2.5 px-3 rounded-full text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                    selectedLang === 'en'
                      ? 'bg-[#3C2A21] dark:bg-[#FDFBF7] text-[#FDFBF7] dark:text-[#181412] border-[#3C2A21] dark:border-[#FDFBF7]'
                      : 'bg-white dark:bg-[#271F1A] text-[#736B5E] dark:text-[#A89F93] border-[#F2EDE4] dark:border-[#382B24] hover:border-[#3C2A21] dark:hover:border-[#FDFBF7]'
                  }`}
                >
                  <span>🇬🇧</span> English
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLang('id')}
                  className={`py-2.5 px-3 rounded-full text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider ${
                    selectedLang === 'id'
                      ? 'bg-[#3C2A21] dark:bg-[#FDFBF7] text-[#FDFBF7] dark:text-[#181412] border-[#3C2A21] dark:border-[#FDFBF7]'
                      : 'bg-white dark:bg-[#271F1A] text-[#736B5E] dark:text-[#A89F93] border-[#F2EDE4] dark:border-[#382B24] hover:border-[#3C2A21] dark:hover:border-[#FDFBF7]'
                  }`}
                >
                  <span>🇮🇩</span> Bahasa ID
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#FFE9D9] dark:bg-[#3D2517] border border-[#FAD3B6] dark:border-[#523321] rounded-2xl text-xs font-medium text-[#9C4221] dark:text-[#FFA066] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 rounded-full bg-[#E97D3B] hover:bg-[#D96B28] text-white font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account' : 'Log In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-xs text-[#736B5E] dark:text-[#A89F93] font-serif">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="font-bold text-[#E97D3B] hover:underline uppercase tracking-wider text-[11px] cursor-pointer"
              >
                Log In
              </button>
            </>
          ) : (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className="font-bold text-[#E97D3B] hover:underline uppercase tracking-wider text-[11px] cursor-pointer"
              >
                Sign Up Free
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
