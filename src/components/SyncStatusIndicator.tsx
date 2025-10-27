'use client';

import { useState, useEffect } from 'react';
import { syncService, SyncStatus } from '@/lib/sync-service';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function SyncStatusIndicator({ 
  className = '', 
  showDetails = false 
}: SyncStatusIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // 获取初始状态
    setSyncStatus(syncService.getSyncStatus());

    // 定期更新状态
    const interval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!syncStatus) {
    return null;
  }

  const getStatusIcon = () => {
    if (!syncStatus.isActive) {
      return (
        <div className="w-3 h-3 rounded-full bg-gray-400" title="同步未启用" />
      );
    }

    if (syncStatus.error) {
      return (
        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" title="同步错误" />
      );
    }

    if (syncStatus.pendingOperations > 0) {
      return (
        <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" title="同步中" />
      );
    }

    if (syncStatus.conflicts.length > 0) {
      return (
        <div className="w-3 h-3 rounded-full bg-orange-500" title="有冲突需要解决" />
      );
    }

    return (
      <div className="w-3 h-3 rounded-full bg-green-500" title="同步正常" />
    );
  };

  const getStatusText = () => {
    if (!syncStatus.isActive) return '离线';
    if (syncStatus.error) return '错误';
    if (syncStatus.pendingOperations > 0) return '同步中';
    if (syncStatus.conflicts.length > 0) return '有冲突';
    return '已同步';
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return '从未同步';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const handleManualSync = async () => {
    try {
      await syncService.triggerSync();
      setShowDropdown(false);
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleResolveConflicts = () => {
    // TODO: 打开冲突解决对话框
    console.log('Open conflict resolution dialog');
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {getStatusIcon()}
        {showDetails && (
          <span className="text-sm text-gray-600">{getStatusText()}</span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-800">数据同步状态</div>
          </div>
          
          <div className="px-3 py-2 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">状态:</span>
              <span className={`font-medium ${
                syncStatus.isActive 
                  ? syncStatus.error 
                    ? 'text-red-600' 
                    : 'text-green-600'
                  : 'text-gray-600'
              }`}>
                {getStatusText()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">上次同步:</span>
              <span className="text-gray-800">
                {formatLastSync(syncStatus.lastSyncTime)}
              </span>
            </div>
            
            {syncStatus.pendingOperations > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">待同步:</span>
                <span className="text-yellow-600 font-medium">
                  {syncStatus.pendingOperations} 项
                </span>
              </div>
            )}
            
            {syncStatus.conflicts.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">冲突:</span>
                <span className="text-orange-600 font-medium">
                  {syncStatus.conflicts.length} 项
                </span>
              </div>
            )}
            
            {syncStatus.error && (
              <div className="text-red-600 text-xs mt-2 p-2 bg-red-50 rounded">
                {syncStatus.error}
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-100 mt-2">
            <button
              onClick={handleManualSync}
              disabled={!syncStatus.isActive}
              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              手动同步
            </button>
            
            {syncStatus.conflicts.length > 0 && (
              <button
                onClick={handleResolveConflicts}
                className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
              >
                解决冲突 ({syncStatus.conflicts.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}