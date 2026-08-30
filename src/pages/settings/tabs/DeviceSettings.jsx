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
            setFormData(device);
          }}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
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
        <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">📋 Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Device Name
              </label>
              <input
                type="text"
                name="device_name"
                value={formData.device_name || ''}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Device Type
              </label>
              <select
                name="device_type"
                value={formData.device_type || 'ZKTeco'}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
              >
                <option value="ZKTeco">ZKTeco</option>
                <option value="eSSL">eSSL</option>
                <option value="Suprema">Suprema</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleFormChange}
                placeholder="e.g., Main Entrance"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Network Configuration */}
        <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">🌐 Network Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                IP Address
              </label>
              <input
                type="text"
                name="ip_address"
                value={formData.ip_address || ''}
                onChange={handleFormChange}
                placeholder="192.168.1.100"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Port
              </label>
              <input
                type="number"
                name="port"
                value={formData.port || 5000}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Sync Configuration */}
        <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">⚙️ Sync Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Connection Method
              </label>
              <select
                name="connection_method"
                value={formData.connection_method || 'pull'}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
              >
                <option value="pull">Pull (Server pulls data)</option>
                <option value="push">Push (Device pushes data)</option>
                <option value="ADMS">ADMS (Cloud sync)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Auto Sync Interval (minutes)
              </label>
              <input
                type="number"
                name="pull_interval_minutes"
                value={formData.pull_interval_minutes || 5}
                onChange={handleFormChange}
                min="1"
                max="60"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ℹ️ The device will automatically sync every {formData.pull_interval_minutes || 5} minutes.
            </p>
          </div>
        </div>

        {/* Status and Controls */}
        <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">🔧 Status & Controls</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-600 rounded border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Enable Device</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Allow this device to sync data</p>
              </div>
              <input
                type="checkbox"
                name="enabled"
                checked={formData.enabled !== false}
                onChange={handleFormChange}
                className="w-4 h-4 rounded"
              />
            </div>
            <div className="p-3 bg-white dark:bg-slate-600 rounded border border-slate-200 dark:border-slate-700">
              <p className="font-medium text-slate-900 dark:text-slate-100">Current Status</p>
              <p className={`text-sm mt-1 ${
                formData.connection_status === 'online'
                  ? 'text-green-600 dark:text-green-400'
                  : formData.connection_status === 'offline'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formData.connection_status ? formData.connection_status.toUpperCase() : 'UNKNOWN'}
              </p>
            </div>
          </div>
        </div>

        {/* Info and Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
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
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-400 font-bold transition-all"
        >
          {saving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default DeviceSettings;
