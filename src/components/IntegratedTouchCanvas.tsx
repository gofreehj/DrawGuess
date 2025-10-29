'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import EnhancedTouchCanvas from './EnhancedTouchCanvas';
import { createGestureHandler, GestureHandler } from '@/lib/gesture-recognition';
import { createPalmRejectionSystem, PalmRejectionSystem } from '@/lib/palm-rejection';
import { TouchPoint, GestureConfig, TouchCanvasProps } from '@/types/mobile';
import { vibrate } from '@/utils/mobile';

interface IntegratedTouchCanvasProps extends TouchCanvasProps {
  gestureConfig?: Partial<GestureConfig>;
  palmRejectionEnabled?: boolean;
  onGestureDetected?: (gestureType: string, data: any) => void;
  onPalmRejected?: (touchPoint: TouchPoint, reason: string) => void;
}

export default function IntegratedTouchCanvas({
  width,
  height,
  tools,
  onDrawingChange,
  enableGestures = true,
  hapticFeedback = true,
  preventScrolling = true,
  gestureConfig = {},
  palmRejectionEnabled = true,
  onGestureDetected,
  onPalmRejected,
  ...props
}: IntegratedTouchCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const palmRejectionRef = useRef<PalmRejectionSystem | null>(null);
  const gestureEngineRef = useRef<any>(null);
  
  const [activeTouches, setActiveTouches] = useState<TouchPoint[]>([]);
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [rejectedTouches, setRejectedTouches] = useState<Set<number>>(new Set());

  // Initialize palm rejection system
  useEffect(() => {
    if (palmRejectionEnabled && containerRef.current) {
      palmRejectionRef.current = createPalmRejectionSystem();
      palmRejectionRef.current.initialize(containerRef.current);
    }

    return () => {
      if (palmRejectionRef.current) {
        // Cleanup if needed
      }
    };
  }, [palmRejectionEnabled]);

  // Initialize gesture recognition
  useEffect(() => {
    if (enableGestures && containerRef.current) {
      const gestureHandlers: GestureHandler = {
        onPinchZoom: (scale, center) => {
          setIsGestureActive(true);
          onGestureDetected?.('pinch', { scale, center });
          if (hapticFeedback) vibrate(20);
        },
        onPan: (delta) => {
          setIsGestureActive(true);
          onGestureDetected?.('pan', { delta });
        },
        onDoubleTap: (point) => {
          onGestureDetected?.('doubletap', { point });
          if (hapticFeedback) vibrate([10, 50, 10]);
        },
        onLongPress: (point) => {
          onGestureDetected?.('longpress', { point });
          if (hapticFeedback) vibrate([100, 50, 100]);
        },
        onSwipe: (direction, velocity) => {
          onGestureDetected?.('swipe', { direction, velocity });
          if (hapticFeedback) vibrate(30);
        }
      };

      gestureEngineRef.current = createGestureHandler(
        containerRef.current,
        gestureHandlers,
        gestureConfig
      );
    }

    return () => {
      if (gestureEngineRef.current) {
        gestureEngineRef.current.destroy();
      }
    };
  }, [enableGestures, gestureConfig, hapticFeedback, onGestureDetected]);

  // Enhanced touch filtering with palm rejection
  const filterValidTouches = useCallback((touches: TouchPoint[]): TouchPoint[] => {
    if (!palmRejectionEnabled || !palmRejectionRef.current) {
      return touches;
    }

    const validTouches: TouchPoint[] = [];
    const newRejectedTouches = new Set(rejectedTouches);

    for (const touch of touches) {
      if (rejectedTouches.has(touch.id)) {
        continue; // Already rejected
      }

      const isValid = palmRejectionRef.current.isValidDrawingTouch(touch, touches);
      
      if (isValid) {
        validTouches.push(touch);
      } else {
        newRejectedTouches.add(touch.id);
        const analysis = palmRejectionRef.current.analyzeTouchPoint(touch, touches);
        onPalmRejected?.(touch, analysis.reason);
      }
    }

    if (newRejectedTouches.size !== rejectedTouches.size) {
      setRejectedTouches(newRejectedTouches);
    }

    return validTouches;
  }, [palmRejectionEnabled, rejectedTouches, onPalmRejected]);

  // Handle touch events with integrated filtering
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touches: TouchPoint[] = Array.from(e.touches).map((touch, index) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      pressure: (touch as any).force || 0.5,
      timestamp: Date.now(),
      type: 'start'
    }));

    const validTouches = filterValidTouches(touches);
    setActiveTouches(validTouches);

    // Reset gesture state on new touch
    if (validTouches.length === 1) {
      setIsGestureActive(false);
    }
  }, [filterValidTouches]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touches: TouchPoint[] = Array.from(e.touches).map((touch) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      pressure: (touch as any).force || 0.5,
      timestamp: Date.now(),
      type: 'move'
    }));

    const validTouches = filterValidTouches(touches);
    setActiveTouches(validTouches);
  }, [filterValidTouches]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const remainingTouches: TouchPoint[] = Array.from(e.touches).map((touch) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      pressure: (touch as any).force || 0.5,
      timestamp: Date.now(),
      type: 'end'
    }));

    const validTouches = filterValidTouches(remainingTouches);
    setActiveTouches(validTouches);

    // Clean up rejected touches that are no longer active
    const activeIds = new Set(validTouches.map(t => t.id));
    const cleanedRejected = new Set(
      Array.from(rejectedTouches).filter(id => activeIds.has(id))
    );
    setRejectedTouches(cleanedRejected);

    // Reset gesture state when no touches remain
    if (validTouches.length === 0) {
      setIsGestureActive(false);
    }
  }, [filterValidTouches, rejectedTouches]);

  return (
    <motion.div
      ref={containerRef}
      className="integrated-touch-canvas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <EnhancedTouchCanvas
        width={width}
        height={height}
        tools={tools}
        onDrawingChange={onDrawingChange}
        enableGestures={enableGestures && !isGestureActive}
        hapticFeedback={hapticFeedback}
        preventScrolling={preventScrolling}
        {...props}
      />
      
      {/* Visual feedback for rejected touches */}
      {Array.from(rejectedTouches).map((touchId) => (
        <motion.div
          key={`rejected-${touchId}`}
          className="absolute pointer-events-none"
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.3)',
            border: '2px solid #ef4444'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        />
      ))}
      
      {/* Status indicators */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 text-xs bg-black bg-opacity-50 text-white p-2 rounded">
          <div>Active: {activeTouches.length}</div>
          <div>Rejected: {rejectedTouches.size}</div>
          <div>Gesture: {isGestureActive ? 'Yes' : 'No'}</div>
        </div>
      )}
    </motion.div>
  );
}