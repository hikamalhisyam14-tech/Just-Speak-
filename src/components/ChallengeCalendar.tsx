import React, { useState, useEffect } from 'react';
import { Flame, Calendar as CalendarIcon, CheckCircle2, Award, Clock, Sparkles, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CompletedChallenge } from '../types';

interface ChallengeCalendarProps {
  onStartTodayChallenge: () => void;
}

const ENCOURAGING_MESSAGES_EN = [
  'Keep going.',
  'You showed up today.',
  'One more day.',
  'Still going.',
  "Don't break the streak.",
  'See you tomorrow.',
  'You got this.',
  'Another day done.',
];

const ENCOURAGING_MESSAGES_ID = [
  'Teruslah melangkah.',
  'Kamu hadir hari ini.',
  'Satu hari lagi selesai.',
  'Masih terus melangkah.',
  'Pertahankan streak-mu.',
  'Sampai jumpa besok.',
  'Hebat, kamu bisa!',
  'Satu hari lagi tercapai.',
];

export const ChallengeCalendar: React.FC<ChallengeCalendarProps> = ({ onStartTodayChallenge }) => {
  const { user } = useAuth();
  const lang = user?.selectedLanguage || 'en';

  const [selectedDayRecord, setSelectedDayRecord] = useState<CompletedChallenge | null>(null);
  const [animatedStreak, setAnimatedStreak] = useState(0);

  const completedList = user?.completedChallenges || [];
  const completedCount = completedList.length;
  const currentStreak = user?.currentStreak || 0;
  const longestStreak = user?.longestStreak || 0;
  const totalMinutes = completedCount * 1; // 1 min each

  // Determine today's day number in the challenge
  const todayDayNumber = Math.min(30, completedCount + 1);

  // 30 days array [1..30]
  const daysArray = Array.from({ length: 30 }, (_, i) => i + 1);

  // Gentle upward streak animation on calendar mount
  useEffect(() => {
    let start = 0;
    const end = currentStreak;
    if (end === 0) {
      setAnimatedStreak(0);
      return;
    }
    const duration = 600;
    const stepTime = Math.max(20, Math.floor(duration / end));

    const interval = setInterval(() => {
      start += 1;
      setAnimatedStreak(start);
      if (start >= end) {
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [currentStreak]);

  // Pick a random encouraging message for the banner
  const [encouragingNote] = useState(() => {
    const msgs = lang === 'id' ? ENCOURAGING_MESSAGES_ID : ENCOURAGING_MESSAGES_EN;
    return msgs[Math.floor(Math.random() * msgs.length)];
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Stats */}
      <div className="bg-[#FFF9F2] dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#3D322B] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#E0E7D1] dark:bg-[#1C3322] border border-[#C6D5B0] dark:border-[#274830] rounded-full text-xs font-serif font-bold text-[#166534] dark:text-[#86EFAC] mb-2 uppercase tracking-widest">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>30-DAY SPEAKING CHALLENGE</span>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-4xl text-[#3C2A21] dark:text-[#FDFBF7] tracking-tight uppercase">
              {lang === 'id' ? 'TANTANGAN 30 HARI' : '30-DAY CHALLENGE'}
            </h1>
            <p className="text-xs sm:text-sm text-[#736B5E] dark:text-[#A89F93] mt-1 font-serif italic">
              “{encouragingNote}”
            </p>
          </div>

          <button
            onClick={onStartTodayChallenge}
            className="px-6 py-3.5 bg-[#E97D3B] hover:bg-[#D96B28] text-white font-bold uppercase tracking-wider text-xs rounded-full shadow-lg shadow-orange-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2 self-start sm:self-auto shrink-0 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'id' ? 'Bicara Hari Ini' : "Today's Challenge"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F2EDE4] dark:border-[#3D322B]">
          <div className="p-4 bg-white dark:bg-[#201915] border border-[#F2EDE4] dark:border-[#3D322B] rounded-2xl shadow-xs">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#736B5E] dark:text-[#A89F93] block">
              {lang === 'id' ? 'HARI SELESAI' : 'COMPLETED'}
            </span>
            <div className="font-serif font-black text-xl sm:text-2xl text-[#166534] dark:text-[#86EFAC] mt-0.5">
              {completedCount} / 30
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#201915] border border-[#F2EDE4] dark:border-[#3D322B] rounded-2xl shadow-xs">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#736B5E] dark:text-[#A89F93] block">
              {lang === 'id' ? 'STREAK SAAT INI' : 'CURRENT STREAK'}
            </span>
            <div className="font-serif font-black text-xl sm:text-2xl text-[#E97D3B] mt-0.5 flex items-center gap-1.5">
              <Flame className="w-5 h-5 fill-[#E97D3B] text-[#E97D3B]" />
              <span className="transition-all">{animatedStreak} {lang === 'id' ? 'Hari' : 'Days'}</span>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#201915] border border-[#F2EDE4] dark:border-[#3D322B] rounded-2xl shadow-xs">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#736B5E] dark:text-[#A89F93] block">
              {lang === 'id' ? 'STREAK TERPANJANG' : 'LONGEST STREAK'}
            </span>
            <div className="font-serif font-black text-xl sm:text-2xl text-[#3C2A21] dark:text-[#FDFBF7] mt-0.5 flex items-center gap-1">
              <Award className="w-5 h-5 text-[#D97724]" />
              <span>{longestStreak} {lang === 'id' ? 'Hari' : 'Days'}</span>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-[#201915] border border-[#F2EDE4] dark:border-[#3D322B] rounded-2xl shadow-xs">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#736B5E] dark:text-[#A89F93] block">
              {lang === 'id' ? 'TOTAL BICARA' : 'TIME SPOKEN'}
            </span>
            <div className="font-serif font-black text-xl sm:text-2xl text-[#3C2A21] dark:text-[#FDFBF7] mt-0.5 flex items-center gap-1">
              <Clock className="w-5 h-5 text-[#8A4F3D] dark:text-[#FFA675]" />
              <span>{totalMinutes} {lang === 'id' ? 'Mnt' : 'Mins'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 30-Day Grid */}
      <div className="bg-[#FFFFFF] dark:bg-[#251E1A] border border-[#F2EDE4] dark:border-[#3D322B] rounded-[32px] p-6 sm:p-8 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="font-serif font-black text-lg sm:text-xl text-[#3C2A21] dark:text-[#FDFBF7] uppercase">
            {lang === 'id' ? 'KALENDER 30 HARI' : '30-DAY PROGRESS'}
          </h2>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#736B5E] dark:text-[#A89F93]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#166534] dark:bg-[#86EFAC]"></span>
              <span>{lang === 'id' ? 'Selesai' : 'Completed'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-[#E97D3B] bg-[#FFE9D9] dark:bg-[#3B2519]"></span>
              <span>{lang === 'id' ? 'Hari Ini' : 'Today'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F2EDE4] dark:bg-[#3D322B]"></span>
              <span>{lang === 'id' ? 'Mendatang' : 'Upcoming'}</span>
            </div>
          </div>
        </div>

        {/* The Grid: DAY 01 .. DAY 30 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-6 gap-2.5 sm:gap-3">
          {daysArray.map((dayNum) => {
            const completedRecord = completedList.find((c) => c.dayNumber === dayNum);
            const isCompleted = !!completedRecord;
            const isToday = !isCompleted && dayNum === todayDayNumber;
            const dayLabel = `DAY ${String(dayNum).padStart(2, '0')}`;

            return (
              <button
                key={dayNum}
                onClick={() => {
                  if (completedRecord) {
                    setSelectedDayRecord(completedRecord);
                  } else if (isToday) {
                    onStartTodayChallenge();
                  }
                }}
                disabled={!isCompleted && !isToday}
                className={`p-3.5 rounded-2xl flex flex-col items-center justify-center transition-all relative border cursor-pointer ${
                  isCompleted
                    ? 'bg-[#E0E7D1] dark:bg-[#1C3322] border-[#C6D5B0] dark:border-[#274830] text-[#166534] dark:text-[#86EFAC] hover:bg-[#D4E0C2] dark:hover:bg-[#23402B] shadow-xs active:scale-95'
                    : isToday
                    ? 'bg-[#FFE9D9] dark:bg-[#3B2519] border-2 border-[#E97D3B] text-[#3C2A21] dark:text-[#FDFBF7] shadow-md ring-4 ring-[#E97D3B]/20 animate-pulse hover:scale-105 active:scale-95'
                    : 'bg-[#FDFBF7] dark:bg-[#1E1714] border-[#F2EDE4] dark:border-[#3D322B] text-[#A69D91] dark:text-[#6E645A] opacity-70 cursor-default'
                }`}
                title={
                  completedRecord
                    ? `${dayLabel}: ${completedRecord.topicText}`
                    : isToday
                    ? `Today: ${dayLabel}`
                    : dayLabel
                }
              >
                {/* Visual Today Pulse Beacon */}
                {isToday && (
                  <div className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E97D3B] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E97D3B]"></span>
                  </div>
                )}

                <span className="font-serif font-black text-sm sm:text-base leading-none">
                  {dayLabel}
                </span>

                {isCompleted && (
                  <div className="flex items-center gap-1 text-[#166534] dark:text-[#86EFAC] mt-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Done</span>
                  </div>
                )}

                {isToday && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E97D3B] text-white text-[9px] font-black uppercase tracking-widest mt-1.5 shadow-xs">
                    {lang === 'id' ? 'HARI INI' : 'TODAY'}
                  </span>
                )}

                {!isCompleted && !isToday && (
                  <span className="text-[10px] text-[#A69D91] dark:text-[#6E645A] mt-1.5">
                    1:00 min
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Completed Day Modal */}
      {selectedDayRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3C2A21]/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#FFF9F2] dark:bg-[#251E1A] border border-[#F2EDE4] dark:border-[#3D322B] rounded-[32px] p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setSelectedDayRecord(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] hover:bg-[#F2EDE4] dark:hover:bg-[#332A24] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E0E7D1] dark:bg-[#1C3322] border border-[#C6D5B0] dark:border-[#274830] rounded-full text-xs font-serif font-bold text-[#166534] dark:text-[#86EFAC] mb-3 uppercase tracking-widest">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>DAY {String(selectedDayRecord.dayNumber).padStart(2, '0')} COMPLETED</span>
            </div>

            <h3 className="font-serif font-black text-xl sm:text-2xl text-[#3C2A21] dark:text-[#FDFBF7] tracking-tight mb-2 uppercase">
              {selectedDayRecord.topicText}
            </h3>

            <div className="flex items-center gap-2 text-xs text-[#736B5E] dark:text-[#A89F93] mb-6">
              <span className="uppercase font-bold">{selectedDayRecord.category}</span>
              <span>•</span>
              <span>{selectedDayRecord.completedAt}</span>
              <span>•</span>
              <span>1:00 min spoken</span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDayRecord(null)}
                className="px-6 py-2.5 bg-[#3C2A21] dark:bg-[#E97D3B] hover:bg-[#251A14] dark:hover:bg-[#D96B28] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer"
              >
                {lang === 'id' ? 'Tutup' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
