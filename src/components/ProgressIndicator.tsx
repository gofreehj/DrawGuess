'use client';

import { useEffect, useState } from 'react';

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export default function ProgressIndicator({ steps, currentStep, className = '' }: ProgressIndicatorProps) {
  const [animatedStep, setAnimatedStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStep(currentStep);
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div className={`progress-indicator ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  index < animatedStep
                    ? 'bg-green-500 text-white'
                    : index === animatedStep
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < animatedStep ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step Label */}
              <div className="ml-2 hidden sm:block">
                <div
                  className={`text-sm font-medium transition-colors duration-300 ${
                    index <= animatedStep ? 'text-gray-800' : 'text-gray-500'
                  }`}
                >
                  {step}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div className="h-0.5 bg-gray-200 relative overflow-hidden">
                  <div
                    className={`h-full bg-blue-500 transition-all duration-500 ${
                      index < animatedStep ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current Step Description */}
      <div className="text-center">
        <div className="text-sm text-gray-600">
          Step {animatedStep + 1} of {steps.length}: {steps[animatedStep]}
        </div>
      </div>
    </div>
  );
}

// Circular progress indicator
export function CircularProgress({ 
  progress, 
  size = 60, 
  strokeWidth = 4,
  color = 'blue',
  showPercentage = true,
  className = '' 
}: {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'blue' | 'green' | 'purple' | 'red';
  showPercentage?: boolean;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    purple: 'stroke-purple-500',
    red: 'stroke-red-500'
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClasses[color]} transition-all duration-300`}
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}