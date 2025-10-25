// 简单测试AI调用日志功能
const { aiService } = require('./src/lib/ai-service.ts');

async function testAICallLog() {
  console.log('🧪 测试AI调用日志功能...\n');
  
  // 模拟一个简单的base64图像数据
  const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const originalPrompt = '猫';
  
  try {
    console.log('📞 调用AI识别服务...');
    const result = await aiService.recognizeWithFallback(mockImageData, originalPrompt);
    
    if (result.success && result.result) {
      console.log('✅ AI识别成功!');
      console.log(`🎯 猜测: ${result.result.guess}`);
      console.log(`🎲 置信度: ${result.result.confidence}`);
      console.log(`💭 推理: ${result.result.reasoning}`);
      
      if (result.result.callLog) {
        console.log('\n📊 AI调用日志:');
        console.log(`🏢 提供商: ${result.result.callLog.provider}`);
        console.log(`🤖 模型: ${result.result.callLog.model}`);
        console.log(`⏱️  响应时间: ${result.result.callLog.responseData.responseTime}ms`);
        console.log(`💰 预估成本: $${result.result.callLog.cost || 0}`);
        console.log(`✅ 成功状态: ${result.result.callLog.success}`);
        
        if (result.result.callLog.error) {
          console.log(`❌ 错误信息: ${result.result.callLog.error}`);
        }
      } else {
        console.log('⚠️  没有调用日志数据');
      }
    } else {
      console.log('❌ AI识别失败:', result.error);
    }
    
  } catch (error) {
    console.error('💥 测试出错:', error.message);
  }
}

// 运行测试
testAICallLog();