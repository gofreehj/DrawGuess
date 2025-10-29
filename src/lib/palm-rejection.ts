import { TouchPoint, DeviceInfo } from '@/types/mobile';
import { getDeviceInfo, vibrate } from '@/utils/mobile';

export interface PalmRejectionConfig {
  enabled: boolean;
  palmSizeThreshold: number; // Minimum size to be considered a palm
  palmPressureThreshold: number; // Maximum pressure for palm detection
  edgeMargin: number; // Distance from edge to consider as potential palm
  timeWindow: number; // Time window for analyzing touch patterns
  confidenceThreshold: number; // Minimum confidence to reject touch
  adaptiveLearning: boolean; // Enable adaptive learning from user patterns
}

export interface TouchAnalysis {
  isPalm: boolean;
  confidence: number;
  reason: string;
  touchArea: number;
  pressure: number;
  edgeDistance: number;
  simultaneousTouches: number;
}

export interface SafeZone {
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number; // Higher priority zones are protected more strictly
}

export interface HapticFeedbackConfig {
  enabled: boolean;
  palmRejectionPattern: number[];
  validTouchPattern: number[];
  boundaryWarningPattern: number[];
}

class PalmRejectionSystem {
  private config: PalmRejectionConfig;
  private deviceInfo: DeviceInfo;
  private touchHistory: Map<number, TouchPoint[]> = new Map();
  private safeZones: SafeZone[] = [];
  private learningData: TouchLearningData = new TouchLearningData();
  private hapticConfig: HapticFeedbackConfig;
  private canvasElement: HTMLElement | null = null;
  private canvasBounds: DOMRect | null = null;

  constructor(config: PalmRejectionConfig, hapticConfig: HapticFeedbackConfig) {
    this.config = config;
    this.hapticConfig = hapticConfig;
    this.deviceInfo = getDeviceInfo();
    this.initializeDefaultSafeZones();
  }

