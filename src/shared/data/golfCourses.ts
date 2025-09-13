import { Hole } from '../types/golf';

export const golfCourses: Hole[] = [
  {
    id: 1,
    name: "Straight Shot",
    par: 2,
    startPosition: { x: 100, y: 300 },
    holePosition: { x: 700, y: 300 },
    bounds: { x: 50, y: 50, width: 700, height: 500 },
    obstacles: [
      // Top wall
      { id: 'wall-1', type: 'wall', position: { x: 50, y: 50 }, size: { x: 700, y: 20 } },
      // Bottom wall
      { id: 'wall-2', type: 'wall', position: { x: 50, y: 530 }, size: { x: 700, y: 20 } },
      // Left wall
      { id: 'wall-3', type: 'wall', position: { x: 50, y: 70 }, size: { x: 20, y: 460 } },
      // Right wall
      { id: 'wall-4', type: 'wall', position: { x: 730, y: 70 }, size: { x: 20, y: 460 } },
      // Side barriers
      { id: 'barrier-1', type: 'wall', position: { x: 50, y: 150 }, size: { x: 100, y: 20 } },
      { id: 'barrier-2', type: 'wall', position: { x: 50, y: 430 }, size: { x: 100, y: 20 } },
      { id: 'barrier-3', type: 'wall', position: { x: 600, y: 150 }, size: { x: 100, y: 20 } },
      { id: 'barrier-4', type: 'wall', position: { x: 600, y: 430 }, size: { x: 100, y: 20 } },
    ],
  },
  {
    id: 2,
    name: "U-Turn Challenge",
    par: 3,
    startPosition: { x: 100, y: 300 },
    holePosition: { x: 100, y: 150 },
    bounds: { x: 50, y: 50, width: 700, height: 500 },
    obstacles: [
      // Outer walls
      { id: 'wall-1', type: 'wall', position: { x: 50, y: 50 }, size: { x: 700, y: 20 } },
      { id: 'wall-2', type: 'wall', position: { x: 50, y: 530 }, size: { x: 700, y: 20 } },
      { id: 'wall-3', type: 'wall', position: { x: 50, y: 70 }, size: { x: 20, y: 460 } },
      { id: 'wall-4', type: 'wall', position: { x: 730, y: 70 }, size: { x: 20, y: 460 } },
      // U-shape barrier
      { id: 'u-barrier-1', type: 'wall', position: { x: 200, y: 150 }, size: { x: 450, y: 20 } },
      { id: 'u-barrier-2', type: 'wall', position: { x: 630, y: 170 }, size: { x: 20, y: 280 } },
      { id: 'u-barrier-3', type: 'wall', position: { x: 200, y: 430 }, size: { x: 450, y: 20 } },
    ],
  },
  {
    id: 3,
    name: "Pathway Split",
    par: 3,
    startPosition: { x: 100, y: 300 },
    holePosition: { x: 700, y: 300 },
    bounds: { x: 50, y: 50, width: 700, height: 500 },
    obstacles: [
      // Outer walls
      { id: 'wall-1', type: 'wall', position: { x: 50, y: 50 }, size: { x: 700, y: 20 } },
      { id: 'wall-2', type: 'wall', position: { x: 50, y: 530 }, size: { x: 700, y: 20 } },
      { id: 'wall-3', type: 'wall', position: { x: 50, y: 70 }, size: { x: 20, y: 460 } },
      { id: 'wall-4', type: 'wall', position: { x: 730, y: 70 }, size: { x: 20, y: 460 } },
      // Center divider
      { id: 'divider-1', type: 'wall', position: { x: 300, y: 200 }, size: { x: 200, y: 20 } },
      { id: 'divider-2', type: 'wall', position: { x: 300, y: 380 }, size: { x: 200, y: 20 } },
      { id: 'divider-3', type: 'wall', position: { x: 380, y: 220 }, size: { x: 20, y: 160 } },
    ],
  },
  {
    id: 4,
    name: "Water Hazard Bridge",
    par: 2,
    startPosition: { x: 100, y: 300 },
    holePosition: { x: 700, y: 300 },
    bounds: { x: 50, y: 50, width: 700, height: 500 },
    obstacles: [
      // Outer walls
      { id: 'wall-1', type: 'wall', position: { x: 50, y: 50 }, size: { x: 700, y: 20 } },
      { id: 'wall-2', type: 'wall', position: { x: 50, y: 530 }, size: { x: 700, y: 20 } },
      { id: 'wall-3', type: 'wall', position: { x: 50, y: 70 }, size: { x: 20, y: 460 } },
      { id: 'wall-4', type: 'wall', position: { x: 730, y: 70 }, size: { x: 20, y: 460 } },
      // Water hazards
      { id: 'water-1', type: 'water', position: { x: 250, y: 150 }, size: { x: 300, y: 80 } },
      { id: 'water-2', type: 'water', position: { x: 250, y: 370 }, size: { x: 300, y: 80 } },
      // Bridge walls
      { id: 'bridge-1', type: 'wall', position: { x: 370, y: 230 }, size: { x: 60, y: 10 } },
      { id: 'bridge-2', type: 'wall', position: { x: 370, y: 360 }, size: { x: 60, y: 10 } },
    ],
  },
  {
    id: 5,
    name: "Spinning Windmill",
    par: 3,
    startPosition: { x: 100, y: 300 },
    holePosition: { x: 700, y: 300 },
    bounds: { x: 50, y: 50, width: 700, height: 500 },
    obstacles: [
      // Outer walls
      { id: 'wall-1', type: 'wall', position: { x: 50, y: 50 }, size: { x: 700, y: 20 } },
      { id: 'wall-2', type: 'wall', position: { x: 50, y: 530 }, size: { x: 700, y: 20 } },
      { id: 'wall-3', type: 'wall', position: { x: 50, y: 70 }, size: { x: 20, y: 460 } },
      { id: 'wall-4', type: 'wall', position: { x: 730, y: 70 }, size: { x: 20, y: 460 } },
      // Windmill base
      { id: 'windmill-base', type: 'wall', position: { x: 380, y: 280 }, size: { x: 40, y: 40 } },
      // Windmill blades (simplified as rotating walls)
      { id: 'blade-1', type: 'windmill', position: { x: 400, y: 200 }, size: { x: 10, y: 80 }, rotation: 0 },
      { id: 'blade-2', type: 'windmill', position: { x: 320, y: 295 }, size: { x: 80, y: 10 }, rotation: 90 },
      { id: 'blade-3', type: 'windmill', position: { x: 395, y: 320 }, size: { x: 10, y: 80 }, rotation: 180 },
      { id: 'blade-4', type: 'windmill', position: { x: 420, y: 295 }, size: { x: 80, y: 10 }, rotation: 270 },
    ],
  },
  {
    id: 6,
    name: "Tilted Ramp",
    par: 4,
    startPosition: { x: 100, y: 450 },
    holePosition: { x: 700, y: 150 },
    bounds: { x: 50, y: 50, width: 700, height: 500 },
    obstacles: [
      // Outer walls
      { id: 'wall-1', type: 'wall', position: { x: 50, y: 50 }, size: { x: 700, y: 20 } },
      { id: 'wall-2', type: 'wall', position: { x: 50, y: 530 }, size: { x: 700, y: 20 } },
      { id: 'wall-3', type: 'wall', position: { x: 50, y: 70 }, size: { x: 20, y: 460 } },
      { id: 'wall-4', type: 'wall', position: { x: 730, y: 70 }, size: { x: 20, y: 460 } },
      // Ramp structure
      { id: 'ramp-base', type: 'ramp', position: { x: 200, y: 350 }, size: { x: 400, y: 20 } },
      { id: 'ramp-left', type: 'wall', position: { x: 180, y: 300 }, size: { x: 20, y: 70 } },
      { id: 'ramp-right', type: 'wall', position: { x: 600, y: 180 }, size: { x: 20, y: 190 } },
      // Additional barriers
      { id: 'barrier-1', type: 'wall', position: { x: 300, y: 250 }, size: { x: 80, y: 20 } },
      { id: 'barrier-2', type: 'wall', position: { x: 420, y: 200 }, size: { x: 80, y: 20 } },
    ],
  },
  {
    id: 7,
    name: "Maze Challenge",
    par: 4,
    startPosition: { x: 100, y: 300 },
    holePosition: { x: 700, y: 150 },
    bounds: { x: 50, y: 50, width: 700, height: 500 },
    obstacles: [
      // Outer walls
      { id: 'wall-1', type: 'wall', position: { x: 50, y: 50 }, size: { x: 700, y: 20 } },
      { id: 'wall-2', type: 'wall', position: { x: 50, y: 530 }, size: { x: 700, y: 20 } },
      { id: 'wall-3', type: 'wall', position: { x: 50, y: 70 }, size: { x: 20, y: 460 } },
      { id: 'wall-4', type: 'wall', position: { x: 730, y: 70 }, size: { x: 20, y: 460 } },
      // Maze walls
      { id: 'maze-1', type: 'wall', position: { x: 200, y: 150 }, size: { x: 20, y: 200 } },
      { id: 'maze-2', type: 'wall', position: { x: 220, y: 330 }, size: { x: 150, y: 20 } },
      { id: 'maze-3', type: 'wall', position: { x: 350, y: 200 }, size: { x: 20, y: 150 } },
      { id: 'maze-4', type: 'wall', position: { x: 450, y: 150 }, size: { x: 20, y: 120 } },
      { id: 'maze-5', type: 'wall', position: { x: 470, y: 250 }, size: { x: 100, y: 20 } },
      { id: 'maze-6', type: 'wall', position: { x: 550, y: 180 }, size: { x: 20, y: 90 } },
      { id: 'maze-7', type: 'wall', position: { x: 300, y: 400 }, size: { x: 200, y: 20 } },
      { id: 'maze-8', type: 'wall', position: { x: 480, y: 350 }, size: { x: 20, y: 70 } },
    ],
  },
  {
    id: 8,
    name: "Final Challenge",
    par: 5,
    startPosition: { x: 100, y: 450 },
    holePosition: { x: 700, y: 150 },
    bounds: { x: 50, y: 50, width: 700, height: 500 },
    obstacles: [
      // Outer walls
      { id: 'wall-1', type: 'wall', position: { x: 50, y: 50 }, size: { x: 700, y: 20 } },
      { id: 'wall-2', type: 'wall', position: { x: 50, y: 530 }, size: { x: 700, y: 20 } },
      { id: 'wall-3', type: 'wall', position: { x: 50, y: 70 }, size: { x: 20, y: 460 } },
      { id: 'wall-4', type: 'wall', position: { x: 730, y: 70 }, size: { x: 20, y: 460 } },
      // Water hazard
      { id: 'water-1', type: 'water', position: { x: 200, y: 300 }, size: { x: 150, y: 100 } },
      { id: 'water-2', type: 'water', position: { x: 450, y: 200 }, size: { x: 100, y: 150 } },
      // Windmill
      { id: 'windmill-base-2', type: 'wall', position: { x: 380, y: 380 }, size: { x: 30, y: 30 } },
      { id: 'blade-final-1', type: 'windmill', position: { x: 395, y: 320 }, size: { x: 8, y: 60 }, rotation: 45 },
      { id: 'blade-final-2', type: 'windmill', position: { x: 350, y: 390 }, size: { x: 60, y: 8 }, rotation: 135 },
      // Maze section
      { id: 'maze-final-1', type: 'wall', position: { x: 600, y: 250 }, size: { x: 20, y: 100 } },
      { id: 'maze-final-2', type: 'wall', position: { x: 620, y: 330 }, size: { x: 80, y: 20 } },
      // Ramp
      { id: 'ramp-final', type: 'ramp', position: { x: 250, y: 180 }, size: { x: 150, y: 15 } },
      // Final barriers
      { id: 'final-barrier-1', type: 'wall', position: { x: 650, y: 180 }, size: { x: 20, y: 60 } },
      { id: 'final-barrier-2', type: 'wall', position: { x: 670, y: 220 }, size: { x: 30, y: 20 } },
    ],
  },
];