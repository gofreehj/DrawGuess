'use client';

import { useState } from 'react';

interface DrawingTools {
  brushSize: number;
  brushColor: string;
  tool: 'brush' | 'eraser';
}

interface DrawingToolsProps {
  tools: DrawingTools;
  onToolsChange: (tools: DrawingTools) => void;
  onClearCanvas: () => void;
}

export default function DrawingTools({ tools, onToolsChange, onClearCanvas }: DrawingToolsProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Predefined colors for quick selection
  const presetColors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
    '#808080', // Gray
  ];

  const handleToolChange = (tool: 'brush' | 'eraser') => {
    onToolsChange({ ...tools, tool });
  };

  const handleBrushSizeChange = (size: number) => {
    onToolsChange({ ...tools, brushSize: size });
  };

  const handleColorChange = (color: string) => {
    onToolsChange({ ...tools, brushColor: color });
    setShowColorPicker(false);
  };

  return (
    <div className="drawing-tools bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Drawing Tools</h3>
      
      {/* Tool Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tool</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleToolChange('brush')}
            className={`px-4 py-2 rounded-md border transition-colors ${
              tools.tool === 'brush'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            🖌️ Brush
          </button>
          <button
            onClick={() => handleToolChange('eraser')}
            className={`px-4 py-2 rounded-md border transition-colors ${
              tools.tool === 'eraser'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            🧽 Eraser
          </button>
        </div>
      </div>

      {/* Brush Size */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size: {tools.brushSize}px
        </label>
        <input
          type="range"
          min="1"
          max="50"
          value={tools.brushSize}
          onChange={(e) => handleBrushSizeChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1px</span>
          <span>50px</span>
        </div>
      </div>

      {/* Color Selection (only for brush tool) */}
      {tools.tool === 'brush' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          
          {/* Current Color Display */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
              style={{ backgroundColor: tools.brushColor }}
              onClick={() => setShowColorPicker(!showColorPicker)}
            />
            <span className="text-sm text-gray-600">{tools.brushColor}</span>
          </div>

          {/* Preset Colors */}
          <div className="grid grid-cols-6 gap-2 mb-2">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
                  tools.brushColor === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>

          {/* Custom Color Picker */}
          {showColorPicker && (
            <div className="mt-2">
              <input
                type="color"
                value={tools.brushColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* Clear Canvas */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={onClearCanvas}
          className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors font-medium"
        >
          🗑️ Clear Canvas
        </button>
      </div>

      {/* Tool Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="text-sm text-blue-800">
          <div className="font-medium">Current Settings:</div>
          <div>Tool: {tools.tool === 'brush' ? '🖌️ Brush' : '🧽 Eraser'}</div>
          <div>Size: {tools.brushSize}px</div>
          {tools.tool === 'brush' && <div>Color: {tools.brushColor}</div>}
        </div>
      </div>
    </div>
  );
}