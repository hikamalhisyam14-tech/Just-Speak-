import { CompletedChallenge, Language, Topic, User } from '../types';
import { TOPIC_DATABASE } from '../data/topics';

const STORAGE_KEY_AUTH_TOKEN = 'justspeak_auth_token';
const STORAGE_KEY_USER_CACHE = 'justspeak_user_cache';
const STORAGE_KEY_USED_TOPICS = 'justspeak_used_topic_ids';

export const CATEGORIES_LIST = [
  'psychology',
  'unknown_words',
  'science_medicine',
  'history_culture',
  'fun',
  'challenge',
  'pop_culture',
  'weird',
] as const;

export const FREE_TOPICS_PER_CATEGORY = 2;

// Extract exactly 2 free topics per category (16 total free topics across 8 categories)
export const FREE_TOPIC_IDS = new Set<string>(
  CATEGORIES_LIST.flatMap((cat) => {
    return TOPIC_DATABASE.filter((t) => t.category === cat)
      .slice(0, FREE_TOPICS_PER_CATEGORY)
      .map((t) => t.id);
  })
);

export function isTopicFree(topicId: string): boolean {
  return FREE_TOPIC_IDS.has(topicId);
}

function getUsedTopicIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USED_TOPICS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markTopicAsUsed(topicId: string) {
  try {
    const used = getUsedTopicIds();
    if (!used.includes(topicId)) {
      used.push(topicId);
      localStorage.setItem(STORAGE_KEY_USED_TOPICS, JSON.stringify(used));
    }
  } catch {}
}

function resetUsedTopicsForPool(poolTopicIds: string[]) {
  try {
    const current = getUsedTopicIds();
    const filtered = current.filter((id) => !poolTopicIds.includes(id));
    localStorage.setItem(STORAGE_KEY_USED_TOPICS, JSON.stringify(filtered));
  } catch {}
}

// Date helpers
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === getTodayDateString();
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  } catch {
    return null;
  }
}

function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    }
  } catch {}
}

function getCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER_CACHE, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER_CACHE);
    }
  } catch {}
}

