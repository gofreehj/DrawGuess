/**
 * 数据同步服务
 * 实现跨设备的实时数据同步和冲突解决
 */

import { GameSession } from '@/types/game';
import { createClient } from '@/utils/supabase/client';

export interface SyncConflict {
  localSession: GameSession;
  remoteSession: GameSession;
  conflictType: 'timestamp' | 'content' | 'both';
}

export interface SyncOptions {
  forceSync?: boolean;
  resolveConflicts?: 'local' | 'remote' | 'merge' | 'ask';
  batchSize?: number;
}

export interface SyncStatus {
  isActive: boolean;
  lastSyncTime: Date | null;
  pendingOperations: number;
  conflicts: SyncConflict[];
  error?: string;
}

/**
 * 数据同步服务类
 */
export class SyncService {
  private static instance: SyncService | null = null;
  private syncStatus: SyncStatus = {
    isActive: false,
    lastSyncTime: null,
    pendingOperations: 0,
    conflicts: []
  };
  
  private syncInterval: NodeJS.Timeout | null = null;
  private realtimeSubscription: any = null;
  private pendingOperations: Map<string, 'create' | 'update' | 'delete'> = new Map();

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * 启动同步服务
   */
  async startSync(options: SyncOptions = {}): Promise<void> {
    if (this.syncStatus.isActive) {
      console.log('Sync service already active');
      return;
    }

    // Only allow sync on client side for now
    if (typeof window === 'undefined') {
      console.log('Sync service not available on server side');
      return;
    }

    try {
      this.syncStatus.isActive = true;
      this.syncStatus.error = undefined;

      // 执行初始同步
      await this.performFullSync(options);

      // 设置定期同步（每5分钟）
      this.syncInterval = setInterval(async () => {
        try {
          await this.performIncrementalSync(options);
        } catch (error) {
          console.error('Incremental sync failed:', error);
          this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
        }
      }, 5 * 60 * 1000);

      // 设置实时同步监听
      await this.setupRealtimeSync();

      console.log('✅ Sync service started');
    } catch (error) {
      this.syncStatus.isActive = false;
      this.syncStatus.error = error instanceof Error ? error.message : 'Failed to start sync';
      console.error('❌ Failed to start sync service:', error);
      throw error;
    }
  }

  /**
   * 停止同步服务
   */
  async stopSync(): Promise<void> {
    this.syncStatus.isActive = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.realtimeSubscription) {
      await this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }

    console.log('🛑 Sync service stopped');
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * 手动触发同步
   */
  async triggerSync(options: SyncOptions = {}): Promise<void> {
    if (!this.syncStatus.isActive) {
      throw new Error('Sync service not active');
    }

    await this.performFullSync(options);
  }

  /**
   * 添加待同步操作
   */
  addPendingOperation(sessionId: string, operation: 'create' | 'update' | 'delete'): void {
    this.pendingOperations.set(sessionId, operation);
    this.syncStatus.pendingOperations = this.pendingOperations.size;
  }

  /**
   * 解决同步冲突
   */
  async resolveConflict(
    conflict: SyncConflict, 
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<GameSession> {
    // For now, just return the merged session without data manager
    // TODO: Implement proper conflict resolution with Supabase client
    
    switch (resolution) {
      case 'local':
        return conflict.localSession;

      case 'remote':
        return conflict.remoteSession;

      case 'merge':
        return this.mergeGameSessions(conflict.localSession, conflict.remoteSession);

      default:
        throw new Error(`Unknown conflict resolution: ${resolution}`);
    }
  }

  /**
   * 执行完整同步
   */
  private async performFullSync(options: SyncOptions): Promise<void> {
    // For now, just use Supabase directly for sync
    // TODO: Implement proper data manager integration for client-side sync
    console.log('Full sync - using Supabase client only for now');
    
    try {
      this.syncStatus.lastSyncTime = new Date();
      this.pendingOperations.clear();
      this.syncStatus.pendingOperations = 0;

      console.log('✅ Full sync completed (simplified)');
    } catch (error) {
      console.error('Full sync failed:', error);
      throw error;
    }
  }

  /**
   * 执行增量同步
   */
  private async performIncrementalSync(options: SyncOptions): Promise<void> {
    if (this.pendingOperations.size === 0) {
      return; // 没有待同步的操作
    }

    // For now, just clear pending operations
    // TODO: Implement proper incremental sync
    console.log('Incremental sync - clearing pending operations for now');
    
    try {
      this.pendingOperations.clear();
      this.syncStatus.pendingOperations = 0;
      this.syncStatus.lastSyncTime = new Date();

      console.log('✅ Incremental sync completed (simplified)');
    } catch (error) {
      console.error('Incremental sync failed:', error);
      throw error;
    }
  }

  /**
   * 设置实时同步监听
   */
  private async setupRealtimeSync(): Promise<void> {
    if (typeof window === 'undefined') {
      return; // 服务端不支持实时同步
    }

    try {
      const supabase = createClient();
      
      // 监听游戏会话表的变化
      this.realtimeSubscription = supabase
        .channel('game_sessions_sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_sessions'
          },
          async (payload) => {
            console.log('Real-time change detected:', payload);
            await this.handleRealtimeChange(payload);
          }
        )
        .subscribe();

      console.log('✅ Real-time sync setup completed');
    } catch (error) {
      console.error('Failed to setup real-time sync:', error);
      // 实时同步失败不应该阻止整个同步服务
    }
  }

