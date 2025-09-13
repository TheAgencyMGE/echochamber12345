import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';
import { GameState } from '../../types/golf';

interface ScoreBoardProps {
  gameState: GameState;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ gameState }) => {
  // Calculate par differences for each player
  const getParDifference = (player: any, holeIndex: number) => {
    const strokes = player.holeStrokes[holeIndex];
    const par = gameState.holes[holeIndex]?.par || 3;
    if (strokes === 0) return null;
    return strokes - par;
  };

  const getScoreDisplayText = (diff: number | null) => {
    if (diff === null) return '-';
    if (diff === -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'D.Bogey';
    return `+${diff}`;
  };

  const getScoreColor = (diff: number | null) => {
    if (diff === null) return 'text-gray-400';
    if (diff <= -2) return 'text-purple-400';
    if (diff === -1) return 'text-green-400';
    if (diff === 0) return 'text-blue-400';
    if (diff === 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Sort players by total strokes (ascending)
  const sortedPlayers = [...gameState.players].sort((a, b) => a.totalStrokes - b.totalStrokes);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
        </div>

        {/* Overall Standings */}
        <div className="space-y-3 mb-8">
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              className={`p-4 rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400/50'
                  : 'bg-white/10 border-white/20'
              }`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-yellow-400' : 'text-white'
                    }`}>
                      #{index + 1}
                    </span>
                    {index === 0 && <Award className="w-5 h-5 text-yellow-400" />}
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={`font-semibold ${index === 0 ? 'text-yellow-100' : 'text-white'}`}>
                      {player.name}
                    </div>
                    <div className="text-sm text-green-300">
                      {player.totalStrokes} total strokes
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    player.totalStrokes === Math.min(...gameState.players.map(p => p.totalStrokes))
                      ? 'text-green-400'
                      : 'text-white'
                  }`}>
                    {player.totalStrokes}
                  </div>
                  {gameState.players.length > 1 && (
                    <div className="text-sm text-green-300">
                      {player.totalStrokes - Math.min(...gameState.players.map(p => p.totalStrokes)) === 0
                        ? 'Leading'
                        : `+${player.totalStrokes - Math.min(...gameState.players.map(p => p.totalStrokes))}`
                      }
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed Scorecard */}
        <motion.div
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-400" />
            Detailed Scorecard
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left text-green-300 p-2">Player</th>
                  {gameState.holes.map((hole, index) => (
                    <th key={hole.id} className={`text-center p-2 ${
                      index === gameState.currentHole 
                        ? 'text-yellow-400 bg-white/10 rounded' 
                        : 'text-green-300'
                    }`}>
                      {hole.id}
                    </th>
                  ))}
                  <th className="text-center text-green-300 p-2 font-bold">Total</th>
                </tr>
                <tr className="border-b border-white/10 text-xs">
                  <td className="text-green-400 p-2">Par</td>
                  {gameState.holes.map((hole) => (
                    <td key={hole.id} className="text-center text-green-400 p-2">
                      {hole.par}
                    </td>
                  ))}
                  <td className="text-center text-green-400 p-2 font-bold">
                    {gameState.holes.reduce((sum, hole) => sum + hole.par, 0)}
                  </td>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr key={player.id} className="border-b border-white/10">
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium truncate">
                          {player.name}
                        </span>
                      </div>
                    </td>
                    {gameState.holes.map((hole, holeIndex) => {
                      const strokes = player.holeStrokes[holeIndex];
                      const parDiff = getParDifference(player, holeIndex);
                      const isCurrentHole = holeIndex === gameState.currentHole;
                      
                      return (
                        <td key={hole.id} className={`text-center p-2 ${
                          isCurrentHole ? 'bg-white/10 rounded' : ''
                        }`}>
                          <div className="flex flex-col items-center">
                            <span className={`font-semibold ${getScoreColor(parDiff)}`}>
                              {strokes || '-'}
                            </span>
                            <span className={`text-xs ${getScoreColor(parDiff)}`}>
                              {getScoreDisplayText(parDiff)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center p-2">
                      <div className="flex flex-col items-center">
                        <span className="text-white font-bold text-lg">
                          {player.totalStrokes}
                        </span>
                        <span className="text-green-300 text-xs">
                          {player.totalStrokes - gameState.holes.reduce((sum, hole) => sum + hole.par, 0) > 0 
                            ? `+${player.totalStrokes - gameState.holes.reduce((sum, hole) => sum + hole.par, 0)}`
                            : player.totalStrokes - gameState.holes.reduce((sum, hole) => sum + hole.par, 0) === 0
                            ? 'E'
                            : player.totalStrokes - gameState.holes.reduce((sum, hole) => sum + hole.par, 0)
                          }
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Game Progress */}
        <motion.div
          className="mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
            Game Progress
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-green-300">Holes Completed:</span>
              <span className="text-white font-semibold">
                {gameState.currentHole} / {gameState.holes.length}
              </span>
            </div>
            
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(gameState.currentHole / gameState.holes.length) * 100}%` 
                }}
              />
            </div>
            
            <div className="text-sm text-green-300 text-center">
              {gameState.currentHole === gameState.holes.length
                ? 'Game Complete!'
                : `Playing Hole ${gameState.currentHole + 1}: ${gameState.holes[gameState.currentHole]?.name || 'Unknown'}`
              }
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};