'use client';

import { useState } from 'react';
import { useDataSync } from '@/hooks/useDataSync';

interface DataSyncStatusProps {
  showControls?: boolean;
  compact?: boolean;
}

export default function DataSyncStatus({ showControls = false, compact = false }: DataSyncStatusProps) {
  const { 
    syncStatus, 
    syncData, 
    switchToLocal, 
    switchToCloud, 
    toggleAutoSwitch, 
    checkHealth,
    refreshStatus 
  } = useDataSync();
  
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSync = async () => {
    const result = await syncData();
    if (result) {
      console.log('Sync completed:', result);
    }
  };

  const handleSwitchToLocal = async () => {
    const success = await switchToLocal();
    if (success) {
      console.log('Switched to local adapter');
    }
  };

  const handleSwitchToCloud = async () => {
    const success = await switchToCloud();
    if (success) {
      console.log('Switched to cloud adapter');
    }
  };

  const handleToggleAutoSwitch = async () => {
    const success = await toggleAutoSwitch(!syncStatus.autoSwitchEnabled);
    if (success) {
      console.log(`Auto-switch ${!syncStatus.autoSwitchEnabled ? 'enabled' : 'disabled'}`);
    }
  };

  const getAdapterStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getAdapterIcon = (type: 'local' | 'cloud') => {
    return type === 'cloud' ? '☁️' : '💾';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className={`flex items-center space-x-1 ${getAdapterStatusColor(
          syncStatus.adapters[syncStatus.currentAdapter]?.isHealthy ?? false
        )}`}>
          <span>{getAdapterIcon(syncStatus.adapterType)}</span>
          <span>{syncStatus.currentAdapter}</span>
        </span>
        
        {syncStatus.isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        )}
        
        {showControls && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            {isExpanded ? '收起' : '设置'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">数据同步状态</h3>
        <button
          onClick={refreshStatus}
          disabled={syncStatus.isLoading}
          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {syncStatus.isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : (
            '🔄'
          )}
        </button>
      </div>

      {/* 当前适配器状态 */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-gray-700">当前数据源:</span>
          <span className={`flex items-center space-x-1 ${getAdapterStatusColor(
            syncStatus.adapters[syncStatus.currentAdapter]?.isHealthy ?? false
          )}`}>
            <span>{getAdapterIcon(syncStatus.adapterType)}</span>
            <span className="font-medium">{syncStatus.currentAdapter}</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>自动切换: {syncStatus.autoSwitchEnabled ? '✅ 已启用' : '❌ 已禁用'}</span>
          {syncStatus.lastSyncTime && (
            <span>上次同步: {new Date(syncStatus.lastSyncTime).toLocaleString()}</span>
          )}
        </div>
      </div>

      {/* 适配器健康状态 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">适配器状态</h4>
        <div className="space-y-2">
          {Object.entries(syncStatus.adapters).map(([name, status]) => (
            <div key={name} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span>{getAdapterIcon(name === 'local' ? 'local' : 'cloud')}</span>
                <span>{name}</span>
                <span className={getAdapterStatusColor(status.isHealthy)}>
                  {status.isHealthy ? '✅' : '❌'}
                </span>
              </div>
              <div className="text-gray-500">
                {status.latency && `${status.latency}ms`}
                {status.error && (
                  <span className="text-red-600 ml-2" title={status.error}>
                    ⚠️
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 错误信息 */}
      {syncStatus.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{syncStatus.error}</p>
        </div>
      )}

      {/* 控制按钮 */}
      {showControls && (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={handleSync}
              disabled={syncStatus.isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              立即同步
            </button>
            
            <button
              onClick={checkHealth}
              disabled={syncStatus.isLoading}
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
            >
              健康检查
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSwitchToLocal}
              disabled={syncStatus.isLoading || syncStatus.currentAdapter === 'local'}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              切换到本地
            </button>
            
            <button
              onClick={handleSwitchToCloud}
              disabled={syncStatus.isLoading || syncStatus.adapterType === 'cloud'}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
            >
              切换到云端
            </button>
          </div>
          
          <button
            onClick={handleToggleAutoSwitch}
            disabled={syncStatus.isLoading}
            className={`w-full px-3 py-2 rounded-md text-sm ${
              syncStatus.autoSwitchEnabled
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {syncStatus.autoSwitchEnabled ? '禁用自动切换' : '启用自动切换'}
          </button>
        </div>
      )}
      
      {/* 展开的控制面板 */}
      {isExpanded && compact && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="space-y-2">
            <button
              onClick={handleSync}
              disabled={syncStatus.isLoading}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              立即同步
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSwitchToLocal}
                disabled={syncStatus.isLoading || syncStatus.currentAdapter === 'local'}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                本地
              </button>
              
              <button
                onClick={handleSwitchToCloud}
                disabled={syncStatus.isLoading || syncStatus.adapterType === 'cloud'}
                className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                云端
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}