import React, { useState, useEffect } from "react";
import { useRolesPermissions } from "../context/RolesPermissionsContext";
import { RoleForm } from "../components/common/RoleForm";

export const RolesManagementPage = () => {
  const { roles, fetchRoles, createRole, updateRole, deleteRole, loading, error, clearError } =
    useRolesPermissions();
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = async (formData) => {
    try {
      await createRole(formData);
      setShowModal(false);
      setSelectedRole(null);
    } catch (err) {
      console.error("Error creating role:", err);
    }
  };

  const handleUpdateRole = async (formData) => {
    try {
      await updateRole(selectedRole.id, formData);
      setShowModal(false);
      setSelectedRole(null);
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await deleteRole(roleId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting role:", err);
    }
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRole(null);
  };

  const filteredRoles = roles.filter((role) =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-selected min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-muted">Roles Management</h1>
          <button
            onClick={() => {
              setSelectedRole(null);
              setShowModal(true);
            }}
            className="bg-accent text-primary px-4 py-2 rounded-lg font-medium hover:bg-accent transition"
          >
            + Create Role
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-danger text-danger rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-danger hover:text-danger"
            >
              ×
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search roles by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>

        {/* Roles Table */}
        <div className="bg-surface rounded-lg shadow overflow-hidden">
          {filteredRoles.length === 0 ? (
            <div className="p-8 text-center text-muted">
              {loading ? "Loading roles..." : "No roles found. Create one to get started!"}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-selected border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted">
                    Role Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-muted">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-muted">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-selected transition">
                    <td className="px-6 py-4 text-sm font-medium text-muted">
                      {role.role_name}
                      {role.is_system && (
                        <span className="ml-2 inline-block text-xs bg-accent text-accent px-2 py-1 rounded">
                          System
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {role.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-muted">
                      <span className="inline-block bg-selected text-muted px-3 py-1 rounded-full text-xs font-semibold">
                        {role.permission_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center space-x-2">
                      <button
                        onClick={() => openEditModal(role)}
                        className="bg-accent text-accent px-3 py-1 rounded hover:bg-accent transition"
                      >
                        Edit
                      </button>
                      {!role.is_system && (
                        <button
                          onClick={() => setDeleteConfirm(role.id)}
                          className="bg-danger text-danger px-3 py-1 rounded hover:bg-danger transition"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Role Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-overlay bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-muted">
                {selectedRole ? "Edit Role" : "Create New Role"}
              </h2>
              <button
                onClick={closeModal}
                className="text-muted hover:text-muted text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <RoleForm
                role={selectedRole}
                onSubmit={selectedRole ? handleUpdateRole : handleCreateRole}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-overlay bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-xl font-bold text-muted mb-4">Delete Role?</h3>
              <p className="text-muted mb-6">
                Are you sure you want to delete this role? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-muted bg-selected rounded-lg hover:bg-selected transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteRole(deleteConfirm)}
                  disabled={loading}
                  className="px-4 py-2 bg-danger text-primary rounded-lg hover:bg-danger disabled:bg-selected transition"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
