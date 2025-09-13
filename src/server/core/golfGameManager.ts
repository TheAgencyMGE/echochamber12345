import { GolfRoom, Player, Ball } from '../../shared/types/golf';
import { golfCourses } from '../../shared/data/golfCourses';

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];
const FRICTION = 0.98;
const MIN_VELOCITY = 0.1;
const BALL_RADIUS = 8;
const HOLE_RADIUS = 16;

export class GolfGameManager {
  private static instance: GolfGameManager;
  private rooms: Map<string, GolfRoom> = new Map();
  private playerRooms: Map<string, string> = new Map(); // playerId -> roomId

  static getInstance(): GolfGameManager {
    if (!GolfGameManager.instance) {
      GolfGameManager.instance = new GolfGameManager();
    }
    return GolfGameManager.instance;
  }

  createRoom(roomName: string, playerName: string, isPublic = true): string {
    const roomId = this.generateRoomId();
    const playerId = this.generatePlayerId();
    
    const player: Player = {
      id: playerId,
      name: playerName,
      color: PLAYER_COLORS[0] || '#ef4444',
      totalStrokes: 0,
      holeStrokes: new Array(golfCourses.length).fill(0),
      isCurrentPlayer: true,
      isOnline: true,
    };

    const ball: Ball = {
      id: playerId,
      position: { ...(golfCourses[0]?.startPosition || { x: 100, y: 300 }) },
      velocity: { x: 0, y: 0 },
      color: player.color,
      isMoving: false,
      isInHole: false,
    };

    const room: GolfRoom = {
      id: roomId,
      name: roomName,
      players: [player],
      currentHole: 0,
      currentPlayerIndex: 0,
      balls: [ball],
      gamePhase: 'waiting',
      maxPlayers: 4,
      isPublic,
      createdAt: Date.now(),
      winner: null,
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(playerId, roomId);
    
    return roomId;
  }

  joinRoom(roomId: string, playerName: string): Player | null {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) {
      return null;
    }

    const playerId = this.generatePlayerId();
    const colorIndex = room.players.length % PLAYER_COLORS.length;
    
    const player: Player = {
      id: playerId,
      name: playerName,
      color: PLAYER_COLORS[colorIndex] || '#ef4444',
      totalStrokes: 0,
      holeStrokes: new Array(golfCourses.length).fill(0),
      isCurrentPlayer: false,
      isOnline: true,
    };

    const ball: Ball = {
      id: playerId,
      position: { ...(golfCourses[room.currentHole]?.startPosition || { x: 100, y: 300 }) },
      velocity: { x: 0, y: 0 },
      color: player.color,
      isMoving: false,
      isInHole: false,
    };

    room.players.push(player);
    room.balls.push(ball);
    this.playerRooms.set(playerId, roomId);

    return player;
  }

  leaveRoom(playerId: string): string | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Remove player and their ball
    room.players = room.players.filter(p => p.id !== playerId);
    room.balls = room.balls.filter(b => b.id !== playerId);
    this.playerRooms.delete(playerId);

    // If current player left, advance to next player
    if (room.currentPlayerIndex >= room.players.length && room.players.length > 0) {
      room.currentPlayerIndex = 0;
      this.updateCurrentPlayer(room);
    }

