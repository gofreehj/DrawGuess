import { NextRequest } from 'next/server';
import { createErrorResponse, ERROR_CODES, handleError, createErrorResponseFromAPIError } from '@/lib/error-handler';
import { getDataManager } from '@/lib/data-adapters';

// Define achievement types
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface CategoryStats {
  category: string;
  totalGames: number;
  successRate: number;
  averageConfidence: number;
}

interface UserStats {
  totalGames: number;
  successfulGuesses: number;
  averageConfidence: number;
  successRate: number;
  averageDuration: number;
  streakCurrent: number;
  streakBest: number;
  categoryStats: CategoryStats[];
  achievements: Achievement[];
}

// API route for user statistics
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    // Initialize data manager if not already done
    const dataManager = getDataManager();
    if (!dataManager.isInitialized()) {
      await dataManager.initialize();
    }

    // Get basic game stats
    const basicStats = await dataManager.getGameStats(userIdParam || undefined);
    
    // Get detailed game history for advanced calculations
    const gameHistory = await dataManager.getGameHistory({ 
      limit: 1000, 
      userId: userIdParam || undefined
    });

    // Calculate advanced statistics
    const advancedStats = calculateAdvancedStats(gameHistory);
    const categoryStats = calculateCategoryStats(gameHistory);
    const achievements = calculateAchievements(gameHistory, basicStats);

    // Combine all statistics
    const userStats: UserStats = {
      ...basicStats,
      ...advancedStats,
      categoryStats,
      achievements
    };

    return Response.json(userStats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    const apiError = handleError(error, 'User Stats');
    return createErrorResponseFromAPIError(apiError);
  }
}

/**
 * Calculate advanced statistics from game history
 */
function calculateAdvancedStats(gameHistory: any[]) {
  if (gameHistory.length === 0) {
    return {
      averageDuration: 0,
      streakCurrent: 0,
      streakBest: 0
    };
  }

  // Calculate average duration
  const totalDuration = gameHistory.reduce((sum, game) => sum + (game.duration || 0), 0);
  const averageDuration = totalDuration / gameHistory.length;

  // Calculate streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Sort by date to calculate streaks properly
  const sortedGames = [...gameHistory].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  for (let i = 0; i < sortedGames.length; i++) {
    const game = sortedGames[i];
    
    if (game.isCorrect) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
      
      // If this is one of the most recent games, it contributes to current streak
      if (i >= sortedGames.length - tempStreak) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      // Reset current streak if we hit an incorrect answer in recent games
      if (i >= sortedGames.length - 10) { // Check last 10 games for current streak
        currentStreak = 0;
      }
    }
  }

  return {
    averageDuration,
    streakCurrent: currentStreak,
    streakBest: bestStreak
  };
}

/**
 * Calculate statistics by category
 */
function calculateCategoryStats(gameHistory: any[]): CategoryStats[] {
  const categoryMap = new Map<string, {
    totalGames: number;
    successfulGames: number;
    totalConfidence: number;
  }>();

  // Group games by category
  for (const game of gameHistory) {
    const category = game.promptCategory;
    const existing = categoryMap.get(category) || {
      totalGames: 0,
      successfulGames: 0,
      totalConfidence: 0
    };

    existing.totalGames++;
    if (game.isCorrect) {
      existing.successfulGames++;
    }
    existing.totalConfidence += game.confidence || 0;

    categoryMap.set(category, existing);
  }

  // Convert to CategoryStats array
  const categoryStats: CategoryStats[] = [];
  for (const [category, stats] of categoryMap) {
    categoryStats.push({
      category,
      totalGames: stats.totalGames,
      successRate: stats.totalGames > 0 ? (stats.successfulGames / stats.totalGames) * 100 : 0,
      averageConfidence: stats.totalGames > 0 ? stats.totalConfidence / stats.totalGames : 0
    });
  }

  // Sort by total games (most played categories first)
  return categoryStats.sort((a, b) => b.totalGames - a.totalGames);
}

/**
 * Calculate achievements based on game history and stats
 */
