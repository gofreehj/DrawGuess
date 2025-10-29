'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, PencilBrush } from 'fabric';
import { 
  exportCanvasForAI, 
  exportCanvasHighQuality, 
  hasDrawingContent, 
  getCanvasStats,
  downloadCanvas,
  ExportResult 
} from '../utils/canvasExport';
import { createGestureHandler, GestureHandler } from '../lib/gesture-recognition';
import { createPalmRejectionSystem } from '../lib/palm-rejection';
import { getDeviceInfo, vibrate } from '../utils/mobile';
import { TouchPoint, DeviceInfo } from '../types/mobile';

interface DrawingTools {
  brushSize: number;
  brushColor: string;
  tool: 'brush' | 'eraser';
}

interface DrawingCanvasProps {
  width?: number;
  height?: number;
  onDrawingChange?: (imageData: string) => void;
  onExportForAI?: (exportResult: ExportResult) => void;
  tools?: DrawingTools;
  onClearCanvas?: () => void;
  onCanvasReady?: (exportFunctions: CanvasExportFunctions) => void;
}

interface CanvasExportFunctions {
  exportForAI: () => Promise<ExportResult>;
  exportHighQuality: () => Promise<ExportResult>;
  hasContent: () => boolean;
  getStats: () => ReturnType<typeof getCanvasStats>;
  downloadCanvas: (filename?: string) => void;
}

