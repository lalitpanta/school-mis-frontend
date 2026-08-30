import axiosInstance from "./axiosInstance";

/**
 * User Management API
 */
export const usersApi = {
  // Create a new user with roles
  createUser: async (userData) => {
    const response = await axiosInstance.post("/v1/users", userData);
    return response.data;
  },

  // Get all users
  getAllUsers: async () => {
    const response = await axiosInstance.get("/v1/users");
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await axiosInstance.get(`/v1/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await axiosInstance.patch(`/v1/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/v1/users/${userId}`);
    return response.data;
  },

  // Toggle user active status
  toggleUserActive: async (userId, isActive) => {
    const response = await axiosInstance.put(`/v1/users/${userId}/toggle-active`, {
      isActive,
    });
    return response.data;
  },

  // Change password
  changePassword: async (userId, oldPassword, newPassword) => {
    const response = await axiosInstance.post(`/v1/users/${userId}/change-password`, {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Reset password (admin)
  resetPassword: async (userId, newPassword) => {
    const response = await axiosInstance.post(`/v1/users/${userId}/reset-password`, {
      newPassword,
    });
    return response.data;
  },

  // Assign roles to user
  assignRolesToUser: async (userId, roleIds) => {
    const response = await axiosInstance.post(`/v1/users/${userId}/roles`, {
      role_ids: roleIds,
    });
    return response.data;
  },
};
