/**
 * Canvas export utilities for AI recognition optimization
 */

export interface ExportOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  backgroundColor?: string;
}

export interface ExportResult {
  dataUrl: string;
  blob: Blob;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Optimizes canvas data for AI recognition
 * - Converts to appropriate format and quality
 * - Resizes if needed to reduce file size
 * - Ensures proper contrast and background
 */
export async function exportCanvasForAI(
  canvas: any,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const {
    format = 'png',
    quality = 0.8,
    maxWidth = 512,
    maxHeight = 512,
    backgroundColor = 'white'
  } = options;

  // Get current canvas dimensions
  const currentWidth = canvas.width || 600;
  const currentHeight = canvas.height || 400;

  // Calculate optimal dimensions for AI processing
  const scale = Math.min(
    maxWidth / currentWidth,
    maxHeight / currentHeight,
    1 // Don't upscale
  );

  const targetWidth = Math.round(currentWidth * scale);
  const targetHeight = Math.round(currentHeight * scale);

  // Export with optimized settings
  const dataUrl = canvas.toDataURL({
    format,
    quality,
    multiplier: scale,
    width: targetWidth,
    height: targetHeight,
    left: 0,
    top: 0
  });

  // Convert to blob for size calculation
  const blob = await dataUrlToBlob(dataUrl);

  return {
    dataUrl,
    blob,
    size: blob.size,
    dimensions: {
      width: targetWidth,
      height: targetHeight
    }
  };
}

/**
 * Exports canvas in high quality for saving/sharing
 */
export async function exportCanvasHighQuality(
  canvas: any,
  options: ExportOptions = {}
): Promise<ExportResult> {
  const {
    format = 'png',
    quality = 1.0,
    backgroundColor = 'white'
  } = options;

  const currentWidth = canvas.width || 600;
  const currentHeight = canvas.height || 400;

  const dataUrl = canvas.toDataURL({
    format,
    quality,
    multiplier: 1
  });

  const blob = await dataUrlToBlob(dataUrl);

  return {
    dataUrl,
    blob,
    size: blob.size,
    dimensions: {
      width: currentWidth,
      height: currentHeight
    }
  };
}

/**
 * Checks if canvas has any drawing content
 */
export function hasDrawingContent(canvas: any): boolean {
  const objects = canvas.getObjects();
  return objects.length > 0;
}

/**
 * Gets canvas content statistics
 */
export function getCanvasStats(canvas: any) {
  const objects = canvas.getObjects();
  const bounds = canvas.calcOffset();
  
  return {
    objectCount: objects.length,
    hasContent: objects.length > 0,
    canvasSize: {
      width: canvas.width || 0,
      height: canvas.height || 0
    },
    bounds
  };
}

/**
 * Converts data URL to Blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Downloads canvas as file
 */
export function downloadCanvas(
  canvas: any,
  filename: string = 'drawing.png',
  options: ExportOptions = {}
) {
  const dataUrl = canvas.toDataURL({
    format: 'png',
    quality: 1.0,
    ...options
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Validates export result for AI processing
 */
export function validateExportForAI(result: ExportResult): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check file size (should be reasonable for API calls)
  if (result.size > 4 * 1024 * 1024) { // 4MB limit
    issues.push('File size too large for AI processing');
  }
  
  // Check dimensions
  if (result.dimensions.width < 32 || result.dimensions.height < 32) {
    issues.push('Image too small for reliable AI recognition');
  }
  
  if (result.dimensions.width > 1024 || result.dimensions.height > 1024) {
    issues.push('Image larger than recommended for AI processing');
  }
  
  // Check data URL format
  if (!result.dataUrl.startsWith('data:image/')) {
    issues.push('Invalid image data format');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}