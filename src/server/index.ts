import express from 'express';
import { 
  InitResponse, 
  SubmitDrawingRequest, 
  SubmitDrawingResponse,
  GetDrawingsResponse,
  SubmitGuessRequest,
  SubmitGuessResponse,
  SubmitVoteRequest,
  SubmitVoteResponse,
  GetLeaderboardResponse,
  GetUserStatsResponse,
  Drawing,
  Guess,
  Vote
} from '../shared/types/api';
import { reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { GameDataManager } from './core/gameData';

const app = express();
const gameManager = GameDataManager.getInstance();

// Middleware for JSON body parsing
app.use(express.json({ limit: '10mb' })); // Increased limit for canvas data
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [username] = await Promise.all([
        reddit.getCurrentUsername(),
      ]);

      const userId = username || 'anonymous';
      
      // Get today's prompt and user data
      const [currentPrompt, userStats, hasDrawnToday, userDrawing] = await Promise.all([
        gameManager.getTodaysPrompt(),
        gameManager.getUserStats(userId),
        gameManager.hasUserDrawnToday(userId),
        gameManager.getDrawing(userId),
      ]);

      // Update username in stats if needed
      if (userStats.username !== username) {
        userStats.username = username || 'anonymous';
        await gameManager.saveUserStats(userStats);
      }

      // Calculate time remaining (reset at midnight EST)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const timeRemaining = tomorrow.getTime() - now.getTime();
      const isRevealTime = timeRemaining <= 0;

      // Get all drawings for today (for the new system)
      const allDrawings = await gameManager.getTodaysDrawings();

      const responseData: InitResponse['data'] = {
        username: username ?? 'anonymous',
        hasDrawnToday: !!hasDrawnToday,
        allDrawings,
        userStats,
        timeRemaining: Math.max(0, timeRemaining),
        isRevealTime,
        currentPrompt
      };

      if (userDrawing) {
        responseData.userDrawing = userDrawing;
      }

      const response: InitResponse = {
        success: true,
        data: responseData
      };

      res.json(response);
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Submit a drawing
router.post<{}, SubmitDrawingResponse, SubmitDrawingRequest>(
  '/api/submit-drawing',
  async (req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        type: 'submit_drawing',
        success: false,
        message: 'postId is required',
      });
      return;
    }

    try {
      const username = await reddit.getCurrentUsername();
      const userId = username || 'anonymous';
      
      const { imageData, title, description } = req.body;

      // Validate input
      if (!imageData || !title) {
        res.status(400).json({
          type: 'submit_drawing',
          success: false,
          message: 'imageData and title are required',
        });
        return;
      }

      // Check if user already drew today
      const hasDrawn = await gameManager.hasUserDrawnToday(userId);
      if (hasDrawn) {
        res.status(400).json({
          type: 'submit_drawing',
          success: false,
          message: 'You have already submitted a drawing today',
        });
        return;
      }

      // Create drawing
      const drawingData: Omit<Drawing, 'description'> & { description?: string } = {
        id: `drawing_${userId}_${Date.now()}`,
        userId,
        username: username || 'anonymous',
        imageData,
        title,
        isRevealed: false, // Hide title until reveal time
        createdAt: Date.now(),
        guesses: [],
        votes: [],
        points: 0
      };

      if (description) {
        (drawingData as Drawing).description = description;
      }

      const drawing = drawingData as Drawing;

      // Save drawing and update stats
      await Promise.all([
        gameManager.saveDrawing(drawing),
        gameManager.updateUserStats(userId, 5, 'draw') // 5 points for submitting
      ]);

      res.json({
        type: 'submit_drawing',
        success: true,
        drawing,
        message: 'Drawing submitted successfully!'
      });
    } catch (error) {
      console.error('Submit drawing error:', error);
      res.status(500).json({
        type: 'submit_drawing',
        success: false,
        message: 'Failed to submit drawing',
      });
    }
  }
);

// Get today's drawings for guessing
router.get<{}, GetDrawingsResponse>(
  '/api/drawings',
  async (_req, res): Promise<void> => {
    try {
      const drawings = await gameManager.getTodaysDrawings();
      
      // Don't show the image data in the list view to save bandwidth
      const sanitizedDrawings = drawings.map(drawing => ({
        ...drawing,
        imageData: '' // Will be loaded individually when viewing
      }));

      res.json({
        type: 'get_drawings',
        drawings: sanitizedDrawings,
        totalCount: drawings.length
      });
    } catch (error) {
      console.error('Get drawings error:', error);
      res.status(500).json({
        type: 'get_drawings',
        drawings: [],
        totalCount: 0
      });
    }
  }
);

// Get specific drawing with full data
router.get<{ drawingId: string }, Drawing | { status: string; message: string }>(
  '/api/drawing/:drawingId',
  async (req, res): Promise<void> => {
    try {
      const { drawingId } = req.params;
      const drawing = await gameManager.getDrawing(drawingId);
      
      if (!drawing) {
        res.status(404).json({
          status: 'error',
          message: 'Drawing not found'
        });
        return;
      }

      res.json(drawing);
    } catch (error) {
      console.error('Get drawing error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get drawing'
      });
    }
  }
);

