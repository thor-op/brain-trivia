import type { User } from 'firebase/auth';

export interface TriviaQuestion {
  question: string;
  options: string[];
  answer: string;
}

export enum GameState {
  HOME,
  LOADING,
  PLAYING,
  ANSWERED,
  GAME_OVER,
}

export enum GameMode {
    ENDLESS = 'Endless Trivia',
    DAILY = 'Daily Challenge'
}

export const CATEGORIES = [
    "General Knowledge",
    "Science & Nature",
    "History",
    "Geography",
    "Entertainment: Film & TV",
    "Entertainment: Music",
    "Sports",
    "Technology",
] as const;

export type Category = typeof CATEGORIES[number];


export interface LeaderboardEntry {
  userId: string;
  name: string;
  photoURL: string;
  score: number;
  date?: string;
  category?: Category;
}

export type PowerUpType = 'FIFTY_FIFTY' | 'SKIP' | 'EXTRA_TIME';

export const POWER_UPS: Record<PowerUpType, { name: string; icon: string }> = {
  FIFTY_FIFTY: { name: '50/50', icon: '➗' },
  SKIP: { name: 'Skip', icon: '⏩' },
  EXTRA_TIME: { name: '+10s', icon: '⏳' },
};

export interface PlayerStats {
    level: number;
    xp: number;
    xpToNextLevel: number;
}

export type { User };