// Hammer.js will be dynamically imported to avoid SSR issues
import { GestureEvent, GestureData, GestureConfig } from '@/types/mobile';
import { throttle, debounce } from '@/utils/mobile';

export interface GestureRecognitionEngine {
  initialize: (element: HTMLElement, config: GestureConfig) => Promise<void>;
  destroy: () => void;
  on: (eventType: string, handler: (event: GestureEvent) => void) => void;
  off: (eventType: string, handler?: (event: GestureEvent) => void) => void;
  updateConfig: (config: Partial<GestureConfig>) => void;
  getActiveGestures: () => string[];
}

export interface GestureHandler {
  onPinchZoom?: (scale: number, center: { x: number; y: number }) => void;
  onPan?: (delta: { x: number; y: number }) => void;
  onDoubleTap?: (point: { x: number; y: number }) => void;
  onLongPress?: (point: { x: number; y: number }) => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', velocity: number) => void;
  onRotate?: (rotation: number, center: { x: number; y: number }) => void;
}

class GestureRecognizer implements GestureRecognitionEngine {
  private hammer: HammerManager | null = null;
  private element: HTMLElement | null = null;
  private config: GestureConfig;
  private eventHandlers: Map<string, Set<(event: GestureEvent) => void>> = new Map();
  private activeGestures: Set<string> = new Set();
  private gestureConflictResolver: GestureConflictResolver;
  private performanceOptimizer: GesturePerformanceOptimizer;

  constructor(defaultConfig: GestureConfig) {
    this.config = { ...defaultConfig };
    this.gestureConflictResolver = new GestureConflictResolver();
    this.performanceOptimizer = new GesturePerformanceOptimizer();
  }

  async initialize(element: HTMLElement, config: GestureConfig): Promise<void> {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      return;
    }

    this.element = element;
    this.config = { ...this.config, ...config };
    
    // Dynamically import Hammer.js
    const Hammer = await import('hammerjs');
    const HammerConstructor = Hammer.default || Hammer;
    
    // Create Hammer.js instance
    this.hammer = new HammerConstructor.Manager(element, {
      recognizers: this.createRecognizers(HammerConstructor),
      inputClass: HammerConstructor.TouchInput
    });

