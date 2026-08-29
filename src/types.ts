export type Category =
  | 'all'
  | 'psychology'
  | 'unknown_words'
  | 'science_medicine'
  | 'history_culture'
  | 'fun'
  | 'challenge'
  | 'pop_culture'
  | 'weird';

export type Language = 'en' | 'id';

export type AccessStatus = 'free' | 'paid' | 'premium';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type TopicType = 'research' | 'prompt';

export interface Topic {
  id: string;
  category: Category;
  language: Language;
  topic: string;
  difficulty: Difficulty;
  type: TopicType;
  tag?: string;
  searchQuery?: string;
  isFree?: boolean;
}

export interface CompletedChallenge {
  id: string;
  dayNumber: number; // 1 to 30
  topicId: string;
  topicText: string;
  category: Category;
  language: Language;
  completedAt: string; // ISO string YYYY-MM-DD
  notes?: string;
  durationSeconds: number;
}

export type Theme = 'light' | 'dark';

export interface PaymentRecord {
  orderId: string;
  amount: number;
  paymentDate: string;
  provider: 'midtrans' | 'xendit' | 'sandbox';
  status: 'settlement' | 'pending' | 'failed';
}

export interface User {
  id: string;
  email: string;
  name: string;
  premium: boolean; // Server-authoritative premium status
  accessStatus?: AccessStatus;
  selectedLanguage: Language;
  theme?: Theme;
  createdAt: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  completedChallenges: CompletedChallenge[];
  savedTopics: string[]; // Topic IDs
  recentTopicIds?: string[]; // Recently practiced or generated topic IDs
  notes: Record<string, string>; // topicId -> note
  paymentHistory?: PaymentRecord[];
}

export interface CategoryInfo {
  id: Category;
  name: string;
  nameId: string;
  icon: string;
  description: string;
  descriptionId: string;
  color: string;
}

