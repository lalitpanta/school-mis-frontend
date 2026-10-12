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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-primary">Select Roles</h3>
        <span className="text-xs font-medium text-muted">
          {selectedRoles.length} selected
        </span>
      </div>
      <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-default bg-subtle p-3 sm:grid-cols-2">
        {roles.map((role) => {
          const isSelected = selectedRoles.includes(role.id);
          const isInactive = role.is_active === false;
          return (
            <label
              key={role.id}
              className={`grid min-h-10 grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2.5 py-2 transition-colors ${
                isInactive && !isSelected
                  ? "cursor-not-allowed border-default bg-selected opacity-60"
                  : isSelected
                    ? "cursor-pointer border-accent bg-selected"
                    : "cursor-pointer border-default bg-surface hover:border-accent hover:bg-selected"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleRoleChange(role.id)}
                disabled={isInactive && !isSelected}
                className="h-4 w-4 shrink-0 rounded border-default text-accent focus:ring-focus"
              />
              <span className="min-w-0 truncate text-sm font-medium text-primary">
                {role.role_name}
              </span>
              <span className="flex items-center gap-1">
                {role.is_system && (
                  <span className="rounded bg-selected px-2 py-1 text-[10px] font-semibold text-muted">
                    System
                  </span>
                )}
                {isInactive && (
                  <span className="rounded bg-danger-soft px-2 py-1 text-[10px] font-semibold text-danger">
                    Inactive
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
