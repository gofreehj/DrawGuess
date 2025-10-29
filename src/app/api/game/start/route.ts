import { NextRequest } from 'next/server';
import { databaseManager } from '@/lib/database-manager';
import { ensureServerDatabaseInitialized } from '@/lib/server-startup';
import { createErrorResponse, ERROR_CODES, handleError, createErrorResponseFromAPIError } from '@/lib/error-handler';
import { getDataManager } from '@/lib/data-adapters';

// API route for starting a new game
export async function POST(request: NextRequest) {
  try {
    // 确保服务器数据库已初始化（容错机制）
    await ensureServerDatabaseInitialized();
    
    // Get a random prompt from the database
    const prompt = databaseManager.getRandomPrompt();
    
    if (!prompt) {
      return createErrorResponse(
        ERROR_CODES.NO_PROMPTS_AVAILABLE,
        'No prompts available in the database',
        'Please ensure prompts are properly seeded in the database',
        500
      );
    }

    // Initialize data manager if not already done
    const dataManager = getDataManager();
    if (!dataManager.isInitialized()) {
      await dataManager.initialize();
    }

    // Create a new game session using the data adapter
    const gameSession = await dataManager.createGameSession({
      userId: 'anonymous', // Use default anonymous user
      prompt: prompt.text,
      promptCategory: prompt.category,
      drawing: '', // Will be filled when user submits drawing
      aiGuess: '', // Will be filled after AI recognition
      confidence: 0, // Will be filled after AI recognition
      isCorrect: false, // Will be determined after AI recognition
      startTime: new Date(),
      endTime: new Date(), // Will be updated when game ends
      duration: 0 // Will be calculated when game ends
    });

    // Return the session ID and prompt to the client
    return Response.json({
      sessionId: gameSession.id,
      prompt: prompt.text,
      promptCategory: prompt.category,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error starting game:', error);
    const apiError = handleError(error, 'Game Start');
    return createErrorResponseFromAPIError(apiError);
  }
}