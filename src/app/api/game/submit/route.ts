import { NextRequest } from 'next/server';
import { getGameSessionById, updateGameSession } from '@/lib/database';
import { aiService } from '@/lib/ai-service';
import { createErrorResponse, handleError, ERROR_CODES, createErrorResponseFromAPIError } from '@/lib/error-handler';

interface SubmitGameRequest {
  sessionId: string;
  imageData: string; // base64 image data
}

// API route for submitting drawings
export async function POST(request: NextRequest) {
  try {
    const body: SubmitGameRequest = await request.json();
    
    // Validate request body
    if (!body.sessionId || !body.imageData) {
      return createErrorResponse(
        ERROR_CODES.INVALID_REQUEST,
        'Missing required fields: sessionId and imageData are required',
        { sessionId: !!body.sessionId, imageData: !!body.imageData },
        400
      );
    }

    // Get the game session from database
    const gameSession = getGameSessionById(body.sessionId);
    
    if (!gameSession) {
      return createErrorResponse(
        ERROR_CODES.SESSION_NOT_FOUND,
        'Game session not found',
        `No session found with ID: ${body.sessionId}`,
        404
      );
    }

    // Check if session already has a result (prevent duplicate submissions)
    if (gameSession.aiGuess && gameSession.aiGuess.trim() !== '') {
      return createErrorResponse(
        ERROR_CODES.SESSION_ALREADY_COMPLETED,
        'This game session has already been completed',
        'Cannot submit drawing for an already completed session',
        409
      );
    }

    // Call AI service to recognize the drawing with enhanced fallback support
    const aiResponse = await aiService.recognizeWithFallback(body.imageData, gameSession.prompt, 3);
    
    if (!aiResponse.success || !aiResponse.result) {
      // Determine appropriate error code based on the type of failure
      const errorCode = aiResponse.fallbackUsed ? 
        ERROR_CODES.AI_SERVICE_UNAVAILABLE : 
        ERROR_CODES.AI_RECOGNITION_FAILED;
      
      const errorMessage = aiResponse.fallbackUsed ?
        'AI service is temporarily unavailable, but we provided a fallback result' :
        'Failed to recognize drawing';
        
      return createErrorResponse(
        errorCode,
        errorMessage,
        {
          originalError: aiResponse.error || 'AI service returned no result',
          fallbackUsed: aiResponse.fallbackUsed,
          retryCount: aiResponse.retryCount
        },
        aiResponse.fallbackUsed ? 503 : 500
      );
    }

    const { guess, confidence, reasoning } = aiResponse.result;
    
    // Compare AI guess with original prompt to determine correctness
    const isCorrect = compareGuessWithPrompt(guess, gameSession.prompt);
    
    // Calculate game duration
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - gameSession.startTime.getTime()) / 1000);
    
    // Update the game session with results
    updateGameSession(body.sessionId, {
      drawing: body.imageData,
      aiGuess: guess,
      confidence: confidence,
      isCorrect: isCorrect,
      endTime: endTime,
      duration: duration
    });

    // 调试日志
    console.log('🔍 API Route - AI Response:', {
      hasCallLog: !!aiResponse.result.callLog,
      callLogProvider: aiResponse.result.callLog?.provider,
      callLogSuccess: aiResponse.result.callLog?.success
    });

    // Return the game result with AI call log and service status
    return Response.json({
      sessionId: body.sessionId,
      originalPrompt: gameSession.prompt,
      aiGuess: guess,
      confidence: confidence,
      isCorrect: isCorrect,
      reasoning: reasoning,
      duration: duration,
      aiCallLog: aiResponse.result.callLog,
      serviceStatus: {
        fallbackUsed: aiResponse.fallbackUsed || false,
        retryCount: aiResponse.retryCount || 0,
        primaryServiceAvailable: !aiResponse.fallbackUsed
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error submitting game:', error);
    const apiError = handleError(error, 'Game Submit');
    return createErrorResponseFromAPIError(apiError);
  }
}

/**
 * Compares AI guess with the original prompt to determine correctness
 * This is a simplified version - the main logic is in the AI service
 */
function compareGuessWithPrompt(guess: string, originalPrompt: string): boolean {
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedPrompt = originalPrompt.toLowerCase().trim();
  
  // Direct match
  if (normalizedGuess === normalizedPrompt) {
    return true;
  }
  
  // Check if guess contains the prompt or vice versa
  if (normalizedGuess.includes(normalizedPrompt) || normalizedPrompt.includes(normalizedGuess)) {
    return true;
  }
  
  // 中英文对照词典
  const chineseEnglishMap: Record<string, string[]> = {
    '猫': ['cat', 'kitten', 'feline', 'kitty'],
    '狗': ['dog', 'puppy', 'canine', 'hound'],
    '鸟': ['bird', 'eagle', 'sparrow', 'robin', 'crow', 'owl'],
    '鱼': ['fish', 'salmon', 'trout', 'goldfish', 'tuna'],
    '马': ['horse', 'pony', 'stallion', 'mare'],
    '牛': ['cow', 'bull', 'cattle', 'calf'],
    '猪': ['pig', 'hog', 'swine', 'piglet'],
    '羊': ['sheep', 'lamb', 'ram', 'ewe'],
    '鸡': ['chicken', 'rooster', 'hen', 'chick'],
    '鸭': ['duck', 'duckling', 'mallard'],
    '兔子': ['rabbit', 'bunny', 'hare'],
    '老鼠': ['mouse', 'rat', 'rodent'],
    '大象': ['elephant', 'mammoth'],
    '狮子': ['lion', 'lioness'],
    '老虎': ['tiger', 'tigress'],
    '熊': ['bear', 'cub'],
    '猴子': ['monkey', 'ape', 'chimp', 'chimpanzee'],
    '蛇': ['snake', 'serpent', 'python', 'cobra'],
    '乌龟': ['turtle', 'tortoise'],
    '青蛙': ['frog', 'toad'],
    '蝴蝶': ['butterfly', 'moth'],
    '蜜蜂': ['bee', 'wasp', 'hornet'],
    '企鹅': ['penguin'],
    '熊猫': ['panda'],
    '长颈鹿': ['giraffe'],
    '斑马': ['zebra'],
    '狐狸': ['fox'],
    '狼': ['wolf'],
    '鹿': ['deer'],
    '袋鼠': ['kangaroo'],
    '考拉': ['koala'],
    '海豚': ['dolphin'],
    '鲸鱼': ['whale'],
    '鲨鱼': ['shark'],
    '章鱼': ['octopus'],
    '螃蟹': ['crab'],
    '虾': ['shrimp'],
    '蜘蛛': ['spider'],
    '蚂蚁': ['ant'],
    '蜻蜓': ['dragonfly'],
    '蚊子': ['mosquito']
  };

  // 检查中英文对照
  for (const [chinese, englishWords] of Object.entries(chineseEnglishMap)) {
    // 中文提示，英文猜测
    if (normalizedPrompt === chinese && englishWords.includes(normalizedGuess)) {
      return true;
    }
    // 英文提示，中文猜测
    if (englishWords.includes(normalizedPrompt) && normalizedGuess === chinese) {
      return true;
    }
    // 中文猜测，英文提示
    if (normalizedGuess === chinese && englishWords.includes(normalizedPrompt)) {
      return true;
    }
    // 英文猜测，中文提示
    if (englishWords.includes(normalizedGuess) && normalizedPrompt === chinese) {
      return true;
    }
  }
  
  // Check for common synonyms or variations (保留原有的英文同义词)
  const synonyms: Record<string, string[]> = {
    'dog': ['puppy', 'canine', 'hound'],
    'cat': ['kitten', 'feline', 'kitty'],
    'bird': ['eagle', 'sparrow', 'robin', 'crow', 'owl'],
    'fish': ['salmon', 'trout', 'goldfish', 'tuna'],
    'horse': ['pony', 'stallion', 'mare'],
    'cow': ['bull', 'cattle', 'calf'],
    'pig': ['hog', 'swine', 'piglet'],
    'sheep': ['lamb', 'ram', 'ewe'],
    'chicken': ['rooster', 'hen', 'chick'],
    'duck': ['duckling', 'mallard'],
    'rabbit': ['bunny', 'hare'],
    'mouse': ['rat', 'rodent'],
    'elephant': ['mammoth'],
    'lion': ['lioness'],
    'tiger': ['tigress'],
    'bear': ['cub'],
    'monkey': ['ape', 'chimp', 'chimpanzee'],
    'snake': ['serpent', 'python', 'cobra'],
    'turtle': ['tortoise'],
    'frog': ['toad'],
    'butterfly': ['moth'],
    'bee': ['wasp', 'hornet']
  };
  
  // Check if either word is a synonym of the other
  for (const [key, values] of Object.entries(synonyms)) {
    if ((key === normalizedPrompt && values.includes(normalizedGuess)) ||
        (key === normalizedGuess && values.includes(normalizedPrompt))) {
      return true;
    }
  }
  
  return false;
}