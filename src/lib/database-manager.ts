/**
 * 数据库管理器 - 统一的数据库访问入口
 * 数据库应该在服务启动时就初始化完成，运行时直接使用
 */

import * as db from './database';

class DatabaseManager {
  private static instance: DatabaseManager;
  private isReady = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 标记数据库为已初始化状态
   * 这应该在服务启动时调用
   */
  markAsReady(): void {
    this.isReady = true;
  }

  /**
   * 检查数据库是否已准备就绪
   */
  private ensureReady(): void {
    if (!this.isReady) {
      throw new Error('Database not initialized. Please ensure database is initialized at server startup.');
    }
  }

  // ==================== PROMPT OPERATIONS ====================

  getRandomPrompt() {
    this.ensureReady();
    return db.getRandomPrompt();
  }

  getActivePrompts() {
    this.ensureReady();
    return db.getActivePrompts();
  }

  createPrompt(prompt: Parameters<typeof db.createPrompt>[0]) {
    this.ensureReady();
    return db.createPrompt(prompt);
  }

  getPromptById(id: string) {
    this.ensureReady();
    return db.getPromptById(id);
  }

  // ==================== GAME SESSION OPERATIONS ====================

  createGameSession(session: Parameters<typeof db.createGameSession>[0]) {
    this.ensureReady();
    return db.createGameSession(session);
  }

  getGameSessionById(id: string) {
    this.ensureReady();
    return db.getGameSessionById(id);
  }

  updateGameSession(id: string, updates: Parameters<typeof db.updateGameSession>[1]) {
    this.ensureReady();
    return db.updateGameSession(id, updates);
  }

  getAllGameSessions(limit?: number) {
    this.ensureReady();
    return db.getAllGameSessions(limit);
  }

  deleteGameSessions(ids: string[]) {
    this.ensureReady();
    return db.deleteGameSessions(ids);
  }

  deleteAllGameSessions() {
    this.ensureReady();
    return db.deleteAllGameSessions();
  }

  deleteOldGameSessions(daysOld: number) {
    this.ensureReady();
    return db.deleteOldGameSessions(daysOld);
  }

  // ==================== USER OPERATIONS ====================

  createUser(user: Parameters<typeof db.createUser>[0]) {
    this.ensureReady();
    return db.createUser(user);
  }

  getUserById(id: string) {
    this.ensureReady();
    return db.getUserById(id);
  }

  updateUserStats(userId: string, stats: Parameters<typeof db.updateUserStats>[1]) {
    this.ensureReady();
    return db.updateUserStats(userId, stats);
  }

  // ==================== STATISTICS ====================

  getGameStatistics() {
    this.ensureReady();
    return db.getGameStatistics();
  }

  // ==================== HEALTH CHECK ====================

  healthCheck() {
    this.ensureReady();
    const prompts = this.getActivePrompts();
    const stats = this.getGameStatistics();
    
    return {
      isHealthy: prompts.length > 0,
      promptsCount: prompts.length,
      hasMinimumPrompts: prompts.length >= 20,
      stats
    };
  }
}

// 导出单例实例
export const databaseManager = DatabaseManager.getInstance();

// 为了向后兼容，也导出类
export { DatabaseManager };