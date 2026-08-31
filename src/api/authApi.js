import axiosInstance from "./axiosInstance";

const AUTH_BASE = "/v1/auth";

/**
 * Admin Login
 */
export const adminLogin = async (email, password) => {
  try {
    const response = await axiosInstance.post(`${AUTH_BASE}/admin/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Tenant Login
 */
export const tenantLogin = async (tenantSlug, email, password) => {
  try {
    const response = await axiosInstance.post(`${AUTH_BASE}/tenant/login`, {
      tenantSlug,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Staff/User Login
 */
export const staffLogin = async (tenantSlug, email, password) => {
  try {
    const response = await axiosInstance.post(`${AUTH_BASE}/staff/login`, {
      tenantSlug,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Create New Tenant (Admin only)
 */
export const createNewTenant = async (
  name,
  email,
  password,
  databaseName,
  slug,
  modules,
  packageId,
  token,
) => {
  try {
    const response = await axiosInstance.post(
      `${AUTH_BASE}/tenant/create`,
      {
        name,
        email,
        password,
        databaseName,
        slug,
        modules,
        packageId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get All Tenants (Admin only)
 */
export const getAllTenants = async (token) => {
  try {
    const response = await axiosInstance.get(`${AUTH_BASE}/tenant/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Tenant by ID
 */
export const getTenantById = async (id, token) => {
  try {
    const response = await axiosInstance.get(`${AUTH_BASE}/tenant/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update Tenant Status (Admin only)
 */
export const updateTenantStatus = async (id, isActive, token) => {
  try {
    const response = await axiosInstance.patch(
      `${AUTH_BASE}/tenant/${id}/status`,
      { isActive },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTenant = async (id, updates, token) => {
  try {
    const response = await axiosInstance.patch(
      `${AUTH_BASE}/tenant/${id}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete Tenant (Admin only)
 */
export const deleteTenant = async (id, token) => {
  try {
    const response = await axiosInstance.delete(`${AUTH_BASE}/tenant/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Permanently Delete Tenant (Admin only) - Drops database
 */
export const permanentlyDeleteTenant = async (id, token) => {
  try {
    const response = await axiosInstance.delete(
      `${AUTH_BASE}/tenant/${id}/permanent`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const backupTenant = async (id, token) => {
  try {
    const response = await axiosInstance.get(`${AUTH_BASE}/tenant/${id}/backup`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "blob",
    });

    const contentDisposition = response.headers?.["content-disposition"] || "";
    const match = contentDisposition.match(/filename="?([^";]+)"?/i);
    const fileName = match?.[1] || `tenant-${id}-backup.json`;

    const blob = new Blob([response.data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Unified Login (Admin, Tenant, or Staff)
 */
export const unifiedLogin = async (email, password, tenantSlug = null) => {
  try {
    const response = await axiosInstance.post(`${AUTH_BASE}/login`, {
      email,
      password,
      tenantSlug,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Change Tenant Password
 */
export const changeTenantPassword = async (
  oldPassword,
  newPassword,
  confirmPassword,
) => {
  try {
    const response = await axiosInstance.post(
      `${AUTH_BASE}/tenant/change-password`,
      {
        oldPassword,
        newPassword,
        confirmPassword,
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Change Tenant Email
 */
export const changeTenantEmail = async (newEmail, password) => {
  try {
    const response = await axiosInstance.post(
      `${AUTH_BASE}/tenant/change-email`,
      {
        newEmail,
        password,
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Change Staff/User Password
 */
export const changeStaffPassword = async (
  oldPassword,
  newPassword,
  confirmPassword,
) => {
  try {
    const response = await axiosInstance.post(
      `${AUTH_BASE}/staff/change-password`,
      {
        oldPassword,
        newPassword,
        confirmPassword,
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Change Staff/User Email
 */
export const changeStaffEmail = async (newEmail, password) => {
  try {
    const response = await axiosInstance.post(
      `${AUTH_BASE}/staff/change-email`,
      {
        newEmail,
        password,
      },
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  adminLogin,
  tenantLogin,
  staffLogin,
  unifiedLogin,
  changeTenantPassword,
  changeTenantEmail,
  changeStaffPassword,
  changeStaffEmail,
  createNewTenant,
  getAllTenants,
  getTenantById,
  updateTenantStatus,
  deleteTenant,
  permanentlyDeleteTenant,
};
