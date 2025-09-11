import React, { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { DrawingCanvas } from './DrawingCanvas';
import { Drawing } from '../../shared/types/api';

export const GameUI: React.FC = () => {
  const {
    isLoading,
    error,
    currentPrompt,
    userDrawing,
    userStats,
    hasDrawnToday,
    timeRemaining,
    allDrawings,
    username,
    submitDrawing,
    submitGuess,
    submitVote,
    getDrawing,
    clearError
  } = useGameState();

  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [guess, setGuess] = useState('');
  const [submittingGuess, setSubmittingGuess] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle drawing submission
  const handleDrawingSubmit = async (imageData: string, title: string, description?: string) => {
    const success = await submitDrawing(imageData, title, description);
    if (success) {
      setSuccessMessage('Drawing submitted successfully! 🎉');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Handle guess submission
  const handleGuessSubmit = async (drawingId: string) => {
    if (!guess.trim()) return;

    setSubmittingGuess(true);
    const result = await submitGuess(drawingId, guess.trim());
    setSubmittingGuess(false);

    if (result.success) {
      setGuess('');
      setSuccessMessage(
        result.isCorrect 
          ? '🎉 Correct guess! +5 points' 
          : '❌ Try again!'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Handle vote submission
  const handleVoteSubmit = async (drawingId: string, voteType: 'best' | 'funniest') => {
    setSubmittingVote(true);
    const result = await submitVote(drawingId, voteType);
    setSubmittingVote(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Vote submitted!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // View drawing details
  const handleViewDrawing = async (drawing: Drawing) => {
    if (drawing.imageData) {
      setSelectedDrawing(drawing);
    } else {
      // Load full drawing data
      const fullDrawing = await getDrawing(drawing.id);
      if (fullDrawing) {
        setSelectedDrawing(fullDrawing);
      }
    }
  };

  // Format time
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Subreddit Sketch...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="text-center p-6 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={clearError}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm border border-purple-100 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                🎨 Subreddit Sketch
              </h1>
              <p className="text-slate-600">Daily Reddit Drawing Challenge</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Hey {username}! 👋</p>
              {userStats && (
                <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {userStats.totalPoints} points
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6 shadow-sm">
            <p className="text-emerald-700 text-center font-medium">{successMessage}</p>
          </div>
        )}

        {/* Current Prompt */}
        {currentPrompt && (
          <div className="bg-white/90 backdrop-blur-sm border border-purple-100 rounded-2xl shadow-xl p-6 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Today's Prompt</h2>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                "{currentPrompt.prompt}"
              </p>
              <p className="text-sm text-purple-500 font-medium">Theme: {currentPrompt.theme}</p>
              <p className="text-sm text-slate-600 mt-2">
                Next prompt in: {formatTime(timeRemaining)}
              </p>
            </div>
          </div>
        )}

        {/* Game Content */}
        {!hasDrawnToday && currentPrompt && (
          <div className="bg-white/90 backdrop-blur-sm border border-purple-100 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Draw your interpretation! (60 seconds)
            </h3>
            <DrawingCanvas
              onDrawingComplete={handleDrawingSubmit}
            />
            <div className="mt-4 text-center text-sm text-slate-600">
              <p>💡 Tip: Keep it simple and focus on the key concept!</p>
              <p>🎯 You have 60 seconds once you start drawing</p>
            </div>
          </div>
        )}

        {/* User's Drawing */}
        {hasDrawnToday && userDrawing && (
          <div className="bg-white/90 backdrop-blur-sm border border-purple-100 rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Your Drawing
            </h3>
            <div className="flex justify-center">
              <img
                src={userDrawing.imageData}
                alt="Your drawing"
                className="border-2 border-purple-200 rounded-xl max-w-md shadow-lg"
              />
            </div>
            <div className="text-center mt-4">
              <p className="text-slate-600">
                Guesses: {userDrawing.guesses.length} | 
                Votes: {userDrawing.votes.length} |
                Points: {userDrawing.points}
              </p>
            </div>
          </div>
        )}

        {/* All Drawings */}
        {hasDrawnToday && allDrawings.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm border border-purple-100 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Community Drawings - Guess & Vote!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allDrawings
                .filter(drawing => drawing.userId !== username)
                .map((drawing) => (
                  <div key={drawing.id} className="border border-purple-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className="text-center mb-3">
                      <p className="font-medium text-slate-700">By {drawing.username}</p>
                      <p className="text-sm text-slate-500">
                        {drawing.guesses.length} guesses | {drawing.votes.length} votes
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleViewDrawing(drawing)}
                      className="w-full mb-3"
                    >
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 h-32 rounded-xl border-2 border-dashed border-purple-300 flex items-center justify-center hover:from-purple-100 hover:to-indigo-100 transition-all duration-200">
                        <span className="text-purple-600 font-medium">🖼️ View Drawing</span>
                      </div>
                    </button>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      {!drawing.guesses.some(g => g.userId === username) && (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={guess}
                            onChange={(e) => setGuess(e.target.value)}
                            placeholder="What is this drawing?"
                            className="flex-1 px-3 py-1 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleGuessSubmit(drawing.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleGuessSubmit(drawing.id)}
                            disabled={submittingGuess || !guess.trim()}
                            className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg text-sm disabled:opacity-50 font-medium transition-all duration-200"
                          >
                            Guess
                          </button>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVoteSubmit(drawing.id, 'best')}
                          disabled={submittingVote || drawing.votes.some(v => v.userId === username && v.voteType === 'best')}
                          className="flex-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white rounded-lg text-sm disabled:opacity-50 font-medium transition-all duration-200"
                        >
                          ⭐ Best ({drawing.votes.filter(v => v.voteType === 'best').length})
                        </button>
                        <button
                          onClick={() => handleVoteSubmit(drawing.id, 'funniest')}
                          disabled={submittingVote || drawing.votes.some(v => v.userId === username && v.voteType === 'funniest')}
                          className="flex-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm disabled:opacity-50 font-medium transition-all duration-200"
                        >
                          😂 Funny ({drawing.votes.filter(v => v.voteType === 'funniest').length})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* User Stats */}
        {userStats && (
          <div className="bg-white/90 backdrop-blur-sm border border-purple-100 rounded-2xl shadow-xl p-6 mt-6">
            <h3 className="text-xl font-bold text-center mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Your Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{userStats.totalPoints}</p>
                <p className="text-sm text-slate-600">Total Points</p>
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{userStats.totalDrawings}</p>
                <p className="text-sm text-slate-600">Drawings</p>
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{userStats.correctGuesses}</p>
                <p className="text-sm text-slate-600">Correct Guesses</p>
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {userStats.bestDrawingWins + userStats.funniestDrawingWins}
                </p>
                <p className="text-sm text-slate-600">Vote Wins</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawing Modal */}
      {selectedDrawing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-sm border border-purple-200 rounded-2xl max-w-2xl w-full max-h-full overflow-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Drawing by {selectedDrawing.username}</h3>
                <button
                  onClick={() => setSelectedDrawing(null)}
                  className="text-slate-500 hover:text-slate-700 hover:bg-purple-100 rounded-full w-8 h-8 flex items-center justify-center text-xl transition-all duration-200"
                >
                  ×
                </button>
              </div>
              
              <div className="text-center mb-4">
                <img
                  src={selectedDrawing.imageData}
                  alt={`Drawing by ${selectedDrawing.username}`}
                  className="max-w-full border-2 border-purple-200 rounded-xl mx-auto shadow-lg"
                />
              </div>

              {/* Guesses */}
              {selectedDrawing.guesses.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-bold mb-2 text-slate-700">Guesses:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedDrawing.guesses.map((guess) => (
                      <div
                        key={guess.id}
                        className={`p-2 rounded-lg text-sm ${
                          guess.isCorrect ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700' : 'bg-purple-50 border border-purple-100 text-slate-700'
                        }`}
                      >
                        <strong>{guess.username}:</strong> {guess.guess}
                        {guess.isCorrect && ' ✅'}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setSelectedDrawing(null)}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
