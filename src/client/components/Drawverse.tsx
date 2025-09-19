import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Trophy, Eye, Heart, Zap, Sparkles } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import { useGameState } from '../hooks/useGameState';

export const Drawverse: React.FC = () => {
  const gameState = useGameState();
  const [currentView, setCurrentView] = useState<'draw' | 'guess' | 'leaderboard'>('draw');
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [guessInputs, setGuessInputs] = useState<Record<string, string>>({});

  // Load leaderboard when switching to leaderboard view
  React.useEffect(() => {
    if (currentView === 'leaderboard' && !gameState.leaderboard) {
      gameState.loadLeaderboard();
    }
  }, [currentView, gameState.leaderboard, gameState.loadLeaderboard]);

  const handleVoteToggle = async (drawingId: string) => {
    const drawing = gameState.allDrawings.find(d => d.id === drawingId);
    if (!drawing) return;

    const userHasVoted = drawing.votes.some(vote => vote.username === gameState.username);

    try {
      if (userHasVoted) {
        // For now, we'll just prevent multiple votes by not allowing action
        // TODO: Implement removeVote in the backend
        return;
      } else {
        // Add vote (like)
        await gameState.submitVote(drawingId, 'best');
      }
    } catch (error) {
      console.error('Failed to toggle vote:', error);
    }
  };

  const handleGuessSubmit = async (drawingId: string) => {
    const guess = guessInputs[drawingId];
    if (!guess?.trim()) return;

    try {
      await gameState.submitGuess(drawingId, guess.trim());
      setGuessInputs(prev => ({ ...prev, [drawingId]: '' }));
    } catch (error) {
      console.error('Failed to submit guess:', error);
    }
  };

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleDrawingComplete = async (imageData: string, title: string, description?: string) => {
    try {
      await gameState.submitDrawing(imageData, title, description);
      setShowDrawingModal(false);
    } catch (error) {
      console.error('Failed to submit drawing:', error);
    }
  };

  // Show loading screen if still initializing
  if (gameState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-indigo-600/10"
            animate={{
              background: [
                'linear-gradient(to right, rgba(147, 51, 234, 0.1), transparent, rgba(79, 70, 229, 0.1))',
                'linear-gradient(to right, rgba(79, 70, 229, 0.1), transparent, rgba(147, 51, 234, 0.1))',
                'linear-gradient(to right, rgba(147, 51, 234, 0.1), transparent, rgba(79, 70, 229, 0.1))'
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <motion.div
          className="relative z-10 text-white text-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading Drawverse...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-indigo-600/10"
          animate={{
            background: [
              'linear-gradient(to right, rgba(147, 51, 234, 0.1), transparent, rgba(79, 70, 229, 0.1))',
              'linear-gradient(to right, rgba(79, 70, 229, 0.1), transparent, rgba(147, 51, 234, 0.1))',
              'linear-gradient(to right, rgba(147, 51, 234, 0.1), transparent, rgba(79, 70, 229, 0.1))'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent mb-4">
            Drawverse
          </h1>
          <p className="text-xl text-purple-300 mb-2">Daily Drawing Challenge</p>
          <p className="text-lg text-purple-400 max-w-xl mx-auto mb-8">
            Express your creativity! Draw, guess others' art, and compete for the top spot on the leaderboard.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Today's Challenge Card */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Today's Challenge</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-400">Day #{Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24))}</p>
                <p className="text-xs text-purple-500">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {gameState.currentPrompt && (
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-2">Today's Prompt</h3>
                <p className="text-xl font-bold text-purple-200 mb-2">"{gameState.currentPrompt.prompt}"</p>
                <p className="text-sm text-purple-300">Theme: {gameState.currentPrompt.theme}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-blue-400 font-medium">Time Left</p>
                <p className="text-2xl font-bold text-white">{formatTime(gameState.timeRemaining)}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-yellow-400 font-medium">Your Points</p>
                <p className="text-2xl font-bold text-white">
                  {gameState.userStats?.totalPoints || 0}
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-green-400 font-medium">Drawings</p>
                <p className="text-2xl font-bold text-white">
                  {gameState.userStats?.totalDrawings || 0}
                </p>
              </div>
            </div>

            <div className="text-center">
              {gameState.hasDrawnToday ? (
                <div className="space-y-4">
                  <div className="px-8 py-4 bg-green-500/20 border border-green-400/50 rounded-xl">
                    <div className="flex items-center justify-center space-x-3 text-green-300">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-bold">Drawing Submitted!</span>
                    </div>
                    <p className="text-sm text-green-400 mt-1">Come back tomorrow for a new challenge</p>
                  </div>
                  <button
                    onClick={() => setCurrentView('guess')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all duration-200"
                  >
                    Guess Other Drawings
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDrawingModal(true)}
                  disabled={gameState.isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white font-bold text-xl rounded-2xl shadow-lg shadow-purple-500/25 hover:from-purple-600 hover:via-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gameState.isLoading ? 'Loading...' : 'Start Drawing'}
                </button>
              )}
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex space-x-2 mb-6">
              {[
                { id: 'draw', label: 'Draw', icon: Sparkles },
                { id: 'guess', label: 'Guess', icon: Eye },
                { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    currentView === id
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                      : 'text-purple-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {currentView === 'draw' && (
              <div className="text-center">
                <p className="text-purple-300 mb-4">Ready to create? Express your creativity and let others guess your masterpiece!</p>
                {gameState.hasDrawnToday && gameState.userDrawing && (
                  <div className="mb-4 p-4 bg-white/5 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Your Drawing: "{gameState.userDrawing.title}"</h4>
                    <p className="text-sm text-purple-300">{gameState.userDrawing.guesses.length} guesses received</p>
                  </div>
                )}
              </div>
            )}

            {currentView === 'guess' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white text-center">Guess the Drawings</h3>
                {gameState.allDrawings.filter(d => !d.isRevealed && d.userId !== gameState.username).length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                    <p className="text-purple-300">No drawings to guess yet!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {gameState.allDrawings
                      .filter(d => !d.isRevealed && d.userId !== gameState.username)
                      .slice(0, 3)
                      .map((drawing) => (
                        <div key={drawing.id} className="flex items-center space-x-4 p-3 bg-white/5 rounded-xl">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg flex items-center justify-center">
                            <Eye className="w-6 h-6 text-purple-300" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">by {drawing.username}</p>
                            <p className="text-sm text-purple-300">{drawing.guesses.length} guesses</p>
                          </div>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={guessInputs[drawing.id] || ''}
                              onChange={(e) => setGuessInputs(prev => ({ ...prev, [drawing.id]: e.target.value }))}
                              placeholder="Your guess..."
                              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              onKeyPress={(e) => e.key === 'Enter' && handleGuessSubmit(drawing.id)}
                            />
                            <button
                              onClick={() => handleGuessSubmit(drawing.id)}
                              disabled={!guessInputs[drawing.id]?.trim()}
                              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
                            >
                              Guess
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {currentView === 'leaderboard' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white text-center">Today's Champions</h3>
                {!gameState.leaderboard || gameState.leaderboard.daily.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                    <p className="text-purple-300">No champions yet today!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {gameState.leaderboard.daily.slice(0, 5).map((player, index) => (
                      <div key={player.username} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">
                            {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                          <span className="text-white font-medium">{player.username}</span>
                        </div>
                        <span className="text-yellow-400 font-bold">{player.totalPoints} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-purple-400 text-sm">
              🎨 New challenges every 24 hours • Create, guess, and compete!
            </p>
          </motion.div>
        </div>

        {/* Drawing Modal */}
        <AnimatePresence>
          {showDrawingModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                      Create Your Masterpiece
                    </h3>
                    <button
                      onClick={() => setShowDrawingModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>

                  <DrawingCanvas onDrawingComplete={handleDrawingComplete} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};