// Submit a guess
router.post<{}, SubmitGuessResponse, SubmitGuessRequest>(
  '/api/submit-guess',
  async (req, res): Promise<void> => {
    try {
      const username = await reddit.getCurrentUsername();
      const userId = username || 'anonymous';
      
      const { drawingId, guess } = req.body;

      if (!drawingId || !guess) {
        res.status(400).json({
          type: 'submit_guess',
          success: false,
          isCorrect: false,
          points: 0,
          message: 'drawingId and guess are required',
        });
        return;
      }

      // Get the drawing
      const drawing = await gameManager.getDrawing(drawingId);
      if (!drawing) {
        res.status(404).json({
          type: 'submit_guess',
          success: false,
          isCorrect: false,
          points: 0,
          message: 'Drawing not found',
        });
        return;
      }

      // Check if user is trying to guess their own drawing
      if (drawing.userId === userId) {
        res.status(400).json({
          type: 'submit_guess',
          success: false,
          isCorrect: false,
          points: 0,
          message: 'You cannot guess your own drawing',
        });
        return;
      }

      // Check if user already guessed this drawing
      const existingGuess = drawing.guesses.find(g => g.userId === userId);
      if (existingGuess) {
        res.status(400).json({
          type: 'submit_guess',
          success: false,
          isCorrect: false,
          points: 0,
          message: 'You have already guessed this drawing',
        });
        return;
      }

      // Get the correct answer from the prompt
      const prompt = await gameManager.getTodaysPrompt();
      const isCorrect = gameManager.isGuessCorrect(guess, prompt.correctAnswer);
      
      const points = isCorrect ? 5 : 0;

      // Create guess
      const guessObj: Guess = {
        id: `guess_${userId}_${Date.now()}`,
        userId,
        username: username || 'anonymous',
        guess,
        isCorrect,
        timestamp: Date.now(),
        points
      };

      // Save guess and update stats
      await Promise.all([
        gameManager.addGuess(drawingId, guessObj),
        gameManager.updateUserStats(userId, points, isCorrect ? 'correct_guess' : 'guess'),
        // Give points to drawing creator if guess is correct
        isCorrect ? gameManager.updateUserStats(drawing.userId, 10, 'draw') : Promise.resolve()
      ]);

      res.json({
        type: 'submit_guess',
        success: true,
        isCorrect,
        points,
        correctAnswer: isCorrect ? prompt.correctAnswer : null,
        message: isCorrect ? 'Correct guess!' : 'Try again!'
      });
    } catch (error) {
      console.error('Submit guess error:', error);
      res.status(500).json({
        type: 'submit_guess',
        success: false,
        isCorrect: false,
        points: 0,
        message: 'Failed to submit guess',
      });
    }
  }
);

// Submit a vote
router.post<{}, SubmitVoteResponse, SubmitVoteRequest>(
  '/api/submit-vote',
  async (req, res): Promise<void> => {
    try {
      const username = await reddit.getCurrentUsername();
      const userId = username || 'anonymous';
      
      const { drawingId, voteType } = req.body;

      if (!drawingId || !voteType) {
        res.status(400).json({
          type: 'submit_vote',
          success: false,
          message: 'drawingId and voteType are required',
        });
        return;
      }

      if (voteType !== 'best' && voteType !== 'funniest') {
        res.status(400).json({
          type: 'submit_vote',
          success: false,
          message: 'voteType must be "best" or "funniest"',
        });
        return;
      }

      // Get the drawing
      const drawing = await gameManager.getDrawing(drawingId);
      if (!drawing) {
        res.status(404).json({
          type: 'submit_vote',
          success: false,
          message: 'Drawing not found',
        });
        return;
      }

      // Check if user is trying to vote for their own drawing
      if (drawing.userId === userId) {
        res.status(400).json({
          type: 'submit_vote',
          success: false,
          message: 'You cannot vote for your own drawing',
        });
        return;
      }

      // Create vote
      const vote: Vote = {
        id: `vote_${userId}_${Date.now()}`,
        userId,
        username: username || 'anonymous',
        voteType,
        timestamp: Date.now()
      };

      // Save vote and update stats
      const points = voteType === 'best' ? 20 : 15;
      await Promise.all([
        gameManager.addVote(drawingId, vote),
        gameManager.updateUserStats(drawing.userId, points, voteType === 'best' ? 'best_vote' : 'funny_vote')
      ]);

      res.json({
        type: 'submit_vote',
        success: true,
        message: `Vote submitted! ${drawing.username} earned ${points} points.`
      });
    } catch (error) {
      console.error('Submit vote error:', error);
      res.status(500).json({
        type: 'submit_vote',
        success: false,
        message: 'Failed to submit vote',
      });
    }
  }
);

// Get leaderboard
router.get<{}, GetLeaderboardResponse>(
  '/api/leaderboard',
  async (_req, res): Promise<void> => {
    try {
      const leaderboard = await gameManager.getLeaderboard();
      
      res.json({
        type: 'get_leaderboard',
        leaderboard
      });
    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        type: 'get_leaderboard',
        leaderboard: { daily: [], weekly: [], allTime: [] }
      });
    }
  }
);

// Get user stats
router.get<{}, GetUserStatsResponse>(
  '/api/user-stats',
  async (_req, res): Promise<void> => {
    try {
      const username = await reddit.getCurrentUsername();
      const userId = username || 'anonymous';
      
      const stats = await gameManager.getUserStats(userId);
      
      res.json({
        type: 'get_user_stats',
        stats
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        type: 'get_user_stats',
        stats: {
          userId: '',
          username: '',
          totalPoints: 0,
          totalDrawings: 0,
          totalGuesses: 0,
          correctGuesses: 0,
          bestDrawingWins: 0,
          funniestDrawingWins: 0,
          currentStreak: 0,
          maxStreak: 0,
          achievements: []
        }
      });
    }
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