  initialize(canvasElement: HTMLElement): void {
    this.canvasElement = canvasElement;
    this.canvasBounds = canvasElement.getBoundingClientRect();
    
    // Update safe zones based on canvas dimensions
    this.updateSafeZonesForCanvas();
    
    // Set up resize observer to update bounds
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        this.canvasBounds = canvasElement.getBoundingClientRect();
        this.updateSafeZonesForCanvas();
      });
      resizeObserver.observe(canvasElement);
    }
  }

  analyzeTouchPoint(touchPoint: TouchPoint, allActiveTouches: TouchPoint[]): TouchAnalysis {
    if (!this.config.enabled) {
      return {
        isPalm: false,
        confidence: 0,
        reason: 'Palm rejection disabled',
        touchArea: 0,
        pressure: touchPoint.pressure,
        edgeDistance: 0,
        simultaneousTouches: allActiveTouches.length
      };
    }

    // Store touch history for pattern analysis
    this.updateTouchHistory(touchPoint);

    // Perform multiple analysis checks
    const analyses = [
      this.analyzeTouchSize(touchPoint),
      this.analyzeTouchPressure(touchPoint),
      this.analyzeEdgeProximity(touchPoint),
      this.analyzeSimultaneousTouches(touchPoint, allActiveTouches),
      this.analyzeTouchPattern(touchPoint),
      this.analyzeSafeZoneViolation(touchPoint)
    ];

    // Combine analysis results
    const combinedAnalysis = this.combineAnalyses(analyses);

    // Apply adaptive learning if enabled
    if (this.config.adaptiveLearning) {
      this.learningData.recordTouchAnalysis(touchPoint, combinedAnalysis);
    }

    // Provide haptic feedback if palm is detected
    if (combinedAnalysis.isPalm && this.hapticConfig.enabled) {
      vibrate(this.hapticConfig.palmRejectionPattern);
    }

    return combinedAnalysis;
  }

  isValidDrawingTouch(touchPoint: TouchPoint, allActiveTouches: TouchPoint[]): boolean {
    const analysis = this.analyzeTouchPoint(touchPoint, allActiveTouches);
    return !analysis.isPalm;
  }

  addSafeZone(zone: SafeZone): void {
    this.safeZones.push(zone);
    this.safeZones.sort((a, b) => b.priority - a.priority); // Sort by priority
  }

  removeSafeZone(index: number): void {
    if (index >= 0 && index < this.safeZones.length) {
      this.safeZones.splice(index, 1);
    }
  }

  updateConfig(newConfig: Partial<PalmRejectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getAdaptiveLearningData(): any {
    return this.learningData.getStatistics();
  }

  resetAdaptiveLearning(): void {
    this.learningData.reset();
  }

  private initializeDefaultSafeZones(): void {
    // Default safe zones for common UI elements
    this.safeZones = [
      // Top toolbar area
      { x: 0, y: 0, width: 1, height: 0.1, priority: 3 },
      // Bottom navigation area
      { x: 0, y: 0.9, width: 1, height: 0.1, priority: 3 },
      // Side margins for palm rest
      { x: 0, y: 0, width: 0.05, height: 1, priority: 1 },
      { x: 0.95, y: 0, width: 0.05, height: 1, priority: 1 }
    ];
  }

  private updateSafeZonesForCanvas(): void {
    if (!this.canvasBounds) return;

    // Convert relative safe zones to absolute coordinates
    this.safeZones.forEach(zone => {
      if (zone.width <= 1 && zone.height <= 1) {
        // Convert from relative to absolute coordinates
        zone.x = zone.x * this.canvasBounds!.width;
        zone.y = zone.y * this.canvasBounds!.height;
        zone.width = zone.width * this.canvasBounds!.width;
        zone.height = zone.height * this.canvasBounds!.height;
      }
    });
  }

  private updateTouchHistory(touchPoint: TouchPoint): void {
    if (!this.touchHistory.has(touchPoint.id)) {
      this.touchHistory.set(touchPoint.id, []);
    }

    const history = this.touchHistory.get(touchPoint.id)!;
    history.push(touchPoint);

    // Keep only recent history within time window
    const cutoffTime = touchPoint.timestamp - this.config.timeWindow;
    const filteredHistory = history.filter(point => point.timestamp >= cutoffTime);
    this.touchHistory.set(touchPoint.id, filteredHistory);

    // Clean up old touch histories
    this.cleanupOldTouchHistories(cutoffTime);
  }

  private cleanupOldTouchHistories(cutoffTime: number): void {
    for (const [touchId, history] of this.touchHistory.entries()) {
      if (history.length === 0 || (history[history.length - 1]?.timestamp ?? 0) < cutoffTime) {
        this.touchHistory.delete(touchId);
      }
    }
  }

  private analyzeTouchSize(touchPoint: TouchPoint): Partial<TouchAnalysis> {
    // Estimate touch area based on pressure and device characteristics
    const baseArea = 20; // Base touch area in pixels
    const pressureMultiplier = Math.max(0.5, touchPoint.pressure * 2);
    const estimatedArea = baseArea * pressureMultiplier;

    const isPalmBySize = estimatedArea > this.config.palmSizeThreshold;
    const confidence = isPalmBySize ? 
      Math.min(1, (estimatedArea - this.config.palmSizeThreshold) / this.config.palmSizeThreshold) : 0;

    return {
      touchArea: estimatedArea,
      isPalm: isPalmBySize,
      confidence,
      reason: isPalmBySize ? 'Large touch area detected' : 'Normal touch size'
    };
  }

  private analyzeTouchPressure(touchPoint: TouchPoint): Partial<TouchAnalysis> {
    // Palm touches typically have lower pressure than intentional finger touches
    const isPalmByPressure = touchPoint.pressure < this.config.palmPressureThreshold;
    const confidence = isPalmByPressure ? 
      (this.config.palmPressureThreshold - touchPoint.pressure) / this.config.palmPressureThreshold : 0;

    return {
      isPalm: isPalmByPressure,
      confidence,
      reason: isPalmByPressure ? 'Low pressure palm touch' : 'Normal touch pressure'
    };
  }

  private analyzeEdgeProximity(touchPoint: TouchPoint): Partial<TouchAnalysis> {
    if (!this.canvasBounds) {
      return { isPalm: false, confidence: 0, reason: 'No canvas bounds', edgeDistance: 0 };
    }

    const { width, height } = this.canvasBounds;
    const edgeDistances = [
      touchPoint.x, // Left edge
      width - touchPoint.x, // Right edge
      touchPoint.y, // Top edge
      height - touchPoint.y // Bottom edge
    ];

    const minEdgeDistance = Math.min(...edgeDistances);
    const isPalmByEdge = minEdgeDistance < this.config.edgeMargin;
    const confidence = isPalmByEdge ? 
      (this.config.edgeMargin - minEdgeDistance) / this.config.edgeMargin : 0;

    return {
      isPalm: isPalmByEdge,
      confidence,
      reason: isPalmByEdge ? 'Touch too close to edge' : 'Touch away from edges',
      edgeDistance: minEdgeDistance
    };
  }

  private analyzeSimultaneousTouches(touchPoint: TouchPoint, allTouches: TouchPoint[]): Partial<TouchAnalysis> {
    const simultaneousTouches = allTouches.length;
    
    // Multiple simultaneous touches might indicate palm contact
    const isPalmByMultiTouch = simultaneousTouches > 2;
    const confidence = isPalmByMultiTouch ? 
      Math.min(1, (simultaneousTouches - 2) / 3) : 0;

    return {
      isPalm: isPalmByMultiTouch,
      confidence,
      reason: isPalmByMultiTouch ? 'Multiple simultaneous touches' : 'Single or dual touch',
      simultaneousTouches
    };
  }

  private analyzeTouchPattern(touchPoint: TouchPoint): Partial<TouchAnalysis> {
    const history = this.touchHistory.get(touchPoint.id) || [];
    
    if (history.length < 3) {
      return { isPalm: false, confidence: 0, reason: 'Insufficient touch history' };
    }

    // Analyze movement pattern
    const movements = this.calculateMovements(history);
    const avgMovement = movements.reduce((sum, mov) => sum + mov, 0) / movements.length;
    
    // Palm touches typically have less intentional movement
    const isPalmByPattern = avgMovement < 2; // Very small movements
    const confidence = isPalmByPattern ? 0.3 : 0; // Lower confidence for pattern analysis

    return {
      isPalm: isPalmByPattern,
      confidence,
      reason: isPalmByPattern ? 'Minimal movement pattern' : 'Active movement pattern'
    };
  }

  private analyzeSafeZoneViolation(touchPoint: TouchPoint): Partial<TouchAnalysis> {
    for (const zone of this.safeZones) {
      if (this.isPointInSafeZone(touchPoint, zone)) {
        const confidence = zone.priority / 3; // Scale priority to confidence
        return {
          isPalm: true,
          confidence,
          reason: `Touch in protected safe zone (priority ${zone.priority})`
        };
      }
    }

    return {
      isPalm: false,
      confidence: 0,
      reason: 'Touch outside safe zones'
    };
  }

  private isPointInSafeZone(touchPoint: TouchPoint, zone: SafeZone): boolean {
    return touchPoint.x >= zone.x && 
           touchPoint.x <= zone.x + zone.width &&
           touchPoint.y >= zone.y && 
           touchPoint.y <= zone.y + zone.height;
  }

  private calculateMovements(history: TouchPoint[]): number[] {
    const movements: number[] = [];
    
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      if (!prev || !curr) continue;
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      movements.push(distance);
    }
    
    return movements;
  }

  private combineAnalyses(analyses: Partial<TouchAnalysis>[]): TouchAnalysis {
    let totalConfidence = 0;
    let palmCount = 0;
    let reasons: string[] = [];
    let maxTouchArea = 0;
    let maxPressure = 0;
    let minEdgeDistance = Infinity;
    let maxSimultaneousTouches = 0;

    for (const analysis of analyses) {
      if (analysis.isPalm) {
        palmCount++;
        totalConfidence += analysis.confidence || 0;
      }
      
      if (analysis.reason) {
        reasons.push(analysis.reason);
      }
      
      maxTouchArea = Math.max(maxTouchArea, analysis.touchArea || 0);
      maxPressure = Math.max(maxPressure, analysis.pressure || 0);
      minEdgeDistance = Math.min(minEdgeDistance, analysis.edgeDistance || Infinity);
      maxSimultaneousTouches = Math.max(maxSimultaneousTouches, analysis.simultaneousTouches || 0);
    }

    const avgConfidence = palmCount > 0 ? totalConfidence / palmCount : 0;
    const isPalm = avgConfidence >= this.config.confidenceThreshold;

    return {
      isPalm,
      confidence: avgConfidence,
      reason: reasons.join('; '),
      touchArea: maxTouchArea,
      pressure: maxPressure,
      edgeDistance: minEdgeDistance === Infinity ? 0 : minEdgeDistance,
      simultaneousTouches: maxSimultaneousTouches
    };
  }
}

