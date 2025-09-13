import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Minus, Play, User } from 'lucide-react';

interface PlayerSetupProps {
  onStartGame: (playerNames: string[]) => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame }) => {
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2']);
  const [isStarting, setIsStarting] = useState(false);

  const addPlayer = () => {
    if (playerNames.length < 4) {
      setPlayerNames([...playerNames, `Player ${playerNames.length + 1}`]);
    }
  };

  const removePlayer = () => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.slice(0, -1));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name || `Player ${index + 1}`;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    setIsStarting(true);
    setTimeout(() => {
      onStartGame(playerNames.filter(name => name.trim()));
    }, 500);
  };

  const playerColors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Setup Players</h2>
        <p className="text-green-300">Enter player names and get ready to putt!</p>
      </div>

      <div className="space-y-4 mb-8">
        {playerNames.map((name, index) => (
          <motion.div
            key={index}
            className="flex items-center space-x-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2"
              style={{
                backgroundColor: playerColors[index],
                borderColor: playerColors[index],
              }}
            >
              {index + 1}
            </div>
            <div className="flex-1 relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => updatePlayerName(index, e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={`Player ${index + 1}`}
                maxLength={20}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-center space-x-4 mb-8">
        <motion.button
          onClick={removePlayer}
          disabled={playerNames.length <= 2}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            playerNames.length <= 2
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <Minus className="w-4 h-4" />
          <span>Remove Player</span>
        </motion.button>

        <span className="text-green-300 font-medium">
          {playerNames.length} Player{playerNames.length !== 1 ? 's' : ''}
        </span>

        <motion.button
          onClick={addPlayer}
          disabled={playerNames.length >= 4}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            playerNames.length >= 4
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>Add Player</span>
        </motion.button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-3">Game Rules</h3>
        <ul className="space-y-2 text-green-200 text-sm">
          <li>• Drag from the ball to aim and set power</li>
          <li>• Release to putt the ball toward the hole</li>
          <li>• Avoid water hazards (+1 stroke penalty)</li>
          <li>• Complete all 8 holes with the lowest score</li>
          <li>• Take turns until all players finish each hole</li>
        </ul>
      </div>

      <motion.button
        onClick={handleStartGame}
        disabled={isStarting || playerNames.some(name => !name.trim())}
        className={`w-full py-4 rounded-2xl font-bold text-xl transition-all duration-300 ${
          isStarting
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white hover:from-green-600 hover:via-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25'
        }`}
        whileHover={!isStarting ? { scale: 1.02 } : {}}
        whileTap={!isStarting ? { scale: 0.98 } : {}}
      >
        <div className="flex items-center justify-center space-x-3">
          <Play className="w-6 h-6" />
          <span>{isStarting ? 'Starting Game...' : 'Start Golf Game'}</span>
        </div>
      </motion.button>
    </motion.div>
  );
};