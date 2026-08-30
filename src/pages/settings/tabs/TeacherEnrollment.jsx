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
      'enrolled': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[status] || colors.pending;
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

      {/* Enrollment Button */}
      <button
        onClick={handleEnrollTeachers}
        disabled={enrolling || !selectedDevice}
        className="w-full px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-slate-400 font-bold text-lg transition-all"
      >
        {enrolling ? '⏳ Enrolling teachers...' : '👥 Enroll All Teachers on Device'}
      </button>

      {/* Enrollment Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          ℹ️ <strong>How it works:</strong> Click the button above to push all teachers from this school to the device.
          Teachers with biometric data on the device will be matched automatically for attendance tracking.
        </p>
      </div>

      {/* Enrollments List */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          📋 Teacher Enrollments ({enrollments.length})
        </h3>
        {loading ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <p>⏳ Loading enrollments...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <p>📭 No teacher enrollments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Teacher</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Device ID</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Enrolled Date</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(enrollment => (
                  <tr
                    key={enrollment.id}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {enrollment.user?.first_name} {enrollment.user?.last_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                      {enrollment.device_user_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(enrollment.enrollment_status)}`}>
                        {enrollment.enrollment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
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
    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <h4 className="font-bold text-yellow-900 dark:text-yellow-200 mb-3">
        ⚠️ Unmatched Device IDs ({unmatched.length})
      </h4>
      <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
        These are device user IDs that haven't been matched to any teacher yet. They appear on attendance records
        but can't be linked to teachers for automatic attendance marking.
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {unmatched.map(item => (
          <div key={item.id} className="p-2 bg-white dark:bg-slate-700 rounded text-sm">
            <span className="font-mono text-yellow-700 dark:text-yellow-300">{item.device_user_id}</span>
            <span className="text-slate-600 dark:text-slate-400 text-xs ml-2">
              ({item.punch_count} punches)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherEnrollment;
