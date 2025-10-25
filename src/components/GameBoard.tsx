'use client';

import { useState, useCallback, useEffect } from 'react';
import ResponsiveDrawingArea from './ResponsiveDrawingArea';
import CallLogDisplay from './CallLogDisplay';
import ResultDisplay from './ResultDisplay';
import GameHistory from './GameHistory';
import StatusIndicator, { NetworkStatus } from './StatusIndicator';
import LoadingSpinner, { PulsingDots } from './LoadingSpinner';
import ProgressIndicator from './ProgressIndicator';
import { ToastContainer, useToast } from './Toast';
import { GameResult } from '@/types/game';

type GameState = 'waiting' | 'drawing' | 'submitting' | 'completed';

interface GameSession {
  sessionId: string;
  prompt: string;
  promptCategory: string;
}

// Hook for detecting mobile device
function useIsMobile() {
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

// Hook for detecting online status
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}



// GameBoard component - Main game interface
export default function GameBoard() {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [currentDrawing, setCurrentDrawing] = useState<string>('');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [aiProcessingStage, setAIProcessingStage] = useState<'uploading' | 'analyzing' | 'processing' | 'complete'>('uploading');
  
  // Use custom hooks
  const isMobile = useIsMobile();
  const isOnline = useOnlineStatus();
  const toast = useToast();

  // Handle drawing changes from the canvas
  const handleDrawingChange = useCallback((imageData: string) => {
    setCurrentDrawing(imageData);
  }, []);

  // Start a new game
  const startNewGame = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to start game');
      }

      const data = await response.json();

      setCurrentSession({
        sessionId: data.sessionId,
        prompt: data.prompt,
        promptCategory: data.promptCategory,
      });

      setGameState('drawing');
      setCurrentDrawing('');
      setGameResult(null);
      
      // Show success toast
      toast.success('Game started!', 'Draw the animal shown above');

    } catch (err) {
      console.error('Error starting game:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start game';
      setError(errorMessage);
      
      // Show error toast
      toast.error('Failed to start game', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit the drawing for AI analysis with enhanced loading states
  const submitDrawing = async () => {
    if (!currentSession || !currentDrawing) {
      setError('No drawing to submit');
      return;
    }

    setGameState('submitting');
    setError(null);
    setAIProcessingStage('uploading');

    try {
      // Stage 1: Uploading
      setAIProcessingStage('uploading');
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX

      const response = await fetch('/api/game/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          imageData: currentDrawing,
        }),
      });

      // Stage 2: Analyzing
      setAIProcessingStage('analyzing');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to submit drawing');
      }

      // Stage 3: Processing results
      setAIProcessingStage('processing');
      const data = await response.json();

      // 调试日志
      console.log('🔍 GameBoard - Received data:', {
        hasAiCallLog: !!data.aiCallLog,
        aiCallLogProvider: data.aiCallLog?.provider,
        aiCallLogSuccess: data.aiCallLog?.success
      });

      // Stage 4: Complete
      setAIProcessingStage('complete');
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief delay to show completion

      setGameResult({
        originalPrompt: data.originalPrompt,
        aiGuess: data.aiGuess,
        confidence: data.confidence,
        isCorrect: data.isCorrect,
        reasoning: data.reasoning,
        duration: data.duration,
        drawing: currentDrawing, // 添加用户绘画数据
        aiCallLog: data.aiCallLog,
      });

      setGameState('completed');
      
      // Show result toast
      if (data.isCorrect) {
        toast.success('Correct guess!', `AI correctly identified your ${data.originalPrompt}`);
      } else {
        toast.info('Good try!', `AI guessed "${data.aiGuess}" but you drew "${data.originalPrompt}"`);
      }

    } catch (err) {
      console.error('Error submitting drawing:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit drawing';
      setError(errorMessage);
      setGameState('drawing'); // Return to drawing state on error
      
      // Show error toast
      toast.error('Submission failed', errorMessage, {
        action: {
          label: 'Try Again',
          onClick: () => {
            setError(null);
            submitDrawing();
          }
        }
      });
    }
  };

  // Reset game to initial state
  const resetGame = () => {
    setGameState('waiting');
    setCurrentSession(null);
    setCurrentDrawing('');
    setGameResult(null);
    setError(null);
  };

  return (
    <div className={`game-board ${isMobile ? 'p-4' : 'p-6'} max-w-7xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg min-h-[calc(100vh-200px)]`}>
      {/* Network Status Indicator */}
      {!isOnline && (
        <div className="mb-6">
          <NetworkStatus isOnline={isOnline} />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <StatusIndicator
            status="error"
            message="Something went wrong"
            details={error}
          />
        </div>
      )}

      {/* Game State Display */}
      <div className="game-state-display bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Game State Header */}
        <div className="text-center mb-4">
          <h2 className={`text-lg font-semibold ${gameState === 'waiting' ? 'text-blue-600' :
              gameState === 'drawing' ? 'text-green-600' :
                gameState === 'submitting' ? 'text-yellow-600' :
                  'text-purple-600'
            }`}>
            {gameState === 'waiting' ? 'Ready to start a new game?' :
              gameState === 'drawing' ? 'Draw the animal shown above!' :
                gameState === 'submitting' ? 'Analyzing your drawing...' :
                  'Game completed! Want to play again?'}
          </h2>
        </div>

        {/* Prompt Display */}
        {currentSession?.prompt && (
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-dashed border-blue-200">
              <div className="mb-2">
                <span className="text-sm text-gray-500 uppercase tracking-wide">
                  Draw this animal:
                </span>
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {currentSession.prompt}
              </div>
              {currentSession.promptCategory && (
                <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {currentSession.promptCategory}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          {gameState === 'waiting' && (
            <button
              onClick={startNewGame}
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
              onClick={resetGame}
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

      {/* Drawing Area - Only show when drawing */}
      {gameState === 'drawing' && (
        <div className="mb-6">
          <ResponsiveDrawingArea
            width={isMobile ? 350 : 600}
            height={isMobile ? 250 : 400}
            onDrawingChange={handleDrawingChange}
            className="mx-auto"
          />

          {/* Submit Button */}
          <div className="text-center mt-4">
            <button
              onClick={submitDrawing}
              disabled={!currentDrawing || currentDrawing.length === 0 || !isOnline}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              {!isOnline ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
                  </svg>
                  <span>No Connection</span>
                </>
              ) : (
                <span>Submit Drawing</span>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              {!isOnline 
                ? 'Please check your internet connection'
                : 'Make sure you\'ve drawn something before submitting!'
              }
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Loading State - Show when submitting */}
      {gameState === 'submitting' && (
        <div className="mb-6">
          {/* Show user's drawing while AI is analyzing */}
          {currentDrawing && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 font-medium mb-3 text-center">Your Drawing:</div>
              <div className="flex justify-center">
                <div className="bg-white rounded-lg border-2 border-gray-200 p-2 shadow-sm">
                  <img
                    src={currentDrawing}
                    alt="User's drawing being analyzed"
                    className={`${isMobile ? 'max-w-xs max-h-48' : 'max-w-xs max-h-64'} object-contain rounded`}
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Progress Indicator */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-800 mb-4 text-center`}>
                AI is analyzing your drawing...
              </h3>
              
              {/* Progress Indicator */}
              <ProgressIndicator
                steps={['Upload', 'Analyze', 'Process', 'Complete']}
                currentStep={['uploading', 'analyzing', 'processing', 'complete'].indexOf(aiProcessingStage)}
                className="mb-4"
              />
              
              <p className="text-gray-600 text-center text-sm">
                This may take a few moments. Please wait.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      <ResultDisplay
        result={gameResult || undefined}
        isVisible={gameState === 'completed'}
        onNewGame={resetGame}
      />

      {/* Call Log Display */}
      {gameResult?.aiCallLog && (
        <div className="mb-6">
          <CallLogDisplay
            callLog={gameResult.aiCallLog}
            isVisible={gameState === 'completed'}
            title="LLM API Call Details"
          />
        </div>
      )}

      {/* Game Statistics - Optional footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Powered by AI • Built with Next.js</p>
      </div>

      {/* Game History Modal */}
      <GameHistory
        isVisible={showHistory}
        onClose={() => setShowHistory(false)}
      />
      
      {/* Toast Container */}
      <ToastContainer
        toasts={toast.toasts}
        onClose={toast.removeToast}
        position={isMobile ? 'top-center' : 'top-right'}
      />
    </div>
  );
}