// Adaptive learning system for touch patterns
class TouchLearningData {
  private touchSamples: Array<{
    touchPoint: TouchPoint;
    analysis: TouchAnalysis;
    userCorrection?: boolean; // If user manually corrected the decision
    timestamp: number;
  }> = [];

  private maxSamples = 1000;

  recordTouchAnalysis(touchPoint: TouchPoint, analysis: TouchAnalysis, userCorrection?: boolean): void {
    this.touchSamples.push({
      touchPoint,
      analysis,
      userCorrection,
      timestamp: Date.now()
    });

    // Keep only recent samples
    if (this.touchSamples.length > this.maxSamples) {
      this.touchSamples = this.touchSamples.slice(-this.maxSamples);
    }
  }

  getStatistics(): any {
    if (this.touchSamples.length === 0) {
      return { totalSamples: 0 };
    }

    const palmTouches = this.touchSamples.filter(s => s.analysis.isPalm);
    const validTouches = this.touchSamples.filter(s => !s.analysis.isPalm);
    const correctedSamples = this.touchSamples.filter(s => s.userCorrection !== undefined);

    return {
      totalSamples: this.touchSamples.length,
      palmTouches: palmTouches.length,
      validTouches: validTouches.length,
      correctedSamples: correctedSamples.length,
      averagePalmConfidence: palmTouches.reduce((sum, s) => sum + s.analysis.confidence, 0) / palmTouches.length || 0,
      averageValidConfidence: validTouches.reduce((sum, s) => sum + (1 - s.analysis.confidence), 0) / validTouches.length || 0
    };
  }

