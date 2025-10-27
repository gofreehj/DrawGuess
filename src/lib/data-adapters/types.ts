import { GameSession, User } from '@/types/game';

/**
 * 统一的数据访问接口
 * 定义了所有数据操作的标准接口，支持不同的数据源实现
 */

// 游戏历史查询选项
export interface HistoryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'score' | 'duration';
  sortOrder?: 'asc' | 'desc';
  userId?: string;
}

// 游戏统计数据
export interface GameStats {
  totalGames: number;
  successfulGuesses: number;
  averageConfidence: number;
  successRate: number;
  averageDuration?: number;
}

// 数据同步结果
export interface SyncResult {
  success: boolean;
  syncedRecords: number;
  errors: string[];
  lastSyncTime: Date;
}

// 数据源健康状态
export interface DataSourceHealth {
  isHealthy: boolean;
  latency?: number; // ms
  lastChecked: Date;
  error?: string;
}

/**
 * 数据适配器接口
 * 所有数据源适配器都必须实现此接口
 */
export interface DataAdapter {
  // 数据源标识
  readonly name: string;
  readonly type: 'local' | 'cloud';
  
  // 连接和健康检查
  initialize(): Promise<void>;
  isHealthy(): Promise<DataSourceHealth>;
  close(): Promise<void>;
  
  // 游戏会话操作
  createGameSession(session: Omit<GameSession, 'id'>): Promise<GameSession>;
  getGameSession(id: string): Promise<GameSession | null>;
  updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession>;
  deleteGameSession(id: string): Promise<boolean>;
  
  // 游戏历史操作
  getGameHistory(options?: HistoryOptions): Promise<GameSession[]>;
  getGameStats(userId?: string): Promise<GameStats>;
  
  // 用户操作（可选，某些适配器可能不支持）
  createUser?(user: Omit<User, 'stats' | 'createdAt'>): Promise<User>;
  getUser?(id: string): Promise<User | null>;
  updateUser?(id: string, updates: Partial<User>): Promise<User>;
  
  // 图像存储操作
  uploadDrawing?(gameId: string, imageData: string, userId?: string): Promise<string>;
  getDrawingUrl?(gameId: string, userId?: string): Promise<string>;
  deleteDrawing?(gameId: string, userId?: string): Promise<boolean>;
  
  // 数据同步操作（仅云端适配器）
  syncFromLocal?(localData: GameSession[]): Promise<SyncResult>;
  syncToLocal?(): Promise<GameSession[]>;
}

/**
 * 数据路由器接口
 * 管理多个数据适配器，提供自动切换和同步功能
 */
export interface DataRouter {
  // 当前活跃的适配器
  getCurrentAdapter(): DataAdapter;
  
  // 适配器管理
  addAdapter(adapter: DataAdapter): void;
  removeAdapter(name: string): void;
  getAdapter(name: string): DataAdapter | null;
  listAdapters(): DataAdapter[];
  
  // 数据源切换
  switchToAdapter(name: string): Promise<void>;
  switchToLocal(): Promise<void>;
  switchToCloud(): Promise<void>;
  
  // 自动切换逻辑
  enableAutoSwitch(enabled: boolean): void;
  isAutoSwitchEnabled(): boolean;
  
  // 数据同步
  syncData(): Promise<SyncResult>;
  
  // 健康检查
  checkAllAdapters(): Promise<Record<string, DataSourceHealth>>;
}

// 适配器配置
export interface AdapterConfig {
  name: string;
  type: 'local' | 'cloud';
  priority: number; // 优先级，数字越小优先级越高
  enabled: boolean;
  config?: Record<string, any>; // 适配器特定配置
}

// 数据路由器配置
export interface DataRouterConfig {
  adapters: AdapterConfig[];
  autoSwitch: boolean;
  fallbackToLocal: boolean;
  syncInterval?: number; // 自动同步间隔（毫秒）
  healthCheckInterval?: number; // 健康检查间隔（毫秒）
}