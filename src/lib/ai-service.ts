// AI service for image recognition using OpenAI GPT-4 Vision API or Google Gemini

import { AICallLog } from '@/types/game';
import { ERROR_CODES, createAIServiceError, APIError } from './error-handler';

type AIProvider = 'openai' | 'gemini';

interface AIServiceConfig {
  provider: AIProvider;
  apiKey: string;
  apiUrl: string;
  model: string;
}

interface AIRecognitionResult {
  guess: string;
  confidence: number;
  reasoning?: string;
  callLog?: AICallLog; // 添加调用日志
}

interface AIServiceResponse {
  success: boolean;
  result?: AIRecognitionResult;
  error?: string;
  fallbackUsed?: boolean;
  retryCount?: number;
}

class AIService {
  private config: AIServiceConfig;

  constructor() {
    const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider;

    this.config = {
      provider,
      apiKey: this.getApiKey(provider),
      apiUrl: this.getApiUrl(provider),
      model: this.getModel(provider)
    };

    if (!this.config.apiKey) {
      console.warn(`${provider.toUpperCase()} API key not configured. AI recognition will not work.`);
    }
  }

  private getApiKey(provider: AIProvider): string {
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_API_KEY || '';
      case 'gemini':
        return process.env.GEMINI_API_KEY || '';
      default:
        return '';
    }
  }

  private getApiUrl(provider: AIProvider): string {
    switch (provider) {
      case 'openai':
        return process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
      case 'gemini':
        return process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
      default:
        return '';
    }
  }

  private getModel(provider: AIProvider): string {
    switch (provider) {
      case 'openai':
        return process.env.AI_MODEL || 'gpt-4-vision-preview';
      case 'gemini':
        return process.env.AI_MODEL || 'gemini-2.0-flash-exp';
      default:
        return '';
    }
  }

  /**
   * Validates the AI service configuration
   */
  isConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.apiUrl && !!this.config.model;
  }

  /**
   * Gets the current configuration (without exposing the API key)
   */
  getConfig(): Omit<AIServiceConfig, 'apiKey'> {
    return {
      provider: this.config.provider,
      apiUrl: this.config.apiUrl,
      model: this.config.model
    };
  }

  /**
   * Updates the configuration (useful for testing or runtime config changes)
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }



  /**
   * 分析AI推理过程，检查是否基于视觉特征
   */
  private analyzeReasoning(reasoning: string, originalPrompt: string): {
    mentionsVisualFeatures: boolean;
    mentionsOriginalPrompt: boolean;
    visualKeywords: string[];
    confidenceFactors: string[];
  } {
    const lowerReasoning = reasoning.toLowerCase();
    const lowerPrompt = originalPrompt.toLowerCase();

    // 视觉特征关键词
    const visualKeywords = [
      'shape', 'line', 'curve', 'circle', 'oval', 'triangle', 'rectangle',
      'ear', 'tail', 'leg', 'body', 'head', 'eye', 'nose', 'mouth',
      'silhouette', 'outline', 'contour', 'feature', 'characteristic',
      'drawing', 'sketch', 'stroke', 'mark', 'pattern', 'form',
      '形状', '线条', '轮廓', '特征', '耳朵', '尾巴', '腿', '身体', '头部',
      '眼睛', '鼻子', '嘴巴', '图形', '描边', '笔画', '模式'
    ];

    // 检查是否提到视觉特征
    const foundVisualKeywords = visualKeywords.filter(keyword =>
      lowerReasoning.includes(keyword.toLowerCase())
    );

    // 检查是否提到原始提示
    const mentionsOriginalPrompt = lowerReasoning.includes(lowerPrompt);

    // 置信度影响因素
    const confidenceFactors = [];
    if (lowerReasoning.includes('clear') || lowerReasoning.includes('obvious')) {
      confidenceFactors.push('Clear visual features');
    }
    if (lowerReasoning.includes('unclear') || lowerReasoning.includes('ambiguous')) {
      confidenceFactors.push('Unclear features');
    }
    if (lowerReasoning.includes('simple') || lowerReasoning.includes('basic')) {
      confidenceFactors.push('Simple drawing');
    }
    if (lowerReasoning.includes('detailed') || lowerReasoning.includes('complex')) {
      confidenceFactors.push('Detailed drawing');
    }

    return {
      mentionsVisualFeatures: foundVisualKeywords.length > 0,
      mentionsOriginalPrompt,
      visualKeywords: foundVisualKeywords,
      confidenceFactors
    };
  }



  /**
   * Estimates the cost of an API call
   */
  private estimateCost(provider: AIProvider, model: string, tokensUsed?: number): number {
    // Rough cost estimates (as of 2024)
    const costs: Record<AIProvider, Record<string, number>> = {
      openai: {
        'gpt-4-vision-preview': 0.01, // per 1K tokens
        'gpt-4o': 0.005,
        'gpt-4o-mini': 0.0015
      },
      gemini: {
        'gemini-2.0-flash-exp': 0.0, // Free tier
        'gemini-pro-vision': 0.0025
      }
    };

    const tokens = tokensUsed || 300; // Default estimate
    const costPer1K = costs[provider]?.[model] || 0.01;
    return (tokens / 1000) * costPer1K;
  }

  /**
   * Recognizes what animal is drawn in the provided image
   */
  async recognizeDrawing(imageData: string, originalPrompt: string): Promise<AIServiceResponse> {
    const startTime = Date.now();

    // Initialize call log (不记录原始提示以保证盲测)
    const callLog: AICallLog = {
      timestamp: new Date(),
      provider: this.config.provider,
      model: this.config.model,
      requestData: {
        prompt: 'Image recognition (blind test)',
        temperature: 0.1,
        maxTokens: 300
      },
      responseData: {
        guess: '',
        confidence: 0,
        reasoning: ''
      },
      success: false
    };

    if (!this.isConfigured()) {
      callLog.error = 'AI service is not properly configured. Please check your API key and settings.';
      return {
        success: false,
        error: callLog.error
      };
    }

    // Check if API key is still the placeholder
    if (this.config.apiKey === 'your_openai_api_key_here' || this.config.apiKey === 'your_gemini_api_key_here') {
      callLog.error = `${this.config.provider.toUpperCase()} API key is not configured. Please set a valid ${this.config.provider.toUpperCase()}_API_KEY in your environment variables.`;
      return {
        success: false,
        error: callLog.error
      };
    }

    try {
      // Prepare the image data for OpenAI API
      const base64Image = this.prepareImageData(imageData);

      // Create the prompt for AI recognition
      const systemPrompt = this.createRecognitionPrompt(originalPrompt);

      // 更新callLog中的完整提示词信息
      callLog.requestData.fullPrompt = systemPrompt;

      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      let response: Response;

      if (this.config.provider === 'gemini') {
        // Make API call to Google Gemini
        response = await fetch(`${this.config.apiUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: systemPrompt
                },
                {
                  inline_data: {
                    mime_type: "image/png",
                    data: base64Image.replace(/^data:image\/[a-z]+;base64,/, '')
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 300,
            }
          }),
          signal: controller.signal
        });
      } else {
        // Make API call to OpenAI
        console.log(`Making AI request to: ${this.config.apiUrl}/chat/completions`);
        console.log(`Using model: ${this.config.model}`);
        console.log(`API Key length: ${this.config.apiKey.length} chars`);
        
        response = await fetch(`${this.config.apiUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: systemPrompt
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: base64Image
                    }
                  }
                ]
              }
            ],
            max_tokens: 300,
            temperature: 0.1
          }),
          signal: controller.signal
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      let aiResponse: string;
      let tokensUsed: number | undefined;

      if (this.config.provider === 'gemini') {
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        tokensUsed = data.usageMetadata?.totalTokenCount;
        if (!aiResponse) {
          throw new Error('No response received from Gemini service');
        }
      } else {
        aiResponse = data.choices?.[0]?.message?.content;
        tokensUsed = data.usage?.total_tokens;
        if (!aiResponse) {
          throw new Error('No response received from OpenAI service');
        }
      }

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Parse and process the AI response
      const result = this.parseAIResponse(aiResponse, originalPrompt);

      // 分析推理过程
      const reasoningAnalysis = result.reasoning ?
        this.analyzeReasoning(result.reasoning, originalPrompt) :
        {
          mentionsVisualFeatures: false,
          mentionsOriginalPrompt: false,
          visualKeywords: [],
          confidenceFactors: []
        };

      // Update call log with successful response
      callLog.success = true;
      callLog.responseData = {
        guess: result.guess,
        confidence: result.confidence,
        reasoning: result.reasoning,
        tokensUsed,
        responseTime,
        rawResponse: aiResponse
      };
      callLog.reasoningAnalysis = reasoningAnalysis;
      callLog.cost = this.estimateCost(this.config.provider, this.config.model, tokensUsed);

      // Add call log to result
      result.callLog = callLog;

      // 调试日志
      console.log('🔍 AI Service - Call log created:', {
        provider: callLog.provider,
        model: callLog.model,
        success: callLog.success,
        responseTime: callLog.responseData.responseTime,
        tokensUsed: callLog.responseData.tokensUsed,
        cost: callLog.cost
      });

      return {
        success: true,
        result
      };

    } catch (error) {
      console.error('AI recognition error:', error);

      // Update call log with error
      callLog.responseData.responseTime = Date.now() - startTime;

      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          callLog.error = 'AI recognition request timed out. Please try again.';
          return {
            success: false,
            error: callLog.error
          };
        }

        if (error.message.includes('fetch failed') || error.message.includes('ConnectTimeoutError')) {
          callLog.error = 'Unable to connect to AI service. Please check your internet connection and try again.';
          return {
            success: false,
            error: callLog.error
          };
        }

        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          callLog.error = 'Invalid API key. Please check your OpenAI API key configuration.';
          return {
            success: false,
            error: callLog.error
          };
        }

        if (error.message.includes('429') || error.message.includes('rate limit')) {
          callLog.error = 'AI service rate limit exceeded. Please wait a moment and try again.';
          return {
            success: false,
            error: callLog.error
          };
        }

        if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          callLog.error = 'AI service is temporarily unavailable. Please try again later.';
          return {
            success: false,
            error: callLog.error
          };
        }

        callLog.error = error.message;
        return {
          success: false,
          error: callLog.error
        };
      }

      callLog.error = 'Unknown error occurred during AI recognition';
      return {
        success: false,
        error: callLog.error
      };
    }
  }

  /**
   * Prepares image data for OpenAI API
   */
  private prepareImageData(imageData: string): string {
    // If imageData already includes data URL prefix, use as is
    if (imageData.startsWith('data:image/')) {
      return imageData;
    }

    // Otherwise, assume it's base64 and add the data URL prefix
    return `data:image/png;base64,${imageData}`;
  }

  /**
   * Creates the recognition prompt for the AI
   */
  private createRecognitionPrompt(originalPrompt: string): string {
    return `你是一个识别绘画和素描的专家。请仔细观察这幅画，识别出画中描绘的是什么动物。

请仔细分析这幅画，并用以下JSON格式回复：
{
  "guess": "你认为画的动物名称",
  "confidence": 0.85,
  "reasoning": "简要解释为什么你认为这是这个动物"
}

规则：
- "guess" 应该是一个动物名称（用中文，例如："猫"、"狗"、"大象"）
- "confidence" 应该是0到1之间的数字，表示你的信心程度
- "reasoning" 应该简要解释导致你得出这个结论的视觉特征
- 专注于画的主要内容，忽略背景元素
- 如果画不清楚或模糊，请降低信心分数
- 只根据你在画中看到的内容进行判断，不要依赖任何外部上下文
- 只回复JSON对象，不要添加其他文字`;
  }

  /**
   * Parses the AI response and extracts recognition results
   */
  private parseAIResponse(aiResponse: string, originalPrompt: string): AIRecognitionResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate the response structure
      if (!parsed.guess || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid response structure from AI');
      }

      // Normalize confidence to be between 0 and 1
      let confidence = Math.max(0, Math.min(1, parsed.confidence));

      // Compare with original prompt to determine if it's correct
      const isCorrect = this.compareGuessWithPrompt(parsed.guess, originalPrompt);

      // Adjust confidence based on correctness
      if (isCorrect) {
        // Boost confidence slightly for correct guesses
        confidence = Math.min(1, confidence * 1.1);
      } else {
        // Reduce confidence for incorrect guesses
        confidence = Math.max(0, confidence * 0.8);
      }

      return {
        guess: parsed.guess.toLowerCase().trim(),
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
        reasoning: parsed.reasoning || 'No reasoning provided'
      };

    } catch (error) {
      console.error('Error parsing AI response:', error);

      return {
        guess: 'System Error',
        confidence: 0.3, // Low confidence for fallback parsing
        reasoning: 'Response parsing failed, extracted guess from text'
      };
    }
  }

  /**
   * Compares AI guess with the original prompt to determine correctness
   */
  private compareGuessWithPrompt(guess: string, originalPrompt: string): boolean {
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

    return false;
  }

  /**
   * Main recognition method with enhanced fallback support and retry logic
   */
  async recognizeWithFallback(imageData: string, originalPrompt: string, maxRetries: number = 1): Promise<AIServiceResponse> {
    let lastError: string = '';
    let retryCount = 0;

    // Try the main AI recognition with retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.recognizeDrawing(imageData, originalPrompt);

        if (result.success) {
          return {
            ...result,
            retryCount: attempt
          };
        }

        lastError = result.error || 'Unknown error';
        retryCount = attempt;

        // Don't retry for certain error types (save costs)
        if (this.shouldNotRetry(lastError)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`AI recognition attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        retryCount = attempt;

        if (attempt === maxRetries) {
          break;
        }
      }
    }

    // All retries failed, use fallback method
    console.warn(`AI recognition failed after ${retryCount + 1} attempts, using fallback method:`, lastError);

    const fallbackResult = await this.recognizeDrawingFallback(originalPrompt);
    return {
      ...fallbackResult,
      fallbackUsed: true,
      retryCount: retryCount + 1,
      error: `Primary AI service failed: ${lastError}. Using fallback method.`
    };
  }

  /**
   * Determines if an error should not be retried
   */
  private shouldNotRetry(error: string): boolean {
    const nonRetryableErrors = [
      'Invalid API key',
      'API key is not configured',
      'Unauthorized',
      'Invalid request format',
      'Image too large',
      'Unsupported image format'
    ];

    return nonRetryableErrors.some(nonRetryable =>
      error.toLowerCase().includes(nonRetryable.toLowerCase())
    );
  }

  /**
   * Enhanced fallback recognition with multiple strategies
   */
  async recognizeDrawingFallback(originalPrompt: string): Promise<AIServiceResponse> {
    // Strategy 1: Try alternative AI provider if configured
    if (this.hasAlternativeProvider()) {
      try {
        const alternativeResult = await this.tryAlternativeProvider(originalPrompt);
        if (alternativeResult.success) {
          return alternativeResult;
        }
      } catch (error) {
        console.warn('Alternative AI provider also failed:', error);
      }
    }

    // 如实告知AI服务不可用
    const fallbackResponse = this.getSimpleFallbackResponse();

    // Create fallback call log
    const fallbackLog: AICallLog = {
      timestamp: new Date(),
      provider: this.config.provider,
      model: 'fallback-intelligent',
      requestData: {
        prompt: 'Intelligent fallback recognition',
        temperature: 0,
        maxTokens: 0
      },
      responseData: {
        guess: fallbackResponse.guess,
        confidence: fallbackResponse.confidence,
        reasoning: fallbackResponse.reasoning,
        tokensUsed: 0,
        responseTime: 0
      },
      success: true,
      cost: 0
    };

    return {
      success: true,
      result: {
        guess: fallbackResponse.guess,
        confidence: fallbackResponse.confidence,
        reasoning: fallbackResponse.reasoning,
        callLog: fallbackLog
      },
      fallbackUsed: true
    };
  }

  /**
   * Checks if an alternative AI provider is available
   */
  private hasAlternativeProvider(): boolean {
    // Check if we can switch to a different provider
    if (this.config.provider === 'openai' && process.env.GEMINI_API_KEY) {
      return true;
    }
    if (this.config.provider === 'gemini' && process.env.OPENAI_API_KEY) {
      return true;
    }
    return false;
  }

  /**
   * Tries an alternative AI provider
   */
  private async tryAlternativeProvider(originalPrompt: string): Promise<AIServiceResponse> {
    const originalConfig = { ...this.config };

    try {
      // Switch to alternative provider
      if (this.config.provider === 'openai') {
        this.updateConfig({
          provider: 'gemini',
          apiKey: process.env.GEMINI_API_KEY || '',
          apiUrl: this.getApiUrl('gemini'),
          model: this.getModel('gemini')
        });
      } else {
        this.updateConfig({
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY || '',
          apiUrl: this.getApiUrl('openai'),
          model: this.getModel('openai')
        });
      }

      // Try recognition with alternative provider
      const result = await this.recognizeDrawing('', originalPrompt); // Empty image data for fallback

      // Restore original config
      this.config = originalConfig;

      return result;

    } catch (error) {
      // Restore original config on error
      this.config = originalConfig;
      throw error;
    }
  }

  /**
   * 简化的fallback，如实告知AI服务不可用
   */
  private getSimpleFallbackResponse(): {
    guess: string;
    confidence: number;
    reasoning: string;
  } {
    return {
      guess: 'AI服务不可用',
      confidence: 0,
      reasoning: 'AI识别服务暂时不可用，请稍后重试'
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export type { AIRecognitionResult, AIServiceResponse };