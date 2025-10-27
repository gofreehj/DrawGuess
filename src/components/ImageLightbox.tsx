'use client';

import React, { useEffect, useCallback } from 'react';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageLightbox({
  isOpen,
  imageUrl,
  alt = 'Image',
  onClose
}: ImageLightboxProps) {
  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative max-w-[90vw] max-h-[90vh] p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
          aria-label="Close lightbox"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Image */}
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* Image info */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
          <div className="text-sm text-center">{alt}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing lightbox state
 */
export function useImageLightbox() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [alt, setAlt] = React.useState('');

  const openLightbox = useCallback((url: string, altText?: string) => {
    setImageUrl(url);
    setAlt(altText || 'Image');
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
    // Clear after animation
    setTimeout(() => {
      setImageUrl('');
      setAlt('');
    }, 300);
  }, []);

  return {
    isOpen,
    imageUrl,
    alt,
    openLightbox,
    closeLightbox
  };
}