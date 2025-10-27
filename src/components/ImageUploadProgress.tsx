'use client';

import React from 'react';

interface ImageUploadProgressProps {
  progress: number;
  uploading: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export default function ImageUploadProgress({
  progress,
  uploading,
  error,
  onRetry,
  className = ''
}: ImageUploadProgressProps) {
  if (!uploading && !error && progress === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Uploading image...
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Progress Stages */}
          <div className="flex justify-between text-xs text-gray-500">
            <span className={progress >= 20 ? 'text-blue-600' : ''}>
              Compressing
            </span>
            <span className={progress >= 60 ? 'text-blue-600' : ''}>
              Uploading
            </span>
            <span className={progress >= 90 ? 'text-blue-600' : ''}>
              Processing
            </span>
            <span className={progress === 100 ? 'text-green-600' : ''}>
              Complete
            </span>
          </div>
        </div>
      )}

      {/* Success State */}
      {!uploading && !error && progress === 100 && (
        <div className="flex items-center space-x-2 text-green-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">Image uploaded successfully</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="space-y-3">
          <div className="flex items-start space-x-2 text-red-600">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium">Upload failed</div>
              <div className="text-sm text-red-500 mt-1">{error}</div>
            </div>
          </div>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function ImageUploadProgressCompact({
  progress,
  uploading,
  error,
  className = ''
}: Omit<ImageUploadProgressProps, 'onRetry'>) {
  if (!uploading && !error && progress === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {uploading && (
        <>
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">
            Uploading... {Math.round(progress)}%
          </span>
        </>
      )}

      {!uploading && !error && progress === 100 && (
        <>
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-600">Uploaded</span>
        </>
      )}

      {error && (
        <>
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-600">Failed</span>
        </>
      )}
    </div>
  );
}