export const api = {
  // Topic Querying (Honoring Free vs. Premium Access)
  getTopics(category: string = 'all', _language: Language = 'en', user?: User | null): Topic[] {
    const isPremiumUser = !!user?.premium;

    let base = TOPIC_DATABASE;
    if (category !== 'all') {
      base = TOPIC_DATABASE.filter((t) => t.category === category);
    }

    if (isPremiumUser) {
      return base.map((t) => ({ ...t, isFree: FREE_TOPIC_IDS.has(t.id) }));
    }

    // For non-premium or unauthenticated users, return only the free selection
    return base
      .filter((t) => FREE_TOPIC_IDS.has(t.id))
      .map((t) => ({ ...t, isFree: true }));
  },

  getAllTopicCatalog(): Topic[] {
    return TOPIC_DATABASE.map((t) => ({
      ...t,
      isFree: FREE_TOPIC_IDS.has(t.id),
    }));
  },

  getRandomTopic(
    category: string = 'all',
    language: Language = 'en',
    user?: User | null,
    excludeId?: string
  ): { topic: Topic; isPoolExhausted: boolean; isFreeOnly: boolean } {
    const isPremiumUser = !!user?.premium;
    const availablePool = this.getTopics(category, language, user);

    if (availablePool.length === 0) {
      // Fallback
      const fallback = TOPIC_DATABASE.find((t) => FREE_TOPIC_IDS.has(t.id)) || TOPIC_DATABASE[0];
      return { topic: fallback, isPoolExhausted: true, isFreeOnly: !isPremiumUser };
    }

    const usedIds = getUsedTopicIds();
    const poolIds = availablePool.map((t) => t.id);

    let unusedPool = availablePool.filter((t) => !usedIds.includes(t.id));
    let wasExhausted = false;

    // If all available topics have been used, recycle the pool
    if (unusedPool.length === 0) {
      resetUsedTopicsForPool(poolIds);
      unusedPool = availablePool;
      wasExhausted = true;
    }

    let candidatePool = unusedPool;
    if (excludeId && candidatePool.length > 1) {
      const withoutCurrent = candidatePool.filter((t) => t.id !== excludeId);
      if (withoutCurrent.length > 0) {
        candidatePool = withoutCurrent;
      }
    }

    const idx = Math.floor(Math.random() * candidatePool.length);
    const selected = candidatePool[idx] || availablePool[0];

    markTopicAsUsed(selected.id);

    return {
      topic: selected,
      isPoolExhausted: wasExhausted,
      isFreeOnly: !isPremiumUser,
    };
  },

  getTopicStats(category: string = 'all', user?: User | null): {
    total: number;
    used: number;
    remaining: number;
    isPremium: boolean;
  } {
    const isPremiumUser = !!user?.premium;
    const pool = this.getTopics(category, 'en', user);
    const usedIds = getUsedTopicIds();
    const usedCount = pool.filter((t) => usedIds.includes(t.id)).length;

    return {
      total: isPremiumUser ? (category === 'all' ? 365 : pool.length) : (category === 'all' ? 16 : pool.length),
      used: usedCount,
      remaining: Math.max(0, pool.length - usedCount),
      isPremium: isPremiumUser,
    };
  },

  // ========================================================
  // SERVER-AUTHORITATIVE AUTHENTICATION & SESSION MANAGEMENT
  // ========================================================

  async fetchCurrentUser(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) {
      setCachedUser(null);
      return null;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        setAuthToken(null);
        setCachedUser(null);
        return null;
      }

      const data = await res.json();
      if (data.user) {
        setCachedUser(data.user);
        return data.user;
      }
      return null;
    } catch {
      // Return cached user if network temporarily unavailable
      return getCachedUser();
    }
  },

  getCachedUser(): User | null {
    return getCachedUser();
  },

  async register(email: string, name: string, password?: string, language: Language = 'en'): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, language }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create account');
    }

    const data = await res.json();
    setAuthToken(data.token);
    setCachedUser(data.user);
    return data.user;
  },

  async login(email: string, password?: string): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to log in');
    }

    const data = await res.json();
    setAuthToken(data.token);
    setCachedUser(data.user);
    return data.user;
  },

  async logout(): Promise<void> {
    const token = getAuthToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    // Clean up local credentials
    setAuthToken(null);
    setCachedUser(null);
  },

  async syncUser(user: User): Promise<User> {
    setCachedUser(user);
    const token = getAuthToken();
    if (!token) return user;

    try {
      const res = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: user.name,
          selectedLanguage: user.selectedLanguage,
          theme: user.theme,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          lastCompletedDate: user.lastCompletedDate,
          completedChallenges: user.completedChallenges,
          savedTopics: user.savedTopics,
          recentTopicIds: user.recentTopicIds,
          notes: user.notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCachedUser(data.user);
          return data.user;
        }
      }
    } catch {}

    return user;
  },

  // ========================================================
  // PAYMENT API
  // ========================================================

  async createOrder(): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    formattedPrice: string;
    productName: string;
    isLiveGatewayConfigured: boolean;
    snapToken?: string;
    redirectUrl?: string;
  }> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Please log in before initiating payment.');
    }

    const res = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Could not initiate checkout.');
    }

    return res.json();
  },

  async verifyTestCheckout(orderId: string): Promise<User> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required.');
    }

    const res = await fetch('/api/payment/verify-test-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Test payment verification failed.');
    }

    const data = await res.json();
    setCachedUser(data.user);
    return data.user;
  },

  // User Actions (Challenge, Saved, Recent, Notes)
  completeChallenge(
    user: User,
    topic: Topic,
    notes: string = ''
  ): { user: User; completed: CompletedChallenge; alreadyCompletedToday: boolean } {
    const today = getTodayDateString();
    const alreadyCompletedToday = user.lastCompletedDate === today;

    let newStreak = user.currentStreak;
    if (!alreadyCompletedToday) {
      if (isYesterday(user.lastCompletedDate) || user.currentStreak === 0) {
        newStreak = user.currentStreak + 1;
      } else {
        newStreak = 1;
      }
    }

    const newLongest = Math.max(user.longestStreak, newStreak);
    const completedList = user.completedChallenges || [];
    const nextDayNumber = Math.min(30, completedList.length + (alreadyCompletedToday ? 0 : 1));

    const newChallenge: CompletedChallenge = {
      id: 'ch_' + Date.now(),
      dayNumber: nextDayNumber,
      topicId: topic.id,
      topicText: topic.topic,
      category: topic.category,
      language: topic.language,
      completedAt: today,
      notes: notes.trim(),
      durationSeconds: 60,
    };

    const recentList = user.recentTopicIds || [];
    const updatedRecent = [topic.id, ...recentList.filter((id) => id !== topic.id)].slice(0, 8);

    const updatedUser: User = {
      ...user,
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCompletedDate: today,
      recentTopicIds: updatedRecent,
      completedChallenges: alreadyCompletedToday
        ? completedList.map((c, i) => (i === completedList.length - 1 ? newChallenge : c))
        : [...completedList, newChallenge],
      notes: notes.trim() ? { ...(user.notes || {}), [topic.id]: notes.trim() } : (user.notes || {}),
    };

    this.syncUser(updatedUser);
    return { user: updatedUser, completed: newChallenge, alreadyCompletedToday };
  },

  addRecentTopic(user: User, topicId: string): User {
    const recentList = user.recentTopicIds || [];
    const updatedRecent = [topicId, ...recentList.filter((id) => id !== topicId)].slice(0, 8);
    const updatedUser: User = {
      ...user,
      recentTopicIds: updatedRecent,
    };
    this.syncUser(updatedUser);
    return updatedUser;
  },

  toggleSaveTopic(user: User, topicId: string): User {
    const savedList = user.savedTopics || [];
    const isSaved = savedList.includes(topicId);
    const updatedTopics = isSaved
      ? savedList.filter((id) => id !== topicId)
      : [...savedList, topicId];

    const updatedUser: User = {
      ...user,
      savedTopics: updatedTopics,
    };
    this.syncUser(updatedUser);
    return updatedUser;
  },

  getRecentTopics(user: User): Topic[] {
    if (!user.recentTopicIds || user.recentTopicIds.length === 0) return [];
    return user.recentTopicIds
      .map((id) => TOPIC_DATABASE.find((t) => t.id === id))
      .filter((t): t is Topic => !!t);
  },
};
