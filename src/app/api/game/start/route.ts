import { NextRequest } from 'next/server';
import { getRandomPrompt, createGameSession } from '@/lib/database';
import { createErrorResponse, ERROR_CODES, handleError, createErrorResponseFromAPIError } from '@/lib/error-handler';

// API route for starting a new game
export async function POST(request: NextRequest) {
  try {
    // Get a random prompt from the database
    const prompt = getRandomPrompt();
    
    if (!prompt) {
      return createErrorResponse(
        ERROR_CODES.NO_PROMPTS_AVAILABLE,
        'No prompts available in the database',
        'Please ensure prompts are properly seeded in the database',
        500
      );
    }

    // Create a new game session
    const gameSession = createGameSession({
      userId: undefined, // Anonymous user for now
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