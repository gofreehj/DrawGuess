/**
 * 数据库配置 - 支持不同环境
 */
import * as path from 'path';

export interface DatabaseConfig {
  type: 'sqlite' | 'memory';
  path?: string;
  isServerless: boolean;
}

/**
 * 获取数据库配置
 */
export function getDatabaseConfig(): DatabaseConfig {
  const isVercel = !!process.env.VERCEL;
  const isServerless = isVercel || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  if (isServerless) {
    // 在无服务器环境中使用内存数据库
    console.log('🔧 Using in-memory database for serverless environment');
    return {
      type: 'memory',
      isServerless: true
    };
  } else {
    // 本地开发使用文件数据库
    const dataDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'game.db');
    
    console.log('🔧 Using SQLite file database for local development');
    return {
      type: 'sqlite',
      path: dbPath,
      isServerless: false
    };
  }
}

/**
 * 获取数据库路径说明
 */
export function getDatabaseInfo(): string {
  const config = getDatabaseConfig();
  
  if (config.type === 'memory') {
    return 'In-memory database (data will be lost on restart)';
  } else {
    return `SQLite file: ${config.path}`;
  }
}