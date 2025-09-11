// Game State Types
export type GamePhase = 'waiting' | 'drawing' | 'submitted' | 'guessing' | 'voting' | 'results';

export interface Drawing {
  id: string;
  userId: string;
  username: string;
  imageData: string;
  title: string; // What the artist says they drew
  description?: string; // Optional description
  isRevealed: boolean; // Whether the title is revealed yet
  createdAt: number;
  guesses: Guess[];
  votes: Vote[];
  points: number;
}

export type Guess = {
  id: string;
  userId: string;
  username: string;
  guess: string;
  isCorrect: boolean;
  timestamp: number;
  points: number;
};

export type Vote = {
  id: string;
  userId: string;
  username: string;
  voteType: 'best' | 'funniest';
  timestamp: number;
};

export type DailyPrompt = {
  id: string;
  date: string; // YYYY-MM-DD format
  prompt: string;
  theme: string;
  correctAnswer: string;
  isActive: boolean;
};

export type UserStats = {
  userId: string;
  username: string;
  totalPoints: number;
  totalDrawings: number;
  totalGuesses: number;
  correctGuesses: number;
  bestDrawingWins: number;
  funniestDrawingWins: number;
  currentStreak: number;
  maxStreak: number;
  achievements: string[];
};

export type Leaderboard = {
  daily: UserStats[];
  weekly: UserStats[];
  allTime: UserStats[];
};

// API Response Types
export interface InitResponse {
  success: boolean;
  data?: {
    username: string;
    hasDrawnToday: boolean;
    userDrawing?: Drawing;
    allDrawings: Drawing[];
    userStats: UserStats;
    timeRemaining: number; // Time until drawings are revealed
    isRevealTime: boolean; // Whether it's time to reveal all titles
    currentPrompt?: DailyPrompt; // Today's drawing prompt
  };
  error?: string;
}

export interface SubmitDrawingRequest {
  imageData: string;
  title: string;
  description?: string;
}

export type SubmitDrawingResponse = {
  type: 'submit_drawing';
  success: boolean;
  drawing?: Drawing;
  message?: string;
};

export type GetDrawingsResponse = {
  type: 'get_drawings';
  drawings: Drawing[];
  totalCount: number;
};

export type SubmitGuessRequest = {
  drawingId: string;
  guess: string;
};

export type SubmitGuessResponse = {
  type: 'submit_guess';
  success: boolean;
  isCorrect: boolean;
  points: number;
  correctAnswer?: string | null;
  message?: string | null;
};

export type SubmitVoteRequest = {
  drawingId: string;
  voteType: 'best' | 'funniest';
};

export type SubmitVoteResponse = {
  type: 'submit_vote';
  success: boolean;
  message?: string;
};

export type GetLeaderboardResponse = {
  type: 'get_leaderboard';
  leaderboard: Leaderboard;
};

export type GetUserStatsResponse = {
  type: 'get_user_stats';
  stats: UserStats;
};
