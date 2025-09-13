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

export interface GameState {
  currentHole: number;
  players: Player[];
  currentPlayerIndex: number;
  balls: Ball[];
  holes: Hole[];
  gamePhase: 'setup' | 'playing' | 'finished';
  isGameStarted: boolean;
  winner: Player | null;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  velocity: Vector2;
}