    // Configure gesture recognition
    this.configureGestureRecognition();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Prevent browser default gestures if configured
    if (this.config.preventBrowserGestures) {
      this.preventBrowserDefaults();
    }
  }

  destroy(): void {
    if (this.hammer) {
      this.hammer.destroy();
      this.hammer = null;
    }
    
    this.eventHandlers.clear();
    this.activeGestures.clear();
    this.element = null;
  }

  on(eventType: string, handler: (event: GestureEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  off(eventType: string, handler?: (event: GestureEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) return;
    
    if (handler) {
      this.eventHandlers.get(eventType)!.delete(handler);
    } else {
      this.eventHandlers.get(eventType)!.clear();
    }
  }

  updateConfig(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.hammer) {
      this.configureGestureRecognition();
    }
  }

  getActiveGestures(): string[] {
    return Array.from(this.activeGestures);
  }

  private createRecognizers(Hammer: any): any[] {
    const recognizers: any[] = [];

    // Pan recognizer
    if (this.config.enablePan) {
      recognizers.push(new Hammer.Pan({
        direction: Hammer.DIRECTION_ALL,
        threshold: 10,
        pointers: 1
      }));
    }

    // Pinch recognizer
    if (this.config.enablePinchZoom) {
      recognizers.push(new Hammer.Pinch({
        enable: true,
        threshold: 0.1
      }));
    }

    // Rotation recognizer
    if (this.config.enableRotation) {
      recognizers.push(new Hammer.Rotate({
        enable: true,
        threshold: 15
      }));
    }

    // Tap recognizers
    recognizers.push(new Hammer.Tap({
      event: 'singletap',
      taps: 1,
      interval: 300,
      threshold: 9,
      posThreshold: 10
    }));

    recognizers.push(new Hammer.Tap({
      event: 'doubletap',
      taps: 2,
      interval: 300,
      threshold: 9,
      posThreshold: 10
    }));

    // Press recognizer (long press)
    recognizers.push(new Hammer.Press({
      time: 500,
      threshold: 9,
      posThreshold: 10
    }));

    // Swipe recognizer
    recognizers.push(new Hammer.Swipe({
      direction: Hammer.DIRECTION_ALL,
      threshold: 10,
      velocity: 0.3
    }));

    return recognizers;
  }

  private configureGestureRecognition(): void {
    if (!this.hammer) return;

    // Configure recognizer relationships to avoid conflicts
    const pan = this.hammer.get('pan');
    const pinch = this.hammer.get('pinch');
    const rotate = this.hammer.get('rotate');
    const singletap = this.hammer.get('singletap');
    const doubletap = this.hammer.get('doubletap');

    // Allow simultaneous recognition
    if (pinch && rotate) {
      pinch.recognizeWith(rotate);
    }
    
    if (pan && pinch) {
      pan.recognizeWith(pinch);
    }

    // Prevent conflicts
    if (singletap && doubletap) {
      singletap.requireFailure(doubletap);
    }

    // Apply sensitivity settings
    this.applySensitivitySettings();
  }

  private applySensitivitySettings(): void {
    if (!this.hammer) return;

    const sensitivity = this.config.sensitivity;
    const sensitivityMultiplier = sensitivity / 1.0; // Normalize to 1.0

    // Adjust thresholds based on sensitivity
    const pan = this.hammer.get('pan');
    if (pan) {
      pan.set({ threshold: Math.max(1, 10 / sensitivityMultiplier) });
    }

    const pinch = this.hammer.get('pinch');
    if (pinch) {
      pinch.set({ threshold: Math.max(0.05, 0.1 / sensitivityMultiplier) });
    }

    const swipe = this.hammer.get('swipe');
    if (swipe) {
      swipe.set({ 
        threshold: Math.max(5, 10 / sensitivityMultiplier),
        velocity: Math.max(0.1, 0.3 / sensitivityMultiplier)
      });
    }
  }

  private setupEventListeners(): void {
    if (!this.hammer) return;

    // Pan events
    this.hammer.on('panstart panmove panend pancancel', (e) => {
      this.handlePanEvent(e);
    });

    // Pinch events
    this.hammer.on('pinchstart pinchmove pinchend pinchcancel', (e) => {
      this.handlePinchEvent(e);
    });

    // Rotation events
    this.hammer.on('rotatestart rotatemove rotateend rotatecancel', (e) => {
      this.handleRotateEvent(e);
    });

    // Tap events
    this.hammer.on('singletap doubletap', (e) => {
      this.handleTapEvent(e);
    });

    // Press events
    this.hammer.on('press pressup', (e) => {
      this.handlePressEvent(e);
    });

    // Swipe events
    this.hammer.on('swipe', (e) => {
      this.handleSwipeEvent(e);
    });
  }

  private handlePanEvent(hammerEvent: HammerInput): void {
    const gestureType = 'pan';
    
    if (!this.gestureConflictResolver.canExecuteGesture(gestureType, hammerEvent)) {
      return;
    }

    const gestureData: GestureData = {
      center: { x: hammerEvent.center.x, y: hammerEvent.center.y },
      velocity: { x: hammerEvent.velocityX, y: hammerEvent.velocityY },
      distance: hammerEvent.distance
    };

    const gestureEvent: GestureEvent = {
      type: 'pan',
      data: gestureData,
      preventDefault: () => hammerEvent.preventDefault(),
      stopPropagation: () => hammerEvent.srcEvent.stopPropagation()
    };

    this.updateActiveGestures(gestureType, hammerEvent.type);
    this.performanceOptimizer.throttleGestureEvent(gestureType, () => {
      this.emitEvent('pan', gestureEvent);
    });
  }

  private handlePinchEvent(hammerEvent: HammerInput): void {
    const gestureType = 'pinch';
    
    if (!this.gestureConflictResolver.canExecuteGesture(gestureType, hammerEvent)) {
      return;
    }

    const gestureData: GestureData = {
      center: { x: hammerEvent.center.x, y: hammerEvent.center.y },
      scale: hammerEvent.scale
    };

    const gestureEvent: GestureEvent = {
      type: 'pinch',
      data: gestureData,
      preventDefault: () => hammerEvent.preventDefault(),
      stopPropagation: () => hammerEvent.srcEvent.stopPropagation()
    };

    this.updateActiveGestures(gestureType, hammerEvent.type);
    this.performanceOptimizer.throttleGestureEvent(gestureType, () => {
      this.emitEvent('pinch', gestureEvent);
    });
  }

  private handleRotateEvent(hammerEvent: HammerInput): void {
    const gestureType = 'rotate';
    
    if (!this.gestureConflictResolver.canExecuteGesture(gestureType, hammerEvent)) {
      return;
    }

    const gestureData: GestureData = {
      center: { x: hammerEvent.center.x, y: hammerEvent.center.y },
      rotation: hammerEvent.rotation
    };

    const gestureEvent: GestureEvent = {
      type: 'pan', // Note: using 'pan' as base type, but with rotation data
      data: gestureData,
      preventDefault: () => hammerEvent.preventDefault(),
      stopPropagation: () => hammerEvent.srcEvent.stopPropagation()
    };

    this.updateActiveGestures(gestureType, hammerEvent.type);
    this.performanceOptimizer.throttleGestureEvent(gestureType, () => {
      this.emitEvent('rotate', gestureEvent);
    });
  }

  private handleTapEvent(hammerEvent: HammerInput): void {
    const gestureType = hammerEvent.type === 'doubletap' ? 'doubletap' : 'tap';
    
    const gestureData: GestureData = {
      center: { x: hammerEvent.center.x, y: hammerEvent.center.y }
    };

    const gestureEvent: GestureEvent = {
      type: 'tap',
      data: gestureData,
      preventDefault: () => hammerEvent.preventDefault(),
      stopPropagation: () => hammerEvent.srcEvent.stopPropagation()
    };

    this.emitEvent(gestureType, gestureEvent);
  }

  private handlePressEvent(hammerEvent: HammerInput): void {
    if (hammerEvent.type === 'press') {
      const gestureData: GestureData = {
        center: { x: hammerEvent.center.x, y: hammerEvent.center.y }
      };

      const gestureEvent: GestureEvent = {
        type: 'longpress',
        data: gestureData,
        preventDefault: () => hammerEvent.preventDefault(),
        stopPropagation: () => hammerEvent.srcEvent.stopPropagation()
      };

      this.emitEvent('longpress', gestureEvent);
    }
  }

  private handleSwipeEvent(hammerEvent: HammerInput): void {
    let direction: 'up' | 'down' | 'left' | 'right';
    
    switch (hammerEvent.direction) {
      case Hammer.DIRECTION_UP:
        direction = 'up';
        break;
      case Hammer.DIRECTION_DOWN:
        direction = 'down';
        break;
      case Hammer.DIRECTION_LEFT:
        direction = 'left';
        break;
      case Hammer.DIRECTION_RIGHT:
        direction = 'right';
        break;
      default:
        return;
    }

    const gestureData: GestureData = {
      center: { x: hammerEvent.center.x, y: hammerEvent.center.y },
      direction,
      velocity: { x: hammerEvent.velocityX, y: hammerEvent.velocityY },
      distance: hammerEvent.distance
    };

    const gestureEvent: GestureEvent = {
      type: 'swipe',
      data: gestureData,
      preventDefault: () => hammerEvent.preventDefault(),
      stopPropagation: () => hammerEvent.srcEvent.stopPropagation()
    };

    this.emitEvent('swipe', gestureEvent);
  }

  private updateActiveGestures(gestureType: string, eventType: string): void {
    if (eventType.includes('start')) {
      this.activeGestures.add(gestureType);
    } else if (eventType.includes('end') || eventType.includes('cancel')) {
      this.activeGestures.delete(gestureType);
    }
  }

  private emitEvent(eventType: string, gestureEvent: GestureEvent): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(gestureEvent);
        } catch (error) {
          console.error(`Error in gesture handler for ${eventType}:`, error);
        }
      });
    }
  }

  private preventBrowserDefaults(): void {
    if (!this.element) return;

    const preventDefaults = (e: Event) => {
      e.preventDefault();
    };

    // Prevent context menu on long press
    this.element.addEventListener('contextmenu', preventDefaults);
    
    // Prevent text selection
    this.element.style.userSelect = 'none';
    this.element.style.webkitUserSelect = 'none';
    
    // Prevent touch callout on iOS
    (this.element.style as any).webkitTouchCallout = 'none';
    
    // Prevent default touch actions
    this.element.style.touchAction = 'none';
  }
}

