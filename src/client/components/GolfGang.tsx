import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, RotateCcw, Trophy, Calendar, Star } from 'lucide-react';
import { GolfGangDailyChallenge } from './golf/GolfGangDailyChallenge';

interface LeaderboardEntry {
  rank: number;
  username: string;
  strokes: number;
  timestamp: number;
}

export const GolfGang: React.FC = () => {
  const [regenCount, setRegenCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState<'menu' | 'playing'>('menu');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userBestScore, setUserBestScore] = useState<number | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [username] = useState('DemoUser');
  const [completedScores, setCompletedScores] = useState<{[key: string]: number}>({});
  
  const maxRegens = 5;

  // Load daily challenge data
  useEffect(() => {
    loadDailyData();
  }, []);

  const loadDailyData = async () => {
    setIsLoading(true);
    try {
      // Load leaderboard
      const leaderboardResponse = await fetch('/api/golf/daily-leaderboard');
      if (leaderboardResponse.ok) {
        const data = await leaderboardResponse.json();
        setLeaderboard(data.leaderboard || []);
      } else {
        // API not available, use demo leaderboard
        setLeaderboard([
          { rank: 1, username: 'GolfPro', strokes: 3, timestamp: Date.now() },
          { rank: 2, username: 'BirdieKing', strokes: 4, timestamp: Date.now() },
          { rank: 3, username: 'PuttMaster', strokes: 5, timestamp: Date.now() },
          { rank: 4, username: 'ChipShot', strokes: 6, timestamp: Date.now() },
          { rank: 5, username: 'FairwayFinder', strokes: 7, timestamp: Date.now() }
        ]);
      }

      // Load user's best score for today
      const userScoreResponse = await fetch('/api/golf/user-daily-score');
      if (userScoreResponse.ok) {
        const data = await userScoreResponse.json();
        setUserBestScore(data.bestScore);
        setUserRank(data.rank);
        setRegenCount(data.regensUsed || 0);
      } else {
        // API not available, use default values
        setUserBestScore(null);
        setUserRank(null);
        setRegenCount(0);
      }
    } catch (error) {
      console.error('Failed to load daily golf data:', error);
      // API not available, use demo data
      setLeaderboard([
        { rank: 1, username: 'GolfPro', strokes: 3, timestamp: Date.now() },
        { rank: 2, username: 'BirdieKing', strokes: 4, timestamp: Date.now() },
        { rank: 3, username: 'PuttMaster', strokes: 5, timestamp: Date.now() },
        { rank: 4, username: 'ChipShot', strokes: 6, timestamp: Date.now() },
        { rank: 5, username: 'FairwayFinder', strokes: 7, timestamp: Date.now() }
      ]);
      setUserBestScore(null);
      setUserRank(null);
      setRegenCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChallenge = () => {
    setHasStarted(true);
    setGamePhase('playing');
  };

  const handleRegenerate = async () => {
    if (regenCount >= maxRegens) return;

    try {
      const response = await fetch('/api/golf/regenerate-course', {
        method: 'POST',
      });

      if (response.ok) {
        setRegenCount(prev => prev + 1);
        // The course will be regenerated on the backend
      } else {
        // API not available, still increment locally for demo
        setRegenCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to regenerate course:', error);
      // API not available, still increment locally for demo
      setRegenCount(prev => prev + 1);
    }
  };

  const handleBackToMenu = () => {
    setGamePhase('menu');
    loadDailyData(); // Refresh data when returning to menu
  };

  // Handle score submission from the challenge component
  const handleScoreSubmission = (strokes: number, rank: number) => {
    const today = new Date().toISOString().split('T')[0];

    // Update user's best score
    if (!userBestScore || strokes < userBestScore) {
      setUserBestScore(strokes);
    }

    // Store completed score
    setCompletedScores(prev => ({
      ...prev,
      [today]: strokes
    }));

    // Update user rank
    setUserRank(rank);

    // Add user to leaderboard if not already there, or update their score
    setLeaderboard(prev => {
      const existingUserIndex = prev.findIndex(entry => entry.username === username);
      const newEntry: LeaderboardEntry = {
        rank,
        username,
        strokes,
        timestamp: Date.now()
      };

      if (existingUserIndex >= 0) {
        // Update existing entry
        const updated = [...prev];
        updated[existingUserIndex] = newEntry;
        return updated.sort((a, b) => a.strokes - b.strokes).map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
      } else {
        // Add new entry
        const updated = [...prev, newEntry];
        return updated.sort((a, b) => a.strokes - b.strokes).map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
      }
    });
  };

  if (gamePhase === 'playing') {
    return (
      <GolfGangDailyChallenge
        onBackToMenu={handleBackToMenu}
        regensUsed={regenCount}
        onRegenerate={handleRegenerate}
        onScoreSubmitted={handleScoreSubmission}
      />
    );
  }

  // Game mode selection
  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-gradient-to-br from-green-900 via-emerald-800 to-green-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center">
          <div className="max-w-4xl w-full">
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
            Golf Gang Daily
          </h1>
          <p className="text-xl text-green-300 mb-2">Daily Mini Golf Challenge</p>
          <p className="text-lg text-green-400 max-w-xl mx-auto mb-8">
            Beat today's randomly generated course in as few strokes as possible!
          </p>
        </motion.div>
        
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Daily Challenge Info */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-green-400" />
                <h2 className="text-2xl font-bold text-white">Today's Challenge</h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-400">Day #{Math.floor((Date.now() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24))}</p>
                <p className="text-xs text-green-500">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <RotateCcw className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-blue-400 font-medium">Regens Left</p>
                <p className="text-2xl font-bold text-white">{maxRegens - regenCount}</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-yellow-400 font-medium">Best Score</p>
                <p className="text-2xl font-bold text-white">
                  {userBestScore ? userBestScore : '--'}
                </p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Trophy className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-orange-400 font-medium">Rank</p>
                <p className="text-2xl font-bold text-white">
                  {userRank ? `#${userRank}` : '--'}
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleStartChallenge}
                disabled={isLoading}
                className="px-8 py-4 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white font-bold text-xl rounded-2xl shadow-lg shadow-green-500/25 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : (hasStarted ? 'Continue Challenge' : 'Start Daily Challenge')}
              </button>
              
              {regenCount < maxRegens && hasStarted && (
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="ml-4 px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Regenerate Course ({maxRegens - regenCount} left)
                </button>
              )}
            </div>
          </motion.div>

          {/* Leaderboard Preview */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Today's Leaderboard</h2>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-white/60">Loading leaderboard...</p>
                </div>
              ) : leaderboard.length > 0 ? (
                leaderboard.slice(0, 10).map((player, index) => {
                  const isCurrentUser = player.username === username;
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                  
                  return (
                    <div
                      key={player.username}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        isCurrentUser 
                          ? 'bg-blue-500/20 border border-blue-400/50' 
                          : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{medal || `#${player.rank}`}</span>
                        <span className={`font-medium ${isCurrentUser ? 'text-blue-300' : 'text-white'}`}>
                          {player.username}
                        </span>
                      </div>
                      <span className={`font-bold ${isCurrentUser ? 'text-blue-300' : 'text-green-400'}`}>
                        {player.strokes} strokes
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-white/60">No scores yet today</p>
                  <p className="text-white/40 text-sm">Be the first to complete the challenge!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-green-400 text-sm">
            🏌️ New challenge every 24 hours • Beat your best score • Climb the leaderboard!
          </p>
        </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};