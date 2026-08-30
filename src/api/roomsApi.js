import axiosInstance from './axiosInstance';

const API_BASE = '/v1/settings';

export const roomsApi = {
  getRooms: () => axiosInstance.get(`${API_BASE}/rooms`),
  getRoom: (id) => axiosInstance.get(`${API_BASE}/rooms/${id}`),
  createRoom: (data) => axiosInstance.post(`${API_BASE}/rooms`, data),
  updateRoom: (id, data) => axiosInstance.put(`${API_BASE}/rooms/${id}`, data),
  deleteRoom: (id) => axiosInstance.delete(`${API_BASE}/rooms/${id}`),
};
