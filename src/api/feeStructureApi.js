import axiosInstance from "./axiosInstance";

const fees = "/v1/fees";

export const getFeeCategories = () => axiosInstance.get(`${fees}/categories`);
export const createFeeCategory = (payload) =>
  axiosInstance.post(`${fees}/categories`, payload);
export const getFeeGroups = () => axiosInstance.get(`${fees}/groups`);
export const createFeeGroup = (payload) =>
  axiosInstance.post(`${fees}/groups`, payload);
export const getFeeStructures = (params = {}) =>
  axiosInstance.get(`${fees}/structures`, { params });
export const getFeeStructure = (id) =>
  axiosInstance.get(`${fees}/structures/${id}`);
export const createManagedFeeStructure = (payload) =>
  axiosInstance.post(`${fees}/managed-structures`, payload);
export const updateManagedFeeStructure = (id, payload) =>
  axiosInstance.put(`${fees}/managed-structures/${id}`, payload);
export const updateFeeStructureStatus = (id, status) =>
  axiosInstance.patch(`${fees}/managed-structures/${id}/status`, { status });
export const duplicateFeeStructure = (id) =>
  axiosInstance.post(`${fees}/managed-structures/${id}/duplicate`);
export const assignFeeStructure = (payload) =>
  axiosInstance.post(`${fees}/assignments`, payload);
export const getFeeInvoices = () => axiosInstance.get(`${fees}/invoices`);
export const getFeeInvoice = (id) =>
  axiosInstance.get(`${fees}/invoices/${id}`);
export const createFeeInvoice = (payload) =>
  axiosInstance.post(`${fees}/invoices`, payload);
export const recordFeePayment = (id, payload) =>
  axiosInstance.post(`${fees}/invoices/${id}/payments`, payload);
export const getFeeAudit = (entityId) =>
  axiosInstance.get(`${fees}/audit`, {
    params: entityId ? { entity_id: entityId } : {},
  });
