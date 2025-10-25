import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getActivePrompts } from '@/lib/database';
import { initializeDatabaseWithSeedData, verifyDatabaseStructure } from '@/lib/init-database';

export async function GET() {
  try {
    // Initialize database and create tables
    initializeDatabaseWithSeedData();
    
    // Verify database structure
    const structureValid = verifyDatabaseStructure();
    
    if (!structureValid) {
      return NextResponse.json({
        success: false,
        message: 'Database structure verification failed'
      }, { status: 500 });
    }
    
    // Get current prompts count
    const prompts = getActivePrompts();
    
    return NextResponse.json({
      success: true,
      message: 'Database tables created and verified successfully',
      data: {
        tablesCreated: ['users', 'prompts', 'game_sessions'],
        totalPrompts: prompts.length,
        promptSamples: prompts.slice(0, 5).map(p => ({ text: p.text, category: p.category }))
      }
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}