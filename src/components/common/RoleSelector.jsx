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
    return <div className="text-muted">Loading roles...</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-muted">Select Roles</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-selected">
        {roles.map((role) => {
          const isSelected = selectedRoles.includes(role.id);
          const isInactive = role.is_active === false;
          return (
            <label
              key={role.id}
              className={`flex items-center p-2 rounded ${
                isInactive && !isSelected
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-surface"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleRoleChange(role.id)}
                disabled={isInactive && !isSelected}
                className="w-4 h-4 text-accent rounded"
              />
              <span className="ml-2 flex-1 text-sm text-muted font-medium">
                {role.role_name}
              </span>
              {role.is_system && (
                <span className="text-xs bg-accent text-accent px-2 py-1 rounded">
                  System
                </span>
              )}
              {isInactive && (
                <span className="text-xs bg-danger-soft text-danger px-2 py-1 rounded">
                  Inactive
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};
