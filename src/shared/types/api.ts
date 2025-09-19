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

// Golf Game Types
export interface GolfScore {
  userId: string;
  username: string;
  strokes: number;
  completedAt: number;
  regenCount: number;
}

export interface DailyGolfChallenge {
  date: string; // YYYY-MM-DD format
  courseData: string; // Serialized course data
  par: number;
  scores: GolfScore[];
}

export interface GolfUserStats {
  userId: string;
  username: string;
  totalGames: number;
  bestScore: number;
  averageScore: number;
  coursesCompleted: number;
  currentStreak: number;
  maxStreak: number;
}

export interface GolfLeaderboard {
  daily: GolfScore[];
  weekly: GolfUserStats[];
  allTime: GolfUserStats[];
}

export interface SubmitGolfScoreRequest {
  strokes: number;
  regenCount: number;
}

export interface SubmitGolfScoreResponse {
  type: 'submit_golf_score';
  success: boolean;
  rank?: number;
  message?: string;
}

export interface GetGolfLeaderboardResponse {
  type: 'get_golf_leaderboard';
  leaderboard: GolfLeaderboard;
}

export interface GetDailyCourseResponse {
  type: 'get_daily_course';
  course: string; // Serialized course data
  par: number;
}

export interface GetDailyGolfChallengeResponse {
  type: 'get_daily_golf_challenge';
  challenge: DailyGolfChallenge;
}

export interface GolfInitResponse {
  success: boolean;
  data?: {
    username: string;
    hasPlayedToday: boolean;
    dailyChallenge: DailyGolfChallenge;
    userStats: GolfUserStats;
    playerScore?: GolfScore;
  };
  error?: string;
}
