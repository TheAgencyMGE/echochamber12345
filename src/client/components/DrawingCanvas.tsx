import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  onDrawingComplete: (imageData: string) => void;
  disabled?: boolean;
  timeRemaining?: number;
}

interface Point {
  x: number;
  y: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onDrawingComplete,
  disabled = false,
  timeRemaining = 60000
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(5);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [timerStarted, setTimerStarted] = useState(false);
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeRemaining);

  // Start timer on first drawing action
  useEffect(() => {
    if (timerStarted && !disabled) {
      const interval = setInterval(() => {
        setLocalTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1000);
          if (newTime === 0) {
            // Auto-submit when time runs out
            const canvas = canvasRef.current;
            if (canvas) {
              const imageData = canvas.toDataURL('image/png');
              onDrawingComplete(imageData);
            }
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timerStarted, disabled, onDrawingComplete]);

  const colors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500'  // Orange
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;

    // Set default styles
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Save initial state
    saveToHistory();
  }, []);

  // Save canvas state to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(dataURL);
      return newHistory.slice(-10); // Keep only last 10 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 9));
  }, [historyIndex]);

  // Get point from event
  const getPointFromEvent = useCallback((e: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e && e.touches.length > 0 && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return;
    
    // Start timer on first drawing action
    if (!timerStarted) {
      setTimerStarted(true);
    }
    
    e.preventDefault();
    setIsDrawing(true);
    const point = getPointFromEvent(e);
    setLastPoint(point);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }, [disabled, getPointFromEvent, currentTool, currentColor, brushSize, timerStarted]);

  // Draw
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing || disabled) return;

    e.preventDefault();
    const point = getPointFromEvent(e);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (lastPoint) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    setLastPoint(point);
  }, [isDrawing, disabled, getPointFromEvent, lastPoint]);

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setLastPoint(null);
    saveToHistory();
  }, [isDrawing, saveToHistory]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  }, [saveToHistory]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setHistoryIndex(prev => prev - 1);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    const imgSrc = history[historyIndex - 1];
    if (imgSrc) {
      img.src = imgSrc;
    }
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setHistoryIndex(prev => prev + 1);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    const imgSrc = history[historyIndex + 1];
    if (imgSrc) {
      img.src = imgSrc;
    }
  }, [historyIndex, history]);

  // Submit drawing
  const submitDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    onDrawingComplete(imageData);
  }, [onDrawingComplete]);

  // Mouse events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => startDrawing(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = () => stopDrawing();
    const handleMouseLeave = () => stopDrawing();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [startDrawing, draw, stopDrawing]);

  // Touch events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => startDrawing(e);
    const handleTouchMove = (e: TouchEvent) => draw(e);
    const handleTouchEnd = () => stopDrawing();

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startDrawing, draw, stopDrawing]);

  // Format time
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Timer */}
      <div className={`text-2xl font-bold ${localTimeRemaining < 10000 ? 'text-red-500 animate-pulse' : 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent'}`}>
        {timerStarted ? formatTime(localTimeRemaining) : 'Click to start drawing!'}
      </div>

      {/* Canvas */}
      <div className="border-2 border-purple-200 rounded-xl overflow-hidden shadow-lg">
        <canvas
          ref={canvasRef}
          className={`block ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Tools */}
      <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-white/50 backdrop-blur-sm border border-purple-100 rounded-xl shadow-lg">
        {/* Tool Selection */}
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentTool('brush')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentTool === 'brush'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'
            }`}
            disabled={disabled}
          >
            ✏️ Brush
          </button>
          <button
            onClick={() => setCurrentTool('eraser')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentTool === 'eraser'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'
            }`}
            disabled={disabled}
          >
            🧹 Eraser
          </button>
        </div>

        {/* Brush Size */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-slate-600 font-medium">Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 accent-purple-500"
            disabled={disabled}
          />
          <span className="text-sm text-slate-600 font-medium w-6">{brushSize}</span>
        </div>

        {/* Colors */}
        <div className="flex space-x-1">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setCurrentColor(color)}
              className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                currentColor === color ? 'border-purple-600 ring-2 ring-purple-200' : 'border-purple-200 hover:border-purple-400'
              }`}
              style={{ backgroundColor: color }}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={undo}
          disabled={disabled || historyIndex <= 0}
          className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg disabled:opacity-50 hover:bg-purple-50 font-medium transition-all duration-200"
        >
          ↶ Undo
        </button>
        <button
          onClick={redo}
          disabled={disabled || historyIndex >= history.length - 1}
          className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg disabled:opacity-50 hover:bg-purple-50 font-medium transition-all duration-200"
        >
          ↷ Redo
        </button>
        <button
          onClick={clearCanvas}
          disabled={disabled}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg disabled:opacity-50 hover:from-red-600 hover:to-red-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
        >
          🗑️ Clear
        </button>
        <button
          onClick={submitDrawing}
          disabled={disabled || localTimeRemaining <= 0}
          className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold disabled:opacity-50 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Submit Drawing
        </button>
      </div>
    </div>
  );
};
