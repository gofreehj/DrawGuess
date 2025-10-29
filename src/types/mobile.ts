// Mobile-specific type definitions

export interface TouchPoint {
  id: number
  x: number
  y: number
  pressure: number
  timestamp: number
  type: 'start' | 'move' | 'end'
}

export interface GestureEvent {
  type: 'pinch' | 'pan' | 'tap' | 'longpress' | 'swipe'
  data: GestureData
  preventDefault: () => void
  stopPropagation: () => void
}

export interface GestureData {
  center?: { x: number; y: number }
  scale?: number
  rotation?: number
  velocity?: { x: number; y: number }
  distance?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export interface DeviceInfo {
  userAgent: string
  platform: string
  screenSize: { width: number; height: number }
  pixelRatio: number
  touchSupport: boolean
  orientation: string
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  isTablet: boolean
}

export interface ViewportInfo {
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  safeArea: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  renderTime: number
  networkLatency: number
  cacheHitRate: number
  batteryLevel?: number
  connectionType?: string
}

export interface MobileUserPreferences {
  id: string
  userId?: string
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  toolbarLayout: ToolbarLayout
  gestureSettings: GestureSettings
  accessibilitySettings: AccessibilitySettings
  performanceSettings: PerformanceSettings
  lastUpdated: Date
}

export interface ToolbarLayout {
  position: 'top' | 'bottom' | 'floating'
  tools: string[]
  customOrder: boolean
  autoHide: boolean
}

export interface GestureSettings {
  enablePinchZoom: boolean
  enablePan: boolean
  sensitivity: number
  hapticFeedback: boolean
}

export interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reduceMotion: boolean
  screenReader: boolean
}

export interface PerformanceSettings {
  enableVirtualization: boolean
  lazyLoadImages: boolean
  debounceDrawing: number
  throttleGestures: number
  useWebWorkers: boolean
}

// PWA related types
export interface PWAInstallPrompt {
  show: () => Promise<boolean>
  isInstallable: boolean
  isInstalled: boolean
  platform: 'ios' | 'android' | 'desktop'
}

export interface ServiceWorkerMessage {
  type: 'CACHE_UPDATED' | 'OFFLINE_READY' | 'UPDATE_AVAILABLE'
  payload?: any
}

// Touch and gesture handler types
export interface TouchCanvasProps {
  width: number
  height: number
  tools: any // DrawingTools type from existing codebase
  onDrawingChange: (data: any) => void // DrawingData type from existing codebase
  enableGestures?: boolean
  hapticFeedback?: boolean
  preventScrolling?: boolean
}

export interface GestureConfig {
  enablePinchZoom: boolean
  enablePan: boolean
  enableRotation: boolean
  preventBrowserGestures: boolean
  sensitivity: number
}

export interface DrawingData {
  imageData: string
  strokes: StrokeData[]
  metadata: CanvasMetadata
}

export interface StrokeData {
  id: string
  points: TouchPoint[]
  tool: DrawingTool
  timestamp: number
  pressure?: number
}

export interface CanvasMetadata {
  width: number
  height: number
  devicePixelRatio: number
  timestamp: number
  strokeCount: number
}

export interface DrawingTool {
  type: 'brush' | 'eraser'
  size: number
  color: string
  opacity: number
}

// Mobile-specific type definitions (avoiding conflicts with DOM types)
export interface MobileBatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
}

export interface MobileNetworkInformation extends EventTarget {
  type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown'
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  downlink?: number
  rtt?: number
  saveData?: boolean
}

// Extend global interfaces for mobile APIs (only add missing properties)
declare global {
  interface Navigator {
    getBattery?: () => Promise<MobileBatteryManager>
    connection?: MobileNetworkInformation
    deviceMemory?: number
  }
}

export type OrientationLockType = 
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary'