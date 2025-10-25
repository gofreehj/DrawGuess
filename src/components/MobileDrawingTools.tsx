'use client';

import { useState } from 'react';

interface DrawingTools {
  brushSize: number;
  brushColor: string;
  tool: 'brush' | 'eraser';
}

interface MobileDrawingToolsProps {
  tools: DrawingTools;
  onToolsChange: (tools: DrawingTools) => void;
  onClearCanvas: () => void;
  isCompact?: boolean;
}

export default function MobileDrawingTools({ 
  tools, 
  onToolsChange, 
  onClearCanvas,
  isCompact = false 
}: MobileDrawingToolsProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);

  // Predefined colors optimized for mobile
  const presetColors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#808080'
  ];

  // Predefined brush sizes for quick selection
  const presetSizes = [2, 5, 10, 15, 25, 35];

  const handleToolChange = (tool: 'brush' | 'eraser') => {
    onToolsChange({ ...tools, tool });
  };

  const handleBrushSizeChange = (size: number) => {
    onToolsChange({ ...tools, brushSize: size });
    setShowSizePicker(false);
  };

  const handleColorChange = (color: string) => {
    onToolsChange({ ...tools, brushColor: color });
    setShowColorPicker(false);
  };

  if (isCompact) {
    // Compact horizontal toolbar for mobile
    return (
      <div className="bg-white border-t border-gray-200 p-2 flex items-center justify-between space-x-2 sticky bottom-0 z-10">
        {/* Tool Selection */}
        <div className="flex space-x-1">
          <button
            onClick={() => handleToolChange('brush')}
            className={`p-2 rounded-lg transition-colors ${
              tools.tool === 'brush'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Brush"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => handleToolChange('eraser')}
            className={`p-2 rounded-lg transition-colors ${
              tools.tool === 'eraser'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Eraser"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Size Picker */}
        <div className="relative">
          <button
            onClick={() => setShowSizePicker(!showSizePicker)}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
            title={`Brush size: ${tools.brushSize}px`}
          >
            <div 
              className="rounded-full bg-gray-800"
              style={{ 
                width: `${Math.max(Math.min(tools.brushSize / 2, 12), 4)}px`,
                height: `${Math.max(Math.min(tools.brushSize / 2, 12), 4)}px`
              }}
            />
            <span className="text-xs font-medium">{tools.brushSize}</span>
          </button>
          
          {showSizePicker && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex space-x-1">
              {presetSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleBrushSizeChange(size)}
                  className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                    tools.brushSize === size
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{ minWidth: '40px' }}
                >
                  <div 
                    className={`rounded-full ${tools.brushSize === size ? 'bg-white' : 'bg-gray-800'}`}
                    style={{ 
                      width: `${Math.max(Math.min(size / 2, 12), 4)}px`,
                      height: `${Math.max(Math.min(size / 2, 12), 4)}px`
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Picker (only for brush) */}
        {tools.tool === 'brush' && (
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title={`Color: ${tools.brushColor}`}
            >
              <div
                className="w-6 h-6 rounded border-2 border-gray-300"
                style={{ backgroundColor: tools.brushColor }}
              />
            </button>
            
            {showColorPicker && (
              <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
                        tools.brushColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={tools.brushColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Clear Button */}
        <button
          onClick={onClearCanvas}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          title="Clear canvas"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  }

  // Full mobile tools panel
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Drawing Tools</h3>
      
      {/* Tool Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tool</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleToolChange('brush')}
            className={`p-3 rounded-lg border transition-colors flex items-center justify-center space-x-2 ${
              tools.tool === 'brush'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Brush</span>
          </button>
          <button
            onClick={() => handleToolChange('eraser')}
            className={`p-3 rounded-lg border transition-colors flex items-center justify-center space-x-2 ${
              tools.tool === 'eraser'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Eraser</span>
          </button>
        </div>
      </div>

      {/* Brush Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size: {tools.brushSize}px
        </label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {presetSizes.map((size) => (
            <button
              key={size}
              onClick={() => handleBrushSizeChange(size)}
              className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
                tools.brushSize === size
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div 
                className={`rounded-full ${tools.brushSize === size ? 'bg-white' : 'bg-gray-800'}`}
                style={{ 
                  width: `${Math.max(Math.min(size / 2, 12), 4)}px`,
                  height: `${Math.max(Math.min(size / 2, 12), 4)}px`
                }}
              />
              <span className="ml-2 text-sm">{size}</span>
            </button>
          ))}
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={tools.brushSize}
          onChange={(e) => onToolsChange({ ...tools, brushSize: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Color Selection (only for brush tool) */}
      {tools.tool === 'brush' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
          
          {/* Current Color Display */}
          <div className="flex items-center space-x-2 mb-3">
            <div
              className="w-10 h-10 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: tools.brushColor }}
            />
            <span className="text-sm text-gray-600 font-mono">{tools.brushColor}</span>
          </div>

          {/* Preset Colors */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-12 h-12 rounded-lg border-2 transition-transform hover:scale-105 ${
                  tools.brushColor === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Custom Color Picker */}
          <input
            type="color"
            value={tools.brushColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-12 rounded-lg border border-gray-300 cursor-pointer"
          />
        </div>
      )}

      {/* Clear Canvas */}
      <button
        onClick={onClearCanvas}
        className="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Clear Canvas</span>
      </button>
    </div>
  );
}