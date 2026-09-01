import axiosInstance from './axiosInstance';

export const getAttendance = (params = {}) =>
  axiosInstance.get('/v1/attendance', { params });

export const getAttendanceSummary = (params = {}) =>
  axiosInstance.get('/v1/attendance/summary', { params });

export const markAttendance = (payload) =>
  axiosInstance.post('/v1/attendance', payload);

export const updateAttendance = (id, payload) =>
  axiosInstance.put(`/v1/attendance/${id}`, payload);

export const deleteAttendance = (id) =>
  axiosInstance.delete(`/v1/attendance/${id}`);

export const getAttendanceReport = (params = {}) =>
  axiosInstance.get('/v1/attendance/report', { params, responseType: 'blob' });

export const getAttendanceHistory = (params = {}) =>
  axiosInstance.get('/v1/attendance/history', { params });