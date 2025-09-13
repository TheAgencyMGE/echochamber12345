import React from 'react';
import { motion } from 'framer-motion';
import { User, Target, Crown, Clock } from 'lucide-react';
import { GameState } from '../../types/golf';

interface GameHUDProps {
  gameState: GameState;
}

export const GameHUD: React.FC<GameHUDProps> = ({ gameState }) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentHole = gameState.holes[gameState.currentHole];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Current Player */}
      <motion.div
        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2"
            style={{
              backgroundColor: currentPlayer?.color,
              borderColor: currentPlayer?.color,
            }}
          >
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Current Player</h3>
            <p className="text-green-300">{currentPlayer?.name}</p>
          </div>
        </div>
      </motion.div>

      {/* Hole Info */}
      <motion.div
        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Hole {currentHole?.id || 1}</h3>
            <p className="text-green-300">Par {currentHole?.par || 3}</p>
          </div>
        </div>
      </motion.div>

      {/* Current Strokes */}
      <motion.div
        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">This Hole</h3>
            <p className="text-green-300">
              {currentPlayer?.holeStrokes[gameState.currentHole] || 0} strokes
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Player Overview */}
      <motion.div
        className="md:col-span-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-500" />
            Players Overview
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gameState.players.map((player, index) => {
            const ball = gameState.balls.find(b => b.id === player.id);
            const isCurrentPlayer = index === gameState.currentPlayerIndex;
            const holeComplete = ball?.isInHole;
            
            return (
              <motion.div
                key={player.id}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isCurrentPlayer
                    ? 'bg-white/20 border-white/30 shadow-lg'
                    : 'bg-white/5 border-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: player.color }}
                  >
                    {index + 1}
                  </div>
                  <span className={`font-medium ${isCurrentPlayer ? 'text-white' : 'text-green-200'}`}>
                    {player.name}
                  </span>
                  {holeComplete && <span className="text-green-400 text-xs">✓</span>}
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-green-300">Total:</span>
                    <span className="text-white font-semibold">{player.totalStrokes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-300">This hole:</span>
                    <span className={`font-semibold ${
                      (player.holeStrokes[gameState.currentHole] || 0) <= (currentHole?.par || 3) 
                        ? 'text-green-400' 
                        : 'text-yellow-400'
                    }`}>
                      {player.holeStrokes[gameState.currentHole] || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};