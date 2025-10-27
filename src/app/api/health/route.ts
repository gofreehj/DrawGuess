import { NextResponse } from 'next/server';
import { getActivePrompts } from '@/lib/database';
import { initializeDatabaseWithSeedData, verifyDatabaseStructure } from '@/lib/init-database';
import { getDatabaseConfig, getDatabaseInfo } from '@/lib/database-config';

/**
 * GET /api/health - Health check endpoint
 * Verifies database connection and data availability
 */
export async function GET() {
  try {
    // Initialize database if needed
    initializeDatabaseWithSeedData();
    
    // Get database configuration
    const dbConfig = getDatabaseConfig();
    const dbInfo = getDatabaseInfo();
    
    // Verify database structure
    const structureValid = verifyDatabaseStructure();
    
    // Check prompts availability
    const prompts = getActivePrompts();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        type: dbConfig.type,
        isServerless: dbConfig.isServerless,
        info: dbInfo,
        structureValid,
        promptsCount: prompts.length,
        hasMinimumPrompts: prompts.length >= 20
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        platform: process.platform
      }
    };
    
    // Determine overall health
    const isHealthy = structureValid && prompts.length > 0;
    
    return NextResponse.json({
      success: true,
      data: healthStatus
    }, { 
      status: isHealthy ? 200 : 503 
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 503 });
  }
}