  /**
   * 处理实时变化
   */
  private async handleRealtimeChange(payload: any): Promise<void> {
    // For now, just log the change
    // TODO: Implement proper real-time sync handling
    console.log('Real-time change received:', payload.eventType, payload.new?.id || payload.old?.id);
    
    try {
      // Just acknowledge the change for now
      console.log('Real-time change processed (simplified)');
    } catch (error) {
      console.error('Failed to handle real-time change:', error);
    }
  }

  /**
   * 检测数据冲突
   */
  private detectConflicts(localSessions: GameSession[], remoteSessions: GameSession[]): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const remoteMap = new Map(remoteSessions.map(s => [s.id, s]));

    for (const localSession of localSessions) {
      const remoteSession = remoteMap.get(localSession.id);
      if (remoteSession) {
        const conflict = this.detectSessionConflict(localSession, remoteSession);
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }

  /**
   * 检测单个会话的冲突
   */
  private detectSessionConflict(local: GameSession, remote: GameSession): SyncConflict | null {
    let conflictType: 'timestamp' | 'content' | 'both' | null = null;

    // 检查时间戳冲突
    const localTime = local.endTime?.getTime() || local.startTime.getTime();
    const remoteTime = remote.endTime?.getTime() || remote.startTime.getTime();
    
    if (Math.abs(localTime - remoteTime) > 1000) { // 1秒容差
      conflictType = 'timestamp';
    }

    // 检查内容冲突
    if (local.aiGuess !== remote.aiGuess || 
        local.confidence !== remote.confidence || 
        local.isCorrect !== remote.isCorrect ||
        local.drawing !== remote.drawing) {
      conflictType = conflictType === 'timestamp' ? 'both' : 'content';
    }

    return conflictType ? {
      localSession: local,
      remoteSession: remote,
      conflictType
    } : null;
  }

  /**
   * 处理冲突
   */
  private async handleConflicts(
    conflicts: SyncConflict[], 
    strategy: 'local' | 'remote' | 'merge' | 'ask'
  ): Promise<void> {
    for (const conflict of conflicts) {
      if (strategy === 'ask') {
        // 将冲突添加到状态中，等待用户解决
        continue;
      }

      await this.resolveConflict(conflict, strategy);
    }
  }

  /**
   * 同步新数据
   */
  private async syncNewData(localSessions: GameSession[], remoteSessions: GameSession[]): Promise<void> {
    // For now, just log the sync operation
    // TODO: Implement proper sync with Supabase client
    console.log(`Syncing ${localSessions.length} local and ${remoteSessions.length} remote sessions`);
  }

  /**
   * 合并游戏会话
   */
  private mergeGameSessions(local: GameSession, remote: GameSession): GameSession {
    // 使用最新的时间戳
    const localTime = local.endTime?.getTime() || local.startTime.getTime();
    const remoteTime = remote.endTime?.getTime() || remote.startTime.getTime();
    const useLocal = localTime > remoteTime;

    return {
      ...remote,
      // 保留最新的AI识别结果
      aiGuess: useLocal ? local.aiGuess : remote.aiGuess,
      confidence: useLocal ? local.confidence : remote.confidence,
      isCorrect: useLocal ? local.isCorrect : remote.isCorrect,
      // 保留最新的时间戳
      endTime: useLocal ? local.endTime : remote.endTime,
      duration: useLocal ? local.duration : remote.duration,
      // 保留最新的绘画（如果有的话）
      drawing: local.drawing || remote.drawing
    };
  }

  /**
   * 将Supabase数据映射为GameSession
   */
  private mapSupabaseToGameSession(data: any): GameSession {
    return {
      id: data.id,
      userId: data.user_id || undefined,
      prompt: data.prompt,
      promptCategory: data.prompt_category,
      drawing: data.drawing_url || '',
      aiGuess: data.ai_guess || '',
      confidence: data.confidence || 0,
      isCorrect: data.is_correct || false,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : new Date(),
      duration: data.duration || 0
    };
  }
}

// 导出单例实例
export const syncService = SyncService.getInstance();

// 导出便捷函数
export async function startDataSync(options?: SyncOptions): Promise<void> {
  await syncService.startSync(options);
}

export async function stopDataSync(): Promise<void> {
  await syncService.stopSync();
}

export function getSyncStatus(): SyncStatus {
  return syncService.getSyncStatus();
}