import { redis } from '@devvit/web/server';
import { DailyPrompt, Drawing, UserStats, Guess, Vote } from '../../shared/types/api';

// Daily prompts for the game
const DAILY_PROMPTS: Array<{ prompt: string; theme: string; correctAnswer: string }> = [
  // Monday: Subreddit emotions
  { prompt: "How it feels when your post gets downvoted", theme: "Subreddit emotions", correctAnswer: "downvote sadness" },
  { prompt: "The joy of getting your first Reddit gold", theme: "Subreddit emotions", correctAnswer: "reddit gold happiness" },
  { prompt: "When someone corrects your grammar", theme: "Subreddit emotions", correctAnswer: "grammar correction annoyance" },
  { prompt: "Finding the perfect meme for the situation", theme: "Subreddit emotions", correctAnswer: "perfect meme excitement" },
  
  // Tuesday: Reddit features/mechanics
  { prompt: "A Reddit mod in action", theme: "Reddit features", correctAnswer: "reddit moderator" },
  { prompt: "The cake day experience", theme: "Reddit features", correctAnswer: "cake day celebration" },
  { prompt: "Getting banned from a subreddit", theme: "Reddit features", correctAnswer: "subreddit ban" },
  { prompt: "The Reddit hivemind at work", theme: "Reddit features", correctAnswer: "reddit hivemind" },
  
  // Wednesday: Famous Reddit moments
  { prompt: "The great Reddit blackout", theme: "Reddit moments", correctAnswer: "reddit blackout protest" },
  { prompt: "When Reddit solves a mystery", theme: "Reddit moments", correctAnswer: "reddit detective work" },
  { prompt: "The button experiment", theme: "Reddit moments", correctAnswer: "reddit button experiment" },
  { prompt: "Place pixel art collaboration", theme: "Reddit moments", correctAnswer: "reddit place collaboration" },
  
  // Thursday: Reddit user types
  { prompt: "A karma farmer in their natural habitat", theme: "Reddit users", correctAnswer: "karma farmer" },
  { prompt: "The lurker who never posts", theme: "Reddit users", correctAnswer: "reddit lurker" },
  { prompt: "A bot trying to be human", theme: "Reddit users", correctAnswer: "reddit bot" },
  { prompt: "The person who always argues in comments", theme: "Reddit users", correctAnswer: "reddit argumentative user" },
  
  // Friday: Meme interpretations
  { prompt: "This is fine (but on Reddit)", theme: "Meme interpretations", correctAnswer: "this is fine reddit version" },
  { prompt: "Drake pointing at Reddit features", theme: "Meme interpretations", correctAnswer: "drake meme reddit" },
  { prompt: "Distracted boyfriend but it's subreddits", theme: "Meme interpretations", correctAnswer: "distracted boyfriend subreddits" },
  { prompt: "Woman yelling at cat (Reddit edition)", theme: "Meme interpretations", correctAnswer: "woman yelling cat reddit" },
  
  // Weekend: Free draw
  { prompt: "Your favorite subreddit as a person", theme: "Free draw", correctAnswer: "favorite subreddit personified" },
  { prompt: "Reddit in 3 words", theme: "Free draw", correctAnswer: "reddit three words" },
  { prompt: "The spirit of r/aww", theme: "Free draw", correctAnswer: "aww subreddit spirit" },
  { prompt: "A day in the life of Snoo", theme: "Free draw", correctAnswer: "snoo daily life" }
];

export class GameDataManager {
  private static instance: GameDataManager;
  
  public static getInstance(): GameDataManager {
    if (!GameDataManager.instance) {
      GameDataManager.instance = new GameDataManager();
    }
    return GameDataManager.instance;
  }

  // Get today's prompt
  async getTodaysPrompt(): Promise<DailyPrompt> {
    const today = new Date().toISOString().split('T')[0];
    const promptKey = `prompt:${today}`;
    
    let prompt = await redis.get(promptKey);
    if (!prompt) {
      // Generate new prompt for today
      const dayOfYear = this.getDayOfYear();
      const promptTemplate = DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
      
      if (!promptTemplate) {
        throw new Error('No prompt template found');
      }
      
      const newPrompt: DailyPrompt = {
        id: `prompt_${today!}`,
        date: today!,
        isActive: true,
        prompt: promptTemplate.prompt,
        theme: promptTemplate.theme,
        correctAnswer: promptTemplate.correctAnswer
      };
      
      await redis.set(promptKey, JSON.stringify(newPrompt));
      prompt = JSON.stringify(newPrompt);
    }
    
    return JSON.parse(prompt);
  }

  // Save a drawing with title and description
  async saveDrawing(drawing: Drawing): Promise<void> {
    const drawingKey = `drawing:${drawing.id}`;
    const userDrawingKey = `user_drawing:${drawing.userId}:${new Date().toISOString().split('T')[0]}`;
    const dailyDrawingsKey = `daily_drawings:${new Date().toISOString().split('T')[0]}`;
    
    // Get existing drawings list
    const existingDrawings = await redis.get(dailyDrawingsKey) || '[]';
    const drawingsList = JSON.parse(existingDrawings);
    if (!drawingsList.includes(drawing.id)) {
      drawingsList.push(drawing.id);
    }
    
    await Promise.all([
      redis.set(drawingKey, JSON.stringify(drawing)),
      redis.set(userDrawingKey, drawing.id),
      redis.set(dailyDrawingsKey, JSON.stringify(drawingsList))
    ]);
  }

