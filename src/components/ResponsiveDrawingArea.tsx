'use client';

import { useState, useEffect } from 'react';
import DrawingCanvas from './DrawingCanvas';
import DrawingTools from './DrawingTools';
import MobileDrawingTools from './MobileDrawingTools';
import { ExportResult } from '../utils/canvasExport';

interface DrawingTools {
  brushSize: number;
  brushColor: string;
  tool: 'brush' | 'eraser';
}

interface ResponsiveDrawingAreaProps {
  width?: number;
  height?: number;
  onDrawingChange?: (imageData: string) => void;
  onExportForAI?: (exportResult: ExportResult) => void;
  className?: string;
}

export default function ResponsiveDrawingArea({ 
  width = 600, 
  height = 400, 
  onDrawingChange,
  onExportForAI,
  className = ''
}: ResponsiveDrawingAreaProps) {
  const [tools, setTools] = useState<DrawingTools>({
    brushSize: 5,
    brushColor: '#000000',
    tool: 'brush'
  });

  const [canvasKey, setCanvasKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width, height });

  // Detect mobile device and screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768; // Tailwind md breakpoint
      setIsMobile(isMobileDevice);
      
      // Adjust canvas size for mobile
      if (isMobileDevice) {
        const maxWidth = Math.min(window.innerWidth - 32, 400); // 16px padding on each side
        const aspectRatio = height / width;
        const adjustedHeight = Math.min(maxWidth * aspectRatio, 300);
        setCanvasSize({ width: maxWidth, height: adjustedHeight });
      } else {
        setCanvasSize({ width, height });
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [width, height]);

  const handleToolsChange = (newTools: DrawingTools) => {
    setTools(newTools);
  };

  const handleClearCanvas = () => {
    // Force canvas to re-render by changing key
    setCanvasKey(prev => prev + 1);
    
    // Notify parent that canvas was cleared
    if (onDrawingChange) {
      onDrawingChange('');
    }
  };

  if (isMobile) {
    // Mobile layout: vertical stack with compact tools
    return (
      <div className={`responsive-drawing-area ${className}`}>
        <div className="flex flex-col space-y-4">
          {/* Canvas Container */}
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 text-center">Drawing Canvas</h3>
              <p className="text-sm text-gray-600 text-center mt-1">
                Use touch to draw • Pinch to zoom
              </p>
            </div>
            
            <div className="p-4 flex justify-center">
              <DrawingCanvas
                key={canvasKey}
                width={canvasSize.width}
                height={canvasSize.height}
                tools={tools}
                onDrawingChange={onDrawingChange}
                onExportForAI={onExportForAI}
                onClearCanvas={handleClearCanvas}
              />
            </div>
          </div>

          {/* Mobile Tools Panel */}
          <MobileDrawingTools
            tools={tools}
            onToolsChange={handleToolsChange}
            onClearCanvas={handleClearCanvas}
          />
        </div>

        {/* Note: Floating toolbar removed to avoid interference with game UI */}
      </div>
    );
  }

  // Desktop layout: side-by-side
  return (
    <div className={`responsive-drawing-area ${className}`}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Drawing Tools Panel */}
        <div className="lg:w-80 flex-shrink-0">
          <DrawingTools
            tools={tools}
            onToolsChange={handleToolsChange}
            onClearCanvas={handleClearCanvas}
          />
        </div>

        {/* Drawing Canvas */}
        <div className="flex-1 flex justify-center">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">Drawing Canvas</h3>
            <DrawingCanvas
              key={canvasKey}
              width={canvasSize.width}
              height={canvasSize.height}
              tools={tools}
              onDrawingChange={onDrawingChange}
              onExportForAI={onExportForAI}
              onClearCanvas={handleClearCanvas}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for detecting mobile device
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}