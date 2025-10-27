import { NextRequest } from 'next/server';
import { createErrorResponse, ERROR_CODES, handleError, createErrorResponseFromAPIError } from '@/lib/error-handler';
import { getDataManager } from '@/lib/data-adapters';

// API route for data synchronization
export async function POST(request: NextRequest) {
  try {
    // Initialize data manager if not already done
    const dataManager = getDataManager();
    if (!dataManager.isInitialized()) {
      await dataManager.initialize();
    }

    // Parse request body for sync options
    const body = await request.json().catch(() => ({}));
    const { action = 'sync' } = body;

    switch (action) {
      case 'sync':
        // Perform data synchronization
        const syncResult = await dataManager.syncData();
        
        return Response.json({
          success: syncResult.success,
          syncedRecords: syncResult.syncedRecords,
          errors: syncResult.errors,
          lastSyncTime: syncResult.lastSyncTime,
          currentAdapter: dataManager.getCurrentAdapterName(),
          adapterType: dataManager.getCurrentAdapterType()
        });

      case 'switch-to-local':
        // Switch to local adapter
        await dataManager.switchToLocal();
        
        return Response.json({
          success: true,
          message: 'Switched to local adapter',
          currentAdapter: dataManager.getCurrentAdapterName(),
          adapterType: dataManager.getCurrentAdapterType()
        });

      case 'switch-to-cloud':
        // Switch to cloud adapter
        await dataManager.switchToCloud();
        
        return Response.json({
          success: true,
          message: 'Switched to cloud adapter',
          currentAdapter: dataManager.getCurrentAdapterName(),
          adapterType: dataManager.getCurrentAdapterType()
        });

      case 'health-check':
        // Check health of all adapters
        const healthStatus = await dataManager.checkHealth();
        
        return Response.json({
          success: true,
          adapters: healthStatus,
          currentAdapter: dataManager.getCurrentAdapterName(),
          autoSwitchEnabled: dataManager.isAutoSwitchEnabled()
        });

      case 'toggle-auto-switch':
        // Toggle auto-switch functionality
        const { enabled } = body;
        if (typeof enabled !== 'boolean') {
          return createErrorResponse(
            ERROR_CODES.INVALID_REQUEST,
            'enabled field must be a boolean',
            { providedEnabled: enabled },
            400
          );
        }
        
        dataManager.enableAutoSwitch(enabled);
        
        return Response.json({
          success: true,
          message: `Auto-switch ${enabled ? 'enabled' : 'disabled'}`,
          autoSwitchEnabled: dataManager.isAutoSwitchEnabled()
        });

      default:
        return createErrorResponse(
          ERROR_CODES.INVALID_ACTION,
          'Invalid action. Supported actions: sync, switch-to-local, switch-to-cloud, health-check, toggle-auto-switch',
          { providedAction: action },
          400
        );
    }

  } catch (error) {
    console.error('Error in sync API:', error);
    const apiError = handleError(error, 'Data Sync');
    return createErrorResponseFromAPIError(apiError);
  }
}

// GET method for sync status
export async function GET(request: NextRequest) {
  try {
    // Initialize data manager if not already done
    const dataManager = getDataManager();
    if (!dataManager.isInitialized()) {
      await dataManager.initialize();
    }

    // Get current sync status
    const healthStatus = await dataManager.checkHealth();
    
    return Response.json({
      currentAdapter: dataManager.getCurrentAdapterName(),
      adapterType: dataManager.getCurrentAdapterType(),
      autoSwitchEnabled: dataManager.isAutoSwitchEnabled(),
      adapters: healthStatus,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error getting sync status:', error);
    const apiError = handleError(error, 'Sync Status');
    return createErrorResponseFromAPIError(apiError);
  }
}