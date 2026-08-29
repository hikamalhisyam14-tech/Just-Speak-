import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { GeneratorView } from './components/GeneratorView';
import { ChallengeCalendar } from './components/ChallengeCalendar';
import { SavedTopicsView } from './components/SavedTopicsView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { PremiumModal } from './components/PremiumModal';
import { Topic } from './types';

type Tab = 'generator' | 'calendar' | 'saved' | 'settings';

function MainAppContent() {
  const { user } = useAuth();
  const lang = user?.selectedLanguage || 'en';

  const [currentTab, setCurrentTab] = useState<Tab>('generator');
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

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
