import axiosInstance from './axiosInstance';

const API_BASE = '/v1/devices';

export const deviceApi = {
  // Device CRUD
  createDevice: async (data) => {
    const response = await axiosInstance.post(API_BASE, data);
    return response.data;
  },

  listDevices: async () => {
    const response = await axiosInstance.get(API_BASE);
    return response.data;
  },

  getDevice: async (deviceId) => {
    const response = await axiosInstance.get(`${API_BASE}/${deviceId}`);
    return response.data;
  },

  updateDevice: async (deviceId, data) => {
    const response = await axiosInstance.patch(`${API_BASE}/${deviceId}`, data);
    return response.data;
  },

  deleteDevice: async (deviceId) => {
    const response = await axiosInstance.delete(`${API_BASE}/${deviceId}`);
    return response.data;
  },

  // Device connection testing
  testConnection: async (deviceId) => {
    const response = await axiosInstance.post(`${API_BASE}/${deviceId}/test-connection`);
    return response.data;
  },

  // Sync operations
  syncNow: async (deviceId) => {
    const response = await axiosInstance.post(`${API_BASE}/${deviceId}/sync-now`);
    return response.data;
  },

  getSyncLogs: async (deviceId, page = 1, limit = 10) => {
    const response = await axiosInstance.get(`${API_BASE}/${deviceId}/sync-logs`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Teacher enrollment
  enrollTeachers: async (deviceId) => {
    const response = await axiosInstance.post(`${API_BASE}/${deviceId}/enroll-teachers`);
    return response.data;
  },

  getEnrollments: async (deviceId) => {
    const response = await axiosInstance.get(`${API_BASE}/${deviceId}/enrollments`);
    return response.data;
  },

  // Unmatched IDs
  getUnmatchedIds: async (deviceId) => {
    const response = await axiosInstance.get(`${API_BASE}/${deviceId}/unmatched-ids`);
    return response.data;
  },

  // Attendance records
  getAttendanceRecords: async (deviceId, page = 1, limit = 50, status = null) => {
    const response = await axiosInstance.get(`${API_BASE}/${deviceId}/attendance-records`, {
      params: { page, limit, ...(status && { status }) }
    });
    return response.data;
  },

  getAttendanceSummary: async (deviceId, date = null) => {
    const response = await axiosInstance.get(`${API_BASE}/${deviceId}/attendance-summary`, {
      params: { ...(date && { date }) }
    });
    return response.data;
  },

  overrideAttendance: async (recordId, status, note = '') => {
    const response = await axiosInstance.patch(`${API_BASE}/attendance/${recordId}/override`, {
      status,
      note
    });
    return response.data;
  }
};

export default deviceApi;
