// 导出所有数据适配器相关的类型和实现

export * from './types';
export { LocalDataAdapter } from './local-adapter';
export { SupabaseDataAdapter } from './supabase-adapter';
export { DataRouterImpl, DataRouterProxy } from './data-router';
export { DataManager, initializeDataManager, getDataManager } from './data-manager';

// 适配器工厂函数
import { DataAdapter, AdapterConfig } from './types';
import { LocalDataAdapter } from './local-adapter';
import { SupabaseDataAdapter } from './supabase-adapter';

/**
 * 创建数据适配器实例
 */
export function createAdapter(config: AdapterConfig): DataAdapter {
  switch (config.type) {
    case 'local':
      return new LocalDataAdapter();
    case 'cloud':
      if (config.name === 'supabase') {
        return new SupabaseDataAdapter();
      }
      throw new Error(`Unknown cloud adapter: ${config.name}`);
    default:
      throw new Error(`Unknown adapter type: ${config.type}`);
  }
}

/**
 * 获取默认适配器配置
 */
export function getDefaultAdapterConfigs(): AdapterConfig[] {
  return [
    {
      name: 'local',
      type: 'local',
      priority: 2,
      enabled: true
    },
    {
      name: 'supabase',
      type: 'cloud',
      priority: 1,
      enabled: true
    }
  ];
}