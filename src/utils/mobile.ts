import type { DeviceInfo, ViewportInfo, PerformanceMetrics, MobileNetworkInformation, OrientationLockType } from '@/types/mobile'

/**
 * Detect device information and capabilities
 */
export function getDeviceInfo(): DeviceInfo {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Return default values for SSR
    return {
      userAgent: '',
      platform: '',
      screenSize: { width: 1920, height: 1080 },
      pixelRatio: 1,
      touchSupport: false,
      orientation: 'unknown',
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isTablet: false,
    }
  }

  const userAgent = navigator.userAgent
  const platform = navigator.platform
  
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isAndroid = /Android/.test(userAgent)
  const isMobile = /Mobi|Android/i.test(userAgent)
  const isTablet = /iPad/.test(userAgent) || (isAndroid && !/Mobile/.test(userAgent))
  
  return {
    userAgent,
    platform,
    screenSize: {
      width: screen.width,
      height: screen.height,
    },
    pixelRatio: window.devicePixelRatio || 1,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    orientation: screen.orientation?.type || 'unknown',
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
  }
}

/**
 * Get current viewport information including safe areas
 */
export function getViewportInfo(): ViewportInfo {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      width: 1920,
      height: 1080,
      orientation: 'landscape',
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
    }
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const orientation = width > height ? 'landscape' : 'portrait'
  
  // Calculate safe area insets (for notches, home indicators, etc.)
  const safeArea = {
    top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0'),
  }
  
  return {
    width,
    height,
    orientation,
    safeArea,
  }
}

/**
 * Check if device supports specific mobile features
 */
export function getMobileCapabilities() {
  return {
    touchEvents: 'ontouchstart' in window,
    pointerEvents: 'onpointerdown' in window,
    orientationChange: 'onorientationchange' in window,
    deviceMotion: 'ondevicemotion' in window,
    deviceOrientation: 'ondeviceorientation' in window,
    vibration: 'vibrate' in navigator,
    battery: 'getBattery' in navigator,
    connection: 'connection' in navigator,
    serviceWorker: 'serviceWorker' in navigator,
    webShare: 'share' in navigator,
    fullscreen: 'requestFullscreen' in document.documentElement,
  }
}

/**
 * Vibrate device if supported
 */
export function vibrate(pattern: number | number[]): boolean {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return false
  }
  return navigator.vibrate(pattern)
}

/**
 * Get battery information if supported
 */
export async function getBatteryInfo(): Promise<any | null> {
  if (typeof navigator === 'undefined' || !navigator.getBattery) {
    return null
  }
  try {
    return await navigator.getBattery()
  } catch (error) {
    console.warn('Battery API not available:', error)
    return null
  }
}

/**
 * Get network information if supported
 */
export function getNetworkInfo(): MobileNetworkInformation | null {
  if (typeof navigator === 'undefined') {
    return null
  }
  return navigator.connection || null
}

/**
 * Lock screen orientation if supported
 */
export async function lockOrientation(orientation: OrientationLockType): Promise<boolean> {
  if ((screen.orientation as any)?.lock) {
    try {
      await (screen.orientation as any).lock(orientation)
      return true
    } catch (error) {
      console.warn('Screen orientation lock failed:', error)
    }
  }
  return false
}

/**
 * Unlock screen orientation if supported
 */
export function unlockOrientation(): boolean {
  if (screen.orientation?.unlock) {
    try {
      screen.orientation.unlock()
      return true
    } catch (error) {
      console.warn('Screen orientation unlock failed:', error)
    }
  }
  return false
}

/**
 * Check if device is in landscape mode
 */
export function isLandscape(): boolean {
  if (typeof window === 'undefined') {
    return true // Default to landscape for SSR
  }
  return window.innerWidth > window.innerHeight
}

/**
 * Check if device is in portrait mode
 */
export function isPortrait(): boolean {
  if (typeof window === 'undefined') {
    return false // Default to landscape for SSR
  }
  return window.innerWidth <= window.innerHeight
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(): Partial<PerformanceMetrics> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return {
      memoryUsage: 0,
      networkLatency: 0,
      connectionType: 'unknown',
    }
  }

  const metrics: Partial<PerformanceMetrics> = {}
  
  // Memory usage (if available)
  if ('memory' in performance) {
    const memory = (performance as any).memory
    metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
  }
  
  // Network information
  const connection = getNetworkInfo()
  if (connection) {
    metrics.networkLatency = connection.rtt || 0
    metrics.connectionType = connection.effectiveType || 'unknown'
  }
  
  return metrics
}

/**
 * Prevent default touch behaviors (like scrolling, zooming)
 */
export function preventTouchDefaults(element: HTMLElement): () => void {
  const preventDefault = (e: Event) => {
    e.preventDefault()
  }
  
  element.addEventListener('touchstart', preventDefault, { passive: false })
  element.addEventListener('touchmove', preventDefault, { passive: false })
  element.addEventListener('touchend', preventDefault, { passive: false })
  
  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', preventDefault)
    element.removeEventListener('touchmove', preventDefault)
    element.removeEventListener('touchend', preventDefault)
  }
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Smooth scroll to element with mobile optimization
 */
export function scrollToElement(element: HTMLElement, options?: ScrollIntoViewOptions): void {
  const defaultOptions: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest',
  }
  
  element.scrollIntoView({ ...defaultOptions, ...options })
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}