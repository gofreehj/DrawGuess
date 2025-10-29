'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, PencilBrush } from 'fabric';
import { motion } from 'framer-motion';
import { 
  TouchPoint, 
  GestureEvent, 
  TouchCanvasProps,
  PerformanceMetrics 
} from '@/types/mobile';
import { 
  vibrate, 
  throttle, 
  debounce,
  getPerformanceMetrics 
} from '@/utils/mobile';

interface DrawingData {
  imageData: string;
  strokes: StrokeData[];
  metadata: CanvasMetadata;
}

interface StrokeData {
  id: string;
  points: TouchPoint[];
  tool: DrawingTool;
  timestamp: number;
  pressure?: number;
}

interface CanvasMetadata {
  width: number;
  height: number;
  devicePixelRatio: number;
  timestamp: number;
  strokeCount: number;
}

interface DrawingTool {
  type: 'brush' | 'eraser';
  size: number;
  color: string;
  opacity: number;
}

interface EnhancedTouchCanvasProps extends TouchCanvasProps {
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  smoothingFactor?: number;
  pressureSensitivity?: boolean;
  maxTouchPoints?: number;
}

export default function EnhancedTouchCanvas({
  width,
  height,
  tools,
  onDrawingChange,
  enableGestures = true,
  hapticFeedback = true,
  preventScrolling = true,
  onPerformanceUpdate,
  smoothingFactor = 0.5,
  pressureSensitivity = true,
  maxTouchPoints = 10
}: EnhancedTouchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const workerRef = useRef<Worker | null>(null);
  
  // Touch tracking state
  const [activeTouches, setActiveTouches] = useState<Map<number, TouchPoint>>(new Map());
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<StrokeData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    networkLatency: 0,
    cacheHitRate: 0
  });

  // Performance monitoring
  const frameTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const strokeIdRef = useRef<number>(0);

  // Throttled functions for performance
  const throttledDrawingUpdate = useCallback(
    throttle((imageData: string) => {
      onDrawingChange?.(imageData);
    }, 16), // ~60fps
    [onDrawingChange]
  );

  const debouncedPerformanceUpdate = useCallback(
    debounce((metrics: PerformanceMetrics) => {
      onPerformanceUpdate?.(metrics);
    }, 1000),
    [onPerformanceUpdate]
  );

  // Initialize OffscreenCanvas and Web Worker for performance
  useEffect(() => {
    if (typeof window !== 'undefined' && 'OffscreenCanvas' in window) {
      try {
        offscreenCanvasRef.current = new OffscreenCanvas(width, height);
        
        // Create worker for heavy canvas operations
        const workerCode = `
          let offscreenCanvas;
          let ctx;
          
          self.onmessage = function(e) {
            const { type, data } = e.data;
            
            switch (type) {
              case 'init':
                offscreenCanvas = data.canvas;
                ctx = offscreenCanvas.getContext('2d');
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                break;
                
              case 'drawStroke':
                if (ctx && data.points.length > 1) {
                  ctx.globalCompositeOperation = data.tool.type === 'eraser' ? 'destination-out' : 'source-over';
                  ctx.strokeStyle = data.tool.color;
                  ctx.lineWidth = data.tool.size;
                  ctx.globalAlpha = data.tool.opacity;
                  
                  ctx.beginPath();
                  ctx.moveTo(data.points[0].x, data.points[0].y);
                  
                  for (let i = 1; i < data.points.length; i++) {
                    const point = data.points[i];
                    const prevPoint = data.points[i - 1];
                    
                    // Smooth curve using quadratic bezier
                    const cpx = (prevPoint.x + point.x) / 2;
                    const cpy = (prevPoint.y + point.y) / 2;
                    ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpx, cpy);
                  }
                  
                  ctx.stroke();
                  
                  // Send back image data
                  const imageData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                  self.postMessage({ type: 'strokeComplete', imageData });
                }
                break;
                
              case 'clear':
                if (ctx) {
                  ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                  ctx.fillStyle = 'white';
                  ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                }
                break;
            }
          };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        workerRef.current = new Worker(URL.createObjectURL(blob));
        
        // Transfer OffscreenCanvas to worker
        workerRef.current.postMessage({
          type: 'init',
          data: { canvas: offscreenCanvasRef.current }
        }, [offscreenCanvasRef.current]);
        
      } catch (error) {
        console.warn('OffscreenCanvas not supported, falling back to main thread rendering');
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [width, height]);

  // Initialize Fabric.js canvas with enhanced touch support
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'white',
      isDrawingMode: false, // We'll handle drawing manually for better touch control
      selection: false,
      allowTouchScrolling: false,
      enableRetinaScaling: true,
      renderOnAddRemove: false, // Manual rendering for performance
    });

    fabricCanvasRef.current = canvas;

    // Configure high-performance rendering
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = tools.brushSize || 5;
    canvas.freeDrawingBrush.color = tools.brushColor || '#000000';

    return () => {
      canvas.dispose();
    };
  }, [width, height]);

  // Enhanced touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!fabricCanvasRef.current) return;
    
    e.preventDefault();
    
    const canvas = fabricCanvasRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const newTouches = new Map(activeTouches);
    
    // Process each new touch point
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!touch) continue;
      
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: (touch.clientX - rect.left) * (width / rect.width),
        y: (touch.clientY - rect.top) * (height / rect.height),
        pressure: (touch as any).force || 0.5, // Pressure sensitivity if available
        timestamp: Date.now(),
        type: 'start'
      };
      
      newTouches.set(touch.identifier, touchPoint);
    }
    
    setActiveTouches(newTouches);
    
    // Start drawing if single touch and not in gesture mode
    if (newTouches.size === 1 && !enableGestures) {
      const touchPoint = Array.from(newTouches.values())[0];
      if (touchPoint) {
        startDrawing(touchPoint);
      }
      
      // Haptic feedback
      if (hapticFeedback) {
        vibrate(10);
      }
    }
    
    setIsDrawing(newTouches.size === 1);
  }, [activeTouches, enableGestures, hapticFeedback, width, height]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!fabricCanvasRef.current) return;
    
    e.preventDefault();
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const newTouches = new Map(activeTouches);
    
    // Update existing touch points
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!touch) continue;
      
      const existingTouch = newTouches.get(touch.identifier);
      
      if (existingTouch) {
        const touchPoint: TouchPoint = {
          id: touch.identifier,
          x: (touch.clientX - rect.left) * (width / rect.width),
          y: (touch.clientY - rect.top) * (height / rect.height),
          pressure: (touch as any).force || existingTouch.pressure,
          timestamp: Date.now(),
          type: 'move'
        };
        
        newTouches.set(touch.identifier, touchPoint);
      }
    }
    
    setActiveTouches(newTouches);
    
    // Continue drawing if single touch
    if (newTouches.size === 1 && isDrawing) {
      const touchPoint = Array.from(newTouches.values())[0];
      if (touchPoint) {
        continueDrawing(touchPoint);
      }
    }
    
    // Update performance metrics
    updatePerformanceMetrics();
  }, [activeTouches, isDrawing, width, height]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!fabricCanvasRef.current) return;
    
    e.preventDefault();
    
    const newTouches = new Map(activeTouches);
    
    // Remove ended touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!touch) continue;
      
      newTouches.delete(touch.identifier);
    }
    
    setActiveTouches(newTouches);
    
    // End drawing if no more touches
    if (newTouches.size === 0 && isDrawing) {
      endDrawing();
      setIsDrawing(false);
    }
  }, [activeTouches, isDrawing]);

  // Drawing functions with pressure sensitivity and smoothing
  const startDrawing = useCallback((touchPoint: TouchPoint) => {
    if (!fabricCanvasRef.current) return;
    
    const strokeId = `stroke_${strokeIdRef.current++}`;
    const newStroke: StrokeData = {
      id: strokeId,
      points: [touchPoint],
      tool: {
        type: tools.tool || 'brush',
        size: pressureSensitivity ? (tools.brushSize || 5) * touchPoint.pressure : (tools.brushSize || 5),
        color: tools.brushColor || '#000000',
        opacity: 1
      },
      timestamp: Date.now(),
      pressure: touchPoint.pressure
    };
    
    setCurrentStroke(newStroke);
  }, [tools, pressureSensitivity]);

  const continueDrawing = useCallback((touchPoint: TouchPoint) => {
    if (!currentStroke) return;
    
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, touchPoint]
    };
    
    setCurrentStroke(updatedStroke);
    
    // Apply smoothing algorithm
    if (updatedStroke.points.length >= 3) {
      const smoothedPoints = applySmoothingAlgorithm(updatedStroke.points, smoothingFactor);
      
      // Send to worker for rendering if available
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'drawStroke',
          data: {
            points: smoothedPoints,
            tool: updatedStroke.tool
          }
        });
      } else {
        // Fallback to main thread rendering
        renderStrokeOnCanvas(smoothedPoints, updatedStroke.tool);
      }
    }
  }, [currentStroke, smoothingFactor]);

  const endDrawing = useCallback(() => {
    if (!currentStroke || !fabricCanvasRef.current) return;
    
    // Finalize the stroke
    const canvas = fabricCanvasRef.current;
    const imageData = canvas.toDataURL({ format: 'png', quality: 0.8, multiplier: 1 });
    
    // Create drawing data
    const drawingData: DrawingData = {
      imageData,
      strokes: [currentStroke],
      metadata: {
        width,
        height,
        devicePixelRatio: window.devicePixelRatio,
        timestamp: Date.now(),
        strokeCount: 1
      }
    };
    
    // Throttled update to parent
    throttledDrawingUpdate(imageData);
    
    setCurrentStroke(null);
    
    // Haptic feedback for stroke completion
    if (hapticFeedback) {
      vibrate(5);
    }
  }, [currentStroke, width, height, hapticFeedback, throttledDrawingUpdate]);

  // Smoothing algorithm for natural drawing
  const applySmoothingAlgorithm = useCallback((points: TouchPoint[], factor: number): TouchPoint[] => {
    if (points.length < 3) return points;
    
    const firstPoint = points[0];
    if (!firstPoint) return points;
    
    const smoothedPoints: TouchPoint[] = [firstPoint];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      
      if (!prev || !current || !next) continue;
      
      const smoothedPoint: TouchPoint = {
        ...current,
        x: current.x + (prev.x + next.x - 2 * current.x) * factor,
        y: current.y + (prev.y + next.y - 2 * current.y) * factor
      };
      
      smoothedPoints.push(smoothedPoint);
    }
    
    const lastPoint = points[points.length - 1];
    if (lastPoint) {
      smoothedPoints.push(lastPoint);
    }
    return smoothedPoints;
  }, []);

  // Render stroke on canvas (fallback method)
  const renderStrokeOnCanvas = useCallback((points: TouchPoint[], tool: DrawingTool) => {
    if (!fabricCanvasRef.current || points.length < 2) return;
    
    const canvas = fabricCanvasRef.current;
    const ctx = canvas.getContext() as CanvasRenderingContext2D;
    
    ctx.save();
    ctx.globalCompositeOperation = tool.type === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = tool.color;
    ctx.lineWidth = tool.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = tool.opacity;
    
    ctx.beginPath();
    const firstPoint = points[0];
    if (!firstPoint) return;
    
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const prevPoint = points[i - 1];
      
      if (!point || !prevPoint) continue;
      
      // Use quadratic curves for smooth lines
      const cpx = (prevPoint.x + point.x) / 2;
      const cpy = (prevPoint.y + point.y) / 2;
      ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpx, cpy);
    }
    
    ctx.stroke();
    ctx.restore();
    
    canvas.renderAll();
  }, []);

  // Performance monitoring
  const updatePerformanceMetrics = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastFrameTimeRef.current;
    
    if (deltaTime > 0) {
      const fps = Math.round(1000 / deltaTime);
      const baseMetrics = getPerformanceMetrics();
      const metrics: PerformanceMetrics = {
        fps,
        renderTime: deltaTime,
        memoryUsage: baseMetrics.memoryUsage || 0,
        networkLatency: baseMetrics.networkLatency || 0,
        cacheHitRate: baseMetrics.cacheHitRate || 0,
        batteryLevel: baseMetrics.batteryLevel,
        connectionType: baseMetrics.connectionType
      };
      
      setPerformanceMetrics(metrics);
      debouncedPerformanceUpdate(metrics);
    }
    
    lastFrameTimeRef.current = now;
  }, [debouncedPerformanceUpdate]);

  // Attach touch event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !preventScrolling) return;

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScrolling]);

  return (
    <motion.div
      className="enhanced-touch-canvas-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="block touch-none select-none"
          width={width}
          height={height}
          style={{
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            width: `${width}px`,
            height: `${height}px`,
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: 'white'
          }}
        />
        
        {/* Touch indicators */}
        {Array.from(activeTouches.values()).map((touch) => (
          <motion.div
            key={touch.id}
            className="absolute pointer-events-none"
            style={{
              left: touch.x - 10,
              top: touch.y - 10,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
              border: '2px solid #3b82f6'
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          />
        ))}
        
        {/* Drawing state indicator */}
        {isDrawing && (
          <motion.div
            className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            Drawing...
          </motion.div>
        )}
        
        {/* Performance metrics (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-75 p-1 rounded">
            FPS: {performanceMetrics.fps} | Touches: {activeTouches.size}
          </div>
        )}
      </div>
    </motion.div>
  );
}