// Gesture conflict resolution system
class GestureConflictResolver {
  private gestureHierarchy: Map<string, number> = new Map([
    ['pinch', 3],
    ['rotate', 3],
    ['pan', 2],
    ['swipe', 1],
    ['tap', 0],
    ['longpress', 0]
  ]);

  private activeGesturePriorities: Map<string, number> = new Map();

  canExecuteGesture(gestureType: string, hammerEvent: HammerInput): boolean {
    const priority = this.gestureHierarchy.get(gestureType) || 0;
    
    // Check if there's a higher priority gesture active
    for (const [activeGesture, activePriority] of this.activeGesturePriorities) {
      if (activePriority > priority && activeGesture !== gestureType) {
        return false;
      }
    }

    // Update active gesture priorities
    if (hammerEvent.type.includes('start')) {
      this.activeGesturePriorities.set(gestureType, priority);
    } else if (hammerEvent.type.includes('end') || hammerEvent.type.includes('cancel')) {
      this.activeGesturePriorities.delete(gestureType);
    }

    return true;
  }
}

// Performance optimization for gesture events
class GesturePerformanceOptimizer {
  private throttledFunctions: Map<string, Function> = new Map();
  private debouncedFunctions: Map<string, Function> = new Map();

  throttleGestureEvent(gestureType: string, callback: (...args: any[]) => any, delay: number = 16): void {
    if (!this.throttledFunctions.has(gestureType)) {
      this.throttledFunctions.set(gestureType, throttle(callback, delay));
    }
    
    const throttledFn = this.throttledFunctions.get(gestureType)!;
    throttledFn();
  }

