import Layout from '@/components/Layout';

export default function About() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            关于绘画猜测游戏
          </h1>
          <p className="text-lg text-gray-600">
            一个有趣的AI驱动的绘画猜测游戏
          </p>
        </header>

        <div className="space-y-8">
          {/* 游戏介绍 */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">🎨</span>
              游戏介绍
            </h2>
            <p className="text-gray-600 leading-relaxed">
              绘画猜测游戏是一个创新的互动游戏，结合了艺术创作和人工智能技术。
              玩家可以在画布上绘制动物，然后AI会尝试猜测你画的是什么动物。
              这不仅是一个有趣的游戏，也是一个展示AI图像识别能力的平台。
            </p>
          </section>

          {/* 如何游戏 */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">🎮</span>
              如何游戏
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
                <p className="text-gray-600">点击"开始新游戏"按钮获取一个动物提示</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
                <p className="text-gray-600">使用绘画工具在画布上绘制指定的动物</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</span>
                <p className="text-gray-600">完成绘画后，点击"提交绘画"让AI猜测</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">4</span>
                <p className="text-gray-600">查看AI的猜测结果和得分</p>
              </div>
            </div>
          </section>

          {/* 技术特性 */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">⚡</span>
              技术特性
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">🤖 AI图像识别</h3>
                <p className="text-gray-600 text-sm">使用先进的AI技术识别和分析绘画内容</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">🎨 实时绘画</h3>
                <p className="text-gray-600 text-sm">流畅的画布体验，支持多种绘画工具</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">📱 响应式设计</h3>
                <p className="text-gray-600 text-sm">完美适配桌面和移动设备</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">📊 游戏记录</h3>
                <p className="text-gray-600 text-sm">记录游戏历史和成绩统计</p>
              </div>
            </div>
          </section>

          {/* 技术栈 */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">🛠️</span>
              技术栈
            </h2>
            <div className="flex flex-wrap gap-3">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Next.js</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">React</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">TypeScript</span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Tailwind CSS</span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Canvas API</span>
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">AI/ML</span>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}