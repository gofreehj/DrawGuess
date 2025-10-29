import { NextResponse } from 'next/server';
import { databaseManager } from '@/lib/database-manager';
import { ensureServerDatabaseInitialized } from '@/lib/server-startup';
import { verifyDatabaseStructure } from '@/lib/init-database';
import { getDatabaseConfig, getDatabaseInfo } from '@/lib/database-config';

/**
 * GET /api/health - Health check endpoint
 * Verifies database connection and data availability
 */
export async function GET() {
  try {
    // 确保服务器数据库已初始化（容错机制）
    await ensureServerDatabaseInitialized();
    
    // Get database configuration
    const dbConfig = getDatabaseConfig();
    const dbInfo = getDatabaseInfo();
    
    // Verify database structure and get health status
    const structureValid = verifyDatabaseStructure();
    const healthStatus = databaseManager.healthCheck();
    
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        type: dbConfig.type,
        isServerless: dbConfig.isServerless,
        info: dbInfo,
        structureValid,
        promptsCount: healthStatus.promptsCount,
        hasMinimumPrompts: healthStatus.hasMinimumPrompts,
        stats: healthStatus.stats
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        platform: process.platform
      }
    };
    
    // Determine overall health
    const isHealthy = structureValid && healthStatus.isHealthy;
    
    return NextResponse.json({
      success: true,
      data: response
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