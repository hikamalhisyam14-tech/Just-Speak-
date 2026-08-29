import React, { useEffect, useState } from 'react';
import { Sparkles, Bookmark, Flame, CheckCircle2, ChevronRight, Play, Pause, RotateCcw, ArrowRight, Calendar, History, SlidersHorizontal, X, Clock, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CATEGORIES, TOPIC_DATABASE } from '../data/topics';
import { Category, Topic } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/audio';

interface GeneratorViewProps {
  currentTopic: Topic | null;
  onTopicSelected: (topic: Topic) => void;
  onGoToCalendar: () => void;
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

const SPEAKING_TIME_OPTIONS = [
  { seconds: 60, labelEn: '1 minute', labelId: '1 menit', shortEn: '1 min', shortId: '1 mnt', isDefault: true },
  { seconds: 90, labelEn: '1.5 minutes', labelId: '1.5 menit', shortEn: '1.5 min', shortId: '1.5 mnt', isDefault: false },
  { seconds: 120, labelEn: '2 minutes', labelId: '2 menit', shortEn: '2 min', shortId: '2 mnt', isDefault: false },
  { seconds: 180, labelEn: '3 minutes', labelId: '3 menit', shortEn: '3 min', shortId: '3 mnt', isDefault: false },
];

// Fallback curated starter topics for "Recent Topics" if none recorded yet
const DEFAULT_RECENT_TOPIC_IDS = ['topic-46', 'topic-91', 'topic-1', 'topic-136']; // Limerence, Blood Falls, Embarrassing memories, Rosetta Stone

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  currentTopic,
  onTopicSelected,
  onGoToCalendar,
}) => {
  const { user, toggleSaveTopic, completeTodayChallenge, addRecentTopic } = useAuth();
  const lang = user?.selectedLanguage || 'en';

  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [speakingDuration, setSpeakingDuration] = useState<number>(60);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [tempCategory, setTempCategory] = useState<Category>('all');
  const [tempDuration, setTempDuration] = useState<number>(60);

  const [isRolling, setIsRolling] = useState(false);
  const [displayTopicText, setDisplayTopicText] = useState<string>(
    currentTopic ? currentTopic.topic : ''
  );
  const [revealedTopic, setRevealedTopic] = useState<Topic | null>(currentTopic);

  // Speaking Timer state
  const [timeLeft, setTimeLeft] = useState(speakingDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string>('');
  const [justCompletedToday, setJustCompletedToday] = useState(false);

  // Sync external topic
  useEffect(() => {
    if (currentTopic) {
      setRevealedTopic(currentTopic);
      setDisplayTopicText(currentTopic.topic);
    }
  }, [currentTopic]);

  // Timer countdown hook
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsTimerFinished(true);
            sound.playCompletionGong();
            handleFinishSpeaking();
            return 0;
          }
          if (prev <= 10) {
            sound.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, timeLeft]);

  // Handle completion when time runs out or user marks done
  const handleFinishSpeaking = () => {
    if (!revealedTopic) return;
    try {
      if (user) {
        completeTodayChallenge(revealedTopic);
      }
      const messages = lang === 'id' ? ENCOURAGING_MESSAGES_ID : ENCOURAGING_MESSAGES_EN;
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setCompletionMessage(randomMsg);
      setJustCompletedToday(true);

      // Trigger celebratory confetti burst safely
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E97D3B', '#166534', '#3C2A21', '#FFD166'],
        });
      } catch {}
    } catch (err) {
      console.error(err);
    }
  };

  // Roulette rolling animation
  const handleGenerate = () => {
    if (isRolling) return;

    // Reset timer state
    setIsTimerRunning(false);
    setTimeLeft(speakingDuration);
    setIsTimerFinished(false);
    setJustCompletedToday(false);
    setCompletionMessage('');

    setIsRolling(true);

    const availableTopics = api.getTopics(selectedCategory, lang, user);
    const { topic: targetTopic } = api.getRandomTopic(selectedCategory, lang, user, revealedTopic?.id);
    const rollingPool = availableTopics.length > 0 ? availableTopics : [targetTopic];

    // Sequence of intervals that rapidly cycle then slow down smoothly (~2.8s)
    const delays = [50, 50, 60, 60, 70, 80, 100, 130, 170, 220, 300, 420, 600];
    let step = 0;

    const runStep = () => {
      if (step < delays.length) {
        const rand = rollingPool[Math.floor(Math.random() * rollingPool.length)];
        if (rand) {
          setDisplayTopicText(rand.topic);
        }
        sound.playRollTick(1 + step * 0.05);

        const currentDelay = delays[step];
        step++;
        setTimeout(runStep, currentDelay);
      } else {
        if (targetTopic) {
          setDisplayTopicText(targetTopic.topic);
          setRevealedTopic(targetTopic);
          onTopicSelected(targetTopic);
          if (user) {
            addRecentTopic(targetTopic.id);
          }
        }
        setIsRolling(false);
        sound.playReveal();
      }
    };

    runStep();
  };

  // Timer controls
  const handleStartTimer = () => {
    if (timeLeft === 0) {
      setTimeLeft(speakingDuration);
      setIsTimerFinished(false);
    }
    sound.playStart();
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(speakingDuration);
    setIsTimerFinished(false);
  };

  const handleManualComplete = () => {
    if (justCompletedToday) return;
    setIsTimerRunning(false);
    setIsTimerFinished(true);
    sound.playCompletionGong();
    handleFinishSpeaking();
  };

  // Select a recent topic to practice
  const handleSelectRecentTopic = (topic: Topic) => {
    setRevealedTopic(topic);
    setDisplayTopicText(topic.topic);
    onTopicSelected(topic);
    addRecentTopic(topic.id);
    setTimeLeft(speakingDuration);
    setIsTimerFinished(false);
    setIsTimerRunning(false);
    setJustCompletedToday(false);
    setCompletionMessage('');
  };

  // Filter modal controls
  const handleOpenFilterModal = () => {
    setTempCategory(selectedCategory);
    setTempDuration(speakingDuration);
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = () => {
    setSelectedCategory(tempCategory);
    setSpeakingDuration(tempDuration);
    // If timer is not active, sync the time left to new duration
    if (!isTimerRunning && !isTimerFinished) {
      setTimeLeft(tempDuration);
    }
    setIsFilterModalOpen(false);
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((speakingDuration - timeLeft) / speakingDuration) * 100;

  // Check if topic is saved
  const isSaved = revealedTopic && user?.savedTopics?.includes(revealedTopic.id);
  const activeCatInfo = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  // Research topic vs Conversational question
  const isResearchTopic = revealedTopic && (
    revealedTopic.type === 'research' ||
    ['psychology', 'unknown_words', 'science_medicine', 'history_culture', 'weird'].includes(revealedTopic.category)
  );

  const isTodayAlreadyDone = user?.lastCompletedDate === new Date().toISOString().split('T')[0];

  // Derive recent topics list
  const userRecentList = user ? api.getRecentTopics(user) : [];
  const displayRecentTopics: Topic[] = userRecentList.length > 0
    ? userRecentList
    : DEFAULT_RECENT_TOPIC_IDS.map(id => TOPIC_DATABASE.find(t => t.id === id)).filter((t): t is Topic => !!t);

  // Active filter badge string
  const isCustomCategory = selectedCategory !== 'all';
  const isCustomDuration = speakingDuration !== 60;
  const hasActiveFilters = isCustomCategory || isCustomDuration;

  const getActiveFilterLabel = () => {
    const parts: string[] = [];
    if (isCustomCategory) {
      const catObj = CATEGORIES.find(c => c.id === selectedCategory);
      if (catObj) {
        parts.push(lang === 'id' ? catObj.nameId : catObj.name);
      }
    }
    if (isCustomDuration) {
      const durObj = SPEAKING_TIME_OPTIONS.find(d => d.seconds === speakingDuration);
      if (durObj) {
        parts.push(lang === 'id' ? durObj.shortId : durObj.shortEn);
      }
    }
    return parts.join(' · ');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Top Quick Status Strip */}
      {user && (
        <div className="bg-[#FFFFFF] dark:bg-[#201A16] border border-[#F2EDE4] dark:border-[#332720] rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFE9D9] dark:bg-[#3D2517] border border-[#FAD3B6] dark:border-[#523321] rounded-full text-[#9C4221] dark:text-[#FFA066] font-bold text-xs sm:text-sm">
              <Flame className="w-4 h-4 fill-[#E97D3B] text-[#E97D3B]" />
              <span className="font-serif font-black">{user.currentStreak}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#A69D91] dark:text-[#B3A89B]">
                {lang === 'id' ? 'HARI STREAK' : 'DAY STREAK'}
              </span>
            </div>

            <button
              onClick={onGoToCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E0E7D1] dark:bg-[#23351F] border border-[#C6D5B0] dark:border-[#385132] rounded-full text-[#166534] dark:text-[#86EFAC] font-bold text-xs sm:text-sm hover:bg-[#D5DFC1] dark:hover:bg-[#2D4528] transition-colors cursor-pointer"
            >
              <span>{user.completedChallenges.length} / 30 {lang === 'id' ? 'HARI' : 'DAYS'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#166534] dark:text-[#86EFAC]" />
            </button>
          </div>

          <div className="text-xs font-semibold text-[#736B5E] dark:text-[#A89F93] flex items-center gap-2">
            {isTodayAlreadyDone ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#E0E7D1] dark:bg-[#23351F] text-[#166534] dark:text-[#86EFAC] rounded-full font-bold uppercase tracking-wider text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {lang === 'id' ? 'Hari Ini Selesai' : 'Completed Today'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FFE9D9] dark:bg-[#3D2517] text-[#9C4221] dark:text-[#FFA066] rounded-full font-bold uppercase tracking-wider text-[10px]">
                ● {lang === 'id' ? 'Belum Praktik' : 'Daily Challenge Pending'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Generator & Speaking Card */}
      <div className="bg-[#FFF9F2] dark:bg-[#201A16] border border-[#F2EDE4] dark:border-[#332720] rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-lg text-center relative overflow-hidden transition-colors">
        {/* Top Organic Accent line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#E97D3B]" />

        {/* 1. Branding header: ONE MINUTE */}
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-4 py-1 bg-white dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] rounded-full text-xs font-serif font-black uppercase tracking-widest text-[#3C2A21] dark:text-[#FDFBF7] shadow-xs">
            <span>ONE MINUTE</span>
          </div>
        </div>

        {/* 2. FILTERS Button (Compact, clean action) */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleOpenFilterModal}
            disabled={isRolling}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer disabled:opacity-60 shadow-2xs ${
              hasActiveFilters
                ? 'bg-[#FFE9D9] dark:bg-[#3D2517] border-[#FAD3B6] dark:border-[#523321] text-[#9C4221] dark:text-[#FFA066]'
                : 'bg-white dark:bg-[#271F1A] border-[#E5E2D9] dark:border-[#382B24] text-[#736B5E] dark:text-[#D1C7BA] hover:border-[#3C2A21] dark:hover:border-[#E97D3B]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#E97D3B]" />
            <span>{lang === 'id' ? 'FILTER' : 'FILTERS'}</span>
            {hasActiveFilters && (
              <span className="text-[11px] font-medium lowercase first-letter:uppercase text-[#3C2A21] dark:text-[#FDFBF7] border-l border-[#E5E2D9] dark:border-[#42342B] pl-2">
                {getActiveFilterLabel()}
              </span>
            )}
          </button>
        </div>

        {/* 3. Primary Action: GENERATE TOPIC Button & Bookmark */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={handleGenerate}
            disabled={isRolling}
            className="px-10 sm:px-14 py-4 sm:py-5 bg-[#E97D3B] hover:bg-[#D96B28] text-white font-bold uppercase tracking-widest text-base sm:text-lg rounded-full shadow-lg shadow-orange-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-75 cursor-pointer"
          >
            <Sparkles className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? (lang === 'id' ? 'MENGACAK...' : 'ROLLING...') : (lang === 'id' ? 'GENERATE TOPIC' : 'GENERATE TOPIC')}</span>
          </button>

          {revealedTopic && !isRolling && (
            <button
              onClick={() => toggleSaveTopic(revealedTopic.id)}
              className={`p-4 sm:p-5 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                isSaved
                  ? 'bg-[#FFE9D9] dark:bg-[#3D2517] text-[#9C4221] dark:text-[#FFA066] border-[#FAD3B6] dark:border-[#523321]'
                  : 'bg-white dark:bg-[#271F1A] text-[#736B5E] dark:text-[#A89F93] border-[#F2EDE4] dark:border-[#382B24] hover:border-[#3C2A21] dark:hover:border-[#FDFBF7]'
              }`}
              title={isSaved ? 'Topic Saved' : 'Save Topic'}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-[#9C4221] dark:fill-[#FFA066]' : ''}`} />
            </button>
          )}
        </div>

        {/* 4. Large Generated Topic / Roulette Display Box */}
        <div className="min-h-[160px] sm:min-h-[180px] bg-white dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center relative mb-6 shadow-inner transition-all">
          {isRolling ? (
            <div className="space-y-3 animate-pulse">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#E97D3B]">
                {lang === 'id' ? 'MENGACAK TOPIK...' : 'DISCOVERING TOPIC...'}
              </span>
              <div className="font-serif font-black text-2xl sm:text-4xl text-[#3C2A21] dark:text-[#FDFBF7] tracking-tight transition-all duration-75">
                {displayTopicText}
              </div>
            </div>
          ) : revealedTopic ? (
            <div className="space-y-3 w-full animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-0.5 bg-[#F2EDE4] dark:bg-[#332720] border border-[#E5E2D9] dark:border-[#42342B] rounded-full text-[11px] font-bold text-[#736B5E] dark:text-[#D1C7BA] uppercase tracking-wide">
                  {activeCatInfo.icon} {lang === 'id' ? (CATEGORIES.find(c => c.id === revealedTopic.category)?.nameId || revealedTopic.category) : (CATEGORIES.find(c => c.id === revealedTopic.category)?.name || revealedTopic.category)}
                </span>
              </div>

              {/* The Word / Question */}
              <div className="font-serif font-black text-2xl sm:text-4xl md:text-5xl text-[#3C2A21] dark:text-[#FDFBF7] tracking-tight px-2 leading-tight">
                {revealedTopic.topic}
              </div>

              {/* For unknown words or concepts: show ONLY the word and "Find out yourself." */}
              {isResearchTopic && (
                <div className="pt-2 text-xs sm:text-sm font-serif italic text-[#736B5E] dark:text-[#A89F93]">
                  “{lang === 'id' ? 'Cari tahu sendiri.' : 'Find out yourself.'}”
                </div>
              )}
            </div>
          ) : (
            <div className="text-[#736B5E] dark:text-[#A89F93] space-y-2">
              <p className="font-serif font-bold text-lg sm:text-xl text-[#3C2A21] dark:text-[#FDFBF7]">
                {lang === 'id'
                  ? 'Klik GENERATE TOPIC untuk mendapatkan topik acak hari ini.'
                  : 'Press GENERATE TOPIC to get your topic for today.'}
              </p>
              <p className="text-xs text-[#A69D91] dark:text-[#8C8073] font-serif italic">
                “{lang === 'id' ? 'Pilih. Cari tahu. Bicara 1 menit.' : 'Pick something. Learn something. Speak for one minute.'}”
              </p>
            </div>
          )}
        </div>

        {/* 5. Speaking Timer Section */}
        {revealedTopic && !isRolling && (
          <div className="pt-6 border-t border-[#F2EDE4] dark:border-[#332720] animate-in fade-in duration-300">
            {/* Progress bar */}
            <div className="w-full bg-[#F2EDE4] dark:bg-[#332720] h-1.5 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-[#E97D3B] transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Timer Large Display */}
            <div className="my-2">
              <div
                className={`font-mono-timer font-black text-6xl sm:text-8xl tracking-tight transition-colors ${
                  isTimerFinished
                    ? 'text-[#166534] dark:text-[#86EFAC]'
                    : timeLeft <= 10 && isTimerRunning
                    ? 'text-[#C93B2B] dark:text-[#F87171] animate-pulse'
                    : 'text-[#3C2A21] dark:text-[#FDFBF7]'
                }`}
              >
                {timeFormatted}
              </div>
            </div>

            {/* Encouraging Human Message when finished */}
            {completionMessage && (
              <div className="my-4 py-3 px-6 bg-[#E0E7D1] dark:bg-[#23351F] border border-[#C6D5B0] dark:border-[#385132] rounded-2xl inline-flex items-center gap-2 animate-in zoom-in-95 duration-300 text-[#166534] dark:text-[#86EFAC]">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-serif font-bold text-base sm:text-lg">
                  {completionMessage}
                </span>
              </div>
            )}

            {/* Timer Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              {!isTimerRunning ? (
                <button
                  onClick={handleStartTimer}
                  className="px-8 py-3.5 bg-[#3C2A21] dark:bg-[#FDFBF7] hover:bg-[#251A14] dark:hover:bg-[#E5E2D9] text-white dark:text-[#181412] font-bold uppercase tracking-wider text-sm rounded-full shadow-md hover:scale-105 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{timeLeft < speakingDuration && !isTimerFinished ? (lang === 'id' ? 'LANJUTKAN' : 'RESUME') : (lang === 'id' ? 'MULAI' : 'START')}</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseTimer}
                  className="px-8 py-3.5 bg-[#FFE9D9] dark:bg-[#3D2517] hover:bg-[#FAD3B6] dark:hover:bg-[#523321] text-[#9C4221] dark:text-[#FFA066] font-bold uppercase tracking-wider text-sm rounded-full border border-[#FAD3B6] dark:border-[#523321] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Pause className="w-4 h-4 fill-[#9C4221] dark:fill-[#FFA066]" />
                  <span>{lang === 'id' ? 'JEDA' : 'PAUSE'}</span>
                </button>
              )}

              {timeLeft < speakingDuration && (
                <button
                  onClick={handleResetTimer}
                  className="p-3.5 bg-white dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] hover:bg-[#FDFBF7] dark:hover:bg-[#332720] text-[#736B5E] dark:text-[#A89F93] rounded-full transition-all cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {!isTimerFinished && timeLeft > 0 && (
                <button
                  onClick={handleManualComplete}
                  className="px-6 py-3.5 bg-white dark:bg-[#271F1A] border border-[#C6D5B0] dark:border-[#385132] hover:bg-[#E0E7D1] dark:hover:bg-[#23351F] text-[#166534] dark:text-[#86EFAC] font-bold uppercase tracking-wider text-xs rounded-full transition-all cursor-pointer"
                >
                  {lang === 'id' ? 'SELESAI SEKARANG' : 'MARK COMPLETE'}
                </button>
              )}

              {isTimerFinished && (
                <button
                  onClick={onGoToCalendar}
                  className="px-6 py-3.5 bg-[#E0E7D1] dark:bg-[#23351F] hover:bg-[#D4E0C2] dark:hover:bg-[#2D4528] text-[#166534] dark:text-[#86EFAC] font-bold uppercase tracking-wider text-xs rounded-full flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{lang === 'id' ? 'LIHAT KALENDER' : 'VIEW CALENDAR'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. Recent Topics Section */}
      <div className="bg-[#FFF9F2] dark:bg-[#201A16] border border-[#F2EDE4] dark:border-[#332720] rounded-[28px] p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#F2EDE4] dark:border-[#332720]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#E97D3B]" />
            <h2 className="font-serif font-black text-sm uppercase tracking-wider text-[#3C2A21] dark:text-[#FDFBF7]">
              {lang === 'id' ? 'TOPIK TERAKHIR' : 'RECENT TOPICS'}
            </h2>
          </div>
          <span className="text-[11px] font-serif italic text-[#736B5E] dark:text-[#A89F93]">
            {lang === 'id' ? 'Klik untuk langsung latihan' : 'Tap any topic to practice'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {displayRecentTopics.slice(0, 6).map((topic) => {
            const isCurrentActive = revealedTopic?.id === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => handleSelectRecentTopic(topic)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                  isCurrentActive
                    ? 'bg-[#FFE9D9] dark:bg-[#3D2517] border-[#E97D3B] text-[#9C4221] dark:text-[#FFA066]'
                    : 'bg-white dark:bg-[#271F1A] border-[#F2EDE4] dark:border-[#382B24] hover:border-[#E97D3B] dark:hover:border-[#E97D3B] text-[#3C2A21] dark:text-[#FDFBF7]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-bold text-sm truncate text-[#3C2A21] dark:text-[#FDFBF7] group-hover:text-[#E97D3B] dark:group-hover:text-[#FFA066] transition-colors">
                    {topic.topic}
                  </p>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#F2EDE4] dark:bg-[#332720] text-[#736B5E] dark:text-[#A89F93] shrink-0">
                  {topic.category.replace('_', ' ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTERS MODAL */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3C2A21]/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#FFF9F2] dark:bg-[#201A16] border border-[#F2EDE4] dark:border-[#332720] rounded-[32px] p-6 sm:p-7 shadow-2xl overflow-hidden transition-colors max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F2EDE4] dark:border-[#332720]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#3C2A21] dark:bg-[#2D241F] text-white flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-[#E97D3B]" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-[#3C2A21] dark:text-[#FDFBF7] uppercase tracking-tight">
                    {lang === 'id' ? 'FILTER' : 'FILTERS'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 rounded-full text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] hover:bg-[#F2EDE4] dark:hover:bg-[#2D241F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1 scrollbar-thin">
              {/* Category Section */}
              <div>
                <label className="block text-xs font-serif font-bold text-[#736B5E] dark:text-[#D1C7BA] uppercase tracking-wider mb-2.5">
                  {lang === 'id' ? 'KATEGORI' : 'CATEGORY'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = tempCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setTempCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#3C2A21] text-[#FDFBF7] dark:bg-[#FDFBF7] dark:text-[#181412] border-[#3C2A21] dark:border-[#FDFBF7] shadow-xs'
                            : 'bg-white dark:bg-[#271F1A] border-[#F2EDE4] dark:border-[#382B24] text-[#3C2A21] dark:text-[#FDFBF7] hover:border-[#E97D3B]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{cat.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-wide truncate">
                            {lang === 'id' ? cat.nameId : cat.name}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0 text-[#E97D3B]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speaking Time Section */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-xs font-serif font-bold text-[#736B5E] dark:text-[#D1C7BA] uppercase tracking-wider">
                    {lang === 'id' ? 'DURASI BICARA' : 'SPEAKING TIME'}
                  </label>
                  <span className="text-[11px] text-[#A69D91] dark:text-[#8C8073] font-serif italic">
                    {lang === 'id' ? 'Default: 1 menit' : 'Default: 1 minute'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SPEAKING_TIME_OPTIONS.map((opt) => {
                    const isSelected = tempDuration === opt.seconds;
                    return (
                      <button
                        key={opt.seconds}
                        type="button"
                        onClick={() => setTempDuration(opt.seconds)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#3C2A21] text-[#FDFBF7] dark:bg-[#FDFBF7] dark:text-[#181412] border-[#3C2A21] dark:border-[#FDFBF7] shadow-xs'
                            : 'bg-white dark:bg-[#271F1A] border-[#F2EDE4] dark:border-[#382B24] text-[#3C2A21] dark:text-[#FDFBF7] hover:border-[#E97D3B]'
                        }`}
                      >
                        <div className="text-xs font-bold uppercase tracking-wide">
                          {lang === 'id' ? opt.labelId : opt.labelEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Apply Button */}
            <div className="pt-4 border-t border-[#F2EDE4] dark:border-[#332720] flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTempCategory('all');
                  setTempDuration(60);
                }}
                className="px-4 py-3 rounded-xl text-xs font-serif font-bold uppercase tracking-wider text-[#736B5E] dark:text-[#A89F93] hover:text-[#3C2A21] dark:hover:text-[#FDFBF7] transition-colors cursor-pointer"
              >
                {lang === 'id' ? 'RESET' : 'RESET'}
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 py-3.5 px-6 bg-[#E97D3B] hover:bg-[#D96B28] text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'id' ? 'TERAPKAN' : 'APPLY'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


