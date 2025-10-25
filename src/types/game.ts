// Type definitions for the game
export interface GameSession {
  id: string;
  userId?: string;
  prompt: string;
  promptCategory: string;
  drawing: string; // base64 image data
  aiGuess: string;
  confidence: number;
  isCorrect: boolean;
  startTime: Date;
  endTime: Date;
  duration: number; // seconds
}

export interface Prompt {
  id: string;
  text: string;
  category: 'mammal' | 'bird' | 'fish' | 'reptile' | 'insect';
  difficulty: 'easy' | 'medium' | 'hard';
  keywords: string[];
  isActive: boolean;
}

export interface User {
  id: string;
  username?: string;
  email?: string;
  stats: {
    totalGames: number;
    successfulGuesses: number;
    averageConfidence: number;
  };
  createdAt: Date;
}

export interface AICallLog {
  timestamp: Date;
  provider: 'openai' | 'gemini';
  model: string;
  requestData: {
    prompt: string;
    imageSize?: string;
    temperature?: number;
    maxTokens?: number;
    fullPrompt?: string; // 完整的AI提示词
  };
  responseData: {
    guess: string;
    confidence: number;
    reasoning?: string;
    tokensUsed?: number;
    responseTime?: number; // milliseconds
    rawResponse?: string; // 原始AI响应
  };
  reasoningAnalysis?: {
    mentionsVisualFeatures: boolean; // 是否提到视觉特征
    mentionsOriginalPrompt: boolean; // 是否提到原始提示
    visualKeywords: string[]; // 视觉相关关键词
    confidenceFactors: string[]; // 置信度影响因素
  };
  success: boolean;
  error?: string;
  cost?: number; // estimated cost in USD
}

export interface GameResult {
  originalPrompt: string;
  aiGuess: string;
  confidence: number;
  isCorrect: boolean;
  reasoning?: string;
  duration?: number;
  drawing?: string; // base64 image data
  aiCallLog?: AICallLog; // 添加AI调用日志
}

export interface DrawingTools {
  brushSize: number;
  brushColor: string;
  tool: 'brush' | 'eraser';
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
  requestId: string;
}