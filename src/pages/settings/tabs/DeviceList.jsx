import React, { useState } from 'react';
import deviceApi from '../../../api/deviceApi';

const DeviceList = ({ devices, selectedDevice, onDeviceSelected, onDeviceCreated, onRefresh }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    device_name: '',
    device_type: 'ZKTeco',
    ip_address: '',
    port: 5000,
    location: '',
    connection_method: 'pull',
    pull_interval_minutes: 5
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [testingDevice, setTestingDevice] = useState(null);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('port') || name.includes('interval') ? parseInt(value) : value
    }));
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await deviceApi.createDevice(formData);
      setMessage({ type: 'success', text: '✅ Device created successfully!' });
      setFormData({
        device_name: '',
        device_type: 'ZKTeco',
        ip_address: '',
        port: 5000,
        location: '',
        connection_method: 'pull',
        pull_interval_minutes: 5
      });
      setShowCreateForm(false);
      onDeviceCreated();
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (device) => {
    setTestingDevice(device.id);
    try {
      const result = await deviceApi.testConnection(device.id);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
      onRefresh();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setTestingDevice(null);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    try {
      await deviceApi.deleteDevice(deviceId);
      setMessage({ type: 'success', text: '✅ Device deleted successfully!' });
      onRefresh();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'online': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'offline': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'unreachable': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[status] || colors.unreachable;
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Create Device Form */}
      {showCreateForm && (
        <div className="bg-slate-50 dark:bg-slate-700 p-6 rounded-lg border border-slate-200 dark:border-slate-600">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">➕ Add New Device</h3>
          <form onSubmit={handleCreateDevice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="device_name"
              placeholder="Device Name (e.g., Main Entrance)"
              value={formData.device_name}
              onChange={handleFormChange}
              required
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
            />
            <select
              name="device_type"
              value={formData.device_type}
              onChange={handleFormChange}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
            >
              <option value="ZKTeco">ZKTeco</option>
              <option value="eSSL">eSSL</option>
              <option value="Suprema">Suprema</option>
            </select>
            <input
              type="text"
              name="ip_address"
              placeholder="IP Address (e.g., 192.168.1.100)"
              value={formData.ip_address}
              onChange={handleFormChange}
              required
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
            />
            <input
              type="number"
              name="port"
              placeholder="Port (default: 5000)"
              value={formData.port}
              onChange={handleFormChange}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
            />
            <input
              type="text"
              name="location"
              placeholder="Location (optional)"
              value={formData.location}
              onChange={handleFormChange}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
            />
            <select
              name="connection_method"
              value={formData.connection_method}
              onChange={handleFormChange}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
            >
              <option value="pull">Pull (Server pulls data)</option>
              <option value="push">Push (Device pushes data)</option>
              <option value="ADMS">ADMS (Cloud sync)</option>
            </select>
            <input
              type="number"
              name="pull_interval_minutes"
              placeholder="Sync interval (minutes)"
              value={formData.pull_interval_minutes}
              onChange={handleFormChange}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-400"
              >
                {loading ? '⏳ Creating...' : '✅ Create Device'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500"
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Device Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          ➕ Add New Device
        </button>
      )}

      {/* Device List */}
      <div className="grid grid-cols-1 gap-4">
        {devices.map(device => (
          <div
            key={device.id}
            onClick={() => onDeviceSelected(device)}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
              selectedDevice?.id === device.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">{device.device_name}</h4>
                <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <p>🖥️ Type: <span className="font-medium">{device.device_type}</span></p>
                  <p>🌐 IP: <span className="font-medium">{device.ip_address}:{device.port}</span></p>
                  <p>📍 Location: <span className="font-medium">{device.location || 'N/A'}</span></p>
                  <p>⚙️ Sync: Every {device.pull_interval_minutes} minutes</p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(device.connection_status)}`}>
                  {device.connection_status.toUpperCase()}
                </div>
                {device.last_synced_at && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Last sync: {new Date(device.last_synced_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTestConnection(device);
                }}
                disabled={testingDevice === device.id}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-slate-400"
              >
                {testingDevice === device.id ? '⏳ Testing...' : '🔗 Test Connection'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDevice(device.id);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {!devices.length && !showCreateForm && (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">
          <p className="text-lg">📭 No devices configured yet</p>
          <p className="text-sm">Click "Add New Device" to get started</p>
        </div>
      )}
    </div>
  );
};

export default DeviceList;
