import React, { useState } from 'react';
import { X, Check, Crown, ArrowRight, ShieldCheck, Loader2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal?: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onOpenAuthModal }) => {
  const { user, isPremium, refreshUser } = useAuth();
  const lang = user?.selectedLanguage || 'en';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeOrder, setActiveOrder] = useState<{
    orderId: string;
    amount: number;
    formattedPrice: string;
    isLiveGatewayConfigured: boolean;
    snapToken?: string;
    redirectUrl?: string;
  } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleStartCheckout = async () => {
    setError('');

    // Require authentication before checkout
    if (!user) {
      if (onOpenAuthModal) {
        onClose();
        onOpenAuthModal();
      } else {
        setError('Please log in or create an account first to attach your lifetime purchase.');
      }
      return;
    }

    setLoading(true);
    try {
      const order = await api.createOrder();
      setActiveOrder(order);

      // If live Midtrans Snap is available on window
      if (order.snapToken && (window as any).snap) {
        (window as any).snap.pay(order.snapToken, {
          onSuccess: async () => {
            await refreshUser();
            setPaymentSuccess(true);
          },
          onPending: () => {
            setError('Payment pending confirmation from payment gateway.');
          },
          onError: () => {
            setError('Payment failed or cancelled.');
          },
          onClose: () => {
            console.log('Customer closed popup without payment.');
          },
        });
      } else if (order.redirectUrl && order.isLiveGatewayConfigured) {
        window.location.href = order.redirectUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Could not initiate checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySandboxSettlement = async () => {
    if (!activeOrder) return;
    setLoading(true);
    setError('');
    try {
      await api.verifyTestCheckout(activeOrder.orderId);
      await refreshUser();
      setPaymentSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { en: 'Full access to the complete 365-topic curated library', id: 'Akses penuh ke seluruh koleksi 365 topik kurasi' },
    { en: 'All 8 categories unlocked (Psychology, Unknown Words, Science, etc.)', id: 'Semua 8 kategori terbuka (Psikologi, Konsep Langka, Sains, dll.)' },
    { en: 'Full 30-day speaking challenge & calendar progression', id: 'Tantangan bicara 30 hari & kalender progres lengkap' },
    { en: 'Streak tracking, personal notes & saved favorites', id: 'Pelacak streak bicara, catatan harian & topik tersimpan' },
    { en: 'One-time payment: Lifetime access forever (No subscription)', id: 'Pembayaran sekali: Akses seumur hidup (Tanpa langganan)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3C2A21]/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FFF9F2] dark:bg-[#201A16] border border-[#F2EDE4] dark:border-[#332720] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-2xl overflow-hidden transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] hover:bg-[#F2EDE4] dark:hover:bg-[#2D241F] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crown Badge */}
        <div className="w-12 h-12 rounded-2xl bg-[#3C2A21] dark:bg-[#2D241F] text-[#FDFBF7] flex items-center justify-center font-serif font-black text-xl mx-auto mb-3 shadow-md border border-[#4A3930]">
          <Crown className="w-6 h-6 text-[#E97D3B]" />
        </div>

        {/* Headline */}
        <div className="text-center mb-5">
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#3C2A21] dark:text-[#FDFBF7] uppercase tracking-tight">
            {lang === 'id' ? 'AKSES SEUMUR HIDUP 365 TOPIK' : 'UNLOCK ALL 365 TOPICS'}
          </h2>
          <div className="inline-block mt-2 px-4 py-1 rounded-full bg-[#FFE9D9] dark:bg-[#3B2519] border border-[#FAD3B6] dark:border-[#5C3926] text-[#9C4221] dark:text-[#FFA675] font-serif font-bold text-xs uppercase tracking-wider">
            {lang === 'id' ? 'Satu Kali Bayar · Rp49.000 · Akses Selamanya' : 'One-Time Payment · Rp49.000 · Lifetime Access'}
          </div>
        </div>

        {/* Features Checklist */}
        <div className="bg-white dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] rounded-2xl p-4 sm:p-5 mb-5 space-y-2.5">
          {benefits.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#3C2A21] dark:text-[#FDFBF7]">
              <div className="w-4 h-4 rounded-full bg-[#E0E7D1] dark:bg-[#23351F] text-[#166534] dark:text-[#86EFAC] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-medium">{lang === 'id' ? item.id : item.en}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FFE9D9] dark:bg-[#3D2517] border border-[#FAD3B6] dark:border-[#523321] rounded-2xl text-xs font-medium text-[#9C4221] dark:text-[#FFA066] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Button & States */}
        <div className="text-center space-y-3">
          {isPremium || paymentSuccess ? (
            <div className="p-4 bg-[#E0E7D1] dark:bg-[#23351F] border border-[#C6D5B0] dark:border-[#385132] rounded-2xl text-[#166534] dark:text-[#86EFAC] font-serif font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{lang === 'id' ? 'LIFETIME VIP AKTIF' : 'LIFETIME VIP ACTIVE'}</span>
              </div>
              <p className="text-[11px] font-sans font-normal opacity-90">
                {lang === 'id'
                  ? 'Semua 365 topik dan 8 kategori telah terbuka penuh di akunmu.'
                  : 'All 365 topics and 8 categories are permanently unlocked.'}
              </p>
            </div>
          ) : activeOrder && !activeOrder.isLiveGatewayConfigured ? (
            // Development/Sandbox Server-Verified Testing Panel
            <div className="bg-[#FFF9F2] dark:bg-[#1E1714] border border-[#F2EDE4] dark:border-[#3D322B] rounded-2xl p-4 text-left space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#3C2A21] dark:text-[#FDFBF7]">
                <span>Order ID: <span className="font-mono">{activeOrder.orderId}</span></span>
                <span className="text-[#E97D3B]">Rp49.000</span>
              </div>
              <p className="text-[11px] text-[#736B5E] dark:text-[#A89F93]">
                {lang === 'id'
                  ? 'Kunci gateway Midtrans/Xendit belum diatur di .env. Kamu dapat memverifikasi simulasi pembayaran melalui endpoint server backend kami.'
                  : 'Payment gateway API keys are running in sandbox verification mode. You can test backend verification.'}
              </p>

              <button
                onClick={handleVerifySandboxSettlement}
                disabled={loading}
                className="w-full py-3 px-4 bg-[#166534] hover:bg-[#14532D] text-white font-bold uppercase tracking-wider text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === 'id' ? 'Verifikasi Pembayaran (Server)' : 'Verify Payment (Server Authoritative)'}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartCheckout}
              disabled={loading}
              className="w-full py-4 px-6 bg-[#E97D3B] hover:bg-[#D96B28] text-white font-bold uppercase tracking-wider text-sm rounded-full shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>
                    {!user
                      ? lang === 'id'
                        ? 'Masuk & Beli Akses Rp49.000'
                        : 'Log In & Unlock for Rp49.000'
                      : lang === 'id'
                      ? 'Lanjut ke Pembayaran (Rp49.000)'
                      : 'Proceed to Payment (Rp49.000)'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          <div>
            <button
              onClick={onClose}
              className="text-xs text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] underline font-serif font-bold uppercase tracking-wider cursor-pointer"
            >
              {lang === 'id' ? 'Kembali ke Latihan' : 'Continue Free Practice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
