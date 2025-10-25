'use client';

import { useState } from 'react';

interface PromptDisplayProps {
  prompt?: string;
  promptCategory?: string;
  gameState: 'waiting' | 'drawing' | 'submitting' | 'completed';
  onStartGame: () => void;
  onNewGame: () => void;
  isLoading?: boolean;
}

// PromptDisplay component - Shows current animal prompt
export default function PromptDisplay({ 
  prompt, 
  promptCategory, 
  gameState, 
  onStartGame, 
  onNewGame,
  isLoading = false 
}: PromptDisplayProps) {
  const getStateMessage = () => {
    switch (gameState) {
      case 'waiting':
        return 'Ready to start a new game?';
      case 'drawing':
        return 'Draw the animal shown above!';
      case 'submitting':
        return 'Analyzing your drawing...';
      case 'completed':
        return 'Game completed! Want to play again?';
      default:
        return '';
    }
  };

  const getStateColor = () => {
    switch (gameState) {
      case 'waiting':
        return 'text-blue-600';
      case 'drawing':
        return 'text-green-600';
      case 'submitting':
        return 'text-yellow-600';
      case 'completed':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="prompt-display bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Game State Header */}
      <div className="text-center mb-4">
        <h2 className={`text-lg font-semibold ${getStateColor()}`}>
          {getStateMessage()}
        </h2>
      </div>

      {/* Prompt Display */}
      {prompt && (
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-dashed border-blue-200">
            <div className="mb-2">
              <span className="text-sm text-gray-500 uppercase tracking-wide">
                Draw this animal:
              </span>
            </div>
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {prompt}
            </div>
            {promptCategory && (
              <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {promptCategory}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {gameState === 'waiting' && (
          <button
            onClick={onStartGame}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Starting...</span>
              </>
            ) : (
              <span>Start New Game</span>
            )}
          </button>
        )}

        {gameState === 'completed' && (
          <button
            onClick={onNewGame}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Starting...</span>
              </>
            ) : (
              <span>Play Again</span>
            )}
          </button>
        )}

        {gameState === 'submitting' && (
          <div className="flex items-center space-x-2 text-yellow-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
            <span className="font-medium">AI is analyzing your drawing...</span>
          </div>
        )}
      </div>

      {/* Drawing Instructions */}
      {gameState === 'drawing' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Tips:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Draw clearly and make your animal recognizable</li>
              <li>Use the drawing tools to adjust brush size and color</li>
              <li>You can use the eraser to fix mistakes</li>
              <li>Click "Submit Drawing" when you're done</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}