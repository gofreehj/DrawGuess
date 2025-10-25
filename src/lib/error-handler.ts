// Unified error handling utilities for the backend

import { NextResponse } from 'next/server';

export interface APIError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}



export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

/**
 * Standard error codes used throughout the application
 */
export const ERROR_CODES = {
  // Validation errors (400)
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_LIMIT: 'INVALID_LIMIT',
  INVALID_CATEGORY: 'INVALID_CATEGORY',
  INVALID_DIFFICULTY: 'INVALID_DIFFICULTY',
  INVALID_GAME_IDS: 'INVALID_GAME_IDS',
  INVALID_DAYS_OLD: 'INVALID_DAYS_OLD',
  INVALID_ACTION: 'INVALID_ACTION',
  
  // Not found errors (404)
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  NO_PROMPTS_AVAILABLE: 'NO_PROMPTS_AVAILABLE',
  
  // Conflict errors (409)
  SESSION_ALREADY_COMPLETED: 'SESSION_ALREADY_COMPLETED',
  
  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  GAME_START_FAILED: 'GAME_START_FAILED',
  GAME_SUBMIT_FAILED: 'GAME_SUBMIT_FAILED',
  AI_RECOGNITION_FAILED: 'AI_RECOGNITION_FAILED',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  FETCH_PROMPTS_FAILED: 'FETCH_PROMPTS_FAILED',
  CREATE_PROMPT_FAILED: 'CREATE_PROMPT_FAILED',
  FETCH_RANDOM_PROMPT_FAILED: 'FETCH_RANDOM_PROMPT_FAILED',
  
  // AI Service specific errors
  AI_CONFIG_INVALID: 'AI_CONFIG_INVALID',
  AI_API_KEY_INVALID: 'AI_API_KEY_INVALID',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_TIMEOUT: 'AI_TIMEOUT',
  AI_NETWORK_ERROR: 'AI_NETWORK_ERROR',
} as const;

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  statusCode: number = 500
): NextResponse {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID()
  };

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Creates an error response from an APIError object
 */
export function createErrorResponseFromAPIError(apiError: APIError): NextResponse {
  return createErrorResponse(
    apiError.code,
    apiError.message,
    apiError.details,
    apiError.statusCode || 500
  );
}

/**
 * Handles and categorizes different types of errors
 */
export function handleError(error: unknown, context: string = 'Unknown'): APIError {
  console.error(`Error in ${context}:`, error);

  // Check if error is already an APIError object
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as APIError;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('SQLITE_')) {
      return {
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Database operation failed',
        details: error.message,
        statusCode: 500
      };
    }

    if (error.message.includes('fetch failed') || error.message.includes('ConnectTimeoutError')) {
      return {
        code: ERROR_CODES.AI_NETWORK_ERROR,
        message: 'Network connection failed',
        details: error.message,
        statusCode: 503
      };
    }

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return {
        code: ERROR_CODES.AI_API_KEY_INVALID,
        message: 'Invalid API credentials',
        details: error.message,
        statusCode: 500
      };
    }

    if (error.message.includes('429') || error.message.includes('rate limit')) {
      return {
        code: ERROR_CODES.AI_RATE_LIMIT,
        message: 'Service rate limit exceeded',
        details: error.message,
        statusCode: 429
      };
    }

    if (error.name === 'AbortError') {
      return {
        code: ERROR_CODES.AI_TIMEOUT,
        message: 'Request timed out',
        details: error.message,
        statusCode: 408
      };
    }

    // Generic error
    return {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: error.message,
      statusCode: 500
    };
  }

  // Unknown error type
  return {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'An unknown error occurred',
    details: String(error),
    statusCode: 500
  };
}

/**
 * Validation error helper
 */
export function createValidationError(message: string, details?: any): APIError {
  return {
    code: ERROR_CODES.INVALID_INPUT,
    message,
    details,
    statusCode: 400
  };
}

/**
 * Not found error helper
 */
export function createNotFoundError(message: string, details?: any): APIError {
  return {
    code: ERROR_CODES.SESSION_NOT_FOUND,
    message,
    details,
    statusCode: 404
  };
}

/**
 * AI service error helper
 */
export function createAIServiceError(message: string, details?: any): APIError {
  return {
    code: ERROR_CODES.AI_SERVICE_UNAVAILABLE,
    message,
    details,
    statusCode: 503
  };
}

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const apiError = handleError(error, context);
      throw apiError;
    }
  };
}

/**
 * Express-style error handler for API routes
 */
export function apiErrorHandler<T extends Request>(
  handler: (request: T) => Promise<Response | NextResponse>
) {
  return async (request: T): Promise<Response | NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      const apiError = handleError(error, 'API Route');
      return createErrorResponseFromAPIError(apiError);
    }
  };
}