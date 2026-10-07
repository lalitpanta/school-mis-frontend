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
      'online': 'bg-success text-success dark:bg-success dark:text-success',
      'offline': 'bg-warning text-warning dark:bg-warning-soft dark:text-warning',
      'unreachable': 'bg-danger text-danger dark:bg-danger-soft dark:text-danger'
    };
    return colors[status] || colors.unreachable;
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-success dark:bg-success text-success dark:text-success' : 'bg-danger dark:bg-danger-soft text-danger dark:text-danger'}`}>
          {message.text}
        </div>
      )}

      {/* Create Device Form */}
      {showCreateForm && (
        <div className="bg-selected dark:bg-subtle p-6 rounded-lg border border-default dark:border-default">
          <h3 className="text-lg font-bold text-muted dark:text-primary mb-4">➕ Add New Device</h3>
          <form onSubmit={handleCreateDevice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="device_name"
              placeholder="Device Name (e.g., Main Entrance)"
              value={formData.device_name}
              onChange={handleFormChange}
              required
              className="px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
            />
            <select
              name="device_type"
              value={formData.device_type}
              onChange={handleFormChange}
              className="px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
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
              className="px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
            />
            <input
              type="number"
              name="port"
              placeholder="Port (default: 5000)"
              value={formData.port}
              onChange={handleFormChange}
              className="px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
            />
            <input
              type="text"
              name="location"
              placeholder="Location (optional)"
              value={formData.location}
              onChange={handleFormChange}
              className="px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
            />
            <select
              name="connection_method"
              value={formData.connection_method}
              onChange={handleFormChange}
              className="px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
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
              className="px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-accent text-primary rounded-lg hover:bg-accent disabled:bg-selected"
              >
                {loading ? '⏳ Creating...' : '✅ Create Device'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 bg-selected text-primary rounded-lg hover:bg-selected"
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
          className="px-6 py-3 bg-accent text-primary rounded-lg hover:bg-accent font-medium"
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
                ? 'border-accent bg-accent dark:bg-accent-soft'
                : 'border-default dark:border-default bg-surface dark:bg-subtle'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xl font-bold text-muted dark:text-primary">{device.device_name}</h4>
                <div className="mt-2 space-y-1 text-sm text-muted dark:text-muted">
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
                  <p className="text-xs text-muted dark:text-muted">
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
                className="px-4 py-2 bg-success text-primary rounded hover:bg-success disabled:bg-selected"
              >
                {testingDevice === device.id ? '⏳ Testing...' : '🔗 Test Connection'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDevice(device.id);
                }}
                className="px-4 py-2 bg-danger text-primary rounded hover:bg-danger"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {!devices.length && !showCreateForm && (
        <div className="text-center py-12 text-muted dark:text-muted">
          <p className="text-lg">📭 No devices configured yet</p>
          <p className="text-sm">Click "Add New Device" to get started</p>
        </div>
      )}
    </div>
  );
};

export default DeviceList;
