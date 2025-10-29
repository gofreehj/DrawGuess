import {
  DataRouter,
  DataAdapter,
  AdapterConfig,
  DataRouterConfig,
  SyncResult,
  DataSourceHealth,
  HistoryOptions,
  GameStats
} from './types';
import { GameSession, User } from '@/types/game';
import { createAdapter, getDefaultAdapterConfigs } from './index';

/**
 * 数据路由器实现
 * 管理多个数据适配器，提供自动切换和同步功能
 */
// Use process-level symbols to prevent multiple instances across different contexts
const ROUTER_INSTANCE_FLAG = Symbol.for('datarouter.instance');
const ROUTER_INITIALIZING_FLAG = Symbol.for('datarouter.initializing');

export class DataRouterImpl implements DataRouter {
  private static get instance(): DataRouterImpl | null {
    return (global as any)[ROUTER_INSTANCE_FLAG] || null;
  }
  
  private static set instance(value: DataRouterImpl | null) {
    (global as any)[ROUTER_INSTANCE_FLAG] = value;
  }
  
  private static get isInitializing(): boolean {
    return (global as any)[ROUTER_INITIALIZING_FLAG] || false;
  }
  
  private static set isInitializing(value: boolean) {
    (global as any)[ROUTER_INITIALIZING_FLAG] = value;
  }
  
  private adapters = new Map<string, DataAdapter>();
  private currentAdapterName: string | null = null;
  private config: DataRouterConfig;
  private autoSwitchEnabled = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  private constructor(config?: Partial<DataRouterConfig>) {
    // Disable auto-sync on server side
    const isServerSide = typeof window === 'undefined';

    this.config = {
      adapters: getDefaultAdapterConfigs(),
      autoSwitch: !isServerSide, // Disable auto-switch on server side
      fallbackToLocal: true,
      healthCheckInterval: isServerSide ? 0 : 30000, // Disable health checks on server side
      syncInterval: isServerSide ? 0 : 300000, // Disable sync on server side
      ...config
    };

    this.initialize();
  }

  static getInstance(config?: Partial<DataRouterConfig>): DataRouterImpl {
    if (DataRouterImpl.instance && DataRouterImpl.instance.initialized) {
      return DataRouterImpl.instance;
    }

    if (DataRouterImpl.isInitializing) {
      // If already initializing, wait or return existing instance
      if (DataRouterImpl.instance) {
        return DataRouterImpl.instance;
      }
    }

    DataRouterImpl.isInitializing = true;
    DataRouterImpl.instance = new DataRouterImpl(config);
    return DataRouterImpl.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // 初始化所有启用的适配器
      for (const adapterConfig of this.config.adapters) {
        if (adapterConfig.enabled) {
          const adapter = createAdapter(adapterConfig);
          this.adapters.set(adapterConfig.name, adapter);

          try {
            await adapter.initialize();
            
            // Only log adapter initialization once
            if (!this.initialized) {
              console.log(`✅ ${adapterConfig.name} adapter ready`);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to initialize adapter ${adapterConfig.name}:`, error);
          }
        }
      }

      // 选择初始适配器
      await this.selectBestAdapter();

      // 启用自动切换
      if (this.config.autoSwitch && typeof window !== 'undefined') {
        this.enableAutoSwitch(true);
      } else if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('🚫 Auto-switch disabled on server side');
      }

      // Mark as initialized and log only once
      if (!this.initialized) {
        this.initialized = true;
        DataRouterImpl.isInitializing = false;
        console.log(`🚀 Data router ready (${this.adapters.size} adapters)`);
      }
    } catch (error) {
      console.error('Failed to initialize data router:', error);
      throw error;
    }
  }

  getCurrentAdapter(): DataAdapter {
    if (!this.currentAdapterName || !this.adapters.has(this.currentAdapterName)) {
      throw new Error('No active adapter available');
    }
    return this.adapters.get(this.currentAdapterName)!;
  }

  addAdapter(adapter: DataAdapter): void {
    this.adapters.set(adapter.name, adapter);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Added adapter: ${adapter.name}`);
    }
  }

  removeAdapter(name: string): void {
    const adapter = this.adapters.get(name);
    if (adapter) {
      adapter.close();
      this.adapters.delete(name);

      // 如果移除的是当前适配器，需要切换到其他适配器
      if (this.currentAdapterName === name) {
        this.selectBestAdapter();
      }

      console.log(`Removed adapter: ${name}`);
    }
  }

  getAdapter(name: string): DataAdapter | null {
    return this.adapters.get(name) || null;
  }

  listAdapters(): DataAdapter[] {
    return Array.from(this.adapters.values());
  }

  async switchToAdapter(name: string): Promise<void> {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`Adapter ${name} not found`);
    }

    const health = await adapter.isHealthy();
    if (!health.isHealthy) {
      throw new Error(`Adapter ${name} is not healthy: ${health.error}`);
    }

    this.currentAdapterName = name;
    console.log(`Switched to adapter: ${name}`);
  }

