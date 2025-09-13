import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Play, RefreshCw, Globe, Lock, Crown } from 'lucide-react';
import { GolfRoom } from '../../../shared/types/golf';

interface MultiplayerLobbyProps {
  availableRooms: GolfRoom[];
  isConnected: boolean;
  isConnecting: boolean;
  onCreateRoom: (roomName: string, playerName: string, isPublic: boolean) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onRefresh: () => void;
  onBackToMenu?: (() => void) | undefined;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  availableRooms,
  isConnected,
  isConnecting,
  onCreateRoom,
  onJoinRoom,
  onRefresh,
  onBackToMenu,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [playerName, setPlayerName] = useState(localStorage.getItem('golf_player_name') || '');
  const [roomName, setRoomName] = useState('');
  const [isPublicRoom, setIsPublicRoom] = useState(true);

  const handleCreateRoom = () => {
    if (playerName.trim() && roomName.trim()) {
      onCreateRoom(roomName.trim(), playerName.trim(), isPublicRoom);
      setRoomName('');
      setShowCreateForm(false);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (playerName.trim()) {
      onJoinRoom(roomId, playerName.trim());
    }
  };

  const formatPlayersText = (current: number, max: number) => {
    return `${current}/${max} players`;
  };

  const getGamePhaseDisplay = (phase: GolfRoom['gamePhase']) => {
    switch (phase) {
      case 'waiting': return { text: 'Waiting for players', color: 'text-blue-400' };
      case 'playing': return { text: 'Game in progress', color: 'text-green-400' };
      case 'finished': return { text: 'Game finished', color: 'text-purple-400' };
      default: return { text: 'Unknown', color: 'text-gray-400' };
    }
  };

  if (!isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Connection Lost</div>
          <p className="text-green-300 mb-6">Unable to connect to Golf Gang servers</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-white text-xl mb-4">Connecting to Golf Gang...</div>
          <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900">
      {/* Animated background */}
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

      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8 relative">
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="absolute left-0 top-0 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all duration-200"
            >
              ← Back
            </button>
          )}
          <motion.h1
            className="text-6xl font-bold bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Golf Gang Multiplayer
          </motion.h1>
          <p className="text-xl text-green-300">Join players from around the world!</p>
        </div>

        {/* Player Name Input */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">Player Setup</h3>
          <div className="max-w-md mx-auto">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength={20}
            />
          </div>
        </motion.div>

        {/* Create Room Section */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Create New Room</h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create Room</span>
            </button>
          </div>

          {showCreateForm && (
            <motion.div
              className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                maxLength={30}
              />
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublicRoom}
                    onChange={(e) => setIsPublicRoom(e.target.checked)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-green-200">Public Room</span>
                  <Globe className="w-4 h-4 text-green-400" />
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCreateRoom}
                  disabled={!playerName.trim() || !roomName.trim()}
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200"
                >
                  Create Room
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Available Rooms */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Available Rooms</h3>
            <button
              onClick={onRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRooms.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">No rooms available</h4>
                <p className="text-green-300">Create a room to start playing!</p>
              </div>
            ) : (
              availableRooms.map((room, index) => {
                const phaseInfo = getGamePhaseDisplay(room.gamePhase);
                const canJoin = room.players.length < room.maxPlayers && room.gamePhase === 'waiting' && playerName.trim();

                return (
                  <motion.div
                    key={room.id}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-white mb-1">{room.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-green-300">
                          {room.isPublic ? (
                            <Globe className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                          <span>{formatPlayersText(room.players.length, room.maxPlayers)}</span>
                        </div>
                      </div>
                      
                      <div className={`text-sm ${phaseInfo.color}`}>
                        {phaseInfo.text}
                      </div>
                    </div>

                    {/* Players list */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {room.players.map((player, idx) => (
                          <div
                            key={player.id}
                            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/10 text-xs"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: player.color }}
                            />
                            <span className="text-white">{player.name}</span>
                            {idx === 0 && <Crown className="w-3 h-3 text-yellow-400" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={!canJoin}
                      className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        canJoin
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 cursor-not-allowed text-gray-300'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      <span>
                        {!playerName.trim() 
                          ? 'Enter name to join' 
                          : room.gamePhase === 'playing' 
                            ? 'Game in progress' 
                            : room.players.length >= room.maxPlayers
                              ? 'Room full'
                              : 'Join Room'}
                      </span>
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};