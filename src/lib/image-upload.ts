/**
 * Image upload utilities for Supabase Storage integration
 * Handles image compression, optimization, and upload progress
 */

import React from 'react';
import { getSupabaseClient } from '@/lib/supabase-client-browser';
import { useAuth } from '@/contexts/AuthContext';

export interface ImageUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'png' | 'jpeg' | 'webp';
  onProgress?: (progress: number) => void;
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  error?: string;
}

export interface ImageCompressionResult {
  blob: Blob;
  dataUrl: string;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Compresses and optimizes an image from canvas or data URL
 */
export async function compressImage(
  source: HTMLCanvasElement | string,
  options: ImageUploadOptions = {}
): Promise<ImageCompressionResult> {
  const {
    quality = 0.8,
    maxWidth = 800,
    maxHeight = 600,
    format = 'png'
  } = options;

  let canvas: HTMLCanvasElement;
  
  if (typeof source === 'string') {
    // Convert data URL to canvas
    canvas = await dataUrlToCanvas(source);
  } else {
    canvas = source;
  }

  // Calculate optimal dimensions
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;
  
  const scale = Math.min(
    maxWidth / originalWidth,
    maxHeight / originalHeight,
    1 // Don't upscale
  );

  const targetWidth = Math.round(originalWidth * scale);
  const targetHeight = Math.round(originalHeight * scale);

  // Create optimized canvas
  const optimizedCanvas = document.createElement('canvas');
  optimizedCanvas.width = targetWidth;
  optimizedCanvas.height = targetHeight;
  
  const ctx = optimizedCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill with white background for better AI recognition
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Draw the resized image
  ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    optimizedCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      `image/${format}`,
      quality
    );
  });

  // Generate data URL for preview
  const dataUrl = optimizedCanvas.toDataURL(`image/${format}`, quality);

  return {
    blob,
    dataUrl,
    size: blob.size,
    dimensions: {
      width: targetWidth,
      height: targetHeight
    }
  };
}

/**
 * Uploads an image to Supabase Storage
 */
export async function uploadImageToSupabase(
  gameId: string,
  imageSource: HTMLCanvasElement | string | Blob,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> {
  try {
    const { onProgress } = options;
    
    // Report initial progress
    onProgress?.(0);

    // Get Supabase client
    const supabase = getSupabaseClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';

    onProgress?.(10);

    let blob: Blob;
    
    if (imageSource instanceof Blob) {
      blob = imageSource;
    } else {
      // Compress the image
      onProgress?.(20);
      const compressed = await compressImage(imageSource, options);
      blob = compressed.blob;
      onProgress?.(50);
    }

    // Generate file path
    const timestamp = Date.now();
    const fileName = `${userId}/${gameId}_${timestamp}.png`;

    onProgress?.(60);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('drawings')
      .upload(fileName, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    onProgress?.(90);

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('drawings')
      .getPublicUrl(fileName);

    onProgress?.(100);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      size: blob.size
    };

  } catch (error) {
    console.error('Image upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Uploads image with retry logic
 */
export async function uploadImageWithRetry(
  gameId: string,
  imageSource: HTMLCanvasElement | string | Blob,
  options: ImageUploadOptions & { maxRetries?: number } = {}
): Promise<ImageUploadResult> {
  const { maxRetries = 3, ...uploadOptions } = options;
  
  let lastError: string | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadImageToSupabase(gameId, imageSource, uploadOptions);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  return {
    success: false,
    error: `Upload failed after ${maxRetries} attempts: ${lastError}`
  };
}

/**
 * Gets the public URL for an uploaded image
 */
export function getImageUrl(path: string): string {
  const supabase = getSupabaseClient();
  
  const { data } = supabase.storage
    .from('drawings')
    .getPublicUrl(path);
    
  return data.publicUrl;
}

/**
 * Deletes an image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.storage
      .from('drawings')
      .remove([path]);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
}

/**
 * Helper function to convert data URL to canvas
 */
async function dataUrlToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = dataUrl;
  });
}

/**
 * Validates image before upload
 */
export function validateImage(blob: Blob): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check file size (5MB limit)
  if (blob.size > 5 * 1024 * 1024) {
    errors.push('Image size exceeds 5MB limit');
  }
  
  // Check file type
  if (!blob.type.startsWith('image/')) {
    errors.push('File is not an image');
  }
  
  // Check supported formats
  const supportedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!supportedTypes.includes(blob.type)) {
    errors.push('Unsupported image format. Use PNG, JPEG, or WebP');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * React hook for image upload with progress tracking
 */
export function useImageUpload() {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  
  const uploadImage = async (
    gameId: string,
    imageSource: HTMLCanvasElement | string | Blob,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      const result = await uploadImageWithRetry(gameId, imageSource, {
        ...options,
        onProgress: (p) => {
          setProgress(p);
          options.onProgress?.(p);
        }
      });
      
      if (!result.success) {
        setError(result.error || 'Upload failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setUploading(false);
    }
  };
  
  return {
    uploadImage,
    uploading,
    progress,
    error,
    resetError: () => setError(null)
  };
}