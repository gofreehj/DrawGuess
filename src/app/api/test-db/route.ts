import { NextRequest, NextResponse } from 'next/server';
import { getActivePrompts, getGameStatistics } from '@/lib/database';
import { initializeDatabaseWithSeedData, verifyDatabaseStructure } from '@/lib/init-database';
import { isAppInitialized } from '@/lib/startup';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // 如果是强制重新初始化
    if (action === 'reinit') {
      console.log('🔄 Force reinitializing database...');
      initializeDatabaseWithSeedData();
    }
    
    // 验证数据库结构
    const structureValid = verifyDatabaseStructure();
    
    if (!structureValid) {
      return NextResponse.json({
        success: false,
        message: 'Database structure verification failed'
      }, { status: 500 });
    }
    
    // 获取数据库状态
    const prompts = getActivePrompts();
    const stats = getGameStatistics();
    
    return NextResponse.json({
      success: true,
      message: 'Database status check completed',
      data: {
        appInitialized: isAppInitialized(),
        database: {
          tablesExist: ['users', 'prompts', 'game_sessions'],
          totalPrompts: prompts.length,
          promptSamples: prompts.slice(0, 3).map(p => ({ 
            text: p.text, 
            category: p.category,
            difficulty: p.difficulty 
          })),
          gameStats: stats
        },
        actions: {
          reinit: 'Add ?action=reinit to force database reinitialization'
        }
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Try accessing /api/test-db?action=reinit to force reinitialization'
    }, { status: 500 });
  }
}