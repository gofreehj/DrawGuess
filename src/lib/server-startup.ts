/**
 * 服务器启动时的数据库初始化
 * 这应该在服务器启动时执行一次，而不是在每次API调用时执行
 */

import { initializeDatabaseWithSeedData } from './init-database';
import { databaseManager } from './database-manager';

// 全局标记，确保只初始化一次
const SERVER_INIT_SYMBOL = Symbol.for('server.database.initialized');
let isServerInitialized = (global as any)[SERVER_INIT_SYMBOL] || false;

/**
 * 服务器启动时初始化数据库
 * 这个函数应该在服务器启动时调用一次
 */
export async function initializeServerDatabase(): Promise<void> {
  // 如果已经初始化过，直接返回
  if (isServerInitialized) {
    return;
  }

  // 跳过构建阶段
  if (process.env.NEXT_PHASE && process.env.NEXT_PHASE !== 'phase-production-server') {
    return;
  }

  try {
    console.log('🚀 Initializing server database...');
    
    // 初始化数据库和种子数据
    initializeDatabaseWithSeedData();
    
    // 标记数据库管理器为就绪状态
    databaseManager.markAsReady();
    
    // 标记为已初始化
    isServerInitialized = true;
    (global as any)[SERVER_INIT_SYMBOL] = true;
    
    console.log('✅ Server database initialized successfully');
    
  } catch (error) {
    console.error('❌ Server database initialization failed:', error);
    throw error;
  }
}

/**
 * 检查服务器数据库是否已初始化
 */
export function isServerDatabaseInitialized(): boolean {
  return isServerInitialized;
}