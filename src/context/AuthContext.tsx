import React, { createContext, useContext, useEffect, useState } from 'react';
import { CompletedChallenge, Language, Theme, Topic, User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  theme: Theme;
  isAuthenticated: boolean;
  isPremium: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (email: string, name: string, password?: string, language?: Language) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateUser: (updatedUser: User) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleSaveTopic: (topicId: string) => void;
  addRecentTopic: (topicId: string) => void;
  completeTodayChallenge: (topic: Topic, notes?: string) => { completed: CompletedChallenge; alreadyCompletedToday: boolean };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth & Session State from backend
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1. Initial cached fallback
      const cached = api.getCachedUser();
      if (cached && isMounted) {
        setUser(cached);
        if (cached.theme) setThemeState(cached.theme);
      }

      // 2. Authoritative server verification
      try {
        const verifiedUser = await api.fetchCurrentUser();
        if (isMounted) {
          setUser(verifiedUser);
          if (verifiedUser?.theme) {
            setThemeState(verifiedUser.theme);
          } else {
            const savedTheme = localStorage.getItem('justspeak_theme') as Theme;
            if (savedTheme === 'dark' || savedTheme === 'light') {
              setThemeState(savedTheme);
            }
          }
        }
      } catch (err) {
        console.error('Session verification error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Theme synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('justspeak_theme', theme);
  }, [theme]);

  const login = async (email: string, password?: string): Promise<User> => {
    const u = await api.login(email, password);
    setUser(u);
    if (u.theme) setThemeState(u.theme);
    return u;
  };

  const register = async (email: string, name: string, password?: string, language: Language = 'en'): Promise<User> => {
    const u = await api.register(email, name, password, language);
    setUser(u);
    if (u.theme) setThemeState(u.theme);
    return u;
  };

  const logout = async (): Promise<void> => {
    await api.logout();
    setUser(null);
  };

  const refreshUser = async (): Promise<User | null> => {
    const fresh = await api.fetchCurrentUser();
    setUser(fresh);
    return fresh;
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    api.syncUser(updatedUser);
  };

  const setLanguage = (language: Language) => {
    if (!user) return;
    const updated: User = { ...user, selectedLanguage: language };
    updateUser(updated);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (user) {
      const updated: User = { ...user, theme: newTheme };
      updateUser(updated);
    }
  };

  const toggleSaveTopic = (topicId: string) => {
    if (!user) return;
    const updated = api.toggleSaveTopic(user, topicId);
    setUser(updated);
  };

  const addRecentTopic = (topicId: string) => {
    if (!user) return;
    const updated = api.addRecentTopic(user, topicId);
    setUser(updated);
  };

  const completeTodayChallenge = (topic: Topic, notes: string = '') => {
    if (!user) {
      throw new Error('Must be logged in to track challenge progress');
    }
    const result = api.completeChallenge(user, topic, notes);
    setUser(result.user);
    return { completed: result.completed, alreadyCompletedToday: result.alreadyCompletedToday };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        theme,
        isAuthenticated: !!user,
        isPremium: !!user?.premium,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        setLanguage,
        setTheme,
        toggleSaveTopic,
        addRecentTopic,
        completeTodayChallenge,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
