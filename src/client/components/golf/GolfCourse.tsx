import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameState, Vector2, TrajectoryPoint } from '../../types/golf';

interface GolfCourseProps {
  gameState: GameState;
  isDragging: boolean;
  dragStart: Vector2;
  dragEnd: Vector2;
  onStartDrag: (position: Vector2) => void;
  onUpdateDrag: (position: Vector2) => void;
  onEndDrag: () => void;
  calculateTrajectory: (start: Vector2, end: Vector2) => TrajectoryPoint[];
}

export const GolfCourse: React.FC<GolfCourseProps> = ({
  gameState,
  isDragging,
  dragStart,
  dragEnd,
  onStartDrag,
  onUpdateDrag,
  onEndDrag,
  calculateTrajectory,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const getMousePosition = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const position = getMousePosition(event);
    onStartDrag(position);
  }, [getMousePosition, onStartDrag]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const position = getMousePosition(event);
    onUpdateDrag(position);
  }, [getMousePosition, onUpdateDrag]);

  const handleMouseUp = useCallback(() => {
    onEndDrag();
  }, [onEndDrag]);

  const currentHole = gameState.holes[gameState.currentHole];
  const currentBall = gameState.balls[gameState.currentPlayerIndex];
  const trajectory = isDragging && currentBall && currentHole ? calculateTrajectory(currentBall.position, dragEnd) : [];
  
  if (!currentHole) return null;

  const renderObstacle = (obstacle: any) => {
    switch (obstacle.type) {
      case 'wall':
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
      case 'water':
        return (
          <rect
            key={obstacle.id}
            x={obstacle.position.x}
            y={obstacle.position.y}
            width={obstacle.size.x}
            height={obstacle.size.y}
            fill="#1e40af"
            stroke="#1e3a8a"
            strokeWidth="2"
            opacity="0.8"
          />
        );
      case 'windmill':
        return (
          <g key={obstacle.id}>
            <rect
              x={obstacle.position.x}
              y={obstacle.position.y}
              width={obstacle.size.x}
              height={obstacle.size.y}
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="2"
              transform={`rotate(${obstacle.rotation || 0} ${obstacle.position.x + obstacle.size.x/2} ${obstacle.position.y + obstacle.size.y/2})`}
            />
          </g>
        );
      case 'ramp':
        return (
          <rect
            key={obstacle.id}
            x={obstacle.position.x}
            y={obstacle.position.y}
            width={obstacle.size.x}
            height={obstacle.size.y}
            fill="#FFA500"
            stroke="#FF8C00"
            strokeWidth="2"
            opacity="0.7"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">
          Hole {currentHole?.id || 1}: {currentHole?.name || 'Unknown'}
        </h3>
        <div className="flex items-center space-x-4 text-sm text-green-300">
          <span>Par {currentHole?.par || 3}</span>
          <span>•</span>
          <span className="capitalize">
            {gameState.players[gameState.currentPlayerIndex]?.name}'s Turn
          </span>
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
          <rect
            width="800"
            height="600"
            fill="#228B22"
          />
          
          {/* Course bounds (lighter green) */}
          <rect
            x={currentHole.bounds.x}
            y={currentHole.bounds.y}
            width={currentHole.bounds.width}
            height={currentHole.bounds.height}
            fill="#32CD32"
            stroke="#228B22"
            strokeWidth="3"
          />

          {/* Obstacles */}
          {currentHole.obstacles.map(renderObstacle)}

          {/* Starting tee */}
          <circle
            cx={currentHole.startPosition.x}
            cy={currentHole.startPosition.y}
            r="12"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />

          {/* Hole */}
          <circle
            cx={currentHole.holePosition.x}
            cy={currentHole.holePosition.y}
            r="16"
            fill="#000"
            stroke="#333"
            strokeWidth="2"
          />
          
          {/* Flag */}
          <g>
            <line
              x1={currentHole.holePosition.x}
              y1={currentHole.holePosition.y - 16}
              x2={currentHole.holePosition.x}
              y2={currentHole.holePosition.y - 50}
              stroke="#FFD700"
              strokeWidth="3"
            />
            <polygon
              points={`${currentHole.holePosition.x},${currentHole.holePosition.y - 50} ${currentHole.holePosition.x + 20},${currentHole.holePosition.y - 40} ${currentHole.holePosition.x},${currentHole.holePosition.y - 30}`}
              fill="#FF4500"
              stroke="#FF6347"
              strokeWidth="1"
            />
          </g>

          {/* Trajectory preview */}
          {isDragging && trajectory.length > 0 && (
            <g>
              <path
                d={`M ${trajectory[0]?.x || 0} ${trajectory[0]?.y || 0} ${trajectory.map((point, i) => 
                  i === 0 ? '' : `L ${point.x} ${point.y}`
                ).join(' ')}`}
                stroke="#FFD700"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                opacity="0.8"
              />
              {trajectory.filter((_, i) => i % 5 === 0).map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="#FFD700"
                  opacity="0.7"
                />
              ))}
            </g>
          )}

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

          {/* Balls */}
          {gameState.balls.map((ball) => (
            <g key={ball.id}>
              <circle
                cx={ball.position.x}
                cy={ball.position.y}
                r="8"
                fill={ball.color}
                stroke="#FFF"
                strokeWidth="2"
                opacity={ball.isInHole ? 0.3 : 1}
              />
              {ball.isMoving && (
                <motion.circle
                  cx={ball.position.x}
                  cy={ball.position.y}
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
          ))}

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

      {/* Course legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-green-200">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full border border-white"></div>
          <span>Ball</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-black rounded-full border border-white"></div>
          <span>Hole</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-amber-600"></div>
          <span>Wall</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600"></div>
          <span>Water (+1 stroke)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500"></div>
          <span>Ramp</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-green-300 text-sm text-center">
          <strong>Drag from the ball</strong> to aim and set power, then <strong>release</strong> to putt!
        </p>
      </div>
    </div>
  );
};