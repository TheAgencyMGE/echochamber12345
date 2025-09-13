import React, { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { GolfRoom, Player, Vector2 } from '../../../shared/types/golf';
import { golfCourses } from '../../data/golfCourses';

interface GolfCourseMultiplayerProps {
  room: GolfRoom;
  onHitBall: (velocity: Vector2, position: Vector2) => void;
  isMyTurn: boolean;
  myPlayer: Player | null;
}

export const GolfCourseMultiplayer: React.FC<GolfCourseMultiplayerProps> = ({
  room,
  onHitBall,
  isMyTurn,
  myPlayer,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2>({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState<Vector2>({ x: 0, y: 0 });

  const currentHole = golfCourses[room.currentHole];
  const currentPlayerBall = myPlayer ? room.balls.find((b: any) => b.id === myPlayer.id) : null;

  const getMousePosition = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isMyTurn || !currentPlayerBall || currentPlayerBall.isMoving || currentPlayerBall.isInHole) {
      return;
    }

    const position = getMousePosition(event);
    setIsDragging(true);
    setDragStart(position);
    setDragEnd(position);
  }, [isMyTurn, currentPlayerBall, getMousePosition]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const position = getMousePosition(event);
      setDragEnd(position);
    }
  }, [isDragging, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && isMyTurn && currentPlayerBall && !currentPlayerBall.isInHole) {
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

        onHitBall(velocity, currentPlayerBall.position);
      }
    }
    setIsDragging(false);
  }, [isDragging, isMyTurn, currentPlayerBall, dragStart, dragEnd, onHitBall]);

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
          <rect
            key={obstacle.id}
            x={obstacle.position.x}
            y={obstacle.position.y}
            width={obstacle.size.x}
            height={obstacle.size.y}
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
            transform={`rotate(${obstacle.rotation || 0} ${obstacle.position.x + obstacle.size.x/2} ${obstacle.position.y + obstacle.size.y/2})`}
          />
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

  if (!currentHole) return null;

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">
          Hole {currentHole.id}: {currentHole.name}
        </h3>
        <div className="flex items-center space-x-4 text-sm text-green-300">
          <span>Par {currentHole.par}</span>
          <span>•</span>
          <span className="capitalize">
            {room.players[room.currentPlayerIndex]?.name}'s Turn
            {isMyTurn && <span className="text-yellow-400 ml-1">(Your turn!)</span>}
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl" style={{ backgroundColor: '#1a7f3b' }}>
        <svg
          ref={svgRef}
          width="800"
          height="600"
          viewBox="0 0 800 600"
          className={`w-full h-auto ${isMyTurn ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Golf course background */}
          <rect width="800" height="600" fill="#228B22" />
          
          {/* Course bounds */}
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

          {/* Drag line (only show for current player) */}
          {isDragging && isMyTurn && currentPlayerBall && (
            <line
              x1={currentPlayerBall.position.x}
              y1={currentPlayerBall.position.y}
              x2={dragEnd.x}
              y2={dragEnd.y}
              stroke="#FF4500"
              strokeWidth="3"
              opacity="0.8"
            />
          )}

          {/* All balls */}
          {room.balls.map((ball: any) => {
            const player = room.players.find((p: Player) => p.id === ball.id);
            const isCurrentPlayer = room.players[room.currentPlayerIndex]?.id === ball.id;
            
            return (
              <g key={ball.id}>
                <circle
                  cx={ball.position.x}
                  cy={ball.position.y}
                  r="8"
                  fill={ball.color}
                  stroke={isCurrentPlayer ? "#FFD700" : "#FFF"}
                  strokeWidth={isCurrentPlayer ? "3" : "2"}
                  opacity={ball.isInHole ? 0.3 : 1}
                />
                
                {/* Player name label */}
                <text
                  x={ball.position.x}
                  y={ball.position.y - 15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#FFF"
                  stroke="#000"
                  strokeWidth="0.5"
                >
                  {player?.name}
                </text>

                {/* Movement indicator */}
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

                {/* Current player indicator */}
                {isCurrentPlayer && !ball.isMoving && (
                  <motion.circle
                    cx={ball.position.x}
                    cy={ball.position.y}
                    r="15"
                    fill="none"
                    stroke="#FFD700"
                    strokeWidth="2"
                    opacity="0.7"
                    animate={{ r: [15, 20, 15] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </g>
            );
          })}

          {/* Power indicator (only for current player) */}
          {isDragging && isMyTurn && currentPlayerBall && (
            <g>
              <rect
                x={currentPlayerBall.position.x - 30}
                y={currentPlayerBall.position.y - 45}
                width="60"
                height="8"
                fill="#333"
                stroke="#FFF"
                strokeWidth="1"
                rx="4"
              />
              <rect
                x={currentPlayerBall.position.x - 28}
                y={currentPlayerBall.position.y - 43}
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
          {isMyTurn 
            ? <><strong>Your turn!</strong> Drag from your ball to aim and set power, then release to putt!</>
            : `Waiting for ${room.players[room.currentPlayerIndex]?.name} to take their shot...`
          }
        </p>
      </div>
    </div>
  );
};