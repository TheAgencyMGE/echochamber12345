import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Flag, Users, LogOut } from 'lucide-react';
import { useGolfMultiplayer } from '../hooks/useGolfMultiplayer';
import { MultiplayerLobby } from './golf/MultiplayerLobby';
import { GolfCourseMultiplayer } from './golf/GolfCourseMultiplayer';
import { ScoreBoardMultiplayer } from './golf/ScoreBoardMultiplayer';
import { GameHUDMultiplayer } from './golf/GameHUDMultiplayer';
import { WinnerScreenMultiplayer } from './golf/WinnerScreenMultiplayer';
import { golfCourses } from '../data/golfCourses';

interface GolfGangMultiplayerProps {
  onBackToMenu?: () => void;
}

export const GolfGangMultiplayer: React.FC<GolfGangMultiplayerProps> = ({ onBackToMenu }) => {
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');

  const {
    isConnected,
    isConnecting,
    currentRoom,
    availableRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    hitBall,
    isMyTurn,
    getMyPlayer,
    requestRoomList,
  } = useGolfMultiplayer({
    onError: (error) => {
      console.error('Golf multiplayer error:', error);
      setConnectionError(error);
    }
  });

  const handleHitBall = useCallback((velocity: { x: number; y: number }, position: { x: number; y: number }) => {
    if (isMyTurn()) {
      hitBall(velocity, position);
    }
  }, [isMyTurn, hitBall]);

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  const handleStartGame = () => {
    if (currentRoom && currentRoom.players.length >= 2) {
      startGame();
    }
  };

  // Show connection error screen if there's an error
  if (connectionError && !isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-red-500/20 border border-red-400/50 rounded-2xl p-8 mb-6">
            <div className="w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Connection Failed</h3>
            <p className="text-red-300 mb-4">{connectionError}</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => onBackToMenu?.()}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200"
            >
              Try Singleplayer Mode
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all duration-200"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show lobby if not in a room
  if (!currentRoom) {
    return (
      <MultiplayerLobby
        availableRooms={availableRooms}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onRefresh={requestRoomList}
        onBackToMenu={onBackToMenu}
      />
    );
  }

  // Show winner screen if game is finished
  if (currentRoom.gamePhase === 'finished' && currentRoom.winner) {
    return (
      <WinnerScreenMultiplayer 
        winner={currentRoom.winner} 
        room={currentRoom}
        onLeaveRoom={handleLeaveRoom}
        onPlayAgain={() => {
          // For now, just leave the room - could implement restart later
          handleLeaveRoom();
        }}
      />
    );
  }

  const currentHole = golfCourses[currentRoom.currentHole];
  const myPlayer = getMyPlayer();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-transparent to-emerald-600/5"
          animate={{
            background: [
              'linear-gradient(to right, rgba(34, 197, 94, 0.05), transparent, rgba(16, 185, 129, 0.05))',
              'linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent, rgba(34, 197, 94, 0.05))',
              'linear-gradient(to right, rgba(34, 197, 94, 0.05), transparent, rgba(16, 185, 129, 0.05))'
            ]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Game Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
              >
                <Flag className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                  Golf Gang - {currentRoom.name}
                </h1>
                <p className="text-sm text-green-300">
                  {currentRoom.gamePhase === 'waiting' 
                    ? `Waiting for game to start (${currentRoom.players.length}/${currentRoom.maxPlayers} players)`
                    : `Hole ${currentRoom.currentHole + 1} of ${golfCourses.length} - ${currentHole?.name || 'Unknown'}`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentRoom.gamePhase === 'playing' && currentHole && (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <Target className="w-4 h-4 text-green-300" />
                  <span className="text-sm font-medium text-white">
                    Par {currentHole.par}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Users className="w-4 h-4 text-green-300" />
                <span className="text-sm font-medium text-white">
                  {currentRoom.players.length} players
                </span>
              </div>
              
              <button
                onClick={() => setShowScoreboard(!showScoreboard)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 text-white"
              >
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium">Scores</span>
              </button>
              
              <button
                onClick={handleLeaveRoom}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm border border-red-400/20 transition-all duration-200 text-red-300 hover:text-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Leave</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Game Content */}
      <div className="relative z-10 flex">
        {/* Main Game Area */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {currentRoom.gamePhase === 'waiting' ? (
              <motion.div
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-3xl font-bold text-white mb-4">Waiting for Game to Start</h2>
                <p className="text-green-300 mb-6">
                  {currentRoom.players.length < 2 
                    ? 'Waiting for more players to join...'
                    : 'Ready to start! Click the button below.'
                  }
                </p>
                
                {/* Player list */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {currentRoom.players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      className="bg-white/10 border border-white/20 rounded-xl p-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div
                        className="w-12 h-12 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: player.color }}
                      />
                      <p className="text-white font-medium">{player.name}</p>
                      <p className="text-green-300 text-sm">
                        {player.id === myPlayer?.id ? 'You' : 'Ready'}
                      </p>
                    </motion.div>
                  ))}
                  
                  {/* Empty slots */}
                  {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="bg-white/5 border border-white/10 border-dashed rounded-xl p-4 text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-600 mx-auto mb-2 flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-sm">Waiting...</p>
                    </div>
                  ))}
                </div>

                {/* Start game button */}
                {currentRoom.players.length >= 2 && myPlayer?.id === currentRoom.players[0]?.id && (
                  <button
                    onClick={handleStartGame}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white font-bold text-xl rounded-2xl shadow-lg shadow-green-500/25 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
                  >
                    Start Golf Game!
                  </button>
                )}

                {currentRoom.players.length >= 2 && myPlayer?.id !== currentRoom.players[0]?.id && (
                  <p className="text-green-300">Waiting for {currentRoom.players[0]?.name} to start the game...</p>
                )}
              </motion.div>
            ) : (
              <>
                {/* Game HUD */}
                <GameHUDMultiplayer room={currentRoom} myPlayer={myPlayer} />
                
                {/* Golf Course */}
                <div className="mt-6">
                  <GolfCourseMultiplayer
                    room={currentRoom}
                    onHitBall={handleHitBall}
                    isMyTurn={isMyTurn()}
                    myPlayer={myPlayer}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Scoreboard Sidebar */}
        <AnimatePresence>
          {showScoreboard && currentRoom.gamePhase === 'playing' && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-96 border-l border-white/10 backdrop-blur-xl bg-white/5"
            >
              <ScoreBoardMultiplayer room={currentRoom} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};