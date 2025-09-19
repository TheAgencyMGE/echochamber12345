import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Palette, Eraser, RotateCcw, RotateCw, Trash2, Send } from 'lucide-react';

interface DrawingCanvasProps {
  onDrawingComplete: (imageData: string, title: string, description?: string) => void;
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Start timer on first drawing action
  useEffect(() => {
    if (timerStarted && !disabled) {
      const interval = setInterval(() => {
        setLocalTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1000);
          if (newTime === 0) {
            // Auto-submit when time runs out
            setShowSubmitModal(true);
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
    
    // Improve rendering quality
    ctx.imageSmoothingEnabled = true;

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e && e.touches.length > 0 && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else if ('clientX' in e) {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    
    // Draw a small dot for single clicks
    ctx.lineTo(point.x + 0.1, point.y + 0.1);
    ctx.stroke();
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
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
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
    setShowSubmitModal(true);
  }, []);

  // Handle actual submission with title
  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    onDrawingComplete(imageData, title.trim(), description.trim() || undefined);
    setShowSubmitModal(false);
  }, [title, description, onDrawingComplete]);

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
    <>
      <div className="flex flex-col items-center space-y-6">
        {/* Timer */}
        <div className={`text-3xl font-bold ${localTimeRemaining < 10000 ? 'text-red-500 animate-pulse' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>
          {timerStarted ? formatTime(localTimeRemaining) : 'Click to start drawing!'}
        </div>

        {/* Canvas */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur-sm pointer-events-none"></div>
          <canvas
            ref={canvasRef}
            className={`relative z-10 block border-2 border-gray-200 rounded-2xl shadow-2xl ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* Tools */}
        <div className="flex flex-wrap items-center justify-center gap-6 p-6 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl">
          {/* Tool Selection */}
          <div className="flex space-x-3">
            <button
              onClick={() => setCurrentTool('brush')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                currentTool === 'brush'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              disabled={disabled}
            >
              <Palette className="w-4 h-4" />
              <span>Brush</span>
            </button>
            <button
              onClick={() => setCurrentTool('eraser')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                currentTool === 'eraser'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              disabled={disabled}
            >
              <Eraser className="w-4 h-4" />
              <span>Eraser</span>
            </button>
          </div>

          {/* Brush Size */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-indigo-500"
              disabled={disabled}
            />
            <span className="text-sm font-medium text-gray-700 w-8">{brushSize}</span>
          </div>

          {/* Colors */}
          <div className="flex space-x-2">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`w-10 h-10 rounded-full border-3 transition-all duration-200 hover:scale-110 ${
                  currentColor === color ? 'border-gray-800 ring-4 ring-indigo-200' : 'border-gray-300 hover:border-gray-500'
                }`}
                style={{ backgroundColor: color }}
                disabled={disabled}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={undo}
            disabled={disabled || historyIndex <= 0}
            className="flex items-center space-x-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl disabled:opacity-50 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Undo</span>
          </button>
          <button
            onClick={redo}
            disabled={disabled || historyIndex >= history.length - 1}
            className="flex items-center space-x-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl disabled:opacity-50 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <RotateCw className="w-4 h-4" />
            <span>Redo</span>
          </button>
          <button
            onClick={clearCanvas}
            disabled={disabled}
            className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl disabled:opacity-50 hover:from-red-600 hover:to-red-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
          <button
            onClick={submitDrawing}
            disabled={disabled || localTimeRemaining <= 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold disabled:opacity-50 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Send className="w-4 h-4" />
            <span>Submit Drawing</span>
          </button>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">What did you draw?</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (required)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., A cat sleeping on a laptop"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any extra details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 transition-all duration-200"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
