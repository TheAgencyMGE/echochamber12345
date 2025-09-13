import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Target, User, ArrowLeft } from 'lucide-react';
import { golfCourses } from '../../data/golfCourses';
import { Player, Ball, Vector2 } from '../../../shared/types/golf';

const PLAYER_COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];

interface GolfGangSingleplayerProps {
  onBackToMenu?: () => void;
}

export const GolfGangSingleplayer: React.FC<GolfGangSingleplayerProps> = ({ onBackToMenu }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [currentHole, setCurrentHole] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [ballHasBeenHit, setBallHasBeenHit] = useState(false);
  const [waitingForNextTurn, setWaitingForNextTurn] = useState(false);
  
  // Dragging state for ball control
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2>({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState<Vector2>({ x: 0, y: 0 });

  // Initialize single player
  useEffect(() => {
    const playerName = localStorage.getItem('golf_player_name') || 'Player 1';
    const player: Player = {
      id: 'player-1',
      name: playerName,
      color: PLAYER_COLORS[0] || '#ef4444',
      totalStrokes: 0,
      holeStrokes: new Array(golfCourses.length).fill(0),
      isCurrentPlayer: true,
      isOnline: true,
    };

    const ball: Ball = {
      id: 'player-1',
      position: { ...(golfCourses[0]?.startPosition || { x: 100, y: 300 }) },
      velocity: { x: 0, y: 0 },
      color: player.color,
      isMoving: false,
      isInHole: false,
    };

    setPlayers([player]);
    setBalls([ball]);
    setGamePhase('playing');
  }, []);

  const getMousePosition = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (waitingForNextTurn || ballHasBeenHit || balls[0]?.isMoving || balls[0]?.isInHole) {
      return;
    }

    const position = getMousePosition(event);
    setIsDragging(true);
    setDragStart(position);
    setDragEnd(position);
  }, [waitingForNextTurn, ballHasBeenHit, balls, getMousePosition]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const position = getMousePosition(event);
      setDragEnd(position);
    }
  }, [isDragging, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && !waitingForNextTurn && !ballHasBeenHit && balls[0] && !balls[0].isInHole) {
      const power = Math.min(
        Math.sqrt(
          Math.pow(dragEnd.x - dragStart.x, 2) + Math.pow(dragEnd.y - dragStart.y, 2)
        ) / 10,
        15
      );

      if (power > 0.5) {
        const angle = Math.atan2(dragStart.y - dragEnd.y, dragStart.x - dragEnd.x);
        const velocity = {
          x: Math.cos(angle) * power,
          y: Math.sin(angle) * power,
        };

        // Apply velocity to ball
        setBalls(prevBalls => 
          prevBalls.map(ball => ({
            ...ball,
            velocity,
            isMoving: true,
          }))
        );

        // Update player stroke count
        setPlayers(prevPlayers => 
          prevPlayers.map(player => {
            const newHoleStrokes = [...player.holeStrokes];
            newHoleStrokes[currentHole] = (newHoleStrokes[currentHole] || 0) + 1;
            return {
              ...player,
              holeStrokes: newHoleStrokes,
              totalStrokes: player.totalStrokes + 1,
            };
          })
        );

        setBallHasBeenHit(true);
      }
    }
    setIsDragging(false);
  }, [isDragging, waitingForNextTurn, ballHasBeenHit, balls, dragStart, dragEnd, currentHole]);

  // Physics simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setBalls(prevBalls => {
        let allStopped = true;
        const updatedBalls = prevBalls.map(ball => {
          if (!ball.isMoving) return ball;

          let newPos = {
            x: ball.position.x + ball.velocity.x,
            y: ball.position.y + ball.velocity.y,
          };

          // Apply friction
          let newVel = {
            x: ball.velocity.x * 0.98,
            y: ball.velocity.y * 0.98,
          };

          // Boundary collision
          const hole = golfCourses[currentHole];
          if (hole) {
            if (newPos.x <= hole.bounds.x + 8 || newPos.x >= hole.bounds.x + hole.bounds.width - 8) {
              newVel.x = -newVel.x * 0.8;
              newPos.x = Math.max(hole.bounds.x + 8, Math.min(hole.bounds.x + hole.bounds.width - 8, newPos.x));
            }
            if (newPos.y <= hole.bounds.y + 8 || newPos.y >= hole.bounds.y + hole.bounds.height - 8) {
              newVel.y = -newVel.y * 0.8;
              newPos.y = Math.max(hole.bounds.y + 8, Math.min(hole.bounds.y + hole.bounds.height - 8, newPos.y));
            }

            // Obstacle collision
            hole.obstacles.forEach(obstacle => {
              if (obstacle.type === 'wall') {
                const ballLeft = newPos.x - 8;
                const ballRight = newPos.x + 8;
                const ballTop = newPos.y - 8;
                const ballBottom = newPos.y + 8;

                const obstacleLeft = obstacle.position.x;
                const obstacleRight = obstacle.position.x + obstacle.size.x;
                const obstacleTop = obstacle.position.y;
                const obstacleBottom = obstacle.position.y + obstacle.size.y;

                if (ballRight > obstacleLeft && ballLeft < obstacleRight &&
                    ballBottom > obstacleTop && ballTop < obstacleBottom) {
                  // Simple collision response
                  const overlapX = Math.min(ballRight - obstacleLeft, obstacleRight - ballLeft);
                  const overlapY = Math.min(ballBottom - obstacleTop, obstacleBottom - ballTop);

                  if (overlapX < overlapY) {
                    newVel.x = -newVel.x * 0.8;
                    if (ball.position.x < obstacle.position.x + obstacle.size.x / 2) {
                      newPos.x = obstacleLeft - 8;
                    } else {
                      newPos.x = obstacleRight + 8;
                    }
                  } else {
                    newVel.y = -newVel.y * 0.8;
                    if (ball.position.y < obstacle.position.y + obstacle.size.y / 2) {
                      newPos.y = obstacleTop - 8;
                    } else {
                      newPos.y = obstacleBottom + 8;
                    }
                  }
                }
              }
            });

            // Check if ball is in hole
            const distanceToHole = Math.sqrt(
              Math.pow(newPos.x - hole.holePosition.x, 2) + 
              Math.pow(newPos.y - hole.holePosition.y, 2)
            );

            if (distanceToHole < 16 && !ball.isInHole) {
              return {
                ...ball,
                position: hole.holePosition,
                velocity: { x: 0, y: 0 },
                isMoving: false,
                isInHole: true,
              };
            }
          }

          // Stop if velocity is too low
          if (Math.abs(newVel.x) < 0.1 && Math.abs(newVel.y) < 0.1) {
            newVel = { x: 0, y: 0 };
            allStopped = allStopped && true;
            return {
              ...ball,
              position: newPos,
              velocity: newVel,
              isMoving: false,
            };
          } else {
            allStopped = false;
          }

          return {
            ...ball,
            position: newPos,
            velocity: newVel,
            isMoving: true,
          };
        });

        // Check if all balls stopped and advance turn
        if (allStopped && ballHasBeenHit && !waitingForNextTurn) {
          setWaitingForNextTurn(true);
          setTimeout(() => {
            const allInHole = updatedBalls.every(ball => ball.isInHole);
            
            if (allInHole) {
              // Move to next hole or finish game
              if (currentHole < golfCourses.length - 1) {
                setCurrentHole(prev => prev + 1);
                setBalls(prevBalls => prevBalls.map(ball => ({
                  ...ball,
                  position: { ...(golfCourses[currentHole + 1]?.startPosition || { x: 100, y: 300 }) },
                  velocity: { x: 0, y: 0 },
                  isMoving: false,
                  isInHole: false,
                })));
              } else {
                setGamePhase('finished');
              }
            }
            
            setBallHasBeenHit(false);
            setWaitingForNextTurn(false);
          }, 1500);
        }

        return updatedBalls;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [currentHole, ballHasBeenHit, waitingForNextTurn]);

  const handlePlayAgain = useCallback(() => {
    setCurrentHole(0);
    setCurrentPlayerIndex(0);
    setGamePhase('playing');
    setShowScoreboard(false);
    setBallHasBeenHit(false);
    setWaitingForNextTurn(false);

    // Reset player stats
    setPlayers(prevPlayers => 
      prevPlayers.map(player => ({
        ...player,
        totalStrokes: 0,
        holeStrokes: new Array(golfCourses.length).fill(0),
      }))
    );

    // Reset ball positions
    setBalls(prevBalls => 
      prevBalls.map(ball => ({
        ...ball,
        position: { ...(golfCourses[0]?.startPosition || { x: 100, y: 300 }) },
        velocity: { x: 0, y: 0 },
        isMoving: false,
        isInHole: false,
      }))
    );
  }, []);

  const currentPlayer = players[currentPlayerIndex];
  const currentHoleData = golfCourses[currentHole];
  const currentBall = balls[0];

  if (gamePhase === 'finished') {
    const winner = players[0];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex justify-center mb-8"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl">
              <Trophy className="w-16 h-16 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
            Game Complete!
          </h1>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Final Score</h3>
            <div className="text-4xl font-bold text-yellow-400 mb-2">{winner?.totalStrokes || 0}</div>
            <p className="text-green-300">Total Strokes</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handlePlayAgain}
              className="px-8 py-4 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:from-green-600 hover:via-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-3">
                <RotateCcw className="w-6 h-6" />
                <span>Play Again</span>
              </div>
            </button>
            
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-2xl border border-white/20 hover:border-white/30 transform hover:scale-105 transition-all duration-200"
              >
                <div className="flex items-center justify-center space-x-3">
                  <ArrowLeft className="w-6 h-6" />
                  <span>Main Menu</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentHoleData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
          {/* Main Game Area */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            {/* Game HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Hole {currentHoleData.id}</h3>
                    <p className="text-green-300">Par {currentHoleData.par}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Your Score</h3>
                    <p className="text-green-300">{currentPlayer?.holeStrokes[currentHole] || 0} strokes</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Total</h3>
                    <p className="text-green-300">{currentPlayer?.totalStrokes || 0} strokes</p>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Golf Course */}
            <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  Hole {currentHoleData.id}: {currentHoleData.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-green-300">
                  <span>Par {currentHoleData.par}</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl" style={{ backgroundColor: '#1a7f3b' }}>
                <svg
                  ref={svgRef}
                  width="800"
                  height="600"
                  viewBox="0 0 800 600"
                  className="w-full h-auto cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Golf course background */}
                  <rect width="800" height="600" fill="#228B22" />
                  
                  {/* Course bounds */}
                  <rect
                    x={currentHoleData.bounds.x}
                    y={currentHoleData.bounds.y}
                    width={currentHoleData.bounds.width}
                    height={currentHoleData.bounds.height}
                    fill="#32CD32"
                    stroke="#228B22"
                    strokeWidth="3"
                  />

                  {/* Obstacles */}
                  {currentHoleData.obstacles.map(obstacle => {
                    if (obstacle.type === 'wall') {
                      return (
                        <rect
                          key={obstacle.id}
                          x={obstacle.position.x}
                          y={obstacle.position.y}
                          width={obstacle.size.x}
                          height={obstacle.size.y}
                          fill="#8B4513"
                          stroke="#654321"
                          strokeWidth="2"
                        />
                      );
                    }
                    return null;
                  })}

                  {/* Starting tee */}
                  <circle
                    cx={currentHoleData.startPosition.x}
                    cy={currentHoleData.startPosition.y}
                    r="12"
                    fill="#8B4513"
                    stroke="#654321"
                    strokeWidth="2"
                  />

                  {/* Hole */}
                  <circle
                    cx={currentHoleData.holePosition.x}
                    cy={currentHoleData.holePosition.y}
                    r="16"
                    fill="#000"
                    stroke="#333"
                    strokeWidth="2"
                  />
                  
                  {/* Flag */}
                  <g>
                    <line
                      x1={currentHoleData.holePosition.x}
                      y1={currentHoleData.holePosition.y - 16}
                      x2={currentHoleData.holePosition.x}
                      y2={currentHoleData.holePosition.y - 50}
                      stroke="#FFD700"
                      strokeWidth="3"
                    />
                    <polygon
                      points={`${currentHoleData.holePosition.x},${currentHoleData.holePosition.y - 50} ${currentHoleData.holePosition.x + 20},${currentHoleData.holePosition.y - 40} ${currentHoleData.holePosition.x},${currentHoleData.holePosition.y - 30}`}
                      fill="#FF4500"
                      stroke="#FF6347"
                      strokeWidth="1"
                    />
                  </g>

                  {/* Drag line */}
                  {isDragging && currentBall && (
                    <line
                      x1={currentBall.position.x}
                      y1={currentBall.position.y}
                      x2={dragEnd.x}
                      y2={dragEnd.y}
                      stroke="#FF4500"
                      strokeWidth="3"
                      opacity="0.8"
                    />
                  )}

                  {/* Ball */}
                  {currentBall && (
                    <g>
                      <circle
                        cx={currentBall.position.x}
                        cy={currentBall.position.y}
                        r="8"
                        fill={currentBall.color}
                        stroke="#FFF"
                        strokeWidth="2"
                        opacity={currentBall.isInHole ? 0.3 : 1}
                      />

                      {/* Movement indicator */}
                      {currentBall.isMoving && (
                        <motion.circle
                          cx={currentBall.position.x}
                          cy={currentBall.position.y}
                          r="12"
                          fill="none"
                          stroke={currentBall.color}
                          strokeWidth="2"
                          opacity="0.5"
                          animate={{ r: [8, 16, 8] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                    </g>
                  )}

                  {/* Power indicator */}
                  {isDragging && currentBall && (
                    <g>
                      <rect
                        x={currentBall.position.x - 30}
                        y={currentBall.position.y - 45}
                        width="60"
                        height="8"
                        fill="#333"
                        stroke="#FFF"
                        strokeWidth="1"
                        rx="4"
                      />
                      <rect
                        x={currentBall.position.x - 28}
                        y={currentBall.position.y - 43}
                        width={Math.min(56, Math.sqrt(Math.pow(dragEnd.x - dragStart.x, 2) + Math.pow(dragEnd.y - dragStart.y, 2)) / 10 * 3.73)}
                        height="4"
                        fill={Math.sqrt(Math.pow(dragEnd.x - dragStart.x, 2) + Math.pow(dragEnd.y - dragStart.y, 2)) / 10 < 5 ? '#22c55e' : 
                             Math.sqrt(Math.pow(dragEnd.x - dragStart.x, 2) + Math.pow(dragEnd.y - dragStart.y, 2)) / 10 < 10 ? '#eab308' : '#ef4444'}
                        rx="2"
                      />
                    </g>
                  )}
                </svg>
              </div>

              {/* Instructions */}
              <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-green-300 text-sm text-center">
                  {!waitingForNextTurn && !ballHasBeenHit
                    ? <><strong>Your turn!</strong> Drag from your ball to aim and set power, then release to putt!</>
                    : `Ball is moving... wait for it to stop.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Menu</span>
              </button>
            )}

            <button
              onClick={() => setShowScoreboard(!showScoreboard)}
              className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all duration-200"
            >
              {showScoreboard ? 'Hide Progress' : 'Show Progress'}
            </button>

            <AnimatePresence>
              {showScoreboard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300">Holes Completed:</span>
                      <span className="text-white font-semibold">
                        {currentHole} / {golfCourses.length}
                      </span>
                    </div>
                    
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(currentHole / golfCourses.length) * 100}%` }}
                      />
                    </div>
                    
                    <div className="text-sm text-green-300 text-center">
                      Playing: {currentHoleData.name}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};