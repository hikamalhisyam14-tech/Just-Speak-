import React, { useState, useEffect } from 'react';
import { User, Globe, Crown, LogOut, CheckCircle2, Sun, Moon, LogIn, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsViewProps {
  onOpenPremiumModal: () => void;
  onOpenAuthModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenPremiumModal, onOpenAuthModal }) => {
  const { user, isAuthenticated, isPremium, theme, setTheme, updateUser, setLanguage, logout } = useAuth();
  const lang = user?.selectedLanguage || 'en';

  const [name, setName] = useState(user?.name || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize local input state whenever the authenticated user changes
  useEffect(() => {
    setName(user?.name || '');
  }, [user?.id, user?.name]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    updateUser({ ...user, name: name.trim() });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Settings Title */}
      <div className="bg-[#FFF9F2] dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#3D322B] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xs transition-colors duration-200">
        <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#3C2A21] dark:text-[#FDFBF7] uppercase">
          {lang === 'id' ? 'AKUN & PENGATURAN' : 'ACCOUNT & SETTINGS'}
        </h1>
        <p className="text-xs sm:text-sm text-[#736B5E] dark:text-[#A89F93] mt-1 font-serif italic">
          {lang === 'id'
            ? 'Kelola tema tampilan, bahasa latihan, dan status akunmu.'
            : 'Manage appearance, language preferences, and your account status.'}
        </p>
      </div>

      {/* Account Authentication Card */}
      {!isAuthenticated || !user ? (
        <div className="bg-white dark:bg-[#251E1A] border border-[#F2EDE4] dark:border-[#3D322B] rounded-[32px] p-6 sm:p-8 shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9F2] dark:bg-[#1E1714] border border-[#F2EDE4] dark:border-[#3D322B] flex items-center justify-center text-[#E97D3B]">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-black text-lg text-[#3C2A21] dark:text-[#FDFBF7] uppercase">
                {lang === 'id' ? 'Status: Belum Masuk (Tamu)' : 'Status: Not Logged In'}
              </h2>
              <span className="inline-block mt-0.5 px-3 py-0.5 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider bg-[#F2EDE4] dark:bg-[#2D241F] text-[#736B5E] dark:text-[#A89F93]">
                {lang === 'id' ? 'Akses Gratis Terbatas (16 Topik)' : 'Limited Free Access (16 Topics)'}
              </span>
            </div>
          </div>
          <p className="text-xs text-[#736B5E] dark:text-[#A89F93] mb-5 font-serif">
            {lang === 'id'
              ? 'Buat akun atau masuk untuk menyimpan topik favorit, mencatat riwayat tantangan 30 hari, dan membeli akses penuh seumur hidup.'
              : 'Create an account or log in to save favorite topics, track your 30-day challenge progress, and purchase lifetime access.'}
          </p>

          <div className="flex flex-wrap gap-3">
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-6 py-3 bg-[#3C2A21] dark:bg-[#E97D3B] hover:bg-[#2A1D17] dark:hover:bg-[#D96B28] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{lang === 'id' ? 'Masuk / Buat Akun' : 'Log In / Create Account'}</span>
              </button>
            )}
            <button
              onClick={onOpenPremiumModal}
              className="px-6 py-3 bg-[#FFE9D9] dark:bg-[#3B2519] hover:bg-[#FAD3B6] dark:hover:bg-[#4E3122] border border-[#FAD3B6] dark:border-[#5C3926] text-[#9C4221] dark:text-[#FFA675] text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-2 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-[#E97D3B]" />
              <span>{lang === 'id' ? 'Lihat Akses 365 Topik (Rp49.000)' : 'View 365 Lifetime Access'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* User Profile Form */}
          <div className="bg-white dark:bg-[#251E1A] border border-[#F2EDE4] dark:border-[#3D322B] rounded-[32px] p-6 sm:p-8 shadow-xs transition-colors duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#E97D3B]" />
                <h2 className="font-serif font-black text-lg text-[#3C2A21] dark:text-[#FDFBF7] uppercase">
                  {lang === 'id' ? 'Profil Pengguna' : 'User Profile'}
                </h2>
              </div>
              <span className="text-[10px] text-[#A69D91] dark:text-[#7A7065] font-mono">
                ID: {user.id}
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-serif font-bold text-[#736B5E] dark:text-[#A89F93] uppercase tracking-wider mb-1.5">
                  {lang === 'id' ? 'Nama Tampilan' : 'Display Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FFF9F2] dark:bg-[#1E1714] border border-[#F2EDE4] dark:border-[#3D322B] rounded-full text-sm text-[#3C2A21] dark:text-[#FDFBF7] focus:outline-none focus:ring-2 focus:ring-[#E97D3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-[#736B5E] dark:text-[#A89F93] uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-3 bg-[#F2EDE4] dark:bg-[#2F2620] border border-[#E5E2D9] dark:border-[#3D322B] rounded-full text-sm text-[#A69D91] cursor-not-allowed opacity-80"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#3C2A21] dark:bg-[#E97D3B] hover:bg-[#251A14] dark:hover:bg-[#D96B28] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all shadow-xs cursor-pointer"
                >
                  {lang === 'id' ? 'Simpan' : 'Save Changes'}
                </button>

                {saveSuccess && (
                  <span className="text-xs font-bold text-[#166534] dark:text-[#86EFAC] flex items-center gap-1 font-serif">
                    <CheckCircle2 className="w-4 h-4" />
                    {lang === 'id' ? 'Tersimpan!' : 'Saved successfully!'}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Membership / VIP Status Banner */}
          <div className="bg-white dark:bg-[#251E1A] border border-[#F2EDE4] dark:border-[#3D322B] rounded-[32px] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF9F2] dark:bg-[#1E1714] border border-[#F2EDE4] dark:border-[#3D322B] flex items-center justify-center">
                <Crown className={`w-5 h-5 ${isPremium ? 'text-[#166534] dark:text-[#86EFAC]' : 'text-[#E97D3B]'}`} />
              </div>
              <div>
                <h3 className="font-serif font-black text-base text-[#3C2A21] dark:text-[#FDFBF7] uppercase">
                  {lang === 'id' ? 'Status Keanggotaan' : 'Account Status'}
                </h3>
                <span
                  className={`inline-block mt-1 px-3 py-0.5 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider ${
                    isPremium
                      ? 'bg-[#E0E7D1] dark:bg-[#1C3322] text-[#166534] dark:text-[#86EFAC] border border-[#C6D5B0] dark:border-[#274830]'
                      : 'bg-[#FFE9D9] dark:bg-[#3B2519] text-[#9C4221] dark:text-[#FFA675] border border-[#FAD3B6] dark:border-[#5C3926]'
                  }`}
                >
                  {isPremium
                    ? lang === 'id'
                      ? 'LIFETIME VIP (365 TOPIK AKTIF)'
                      : 'LIFETIME VIP (ALL 365 TOPICS UNLOCKED)'
                    : lang === 'id'
                    ? 'AKUN GRATIS (16 TOPIK TERSEDIA)'
                    : 'FREE ACCOUNT (16 TOPICS)'}
                </span>
              </div>
            </div>

            {!isPremium && (
              <button
                onClick={onOpenPremiumModal}
                className="px-5 py-2.5 bg-[#E97D3B] hover:bg-[#D96B28] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer self-start sm:self-auto shadow-xs flex items-center gap-1.5"
              >
                <Crown className="w-4 h-4" />
                <span>{lang === 'id' ? 'Beli Akses Rp49.000' : 'Unlock Lifetime (Rp49.000)'}</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Theme Appearance Section: LIGHT / DARK */}
      <div className="bg-white dark:bg-[#251E1A] border border-[#F2EDE4] dark:border-[#3D322B] rounded-[32px] p-6 sm:p-8 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2 mb-2">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-[#E97D3B]" /> : <Sun className="w-5 h-5 text-[#E97D3B]" />}
          <h2 className="font-serif font-black text-lg text-[#3C2A21] dark:text-[#FDFBF7] uppercase">
            {lang === 'id' ? 'Tema Tampilan' : 'Appearance Theme'}
          </h2>
        </div>
        <p className="text-xs text-[#736B5E] dark:text-[#A89F93] mb-4 font-serif italic">
          {lang === 'id'
            ? 'Pilih tema terang yang hangat atau tema gelap yang nyaman di mata.'
            : 'Choose between the warm light theme or comfortable dark theme.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
              theme === 'light'
                ? 'bg-[#FFE9D9] dark:bg-[#3B2519] border-[#E97D3B] text-[#3C2A21] dark:text-[#FDFBF7] shadow-xs'
                : 'bg-[#FFF9F2] dark:bg-[#1E1714] border-[#F2EDE4] dark:border-[#3D322B] text-[#736B5E] dark:text-[#A89F93] hover:bg-[#F2EDE4] dark:hover:bg-[#2F2620]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#2C231E] border border-[#F2EDE4] dark:border-[#3D322B] flex items-center justify-center text-[#E97D3B]">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-black text-sm text-[#3C2A21] dark:text-[#FDFBF7] uppercase tracking-wide">
                  LIGHT
                </div>
                <div className="text-[11px] text-[#736B5E] dark:text-[#A89F93]">
                  {lang === 'id' ? 'Warm White' : 'Warm white & orange'}
                </div>
              </div>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-[#E97D3B]" />}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#FFE9D9] dark:bg-[#3B2519] border-[#E97D3B] text-[#3C2A21] dark:text-[#FDFBF7] shadow-xs'
                : 'bg-[#FFF9F2] dark:bg-[#1E1714] border-[#F2EDE4] dark:border-[#3D322B] text-[#736B5E] dark:text-[#A89F93] hover:bg-[#F2EDE4] dark:hover:bg-[#2F2620]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#2C231E] border border-[#F2EDE4] dark:border-[#3D322B] flex items-center justify-center text-[#E97D3B]">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-serif font-black text-sm text-[#3C2A21] dark:text-[#FDFBF7] uppercase tracking-wide">
                  DARK
                </div>
                <div className="text-[11px] text-[#736B5E] dark:text-[#A89F93]">
                  {lang === 'id' ? 'Warm Charcoal' : 'Warm charcoal & orange'}
                </div>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-[#E97D3B]" />}
          </button>
        </div>
      </div>

      {/* Language Preference Section */}
      <div className="bg-white dark:bg-[#251E1A] border border-[#F2EDE4] dark:border-[#3D322B] rounded-[32px] p-6 sm:p-8 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-[#E97D3B]" />
          <h2 className="font-serif font-black text-lg text-[#3C2A21] dark:text-[#FDFBF7] uppercase">
            {lang === 'id' ? 'Bahasa Topik & Prompt' : 'Challenge Language'}
          </h2>
        </div>
        <p className="text-xs text-[#736B5E] dark:text-[#A89F93] mb-4 font-serif italic">
          {lang === 'id'
            ? 'Pilih bahasa untuk topik yang digenerate.'
            : 'Select the primary language for your generated topics.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <button
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
              lang === 'en'
                ? 'bg-[#FFE9D9] dark:bg-[#3B2519] border-[#E97D3B] text-[#3C2A21] dark:text-[#FDFBF7] shadow-xs'
                : 'bg-[#FFF9F2] dark:bg-[#1E1714] border-[#F2EDE4] dark:border-[#3D322B] text-[#736B5E] dark:text-[#A89F93] hover:bg-[#F2EDE4] dark:hover:bg-[#2F2620]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇬🇧</span>
              <div>
                <div className="font-serif font-black text-sm text-[#3C2A21] dark:text-[#FDFBF7]">English</div>
                <div className="text-[11px] text-[#736B5E] dark:text-[#A89F93]">Curated speaking topics</div>
              </div>
            </div>
            {lang === 'en' && <CheckCircle2 className="w-5 h-5 text-[#E97D3B]" />}
          </button>

          <button
            onClick={() => setLanguage('id')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
              lang === 'id'
                ? 'bg-[#FFE9D9] dark:bg-[#3B2519] border-[#E97D3B] text-[#3C2A21] dark:text-[#FDFBF7] shadow-xs'
                : 'bg-[#FFF9F2] dark:bg-[#1E1714] border-[#F2EDE4] dark:border-[#3D322B] text-[#736B5E] dark:text-[#A89F93] hover:bg-[#F2EDE4] dark:hover:bg-[#2F2620]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇮🇩</span>
              <div>
                <div className="font-serif font-black text-sm text-[#3C2A21] dark:text-[#FDFBF7]">Bahasa Indonesia</div>
                <div className="text-[11px] text-[#736B5E] dark:text-[#A89F93]">Topik bicara kurasi</div>
              </div>
            </div>
            {lang === 'id' && <CheckCircle2 className="w-5 h-5 text-[#E97D3B]" />}
          </button>
        </div>
      </div>

      {/* Logout button (Only visible if logged in) */}
      {isAuthenticated && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={logout}
            className="px-6 py-3 bg-[#FFE9D9] dark:bg-[#3B2519] hover:bg-[#FAD3B6] dark:hover:bg-[#4E3122] text-[#9C4221] dark:text-[#FFA675] text-xs font-bold uppercase tracking-wider rounded-full transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'id' ? 'Keluar Akun' : 'Log Out'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