  // Get drawing by ID
  async getDrawing(drawingId: string): Promise<Drawing | null> {
    const drawingKey = `drawing:${drawingId}`;
    const drawingData = await redis.get(drawingKey);
    return drawingData ? JSON.parse(drawingData) : null;
  }

  // Get all drawings for today
  async getTodaysDrawings(): Promise<Drawing[]> {
    const today = new Date().toISOString().split('T')[0];
    const dailyDrawingsKey = `daily_drawings:${today}`;
    
    const drawingIdsData = await redis.get(dailyDrawingsKey);
    if (!drawingIdsData) return [];
    
    const drawingIds: string[] = JSON.parse(drawingIdsData);
    const drawings = await Promise.all(
      drawingIds.map(async (id: string) => {
        const drawing = await this.getDrawing(id);
        return drawing;
      })
    );
    
    return drawings.filter(Boolean) as Drawing[];
  }

  // Check if user has drawn today
  async hasUserDrawnToday(userId: string): Promise<boolean> {
    const prompt = await this.getTodaysPrompt();
    const userDrawingKey = `user_drawing:${userId}:${prompt.id}`;
    
    const drawingId = await redis.get(userDrawingKey);
    return !!drawingId;
  }

  // Get user's drawing for today
  async getUserDrawingToday(userId: string): Promise<Drawing | null> {
    const prompt = await this.getTodaysPrompt();
    const userDrawingKey = `user_drawing:${userId}:${prompt.id}`;
    
    const drawingId = await redis.get(userDrawingKey);
    if (!drawingId) return null;
    
    return this.getDrawing(drawingId);
  }

  // Add a guess to a drawing
  async addGuess(drawingId: string, guess: Guess): Promise<void> {
    const drawing = await this.getDrawing(drawingId);
    if (!drawing) throw new Error('Drawing not found');

    drawing.guesses.push(guess);
    await this.saveDrawing(drawing);
  }

  // Add a vote to a drawing
  async addVote(drawingId: string, vote: Vote): Promise<void> {
    const drawing = await this.getDrawing(drawingId);
    if (!drawing) throw new Error('Drawing not found');

    // Remove existing vote from same user
    drawing.votes = drawing.votes.filter(v => v.userId !== vote.userId || v.voteType !== vote.voteType);
    drawing.votes.push(vote);
    await this.saveDrawing(drawing);
  }

  // Get user stats
  async getUserStats(userId: string): Promise<UserStats> {
    const statsKey = `stats:${userId}`;
    const statsData = await redis.get(statsKey);
    
    if (statsData) {
      return JSON.parse(statsData);
    }
    
    // Create new stats
    const newStats: UserStats = {
      userId,
      username: '', // Will be filled by caller
      totalPoints: 0,
      totalDrawings: 0,
      totalGuesses: 0,
      correctGuesses: 0,
      bestDrawingWins: 0,
      funniestDrawingWins: 0,
      currentStreak: 0,
      maxStreak: 0,
      achievements: []
    };
    
    await this.saveUserStats(newStats);
    return newStats;
  }

  // Save user stats
  async saveUserStats(stats: UserStats): Promise<void> {
    const statsKey = `stats:${stats.userId}`;
    await redis.set(statsKey, JSON.stringify(stats));
  }

  // Update user points and stats
  async updateUserStats(userId: string, pointsEarned: number, action: 'draw' | 'guess' | 'correct_guess' | 'best_vote' | 'funny_vote'): Promise<UserStats> {
    const stats = await this.getUserStats(userId);
    
    stats.totalPoints += pointsEarned;
    
    switch (action) {
      case 'draw':
        stats.totalDrawings += 1;
        break;
      case 'guess':
        stats.totalGuesses += 1;
        break;
      case 'correct_guess':
        stats.correctGuesses += 1;
        break;
      case 'best_vote':
        stats.bestDrawingWins += 1;
        break;
      case 'funny_vote':
        stats.funniestDrawingWins += 1;
        break;
    }
    
    await this.saveUserStats(stats);
    return stats;
  }

  // Get leaderboard data
  async getLeaderboard(): Promise<{ daily: UserStats[]; weekly: UserStats[]; allTime: UserStats[] }> {
    // For MVP, we'll use a simple approach and track users as we encounter them
    // In production, you'd want separate daily/weekly tracking with proper indexing
    
    // For now, return empty leaderboards - will be populated as users play
    return {
      daily: [],
      weekly: [],
      allTime: []
    };
  }

  private getDayOfYear(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // Check if guess is correct (fuzzy matching)
  isGuessCorrect(guess: string, correctAnswer: string): boolean {
    const normalize = (str: string) => 
      str.toLowerCase()
         .replace(/[^a-z0-9\s]/g, '')
         .trim()
         .split(/\s+/)
         .sort()
         .join(' ');

    const normalizedGuess = normalize(guess);
    const normalizedAnswer = normalize(correctAnswer);

    // Exact match
    if (normalizedGuess === normalizedAnswer) return true;

    // Check if guess contains most key words from answer
    const guessWords = normalizedGuess.split(' ');
    const answerWords = normalizedAnswer.split(' ');
    
    const commonWords = answerWords.filter(word => 
      word.length > 2 && guessWords.some(gw => gw.includes(word) || word.includes(gw))
    );

    return commonWords.length >= Math.ceil(answerWords.length * 0.6);
  }
}
