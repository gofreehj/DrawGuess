import { NextRequest, NextResponse } from 'next/server';
import { getActivePrompts, createPrompt } from '@/lib/database';
import { Prompt } from '@/types/game';
import { createErrorResponse, ERROR_CODES, handleError, createErrorResponseFromAPIError } from '@/lib/error-handler';

/**
 * GET /api/prompts - Get all active prompts
 * Requirements: 1.1, 1.2
 */
export async function GET() {
  try {
    const prompts = getActivePrompts();
    
    return NextResponse.json({
      success: true,
      data: {
        prompts,
        total: prompts.length
      }
    });

  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    const apiError = handleError(error, 'Fetch Prompts');
    return createErrorResponseFromAPIError(apiError);
  }
}

/**
 * POST /api/prompts - Create a new prompt
 * Requirements: 1.1, 1.4
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.text || !body.category) {
      return createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'Missing required fields: text and category',
        { hasText: !!body.text, hasCategory: !!body.category },
        400
      );
    }
    
    // Validate category
    const validCategories = ['mammal', 'bird', 'fish', 'reptile', 'insect'];
    if (!validCategories.includes(body.category)) {
      return createErrorResponse(
        ERROR_CODES.INVALID_CATEGORY,
        'Invalid category',
        { 
          providedCategory: body.category,
          validCategories: validCategories 
        },
        400
      );
    }
    
    // Validate difficulty if provided
    if (body.difficulty) {
      const validDifficulties = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(body.difficulty)) {
        return createErrorResponse(
          ERROR_CODES.INVALID_DIFFICULTY,
          'Invalid difficulty',
          { 
            providedDifficulty: body.difficulty,
            validDifficulties: validDifficulties 
          },
          400
        );
      }
    }
    
    // Create the prompt
    const promptData: Omit<Prompt, 'id'> = {
      text: body.text,
      category: body.category,
      difficulty: body.difficulty || 'medium',
      keywords: body.keywords || [],
      isActive: body.isActive !== undefined ? body.isActive : true
    };
    
    const newPrompt = createPrompt(promptData);
    
    return NextResponse.json({
      success: true,
      data: {
        prompt: newPrompt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create prompt:', error);
    const apiError = handleError(error, 'Create Prompt');
    return createErrorResponseFromAPIError(apiError);
  }
}