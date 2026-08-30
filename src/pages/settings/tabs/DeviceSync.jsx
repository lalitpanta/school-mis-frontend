import React, { useState, useEffect } from 'react';
import deviceApi from '../../../api/deviceApi';

const DeviceSync = ({ devices, selectedDevice, onDeviceSelected, onRefresh }) => {
  const [syncLogs, setSyncLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (selectedDevice) {
      loadSyncLogs();
    }
  }, [selectedDevice, page]);

  const loadSyncLogs = async () => {
    if (!selectedDevice) return;
    setLoading(true);
    try {
      const response = await deviceApi.getSyncLogs(selectedDevice.id, page, 10);
      setSyncLogs(response.logs || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!selectedDevice) {
      setMessage({ type: 'error', text: 'Please select a device' });
      return;
    }
    setSyncing(true);
    setMessage(null);
    try {
      const result = await deviceApi.syncNow(selectedDevice.id);
      setMessage({
        type: 'success',
        text: `✅ Sync completed! Records saved: ${result.saved}, Skipped: ${result.skipped}`
      });
      loadSyncLogs();
      onRefresh();
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'success': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'partial': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[status] || colors.partial;
  };

  if (!selectedDevice) {
    return (
      <div className="text-center py-12 text-slate-600 dark:text-slate-400">
        <p className="text-lg">📭 Please select a device first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Device Selector */}
      <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Selected Device:
        </label>
        <select
          value={selectedDevice?.id || ''}
          onChange={(e) => {
            const device = devices.find(d => d.id === parseInt(e.target.value));
            onDeviceSelected(device);
            setPage(1);
          }}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
        >
          {devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.device_name} ({device.ip_address})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Last synced: {selectedDevice?.last_synced_at ? new Date(selectedDevice.last_synced_at).toLocaleString() : 'Never'}
        </p>
      </div>

      {/* Manual Sync Button */}
      <button
        onClick={handleManualSync}
        disabled={syncing || !selectedDevice}
        className="w-full px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-400 font-bold text-lg transition-all"
      >
        {syncing ? '⏳ Syncing...' : '🔄 Sync Now (Manual)'}
      </button>

      {/* Sync Status Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Auto Sync Interval</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{selectedDevice?.pull_interval_minutes || '-'} min</p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-600 dark:text-green-300">Connection</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {selectedDevice?.connection_status === 'online' ? '🟢 Online' : '🔴 Offline'}
          </p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Sync Method</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{selectedDevice?.connection_method || '-'}</p>
        </div>
      </div>

      {/* Sync Logs */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">📜 Sync History</h3>
        {loading ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <p>⏳ Loading sync logs...</p>
          </div>
        ) : syncLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <p>📭 No sync logs yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {syncLogs.map(log => (
              <div
                key={log.id}
                className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status.toUpperCase()}
                    </span>
                    <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                      {log.sync_type === 'auto' ? '🔄 Auto' : '👤 Manual'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Pulled</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{log.records_pulled}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Saved</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{log.records_saved}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Skipped</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{log.records_skipped}</p>
                  </div>
                </div>
                {log.error_message && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-700 dark:text-red-300 text-xs">
                    ⚠️ {log.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {syncLogs.length > 0 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-300 dark:bg-slate-600 rounded hover:bg-slate-400 disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="px-4 py-2 text-slate-700 dark:text-slate-300">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-slate-300 dark:bg-slate-600 rounded hover:bg-slate-400"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default DeviceSync;
