'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'purple' | 'gray' | 'white';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <div 
          className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
        />
        {text && (
          <div className="text-sm text-gray-600 font-medium">
            {text}
          </div>
        )}
      </div>
    </div>
  );
}

// Pulsing dots loader for variety
export function PulsingDots({ 
  color = 'blue',
  className = '' 
}: { 
  color?: 'blue' | 'green' | 'purple' | 'gray';
  className?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${colorClasses[color]} animate-pulse`} style={{ animationDelay: '0ms' }} />
      <div className={`w-2 h-2 rounded-full ${colorClasses[color]} animate-pulse`} style={{ animationDelay: '150ms' }} />
      <div className={`w-2 h-2 rounded-full ${colorClasses[color]} animate-pulse`} style={{ animationDelay: '300ms' }} />
    </div>
  );
}

// Progress bar loader
export function ProgressBar({ 
  progress, 
  color = 'blue',
  showPercentage = true,
  className = '' 
}: { 
  progress: number; // 0-100
  color?: 'blue' | 'green' | 'purple' | 'gray';
  showPercentage?: boolean;
  className?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    gray: 'bg-gray-600'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">Processing...</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}