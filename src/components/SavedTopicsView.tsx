import React, { useState } from 'react';
import { Bookmark, Search, ArrowRight, Trash2, BookOpen, Sparkles, Filter } from 'lucide-react';
import { CATEGORIES, TOPIC_DATABASE } from '../data/topics';
import { Topic } from '../types';
import { useAuth } from '../context/AuthContext';

interface SavedTopicsViewProps {
  onSelectTopic: (topic: Topic) => void;
}

export const SavedTopicsView: React.FC<SavedTopicsViewProps> = ({ onSelectTopic }) => {
  const { user, toggleSaveTopic } = useAuth();
  const lang = user?.selectedLanguage || 'en';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const savedIds = user?.savedTopics || [];
  const savedTopicsList = TOPIC_DATABASE.filter((t) => savedIds.includes(t.id));

  const filtered = savedTopicsList.filter((t) => {
    const matchesSearch = t.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-[#FFF9F2] dark:bg-[#201A16] border border-[#F2EDE4] dark:border-[#332720] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xs transition-colors">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#3C2A21] dark:bg-[#271F1A] text-white flex items-center justify-center font-bold shadow-xs">
            <Bookmark className="w-6 h-6 fill-[#E97D3B] text-[#E97D3B]" />
          </div>
          <div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#3C2A21] dark:text-[#FDFBF7] uppercase">
              {lang === 'id' ? 'TOPIK TERSIMPAN' : 'SAVED TOPICS'}
            </h1>
            <p className="text-xs sm:text-sm text-[#736B5E] dark:text-[#A89F93] font-serif italic">
              {lang === 'id'
                ? 'Koleksi topik favoritmu untuk latihan berbicara berulang kali.'
                : 'Your personal vault of favorite topics to practice whenever you want.'}
            </p>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A69D91] dark:text-[#8C8073] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'id' ? 'Cari topik tersimpan...' : 'Search your saved topics...'}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] rounded-full text-sm text-[#3C2A21] dark:text-[#FDFBF7] placeholder:text-[#A69D91] dark:placeholder:text-[#8C8073] focus:outline-none focus:ring-2 focus:ring-[#E97D3B]"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-5 py-3 bg-white dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] rounded-full text-sm font-serif font-bold text-[#736B5E] dark:text-[#D1C7BA] focus:outline-none focus:ring-2 focus:ring-[#E97D3B] cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {lang === 'id' ? cat.nameId : cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Topics List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const userNote = user?.notes?.[item.id];
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#201A16] border border-[#F2EDE4] dark:border-[#332720] rounded-[24px] p-6 shadow-xs hover:border-[#3C2A21] dark:hover:border-[#E97D3B] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 bg-[#F2EDE4] dark:bg-[#332720] text-[#736B5E] dark:text-[#A89F93] rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {((item.category as string) || '').replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => toggleSaveTopic(item.id)}
                      className="p-2 rounded-full text-[#9C4221] dark:text-[#FFA066] hover:bg-[#FFE9D9] dark:hover:bg-[#3D2517] transition-colors cursor-pointer"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-serif font-black text-xl text-[#3C2A21] dark:text-[#FDFBF7] mb-2 leading-snug uppercase">
                    {item.topic}
                  </h3>

                  {userNote && (
                    <div className="p-3 bg-[#FFF9F2] dark:bg-[#271F1A] border border-[#F2EDE4] dark:border-[#382B24] rounded-xl text-xs text-[#736B5E] dark:text-[#A89F93] mb-3 line-clamp-2">
                      <span className="font-serif font-bold text-[#3C2A21] dark:text-[#FDFBF7] block mb-0.5 uppercase tracking-wider text-[10px]">Note:</span>
                      {userNote}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#F2EDE4] dark:border-[#332720] flex items-center justify-between">
                  <span className="text-[11px] font-serif font-bold text-[#A69D91] dark:text-[#8C8073]">
                    {item.language === 'id' ? '🇮🇩 Bahasa ID' : '🇬🇧 English'}
                  </span>

                  <button
                    onClick={() => onSelectTopic(item)}
                    className="px-4 py-2 bg-[#3C2A21] dark:bg-[#FDFBF7] hover:bg-[#E97D3B] dark:hover:bg-[#E97D3B] text-white dark:text-[#181412] dark:hover:text-white text-xs font-bold uppercase tracking-wider rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{lang === 'id' ? 'Bicara Topik Ini' : 'Practice Now'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#201A16] border border-[#F2EDE4] dark:border-[#332720] rounded-[32px] p-12 text-center transition-colors">
          <Bookmark className="w-12 h-12 text-[#E5E2D9] dark:text-[#382B24] mx-auto mb-3" />
          <h3 className="font-serif font-black text-lg text-[#3C2A21] dark:text-[#FDFBF7] mb-1 uppercase">
            {lang === 'id' ? 'Belum ada topik tersimpan' : 'No saved topics yet'}
          </h3>
          <p className="text-xs sm:text-sm text-[#736B5E] dark:text-[#A89F93] max-w-sm mx-auto font-serif italic">
            {lang === 'id'
              ? 'Ketika kamu menemukan topik menarik di generator, klik ikon bookmark untuk menyimpannya di sini.'
              : 'Whenever you roll a topic you love, tap the bookmark icon to save it here for future speaking workouts.'}
          </p>
        </div>
      )}
    </div>
  );
};
