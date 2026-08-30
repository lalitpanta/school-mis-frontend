import axiosInstance from './axiosInstance';

const API_BASE = '/v1/settings';

export const sectionsApi = {
  getSections: () => axiosInstance.get(`${API_BASE}/sections`),
  getSection: (id) => axiosInstance.get(`${API_BASE}/sections/${id}`),
  getSectionsByRoom: (roomId) => axiosInstance.get(`${API_BASE}/sections/by-room/${roomId}`),
  getSectionsByClass: (classId) => axiosInstance.get(`${API_BASE}/sections/by-class/${classId}`),
  createSection: (data) => axiosInstance.post(`${API_BASE}/sections`, data),
  updateSection: (id, data) => axiosInstance.put(`${API_BASE}/sections/${id}`, data),
  deleteSection: (id) => axiosInstance.delete(`${API_BASE}/sections/${id}`),
};

// Standalone named exports for backward compatibility with dynamic imports
export const getSectionsByClass = (classId) => sectionsApi.getSectionsByClass(classId);
export const getSections = () => sectionsApi.getSections();
export const getSection = (id) => sectionsApi.getSection(id);
export const getSectionsByRoom = (roomId) => sectionsApi.getSectionsByRoom(roomId);
export const createSection = (data) => sectionsApi.createSection(data);
export const updateSection = (id, data) => sectionsApi.updateSection(id, data);
export const deleteSection = (id) => sectionsApi.deleteSection(id);
