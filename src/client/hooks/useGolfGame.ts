import { useState, useCallback, useRef, useEffect } from 'react';
import { Ball, Player, GameState, Vector2, TrajectoryPoint } from '../types/golf';
import { golfCourses } from '../data/golfCourses';

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];
const FRICTION = 0.98;
const MIN_VELOCITY = 0.1;
const BALL_RADIUS = 8;
const HOLE_RADIUS = 16;

export const useGolfGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentHole: 0,
    players: [],
    currentPlayerIndex: 0,
    balls: [],
    holes: golfCourses,
    gamePhase: 'setup',
    isGameStarted: false,
    winner: null,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2>({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState<Vector2>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | undefined>(undefined);

  const initializeGame = useCallback((playerNames: string[]) => {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length] || '#ef4444',
      totalStrokes: 0,
      holeStrokes: new Array(golfCourses.length).fill(0),
      isCurrentPlayer: index === 0,
    }));

    const balls: Ball[] = players.map((player) => ({
      id: player.id,
      position: { ...golfCourses[0]?.startPosition || { x: 100, y: 300 } },
      velocity: { x: 0, y: 0 },
      color: player.color,
      isMoving: false,
      isInHole: false,
    }));

    setGameState({
      currentHole: 0,
      players,
      currentPlayerIndex: 0,
      balls,
      holes: golfCourses,
      gamePhase: 'playing',
      isGameStarted: true,
      winner: null,
    });
  }, []);

  const resetBallPosition = useCallback((ballId: string) => {
    setGameState((prev) => ({
      ...prev,
      balls: prev.balls.map((ball) =>
        ball.id === ballId
          ? {
              ...ball,
              position: { ...prev.holes[prev.currentHole]?.startPosition || { x: 100, y: 300 } },
              velocity: { x: 0, y: 0 },
              isMoving: false,
              isInHole: false,
            }
          : ball
      ),
    }));
  }, []);

  const checkCollisions = useCallback((ball: Ball, obstacles: any[]): Vector2 => {
    let newVelocity = { ...ball.velocity };

    obstacles.forEach((obstacle) => {
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
            newVelocity.x = -newVelocity.x * 0.7;
          } else {
            newVelocity.y = -newVelocity.y * 0.7;
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
          // Ball hit water, reset position and add penalty
          // resetBallPosition(ball.id);
          setGameState((prev) => ({
            ...prev,
            players: prev.players.map((player) =>
              player.id === ball.id
                ? {
                    ...player,
                    holeStrokes: [
                      ...player.holeStrokes.slice(0, prev.currentHole),
                      (player.holeStrokes[prev.currentHole] || 0) + 1,
                      ...player.holeStrokes.slice(prev.currentHole + 1),
                    ],
                    totalStrokes: player.totalStrokes + 1,
                  }
                : player
            ),
          }));
          return { x: 0, y: 0 };
        }
      }
    });

    return newVelocity;
  }, [resetBallPosition]);

  const updatePhysics = useCallback(() => {
    setGameState((prev) => {
      const newBalls = prev.balls.map((ball) => {
        if (!ball.isMoving || ball.isInHole) return ball;

        let newPosition = {
          x: ball.position.x + ball.velocity.x,
          y: ball.position.y + ball.velocity.y,
        };

        let newVelocity = {
          x: ball.velocity.x * FRICTION,
          y: ball.velocity.y * FRICTION,
        };

        const currentHole = prev.holes[prev.currentHole];
        if (!currentHole) return ball;
        newVelocity = checkCollisions({ ...ball, position: newPosition, velocity: newVelocity }, currentHole.obstacles);

        newPosition = {
          x: ball.position.x + newVelocity.x,
          y: ball.position.y + newVelocity.y,
        };

        // Check boundaries
        const bounds = currentHole.bounds;
        if (newPosition.x - BALL_RADIUS < bounds.x || newPosition.x + BALL_RADIUS > bounds.x + bounds.width) {
          newVelocity.x = -newVelocity.x * 0.7;
          newPosition.x = Math.max(bounds.x + BALL_RADIUS, Math.min(bounds.x + bounds.width - BALL_RADIUS, newPosition.x));
        }
        if (newPosition.y - BALL_RADIUS < bounds.y || newPosition.y + BALL_RADIUS > bounds.y + bounds.height) {
          newVelocity.y = -newVelocity.y * 0.7;
          newPosition.y = Math.max(bounds.y + BALL_RADIUS, Math.min(bounds.y + bounds.height - BALL_RADIUS, newPosition.y));
        }

        // Check if ball is in hole
        const distanceToHole = Math.sqrt(
          Math.pow(newPosition.x - currentHole.holePosition.x, 2) +
          Math.pow(newPosition.y - currentHole.holePosition.y, 2)
        );

        if (distanceToHole <= HOLE_RADIUS && Math.abs(newVelocity.x) < 3 && Math.abs(newVelocity.y) < 3) {
          return {
            ...ball,
            position: { ...currentHole.holePosition },
            velocity: { x: 0, y: 0 },
            isMoving: false,
            isInHole: true,
          };
        }

        // Stop ball if velocity is too low
        if (Math.abs(newVelocity.x) < MIN_VELOCITY && Math.abs(newVelocity.y) < MIN_VELOCITY) {
          return {
            ...ball,
            position: newPosition,
            velocity: { x: 0, y: 0 },
            isMoving: false,
          };
        }

        return {
          ...ball,
          position: newPosition,
          velocity: newVelocity,
        };
      });

      return {
        ...prev,
        balls: newBalls,
      };
    });
  }, [checkCollisions]);

  const startDrag = useCallback((position: Vector2) => {
    const currentBall = gameState.balls[gameState.currentPlayerIndex];
    if (currentBall && !currentBall.isMoving && !currentBall.isInHole) {
      setIsDragging(true);
      setDragStart(position);
      setDragEnd(position);
    }
  }, [gameState.balls, gameState.currentPlayerIndex]);

  const updateDrag = useCallback((position: Vector2) => {
    if (isDragging) {
      setDragEnd(position);
    }
  }, [isDragging]);

  const endDrag = useCallback(() => {
    if (isDragging && gameState.gamePhase === 'playing') {
      const currentBall = gameState.balls[gameState.currentPlayerIndex];
      if (currentBall && !currentBall.isInHole) {
        const power = Math.min(
          Math.sqrt(
            Math.pow(dragEnd.x - dragStart.x, 2) + Math.pow(dragEnd.y - dragStart.y, 2)
          ) / 10,
          15
        );

        const angle = Math.atan2(dragStart.y - dragEnd.y, dragStart.x - dragEnd.x);
        const velocity = {
          x: Math.cos(angle) * power,
          y: Math.sin(angle) * power,
        };

        setGameState((prev) => ({
          ...prev,
          balls: prev.balls.map((ball) =>
            ball.id === currentBall.id
              ? { ...ball, velocity, isMoving: true }
              : ball
          ),
          players: prev.players.map((player, index) =>
            index === prev.currentPlayerIndex
              ? {
                  ...player,
                  holeStrokes: [
                    ...player.holeStrokes.slice(0, prev.currentHole),
                    (player.holeStrokes[prev.currentHole] || 0) + 1,
                    ...player.holeStrokes.slice(prev.currentHole + 1),
                  ],
                  totalStrokes: player.totalStrokes + 1,
                }
              : player
          ),
        }));
        
        setBallHasBeenHit(true);
      }
    }
    setIsDragging(false);
  }, [isDragging, gameState.gamePhase, gameState.balls, gameState.currentPlayerIndex, dragStart, dragEnd]);

  const nextTurn = useCallback(() => {
    setGameState((prev) => {
      const allBallsStopped = prev.balls.every((ball) => !ball.isMoving);
      if (!allBallsStopped) return prev;

      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      const allPlayersFinished = prev.balls.every((ball) => ball.isInHole);

      if (allPlayersFinished) {
        // Check if this was the last hole
        if (prev.currentHole === prev.holes.length - 1) {
          // Game finished, determine winner
          const winner = prev.players.reduce((best, current) =>
            current.totalStrokes < best.totalStrokes ? current : best
          );
          return {
            ...prev,
            gamePhase: 'finished',
            winner,
          };
        } else {
          // Move to next hole
          const nextHole = prev.currentHole + 1;
          const nextHoleData = prev.holes[nextHole];
          if (!nextHoleData) return prev;
          
          return {
            ...prev,
            currentHole: nextHole,
            currentPlayerIndex: 0,
            balls: prev.balls.map((ball) => ({
              ...ball,
              position: { ...nextHoleData.startPosition },
              velocity: { x: 0, y: 0 },
              isMoving: false,
              isInHole: false,
            })),
            players: prev.players.map((player, index) => ({
              ...player,
              isCurrentPlayer: index === 0,
            })),
          };
        }
      }

      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        players: prev.players.map((player, index) => ({
          ...player,
          isCurrentPlayer: index === nextPlayerIndex,
        })),
      };
    });
  }, []);

  const calculateTrajectory = useCallback((startPos: Vector2, endPos: Vector2): TrajectoryPoint[] => {
    const points: TrajectoryPoint[] = [];
    const power = Math.min(
      Math.sqrt(Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)) / 10,
      15
    );

    if (power < 0.5) return points;

    const angle = Math.atan2(startPos.y - endPos.y, startPos.x - endPos.x);
    let velocity = {
      x: Math.cos(angle) * power,
      y: Math.sin(angle) * power,
    };

    let position = { ...startPos };
    const currentHole = gameState.holes[gameState.currentHole];
    if (!currentHole) return points;

    for (let i = 0; i < 50; i++) {
      position = {
        x: position.x + velocity.x,
        y: position.y + velocity.y,
      };

      velocity = {
        x: velocity.x * FRICTION,
        y: velocity.y * FRICTION,
      };

      // Check boundaries
      const bounds = currentHole.bounds;
      if (position.x - BALL_RADIUS < bounds.x || position.x + BALL_RADIUS > bounds.x + bounds.width) {
        velocity.x = -velocity.x * 0.7;
        position.x = Math.max(bounds.x + BALL_RADIUS, Math.min(bounds.x + bounds.width - BALL_RADIUS, position.x));
      }
      if (position.y - BALL_RADIUS < bounds.y || position.y + BALL_RADIUS > bounds.y + bounds.height) {
        velocity.y = -velocity.y * 0.7;
        position.y = Math.max(bounds.y + BALL_RADIUS, Math.min(bounds.y + bounds.height - BALL_RADIUS, position.y));
      }

      points.push({ x: position.x, y: position.y, velocity: { ...velocity } });

      if (Math.abs(velocity.x) < MIN_VELOCITY && Math.abs(velocity.y) < MIN_VELOCITY) {
        break;
      }
    }

    return points;
  }, [gameState.holes, gameState.currentHole]);

  useEffect(() => {
    const animate = () => {
      updatePhysics();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (gameState.isGameStarted && gameState.gamePhase === 'playing') {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isGameStarted, gameState.gamePhase, updatePhysics]);

  const [waitingForNextTurn, setWaitingForNextTurn] = useState(false);
  const [ballHasBeenHit, setBallHasBeenHit] = useState(false);

  useEffect(() => {
    // Check if any ball is moving
    const anyBallMoving = gameState.balls.some((ball) => ball.isMoving);
    
    if (!anyBallMoving && ballHasBeenHit && !waitingForNextTurn) {
      setWaitingForNextTurn(true);
      setBallHasBeenHit(false);
      
      // Wait a moment, then advance to next turn
      setTimeout(() => {
        const currentBall = gameState.balls[gameState.currentPlayerIndex];
        const allPlayersFinished = gameState.balls.every((ball) => ball.isInHole);
        
        if (allPlayersFinished || (currentBall && currentBall.isInHole)) {
          nextTurn();
        } else {
          nextTurn();
        }
        setWaitingForNextTurn(false);
      }, 1500);
    }
  }, [gameState.balls, gameState.currentPlayerIndex, gameState.gamePhase, ballHasBeenHit, waitingForNextTurn, nextTurn]);

  return {
    gameState,
    isDragging,
    dragStart,
    dragEnd,
    initializeGame,
    startDrag,
    updateDrag,
    endDrag,
    nextTurn,
    calculateTrajectory,
    resetBallPosition,
  };
};