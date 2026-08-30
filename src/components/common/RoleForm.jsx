import React, { useState, useEffect } from "react";
import { PermissionSelector } from "./PermissionSelector";

export const RoleForm = ({ role = null, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    role_name: "",
    description: "",
    permissions: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (role) {
      setFormData({
        role_name: role.role_name || "",
        description: role.description || "",
        permissions: role.permissions || [],
      });
    }
  }, [role]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.role_name.trim()) {
      newErrors.role_name = "Role name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Name */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Role Name *
        </label>
        <input
          type="text"
          value={formData.role_name}
          onChange={(e) => {
            setFormData({ ...formData, role_name: e.target.value });
            setErrors({ ...errors, role_name: "" });
          }}
          placeholder="e.g., Teacher, Administrator, Student"
          className={`w-full px-3 py-2 bg-slate-700/40 border rounded-lg text-white text-sm focus:outline-none focus:ring-2 ${
            errors.role_name ? "border-red-500 focus:ring-red-500" : "border-slate-600/50 focus:ring-indigo-500"
          }`}
          disabled={loading}
        />
        {errors.role_name && (
          <p className="text-red-400 text-sm mt-1">{errors.role_name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Enter role description"
          rows="3"
          className="w-full px-3 py-2 bg-slate-700/40 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        />
      </div>

      {/* Module Permissions */}
      <PermissionSelector
        selectedPermissions={formData.permissions}
        onChange={(permissions) =>
          setFormData({ ...formData, permissions })
        }
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium disabled:bg-slate-600 disabled:cursor-not-allowed transition"
      >
        {loading ? "Saving..." : role ? "Update Role" : "Create Role"}
      </button>
    </form>
  );
};
