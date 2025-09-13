import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Star, RotateCcw, PartyPopper, Users, LogOut } from 'lucide-react';
import { Player, GolfRoom } from '../../../shared/types/golf';

interface WinnerScreenMultiplayerProps {
  winner: Player;
  room: GolfRoom;
  onLeaveRoom: () => void;
  onPlayAgain: () => void;
}

export const WinnerScreenMultiplayer: React.FC<WinnerScreenMultiplayerProps> = ({ 
  winner, 
  room, 
  onLeaveRoom, 
  onPlayAgain 
}) => {
  const confettiVariants = {
    initial: { y: -100, opacity: 0, rotate: 0 },
    animate: { 
      y: 600, 
      opacity: [0, 1, 1, 0], 
      rotate: 360,
      transition: { 
        duration: 3, 
        repeat: Infinity, 
        delay: Math.random() * 2 
      }
    }
  };

  const sortedPlayers = [...room.players].sort((a, b) => a.totalStrokes - b.totalStrokes);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 relative overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-transparent to-orange-600/20"
          animate={{
            background: [
              'linear-gradient(to right, rgba(251, 191, 36, 0.2), transparent, rgba(251, 146, 60, 0.2))',
              'linear-gradient(to right, rgba(251, 146, 60, 0.2), transparent, rgba(251, 191, 36, 0.2))',
              'linear-gradient(to right, rgba(251, 191, 36, 0.2), transparent, rgba(251, 146, 60, 0.2))'
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Confetti */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: -20,
          }}
          variants={confettiVariants}
          initial="initial"
          animate="animate"
        />
      ))}

      <div className="relative z-10 text-center max-w-4xl mx-4">
        {/* Trophy Animation */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2
          }}
        >
          <div className="relative">
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl"
              animate={{ 
                boxShadow: [
                  '0 0 0 0 rgba(251, 191, 36, 0.7)',
                  '0 0 0 20px rgba(251, 191, 36, 0)',
                  '0 0 0 0 rgba(251, 191, 36, 0)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-16 h-16 text-white" />
            </motion.div>
            
            <motion.div
              className="absolute -top-6 left-1/2 transform -translate-x-1/2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Crown className="w-12 h-12 text-yellow-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Winner Announcement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
            Victory!
          </h1>
          
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-yellow-400"
              style={{ backgroundColor: winner.color }}
            >
              {winner.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <h2 className="text-3xl font-bold text-white">{winner.name}</h2>
              <p className="text-xl text-yellow-300">wins Golf Gang!</p>
            </div>
          </div>
        </motion.div>

        {/* Final Leaderboard */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
            <Users className="w-6 h-6 mr-2 text-green-400" />
            Final Leaderboard
          </h3>
          
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl ${
                  index === 0 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50'
                    : index === 1
                      ? 'bg-gray-500/20 border border-gray-400/30'
                      : index === 2
                        ? 'bg-amber-600/20 border border-amber-400/30'
                        : 'bg-white/10 border border-white/20'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold text-white">{player.name}</div>
                    <div className="text-green-300">
                      {player.totalStrokes} total strokes
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {player.totalStrokes}
                  </div>
                  {index > 0 && (
                    <div className="text-green-300">
                      +{player.totalStrokes - winner.totalStrokes}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Winner Stats */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
            <Star className="w-6 h-6 mr-2 text-yellow-400" />
            Game Statistics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">
                {winner.totalStrokes}
              </div>
              <p className="text-green-300 font-medium">Winner's Score</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                {room.players.length}
              </div>
              <p className="text-green-300 font-medium">Players</p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {room.currentHole}
              </div>
              <p className="text-green-300 font-medium">Holes Played</p>
            </div>
          </div>
        </motion.div>

        {/* Celebration Message */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-6">
            <div className="flex items-center justify-center mb-4">
              <PartyPopper className="w-8 h-8 text-green-400 mr-3" />
              <h3 className="text-xl font-bold text-white">Amazing Game!</h3>
            </div>
            <p className="text-green-200 text-lg">
              Thanks for playing Golf Gang multiplayer! {winner.name} showed incredible skill on the course.
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <button
            onClick={onPlayAgain}
            className="group px-8 py-4 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-green-500/25 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-3">
              <RotateCcw className="w-6 h-6" />
              <span>Play Again</span>
            </div>
          </button>
          
          <button
            onClick={onLeaveRoom}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-2xl border border-white/20 hover:border-white/30 transform hover:scale-105 transition-all duration-200"
          >
            <div className="flex items-center justify-center space-x-3">
              <LogOut className="w-6 h-6" />
              <span>Leave Room</span>
            </div>
          </button>
        </motion.div>

        {/* Fun Stats */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <p className="text-green-300 text-sm">
            🏆 Room: {room.name} • Thanks for playing Golf Gang multiplayer!
          </p>
        </motion.div>
      </div>
    </div>
  );
};