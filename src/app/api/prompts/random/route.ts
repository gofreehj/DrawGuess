import { NextRequest, NextResponse } from 'next/server';
import { getRandomPrompt } from '@/lib/database';
import { initializeDatabaseWithSeedData } from '@/lib/init-database';
import { createErrorResponse, ERROR_CODES, handleError, createErrorResponseFromAPIError } from '@/lib/error-handler';

/**
 * GET /api/prompts/random - Get a random active prompt
 * Requirements: 1.1, 1.2
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize database with seed data if needed (especially for serverless environments)
    initializeDatabaseWithSeedData();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    
    // For now, we'll use the basic getRandomPrompt function
    // In the future, we could extend this to filter by category/difficulty
    const randomPrompt = getRandomPrompt();
    
    if (!randomPrompt) {
      return createErrorResponse(
        ERROR_CODES.NO_PROMPTS_AVAILABLE,
        'No active prompts available',
        'Please ensure there are active prompts in the database',
        404
      );
    }
    
    // Filter by category if specified
    if (category && randomPrompt.category !== category) {
      // For now, we'll just return the random prompt regardless
      // A more sophisticated implementation would query with filters
      console.log(`Category filter '${category}' requested but not implemented in database query`);
    }
    
    // Filter by difficulty if specified
    if (difficulty && randomPrompt.difficulty !== difficulty) {
      // For now, we'll just return the random prompt regardless
      // A more sophisticated implementation would query with filters
      console.log(`Difficulty filter '${difficulty}' requested but not implemented in database query`);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        prompt: randomPrompt
      }
    });

  } catch (error) {
    console.error('Failed to fetch random prompt:', error);
    const apiError = handleError(error, 'Fetch Random Prompt');
    return createErrorResponseFromAPIError(apiError);
  }
}