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
      'success': 'bg-success text-success dark:bg-success dark:text-success',
      'partial': 'bg-warning text-warning dark:bg-warning-soft dark:text-warning',
      'failed': 'bg-danger text-danger dark:bg-danger-soft dark:text-danger'
    };
    return colors[status] || colors.partial;
  };

  if (!selectedDevice) {
    return (
      <div className="text-center py-12 text-muted dark:text-muted">
        <p className="text-lg">📭 Please select a device first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-success dark:bg-success text-success dark:text-success' : 'bg-danger dark:bg-danger-soft text-danger dark:text-danger'}`}>
          {message.text}
        </div>
      )}

      {/* Device Selector */}
      <div className="p-4 bg-selected dark:bg-subtle rounded-lg">
        <label className="block text-sm font-medium text-muted dark:text-muted mb-2">
          Selected Device:
        </label>
        <select
          value={selectedDevice?.id || ''}
          onChange={(e) => {
            const device = devices.find(d => d.id === parseInt(e.target.value));
            onDeviceSelected(device);
            setPage(1);
          }}
          className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
        >
          {devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.device_name} ({device.ip_address})
            </option>
          ))}
        </select>
        <p className="text-xs text-muted dark:text-muted mt-2">
          Last synced: {selectedDevice?.last_synced_at ? new Date(selectedDevice.last_synced_at).toLocaleString() : 'Never'}
        </p>
      </div>

      {/* Manual Sync Button */}
      <button
        onClick={handleManualSync}
        disabled={syncing || !selectedDevice}
        className="w-full px-6 py-4 bg-accent text-primary rounded-lg hover:bg-accent disabled:bg-selected font-bold text-lg transition-all"
      >
        {syncing ? '⏳ Syncing...' : '🔄 Sync Now (Manual)'}
      </button>

      {/* Sync Status Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-accent dark:bg-accent-soft rounded-lg border border-accent dark:border-accent">
          <p className="text-sm font-medium text-accent dark:text-accent">Auto Sync Interval</p>
          <p className="text-2xl font-bold text-accent dark:text-accent">{selectedDevice?.pull_interval_minutes || '-'} min</p>
        </div>
        <div className="p-4 bg-success dark:bg-success rounded-lg border border-success dark:border-success">
          <p className="text-sm font-medium text-success dark:text-success">Connection</p>
          <p className="text-2xl font-bold text-success dark:text-success">
            {selectedDevice?.connection_status === 'online' ? '🟢 Online' : '🔴 Offline'}
          </p>
        </div>
        <div className="p-4 bg-accent dark:bg-accent-soft rounded-lg border border-accent dark:border-accent">
          <p className="text-sm font-medium text-accent dark:text-accent">Sync Method</p>
          <p className="text-2xl font-bold text-accent dark:text-accent">{selectedDevice?.connection_method || '-'}</p>
        </div>
      </div>

      {/* Sync Logs */}
      <div>
        <h3 className="text-lg font-bold text-muted dark:text-primary mb-4">📜 Sync History</h3>
        {loading ? (
          <div className="text-center py-8 text-muted dark:text-muted">
            <p>⏳ Loading sync logs...</p>
          </div>
        ) : syncLogs.length === 0 ? (
          <div className="text-center py-8 text-muted dark:text-muted">
            <p>📭 No sync logs yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {syncLogs.map(log => (
              <div
                key={log.id}
                className="p-4 bg-selected dark:bg-subtle rounded-lg border border-default dark:border-default"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status.toUpperCase()}
                    </span>
                    <span className="ml-2 text-sm text-muted dark:text-muted">
                      {log.sync_type === 'auto' ? '🔄 Auto' : '👤 Manual'}
                    </span>
                  </div>
                  <span className="text-xs text-muted dark:text-muted">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted dark:text-muted">Pulled</p>
                    <p className="font-bold text-muted dark:text-primary">{log.records_pulled}</p>
                  </div>
                  <div>
                    <p className="text-muted dark:text-muted">Saved</p>
                    <p className="font-bold text-muted dark:text-primary">{log.records_saved}</p>
                  </div>
                  <div>
                    <p className="text-muted dark:text-muted">Skipped</p>
                    <p className="font-bold text-muted dark:text-primary">{log.records_skipped}</p>
                  </div>
                </div>
                {log.error_message && (
                  <div className="mt-2 p-2 bg-danger dark:bg-danger-soft rounded text-danger dark:text-danger text-xs">
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
            className="px-4 py-2 bg-selected dark:bg-selected rounded hover:bg-selected disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="px-4 py-2 text-muted dark:text-muted">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-selected dark:bg-selected rounded hover:bg-selected"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default DeviceSync;
