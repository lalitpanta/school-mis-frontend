import React, { useState } from 'react';
import deviceApi from '../../../api/deviceApi';

const DeviceSettings = ({ devices, selectedDevice, onDeviceSelected, onRefresh }) => {
  const [formData, setFormData] = useState(selectedDevice || {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name.includes('port') || name.includes('interval') ? parseInt(value) : value)
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await deviceApi.updateDevice(formData.id, formData);
      setMessage({ type: 'success', text: '✅ Device settings updated successfully!' });
      onRefresh();
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
    } finally {
      setSaving(false);
    }
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
            setFormData(device);
          }}
          className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
        >
          {devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.device_name} ({device.ip_address})
            </option>
          ))}
        </select>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Basic Information */}
        <div className="p-6 bg-selected dark:bg-subtle rounded-lg border border-default dark:border-default">
          <h3 className="text-lg font-bold text-muted dark:text-primary mb-4">📋 Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted dark:text-muted mb-2">
                Device Name
              </label>
              <input
                type="text"
                name="device_name"
                value={formData.device_name || ''}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted dark:text-muted mb-2">
                Device Type
              </label>
              <select
                name="device_type"
                value={formData.device_type || 'ZKTeco'}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
              >
                <option value="ZKTeco">ZKTeco</option>
                <option value="eSSL">eSSL</option>
                <option value="Suprema">Suprema</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted dark:text-muted mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleFormChange}
                placeholder="e.g., Main Entrance"
                className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
              />
            </div>
          </div>
        </div>

        {/* Network Configuration */}
        <div className="p-6 bg-selected dark:bg-subtle rounded-lg border border-default dark:border-default">
          <h3 className="text-lg font-bold text-muted dark:text-primary mb-4">🌐 Network Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted dark:text-muted mb-2">
                IP Address
              </label>
              <input
                type="text"
                name="ip_address"
                value={formData.ip_address || ''}
                onChange={handleFormChange}
                placeholder="192.168.1.100"
                className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted dark:text-muted mb-2">
                Port
              </label>
              <input
                type="number"
                name="port"
                value={formData.port || 5000}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
              />
            </div>
          </div>
        </div>

        {/* Sync Configuration */}
        <div className="p-6 bg-selected dark:bg-subtle rounded-lg border border-default dark:border-default">
          <h3 className="text-lg font-bold text-muted dark:text-primary mb-4">⚙️ Sync Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted dark:text-muted mb-2">
                Connection Method
              </label>
              <select
                name="connection_method"
                value={formData.connection_method || 'pull'}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
              >
                <option value="pull">Pull (Server pulls data)</option>
                <option value="push">Push (Device pushes data)</option>
                <option value="ADMS">ADMS (Cloud sync)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted dark:text-muted mb-2">
                Auto Sync Interval (minutes)
              </label>
              <input
                type="number"
                name="pull_interval_minutes"
                value={formData.pull_interval_minutes || 5}
                onChange={handleFormChange}
                min="1"
                max="60"
                className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-accent dark:bg-accent-soft rounded border border-accent dark:border-accent">
            <p className="text-xs text-accent dark:text-accent">
              ℹ️ The device will automatically sync every {formData.pull_interval_minutes || 5} minutes.
            </p>
          </div>
        </div>

        {/* Status and Controls */}
        <div className="p-6 bg-selected dark:bg-subtle rounded-lg border border-default dark:border-default">
          <h3 className="text-lg font-bold text-muted dark:text-primary mb-4">🔧 Status & Controls</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface dark:bg-selected rounded border border-default dark:border-default">
              <div>
                <p className="font-medium text-muted dark:text-primary">Enable Device</p>
                <p className="text-xs text-muted dark:text-muted">Allow this device to sync data</p>
              </div>
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled !== false}
                onChange={handleFormChange}
                className="w-4 h-4 rounded"
              />
            </div>
            <div className="p-3 bg-surface dark:bg-selected rounded border border-default dark:border-default">
              <p className="font-medium text-muted dark:text-primary">Current Status</p>
              <p className={`text-sm mt-1 ${
                formData.connection_status === 'online'
                  ? 'text-success dark:text-success'
                  : formData.connection_status === 'offline'
                  ? 'text-warning dark:text-warning'
                  : 'text-danger dark:text-danger'
              }`}>
                {formData.connection_status ? formData.connection_status.toUpperCase() : 'UNKNOWN'}
              </p>
            </div>
          </div>
        </div>

        {/* Info and Instructions */}
        <div className="p-4 bg-accent dark:bg-accent-soft border border-accent dark:border-accent rounded-lg">
          <p className="text-sm text-accent dark:text-accent">
            <strong>📌 Important:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>IP address and port must be correct for the device to sync</li>
              <li>Sync interval determines how often the server pulls data (1-60 minutes)</li>
              <li>Late attendance is automatically marked for punches after 10:10 AM (Nepal time)</li>
              <li>Duplicate punches within 60 seconds are automatically filtered</li>
            </ul>
          </p>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full px-6 py-3 bg-accent text-primary rounded-lg hover:bg-accent disabled:bg-selected font-bold transition-all"
        >
          {saving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default DeviceSettings;
