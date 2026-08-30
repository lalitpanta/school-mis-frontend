import axiosInstance from './axiosInstance';

export const getDepartments = () => axiosInstance.get('/v1/departments');
export const createDepartment = (data) => axiosInstance.post('/v1/departments', data);
export const updateDepartment = (id, data) => axiosInstance.put(`/v1/departments/${id}`, data);
export const deleteDepartment = (id) => axiosInstance.delete(`/v1/departments/${id}`);
