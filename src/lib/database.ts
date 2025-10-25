import Database from 'better-sqlite3';
import * as path from 'path';
import { GameSession, Prompt, User } from '../types/game';

// Database connection instance
let db: Database.Database | null = null;

/**
 * Initialize database connection and create tables if they don't exist
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Create database file in the data directory
  const dbPath = path.join(process.cwd(), 'data', 'game.db');
  
  try {
    db = new Database(dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Create tables
    createTables();
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database connection instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Execute a query with error handling
 */
export function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): T[] {
  try {
    const database = getDatabase();
    const stmt = database.prepare(query);
    const result = stmt.all(...params);
    return result as T[];
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

/**
 * Execute a single row query
 */
export function executeQuerySingle<T = any>(
  query: string, 
  params: any[] = []
): T | undefined {
  try {
    const database = getDatabase();
    const stmt = database.prepare(query);
    const result = stmt.get(...params);
    return result as T | undefined;
  } catch (error) {
    console.error('Single query execution failed:', error);
    throw error;
  }
}

/**
 * Execute an insert/update/delete query
 */
export function executeUpdate(
  query: string, 
  params: any[] = []
): Database.RunResult {
  try {
    const database = getDatabase();
    const stmt = database.prepare(query);
    const result = stmt.run(...params);
    return result;
  } catch (error) {
    console.error('Update query execution failed:', error);
    throw error;
  }
}

/**
 * Create database tables
 */
function createTables(): void {
  const database = getDatabase();
  
  // Create users table (optional)
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      email TEXT,
      total_games INTEGER DEFAULT 0,
      successful_guesses INTEGER DEFAULT 0,
      average_confidence REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create prompts table
  database.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
      keywords TEXT, -- JSON array of keywords
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create game_sessions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      prompt TEXT NOT NULL,
      prompt_category TEXT NOT NULL,
      drawing TEXT, -- base64 image data
      ai_guess TEXT,
      confidence REAL,
      is_correct BOOLEAN,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration INTEGER, -- seconds
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  console.log('Database tables created successfully');
}

// ==================== USER OPERATIONS ====================

/**
 * Create a new user
 */
export function createUser(user: Omit<User, 'stats' | 'createdAt'>): User {
  const id = user.id || crypto.randomUUID();
  const now = new Date();
  
  executeUpdate(
    `INSERT INTO users (id, username, email, created_at) 
     VALUES (?, ?, ?, ?)`,
    [id, user.username || null, user.email || null, now.toISOString()]
  );
  
  return {
    id,
    username: user.username,
    email: user.email,
    stats: {
      totalGames: 0,
      successfulGuesses: 0,
      averageConfidence: 0.0
    },
    createdAt: now
  };
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  const result = executeQuerySingle<any>(
    `SELECT * FROM users WHERE id = ?`,
    [id]
  );
  
  if (!result) return null;
  
  return {
    id: result.id,
    username: result.username,
    email: result.email,
    stats: {
      totalGames: result.total_games,
      successfulGuesses: result.successful_guesses,
      averageConfidence: result.average_confidence
    },
    createdAt: new Date(result.created_at)
  };
}

/**
 * Update user stats
 */
export function updateUserStats(userId: string, stats: User['stats']): void {
  executeUpdate(
    `UPDATE users 
     SET total_games = ?, successful_guesses = ?, average_confidence = ?
     WHERE id = ?`,
    [stats.totalGames, stats.successfulGuesses, stats.averageConfidence, userId]
  );
}

// ==================== PROMPT OPERATIONS ====================

/**
 * Create a new prompt
 */
export function createPrompt(prompt: Omit<Prompt, 'id'>): Prompt {
  const id = crypto.randomUUID();
  
  executeUpdate(
    `INSERT INTO prompts (id, text, category, difficulty, keywords, is_active) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id, 
      prompt.text, 
      prompt.category, 
      prompt.difficulty, 
      JSON.stringify(prompt.keywords),
      prompt.isActive ? 1 : 0
    ]
  );
  
  return { id, ...prompt };
}

/**
 * Get all active prompts
 */
export function getActivePrompts(): Prompt[] {
  const results = executeQuery<any>(
    `SELECT * FROM prompts WHERE is_active = 1`
  );
  
  return results.map(row => ({
    id: row.id,
    text: row.text,
    category: row.category as Prompt['category'],
    difficulty: row.difficulty as Prompt['difficulty'],
    keywords: JSON.parse(row.keywords || '[]'),
    isActive: Boolean(row.is_active)
  }));
}

/**
 * Get random prompt
 */
export function getRandomPrompt(): Prompt | null {
  const result = executeQuerySingle<any>(
    `SELECT * FROM prompts WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1`
  );
  
  if (!result) return null;
  
  return {
    id: result.id,
    text: result.text,
    category: result.category as Prompt['category'],
    difficulty: result.difficulty as Prompt['difficulty'],
    keywords: JSON.parse(result.keywords || '[]'),
    isActive: Boolean(result.is_active)
  };
}

/**
 * Get prompt by ID
 */
export function getPromptById(id: string): Prompt | null {
  const result = executeQuerySingle<any>(
    `SELECT * FROM prompts WHERE id = ?`,
    [id]
  );
  
  if (!result) return null;
  
  return {
    id: result.id,
    text: result.text,
    category: result.category as Prompt['category'],
    difficulty: result.difficulty as Prompt['difficulty'],
    keywords: JSON.parse(result.keywords || '[]'),
    isActive: Boolean(result.is_active)
  };
}

/**
 * Update prompt
 */
export function updatePrompt(id: string, updates: Partial<Omit<Prompt, 'id'>>): void {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.text !== undefined) {
    fields.push('text = ?');
    values.push(updates.text);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }
  if (updates.difficulty !== undefined) {
    fields.push('difficulty = ?');
    values.push(updates.difficulty);
  }
  if (updates.keywords !== undefined) {
    fields.push('keywords = ?');
    values.push(JSON.stringify(updates.keywords));
  }
  if (updates.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  executeUpdate(
    `UPDATE prompts SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Delete prompt
 */
export function deletePrompt(id: string): void {
  executeUpdate(`DELETE FROM prompts WHERE id = ?`, [id]);
}

// ==================== GAME SESSION OPERATIONS ====================

/**
 * Create a new game session
 */
export function createGameSession(session: Omit<GameSession, 'id'>): GameSession {
  const id = crypto.randomUUID();
  
  executeUpdate(
    `INSERT INTO game_sessions (
      id, user_id, prompt, prompt_category, drawing, ai_guess, 
      confidence, is_correct, start_time, end_time, duration
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      session.userId || null,
      session.prompt,
      session.promptCategory,
      session.drawing || null,
      session.aiGuess || null,
      session.confidence || null,
      session.isCorrect !== undefined ? (session.isCorrect ? 1 : 0) : null,
      session.startTime.toISOString(),
      session.endTime?.toISOString() || null,
      session.duration || null
    ]
  );
  
  return { id, ...session };
}

/**
 * Get game session by ID
 */
export function getGameSessionById(id: string): GameSession | null {
  const result = executeQuerySingle<any>(
    `SELECT * FROM game_sessions WHERE id = ?`,
    [id]
  );
  
  if (!result) return null;
  
  return {
    id: result.id,
    userId: result.user_id,
    prompt: result.prompt,
    promptCategory: result.prompt_category,
    drawing: result.drawing,
    aiGuess: result.ai_guess,
    confidence: result.confidence,
    isCorrect: Boolean(result.is_correct),
    startTime: new Date(result.start_time),
    endTime: result.end_time ? new Date(result.end_time) : new Date(),
    duration: result.duration || 0
  };
}

/**
 * Update game session
 */
export function updateGameSession(id: string, updates: Partial<Omit<GameSession, 'id'>>): void {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.drawing !== undefined) {
    fields.push('drawing = ?');
    values.push(updates.drawing);
  }
  if (updates.aiGuess !== undefined) {
    fields.push('ai_guess = ?');
    values.push(updates.aiGuess);
  }
  if (updates.confidence !== undefined) {
    fields.push('confidence = ?');
    values.push(updates.confidence);
  }
  if (updates.isCorrect !== undefined) {
    fields.push('is_correct = ?');
    values.push(updates.isCorrect ? 1 : 0);
  }
  if (updates.endTime !== undefined) {
    fields.push('end_time = ?');
    values.push(updates.endTime.toISOString());
  }
  if (updates.duration !== undefined) {
    fields.push('duration = ?');
    values.push(updates.duration);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  executeUpdate(
    `UPDATE game_sessions SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * Get game sessions by user ID
 */
export function getGameSessionsByUserId(userId: string, limit: number = 50): GameSession[] {
  const results = executeQuery<any>(
    `SELECT * FROM game_sessions WHERE user_id = ? 
     ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
  
  return results.map(row => ({
    id: row.id,
    userId: row.user_id,
    prompt: row.prompt,
    promptCategory: row.prompt_category,
    drawing: row.drawing,
    aiGuess: row.ai_guess,
    confidence: row.confidence,
    isCorrect: Boolean(row.is_correct),
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : new Date(),
    duration: row.duration || 0
  }));
}

/**
 * Get all game sessions (for history)
 */
export function getAllGameSessions(limit: number = 100): GameSession[] {
  const results = executeQuery<any>(
    `SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  
  return results.map(row => ({
    id: row.id,
    userId: row.user_id,
    prompt: row.prompt,
    promptCategory: row.prompt_category,
    drawing: row.drawing,
    aiGuess: row.ai_guess,
    confidence: row.confidence,
    isCorrect: Boolean(row.is_correct),
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : new Date(),
    duration: row.duration || 0
  }));
}

/**
 * Delete game session
 */
export function deleteGameSession(id: string): void {
  executeUpdate(`DELETE FROM game_sessions WHERE id = ?`, [id]);
}

/**
 * Delete multiple game sessions by IDs
 */
export function deleteGameSessions(ids: string[]): number {
  if (ids.length === 0) return 0;
  
  const placeholders = ids.map(() => '?').join(',');
  const result = executeUpdate(
    `DELETE FROM game_sessions WHERE id IN (${placeholders})`,
    ids
  );
  return result.changes;
}

/**
 * Delete all game sessions
 */
export function deleteAllGameSessions(): number {
  const result = executeUpdate(`DELETE FROM game_sessions`);
  return result.changes;
}

/**
 * Delete game sessions older than specified days
 */
export function deleteOldGameSessions(daysOld: number): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = executeUpdate(
    `DELETE FROM game_sessions WHERE created_at < ?`,
    [cutoffDate.toISOString()]
  );
  return result.changes;
}

/**
 * Get game statistics
 */
export function getGameStatistics(): {
  totalGames: number;
  successfulGuesses: number;
  averageConfidence: number;
  successRate: number;
} {
  const result = executeQuerySingle<any>(
    `SELECT 
      COUNT(*) as total_games,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as successful_guesses,
      AVG(confidence) as average_confidence
     FROM game_sessions 
     WHERE ai_guess IS NOT NULL`
  );
  
  const totalGames = result?.total_games || 0;
  const successfulGuesses = result?.successful_guesses || 0;
  const averageConfidence = result?.average_confidence || 0;
  const successRate = totalGames > 0 ? (successfulGuesses / totalGames) * 100 : 0;
  
  return {
    totalGames,
    successfulGuesses,
    averageConfidence,
    successRate
  };
}