  reset(): void {
    this.touchSamples = [];
  }
}

// Factory function to create palm rejection system
export function createPalmRejectionSystem(
  config: Partial<PalmRejectionConfig> = {},
  hapticConfig: Partial<HapticFeedbackConfig> = {}
): PalmRejectionSystem {
  const defaultConfig: PalmRejectionConfig = {
    enabled: true,
    palmSizeThreshold: 40, // pixels
    palmPressureThreshold: 0.3, // 0-1 scale
    edgeMargin: 30, // pixels from edge
    timeWindow: 500, // milliseconds
    confidenceThreshold: 0.6, // 0-1 scale
    adaptiveLearning: true
  };

  const defaultHapticConfig: HapticFeedbackConfig = {
    enabled: true,
    palmRejectionPattern: [50, 50, 50], // Short vibration pattern
    validTouchPattern: [10], // Very short confirmation
    boundaryWarningPattern: [100, 50, 100] // Warning pattern
  };

  return new PalmRejectionSystem(
    { ...defaultConfig, ...config },
    { ...defaultHapticConfig, ...hapticConfig }
  );
}

// Utility functions for boundary management
export class TouchBoundaryManager {
  private boundaries: SafeZone[] = [];
  private hapticConfig: HapticFeedbackConfig;

  constructor(hapticConfig: HapticFeedbackConfig) {
    this.hapticConfig = hapticConfig;
  }

  addBoundary(boundary: SafeZone): void {
    this.boundaries.push(boundary);
  }

  checkBoundaryViolation(touchPoint: TouchPoint): boolean {
    for (const boundary of this.boundaries) {
      if (this.isPointInBoundary(touchPoint, boundary)) {
        if (this.hapticConfig.enabled) {
          vibrate(this.hapticConfig.boundaryWarningPattern);
        }
        return true;
      }
    }
    return false;
  }

  private isPointInBoundary(touchPoint: TouchPoint, boundary: SafeZone): boolean {
    return touchPoint.x >= boundary.x && 
           touchPoint.x <= boundary.x + boundary.width &&
           touchPoint.y >= boundary.y && 
           touchPoint.y <= boundary.y + boundary.height;
  }
}

export { PalmRejectionSystem, TouchLearningData };