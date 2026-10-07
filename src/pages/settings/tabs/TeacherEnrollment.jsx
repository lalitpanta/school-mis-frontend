import React, { useState, useEffect } from 'react';
import deviceApi from '../../../api/deviceApi';

const TeacherEnrollment = ({ devices, selectedDevice, onDeviceSelected, onRefresh }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedDevice) {
      loadEnrollments();
    }
  }, [selectedDevice]);

  const loadEnrollments = async () => {
    if (!selectedDevice) return;
    setLoading(true);
    try {
      const response = await deviceApi.getEnrollments(selectedDevice.id);
      setEnrollments(response.enrollments || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollTeachers = async () => {
    if (!selectedDevice) {
      setMessage({ type: 'error', text: 'Please select a device' });
      return;
    }
    setEnrolling(true);
    setMessage(null);
    try {
      const result = await deviceApi.enrollTeachers(selectedDevice.id);
      setMessage({
        type: 'success',
        text: `✅ Successfully enrolled ${result.enrolled} teachers on device`
      });
      loadEnrollments();
      onRefresh();
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
    } finally {
      setEnrolling(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'enrolled': 'bg-success text-success dark:bg-success dark:text-success',
      'pending': 'bg-warning text-warning dark:bg-warning-soft dark:text-warning',
      'failed': 'bg-danger text-danger dark:bg-danger-soft dark:text-danger'
    };
    return colors[status] || colors.pending;
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

      {/* Enrollment Button */}
      <button
        onClick={handleEnrollTeachers}
        disabled={enrolling || !selectedDevice}
        className="w-full px-6 py-4 bg-success text-primary rounded-lg hover:bg-success disabled:bg-selected font-bold text-lg transition-all"
      >
        {enrolling ? '⏳ Enrolling teachers...' : '👥 Enroll All Teachers on Device'}
      </button>

      {/* Enrollment Info */}
      <div className="p-4 bg-accent dark:bg-accent-soft rounded-lg border border-accent dark:border-accent">
        <p className="text-sm text-accent dark:text-accent">
          ℹ️ <strong>How it works:</strong> Click the button above to push all teachers from this school to the device.
          Teachers with biometric data on the device will be matched automatically for attendance tracking.
        </p>
      </div>

      {/* Enrollments List */}
      <div>
        <h3 className="text-lg font-bold text-muted dark:text-primary mb-4">
          📋 Teacher Enrollments ({enrollments.length})
        </h3>
        {loading ? (
          <div className="text-center py-8 text-muted dark:text-muted">
            <p>⏳ Loading enrollments...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-8 text-muted dark:text-muted">
            <p>📭 No teacher enrollments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default dark:border-default">
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Teacher</th>
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Device ID</th>
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Enrolled Date</th>
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(enrollment => (
                  <tr
                    key={enrollment.id}
                    className="border-b border-default dark:border-default hover:bg-selected dark:hover:bg-subtle"
                  >
                    <td className="px-4 py-3 text-muted dark:text-primary">
                      {enrollment.user?.first_name} {enrollment.user?.last_name}
                    </td>
                    <td className="px-4 py-3 text-muted dark:text-muted font-mono">
                      {enrollment.device_user_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(enrollment.enrollment_status)}`}>
                        {enrollment.enrollment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted dark:text-muted">
                      {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted dark:text-muted">
                      {enrollment.last_sync_at ? new Date(enrollment.last_sync_at).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unmatched IDs Section */}
      <UnmatchedIds selectedDevice={selectedDevice} />
    </div>
  );
};

// Unmatched IDs sub-component
const UnmatchedIds = ({ selectedDevice }) => {
  const [unmatched, setUnmatched] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDevice) {
      loadUnmatchedIds();
    }
  }, [selectedDevice]);

  const loadUnmatchedIds = async () => {
    setLoading(true);
    try {
      const response = await deviceApi.getUnmatchedIds(selectedDevice.id);
      setUnmatched(response.unmatched || []);
    } catch (error) {
      console.error('Error loading unmatched IDs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!unmatched.length) return null;

  return (
    <div className="mt-6 p-4 bg-warning dark:bg-warning-soft border border-warning dark:border-warning rounded-lg">
      <h4 className="font-bold text-warning dark:text-warning mb-3">
        ⚠️ Unmatched Device IDs ({unmatched.length})
      </h4>
      <p className="text-sm text-warning dark:text-warning mb-3">
        These are device user IDs that haven't been matched to any teacher yet. They appear on attendance records
        but can't be linked to teachers for automatic attendance marking.
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {unmatched.map(item => (
          <div key={item.id} className="p-2 bg-surface dark:bg-subtle rounded text-sm">
            <span className="font-mono text-warning dark:text-warning">{item.device_user_id}</span>
            <span className="text-muted dark:text-muted text-xs ml-2">
              ({item.punch_count} punches)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherEnrollment;
