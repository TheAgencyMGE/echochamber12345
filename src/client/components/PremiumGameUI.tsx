import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Trophy, Eye, Heart, Zap, Sparkles } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import { useGameState } from '../hooks/useGameState';

export const PremiumGameUI: React.FC = () => {
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
        <motion.div
          className="text-white text-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-40"></div>
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

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    DrawVerse
                  </h1>
                  <p className="text-sm text-purple-300">Daily Drawing Challenge</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                {/* Time remaining */}
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <Clock className="w-4 h-4 text-purple-300" />
                  <span className="text-sm font-medium text-white">
                    {formatTime(gameState.timeRemaining)} left
                  </span>
                </div>

                {/* User stats */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-lg font-bold text-white">{gameState.userStats?.totalPoints || 0}</span>
                    </div>
                    <p className="text-xs text-purple-300">
                      {gameState.userStats ? `${gameState.userStats.totalDrawings} drawings` : 'No drawings yet'}
                    </p>
                  </div>
                  
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-bold">{gameState.username?.slice(0, 2).toUpperCase() || 'AN'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex space-x-1">
              {[
                { id: 'draw', label: 'Draw', icon: Sparkles },
                { id: 'guess', label: 'Guess', icon: Eye },
                { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
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
          </div>
        </nav>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {currentView === 'draw' && (
              <motion.div
                key="draw"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Draw section */}
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                    Express Yourself
                  </h2>
                  {gameState.currentPrompt && (
                    <div className="mx-auto max-w-2xl p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <h3 className="text-xl font-semibold text-white mb-2">Today's Prompt</h3>
                      <p className="text-2xl font-bold text-purple-200 mb-2">"{gameState.currentPrompt.prompt}"</p>
                      <p className="text-sm text-purple-300">Theme: {gameState.currentPrompt.theme}</p>
                    </div>
                  )}
                  <p className="text-xl text-purple-300 max-w-2xl mx-auto">
                    Create any drawing you want, add a title, and let others guess what you drew
                  </p>
                </div>

                <div className="flex justify-center">
                  {gameState.hasDrawnToday ? (
                    <div className="w-full max-w-4xl space-y-6">
                      <div className="text-center">
                        <div className="px-12 py-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl">
                          <div className="flex items-center justify-center space-x-3 text-purple-300">
                            <Sparkles className="w-6 h-6" />
                            <span className="font-bold text-xl">Drawing Submitted!</span>
                          </div>
                          <p className="text-sm text-purple-400 mt-2">Come back tomorrow for a new challenge</p>
                        </div>
                      </div>

                      {/* Show user's drawing and guesses */}
                      {gameState.userDrawing && (
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                          <h3 className="text-xl font-semibold text-white mb-4">Your Drawing: "{gameState.userDrawing.title}"</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Drawing preview */}
                            <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl overflow-hidden">
                              <img 
                                src={gameState.userDrawing.imageData} 
                                alt={gameState.userDrawing.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Guesses received */}
                            <div className="space-y-4">
                              <h4 className="text-lg font-semibold text-white">
                                Guesses ({gameState.userDrawing.guesses.length})
                              </h4>
                              {gameState.userDrawing.guesses.length === 0 ? (
                                <p className="text-purple-300">No guesses yet...</p>
                              ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {gameState.userDrawing.guesses.map((guess) => (
                                    <div 
                                      key={guess.id}
                                      className={`p-3 rounded-xl border ${
                                        guess.isCorrect 
                                          ? 'bg-green-500/20 border-green-400/50 text-green-200' 
                                          : 'bg-white/5 border-white/10 text-white'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{guess.username}</span>
                                        {guess.isCorrect && <span className="text-xs text-green-300">✓ Correct!</span>}
                                      </div>
                                      <p className="text-sm opacity-90">"{guess.guess}"</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => setShowDrawingModal(true)}
                      className="group relative px-12 py-6 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 rounded-2xl text-white font-bold text-xl shadow-2xl shadow-purple-500/25 overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative flex items-center space-x-3">
                        <Sparkles className="w-6 h-6" />
                        <span>Start Drawing</span>
                      </div>
                    </motion.button>
                  )}
                </div>

                {/* Recent drawings preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gameState.allDrawings.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <Eye className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No drawings yet</h3>
                      <p className="text-purple-300">Be the first to submit a drawing today!</p>
                    </div>
                  ) : (
                    gameState.allDrawings.slice(0, 3).map((drawing) => (
                      <motion.div
                        key={drawing.id}
                        className="group relative rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:bg-white/20 transition-all duration-300"
                        whileHover={{ y: -4 }}
                      >
                        <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl mb-4 overflow-hidden">
                          {drawing.imageData ? (
                            <img 
                              src={drawing.imageData} 
                              alt={drawing.isRevealed ? drawing.title : "Mystery drawing"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Eye className="w-8 h-8 text-purple-300" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-white mb-2">
                          {drawing.isRevealed ? drawing.title : 'Mystery Drawing'}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-purple-300">
                          <span>by {drawing.username}</span>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleVoteToggle(drawing.id)}
                              disabled={drawing.votes.some(vote => vote.username === gameState.username)}
                              className={`flex items-center space-x-1 transition-colors ${
                                drawing.votes.some(vote => vote.username === gameState.username)
                                  ? 'text-red-400 cursor-not-allowed' 
                                  : 'hover:text-red-400'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${
                                drawing.votes.some(vote => vote.username === gameState.username) 
                                  ? 'fill-current' 
                                  : ''
                              }`} />
                              <span>{drawing.votes.length}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'guess' && (
              <motion.div
                key="guess"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent mb-4">
                    Guess the Drawings
                  </h2>
                  <p className="text-xl text-purple-300">
                    Can you figure out what these artists drew?
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {gameState.allDrawings.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <Eye className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No drawings to guess</h3>
                      <p className="text-purple-300">Wait for others to submit their drawings!</p>
                    </div>
                  ) : (
                    gameState.allDrawings
                      .filter(drawing => !drawing.isRevealed && drawing.userId !== gameState.username)
                      .map((drawing, index) => (
                        <motion.div
                          key={drawing.id}
                          className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl mb-4 overflow-hidden">
                            {drawing.imageData ? (
                              <img 
                                src={drawing.imageData} 
                                alt="Mystery drawing"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-purple-300 text-lg">Loading...</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">by {drawing.username}</span>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2 text-purple-300">
                                  <Users className="w-4 h-4" />
                                  <span>{drawing.guesses.length} guesses</span>
                                </div>
                                <button
                                  onClick={() => handleVoteToggle(drawing.id)}
                                  disabled={drawing.votes.some(vote => vote.username === gameState.username)}
                                  className={`flex items-center space-x-1 transition-colors ${
                                    drawing.votes.some(vote => vote.username === gameState.username)
                                      ? 'text-red-400 cursor-not-allowed' 
                                      : 'text-purple-300 hover:text-red-400'
                                  }`}
                                >
                                  <Heart className={`w-4 h-4 ${
                                    drawing.votes.some(vote => vote.username === gameState.username) 
                                      ? 'fill-current' 
                                      : ''
                                  }`} />
                                  <span>{drawing.votes.length}</span>
                                </button>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={guessInputs[drawing.id] || ''}
                                onChange={(e) => setGuessInputs(prev => ({ ...prev, [drawing.id]: e.target.value }))}
                                placeholder="What do you think this is?"
                                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                onKeyPress={(e) => e.key === 'Enter' && handleGuessSubmit(drawing.id)}
                              />
                              <button 
                                onClick={() => handleGuessSubmit(drawing.id)}
                                disabled={!guessInputs[drawing.id]?.trim()}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Guess
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent mb-4">
                    Champions Board
                  </h2>
                  <p className="text-xl text-purple-300">
                    Today&apos;s top artists and guessers
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                  {!gameState.leaderboard || gameState.leaderboard.daily.length === 0 ? (
                    <div className="text-center py-12">
                      <Trophy className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No leaderboard yet</h3>
                      <p className="text-purple-300">Be the first to submit a drawing and start competing!</p>
                    </div>
                  ) : (
                    gameState.leaderboard.daily
                      .slice(0, 10)
                      .map((player, index) => (
                        <motion.div
                          key={player.username}
                          className={`flex items-center justify-between p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                            player.username === gameState.username
                              ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-400/50'
                              : 'bg-white/10 border-white/20 hover:bg-white/20'
                          }`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-xl font-bold text-white">
                                {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-white">{player.username}</h3>
                              <p className="text-sm text-purple-300">Rank #{index + 1}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              <Zap className="w-5 h-5 text-yellow-400" />
                              <span className="text-xl font-bold text-white">{player.totalPoints}</span>
                            </div>
                            <p className="text-sm text-purple-300">points</p>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

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
