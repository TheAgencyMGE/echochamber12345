export interface Vector2 {
  x: number;
  y: number;
}

export interface Ball {
  id: string;
  position: Vector2;
  velocity: Vector2;
  color: string;
  isMoving: boolean;
  isInHole: boolean;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  totalStrokes: number;
  holeStrokes: number[];
  isCurrentPlayer: boolean;
  isOnline: boolean;
}

export interface Obstacle {
  id: string;
  type: 'wall' | 'water' | 'windmill' | 'ramp';
  position: Vector2;
  size: Vector2;
  rotation?: number;
  properties?: Record<string, any>;
}

export interface Hole {
  id: number;
  name: string;
  par: number;
  startPosition: Vector2;
  holePosition: Vector2;
  obstacles: Obstacle[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface GolfRoom {
  id: string;
  name: string;
  players: Player[];
  currentHole: number;
  currentPlayerIndex: number;
  balls: Ball[];
  gamePhase: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  isPublic: boolean;
  createdAt: number;
  winner: Player | null;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  velocity: Vector2;
}

// WebSocket message types
export type GolfMessage = 
  | { type: 'join_room'; roomId: string; playerName: string }
  | { type: 'create_room'; roomName: string; playerName: string; isPublic?: boolean }
  | { type: 'leave_room'; roomId: string }
  | { type: 'start_game'; roomId: string }
  | { type: 'hit_ball'; roomId: string; velocity: Vector2; position: Vector2 }
  | { type: 'ball_update'; roomId: string; balls: Ball[] }
  | { type: 'next_turn'; roomId: string }
  | { type: 'next_hole'; roomId: string }
  | { type: 'game_over'; roomId: string; winner: Player }
  | { type: 'room_updated'; room: GolfRoom }
  | { type: 'room_list'; rooms: GolfRoom[] }
  | { type: 'error'; message: string }
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; playerId: string };