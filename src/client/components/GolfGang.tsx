import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Users, User } from 'lucide-react';
import { GolfGangMultiplayer } from './GolfGangMultiplayer';
import { GolfGangSingleplayer } from './golf/GolfGangSingleplayer';

export const GolfGang: React.FC = () => {
  const [gameMode, setGameMode] = useState<'select' | 'singleplayer' | 'multiplayer'>('select');

  if (gameMode === 'multiplayer') {
    return <GolfGangMultiplayer onBackToMenu={() => setGameMode('select')} />;
  }

  if (gameMode === 'singleplayer') {
    return <GolfGangSingleplayer onBackToMenu={() => setGameMode('select')} />;
  }

  // Game mode selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-transparent to-emerald-600/10"
          animate={{
            background: [
              'linear-gradient(to right, rgba(34, 197, 94, 0.1), transparent, rgba(16, 185, 129, 0.1))',
              'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent, rgba(34, 197, 94, 0.1))',
              'linear-gradient(to right, rgba(34, 197, 94, 0.1), transparent, rgba(16, 185, 129, 0.1))'
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
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Flag className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent mb-4">
            Golf Gang
          </h1>
          <p className="text-xl text-green-300 mb-2">2D Mini Golf Party</p>
          <p className="text-lg text-green-400 max-w-xl mx-auto mb-8">
            Experience classic arcade mini-golf! Choose your game mode below.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Singleplayer Mode */}
          <motion.button
            onClick={() => setGameMode('singleplayer')}
            className="group relative p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl hover:bg-white/20 transition-all duration-300 overflow-hidden"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex items-center space-x-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Singleplayer</h3>
                <p className="text-green-300 mb-3">Practice your skills solo!</p>
                <ul className="text-sm text-green-400 space-y-1">
                  <li>• Play at your own pace</li>
                  <li>• No internet connection required</li>
                  <li>• 8 challenging courses</li>
                  <li>• Track your best scores</li>
                </ul>
              </div>
            </div>
            
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/50 rounded-full text-emerald-300 text-xs font-medium">
                🎯 Solo
              </div>
            </div>
          </motion.button>

          {/* Multiplayer Mode */}
          <motion.button
            onClick={() => setGameMode('multiplayer')}
            className="group relative p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl hover:bg-white/20 transition-all duration-300 overflow-hidden"
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex items-center space-x-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white mb-2">Multiplayer</h3>
                <p className="text-green-300 mb-3">Play with friends online!</p>
                <ul className="text-sm text-green-400 space-y-1">
                  <li>• Real-time multiplayer with 2-4 players</li>
                  <li>• Join existing rooms or create your own</li>
                  <li>• Live leaderboards and turn-based gameplay</li>
                  <li>• Chat and compete with global players</li>
                </ul>
              </div>
            </div>
            
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1 bg-blue-500/20 border border-blue-400/50 rounded-full text-blue-300 text-xs font-medium">
                🌐 Online
              </div>
            </div>
          </motion.button>
        </div>

        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-green-400 text-sm">
            🎮 Choose your preferred game mode to start playing Golf Gang!
          </p>
        </motion.div>
      </div>
    </div>
  );
};