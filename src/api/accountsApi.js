import axiosInstance from "./axiosInstance";

export const getAccountsOverview = (params = {}) =>
  axiosInstance.get("/v1/accounts/overview", { params });

export const getTransactions = (params = {}) =>
  axiosInstance.get("/v1/accounts/transactions", { params });

export const createTransaction = (payload) =>
  axiosInstance.post("/v1/accounts/transactions", payload);

export const updateTransaction = (id, payload) =>
  axiosInstance.put(`/v1/accounts/transactions/${id}`, payload);

export const deleteTransaction = (id) =>
  axiosInstance.delete(`/v1/accounts/transactions/${id}`);

export const getExpenseCategories = () =>
  axiosInstance.get("/v1/accounts/expense-categories");

export const getExpenseBreakdown = (params = {}) =>
  axiosInstance.get("/v1/accounts/expense-breakdown", { params });

export const getCollectionByClass = (params = {}) =>
  axiosInstance.get("/v1/accounts/collection-by-class", { params });

export const getPayroll = (params = {}) =>
  axiosInstance.get("/v1/accounts/payroll", { params });

export const createPayroll = (payload) =>
  axiosInstance.post("/v1/accounts/payroll", payload);

export const updatePayrollStatus = (id, status) =>
  axiosInstance.patch(`/v1/accounts/payroll/${id}/status`, { status });

export const exportAccountsCsv = (params = {}) =>
  axiosInstance.get("/v1/accounts/export/csv", {
    params,
    responseType: "blob",
  });

export const getAccountingAccounts = () =>
  axiosInstance.get("/v1/accounts/accounting/accounts");

export const createAccountingAccount = (payload) =>
  axiosInstance.post("/v1/accounts/accounting/accounts", payload);

export const updateAccountingAccount = (id, payload) =>
  axiosInstance.patch(`/v1/accounts/accounting/accounts/${id}`, payload);

export const postAccountingJournal = (payload) =>
  axiosInstance.post("/v1/accounts/accounting/journals", payload);

export const getTrialBalance = (params = {}) =>
  axiosInstance.get("/v1/accounts/accounting/trial-balance", { params });

export const getAccountingFiscalYears = () =>
  axiosInstance.get("/v1/accounts/accounting/fiscal-years");

export const createAccountingFiscalYear = (payload) =>
  axiosInstance.post("/v1/accounts/accounting/fiscal-years", payload);

export const closeAccountingFiscalYear = (id) =>
  axiosInstance.patch(`/v1/accounts/accounting/fiscal-years/${id}/close`);

export const getAccountingJournals = (params = {}) =>
  axiosInstance.get("/v1/accounts/accounting/journals", { params });

export const getAccountingJournal = (id) =>
  axiosInstance.get(`/v1/accounts/accounting/journals/${id}`);

export const getAccountingLedger = (params = {}) =>
  axiosInstance.get("/v1/accounts/accounting/ledger", { params });

export const getAccountingVouchers = (params = {}) =>
  axiosInstance.get("/v1/accounts/accounting/vouchers", { params });

export const createAccountingVoucher = (payload) =>
  axiosInstance.post("/v1/accounts/accounting/vouchers", payload);

export const postAccountingVoucher = (id) =>
  axiosInstance.post(`/v1/accounts/accounting/vouchers/${id}/post`);

export const getFinancialReport = (report, params = {}) =>
  axiosInstance.get(`/v1/accounts/accounting/reports/${report}`, { params });
