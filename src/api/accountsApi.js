import axiosInstance from './axiosInstance';

// ── Overview ──────────────────────────────────────────────────────────────────
export const getAccountsOverview = (params = {}) =>
  axiosInstance.get('/accounts/overview', { params });

// ── Transactions ──────────────────────────────────────────────────────────────
export const getTransactions = (params = {}) =>
  axiosInstance.get('/accounts/transactions', { params });

export const createTransaction = (payload) =>
  axiosInstance.post('/accounts/transactions', payload);

export const updateTransaction = (id, payload) =>
  axiosInstance.put(`/accounts/transactions/${id}`, payload);

export const deleteTransaction = (id) =>
  axiosInstance.delete(`/accounts/transactions/${id}`);

// ── Expense breakdown ─────────────────────────────────────────────────────────
export const getExpenseCategories = () =>
  axiosInstance.get('/accounts/expense-categories');

export const getExpenseBreakdown = (params = {}) =>
  axiosInstance.get('/accounts/expense-breakdown', { params });

// ── Fee collection by class ───────────────────────────────────────────────────
export const getCollectionByClass = (params = {}) =>
  axiosInstance.get('/accounts/collection-by-class', { params });

// ── Payroll ───────────────────────────────────────────────────────────────────
export const getPayroll = (params = {}) =>
  axiosInstance.get('/accounts/payroll', { params });

export const createPayroll = (payload) =>
  axiosInstance.post('/accounts/payroll', payload);

export const updatePayrollStatus = (id, status) =>
  axiosInstance.patch(`/accounts/payroll/${id}/status`, { status });

// ── Export ────────────────────────────────────────────────────────────────────
export const exportAccountsCsv = (params = {}) =>
  axiosInstance.get('/accounts/export/csv', { params, responseType: 'blob' });
