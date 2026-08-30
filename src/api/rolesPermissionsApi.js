import axiosInstance from "./axiosInstance";

// **ROLES API**
export const rolesApi = {
  // Create a new role
  createRole: async (roleData) => {
    const response = await axiosInstance.post("/v1/roles", roleData);
    return response.data;
  },

  // Get all roles
  getAllRoles: async () => {
    const response = await axiosInstance.get("/v1/roles");
    return response.data;
  },

  // Get role by ID
  getRoleById: async (roleId) => {
    const response = await axiosInstance.get(`/v1/roles/${roleId}`);
    return response.data;
  },

  // Update a role
  updateRole: async (roleId, roleData) => {
    const response = await axiosInstance.put(`/v1/roles/${roleId}`, roleData);
    return response.data;
  },

  // Delete a role
  deleteRole: async (roleId) => {
    const response = await axiosInstance.delete(`/v1/roles/${roleId}`);
    return response.data;
  },

  // Add permissions to a role
  addPermissionsToRole: async (roleId, permissionIds) => {
    const response = await axiosInstance.post(`/v1/roles/${roleId}/permissions`, {
      permission_ids: permissionIds,
    });
    return response.data;
  },
};

// **PERMISSIONS API**
export const permissionsApi = {
  // Create a new permission
  createPermission: async (permissionData) => {
    const response = await axiosInstance.post("/v1/permissions", permissionData);
    return response.data;
  },

  // Get all permissions
  getAllPermissions: async () => {
    const response = await axiosInstance.get("/v1/permissions");
    return response.data;
  },

  // Get permissions grouped by resource
  getPermissionsByResource: async () => {
    const response = await axiosInstance.get("/v1/permissions/by-resource");
    return response.data;
  },

  // Get permission by ID
  getPermissionById: async (permissionId) => {
    const response = await axiosInstance.get(`/v1/permissions/${permissionId}`);
    return response.data;
  },

  // Update a permission
  updatePermission: async (permissionId, permissionData) => {
    const response = await axiosInstance.put(`/v1/permissions/${permissionId}`, permissionData);
    return response.data;
  },

  // Delete a permission
  deletePermission: async (permissionId) => {
    const response = await axiosInstance.delete(`/v1/permissions/${permissionId}`);
    return response.data;
  },
};

// **USER ROLES API**
export const userRolesApi = {
  // Get all users with their roles
  getAllUsersWithRoles: async () => {
    const response = await axiosInstance.get("/v1/users-with-roles");
    return response.data;
  },

  // Get user with assigned roles
  getUserWithRoles: async (userId) => {
    const response = await axiosInstance.get(`/v1/users-with-roles/${userId}`);
    return response.data;
  },

  // Assign roles to a user
  assignRolesToUser: async (userId, roleIds) => {
    const response = await axiosInstance.post(`/v1/users-with-roles/${userId}/roles`, {
      role_ids: roleIds,
    });
    return response.data;
  },

  // Remove a role from a user
  removeRoleFromUser: async (userId, roleId) => {
    const response = await axiosInstance.delete(`/v1/users-with-roles/${userId}/roles/${roleId}`);
    return response.data;
  },

  // Get user's permissions
  getUserPermissions: async (userId) => {
    const response = await axiosInstance.get(`/v1/users-with-roles/${userId}/permissions`);
    return response.data;
  },

  // Check if user has a specific permission
  checkPermission: async (userId, permissionKey) => {
    const response = await axiosInstance.post(`/v1/users-with-roles/${userId}/check-permission`, {
      permission_key: permissionKey,
    });
    return response.data;
  },
};