export default function DrawingCanvas({ 
  width = 600, 
  height = 400, 
  onDrawingChange,
  onExportForAI,
  tools = { brushSize: 5, brushColor: '#000000', tool: 'brush' },
  onClearCanvas,
  onCanvasReady
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const gestureEngineRef = useRef<any>(null);
  const palmRejectionRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasStats, setCanvasStats] = useState({ objectCount: 0, hasContent: false });
  const [activeTouches, setActiveTouches] = useState<Map<number, TouchPoint>>(new Map());
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    userAgent: '',
    platform: '',
    screenSize: { width: 1920, height: 1080 },
    pixelRatio: 1,
    touchSupport: false,
    orientation: 'unknown',
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    isTablet: false,
  });

  // Initialize device info on client side only
  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  // Export functions that will be exposed to parent components
  const exportForAI = async (): Promise<ExportResult> => {
    if (!fabricCanvasRef.current) {
      throw new Error('Canvas not initialized');
    }
    return await exportCanvasForAI(fabricCanvasRef.current);
  };

  const exportHighQuality = async (): Promise<ExportResult> => {
    if (!fabricCanvasRef.current) {
      throw new Error('Canvas not initialized');
    }
    return await exportCanvasHighQuality(fabricCanvasRef.current);
  };

  const hasContent = (): boolean => {
    if (!fabricCanvasRef.current) return false;
    return hasDrawingContent(fabricCanvasRef.current);
  };

  const getStats = () => {
    if (!fabricCanvasRef.current) {
      return { objectCount: 0, hasContent: false, canvasSize: { width: 0, height: 0 }, bounds: null };
    }
    return getCanvasStats(fabricCanvasRef.current);
  };

  const downloadCanvasFile = (filename: string = 'drawing.png') => {
    if (!fabricCanvasRef.current) return;
    downloadCanvas(fabricCanvasRef.current, filename);
  };

  // Enhanced touch event handlers
  const handleEnhancedTouchStart = useCallback((e: TouchEvent) => {
    if (!fabricCanvasRef.current || !canvasRef.current) return;
    
    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newTouches = new Map(activeTouches);
    
    // Process each new touch point
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (!touch) continue;
      
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: (touch.clientX - rect.left) * (width / rect.width),
        y: (touch.clientY - rect.top) * (height / rect.height),
        pressure: (touch as any).force || 0.5,
        timestamp: Date.now(),
        type: 'start'
      };
      
      // Check palm rejection
      if (palmRejectionRef.current) {
        const allTouchPoints = Array.from(newTouches.values()).concat([touchPoint]);
        const isValidTouch = palmRejectionRef.current.isValidDrawingTouch(touchPoint, allTouchPoints);
        
        if (!isValidTouch) {
          console.log('Touch rejected by palm rejection system');
          return;
        }
      }
      
      newTouches.set(touch.identifier, touchPoint);
    }
    
    setActiveTouches(newTouches);
    
    // Start drawing if single touch
    if (newTouches.size === 1) {
      setIsDrawing(true);
      // Haptic feedback for drawing start
      if (deviceInfo.isMobile) {
        vibrate(10);
      }
    }
  }, [activeTouches, width, height, deviceInfo.isMobile]);

  const handleEnhancedTouchMove = useCallback((e: TouchEvent) => {
    if (!fabricCanvasRef.current || !canvasRef.current) return;
    
    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
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
  }, [activeTouches, width, height]);

  const handleEnhancedTouchEnd = useCallback((e: TouchEvent) => {
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
      setIsDrawing(false);
      // Haptic feedback for drawing end
      if (deviceInfo.isMobile) {
        vibrate(5);
      }
    }
  }, [activeTouches, isDrawing, deviceInfo.isMobile]);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas with enhanced touch support
    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'white',
      isDrawingMode: true,
      selection: false,
      // Enable touch interactions
      allowTouchScrolling: false,
      enableRetinaScaling: true,
    });

    fabricCanvasRef.current = canvas;

    // Configure drawing brush with better settings
    const brush = new PencilBrush(canvas);
    brush.width = tools.brushSize;
    brush.color = tools.brushColor;
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    canvas.freeDrawingBrush = brush;

    // Handle drawing events for both mouse and touch
    canvas.on('path:created', () => {
      // Update canvas stats
      const stats = getCanvasStats(canvas);
      setCanvasStats(stats);

      if (onDrawingChange) {
        const imageData = canvas.toDataURL({ 
          format: 'png', 
          multiplier: 1,
          quality: 0.8 
        });
        onDrawingChange(imageData);
      }
    });

    // Track drawing state for UI feedback
    canvas.on('mouse:down', () => {
      setIsDrawing(true);
    });

    canvas.on('mouse:up', () => {
      setIsDrawing(false);
    });

    // Additional mouse events for better drawing state tracking
    canvas.on('mouse:move', () => {
      // This helps track drawing state during mouse movement
    });

    // Initialize enhanced touch systems for mobile devices
    const canvasElement = canvas.getElement();
    
    // Initialize palm rejection system
    if (deviceInfo.isMobile) {
      palmRejectionRef.current = createPalmRejectionSystem({
        enabled: true,
        palmSizeThreshold: 40,
        palmPressureThreshold: 0.3,
        edgeMargin: 30,
        timeWindow: 500,
        confidenceThreshold: 0.6,
        adaptiveLearning: true
      });
      
      palmRejectionRef.current.initialize(canvasElement);
    }
    
    // Initialize gesture recognition for advanced interactions
    if (deviceInfo.isMobile) {
      const gestureHandlers: GestureHandler = {
        onPinchZoom: (scale: number, center: { x: number; y: number }) => {
          // Handle pinch zoom for canvas
          console.log('Pinch zoom:', scale, center);
        },
        onDoubleTap: (point: { x: number; y: number }) => {
          // Handle double tap (could be used for tool switching)
          console.log('Double tap:', point);
          vibrate(20);
        },
        onLongPress: (point: { x: number; y: number }) => {
          // Handle long press (could show context menu)
          console.log('Long press:', point);
          vibrate([50, 50, 50]);
        }
      };
      
      createGestureHandler(canvasElement, gestureHandlers, {
        enablePinchZoom: false, // Disable for drawing mode
        enablePan: false, // Disable for drawing mode
        enableRotation: false,
        preventBrowserGestures: true,
        sensitivity: 1.0
      }).then((engine) => {
        gestureEngineRef.current = engine;
      }).catch((error) => {
        console.warn('Failed to initialize gesture engine:', error);
      });
    }

    // Enhanced touch event listeners
    canvasElement.addEventListener('touchstart', handleEnhancedTouchStart, { passive: false });
    canvasElement.addEventListener('touchmove', handleEnhancedTouchMove, { passive: false });
    canvasElement.addEventListener('touchend', handleEnhancedTouchEnd, { passive: false });
    canvasElement.addEventListener('touchcancel', handleEnhancedTouchEnd, { passive: false });

    // Store event handlers for cleanup
    const cleanup = () => {
      canvasElement.removeEventListener('touchstart', handleEnhancedTouchStart);
      canvasElement.removeEventListener('touchmove', handleEnhancedTouchMove);
      canvasElement.removeEventListener('touchend', handleEnhancedTouchEnd);
      canvasElement.removeEventListener('touchcancel', handleEnhancedTouchEnd);
      
      // Cleanup enhanced touch systems
      if (gestureEngineRef.current) {
        gestureEngineRef.current.destroy();
      }
      
      canvas.dispose();
    };

    // Provide export functions to parent component
    if (onCanvasReady) {
      onCanvasReady({
        exportForAI,
        exportHighQuality,
        hasContent,
        getStats,
        downloadCanvas: downloadCanvasFile
      });
    }

    // Cleanup function
    return cleanup;
  }, [width, height, onDrawingChange, onCanvasReady, handleEnhancedTouchStart, handleEnhancedTouchMove, handleEnhancedTouchEnd, deviceInfo.isMobile]);

  // Update brush settings when tools change
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    if (tools.tool === 'brush') {
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.width = tools.brushSize;
      brush.color = tools.brushColor;
      brush.strokeLineCap = 'round';
      brush.strokeLineJoin = 'round';
      canvas.freeDrawingBrush = brush;
    } else if (tools.tool === 'eraser') {
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.width = tools.brushSize;
      brush.color = canvas.backgroundColor as string || 'white'; // Eraser uses background color
      brush.strokeLineCap = 'round';
      brush.strokeLineJoin = 'round';
      canvas.freeDrawingBrush = brush;
    }
  }, [tools.tool, tools.brushSize, tools.brushColor]);

  // Clear canvas function
  const clearCanvas = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = 'white';
      fabricCanvasRef.current.renderAll();
      
      // Update canvas stats
      const stats = getCanvasStats(fabricCanvasRef.current);
      setCanvasStats(stats);
      
      if (onDrawingChange) {
        const imageData = fabricCanvasRef.current.toDataURL({ format: 'png', multiplier: 1 });
        onDrawingChange(imageData);
      }
      
      if (onClearCanvas) {
        onClearCanvas();
      }
    }
  }, [onClearCanvas]);

  return (
    <div className="drawing-canvas-container">
      <div className="canvas-wrapper border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas 
          ref={canvasRef}
          className="block touch-none"
          width={width}
          height={height}
          style={{ 
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            width: `${width}px`,
            height: `${height}px`,
            display: 'block'
          }}
        />
      </div>
      
      {/* Enhanced drawing status indicator */}
      {isDrawing && (
        <div className="mt-2 text-sm text-blue-600 font-medium flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span>Drawing... {activeTouches.size > 1 ? `(${activeTouches.size} touches)` : ''}</span>
        </div>
      )}
      
      {/* Touch indicators for multi-touch */}
      {deviceInfo.isMobile && activeTouches.size > 1 && (
        <div className="mt-1 text-xs text-orange-600 text-center">
          Multi-touch detected - Palm rejection active
        </div>
      )}
      
      {/* Canvas info display */}
      <div className="mt-2 text-xs text-gray-500 text-center space-y-1">
        <div>Canvas: {width} × {height}px</div>
        <div>Objects: {canvasStats.objectCount} | Has Content: {canvasStats.hasContent ? 'Yes' : 'No'}</div>
      </div>

      {/* Export controls for testing */}
      {canvasStats.hasContent && (
        <div className="mt-3 flex gap-2 justify-center">
          <button
            onClick={async () => {
              try {
                const result = await exportForAI();
                console.log('AI Export Result:', result);
                if (onExportForAI) {
                  onExportForAI(result);
                }
              } catch (error) {
                console.error('Export for AI failed:', error);
              }
            }}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export for AI
          </button>
          <button
            onClick={() => downloadCanvasFile()}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download
          </button>
        </div>
      )}
    </div>
  );
}