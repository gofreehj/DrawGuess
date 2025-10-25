import type { Metadata, Viewport } from "next";
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Page Not Found - I Draw, You Guess!",
  description: "The page you're looking for doesn't exist. Return to the drawing game.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3B82F6',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. 
            Let's get you back to the drawing game!
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Back to Game
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>Or try one of these:</p>
            <div className="mt-2 space-x-4">
              <Link href="/" className="text-blue-600 hover:underline">
                Home
              </Link>
            </div>
          </div>
        </div>
        
        {/* Fun illustration */}
        <div className="mt-12 text-6xl opacity-50">
          🎨
        </div>
      </div>
    </div>
  );
}