  async switchToLocal(): Promise<void> {
    const localAdapter = Array.from(this.adapters.values())
      .find(adapter => adapter.type === 'local');

    if (!localAdapter) {
      throw new Error('No local adapter available');
    }

    await this.switchToAdapter(localAdapter.name);
  }

  async switchToCloud(): Promise<void> {
    const cloudAdapters = Array.from(this.adapters.values())
      .filter(adapter => adapter.type === 'cloud');

    if (cloudAdapters.length === 0) {
      throw new Error('No cloud adapter available');
    }

    // 选择优先级最高的云端适配器
    const sortedAdapters = cloudAdapters.sort((a, b) => {
      const configA = this.config.adapters.find(c => c.name === a.name);
      const configB = this.config.adapters.find(c => c.name === b.name);
      return (configA?.priority || 999) - (configB?.priority || 999);
    });

    for (const adapter of sortedAdapters) {
      try {
        await this.switchToAdapter(adapter.name);
        return;
      } catch (error) {
        console.warn(`Failed to switch to ${adapter.name}:`, error);
      }
    }

    throw new Error('No healthy cloud adapter available');
  }

  enableAutoSwitch(enabled: boolean): void {
    // Disable auto-switch on server side
    if (typeof window === 'undefined') {
      console.log('Auto switch not supported on server side');
      return;
    }

    this.autoSwitchEnabled = enabled;

    if (enabled) {
      // 启动健康检查 (仅在客户端)
      if (this.config.healthCheckInterval && !this.healthCheckInterval && typeof window !== 'undefined') {
        this.healthCheckInterval = setInterval(
          () => this.performHealthCheck(),
          this.config.healthCheckInterval
        );
        console.log('✅ Health check interval started on client side');
      } else if (typeof window === 'undefined') {
        console.log('🚫 Health check interval skipped on server side');
      }

      // 启动自动同步 (仅在客户端)
      if (this.config.syncInterval && !this.syncInterval && typeof window !== 'undefined') {
        this.syncInterval = setInterval(
          () => this.performAutoSync(),
          this.config.syncInterval
        );
        console.log('✅ Auto-sync interval started on client side');
      } else if (typeof window === 'undefined') {
        console.log('🚫 Auto-sync interval skipped on server side');
      }
    } else {
      // 停止定时任务
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }
    }

