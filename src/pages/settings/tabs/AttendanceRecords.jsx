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
      'present': 'bg-success text-success dark:bg-success dark:text-success',
      'late': 'bg-warning text-warning dark:bg-warning-soft dark:text-warning',
      'absent': 'bg-danger text-danger dark:bg-danger-soft dark:text-danger'
    };
    return colors[status] || colors.absent;
  };

  const getSummaryCount = (status) => {
    return summary?.find(s => s.attendance_status === status)?.count || 0;
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
      </div>

      {/* Date Picker */}
      <div className="p-4 bg-selected dark:bg-subtle rounded-lg">
        <label className="block text-sm font-medium text-muted dark:text-muted mb-2">
          View Date:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            loadAttendanceSummary();
          }}
          className="w-full px-4 py-2 border border-default dark:border-default rounded-lg bg-surface dark:bg-selected text-muted dark:text-primary"
        />
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-success dark:bg-success rounded-lg border border-success dark:border-success">
            <p className="text-sm font-medium text-success dark:text-success">Present</p>
            <p className="text-3xl font-bold text-success dark:text-success">{getSummaryCount('present')}</p>
          </div>
          <div className="p-4 bg-warning dark:bg-warning-soft rounded-lg border border-warning dark:border-warning">
            <p className="text-sm font-medium text-warning dark:text-warning">Late</p>
            <p className="text-3xl font-bold text-warning dark:text-warning">{getSummaryCount('late')}</p>
          </div>
          <div className="p-4 bg-danger dark:bg-danger-soft rounded-lg border border-danger dark:border-danger">
            <p className="text-sm font-medium text-danger dark:text-danger">Absent</p>
            <p className="text-3xl font-bold text-danger dark:text-danger">{getSummaryCount('absent')}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter(null)}
          className={`px-4 py-2 rounded ${
            statusFilter === null
              ? 'bg-accent text-primary'
              : 'bg-selected dark:bg-subtle text-muted dark:text-primary'
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
                ? 'bg-accent text-primary'
                : 'bg-selected dark:bg-subtle text-muted dark:text-primary'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Attendance Records Table */}
      <div>
        <h3 className="text-lg font-bold text-muted dark:text-primary mb-4">📊 Attendance Records</h3>
        {loading ? (
          <div className="text-center py-8 text-muted dark:text-muted">
            <p>⏳ Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-muted dark:text-muted">
            <p>📭 No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default dark:border-default">
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Punch Time</th>
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Teacher</th>
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Device ID</th>
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Type</th>
                  <th className="px-4 py-3 text-left font-bold text-muted dark:text-primary">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr
                    key={record.id}
                    className="border-b border-default dark:border-default hover:bg-selected dark:hover:bg-subtle"
                  >
                    <td className="px-4 py-3 text-muted dark:text-primary">
                      {new Date(record.punch_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted dark:text-primary">
                      {record.user_id ? `${record.user?.first_name} ${record.user?.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted dark:text-muted font-mono">
                      {record.device_user_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.attendance_status)}`}>
                        {record.attendance_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted dark:text-muted">
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
                        className="text-xs px-2 py-1 border border-default dark:border-default rounded bg-surface dark:bg-subtle text-muted dark:text-primary"
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

export default AttendanceRecords;
