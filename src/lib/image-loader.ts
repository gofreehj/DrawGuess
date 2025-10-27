/**
 * Image loading utilities with caching and error handling
 * Handles loading images from Supabase Storage with fallback to base64
 */

import { getSupabaseClient } from '@/lib/supabase-client-browser';

export interface ImageLoadResult {
  success: boolean;
  url?: string;
  cached?: boolean;
  error?: string;
  fallbackUsed?: boolean;
}

export interface ImageCacheEntry {
  url: string;
  timestamp: number;
  size?: number;
}

/**
 * Simple in-memory cache for image URLs
 */
class ImageCache {
  private cache = new Map<string, ImageCacheEntry>();
  private readonly maxAge = 30 * 60 * 1000; // 30 minutes
  private readonly maxEntries = 100;

  set(key: string, url: string, size?: number): void {
    // Clean old entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.cleanup();
    }

    this.cache.set(key, {
      url,
      timestamp: Date.now(),
      size
    });
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.url;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    });

    // If still too many entries, remove oldest ones
    if (this.cache.size >= this.maxEntries) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sortedEntries.slice(0, this.cache.size - this.maxEntries + 10);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  getStats(): { size: number; maxAge: number; maxEntries: number } {
    return {
      size: this.cache.size,
      maxAge: this.maxAge,
      maxEntries: this.maxEntries
    };
  }
}

// Global cache instance
const imageCache = new ImageCache();

/**
 * Loads an image URL with caching and fallback support
 */
export async function loadImageUrl(
  gameId: string,
  fallbackUrl?: string,
  userId?: string
): Promise<ImageLoadResult> {
  const cacheKey = `${userId || 'anonymous'}_${gameId}`;
  
  // Check cache first
  const cachedUrl = imageCache.get(cacheKey);
  if (cachedUrl) {
    return {
      success: true,
      url: cachedUrl,
      cached: true
    };
  }

  try {
    // Try to get URL from Supabase Storage
    const supabase = getSupabaseClient();
    const targetUserId = userId || 'anonymous';
    
    // List files to find the actual filename (handles timestamped files)
    const { data: files, error: listError } = await supabase.storage
      .from('drawings')
      .list(targetUserId, {
        search: gameId,
        limit: 10
      });

    if (!listError && files && files.length > 0) {
      // Find the file that matches our game ID
      const matchingFile = files.find(file => 
        file.name.startsWith(gameId) && file.name.endsWith('.png')
      );
      
      if (matchingFile) {
        const { data } = supabase.storage
          .from('drawings')
          .getPublicUrl(`${targetUserId}/${matchingFile.name}`);
        
        // Verify the URL is accessible
        const isAccessible = await verifyImageUrl(data.publicUrl);
        
        if (isAccessible) {
          // Cache the successful URL
          imageCache.set(cacheKey, data.publicUrl);
          
          return {
            success: true,
            url: data.publicUrl,
            cached: false
          };
        }
      }
    }

    // If Supabase fails, try fallback URL
    if (fallbackUrl) {
      const isAccessible = await verifyImageUrl(fallbackUrl);
      
      if (isAccessible) {
        // Cache the fallback URL
        imageCache.set(cacheKey, fallbackUrl);
        
        return {
          success: true,
          url: fallbackUrl,
          cached: false,
          fallbackUsed: true
        };
      }
    }

    return {
      success: false,
      error: 'Image not found in storage or fallback'
    };

  } catch (error) {
    console.error('Error loading image URL:', error);
    
    // Try fallback URL on error
    if (fallbackUrl) {
      try {
        const isAccessible = await verifyImageUrl(fallbackUrl);
        
        if (isAccessible) {
          return {
            success: true,
            url: fallbackUrl,
            cached: false,
            fallbackUsed: true
          };
        }
      } catch (fallbackError) {
        console.error('Fallback URL also failed:', fallbackError);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load image'
    };
  }
}

/**
 * Verifies if an image URL is accessible
 */
async function verifyImageUrl(url: string): Promise<boolean> {
  try {
    // For base64 URLs, assume they're valid
    if (url.startsWith('data:image/')) {
      return true;
    }

    // For HTTP URLs, do a HEAD request to check accessibility
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    return response.ok && (response.headers.get('content-type')?.startsWith('image/') ?? false);
  } catch (error) {
    console.warn('Image URL verification failed:', error);
    return false;
  }
}

/**
 * Preloads an image to ensure it's cached
 */
export function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    
    img.src = url;
  });
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<boolean[]> {
  const promises = urls.map(url => preloadImage(url));
  return Promise.all(promises);
}

/**
 * Clear image cache (useful for testing or memory management)
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Get cache statistics
 */
export function getImageCacheStats() {
  return imageCache.getStats();
}

/**
 * Remove specific image from cache
 */
export function removeFromImageCache(gameId: string, userId?: string): void {
  const cacheKey = `${userId || 'anonymous'}_${gameId}`;
  imageCache.delete(cacheKey);
}

/**
 * React hook for loading images with state management
 */
export function useImageLoader(gameId: string, fallbackUrl?: string, userId?: string) {
  const [loading, setLoading] = React.useState(true);
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [cached, setCached] = React.useState(false);
  const [fallbackUsed, setFallbackUsed] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function loadImage() {
      setLoading(true);
      setError(null);

      try {
        const result = await loadImageUrl(gameId, fallbackUrl, userId);
        
        if (mounted) {
          if (result.success) {
            setImageUrl(result.url!);
            setCached(result.cached || false);
            setFallbackUsed(result.fallbackUsed || false);
          } else {
            setError(result.error || 'Failed to load image');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load image');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      mounted = false;
    };
  }, [gameId, fallbackUrl, userId]);

  const retry = React.useCallback(() => {
    // Clear cache for this image and retry
    removeFromImageCache(gameId, userId);
    setLoading(true);
    setError(null);
    setImageUrl(null);
    
    // Trigger reload by updating a dependency
    loadImageUrl(gameId, fallbackUrl, userId).then(result => {
      if (result.success) {
        setImageUrl(result.url!);
        setCached(result.cached || false);
        setFallbackUsed(result.fallbackUsed || false);
      } else {
        setError(result.error || 'Failed to load image');
      }
      setLoading(false);
    });
  }, [gameId, fallbackUrl, userId]);

  return {
    loading,
    imageUrl,
    error,
    cached,
    fallbackUsed,
    retry
  };
}

// Add React import for the hook
import React from 'react';