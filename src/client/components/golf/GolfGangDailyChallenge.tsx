import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Target, Calendar, Users, Clock, Shuffle } from 'lucide-react';
import { Ball, Vector2, Hole } from '../../../shared/types/golf';

interface GolfScore {
  id: string;
  userId: string;
  username: string;
  strokes: number;
  timestamp: number;
  completedAt: number;
  rank: number;
  regenCount: number;
}

interface DailyGolfChallenge {
  id: string;
  date: string;
  courseData: string;
  par: number;
}

interface GolfGangDailyChallengeProps {
  onBackToMenu?: () => void;
  regensUsed?: number;
  onRegenerate?: () => void;
  onScoreSubmitted?: (strokes: number, rank: number) => void;
}

export const GolfGangDailyChallenge: React.FC<GolfGangDailyChallengeProps> = ({
  onBackToMenu,
  regensUsed = 0,
  onRegenerate,
  onScoreSubmitted
}) => {
  const [, setDailyChallenge] = useState<DailyGolfChallenge | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Hole | null>(null);
  const [ball, setBall] = useState<Ball | null>(null);
  const [strokes, setStrokes] = useState(0);
  const [gamePhase, setGamePhase] = useState<'loading' | 'playing' | 'completed' | 'failed'>('loading');
  const [leaderboard, setLeaderboard] = useState<GolfScore[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [ballHasBeenHit, setBallHasBeenHit] = useState(false);
  const [waitingForBallStop, setWaitingForBallStop] = useState(false);

  // Dragging state for ball control
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2>({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState<Vector2>({ x: 0, y: 0 });

  const MAX_REGENS = 5;
  const MAX_STROKES = 20; // Fail after 20 strokes to prevent infinite games

  // Load daily challenge
  useEffect(() => {
    loadDailyChallenge();
  }, []);

  const loadDailyChallenge = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/golf/daily-challenge');
      if (response.ok) {
        const challenge = await response.json();
        setDailyChallenge(challenge);

        // Parse course data
        const courseData = JSON.parse(challenge.courseData);
        setCurrentCourse(courseData);

        // Initialize ball
        const initialBall: Ball = {
          id: 'daily-challenge',
          position: { ...courseData.startPosition },
          velocity: { x: 0, y: 0 },
          color: '#ef4444',
          isMoving: false,
          isInHole: false,
        };
        setBall(initialBall);
        setGamePhase('playing');

        // Load leaderboard
        loadLeaderboard();
      } else {
        // Fallback to generated course if API fails
        generateDailyCourse();
      }
    } catch (error) {
      console.error('Failed to load daily challenge:', error);
      generateDailyCourse();
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/golf/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard.daily || []);
      } else {
        // API not available, use empty leaderboard
        setLeaderboard([]);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // API not available, use empty leaderboard
      setLeaderboard([]);
    }
  };

  const generateDailyCourse = () => {
    const today = new Date().toISOString().split('T')[0];
    const seed = today ? today.split('-').join('') : '20241201'; // Simple seed from date

    // Generate a course based on the date seed
    const course: Hole = generateCourseFromSeed(parseInt(seed));
    setCurrentCourse(course);

    const initialBall: Ball = {
      id: 'daily-challenge',
      position: { ...course.startPosition },
      velocity: { x: 0, y: 0 },
      color: '#ef4444',
      isMoving: false,
      isInHole: false,
    };
    setBall(initialBall);
    setGamePhase('playing');
  };

  const generateCourseFromSeed = (seed: number): Hole => {
    // Simple seeded random number generator
    let random = seed;
    const seededRandom = () => {
      random = (random * 9301 + 49297) % 233280;
      return random / 233280;
    };

    const startX = 100;
    const startY = 250 + (seededRandom() * 100); // Random start Y
    const holeX = 650 + (seededRandom() * 50); // Random hole X
    const holeY = 250 + (seededRandom() * 100); // Random hole Y

    // Generate random obstacles
    const obstacles = [
      // Outer walls
      { id: 'wall-1', type: 'wall' as const, position: { x: 50, y: 50 }, size: { x: 700, y: 20 } },
      { id: 'wall-2', type: 'wall' as const, position: { x: 50, y: 530 }, size: { x: 700, y: 20 } },
      { id: 'wall-3', type: 'wall' as const, position: { x: 50, y: 70 }, size: { x: 20, y: 460 } },
      { id: 'wall-4', type: 'wall' as const, position: { x: 730, y: 70 }, size: { x: 20, y: 460 } },
    ];

    // Add 3-6 random obstacles
    const numObstacles = Math.floor(seededRandom() * 4) + 3;
    for (let i = 0; i < numObstacles; i++) {
      const x = 200 + seededRandom() * 350;
      const y = 150 + seededRandom() * 250;
      const width = 20 + seededRandom() * 60;
      const height = 20 + seededRandom() * 60;

      obstacles.push({
        id: `obstacle-${i}`,
        type: 'wall' as const,
        position: { x, y },
        size: { x: width, y: height }
      });
    }

    return {
      id: 1,
      name: "Daily Challenge",
      par: Math.floor(seededRandom() * 3) + 2, // Par 2-4
      startPosition: { x: startX, y: startY },
      holePosition: { x: holeX, y: holeY },
      bounds: { x: 50, y: 50, width: 700, height: 500 },
      obstacles,
    };
  };

  const getMousePosition = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (waitingForBallStop || ballHasBeenHit || !ball || ball.isMoving || ball.isInHole || gamePhase !== 'playing') {
      return;
    }

    const position = getMousePosition(event);
    setIsDragging(true);
    setDragStart(position);
    setDragEnd(position);
  }, [waitingForBallStop, ballHasBeenHit, ball, gamePhase, getMousePosition]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const position = getMousePosition(event);
      setDragEnd(position);
    }
  }, [isDragging, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && !waitingForBallStop && !ballHasBeenHit && ball && !ball.isInHole && gamePhase === 'playing') {
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

        setBall(prevBall => prevBall ? ({
          ...prevBall,
          velocity,
          isMoving: true,
        }) : null);

        setStrokes(prev => prev + 1);
        setBallHasBeenHit(true);
      }
    }
    setIsDragging(false);
  }, [isDragging, waitingForBallStop, ballHasBeenHit, ball, gamePhase, dragStart, dragEnd]);

  // Physics simulation
  useEffect(() => {
    if (!ball || !currentCourse) return;

    const interval = setInterval(() => {
      setBall(prevBall => {
        if (!prevBall || !prevBall.isMoving) return prevBall;

        let newPos = {
          x: prevBall.position.x + prevBall.velocity.x,
          y: prevBall.position.y + prevBall.velocity.y,
        };

        let newVel = {
          x: prevBall.velocity.x * 0.98,
          y: prevBall.velocity.y * 0.98,
        };

        // Boundary collision
        if (newPos.x <= currentCourse.bounds.x + 8 || newPos.x >= currentCourse.bounds.x + currentCourse.bounds.width - 8) {
          newVel.x = -newVel.x * 0.8;
          newPos.x = Math.max(currentCourse.bounds.x + 8, Math.min(currentCourse.bounds.x + currentCourse.bounds.width - 8, newPos.x));
        }
        if (newPos.y <= currentCourse.bounds.y + 8 || newPos.y >= currentCourse.bounds.y + currentCourse.bounds.height - 8) {
          newVel.y = -newVel.y * 0.8;
          newPos.y = Math.max(currentCourse.bounds.y + 8, Math.min(currentCourse.bounds.y + currentCourse.bounds.height - 8, newPos.y));
        }

        // Obstacle collision
        currentCourse.obstacles.forEach(obstacle => {
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
              const overlapX = Math.min(ballRight - obstacleLeft, obstacleRight - ballLeft);
              const overlapY = Math.min(ballBottom - obstacleTop, obstacleBottom - ballTop);

              if (overlapX < overlapY) {
                newVel.x = -newVel.x * 0.8;
                if (prevBall.position.x < obstacle.position.x + obstacle.size.x / 2) {
                  newPos.x = obstacleLeft - 8;
                } else {
                  newPos.x = obstacleRight + 8;
                }
              } else {
                newVel.y = -newVel.y * 0.8;
                if (prevBall.position.y < obstacle.position.y + obstacle.size.y / 2) {
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
          Math.pow(newPos.x - currentCourse.holePosition.x, 2) +
          Math.pow(newPos.y - currentCourse.holePosition.y, 2)
        );

        if (distanceToHole < 16 && !prevBall.isInHole) {
          return {
            ...prevBall,
            position: currentCourse.holePosition,
            velocity: { x: 0, y: 0 },
            isMoving: false,
            isInHole: true,
          };
        }

        // Stop if velocity is too low
        if (Math.abs(newVel.x) < 0.1 && Math.abs(newVel.y) < 0.1) {
          newVel = { x: 0, y: 0 };
          return {
            ...prevBall,
            position: newPos,
            velocity: newVel,
            isMoving: false,
          };
        }

        return {
          ...prevBall,
          position: newPos,
          velocity: newVel,
          isMoving: true,
        };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [ball, currentCourse]);

  // Check for game completion or failure
  useEffect(() => {
    if (!ball) return;

    if (ball.isInHole && !ball.isMoving) {
      setWaitingForBallStop(true);
      setTimeout(() => {
        submitScore();
        setGamePhase('completed');
      }, 1000);
    } else if (!ball.isMoving && ballHasBeenHit) {
      setWaitingForBallStop(true);
      setTimeout(() => {
        setBallHasBeenHit(false);
        setWaitingForBallStop(false);

        // Check if player has exceeded stroke limit
        if (strokes >= MAX_STROKES) {
          setGamePhase('failed');
        }
      }, 500);
    }
  }, [ball, ballHasBeenHit, strokes]);

  const submitScore = async () => {
    try {
      console.log('Submitting score:', { strokes, regensUsed });

      const response = await fetch('/api/golf/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strokes,
          regenCount: regensUsed,
          courseId: currentCourse?.id || 'daily-' + new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Score submitted successfully:', result);
        setPlayerRank(result.rank);

        // Notify parent component
        if (onScoreSubmitted) {
          onScoreSubmitted(strokes, result.rank);
        }

        // Refresh leaderboard to show updated rankings
        await loadLeaderboard();
      } else {
        console.error('Failed to submit score:', response.status, await response.text());
        // API not available, simulate rank
        const simulatedRank = Math.min(strokes, 10); // Better scores get better ranks
        setPlayerRank(simulatedRank);

        // Notify parent component
        if (onScoreSubmitted) {
          onScoreSubmitted(strokes, simulatedRank);
        }
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      // API not available, simulate rank
      const simulatedRank = Math.min(strokes, 10); // Better scores get better ranks
      setPlayerRank(simulatedRank);

      // Notify parent component
      if (onScoreSubmitted) {
        onScoreSubmitted(strokes, simulatedRank);
      }
    }
  };

  const handleRegenerateInternal = () => {
    if (regensUsed >= MAX_REGENS || !currentCourse) return;

    // Call the parent's regenerate function if provided
    if (onRegenerate) {
      onRegenerate();
    }

    // Generate new course locally
    const newCourse = generateCourseFromSeed(Date.now());
    setCurrentCourse(newCourse);

    // Reset ball
    setBall({
      id: 'daily-challenge',
      position: { ...newCourse.startPosition },
      velocity: { x: 0, y: 0 },
      color: '#ef4444',
      isMoving: false,
      isInHole: false,
    });

    setStrokes(0);
    setBallHasBeenHit(false);
    setWaitingForBallStop(false);
    setGamePhase('playing');
  };

  const handlePlayAgain = () => {
    // Go back to main menu instead of reloading challenge
    if (onBackToMenu) {
      onBackToMenu();
    } else {
      // Fallback: reset to play again
      setStrokes(0);
      setBallHasBeenHit(false);
      setWaitingForBallStop(false);
      setPlayerRank(null);
      setGamePhase('playing');
      
      // Reset ball position
      if (currentCourse) {
        setBall({
          id: 'daily-challenge',
          position: { ...currentCourse.startPosition },
          velocity: { x: 0, y: 0 },
          color: '#ef4444',
          isMoving: false,
          isInHole: false,
        });
      }
    }
  };

  if (gamePhase === 'loading' || !currentCourse || !ball) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-white text-xl mb-4">Loading Daily Challenge...</div>
          <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  if (gamePhase === 'completed') {
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
            Course Complete!
          </h1>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Your Score</h3>
            <div className="text-4xl font-bold text-yellow-400 mb-2">{strokes}</div>
            <p className="text-green-300">Strokes (Par {currentCourse.par})</p>
            {playerRank && (
              <p className="text-blue-300 mt-2">Rank: #{playerRank}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handlePlayAgain}
              className="px-8 py-4 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:from-green-600 hover:via-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-3">
                <RotateCcw className="w-6 h-6" />
                <span>Back to Menu</span>
              </div>
            </button>

            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-2xl border border-white/20 hover:border-white/30 transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-3">
                <Users className="w-6 h-6" />
                <span>Leaderboard</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-4">
          <h1 className="text-6xl font-bold text-red-400 mb-4">Challenge Failed</h1>
          <p className="text-red-300 text-xl mb-8">You've exceeded the maximum strokes for this challenge.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handlePlayAgain}
              className="px-8 py-4 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:from-green-600 hover:via-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
            >
              <div className="flex items-center justify-center space-x-3">
                <RotateCcw className="w-6 h-6" />
                <span>Back to Menu</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-green-900">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
          {/* Main Game Area */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            {/* Game HUD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Daily</h3>
                    <p className="text-green-300">Challenge</p>
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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Strokes</h3>
                    <p className="text-green-300">{strokes}</p>
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
                    <Shuffle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Regens</h3>
                    <p className="text-green-300">{regensUsed}/{MAX_REGENS}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Par</h3>
                    <p className="text-green-300">{currentCourse.par}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Golf Course */}
            <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2">{currentCourse.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-green-300">
                    <span>Par {currentCourse.par}</span>
                    <span>Strokes: {strokes}</span>
                  </div>
                  {regensUsed < MAX_REGENS && (
                    <button
                      onClick={handleRegenerateInternal}
                      disabled={waitingForBallStop || ball.isMoving}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                    >
                      <Shuffle className="w-4 h-4" />
                      <span>Regenerate ({MAX_REGENS - regensUsed} left)</span>
                    </button>
                  )}
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
                    x={currentCourse.bounds.x}
                    y={currentCourse.bounds.y}
                    width={currentCourse.bounds.width}
                    height={currentCourse.bounds.height}
                    fill="#32CD32"
                    stroke="#228B22"
                    strokeWidth="3"
                  />

                  {/* Obstacles */}
                  {currentCourse.obstacles.map(obstacle => {
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
                  {currentCourse.startPosition && (
                    <circle
                      cx={currentCourse.startPosition.x || 0}
                      cy={currentCourse.startPosition.y || 0}
                      r="12"
                      fill="#8B4513"
                      stroke="#654321"
                      strokeWidth="2"
                    />
                  )}

                  {/* Hole */}
                  {currentCourse.holePosition && (
                    <circle
                      cx={currentCourse.holePosition.x || 0}
                      cy={currentCourse.holePosition.y || 0}
                      r="16"
                      fill="#000"
                      stroke="#333"
                      strokeWidth="2"
                    />
                  )}

                  {/* Flag */}
                  <g>
                    <line
                      x1={currentCourse.holePosition.x}
                      y1={currentCourse.holePosition.y - 16}
                      x2={currentCourse.holePosition.x}
                      y2={currentCourse.holePosition.y - 50}
                      stroke="#FFD700"
                      strokeWidth="3"
                    />
                    <polygon
                      points={`${currentCourse.holePosition.x},${currentCourse.holePosition.y - 50} ${currentCourse.holePosition.x + 20},${currentCourse.holePosition.y - 40} ${currentCourse.holePosition.x},${currentCourse.holePosition.y - 30}`}
                      fill="#FF4500"
                      stroke="#FF6347"
                      strokeWidth="1"
                    />
                  </g>


                  {/* Ball */}
                  {ball && ball.position && (
                    <g>
                      <circle
                        cx={ball.position.x || 0}
                        cy={ball.position.y || 0}
                        r="8"
                        fill={ball.color}
                        stroke="#FFF"
                        strokeWidth="2"
                        opacity={ball.isInHole ? 0.3 : 1}
                      />

                      {/* Movement indicator */}
                      {ball.isMoving && (
                        <motion.circle
                          cx={ball.position.x || 0}
                          cy={ball.position.y || 0}
                          r="12"
                          fill="none"
                          stroke={ball.color}
                          strokeWidth="2"
                          opacity="0.5"
                          animate={{ r: [8, 16, 8] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                    </g>
                  )}

                  {/* Power indicator */}
                  {isDragging && ball && (
                    <g>
                      <rect
                        x={ball.position.x - 30}
                        y={ball.position.y - 45}
                        width="60"
                        height="8"
                        fill="#333"
                        stroke="#FFF"
                        strokeWidth="1"
                        rx="4"
                      />
                      <rect
                        x={ball.position.x - 28}
                        y={ball.position.y - 43}
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
                  {!waitingForBallStop && !ballHasBeenHit
                    ? <><strong>Daily Challenge!</strong> Drag from your ball to aim and set power. Complete in as few strokes as possible!</>
                    : waitingForBallStop
                      ? `Ball is moving... wait for it to stop.`
                      : `Ball stopped. Click to continue.`
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
                <span>← Back to Menu</span>
              </button>
            )}

            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-all duration-200"
            >
              {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
            </button>

            <AnimatePresence>
              {showLeaderboard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Today's Leaderboard</h3>

                  <div className="space-y-2">
                    {leaderboard.length === 0 ? (
                      <p className="text-green-300 text-sm text-center">No scores yet today!</p>
                    ) : (
                      leaderboard.slice(0, 10).map((score, index) => (
                        <div
                          key={`${score.userId}-${score.completedAt}`}
                          className={`flex justify-between items-center p-2 rounded-lg ${
                            index < 3 ? 'bg-yellow-500/20' : 'bg-white/5'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-bold">#{index + 1}</span>
                            <span className="text-green-300">{score.username}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">{score.strokes}</div>
                            <div className="text-xs text-green-300">
                              {score.regenCount > 0 && `${score.regenCount} regens`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Daily Challenge Info */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Challenge Rules</h3>
              <div className="space-y-2 text-sm text-green-300">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>New course daily</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shuffle className="w-4 h-4" />
                  <span>{MAX_REGENS} regenerations max</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Lowest score wins</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Global leaderboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};