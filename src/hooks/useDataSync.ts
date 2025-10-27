import { useState, useEffect, useCallback } from 'react';

// 数据同步状态
interface SyncStatus {
  currentAdapter: string;
  adapterType: 'local' | 'cloud';
  autoSwitchEnabled: boolean;
  adapters: Record<string, {
    isHealthy: boolean;
    latency?: number;
    lastChecked: string;
    error?: string;
  }>;
  lastSyncTime?: string;
  isLoading: boolean;
  error?: string;
}

// 同步结果
interface SyncResult {
  success: boolean;
  syncedRecords: number;
  errors: string[];
  lastSyncTime: string;
  currentAdapter: string;
  adapterType: 'local' | 'cloud';
}

/**
 * 数据同步管理Hook
 */
export function useDataSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    currentAdapter: 'local',
    adapterType: 'local',
    autoSwitchEnabled: false,
    adapters: {},
    isLoading: false
  });

  // 获取同步状态
  const fetchSyncStatus = useCallback(async () => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      const response = await fetch('/api/sync');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setSyncStatus(prev => ({
        ...prev,
        currentAdapter: data.currentAdapter,
        adapterType: data.adapterType,
        autoSwitchEnabled: data.autoSwitchEnabled,
        adapters: data.adapters,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  // 执行数据同步
  const syncData = useCallback(async (): Promise<SyncResult | null> => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'sync' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setSyncStatus(prev => ({
        ...prev,
        currentAdapter: result.currentAdapter,
        adapterType: result.adapterType,
        lastSyncTime: result.lastSyncTime,
        isLoading: false
      }));
      
      return result;
    } catch (error) {
      console.error('Failed to sync data:', error);
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return null;
    }
  }, []);

  // 切换到本地适配器
  const switchToLocal = useCallback(async (): Promise<boolean> => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'switch-to-local' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setSyncStatus(prev => ({
        ...prev,
        currentAdapter: result.currentAdapter,
        adapterType: result.adapterType,
        isLoading: false
      }));
      
      return result.success;
    } catch (error) {
      console.error('Failed to switch to local:', error);
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, []);

  // 切换到云端适配器
  const switchToCloud = useCallback(async (): Promise<boolean> => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'switch-to-cloud' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setSyncStatus(prev => ({
        ...prev,
        currentAdapter: result.currentAdapter,
        adapterType: result.adapterType,
        isLoading: false
      }));
      
      return result.success;
    } catch (error) {
      console.error('Failed to switch to cloud:', error);
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, []);

  // 切换自动切换功能
  const toggleAutoSwitch = useCallback(async (enabled: boolean): Promise<boolean> => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'toggle-auto-switch', enabled })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setSyncStatus(prev => ({
        ...prev,
        autoSwitchEnabled: result.autoSwitchEnabled,
        isLoading: false
      }));
      
      return result.success;
    } catch (error) {
      console.error('Failed to toggle auto switch:', error);
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, []);

  // 检查适配器健康状态
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      setSyncStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'health-check' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setSyncStatus(prev => ({
        ...prev,
        adapters: result.adapters,
        currentAdapter: result.currentAdapter,
        autoSwitchEnabled: result.autoSwitchEnabled,
        isLoading: false
      }));
      
      return result.success;
    } catch (error) {
      console.error('Failed to check health:', error);
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, []);

  // 组件挂载时获取初始状态
  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  // 定期检查状态（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSyncStatus]);

  return {
    syncStatus,
    syncData,
    switchToLocal,
    switchToCloud,
    toggleAutoSwitch,
    checkHealth,
    refreshStatus: fetchSyncStatus
  };
}