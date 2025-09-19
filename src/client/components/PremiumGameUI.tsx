import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { GolfGang as OriginalGolfGang } from './GolfGang';
import { Storycollab } from './Storycollab';
import { Drawverse } from './Drawverse';

export const PremiumGameUI: React.FC = () => {
  const [currentGame, setCurrentGame] = useState<'drawverse' | 'storycollab' | 'golfgang'>('drawverse');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [pendingGame, setPendingGame] = useState<'storycollab' | 'golfgang' | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Remove first load flag after animation
  React.useEffect(() => {
    const timer = setTimeout(() => setIsFirstLoad(false), 2000);
    return () => clearTimeout(timer);
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-slate-800">
      {/* Launch animation overlay */}
      <AnimatePresence>
        {isFirstLoad && (
          <motion.div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-gray-300 flex items-center justify-center shadow-2xl mx-auto mb-6"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-black rounded-full"></div>
                    <motion.div
                      className="absolute w-8 h-8 border-2 border-black/60 rounded-full"
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute w-12 h-12 border border-black/30 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                </div>
              </motion.div>
              <motion.h1
                className="text-4xl font-bold text-white mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Echo Chamber
              </motion.h1>
              <motion.p
                className="text-gray-400 text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                Daily creative challenges await
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-40"></div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-gray-500/10"
          animate={{
            background: [
              'linear-gradient(to right, rgba(255, 255, 255, 0.05), transparent, rgba(107, 114, 128, 0.1))',
              'linear-gradient(to right, rgba(107, 114, 128, 0.1), transparent, rgba(255, 255, 255, 0.05))',
              'linear-gradient(to right, rgba(255, 255, 255, 0.05), transparent, rgba(107, 114, 128, 0.1))'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isFirstLoad ? 1.2 : 0, duration: 0.8 }}
      >
        {/* Top Navigation */}
        <nav className="relative z-50 border-b border-white/20 backdrop-blur-xl bg-gradient-to-r from-black/80 to-gray-900/80">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-gray-300 flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="relative">
                    {/* Echo waves */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                      <div className="absolute w-4 h-4 border-2 border-black/60 rounded-full animate-ping"></div>
                      <div className="absolute w-6 h-6 border border-black/30 rounded-full"></div>
                    </div>
                  </div>
                </motion.div>
                <span className="text-white font-bold text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Echo Chamber</span>
              </div>
              
              <div className="flex items-center space-x-1">
                {[
                  { id: 'drawverse', label: 'Drawverse', active: currentGame === 'drawverse' },
                  { id: 'storycollab', label: 'Storycollab', active: currentGame === 'storycollab' },
                  { id: 'golfgang', label: 'Golf Gang', active: currentGame === 'golfgang' }
                ].map(({ id, label, active }) => (
                  <button
                    key={id}
                    onClick={() => {
                      if (id === 'drawverse') {
                        setCurrentGame('drawverse');
                      } else if (id === 'storycollab' || id === 'golfgang') {
                        setPendingGame(id as 'storycollab' | 'golfgang');
                        setShowDisclaimerModal(true);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}

                {/* About button */}
                <button
                  onClick={() => setShowAboutModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
        {/* Render the selected game */}
        {currentGame === 'storycollab' ? (
          <div className="pt-0">
            <Storycollab />
          </div>
        ) : currentGame === 'golfgang' ? (
          <div className="pt-0">
            <OriginalGolfGang />
          </div>
        ) : currentGame === 'drawverse' ? (
          <div className="pt-0">
            <Drawverse />
          </div>
        ) : null}

        {/* About Modal */}
        <AnimatePresence>
          {showAboutModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl max-w-2xl w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                      About Echo Chamber
                    </h3>
                    <button
                      onClick={() => setShowAboutModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    <p className="text-lg text-white leading-relaxed">
                      Welcome to <span className="font-bold text-orange-400">Echo Chamber</span> – your daily destination for creative competition and community fun!
                    </p>

                    <div className="space-y-4">
                      <h4 className="text-xl font-semibold text-white mb-3">Three Daily Games to Master:</h4>

                      <div className="grid gap-4">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <h5 className="font-bold text-purple-300 mb-2">🎨 Drawverse</h5>
                          <p className="text-white/80 text-sm">Express your creativity with daily drawing challenges. Create art, guess others' drawings, and compete for the top spot on the leaderboard.</p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <h5 className="font-bold text-indigo-300 mb-2">📖 Storycollab</h5>
                          <p className="text-white/80 text-sm">Build epic stories together! Contribute to collaborative narratives and vote on the best story continuations each hour.</p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <h5 className="font-bold text-green-300 mb-2">🏌️ Golf Gang</h5>
                          <p className="text-white/80 text-sm">Master the daily mini golf challenge! Navigate unique courses, compete for the lowest score, and climb the daily leaderboard.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-400/30">
                      <p className="text-white text-center">
                        <span className="font-bold">New challenges every day!</span> Come back daily to compete, create, and connect with the community.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer Modal */}
        <AnimatePresence>
          {showDisclaimerModal && (
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl max-w-lg w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🚧</span>
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-3">
                      Under Construction
                    </h3>
                    <p className="text-white/90 text-lg leading-relaxed">
                      This feature is still under construction by <span className="font-bold text-orange-400">Agency</span>.
                    </p>
                    <p className="text-white/70 mt-3">
                      Would you like to see the progress, or go back to <span className="font-bold text-purple-400">Drawverse</span> (the completed product)?
                    </p>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        if (pendingGame) {
                          setCurrentGame(pendingGame);
                        }
                        setShowDisclaimerModal(false);
                        setPendingGame(null);
                      }}
                      className="flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl"
                    >
                      See Progress
                    </button>
                    <button
                      onClick={() => {
                        setCurrentGame('drawverse');
                        setShowDisclaimerModal(false);
                        setPendingGame(null);
                      }}
                      className="flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg hover:shadow-xl"
                    >
                      Go to Drawverse
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
