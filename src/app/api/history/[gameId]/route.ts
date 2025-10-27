import { NextRequest } from 'next/server';
import { getGameSessionById, deleteGameSession } from '@/lib/database';
import { getDataManager } from '@/lib/data-adapters';
import { createErrorResponse, ERROR_CODES, handleError, createErrorResponseFromAPIError } from '@/lib/error-handler';

// API route for individual game history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    // Validate gameId parameter
    if (!gameId || typeof gameId !== 'string') {
      return createErrorResponse(
        'INVALID_GAME_ID',
        'Game ID is required and must be a valid string',
        { providedGameId: gameId },
        400
      );
    }

    // Initialize data manager if not already done
    const dataManager = getDataManager();
    if (!dataManager.isInitialized()) {
      await dataManager.initialize();
    }

    // Get game session by ID using data adapter
    const game = await dataManager.getGameSession(gameId);

    if (!game) {
      return createErrorResponse(
        'GAME_NOT_FOUND',
        `Game with ID ${gameId} not found`,
        { gameId },
        404
      );
    }

    // Format response according to the GameSession interface
    const response = {
      id: game.id,
      userId: game.userId,
      prompt: game.prompt,
      promptCategory: game.promptCategory,
      drawing: game.drawing,
      aiGuess: game.aiGuess,
      confidence: game.confidence,
      isCorrect: game.isCorrect,
      startTime: game.startTime.toISOString(),
      endTime: game.endTime.toISOString(),
      duration: game.duration
    };

    return Response.json(response);
  } catch (error) {
    console.error('Error fetching game details:', error);
    const apiError = handleError(error, 'Game Details');
    return createErrorResponseFromAPIError(apiError);
  }
}

// DELETE method for single game deletion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    // Validate gameId parameter
    if (!gameId || typeof gameId !== 'string') {
      return createErrorResponse(
        'INVALID_GAME_ID',
        'Game ID is required and must be a valid string',
        { providedGameId: gameId },
        400
      );
    }

    // Initialize data manager if not already done
    const dataManager = getDataManager();
    if (!dataManager.isInitialized()) {
      await dataManager.initialize();
    }

    // Check if game exists before deletion
    const existingGame = await dataManager.getGameSession(gameId);
    if (!existingGame) {
      return createErrorResponse(
        'GAME_NOT_FOUND',
        `Game with ID ${gameId} not found`,
        { gameId },
        404
      );
    }

    // Delete the game session using data adapter
    const success = await dataManager.deleteGameSession(gameId);
    
    if (!success) {
      throw new Error('Failed to delete game session');
    }

    return Response.json({
      success: true,
      message: `Game session ${gameId} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting game session:', error);
    const apiError = handleError(error, 'Delete Game Session');
    return createErrorResponseFromAPIError(apiError);
  }
}