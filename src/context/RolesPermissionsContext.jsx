import React, { createContext, useState, useCallback } from "react";
import { rolesApi, permissionsApi, userRolesApi } from "../api/rolesPermissionsApi";

export const RolesPermissionsContext = createContext();

export const RolesPermissionsProvider = ({ children }) => {
  // State management
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionsByResource, setPermissionsByResource] = useState([]);
  const [usersWithRoles, setUsersWithRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // **ROLES OPERATIONS**
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rolesApi.getAllRoles();
      setRoles(response.data || []);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error fetching roles:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (roleData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await rolesApi.createRole(roleData);
      setRoles([...roles, response.data]);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error creating role:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roles]);

  const getRoleById = useCallback(async (roleId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await rolesApi.getRoleById(roleId);
      setSelectedRole(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error fetching role:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRole = useCallback(async (roleId, roleData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await rolesApi.updateRole(roleId, roleData);
      setRoles(roles.map(r => r.id === roleId ? response.data : r));
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error updating role:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roles]);

  const deleteRole = useCallback(async (roleId) => {
    try {
      setLoading(true);
      setError(null);
      await rolesApi.deleteRole(roleId);
      setRoles(roles.filter(r => r.id !== roleId));
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error deleting role:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [roles]);

  const addPermissionsToRole = useCallback(async (roleId, permissionIds) => {
    try {
      setLoading(true);
      setError(null);
      const response = await rolesApi.addPermissionsToRole(roleId, permissionIds);
      if (selectedRole?.id === roleId) {
        setSelectedRole(response.data);
      }
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error adding permissions to role:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  // **PERMISSIONS OPERATIONS**
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await permissionsApi.getAllPermissions();
      setPermissions(response.data || []);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error fetching permissions:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissionsByResource = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await permissionsApi.getPermissionsByResource();
      setPermissionsByResource(response.data || []);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error fetching permissions by resource:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPermission = useCallback(async (permissionData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await permissionsApi.createPermission(permissionData);
      setPermissions([...permissions, response.data]);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error creating permission:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [permissions]);

  // **USER ROLES OPERATIONS**
  const fetchUsersWithRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userRolesApi.getAllUsersWithRoles();
      setUsersWithRoles(response.data || []);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error fetching users with roles:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const assignRolesToUser = useCallback(async (userId, roleIds) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userRolesApi.assignRolesToUser(userId, roleIds);
      setUsersWithRoles(usersWithRoles.map(u => u.id === userId ? response.data : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(response.data);
      }
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error assigning roles to user:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [usersWithRoles, selectedUser]);

  const removeRoleFromUser = useCallback(async (userId, roleId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userRolesApi.removeRoleFromUser(userId, roleId);
      setUsersWithRoles(usersWithRoles.map(u => u.id === userId ? response.data : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(response.data);
      }
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error removing role from user:", errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [usersWithRoles, selectedUser]);

  const getUserPermissions = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userRolesApi.getUserPermissions(userId);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      console.error("Error fetching user permissions:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // State
    roles,
    permissions,
    permissionsByResource,
    usersWithRoles,
    selectedUser,
    selectedRole,
    loading,
    error,

    // Role operations
    fetchRoles,
    createRole,
    getRoleById,
    updateRole,
    deleteRole,
    addPermissionsToRole,

    // Permission operations
    fetchPermissions,
    fetchPermissionsByResource,
    createPermission,

    // User-role operations
    fetchUsersWithRoles,
    assignRolesToUser,
    removeRoleFromUser,
    getUserPermissions,

    // UI helpers
    setSelectedUser,
    setSelectedRole,
    clearError,
  };

  return (
    <RolesPermissionsContext.Provider value={value}>
      {children}
    </RolesPermissionsContext.Provider>
  );
};

// Custom hook
export const useRolesPermissions = () => {
  const context = React.useContext(RolesPermissionsContext);
  if (!context) {
    throw new Error("useRolesPermissions must be used within RolesPermissionsProvider");
  }
  return context;
};