    console.log(`Auto switch ${enabled ? 'enabled' : 'disabled'}`);
  }

  isAutoSwitchEnabled(): boolean {
    return this.autoSwitchEnabled;
  }

  async syncData(): Promise<SyncResult> {
    // Server-side sync is not supported
    if (typeof window === 'undefined') {
      return {
        success: false,
        syncedRecords: 0,
        errors: ['Data sync not supported on server side'],
        lastSyncTime: new Date()
      };
    }

    try {
      const localAdapter = Array.from(this.adapters.values())
        .find(adapter => adapter.type === 'local');
      const cloudAdapter = Array.from(this.adapters.values())
        .find(adapter => adapter.type === 'cloud');

      if (!localAdapter || !cloudAdapter) {
        throw new Error('Both local and cloud adapters are required for sync');
      }

      // 检查云端适配器健康状态
      const cloudHealth = await cloudAdapter.isHealthy();
      if (!cloudHealth.isHealthy) {
        throw new Error(`Cloud adapter is not healthy: ${cloudHealth.error}`);
      }

      // 从本地获取数据并同步到云端
      const localData = await localAdapter.syncToLocal!();
      const syncResult = await cloudAdapter.syncFromLocal!(localData);

      console.log(`Sync completed: ${syncResult.syncedRecords} records synced`);
      return syncResult;
    } catch (error) {
      console.error('Data sync failed:', error);
      return {
        success: false,
        syncedRecords: 0,
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
        lastSyncTime: new Date()
      };
    }
  }

  async checkAllAdapters(): Promise<Record<string, DataSourceHealth>> {
    const results: Record<string, DataSourceHealth> = {};

    for (const [name, adapter] of this.adapters) {
      try {
        results[name] = await adapter.isHealthy();
      } catch (error) {
        results[name] = {
          isHealthy: false,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }

  // 私有方法：选择最佳适配器
  private async selectBestAdapter(): Promise<void> {
    // On server side, prefer local adapters
    const isServerSide = typeof window === 'undefined';

    let sortedConfigs = [...this.config.adapters]
      .filter(config => config.enabled);

    // Use original priority for both server and client side
    // Supabase (priority: 1) should be preferred over local (priority: 2)
    sortedConfigs = sortedConfigs.sort((a, b) => a.priority - b.priority);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Checking ${sortedConfigs.length} adapters on ${isServerSide ? 'server' : 'client'} side...`);
    }
    
    for (const config of sortedConfigs) {
      const adapter = this.adapters.get(config.name);
      if (!adapter) {
        console.log(`❌ Adapter ${config.name} not found`);
        continue;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Testing adapter: ${config.name} (${adapter.type})`);
      }

      try {
        const health = await adapter.isHealthy();
        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 Health check for ${config.name}:`, { isHealthy: health.isHealthy, error: health.error });
        }
        
        if (health.isHealthy) {
          this.currentAdapterName = config.name;
          
          // Only log adapter selection once
          if (!this.initialized) {
            console.log(`✅ Selected ${config.name} adapter`);
          }
          return;
        }
      } catch (error) {
        console.warn(`❌ Adapter ${config.name} health check failed:`, error);
      }
    }

    // 如果没有健康的适配器，回退到本地适配器
    if (this.config.fallbackToLocal) {
      const localAdapter = Array.from(this.adapters.values())
        .find(adapter => adapter.type === 'local');

      if (localAdapter) {
        this.currentAdapterName = localAdapter.name;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Fallback to local adapter: ${localAdapter.name}`);
        }
        return;
      }
    }

    throw new Error('No healthy adapter available');
  }

  // 私有方法：执行健康检查
  private async performHealthCheck(): Promise<void> {
    if (!this.autoSwitchEnabled) return;

    try {
      const currentAdapter = this.getCurrentAdapter();
      const health = await currentAdapter.isHealthy();

      if (!health.isHealthy) {
        console.warn(`Current adapter ${currentAdapter.name} is unhealthy, switching...`);
        await this.selectBestAdapter();
      }
    } catch (error) {
      console.error('Health check failed:', error);
      try {
        await this.selectBestAdapter();
      } catch (switchError) {
        console.error('Failed to switch adapter:', switchError);
      }
    }
  }

  // 私有方法：执行自动同步
  private async performAutoSync(): Promise<void> {
    if (!this.autoSwitchEnabled) return;

    // Server-side auto-sync is not supported
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const currentAdapter = this.getCurrentAdapter();

      // 只有当前适配器是云端适配器时才执行同步
      if (currentAdapter.type === 'cloud') {
        await this.syncData();
      }
    } catch (error) {
      console.error('Auto sync failed:', error);
    }
  }

  // 清理资源
  async destroy(): Promise<void> {
    this.enableAutoSwitch(false);

    for (const adapter of this.adapters.values()) {
      try {
        await adapter.close();
      } catch (error) {
        console.error(`Failed to close adapter ${adapter.name}:`, error);
      }
    }

    this.adapters.clear();
    this.currentAdapterName = null;
    console.log('Data router destroyed');
  }
}

