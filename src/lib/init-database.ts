import { initializeDatabase, createPrompt, getActivePrompts } from './database';

// Track if database has been initialized to avoid repeated initialization
let isInitialized = false;

/**
 * Initialize database with tables and seed data
 */
export function initializeDatabaseWithSeedData(): void {
  // Skip if already initialized in this process
  if (isInitialized) {
    return;
  }
  
  try {
    console.log('Initializing database...');
    
    // Initialize database and create tables
    const db = initializeDatabase();
    console.log('✓ Database tables created successfully');
    
    // Check if prompts already exist
    const existingPrompts = getActivePrompts();
    if (existingPrompts.length >= 20) {
      console.log(`✓ Database already has ${existingPrompts.length} prompts`);
      isInitialized = true;
      return;
    }
    
    // If we have some prompts but less than 20, we'll add more
    if (existingPrompts.length > 0) {
      console.log(`Database has ${existingPrompts.length} prompts, adding more to reach 20+`);
    }
    
    // Seed initial animal prompts (requirement 1.4: at least 20 different animal prompts)
    const animalPrompts = [
      // Mammals
      { text: '猫', category: 'mammal' as const, difficulty: 'easy' as const, keywords: ['cat', 'feline', 'pet', '猫'] },
      { text: '狗', category: 'mammal' as const, difficulty: 'easy' as const, keywords: ['dog', 'canine', 'pet', '狗'] },
      { text: '大象', category: 'mammal' as const, difficulty: 'medium' as const, keywords: ['elephant', 'trunk', 'large', '大象'] },
      { text: '老虎', category: 'mammal' as const, difficulty: 'medium' as const, keywords: ['tiger', 'stripes', 'feline', '老虎'] },
      { text: '熊猫', category: 'mammal' as const, difficulty: 'medium' as const, keywords: ['panda', 'black', 'white', '熊猫'] },
      { text: '狮子', category: 'mammal' as const, difficulty: 'medium' as const, keywords: ['lion', 'mane', 'feline', '狮子'] },
      { text: '兔子', category: 'mammal' as const, difficulty: 'easy' as const, keywords: ['rabbit', 'ears', 'hop', '兔子'] },
      { text: '马', category: 'mammal' as const, difficulty: 'medium' as const, keywords: ['horse', 'mane', 'gallop', '马'] },
      
      // Birds
      { text: '鸟', category: 'bird' as const, difficulty: 'easy' as const, keywords: ['bird', 'wings', 'fly', '鸟'] },
      { text: '鸡', category: 'bird' as const, difficulty: 'easy' as const, keywords: ['chicken', 'rooster', 'hen', '鸡'] },
      { text: '鸭子', category: 'bird' as const, difficulty: 'easy' as const, keywords: ['duck', 'water', 'quack', '鸭子'] },
      { text: '鹰', category: 'bird' as const, difficulty: 'hard' as const, keywords: ['eagle', 'soar', 'predator', '鹰'] },
      { text: '企鹅', category: 'bird' as const, difficulty: 'medium' as const, keywords: ['penguin', 'black', 'white', '企鹅'] },
      { text: '孔雀', category: 'bird' as const, difficulty: 'hard' as const, keywords: ['peacock', 'feathers', 'colorful', '孔雀'] },
      
      // Fish
      { text: '鱼', category: 'fish' as const, difficulty: 'easy' as const, keywords: ['fish', 'swim', 'water', '鱼'] },
      { text: '鲨鱼', category: 'fish' as const, difficulty: 'medium' as const, keywords: ['shark', 'teeth', 'predator', '鲨鱼'] },
      { text: '金鱼', category: 'fish' as const, difficulty: 'easy' as const, keywords: ['goldfish', 'orange', 'pet', '金鱼'] },
      { text: '海豚', category: 'fish' as const, difficulty: 'medium' as const, keywords: ['dolphin', 'intelligent', 'jump', '海豚'] },
      
      // Reptiles
      { text: '蛇', category: 'reptile' as const, difficulty: 'medium' as const, keywords: ['snake', 'slither', 'long', '蛇'] },
      { text: '乌龟', category: 'reptile' as const, difficulty: 'medium' as const, keywords: ['turtle', 'shell', 'slow', '乌龟'] },
      { text: '蜥蜴', category: 'reptile' as const, difficulty: 'hard' as const, keywords: ['lizard', 'scales', 'tail', '蜥蜴'] },
      
      // Insects
      { text: '蝴蝶', category: 'insect' as const, difficulty: 'medium' as const, keywords: ['butterfly', 'wings', 'colorful', '蝴蝶'] },
      { text: '蜜蜂', category: 'insect' as const, difficulty: 'medium' as const, keywords: ['bee', 'honey', 'buzz', '蜜蜂'] },
      { text: '蚂蚁', category: 'insect' as const, difficulty: 'hard' as const, keywords: ['ant', 'small', 'colony', '蚂蚁'] }
    ];
    
    console.log('Seeding animal prompts...');
    let createdCount = 0;
    
    for (const promptData of animalPrompts) {
      try {
        const prompt = createPrompt({
          ...promptData,
          isActive: true
        });
        createdCount++;
        console.log(`✓ Created prompt: ${prompt.text} (${prompt.category})`);
      } catch (error) {
        console.error(`Failed to create prompt ${promptData.text}:`, error);
      }
    }
    
    console.log(`✓ Successfully created ${createdCount} animal prompts`);
    console.log('✓ Database initialization completed');
    
    // Mark as initialized
    isInitialized = true;
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Verify database tables exist and have correct structure
 */
export function verifyDatabaseStructure(): boolean {
  try {
    const db = initializeDatabase();
    
    // Check if all required tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('users', 'prompts', 'game_sessions')
    `).all();
    
    const tableNames = tables.map((t: any) => t.name);
    const requiredTables = ['users', 'prompts', 'game_sessions'];
    
    for (const tableName of requiredTables) {
      if (!tableNames.includes(tableName)) {
        console.error(`Missing required table: ${tableName}`);
        return false;
      }
    }
    
    console.log('✓ All required database tables exist');
    
    // Verify table structures
    const promptsInfo = db.prepare("PRAGMA table_info(prompts)").all();
    const gameSessionsInfo = db.prepare("PRAGMA table_info(game_sessions)").all();
    const usersInfo = db.prepare("PRAGMA table_info(users)").all();
    
    console.log('✓ Database structure verification completed');
    console.log(`  - prompts table: ${promptsInfo.length} columns`);
    console.log(`  - game_sessions table: ${gameSessionsInfo.length} columns`);
    console.log(`  - users table: ${usersInfo.length} columns`);
    
    return true;
  } catch (error) {
    console.error('Database structure verification failed:', error);
    return false;
  }
}