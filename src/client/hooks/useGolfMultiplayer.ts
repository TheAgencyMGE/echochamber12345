import { useState, useEffect, useCallback, useRef } from 'react';
import { GolfRoom, Player, GolfMessage, Vector2 } from '../../shared/types/golf';

interface UseGolfMultiplayerOptions {
  onRoomUpdated?: (room: GolfRoom) => void;
  onPlayerJoined?: (player: Player) => void;
  onPlayerLeft?: (playerId: string) => void;
  onError?: (error: string) => void;
}

export const useGolfMultiplayer = (options: UseGolfMultiplayerOptions = {}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<GolfRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<GolfRoom[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) return;
    
    setIsConnecting(true);
    
    // Try different WebSocket URLs
    const wsUrls = [
      `ws://localhost:3000`,
      `ws://${window.location.hostname}:3000`,
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    ];
    
    let wsUrl = wsUrls[0]; // Start with localhost for development
    if (window.location.hostname !== 'localhost') {
      wsUrl = wsUrls[2]; // Use the full host URL for production
    }
    
    console.log('Attempting to connect to:', wsUrl);
    const ws = new WebSocket(wsUrl || 'ws://localhost:3000');

    ws.onopen = () => {
      console.log('Golf WebSocket connected');
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttemptsRef.current = 0;
      requestRoomList();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Golf WebSocket disconnected');
      setIsConnected(false);
      setIsConnecting(false);
      setSocket(null);
      
      // Only attempt to reconnect if we were previously connected
      if (reconnectAttemptsRef.current < 3 && reconnectAttemptsRef.current === 0) {
        const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          console.log(`Reconnection attempt ${reconnectAttemptsRef.current}`);
          connect();
        }, delay);
      } else if (reconnectAttemptsRef.current >= 3) {
        console.log('Max reconnection attempts reached');
        options.onError?.('Unable to connect to multiplayer server. Please try singleplayer mode.');
      }
    };

    ws.onerror = (error) => {
      console.error('Golf WebSocket error:', error);
      setIsConnecting(false);
      
      // Only show error if this is the first connection attempt
      if (reconnectAttemptsRef.current === 0) {
        options.onError?.('Multiplayer server unavailable. Try singleplayer mode or check your internet connection.');
      }
    };

    setSocket(ws);
  }, [socket, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setIsConnected(false);
    setCurrentRoom(null);
    setMyPlayerId(null);
  }, [socket]);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'room_updated':
        const room: GolfRoom = message.room;
        setCurrentRoom(room);
        
        // Set my player ID if I'm in this room
        if (!myPlayerId) {
          const myPlayer = room.players.find(p => p.name === localStorage.getItem('golf_player_name'));
          if (myPlayer) {
            setMyPlayerId(myPlayer.id);
          }
        }
        
        options.onRoomUpdated?.(room);
        break;

      case 'room_list':
        setAvailableRooms(message.rooms || []);
        break;

      case 'player_joined':
        options.onPlayerJoined?.(message.player);
        break;

      case 'player_left':
        options.onPlayerLeft?.(message.playerId);
        break;

      case 'error':
        options.onError?.(message.message);
        break;

      default:
        console.log('Unknown golf message type:', message.type);
    }
  }, [myPlayerId, options]);

  const sendMessage = useCallback((message: GolfMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  const createRoom = useCallback((roomName: string, playerName: string, isPublic = true) => {
    localStorage.setItem('golf_player_name', playerName);
    sendMessage({ type: 'create_room', roomName, playerName, isPublic });
  }, [sendMessage]);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    localStorage.setItem('golf_player_name', playerName);
    sendMessage({ type: 'join_room', roomId, playerName });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    if (currentRoom) {
      sendMessage({ type: 'leave_room', roomId: currentRoom.id });
      setCurrentRoom(null);
      setMyPlayerId(null);
    }
  }, [currentRoom, sendMessage]);

  const startGame = useCallback(() => {
    if (currentRoom) {
      sendMessage({ type: 'start_game', roomId: currentRoom.id });
    }
  }, [currentRoom, sendMessage]);

  const hitBall = useCallback((velocity: Vector2, position: Vector2) => {
    if (currentRoom && myPlayerId) {
      sendMessage({ 
        type: 'hit_ball', 
        roomId: currentRoom.id, 
        velocity,
        position 
      });
    }
  }, [currentRoom, myPlayerId, sendMessage]);

  const requestRoomList = useCallback(() => {
    sendMessage({ type: 'room_list', rooms: [] });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Auto-refresh room list
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(requestRoomList, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, requestRoomList]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const isMyTurn = useCallback(() => {
    if (!currentRoom || !myPlayerId) return false;
    const currentPlayer = currentRoom.players[currentRoom.currentPlayerIndex];
    return currentPlayer?.id === myPlayerId;
  }, [currentRoom, myPlayerId]);

  const getMyPlayer = useCallback(() => {
    if (!currentRoom || !myPlayerId) return null;
    return currentRoom.players.find(p => p.id === myPlayerId) || null;
  }, [currentRoom, myPlayerId]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connect,
    disconnect,

    // Room management
    currentRoom,
    availableRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    requestRoomList,

    // Game actions
    hitBall,
    isMyTurn,
    getMyPlayer,
    myPlayerId,

    // Raw socket for advanced usage
    socket,
  };
};