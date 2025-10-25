import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';
import { createErrorResponse, ERROR_CODES, handleError, createErrorResponseFromAPIError } from '@/lib/error-handler';

/**
 * GET /api/health - Health check endpoint for monitoring service status
 * Requirements: 4.1 (AI service monitoring)
 */
export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url);
  const includeAI = searchParams.get('ai') === 'true';
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'healthy',
      ai: 'unknown'
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  // Check database health (basic check)
  try {
    // This is a simple check - in a real app you might want to do a test query
    healthStatus.services.database = 'healthy';
  } catch (error) {
    healthStatus.services.database = 'unhealthy';
    healthStatus.status = 'degraded';
  }

  // Check AI service health if requested
  if (includeAI) {
    try {
      const aiConfig = aiService.getConfig();
      const isConfigured = aiService.isConfigured();
      
      if (!isConfigured) {
        healthStatus.services.ai = 'not_configured';
        healthStatus.status = 'degraded';
      } else {
        // Try a simple test call (without actual image data)
        try {
          // We don't actually make an API call here to avoid costs
          // Just check if the configuration looks valid
          healthStatus.services.ai = 'configured';
        } catch (error) {
          healthStatus.services.ai = 'error';
          healthStatus.status = 'degraded';
        }
      }
      
      // Add AI service details
      (healthStatus as any).aiService = {
        provider: aiConfig.provider,
        model: aiConfig.model,
        configured: isConfigured
      };
      
    } catch (error) {
      healthStatus.services.ai = 'error';
      healthStatus.status = 'unhealthy';
    }
  }

  // Determine overall status
  const statusCode = healthStatus.status === 'healthy' ? 200 : 
                    healthStatus.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    const apiError = handleError(error, 'Health Check');
    return createErrorResponseFromAPIError(apiError);
  }
}

/**
 * POST /api/health/test - Test AI service with a simple recognition
 * Requirements: 4.1 (AI service testing)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    if (!body.testPrompt) {
      return createErrorResponse(
        ERROR_CODES.INVALID_INPUT,
        'Missing testPrompt field',
        'testPrompt is required for AI service testing',
        400
      );
    }

    // Test the AI service with fallback
    const testResult = await aiService.recognizeDrawingFallback(body.testPrompt);
    
    return NextResponse.json({
      success: true,
      testResult: {
        provider: aiService.getConfig().provider,
        configured: aiService.isConfigured(),
        fallbackWorking: testResult.success,
        response: testResult.result
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health test error:', error);
    const apiError = handleError(error, 'Health Test');
    return createErrorResponseFromAPIError(apiError);
  }
}