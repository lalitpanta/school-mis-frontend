import axiosInstance from './axiosInstance';

export const getAccountsOverview = (params = {}) =>
  axiosInstance.get('/v1/accounts/overview', { params });

export const getTransactions = (params = {}) =>
  axiosInstance.get('/v1/accounts/transactions', { params });

export const createTransaction = (payload) =>
  axiosInstance.post('/v1/accounts/transactions', payload);

export const updateTransaction = (id, payload) =>
  axiosInstance.put(`/v1/accounts/transactions/${id}`, payload);

export const deleteTransaction = (id) =>
  axiosInstance.delete(`/v1/accounts/transactions/${id}`);

export const getExpenseCategories = () =>
  axiosInstance.get('/v1/accounts/expense-categories');

export const getExpenseBreakdown = (params = {}) =>
  axiosInstance.get('/v1/accounts/expense-breakdown', { params });

export const getCollectionByClass = (params = {}) =>
  axiosInstance.get('/v1/accounts/collection-by-class', { params });

export const getPayroll = (params = {}) =>
  axiosInstance.get('/v1/accounts/payroll', { params });

export const createPayroll = (payload) =>
  axiosInstance.post('/v1/accounts/payroll', payload);

export const updatePayrollStatus = (id, status) =>
  axiosInstance.patch(`/v1/accounts/payroll/${id}/status`, { status });

export const exportAccountsCsv = (params = {}) =>
  axiosInstance.get('/v1/accounts/export/csv', { params, responseType: 'blob' });