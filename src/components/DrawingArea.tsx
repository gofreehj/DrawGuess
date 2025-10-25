'use client';

import { useState } from 'react';
import DrawingCanvas from './DrawingCanvas';
import DrawingTools from './DrawingTools';
import { ExportResult } from '../utils/canvasExport';

interface DrawingTools {
  brushSize: number;
  brushColor: string;
  tool: 'brush' | 'eraser';
}

interface DrawingAreaProps {
  width?: number;
  height?: number;
  onDrawingChange?: (imageData: string) => void;
  onExportForAI?: (exportResult: ExportResult) => void;
  className?: string;
}

export default function DrawingArea({ 
  width = 600, 
  height = 400, 
  onDrawingChange,
  onExportForAI,
  className = ''
}: DrawingAreaProps) {
  const [tools, setTools] = useState<DrawingTools>({
    brushSize: 5,
    brushColor: '#000000',
    tool: 'brush'
  });

  const [canvasKey, setCanvasKey] = useState(0);

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

  return (
    <div className={`drawing-area ${className}`}>
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
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">Drawing Canvas</h3>
            <DrawingCanvas
              key={canvasKey}
              width={width}
              height={height}
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