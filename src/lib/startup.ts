/**
 * 应用启动时的初始化逻辑
 */
import { initializeDatabaseWithSeedData } from './init-database';

let isInitialized = false;

/**
 * 应用启动时执行的初始化
 */
export function initializeApp(): void {
  if (isInitialized) {
    return;
  }

  try {
    console.log('🚀 Initializing application...');
    
    // 初始化数据库
    initializeDatabaseWithSeedData();
    
    isInitialized = true;
    console.log('✅ Application initialized successfully');
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