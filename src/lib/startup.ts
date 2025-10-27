/**
 * 应用启动时的初始化逻辑
 */
import { initializeDatabaseWithSeedData } from './init-database';
import { initializeDataManager } from './data-adapters';

let isInitialized = false;

/**
 * 应用启动时执行的初始化
 */
export async function initializeApp(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    console.log('🚀 Initializing application...');
    
    // 初始化数据库
    initializeDatabaseWithSeedData();
    
    // 初始化数据管理器（仅在客户端）
    if (typeof window !== 'undefined') {
      await initializeDataManager({
        autoSwitch: true,
        fallbackToLocal: true,
        healthCheckInterval: 30000, // 30秒
        syncInterval: 300000 // 5分钟
      });
    }
    
    isInitialized = true;
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    // 不抛出错误，让应用继续运行
  }
}

/**
 * 同步版本的初始化（用于不支持async的地方）
 */
export function initializeAppSync(): void {
  if (isInitialized) {
    return;
  }

  try {
    console.log('🚀 Initializing application (sync)...');
    
    // 只初始化数据库，数据管理器将在首次使用时初始化
    initializeDatabaseWithSeedData();
    
    isInitialized = true;
    console.log('✅ Application initialized successfully (sync)');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    // 不抛出错误，让应用继续运行
  }
}

/**
 * 检查应用是否已初始化
 */
export function isAppInitialized(): boolean {
  return isInitialized;
}