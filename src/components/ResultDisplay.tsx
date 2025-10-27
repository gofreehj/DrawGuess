'use client';

import { useState } from 'react';
import { AICallLog } from '@/types/game';
import SmartImage from './SmartImage';

interface GameResult {
  originalPrompt: string;
  aiGuess: string;
  confidence: number;
  isCorrect: boolean;
  reasoning?: string;
  duration?: number;
  drawing?: string;
  aiCallLog?: AICallLog;
  sessionId?: string; // Add sessionId for SmartImage
  userId?: string; // Add userId for SmartImage
}

interface ResultDisplayProps {
  result?: GameResult;
  isVisible: boolean;
  onNewGame: () => void;
}

export default function ResultDisplay({ result, isVisible, onNewGame }: ResultDisplayProps) {
  if (!isVisible || !result) {
    return null;
  }

  const getResultIcon = () => {
    if (result.isCorrect) {
      return (
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
  };

  const getResultMessage = () => {
    return result.isCorrect ? "Correct! AI guessed it right!" : "Not quite right, but good try!";
  };

  const getResultColor = () => {
    return result.isCorrect ? 'text-green-600' : 'text-red-600';
  };

  const getConfidenceColor = () => {
    if (result.confidence >= 0.8) return 'text-green-600';
    if (result.confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = () => {
    if (result.confidence >= 0.8) return 'Very Confident';
    if (result.confidence >= 0.6) return 'Confident';
    if (result.confidence >= 0.4) return 'Somewhat Confident';
    return 'Not Very Confident';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'Unknown';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return 'Free';
    return `$${cost.toFixed(4)}`;
  };

  const [showAILog, setShowAILog] = useState(false);

  return (
    <div className="result-display bg-white rounded-lg shadow-md p-6 mb-6 animate-fade-in">
      {/* Result Header */}
      <div className="text-center mb-6">
        {getResultIcon()}
        <h3 className={`text-2xl font-bold ${getResultColor()} mb-2`}>
          {getResultMessage()}
        </h3>
      </div>

      {/* Result Details */}
      <div className="space-y-4 mb-6">
        {/* User Drawing Display */}
        {result.drawing && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 font-medium mb-3 text-center">Your Drawing:</div>
            <div className="flex justify-center">
              <div className="bg-white rounded-lg border-2 border-gray-200 p-2 shadow-sm">
                <SmartImage
                  gameId={result.sessionId || 'unknown'}
                  fallbackUrl={result.drawing}
                  userId={result.userId}
                  alt="User's drawing"
                  className="max-w-xs max-h-64"
                  showLoadingState={true}
                  showErrorState={true}
                  retryable={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Original vs AI Guess */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">You were asked to draw:</div>
            <div className="text-xl font-bold text-blue-800">{result.originalPrompt}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium mb-1">AI guessed:</div>
            <div className="text-xl font-bold text-purple-800">{result.aiGuess}</div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">AI Confidence:</span>
            <span className={`text-sm font-bold ${getConfidenceColor()}`}>
              {getConfidenceLabel()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                result.confidence >= 0.8 ? 'bg-green-500' :
                result.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(result.confidence * 100, 5)}%` }}
            ></div>
          </div>
          <div className="text-center">
            <span className={`text-lg font-bold ${getConfidenceColor()}`}>
              {Math.round(result.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* AI Reasoning */}
        {result.reasoning && (
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="text-sm text-indigo-600 font-medium mb-2">AI's Reasoning:</div>
            <div className="italic text-indigo-800">"{result.reasoning}"</div>
          </div>
        )}

        {/* Game Stats */}
        <div className="flex justify-center space-x-6 text-sm text-gray-600">
          {result.duration && (
            <div className="text-center">
              <div className="font-medium text-gray-800">{formatDuration(result.duration)}</div>
              <div>Drawing Time</div>
            </div>
          )}
          <div className="text-center">
            <div className="font-medium text-gray-800">
              {result.isCorrect ? '✓' : '✗'}
            </div>
            <div>Result</div>
          </div>
          {result.aiCallLog && (
            <div className="text-center">
              <div className="font-medium text-gray-800">{formatResponseTime(result.aiCallLog.responseData.responseTime)}</div>
              <div>AI Response</div>
            </div>
          )}
        </div>

        {/* AI Call Log Toggle */}
        {result.aiCallLog && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAILog(!showAILog)}
              className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none"
            >
              {showAILog ? 'Hide' : 'Show'} AI Call Details
            </button>
          </div>
        )}

        {/* AI Call Log Details */}
        {showAILog && result.aiCallLog && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">AI Model Call Log</h4>
            
            <div className="space-y-3 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-600">Provider:</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                    {result.aiCallLog.provider.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Model:</span>
                  <span className="ml-2 text-gray-800 font-mono">{result.aiCallLog.model}</span>
                </div>
              </div>

              {/* Actual Text Prompt */}
              <div className="border-t pt-3">
                <div className="font-medium text-gray-600 mb-2">Actual Text Prompt Sent to LLM:</div>
                <div className="bg-white rounded p-2 border text-xs font-mono max-h-32 overflow-y-auto">
                  {result.aiCallLog.requestData.fullPrompt || 
                   '⚠️ Prompt data not available in call log'}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  🎯 Mode: 🔒 Blind Test | 
                  📸 + Image Data | 
                  📤 → {result.aiCallLog.provider.toUpperCase()} {result.aiCallLog.model}
                </div>
              </div>

              {/* Response Metrics */}
              <div className="border-t pt-3">
                <div className="font-medium text-gray-600 mb-2">Response Metrics:</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded p-2 border text-center">
                    <div className="font-medium text-gray-800">{formatResponseTime(result.aiCallLog.responseData.responseTime)}</div>
                    <div className="text-gray-500">Response Time</div>
                  </div>
                  <div className="bg-white rounded p-2 border text-center">
                    <div className="font-medium text-gray-800">{result.aiCallLog.responseData.tokensUsed || 'N/A'}</div>
                    <div className="text-gray-500">Tokens Used</div>
                  </div>
                  <div className="bg-white rounded p-2 border text-center">
                    <div className="font-medium text-gray-800">{formatCost(result.aiCallLog.cost)}</div>
                    <div className="text-gray-500">Est. Cost</div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.aiCallLog.success 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.aiCallLog.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="border-t pt-3 text-center text-gray-500">
                Called at: {new Date(result.aiCallLog.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={onNewGame}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}