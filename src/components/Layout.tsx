'use client';

import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      {/* Footer - 始终在页面底部 */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎨</span>
              <span className="text-gray-600">绘画猜测游戏</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>由 AI 驱动</span>
              <span>•</span>
              <span>使用 Next.js 构建</span>
            </div>
            
            <div className="text-sm text-gray-400">
              © 2024 绘画猜测游戏. 保留所有权利.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}