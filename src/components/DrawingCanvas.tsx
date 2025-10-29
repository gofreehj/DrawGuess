'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, PencilBrush } from 'fabric';
import { 
  exportCanvasForAI, 
  exportCanvasHighQuality, 
  hasDrawingContent, 
  getCanvasStats,
  downloadCanvas,
  ExportResult 
} from '../utils/canvasExport';

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
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasStats, setCanvasStats] = useState({ objectCount: 0, hasContent: false });

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

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas with touch support
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

    // Enhanced touch support for mobile devices
    const canvasElement = canvas.getElement();
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      setIsDrawing(true);
      
      // Ensure proper touch handling for drawing
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (!touch) return;
        
        const rect = canvasElement.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Trigger mouse down event for fabric.js
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true
        });
        canvasElement.dispatchEvent(mouseEvent);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      // Handle single touch drawing
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (!touch) return;
        
        // Trigger mouse move event for fabric.js
        const mouseEvent = new MouseEvent('mousemove', {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true
        });
        canvasElement.dispatchEvent(mouseEvent);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setIsDrawing(false);
      
      // Trigger mouse up event for fabric.js
      const mouseEvent = new MouseEvent('mouseup', {
        bubbles: true
      });
      canvasElement.dispatchEvent(mouseEvent);
    };

    // Prevent scrolling and zooming while drawing
    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      setIsDrawing(false);
    };

    canvasElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvasElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvasElement.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    // Store event handlers for cleanup
    const cleanup = () => {
      canvasElement.removeEventListener('touchstart', handleTouchStart);
      canvasElement.removeEventListener('touchmove', handleTouchMove);
      canvasElement.removeEventListener('touchend', handleTouchEnd);
      canvasElement.removeEventListener('touchcancel', handleTouchCancel);
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
  }, [width, height, onDrawingChange, onCanvasReady]);

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
  }, [tools]);

  // Clear canvas function
  const clearCanvas = () => {
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
  };

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
      
      {/* Drawing status indicator */}
      {isDrawing && (
        <div className="mt-2 text-sm text-blue-600 font-medium">
          Drawing...
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