import { NextRequest } from 'next/server';
import { deleteGameSessions, deleteAllGameSessions, deleteOldGameSessions } from '@/lib/database';
import { createErrorResponse, ERROR_CODES, handleError, createErrorResponseFromAPIError } from '@/lib/error-handler';
import { getDataManager } from '@/lib/data-adapters';
import { HistoryOptions } from '@/lib/data-adapters/types';

// API route for game history
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const sortByParam = searchParams.get('sortBy');
    const sortOrderParam = searchParams.get('sortOrder');
    const userIdParam = searchParams.get('userId');
    
    // Parse and validate parameters
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    const sortBy = (sortByParam as 'date' | 'score' | 'duration') || 'date';
    const sortOrder = (sortOrderParam as 'asc' | 'desc') || 'desc';

    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 200) {
      return createErrorResponse(
        ERROR_CODES.INVALID_LIMIT,
        'Limit must be a number between 1 and 200',
        { providedLimit: limitParam, parsedLimit: limit },
        400
      );
    }

    // Validate offset parameter
    if (isNaN(offset) || offset < 0) {
      return createErrorResponse(
        'INVALID_OFFSET',
        'Offset must be a non-negative number',
        { providedOffset: offsetParam, parsedOffset: offset },
        400
      );
    }

    // Validate sortBy parameter
    if (!['date', 'score', 'duration'].includes(sortBy)) {
      return createErrorResponse(
        'INVALID_SORT_BY',
        'SortBy must be one of: date, score, duration',
        { providedSortBy: sortByParam },
        400
      );
    }

    // Validate sortOrder parameter
    if (!['asc', 'desc'].includes(sortOrder)) {
      return createErrorResponse(
        'INVALID_SORT_ORDER',
        'SortOrder must be one of: asc, desc',
        { providedSortOrder: sortOrderParam },
        400
      );
    }

    // Initialize data manager if not already done
    const dataManager = getDataManager();
    if (!dataManager.isInitialized()) {
      await dataManager.initialize();
    }

    // Build history options
    const historyOptions: HistoryOptions = {
      limit,
      offset,
      sortBy,
      sortOrder,
      userId: userIdParam || undefined
    };

    // Get game sessions and statistics using data adapter
    const games = await dataManager.getGameHistory(historyOptions);
    const stats = await dataManager.getGameStats(userIdParam || undefined);

    // Get total count for pagination (if supported by adapter)
    let totalCount = stats.totalGames;
    
    // Format response according to the design document
    const response = {
      games: games.map(game => ({
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
      })),
      totalGames: stats.totalGames,
      successRate: stats.successRate,
      averageConfidence: stats.averageConfidence,
      successfulGuesses: stats.successfulGuesses,
      // Pagination metadata
      pagination: {
        limit,
        offset,
        totalCount,
        hasMore: games.length === limit, // If we got a full page, there might be more
        sortBy,
        sortOrder
      }
    };

    return Response.json(response);

  } catch (error) {
    console.error('Error fetching game history:', error);
    const apiError = handleError(error, 'Game History');
    return createErrorResponseFromAPIError(apiError);
  }
}

// DELETE method for batch deletion
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json().catch(() => ({}));

    let deletedCount = 0;

    switch (action) {
      case 'batch':
        // Delete specific game IDs
        const { gameIds } = body;
        if (!Array.isArray(gameIds) || gameIds.length === 0) {
          return createErrorResponse(
            ERROR_CODES.INVALID_GAME_IDS,
            'gameIds must be a non-empty array',
            { providedGameIds: gameIds },
            400
          );
        }
        deletedCount = deleteGameSessions(gameIds);
        break;

      case 'all':
        // Delete all game sessions
        deletedCount = deleteAllGameSessions();
        break;

      case 'old':
        // Delete games older than specified days
        const { daysOld } = body;
        if (!daysOld || typeof daysOld !== 'number' || daysOld < 1) {
          return createErrorResponse(
            ERROR_CODES.INVALID_DAYS_OLD,
            'daysOld must be a positive number',
            { providedDaysOld: daysOld },
            400
          );
        }
        deletedCount = deleteOldGameSessions(daysOld);
        break;

      default:
        return createErrorResponse(
          ERROR_CODES.INVALID_ACTION,
          'Action must be one of: batch, all, old',
          { providedAction: action },
          400
        );
    }

    return Response.json({
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} game session(s)`
    });

  } catch (error) {
    console.error('Error deleting game history:', error);
    const apiError = handleError(error, 'Delete Game History');
    return createErrorResponseFromAPIError(apiError);
  }
}