'use client';

import React, { useState, useCallback } from 'react';
import { useImageLoader } from '@/lib/image-loader';

interface SmartImageProps {
  gameId: string;
  fallbackUrl?: string;
  userId?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: (error: string) => void;
  showLoadingState?: boolean;
  showErrorState?: boolean;
  retryable?: boolean;
}

export default function SmartImage({
  gameId,
  fallbackUrl,
  userId,
  alt = 'Game drawing',
  className = '',
  width,
  height,
  onLoad,
  onError,
  showLoadingState = true,
  showErrorState = true,
  retryable = true
}: SmartImageProps) {
  const { loading, imageUrl, error, cached, fallbackUsed, retry } = useImageLoader(
    gameId,
    fallbackUrl,
    userId
  );
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setImageError(true);
    const errorMsg = 'Failed to load image';
    onError?.(errorMsg);
  }, [onError]);

  const handleRetry = useCallback(() => {
    setImageError(false);
    setImageLoaded(false);
    retry();
  }, [retry]);

  // Show loading state
  if (loading && showLoadingState) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-sm text-gray-500">Loading image...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if ((error || imageError) && showErrorState) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-sm text-gray-500 mb-2">
            {error || 'Failed to load image'}
          </div>
          {retryable && (
            <button
              onClick={handleRetry}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show image
  if (imageUrl) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          className="rounded object-contain"
          style={{ 
            imageRendering: 'pixelated',
            width: width ? `${width}px` : undefined,
            height: height ? `${height}px` : undefined
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {/* Status indicators */}
        <div className="absolute top-2 right-2 flex space-x-1">
          {cached && (
            <div 
              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
              title="Loaded from cache"
            >
              Cached
            </div>
          )}
          {fallbackUsed && (
            <div 
              className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
              title="Using fallback URL"
            >
              Fallback
            </div>
          )}
        </div>
        
        {/* Loading overlay while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  }

  // Fallback empty state
  return (
    <div 
      className={`flex items-center justify-center bg-gray-50 rounded border border-gray-200 ${className}`}
      style={{ width, height }}
    >
      <div className="text-center text-gray-400">
        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div className="text-xs">No image</div>
      </div>
    </div>
  );
}

/**
 * Compact version for thumbnails
 */
export function SmartImageThumbnail({
  gameId,
  fallbackUrl,
  userId,
  alt = 'Game drawing thumbnail',
  size = 64,
  className = '',
  onClick
}: {
  gameId: string;
  fallbackUrl?: string;
  userId?: string;
  alt?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div 
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={onClick}
    >
      <SmartImage
        gameId={gameId}
        fallbackUrl={fallbackUrl}
        userId={userId}
        alt={alt}
        width={size}
        height={size}
        className="rounded-lg border border-gray-200"
        showLoadingState={true}
        showErrorState={true}
        retryable={false}
      />
    </div>
  );
}

/**
 * Gallery version with lightbox support
 */
export function SmartImageGallery({
  gameId,
  fallbackUrl,
  userId,
  alt = 'Game drawing',
  className = '',
  onImageClick
}: {
  gameId: string;
  fallbackUrl?: string;
  userId?: string;
  alt?: string;
  className?: string;
  onImageClick?: (imageUrl: string) => void;
}) {
  const { imageUrl } = useImageLoader(gameId, fallbackUrl, userId);

  const handleClick = useCallback(() => {
    if (imageUrl && onImageClick) {
      onImageClick(imageUrl);
    }
  }, [imageUrl, onImageClick]);

  return (
    <div className={`cursor-zoom-in ${className}`} onClick={handleClick}>
      <SmartImage
        gameId={gameId}
        fallbackUrl={fallbackUrl}
        userId={userId}
        alt={alt}
        className="hover:shadow-lg transition-shadow"
        showLoadingState={true}
        showErrorState={true}
        retryable={true}
      />
    </div>
  );
}