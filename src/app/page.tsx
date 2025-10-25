import GameBoard from '@/components/GameBoard';
import Layout from '@/components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            绘画猜测游戏
          </h1>
          <p className="text-lg text-gray-600">
            画出动物，让AI来猜测你画的是什么！
          </p>
        </header>
        
        <main className="flex-1">
          <GameBoard />
        </main>
      </div>
    </Layout>
  );
}