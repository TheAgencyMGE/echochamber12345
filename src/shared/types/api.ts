// Game State Types
export type GamePhase = 'waiting' | 'drawing' | 'submitted' | 'guessing' | 'voting' | 'results';

export type Drawing = {
  id: string;
  userId: string;
  username: string;
  imageData: string; // base64 encoded canvas data
  prompt: string;
  timestamp: number;
  guesses: Guess[];
  votes: Vote[];
  points: number;
};

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
export type InitResponse = {
  type: 'init';
  postId: string;
  userId: string;
  username: string;
  currentPrompt: DailyPrompt;
  userDrawing?: Drawing | null;
  gamePhase: GamePhase;
  timeRemaining: number;
  userStats: UserStats;
  hasDrawnToday: boolean;
};

export type SubmitDrawingRequest = {
  imageData: string;
  promptId: string;
};

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