// 代理方法：将DataRouter的方法代理到当前活跃的适配器
export class DataRouterProxy implements DataAdapter {
  readonly name = 'router-proxy';
  readonly type = 'local' as const; // 代理的类型取决于当前适配器

  constructor(private router: DataRouter) { }

  async initialize(): Promise<void> {
    // 路由器已经初始化了适配器
  }

  async isHealthy(): Promise<DataSourceHealth> {
    return this.router.getCurrentAdapter().isHealthy();
  }

  async close(): Promise<void> {
    // 不关闭路由器，只是代理
  }

  async createGameSession(session: Omit<GameSession, 'id'>): Promise<GameSession> {
    return this.router.getCurrentAdapter().createGameSession(session);
  }

  async getGameSession(id: string): Promise<GameSession | null> {
    return this.router.getCurrentAdapter().getGameSession(id);
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession> {
    return this.router.getCurrentAdapter().updateGameSession(id, updates);
  }

  async deleteGameSession(id: string): Promise<boolean> {
    return this.router.getCurrentAdapter().deleteGameSession(id);
  }

  async getGameHistory(options?: HistoryOptions): Promise<GameSession[]> {
    return this.router.getCurrentAdapter().getGameHistory(options);
  }

  async getGameStats(userId?: string): Promise<GameStats> {
    return this.router.getCurrentAdapter().getGameStats(userId);
  }

  async createUser?(user: Omit<User, 'stats' | 'createdAt'>): Promise<User> {
    const adapter = this.router.getCurrentAdapter();
    if (!adapter.createUser) {
      throw new Error('Current adapter does not support user creation');
    }
    return adapter.createUser(user);
  }

  async getUser?(id: string): Promise<User | null> {
    const adapter = this.router.getCurrentAdapter();
    if (!adapter.getUser) {
      throw new Error('Current adapter does not support user retrieval');
    }
    return adapter.getUser(id);
  }

  async updateUser?(id: string, updates: Partial<User>): Promise<User> {
    const adapter = this.router.getCurrentAdapter();
    if (!adapter.updateUser) {
      throw new Error('Current adapter does not support user updates');
    }
    return adapter.updateUser(id, updates);
  }

  async uploadDrawing?(gameId: string, imageData: string, userId?: string): Promise<string> {
    const adapter = this.router.getCurrentAdapter();
    if (!adapter.uploadDrawing) {
      throw new Error('Current adapter does not support drawing upload');
    }
    return adapter.uploadDrawing(gameId, imageData, userId);
  }

  async getDrawingUrl?(gameId: string, userId?: string): Promise<string> {
    const adapter = this.router.getCurrentAdapter();
    if (!adapter.getDrawingUrl) {
      throw new Error('Current adapter does not support drawing URL retrieval');
    }
    return adapter.getDrawingUrl(gameId, userId);
  }

  async deleteDrawing?(gameId: string, userId?: string): Promise<boolean> {
    const adapter = this.router.getCurrentAdapter();
    if (!adapter.deleteDrawing) {
      throw new Error('Current adapter does not support drawing deletion');
    }
    return adapter.deleteDrawing(gameId, userId);
  }

  async syncFromLocal?(localData: GameSession[]): Promise<SyncResult> {
    const adapter = this.router.getCurrentAdapter();
    if (!adapter.syncFromLocal) {
      throw new Error('Current adapter does not support sync from local');
    }
    return adapter.syncFromLocal(localData);
  }

  async syncToLocal?(): Promise<GameSession[]> {
    const adapter = this.router.getCurrentAdapter();
    if (!adapter.syncToLocal) {
      throw new Error('Current adapter does not support sync to local');
    }
    return adapter.syncToLocal();
  }
}