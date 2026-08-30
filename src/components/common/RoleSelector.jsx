import React, { useState, useEffect } from "react";
import { useRolesPermissions } from "../../context/RolesPermissionsContext";

export const RoleSelector = ({ selectedRoles = [], onChange }) => {
  const { roles, fetchRoles } = useRolesPermissions();

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleRoleChange = (roleId) => {
    const newSelected = selectedRoles.includes(roleId)
      ? selectedRoles.filter(id => id !== roleId)
      : [...selectedRoles, roleId];
    onChange(newSelected);
  };

  if (!roles || roles.length === 0) {
    return <div className="text-gray-500">Loading roles...</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">Select Roles</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
        {roles.map((role) => (
          <label key={role.id} className="flex items-center cursor-pointer p-2 hover:bg-white rounded">
            <input
              type="checkbox"
              checked={selectedRoles.includes(role.id)}
              onChange={() => handleRoleChange(role.id)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="ml-2 flex-1 text-sm text-gray-700 font-medium">
              {role.role_name}
            </span>
            {role.is_system && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                System
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};
