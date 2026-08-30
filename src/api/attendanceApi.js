import axiosInstance from './axiosInstance';

/**
 * Get attendance records with optional filters
 * @param {Object} params - { classId, date, month, year, studentId, status }
 */
export const getAttendance = (params = {}) =>
  axiosInstance.get('/attendance', { params });

/**
 * Get attendance summary for a class or student
 */
export const getAttendanceSummary = (params = {}) =>
  axiosInstance.get('/attendance/summary', { params });

/**
 * Mark attendance for a list of students
 * @param {Object} payload - { classId, date, records: [{ studentId, status }] }
 */
export const markAttendance = (payload) =>
  axiosInstance.post('/attendance', payload);

/**
 * Update a single attendance record
 */
export const updateAttendance = (id, payload) =>
  axiosInstance.put(`/attendance/${id}`, payload);

/**
 * Delete an attendance record
 */
export const deleteAttendance = (id) =>
  axiosInstance.delete(`/attendance/${id}`);

/**
 * Get attendance report for export
 */
export const getAttendanceReport = (params = {}) =>
  axiosInstance.get('/attendance/report', { params, responseType: 'blob' });

export const getAttendanceHistory = (params = {}) =>
  axiosInstance.get('/attendance/history', { params });
