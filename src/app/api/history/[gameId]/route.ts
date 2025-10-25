import { NextRequest } from 'next/server';
import { getGameSessionById, deleteGameSession } from '@/lib/database';

// API route for individual game history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    // Validate gameId parameter
    if (!gameId || typeof gameId !== 'string') {
      return Response.json(
        {
          error: {
            code: 'INVALID_GAME_ID',
            message: 'Game ID is required and must be a valid string'
          }
        },
        { status: 400 }
      );
    }

    // Get game session by ID
    const game = getGameSessionById(gameId);

    if (!game) {
      return Response.json(
        {
          error: {
            code: 'GAME_NOT_FOUND',
            message: `Game with ID ${gameId} not found`
          }
        },
        { status: 404 }
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
    
    return Response.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch game details',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      },
      { status: 500 }
    );
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
      return Response.json(
        {
          error: {
            code: 'INVALID_GAME_ID',
            message: 'Game ID is required and must be a valid string'
          }
        },
        { status: 400 }
      );
    }

    // Check if game exists before deletion
    const existingGame = getGameSessionById(gameId);
    if (!existingGame) {
      return Response.json(
        {
          error: {
            code: 'GAME_NOT_FOUND',
            message: `Game with ID ${gameId} not found`
          }
        },
        { status: 404 }
      );
    }

    // Delete the game session
    deleteGameSession(gameId);

    return Response.json({
      success: true,
      message: `Game session ${gameId} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting game session:', error);
    
    return Response.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete game session',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      },
      { status: 500 }
    );
  }
}