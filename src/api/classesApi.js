import axiosInstance from './axiosInstance';

const API_BASE = '/v1/settings';

export const classesApi = {
  getClasses: () => axiosInstance.get(`${API_BASE}/classes`),
  getClass: (id) => axiosInstance.get(`${API_BASE}/classes/${id}`),
  createClass: (data) => axiosInstance.post(`${API_BASE}/classes`, data),
  updateClass: (id, data) => axiosInstance.put(`${API_BASE}/classes/${id}`, data),
  deleteClass: (id) => axiosInstance.delete(`${API_BASE}/classes/${id}`),
};

// Keep old exports for backward compatibility
export const getClasses = () => classesApi.getClasses();
export const createClass = (data) => classesApi.createClass(data);
export const getSections = () => axiosInstance.get(`${API_BASE}/sections`);
export const createSection = (data) => axiosInstance.post(`${API_BASE}/sections`, data);
