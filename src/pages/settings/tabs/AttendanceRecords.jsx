import React, { useState, useEffect } from 'react';
import deviceApi from '../../../api/deviceApi';

const AttendanceRecords = ({ devices, selectedDevice, onDeviceSelected }) => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [overridingId, setOverridingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedDevice) {
      loadAttendanceRecords();
      loadAttendanceSummary();
    }
  }, [selectedDevice, page, statusFilter]);

  const loadAttendanceRecords = async () => {
    if (!selectedDevice) return;
    setLoading(true);
    try {
      const response = await deviceApi.getAttendanceRecords(
        selectedDevice.id,
        page,
        50,
        statusFilter
      );
      setRecords(response.records || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceSummary = async () => {
    if (!selectedDevice) return;
    try {
      const response = await deviceApi.getAttendanceSummary(selectedDevice.id, selectedDate);
      setSummary(response.summary || []);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleOverrideAttendance = async (recordId, newStatus) => {
    setOverridingId(recordId);
    try {
      await deviceApi.overrideAttendance(recordId, newStatus, `Manual override to ${newStatus}`);
      setMessage({ type: 'success', text: `✅ Attendance updated to ${newStatus}` });
      loadAttendanceRecords();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setOverridingId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'present': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'late': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'absent': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return colors[status] || colors.absent;
  };

  const getSummaryCount = (status) => {
    return summary?.find(s => s.attendance_status === status)?.count || 0;
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
      </div>

      {/* Date Picker */}
      <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          View Date:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            loadAttendanceSummary();
          }}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-600 dark:text-green-300">Present</p>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">{getSummaryCount('present')}</p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-300">Late</p>
            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{getSummaryCount('late')}</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-600 dark:text-red-300">Absent</p>
            <p className="text-3xl font-bold text-red-900 dark:text-red-100">{getSummaryCount('absent')}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter(null)}
          className={`px-4 py-2 rounded ${
            statusFilter === null
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
          }`}
        >
          All Records
        </button>
        {['present', 'late', 'absent'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded capitalize ${
              statusFilter === status
                ? 'bg-blue-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Attendance Records Table */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">📊 Attendance Records</h3>
        {loading ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <p>⏳ Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <p>📭 No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Punch Time</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Teacher</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Device ID</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Type</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900 dark:text-slate-100">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {new Date(record.punch_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">
                      {record.user_id ? `${record.user?.first_name} ${record.user?.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                      {record.device_user_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.attendance_status)}`}>
                        {record.attendance_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {record.marked_as === 'manual' ? '👤 Manual' : '🔄 Auto'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleOverrideAttendance(record.id, e.target.value);
                          }
                        }}
                        disabled={overridingId === record.id}
                        className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Mark as...</option>
                        <option value="present">✓ Present</option>
                        <option value="late">⏰ Late</option>
                        <option value="absent">✗ Absent</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {records.length > 0 && (
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

export default AttendanceRecords;
