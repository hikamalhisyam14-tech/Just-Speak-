import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { GeneratorView } from './components/GeneratorView';
import { ChallengeCalendar } from './components/ChallengeCalendar';
import { SavedTopicsView } from './components/SavedTopicsView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { PremiumModal } from './components/PremiumModal';
import { Topic } from './types';
import { api } from './services/api';
import confetti from 'canvas-confetti';
import { CheckCircle2, Crown, AlertCircle, Loader2 } from 'lucide-react';

type Tab = 'generator' | 'calendar' | 'saved' | 'settings';

function MainAppContent() {
  const { user, refreshUser } = useAuth();
  const lang = user?.selectedLanguage || 'en';

  const [currentTab, setCurrentTab] = useState<Tab>('generator');
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  // Payment Return Status Notification
  const [paymentBanner, setPaymentBanner] = useState<{
    type: 'checking' | 'success' | 'pending' | 'error';
    message: string;
  } | null>(null);

  // Check URL parameters for Midtrans return redirect (Finish URL)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');

    if (orderId) {
      // Clean URL params immediately to avoid re-triggering on manual refresh
      window.history.replaceState({}, document.title, window.location.pathname);

      // Step 1: Immediately show initial checking message
      setPaymentBanner({
        type: 'checking',
        message:
          lang === 'id'
            ? 'Pembayaran diterima. Memeriksa akses VIP Anda...'
            : 'Payment received. Checking your VIP access...',
      });

      // Step 2: Verify the payment status with backend (never trust query params alone)
      (async () => {
        try {
          const res = await api.checkOrderStatus(orderId);
          if (res.premium || res.status === 'settlement') {
            await refreshUser();
            try {
              confetti({
                particleCount: 90,
                spread: 80,
                origin: { y: 0.5 },
                colors: ['#E97D3B', '#166534', '#3C2A21', '#FFD166'],
              });
            } catch {}
            setPaymentBanner({
              type: 'success',
              message:
                lang === 'id'
                  ? 'VIP terbuka. Semua 365 topik dan 8 kategori kini aktif.'
                  : 'VIP unlocked.',
            });
          } else if (res.status === 'pending') {
            setPaymentBanner({
              type: 'pending',
              message:
                lang === 'id'
                  ? 'Pembayaran Anda sedang dikonfirmasi. Mohon tunggu beberapa saat.'
                  : 'Your payment is being confirmed. Please wait a moment.',
            });
          } else {
            setPaymentBanner({
              type: 'error',
              message:
                lang === 'id'
                  ? 'Pembayaran belum diselesaikan atau dibatalkan.'
                  : 'Payment was not completed or was cancelled.',
            });
          }
        } catch (err: any) {
          console.error('Error verifying returned payment:', err);
          setPaymentBanner({
            type: 'error',
            message:
              lang === 'id'
                ? 'Gagal memverifikasi status pembayaran. Silakan cek di menu akun.'
                : 'Could not verify payment status. Please check your account settings.',
          });
        }
      })();
    }
  }, [lang, refreshUser]);

  const handleTopicSelected = (topic: Topic) => {
    setActiveTopic(topic);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] dark:bg-[#181412] text-[#3C2A21] dark:text-[#FDFBF7] transition-colors duration-200">
      {/* Universal Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenPremiumModal={() => setPremiumModalOpen(true)}
      />

      {/* Payment Confirmation Banner */}
      {paymentBanner && (
        <div
          className={`max-w-5xl mx-auto w-full px-4 sm:px-6 pt-4 transition-all`}
        >
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-md ${
              paymentBanner.type === 'success'
                ? 'bg-[#E0E7D1] dark:bg-[#23351F] border-[#C6D5B0] dark:border-[#385132] text-[#166534] dark:text-[#86EFAC]'
                : paymentBanner.type === 'pending'
                ? 'bg-[#FFF3D6] dark:bg-[#3D3019] border-[#FCE19C] dark:border-[#5C4825] text-[#8C6209] dark:text-[#FDE68A]'
                : paymentBanner.type === 'checking'
                ? 'bg-[#FFE9D9] dark:bg-[#3B2519] border-[#FAD3B6] dark:border-[#5C3926] text-[#9C4221] dark:text-[#FFA675]'
                : 'bg-[#FFE9D9] dark:bg-[#3D2517] border-[#FAD3B6] dark:border-[#523321] text-[#9C4221] dark:text-[#FFA066]'
            }`}
          >
            <div className="flex items-center gap-3">
              {paymentBanner.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : paymentBanner.type === 'pending' ? (
                <Crown className="w-5 h-5 shrink-0 text-[#E97D3B]" />
              ) : paymentBanner.type === 'checking' ? (
                <Loader2 className="w-5 h-5 shrink-0 animate-spin text-[#E97D3B]" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-serif font-bold">
                {paymentBanner.message}
              </span>
            </div>
            <button
              onClick={() => setPaymentBanner(null)}
              className="text-xs underline font-bold px-2 py-1 cursor-pointer opacity-80 hover:opacity-100"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === 'generator' && (
          <GeneratorView
            currentTopic={activeTopic}
            onTopicSelected={handleTopicSelected}
            onGoToCalendar={() => setCurrentTab('calendar')}
          />
        )}

        {currentTab === 'calendar' && (
          <ChallengeCalendar
            onStartTodayChallenge={() => setCurrentTab('generator')}
          />
        )}

        {currentTab === 'saved' && (
          <SavedTopicsView
            onSelectTopic={(topic) => {
              setActiveTopic(topic);
              setCurrentTab('generator');
            }}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            onOpenPremiumModal={() => setPremiumModalOpen(true)}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#F2EDE4] dark:border-[#2D241F] bg-[#FDFBF7] dark:bg-[#181412] py-6 px-4 text-center text-xs text-[#736B5E] dark:text-[#A89F93] transition-colors duration-200">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-black text-sm text-[#3C2A21] dark:text-[#FDFBF7] uppercase">Just Speak</span>
            <span>•</span>
            <span className="italic font-serif">“Pick something. Learn something. Speak for one minute.”</span>
          </div>

          <div className="text-[#A69D91] dark:text-[#6E645A]">
            © 2026 JUST SPEAK
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="signup"
      />

      {/* VIP Full Access Modal */}
      <PremiumModal
        isOpen={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
