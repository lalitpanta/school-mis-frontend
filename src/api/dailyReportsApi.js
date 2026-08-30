import api from './axiosInstance';

export const getTemplates = () => api.get('/v1/daily-reports/templates');
export const createTemplate = (data) => api.post('/v1/daily-reports/templates', data);
export const updateTemplate = (id, data) => api.patch(`/v1/daily-reports/templates/${id}`, data);
export const deleteTemplate = (id) => api.delete(`/v1/daily-reports/templates/${id}`);

export const createReport = (data) => api.post('/v1/daily-reports', data);
export const listReports = (params) => api.get('/v1/daily-reports', { params });
export const bulkSendReports = (data) => api.post('/v1/daily-reports/bulk-send', data);
export const deleteReport = (id) => api.delete(`/v1/daily-reports/${id}`);

export default {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createReport,
  listReports,
  bulkSendReports,
  deleteReport,
};
