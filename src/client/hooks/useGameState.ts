import { useState, useEffect, useCallback } from 'react';
import { 
  InitResponse, 
  DailyPrompt, 
  Drawing, 
  UserStats, 
  GamePhase,
  SubmitDrawingResponse,
  GetDrawingsResponse,
  SubmitGuessResponse,
  SubmitVoteResponse
} from '../../shared/types/api';

interface GameState {
  isLoading: boolean;
  error: string | null;
  gamePhase: GamePhase;
  currentPrompt: DailyPrompt | null;
  userDrawing: Drawing | null;
  userStats: UserStats | null;
  hasDrawnToday: boolean;
  timeRemaining: number;
  allDrawings: Drawing[];
  username: string;
}

export const useGameState = () => {
  const [state, setState] = useState<GameState>({
    isLoading: true,
    error: null,
    gamePhase: 'waiting',
    currentPrompt: null,
    userDrawing: null,
    userStats: null,
    hasDrawnToday: false,
    timeRemaining: 0,
    allDrawings: [],
    username: ''
  });

  // Initialize game data
  const initializeGame = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/init');
      if (!response.ok) {
        throw new Error('Failed to initialize game');
      }
      
      const data: InitResponse = await response.json();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        gamePhase: data.gamePhase,
        currentPrompt: data.currentPrompt,
        userDrawing: data.userDrawing || null,
        userStats: data.userStats,
        hasDrawnToday: data.hasDrawnToday,
        timeRemaining: data.timeRemaining,
        username: data.username
      }));
      
      // If user has drawn, load all drawings for guessing/voting
      if (data.hasDrawnToday) {
        await loadAllDrawings();
      }
    } catch (error) {
      console.error('Failed to initialize game:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load game'
      }));
    }
  }, []);

  // Load all drawings
  const loadAllDrawings = useCallback(async () => {
    try {
      const response = await fetch('/api/drawings');
      if (!response.ok) {
        throw new Error('Failed to load drawings');
      }
      
      const data: GetDrawingsResponse = await response.json();
      setState(prev => ({ ...prev, allDrawings: data.drawings }));
    } catch (error) {
      console.error('Failed to load drawings:', error);
    }
  }, []);

  // Get specific drawing with full data
  const getDrawing = useCallback(async (drawingId: string): Promise<Drawing | null> => {
    try {
      const response = await fetch(`/api/drawing/${drawingId}`);
      if (!response.ok) {
        return null;
      }
      
      const drawing: Drawing = await response.json();
      return drawing;
    } catch (error) {
      console.error('Failed to get drawing:', error);
      return null;
    }
  }, []);

  // Submit drawing
  const submitDrawing = useCallback(async (imageData: string): Promise<boolean> => {
    if (!state.currentPrompt) {
      setState(prev => ({ ...prev, error: 'No prompt available' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/submit-drawing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          promptId: state.currentPrompt.id
        }),
      });

      const data: SubmitDrawingResponse = await response.json();
      
      if (data.success && data.drawing) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          gamePhase: 'submitted',
          userDrawing: data.drawing || null,
          hasDrawnToday: true
        }));
        
        // Load all drawings after submitting
        await loadAllDrawings();
        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: data.message || 'Failed to submit drawing'
        }));
        return false;
      }
    } catch (error) {
      console.error('Failed to submit drawing:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to submit drawing'
      }));
      return false;
    }
  }, [state.currentPrompt, loadAllDrawings]);

  // Submit guess
  const submitGuess = useCallback(async (drawingId: string, guess: string): Promise<{ success: boolean; isCorrect: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/submit-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drawingId,
          guess
        }),
      });

      const data: SubmitGuessResponse = await response.json();
      
      if (data.success) {
        // Update the specific drawing in our state
        setState(prev => ({
          ...prev,
          allDrawings: prev.allDrawings.map(drawing =>
            drawing.id === drawingId
              ? { ...drawing, guesses: [...drawing.guesses, {
                  id: `guess_${Date.now()}`,
                  userId: prev.username,
                  username: prev.username,
                  guess,
                  isCorrect: data.isCorrect,
                  timestamp: Date.now(),
                  points: data.points
                }] }
              : drawing
          )
        }));
      }
      
      return {
        success: data.success,
        isCorrect: data.isCorrect,
        ...(data.message && { message: data.message })
      };
    } catch (error) {
      console.error('Failed to submit guess:', error);
      return {
        success: false,
        isCorrect: false,
        message: error instanceof Error ? error.message : 'Failed to submit guess'
      };
    }
  }, [state.username]);

  // Submit vote
  const submitVote = useCallback(async (drawingId: string, voteType: 'best' | 'funniest'): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/submit-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drawingId,
          voteType
        }),
      });

      const data: SubmitVoteResponse = await response.json();
      
      if (data.success) {
        // Update the specific drawing in our state
        setState(prev => ({
          ...prev,
          allDrawings: prev.allDrawings.map(drawing =>
            drawing.id === drawingId
              ? { ...drawing, votes: [...drawing.votes, {
                  id: `vote_${Date.now()}`,
                  userId: prev.username,
                  username: prev.username,
                  voteType,
                  timestamp: Date.now()
                }] }
              : drawing
          )
        }));
      }
      
      return {
        success: data.success,
        ...(data.message && { message: data.message })
      };
    } catch (error) {
      console.error('Failed to submit vote:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit vote'
      };
    }
  }, [state.username]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Update time remaining
  useEffect(() => {
    if (state.timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        timeRemaining: Math.max(0, prev.timeRemaining - 1000)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.timeRemaining]);

  return {
    ...state,
    initializeGame,
    loadAllDrawings,
    getDrawing,
    submitDrawing,
    submitGuess,
    submitVote,
    clearError
  };
};
