'use client';

import { ReactNode } from 'react';
import LoadingSpinner, { PulsingDots } from './LoadingSpinner';

type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info';

interface StatusIndicatorProps {
  status: StatusType;
  message?: string;
  details?: string;
  icon?: ReactNode;
  className?: string;
  showAnimation?: boolean;
}

export default function StatusIndicator({ 
  status, 
  message, 
  details,
  icon,
  className = '',
  showAnimation = true
}: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          defaultIcon: showAnimation ? <LoadingSpinner size="sm" color="blue" /> : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          defaultMessage: 'Loading...'
        };
      case 'success':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          defaultIcon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          defaultMessage: 'Success!'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          defaultIcon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          defaultMessage: 'Error occurred'
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          defaultIcon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          defaultMessage: 'Warning'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          defaultIcon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          defaultMessage: 'Information'
        };
      default: // idle
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          defaultIcon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          defaultMessage: 'Ready'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {icon || config.defaultIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${config.textColor}`}>
            {message || config.defaultMessage}
          </div>
          {details && (
            <div className={`mt-1 text-sm ${config.textColor} opacity-75`}>
              {details}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Specialized status indicators for common use cases
export function AIProcessingStatus({ 
  stage, 
  className = '' 
}: { 
  stage: 'uploading' | 'analyzing' | 'processing' | 'complete';
  className?: string;
}) {
  const stageConfig = {
    uploading: {
      message: 'Uploading your drawing...',
      details: 'Preparing image data for AI analysis'
    },
    analyzing: {
      message: 'AI is analyzing your drawing...',
      details: 'Using advanced computer vision to recognize your artwork'
    },
    processing: {
      message: 'Processing results...',
      details: 'Comparing AI guess with the original prompt'
    },
    complete: {
      message: 'Analysis complete!',
      details: 'Ready to show results'
    }
  };

  const config = stageConfig[stage];
  const status = stage === 'complete' ? 'success' : 'loading';

  return (
    <StatusIndicator
      status={status}
      message={config.message}
      details={config.details}
      className={className}
    />
  );
}

export function NetworkStatus({ 
  isOnline, 
  className = '' 
}: { 
  isOnline: boolean;
  className?: string;
}) {
  return (
    <StatusIndicator
      status={isOnline ? 'success' : 'error'}
      message={isOnline ? 'Connected' : 'No internet connection'}
      details={isOnline ? 'All services available' : 'Some features may not work'}
      className={className}
      showAnimation={false}
    />
  );
}