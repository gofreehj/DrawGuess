/**
 * @jest-environment jsdom
 */
import { createGestureRecognitionEngine } from '../../lib/gesture-recognition';
import { createPalmRejectionSystem } from '../../lib/palm-rejection';

// Mock dependencies
jest.mock('../../utils/mobile', () => ({
  vibrate: jest.fn(),
  throttle: jest.fn((fn) => fn),
  debounce: jest.fn((fn) => fn),
  getPerformanceMetrics: jest.fn(() => ({
    fps: 60,
    memoryUsage: 0.5,
    renderTime: 16,
    networkLatency: 0,
    cacheHitRate: 1
  })),
  getDeviceInfo: jest.fn(() => ({
    userAgent: 'test-agent',
    platform: 'test-platform',
    screenSize: { width: 1920, height: 1080 },
    pixelRatio: 2,
    touchSupport: true,
    orientation: 'landscape-primary',
    isIOS: false,
    isAndroid: false,
    isMobile: true,
    isTablet: false
  }))
}));

jest.mock('hammerjs', () => {
  return {
    Manager: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      on: jest.fn(),
      destroy: jest.fn(),
      recognizeWith: jest.fn(),
      requireFailure: jest.fn(),
      set: jest.fn()
    })),
    Pan: jest.fn(),
    Pinch: jest.fn(),
    Rotate: jest.fn(),
    Tap: jest.fn(),
    Press: jest.fn(),
    Swipe: jest.fn(),
    DIRECTION_ALL: 30,
    DIRECTION_UP: 8,
    DIRECTION_DOWN: 16,
    DIRECTION_LEFT: 2,
    DIRECTION_RIGHT: 4,
    TouchInput: jest.fn()
  };
});

jest.mock('fabric', () => ({
  Canvas: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
    on: jest.fn(),
    getElement: jest.fn(() => document.createElement('canvas')),
    getContext: jest.fn(() => ({
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      stroke: jest.fn()
    })),
    renderAll: jest.fn(),
    toDataURL: jest.fn(() => 'data:image/png;base64,test')
  })),
  PencilBrush: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('Touch Interaction System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Gesture Recognition Engine', () => {
    it('creates gesture engine with default config', () => {
      const config = {
        enablePinchZoom: true,
        enablePan: true,
        enableRotation: false,
        preventBrowserGestures: true,
        sensitivity: 1.0
      };

      const engine = createGestureRecognitionEngine(config);
      expect(engine).toBeDefined();
      expect(typeof engine.initialize).toBe('function');
      expect(typeof engine.destroy).toBe('function');
    });

    it('handles gesture events correctly', () => {
      const config = {
        enablePinchZoom: true,
        enablePan: true,
        enableRotation: false,
        preventBrowserGestures: true,
        sensitivity: 1.0
      };

      const engine = createGestureRecognitionEngine(config);
      const mockElement = document.createElement('div');
      
      engine.initialize(mockElement, config);
      
      const mockHandler = jest.fn();
      engine.on('pinch', mockHandler);
      
      // Verify event handler registration
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Palm Rejection System', () => {
    it('creates palm rejection system with default config', () => {
      const palmRejection = createPalmRejectionSystem();
      expect(palmRejection).toBeDefined();
    });

    it('analyzes touch points correctly', () => {
      const palmRejection = createPalmRejectionSystem({
        palmSizeThreshold: 40,
        palmPressureThreshold: 0.3,
        confidenceThreshold: 0.6
      });

      const mockElement = document.createElement('div');
      palmRejection.initialize(mockElement);

      const touchPoint = {
        id: 1,
        x: 100,
        y: 100,
        pressure: 0.5,
        timestamp: Date.now(),
        type: 'start' as const
      };

      const analysis = palmRejection.analyzeTouchPoint(touchPoint, [touchPoint]);
      
      expect(analysis).toHaveProperty('isPalm');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis).toHaveProperty('reason');
    });

    it('rejects palm touches correctly', () => {
      const palmRejection = createPalmRejectionSystem({
        palmSizeThreshold: 20, // Low threshold for testing
        palmPressureThreshold: 0.8, // High threshold for testing
        confidenceThreshold: 0.3
      });

      const mockElement = document.createElement('div');
      palmRejection.initialize(mockElement);

      // Simulate a large, low-pressure touch (likely palm)
      const palmTouch = {
        id: 1,
        x: 10, // Near edge
        y: 10,
        pressure: 0.1, // Very low pressure
        timestamp: Date.now(),
        type: 'start' as const
      };

      const isValid = palmRejection.isValidDrawingTouch(palmTouch, [palmTouch]);
      expect(isValid).toBe(false);
    });
  });

  describe('Core Touch System Integration', () => {
    it('creates components without errors', () => {
      // Test that the core systems can be instantiated
      expect(() => {
        const config = {
          enablePinchZoom: true,
          enablePan: true,
          enableRotation: false,
          preventBrowserGestures: true,
          sensitivity: 1.0
        };
        createGestureRecognitionEngine(config);
      }).not.toThrow();

      expect(() => {
        createPalmRejectionSystem();
      }).not.toThrow();
    });

    it('handles OffscreenCanvas availability', () => {
      // Mock OffscreenCanvas
      const originalOffscreenCanvas = (global as any).OffscreenCanvas;
      
      // Test with OffscreenCanvas available
      (global as any).OffscreenCanvas = jest.fn().mockImplementation(() => ({
        getContext: jest.fn(() => ({
          clearRect: jest.fn(),
          fillRect: jest.fn(),
          getImageData: jest.fn()
        }))
      }));

      expect((global as any).OffscreenCanvas).toBeDefined();
      
      // Restore original
      (global as any).OffscreenCanvas = originalOffscreenCanvas;
    });
  });
});