    // Clean up empty room
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    }

    return roomId;
  }

  startGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length < 2) return false;

    room.gamePhase = 'playing';
    room.currentPlayerIndex = 0;
    this.updateCurrentPlayer(room);
    
    return true;
  }

  hitBall(roomId: string, playerId: string, velocity: { x: number; y: number }): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gamePhase !== 'playing') return false;

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) return false;

    const ball = room.balls.find(b => b.id === playerId);
    if (!ball || ball.isMoving || ball.isInHole) return false;

    // Apply the velocity to the ball
    ball.velocity = velocity;
    ball.isMoving = true;

    // Update player stats
    if (currentPlayer && room.currentHole !== undefined && currentPlayer.holeStrokes) {
      const holeIndex = room.currentHole;
      currentPlayer.holeStrokes[holeIndex] = (currentPlayer.holeStrokes[holeIndex] || 0) + 1;
      currentPlayer.totalStrokes++;
    }

    return true;
  }

  updatePhysics(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gamePhase !== 'playing') return false;

    const currentHole = golfCourses[room.currentHole];
    if (!currentHole) return false;

    let anyBallMoving = false;

    room.balls.forEach(ball => {
      if (!ball.isMoving || ball.isInHole) return;

      // Update position
      ball.position.x += ball.velocity.x;
      ball.position.y += ball.velocity.y;

      // Apply friction
      ball.velocity.x *= FRICTION;
      ball.velocity.y *= FRICTION;

      // Check boundaries
      const bounds = currentHole.bounds;
      if (ball.position.x - BALL_RADIUS < bounds.x || ball.position.x + BALL_RADIUS > bounds.x + bounds.width) {
        ball.velocity.x = -ball.velocity.x * 0.7;
        ball.position.x = Math.max(bounds.x + BALL_RADIUS, Math.min(bounds.x + bounds.width - BALL_RADIUS, ball.position.x));
      }
      if (ball.position.y - BALL_RADIUS < bounds.y || ball.position.y + BALL_RADIUS > bounds.y + bounds.height) {
        ball.velocity.y = -ball.velocity.y * 0.7;
        ball.position.y = Math.max(bounds.y + BALL_RADIUS, Math.min(bounds.y + bounds.height - BALL_RADIUS, ball.position.y));
      }

      // Check obstacles
      this.checkCollisions(ball, currentHole.obstacles, room);

      // Check if ball is in hole
      const distanceToHole = Math.sqrt(
        Math.pow(ball.position.x - currentHole.holePosition.x, 2) +
        Math.pow(ball.position.y - currentHole.holePosition.y, 2)
      );

      if (distanceToHole <= HOLE_RADIUS && Math.abs(ball.velocity.x) < 3 && Math.abs(ball.velocity.y) < 3) {
        ball.position = { ...currentHole.holePosition };
        ball.velocity = { x: 0, y: 0 };
        ball.isMoving = false;
        ball.isInHole = true;
      }

      // Stop ball if velocity is too low
      if (Math.abs(ball.velocity.x) < MIN_VELOCITY && Math.abs(ball.velocity.y) < MIN_VELOCITY) {
        ball.velocity = { x: 0, y: 0 };
        ball.isMoving = false;
      } else {
        anyBallMoving = true;
      }
    });

    // Check for turn/hole completion
    if (!anyBallMoving) {
      this.checkTurnCompletion(room);
    }

    return anyBallMoving;
  }

  private checkCollisions(ball: Ball, obstacles: any[], room: GolfRoom) {
    obstacles.forEach(obstacle => {
      if (obstacle.type === 'wall') {
        const ballLeft = ball.position.x - BALL_RADIUS;
        const ballRight = ball.position.x + BALL_RADIUS;
        const ballTop = ball.position.y - BALL_RADIUS;
        const ballBottom = ball.position.y + BALL_RADIUS;

        const obstacleLeft = obstacle.position.x;
        const obstacleRight = obstacle.position.x + obstacle.size.x;
        const obstacleTop = obstacle.position.y;
        const obstacleBottom = obstacle.position.y + obstacle.size.y;

        if (
          ballRight > obstacleLeft &&
          ballLeft < obstacleRight &&
          ballBottom > obstacleTop &&
          ballTop < obstacleBottom
        ) {
          const overlapLeft = ballRight - obstacleLeft;
          const overlapRight = obstacleRight - ballLeft;
          const overlapTop = ballBottom - obstacleTop;
          const overlapBottom = obstacleBottom - ballTop;

          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          if (minOverlap === overlapLeft || minOverlap === overlapRight) {
            ball.velocity.x = -ball.velocity.x * 0.7;
          } else {
            ball.velocity.y = -ball.velocity.y * 0.7;
          }
        }
      } else if (obstacle.type === 'water') {
        const ballLeft = ball.position.x - BALL_RADIUS;
        const ballRight = ball.position.x + BALL_RADIUS;
        const ballTop = ball.position.y - BALL_RADIUS;
        const ballBottom = ball.position.y + BALL_RADIUS;

        const waterLeft = obstacle.position.x;
        const waterRight = obstacle.position.x + obstacle.size.x;
        const waterTop = obstacle.position.y;
        const waterBottom = obstacle.position.y + obstacle.size.y;

        if (
          ballRight > waterLeft &&
          ballLeft < waterRight &&
          ballBottom > waterTop &&
          ballTop < waterBottom
        ) {
          // Reset ball position and add penalty
          const currentHole = golfCourses[room.currentHole];
          if (currentHole) {
            ball.position = { ...currentHole.startPosition };
            ball.velocity = { x: 0, y: 0 };
            ball.isMoving = false;
            ball.isInHole = false;

            // Add penalty stroke
            const player = room.players.find(p => p.id === ball.id);
            if (player && room.currentHole !== undefined && player.holeStrokes) {
              const holeIndex = room.currentHole;
              player.holeStrokes[holeIndex] = (player.holeStrokes[holeIndex] || 0) + 1;
              player.totalStrokes++;
            }
          }
        }
      }
    });
  }

  private checkTurnCompletion(room: GolfRoom) {
    const allPlayersFinished = room.balls.every(ball => ball.isInHole);
    
    if (allPlayersFinished) {
      // All players finished the hole
      if (room.currentHole === golfCourses.length - 1) {
        // Game finished
        room.gamePhase = 'finished';
        room.winner = room.players.reduce((best, current) =>
          current.totalStrokes < best.totalStrokes ? current : best
        );
      } else {
        // Move to next hole
        this.nextHole(room);
      }
    } else {
      // Move to next player
      this.nextTurn(room);
    }
  }

  private nextTurn(room: GolfRoom) {
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    this.updateCurrentPlayer(room);
  }

  private nextHole(room: GolfRoom) {
    room.currentHole++;
    room.currentPlayerIndex = 0;
    
    const newHole = golfCourses[room.currentHole];
    if (newHole) {
      // Reset all balls for the new hole
      room.balls.forEach(ball => {
        ball.position = { ...newHole.startPosition };
        ball.velocity = { x: 0, y: 0 };
        ball.isMoving = false;
        ball.isInHole = false;
      });
    }
    
    this.updateCurrentPlayer(room);
  }

  private updateCurrentPlayer(room: GolfRoom) {
    room.players.forEach((player, index) => {
      player.isCurrentPlayer = index === room.currentPlayerIndex;
    });
  }

  getRoom(roomId: string): GolfRoom | null {
    return this.rooms.get(roomId) || null;
  }

  getPublicRooms(): GolfRoom[] {
    return Array.from(this.rooms.values()).filter(room => room.isPublic);
  }

  getPlayerRoom(playerId: string): string | null {
    return this.playerRooms.get(playerId) || null;
  }

  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}