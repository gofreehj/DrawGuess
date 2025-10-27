import { DataRouterImpl, DataRouterProxy } from './data-router';
import { DataRouter, DataAdapter, DataRouterConfig } from './types';
import { GameSession, User } from '@/types/game';

/**
 * 数据管理器
 * 提供应用程序的统一数据访问接口
 */
export class DataManager {
  private static instance: DataManager | null = null;
  private router: DataRouter;
  private proxy: DataAdapter;
  private initialized = false;

  private constructor(config?: Partial<DataRouterConfig>) {
    this.router = new DataRouterImpl(config);
    this.proxy = new DataRouterProxy(this.router);
  }

  /**
   * 获取数据管理器单例实例
   */
  static getInstance(config?: Partial<DataRouterConfig>): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager(config);
    }
    return DataManager.instance;
  }

  /**
   * 初始化数据管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.proxy.initialize();
      this.initialized = true;
      console.log('✅ Data manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize data manager:', error);
      // On server side, still mark as initialized but with limited functionality
      if (typeof window === 'undefined') {
        this.initialized = true;
        console.log('⚠️ Data manager initialized in server mode (limited functionality)');
      } else {
        throw error;
      }
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取数据适配器代理
   */
  getAdapter(): DataAdapter {
    if (!this.initialized) {
      throw new Error('Data manager not initialized');
    }
    return this.proxy;
  }

  /**
   * 获取数据路由器
   */
  getRouter(): DataRouter {
    return this.router;
  }

  /**
   * 游戏会话操作的便捷方法
   */
  async createGameSession(session: Omit<GameSession, 'id'>): Promise<GameSession> {
    return this.proxy.createGameSession(session);
  }

  async getGameSession(id: string): Promise<GameSession | null> {
    return this.proxy.getGameSession(id);
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession> {
    return this.proxy.updateGameSession(id, updates);
  }

  async deleteGameSession(id: string): Promise<boolean> {
    return this.proxy.deleteGameSession(id);
  }

  async getGameHistory(options?: { limit?: number; offset?: number; userId?: string }) {
    return this.proxy.getGameHistory(options);
  }

  async getGameStats(userId?: string) {
    return this.proxy.getGameStats(userId);
  }

  /**
   * 用户操作的便捷方法
   */
  async createUser(user: Omit<User, 'stats' | 'createdAt'>): Promise<User> {
    if (!this.proxy.createUser) {
      throw new Error('Current adapter does not support user creation');
    }
    return this.proxy.createUser(user);
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.proxy.getUser) {
      throw new Error('Current adapter does not support user retrieval');
    }
    return this.proxy.getUser(id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!this.proxy.updateUser) {
      throw new Error('Current adapter does not support user updates');
    }
    return this.proxy.updateUser(id, updates);
  }

  /**
   * 图像存储操作的便捷方法
   */
  async uploadDrawing(gameId: string, imageData: string, userId?: string): Promise<string> {
    if (!this.proxy.uploadDrawing) {
      throw new Error('Current adapter does not support drawing upload');
    }
    return this.proxy.uploadDrawing(gameId, imageData, userId);
  }

  async getDrawingUrl(gameId: string, userId?: string): Promise<string> {
    if (!this.proxy.getDrawingUrl) {
      throw new Error('Current adapter does not support drawing URL retrieval');
    }
    return this.proxy.getDrawingUrl(gameId, userId);
  }

  async deleteDrawing(gameId: string, userId?: string): Promise<boolean> {
    if (!this.proxy.deleteDrawing) {
      throw new Error('Current adapter does not support drawing deletion');
    }
    return this.proxy.deleteDrawing(gameId, userId);
  }

  /**
   * 数据同步操作的便捷方法
   */
  async syncData() {
    return this.router.syncData();
  }

  /**
   * 适配器切换的便捷方法
   */
  async switchToLocal(): Promise<void> {
    await this.router.switchToLocal();
  }

  async switchToCloud(): Promise<void> {
    await this.router.switchToCloud();
  }

  async switchToAdapter(name: string): Promise<void> {
    await this.router.switchToAdapter(name);
  }

  /**
   * 获取当前适配器信息
   */
  getCurrentAdapterName(): string {
    return this.router.getCurrentAdapter().name;
  }

  getCurrentAdapterType(): 'local' | 'cloud' {
    return this.router.getCurrentAdapter().type;
  }

  /**
   * 健康检查
   */
  async checkHealth() {
    return this.router.checkAllAdapters();
  }

  /**
   * 启用/禁用自动切换
   */
  enableAutoSwitch(enabled: boolean): void {
    this.router.enableAutoSwitch(enabled);
  }

  isAutoSwitchEnabled(): boolean {
    return this.router.isAutoSwitchEnabled();
  }

  /**
   * 清理资源
   */
  async destroy(): Promise<void> {
    if (this.router instanceof DataRouterImpl) {
      await this.router.destroy();
    }
    this.initialized = false;
    DataManager.instance = null;
  }

  /**
   * 重置单例实例（主要用于测试）
   */
  static reset(): void {
    DataManager.instance = null;
  }
}

// 导出默认实例
export const dataManager = DataManager.getInstance();

// 导出便捷函数
export async function initializeDataManager(config?: Partial<DataRouterConfig>): Promise<DataManager> {
  const manager = DataManager.getInstance(config);
  await manager.initialize();
  return manager;
}

export function getDataManager(): DataManager {
  return DataManager.getInstance();
}