function calculateAchievements(gameHistory: any[], basicStats: any): Achievement[] {
  const achievements: Achievement[] = [];

  // Define all possible achievements
  const achievementDefinitions = [
    {
      id: 'first_game',
      name: '初次尝试',
      description: '完成第一个游戏',
      icon: '🎯',
      condition: () => basicStats.totalGames >= 1
    },
    {
      id: 'ten_games',
      name: '小试牛刀',
      description: '完成10个游戏',
      icon: '🎮',
      condition: () => basicStats.totalGames >= 10,
      progress: () => Math.min(basicStats.totalGames, 10),
      maxProgress: 10
    },
    {
      id: 'fifty_games',
      name: '游戏达人',
      description: '完成50个游戏',
      icon: '🏆',
      condition: () => basicStats.totalGames >= 50,
      progress: () => Math.min(basicStats.totalGames, 50),
      maxProgress: 50
    },
    {
      id: 'hundred_games',
      name: '游戏大师',
      description: '完成100个游戏',
      icon: '👑',
      condition: () => basicStats.totalGames >= 100,
      progress: () => Math.min(basicStats.totalGames, 100),
      maxProgress: 100
    },
    {
      id: 'high_accuracy',
      name: '神射手',
      description: '达到80%以上的成功率（至少10局游戏）',
      icon: '🎯',
      condition: () => basicStats.totalGames >= 10 && basicStats.successRate >= 80
    },
    {
      id: 'perfect_accuracy',
      name: '完美主义者',
      description: '达到95%以上的成功率（至少20局游戏）',
      icon: '💎',
      condition: () => basicStats.totalGames >= 20 && basicStats.successRate >= 95
    },
    {
      id: 'streak_five',
      name: '连胜新手',
      description: '连续成功5局',
      icon: '🔥',
      condition: () => {
        const streaks = calculateStreaks(gameHistory);
        return streaks.bestStreak >= 5;
      },
      progress: () => {
        const streaks = calculateStreaks(gameHistory);
        return Math.min(streaks.bestStreak, 5);
      },
      maxProgress: 5
    },
    {
      id: 'streak_ten',
      name: '连胜高手',
      description: '连续成功10局',
      icon: '🌟',
      condition: () => {
        const streaks = calculateStreaks(gameHistory);
        return streaks.bestStreak >= 10;
      },
      progress: () => {
        const streaks = calculateStreaks(gameHistory);
        return Math.min(streaks.bestStreak, 10);
      },
      maxProgress: 10
    },
    {
      id: 'high_confidence',
      name: '自信满满',
      description: '平均置信度达到90%以上（至少10局游戏）',
      icon: '💪',
      condition: () => basicStats.totalGames >= 10 && basicStats.averageConfidence >= 0.9
    },
    {
      id: 'speed_demon',
      name: '闪电侠',
      description: '平均用时少于30秒（至少10局游戏）',
      icon: '⚡',
      condition: () => {
        if (basicStats.totalGames < 10) return false;
        const avgDuration = calculateAdvancedStats(gameHistory).averageDuration;
        return avgDuration <= 30;
      }
    },
    {
      id: 'category_master',
      name: '全能选手',
      description: '在5个不同分类中都有成功记录',
      icon: '🌈',
      condition: () => {
        const categories = new Set();
        for (const game of gameHistory) {
          if (game.isCorrect) {
            categories.add(game.promptCategory);
          }
        }
        return categories.size >= 5;
      },
      progress: () => {
        const categories = new Set();
        for (const game of gameHistory) {
          if (game.isCorrect) {
            categories.add(game.promptCategory);
          }
        }
        return Math.min(categories.size, 5);
      },
      maxProgress: 5
    }
  ];

  // Check each achievement
  for (const def of achievementDefinitions) {
    const isUnlocked = def.condition();
    const achievement: Achievement = {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon
    };

    if (isUnlocked) {
      // Achievement is unlocked, find when it was first achieved
      achievement.unlockedAt = findAchievementUnlockDate(def.id, gameHistory, basicStats);
    } else if (def.progress && def.maxProgress) {
      // Achievement is not unlocked but has progress
      achievement.progress = def.progress();
      achievement.maxProgress = def.maxProgress;
    }

    achievements.push(achievement);
  }

  return achievements;
}

/**
 * Calculate streaks from game history
 */
function calculateStreaks(gameHistory: any[]) {
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  const sortedGames = [...gameHistory].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  for (let i = 0; i < sortedGames.length; i++) {
    const game = sortedGames[i];
    
    if (game.isCorrect) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
      
      if (i >= sortedGames.length - tempStreak) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      if (i >= sortedGames.length - 10) {
        currentStreak = 0;
      }
    }
  }

  return { currentStreak, bestStreak };
}

/**
 * Find when an achievement was first unlocked
 */
function findAchievementUnlockDate(achievementId: string, gameHistory: any[], basicStats: any): Date {
  // For simplicity, we'll estimate the unlock date based on the achievement type
  // In a real implementation, you'd want to track this more precisely
  
  const sortedGames = [...gameHistory].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  switch (achievementId) {
    case 'first_game':
      return sortedGames.length > 0 ? new Date(sortedGames[0].startTime) : new Date();
    
    case 'ten_games':
      return sortedGames.length >= 10 ? new Date(sortedGames[9].startTime) : new Date();
    
    case 'fifty_games':
      return sortedGames.length >= 50 ? new Date(sortedGames[49].startTime) : new Date();
    
    case 'hundred_games':
      return sortedGames.length >= 100 ? new Date(sortedGames[99].startTime) : new Date();
    
    default:
      // For other achievements, use the date of the most recent game
      return sortedGames.length > 0 ? new Date(sortedGames[sortedGames.length - 1].startTime) : new Date();
  }
}