  debounceGestureEvent(gestureType: string, callback: (...args: any[]) => any, delay: number = 100): void {
    if (!this.debouncedFunctions.has(gestureType)) {
      this.debouncedFunctions.set(gestureType, debounce(callback, delay));
    }
    
    const debouncedFn = this.debouncedFunctions.get(gestureType)!;
    debouncedFn();
  }
}

// Factory function to create gesture recognition engine
export function createGestureRecognitionEngine(config: GestureConfig): GestureRecognitionEngine {
  return new GestureRecognizer(config);
}

// Default configuration
export const defaultGestureConfig: GestureConfig = {
  enablePinchZoom: true,
  enablePan: true,
  enableRotation: false,
  preventBrowserGestures: true,
  sensitivity: 1.0
};

// Utility function to create gesture handler
export async function createGestureHandler(
  element: HTMLElement,
  handlers: GestureHandler,
  config: Partial<GestureConfig> = {}
): Promise<GestureRecognitionEngine> {
  const gestureEngine = createGestureRecognitionEngine({
    ...defaultGestureConfig,
    ...config
  });

  await gestureEngine.initialize(element, { ...defaultGestureConfig, ...config });

  // Set up handlers
  if (handlers.onPinchZoom) {
    gestureEngine.on('pinch', (event) => {
      if (event.data.scale && event.data.center) {
        handlers.onPinchZoom!(event.data.scale, event.data.center);
      }
    });
  }

  if (handlers.onPan) {
    gestureEngine.on('pan', (event) => {
      if (event.data.velocity) {
        handlers.onPan!(event.data.velocity);
      }
    });
  }

  if (handlers.onDoubleTap) {
    gestureEngine.on('doubletap', (event) => {
      if (event.data.center) {
        handlers.onDoubleTap!(event.data.center);
      }
    });
  }

  if (handlers.onLongPress) {
    gestureEngine.on('longpress', (event) => {
      if (event.data.center) {
        handlers.onLongPress!(event.data.center);
      }
    });
  }

  if (handlers.onSwipe) {
    gestureEngine.on('swipe', (event) => {
      if (event.data.direction && event.data.velocity) {
        const velocity = Math.sqrt(
          (event.data.velocity.x || 0) ** 2 + (event.data.velocity.y || 0) ** 2
        );
        handlers.onSwipe!(event.data.direction, velocity);
      }
    });
  }

  if (handlers.onRotate) {
    gestureEngine.on('rotate', (event) => {
      if (event.data.rotation !== undefined && event.data.center) {
        handlers.onRotate!(event.data.rotation, event.data.center);
      }
    });
  }

  return gestureEngine;
}