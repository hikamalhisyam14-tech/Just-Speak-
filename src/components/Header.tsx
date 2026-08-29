import React from 'react';
import { Flame, Calendar, Sparkles, Bookmark, Settings, Crown, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentTab: 'generator' | 'calendar' | 'saved' | 'settings';
  onSelectTab: (tab: 'generator' | 'calendar' | 'saved' | 'settings') => void;
  onOpenAuthModal: () => void;
  onOpenPremiumModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuthModal,
  onOpenPremiumModal,
}) => {
  const { user, isAuthenticated, isPremium, setLanguage } = useAuth();
  const lang = user?.selectedLanguage || 'en';

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 dark:bg-[#1C1613]/95 backdrop-blur-md border-b border-[#F2EDE4] dark:border-[#2D241F] px-4 lg:px-8 py-3.5 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => onSelectTab('generator')}
          className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer"
        >
          <div>
            <div className="font-serif font-black text-2xl tracking-tight text-[#3C2A21] dark:text-[#FDFBF7] leading-none uppercase">
              Just Speak
            </div>
            <p className="text-[11px] text-[#736B5E] dark:text-[#A89F93] font-medium hidden sm:block tracking-wider uppercase mt-1 font-serif italic">
              {lang === 'id' ? 'Pilih. Cari tahu. Bicara 1 menit.' : 'Pick something. Learn something. Speak for one minute.'}
            </p>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#F2EDE4] dark:bg-[#271F1A] p-1 rounded-xl border border-[#E5E2D9] dark:border-[#3D322B]">
          <button
            onClick={() => onSelectTab('generator')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'generator'
                ? 'bg-[#3C2A21] text-[#FDFBF7] dark:bg-[#E97D3B] dark:text-white shadow-sm'
                : 'text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] hover:bg-[#E5E2D9] dark:hover:bg-[#332A24]'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${currentTab === 'generator' ? 'text-[#E97D3B] dark:text-white' : 'text-[#E97D3B]'}`} />
            <span>{lang === 'id' ? 'Tantangan' : 'Challenge'}</span>
          </button>

          <button
            onClick={() => onSelectTab('calendar')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'calendar'
                ? 'bg-[#3C2A21] text-[#FDFBF7] dark:bg-[#E97D3B] dark:text-white shadow-sm'
                : 'text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] hover:bg-[#E5E2D9] dark:hover:bg-[#332A24]'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${currentTab === 'calendar' ? 'text-white' : 'text-[#166534] dark:text-[#86EFAC]'}`} />
            <span>{lang === 'id' ? '30 Hari' : '30-Day'}</span>
          </button>

          <button
            onClick={() => onSelectTab('saved')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'saved'
                ? 'bg-[#3C2A21] text-[#FDFBF7] dark:bg-[#E97D3B] dark:text-white shadow-sm'
                : 'text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] hover:bg-[#E5E2D9] dark:hover:bg-[#332A24]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'id' ? 'Tersimpan' : 'Saved'}</span>
            {user && user.savedTopics?.length > 0 && (
              <span
                className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md ${
                  currentTab === 'saved'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#FDFBF7] dark:bg-[#332A24] text-[#3C2A21] dark:text-[#FDFBF7]'
                }`}
              >
                {user.savedTopics.length}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-[#3C2A21] text-[#FDFBF7] dark:bg-[#E97D3B] dark:text-white shadow-sm'
                : 'text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] hover:bg-[#E5E2D9] dark:hover:bg-[#332A24]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'id' ? 'Akun & Pengaturan' : 'Account'}</span>
          </button>
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-[#F2EDE4] dark:bg-[#271F1A] p-0.5 rounded-lg border border-[#E5E2D9] dark:border-[#3D322B]">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#FDFBF7] dark:bg-[#3D322B] text-[#3C2A21] dark:text-[#FDFBF7] shadow-xs'
                  : 'text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7]'
              }`}
              title="English"
            >
              🇬🇧 <span className="hidden md:inline">EN</span>
            </button>
            <button
              onClick={() => setLanguage('id')}
              className={`px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'id'
                  ? 'bg-[#FDFBF7] dark:bg-[#3D322B] text-[#3C2A21] dark:text-[#FDFBF7] shadow-xs'
                  : 'text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7]'
              }`}
              title="Bahasa Indonesia"
            >
              🇮🇩 <span className="hidden md:inline">ID</span>
            </button>
          </div>

          {/* If NOT logged in: Show Log In / Sign Up button */}
          {!isAuthenticated ? (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#3C2A21] dark:bg-[#E97D3B] hover:bg-[#2A1D17] dark:hover:bg-[#D96B28] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'id' ? 'Masuk' : 'Log In'}</span>
            </button>
          ) : (
            <>
              {/* If Logged In + Free Account: Show Upgrade Button */}
              {!isPremium ? (
                <button
                  onClick={onOpenPremiumModal}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#FFE9D9] dark:bg-[#3B2519] hover:bg-[#FAD3B6] dark:hover:bg-[#4E3122] border border-[#FAD3B6] dark:border-[#5C3926] rounded-lg text-[#9C4221] dark:text-[#FFA675] font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-[#E97D3B]" />
                  <span className="hidden sm:inline">{lang === 'id' ? 'Akses Penuh 365' : 'Unlock 365'}</span>
                  <span className="sm:hidden">VIP</span>
                </button>
              ) : (
                <div
                  className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-[#E0E7D1] dark:bg-[#1C3322] border border-[#C6D5B0] dark:border-[#274830] rounded-lg text-[#166534] dark:text-[#86EFAC] font-bold text-[11px] uppercase tracking-wider shadow-xs"
                >
                  <Crown className="w-3.5 h-3.5 text-[#166534] dark:text-[#86EFAC]" />
                  <span>VIP</span>
                </div>
              )}

              {/* Streak pill in header */}
              {user && (
                <button
                  onClick={() => onSelectTab('calendar')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#FFE9D9] dark:bg-[#3B2519] border border-[#FAD3B6] dark:border-[#5C3926] rounded-lg text-[#9C4221] dark:text-[#FFA675] font-bold text-xs shadow-xs hover:bg-[#FFDFC4] dark:hover:bg-[#4E3122] transition-colors cursor-pointer"
                  title="View 30-Day Calendar"
                >
                  <Flame className="w-3.5 h-3.5 fill-[#E97D3B] text-[#E97D3B]" />
                  <span className="font-serif font-black">{user.currentStreak}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
