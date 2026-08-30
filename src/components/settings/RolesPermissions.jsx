import { useState, useEffect } from "react";
import { useRolesPermissions } from "../../context/RolesPermissionsContext";
import { RoleForm } from "../common/RoleForm";
import { Shield, Plus, Edit, Trash2, X } from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import clsx from "clsx";

const RolesPermissions = () => {
  const {
    roles,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    addPermissionsToRole,
    loading,
    error,
    clearError,
  } = useRolesPermissions();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create or edit
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
    setModalMode("edit");
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedRole(null);
    setModalMode("create");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRole(null);
  };

  const filteredRoles = roles.filter((role) =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Roles & Permissions
        </h2>
        <p className="text-sm text-slate-400">
          Manage roles and assign permissions to users
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex justify-between items-center">
          <span className="text-sm text-red-300">{error}</span>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search and Create */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 bg-slate-700/40 border border-slate-600/50 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition"
        >
          <Plus size={16} />
          Create Role
        </button>
      </div>

      {/* Roles Table */}
      <div className="overflow-hidden rounded-lg border border-slate-700/60">
        {filteredRoles.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-800/30">
            {loading ? "Loading roles..." : "No roles found."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 border-b border-slate-700/60">
              <tr>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">
                  Role Name
                </th>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-slate-300 font-medium">
                  Permissions
                </th>
                <th className="px-4 py-3 text-right text-slate-300 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredRoles.map((role) => (
                <tr key={role.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-indigo-400" />
                      <span className="font-medium text-white">
                        {role.role_name}
                      </span>
                      {role.is_system && (
                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                          System
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {role.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-slate-700/40 text-slate-300 px-2.5 py-1 rounded-full text-xs font-medium">
                      {role.permission_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(role)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-700/60 hover:bg-slate-600 text-slate-300 rounded transition"
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                    {!role.is_system && (
                      <button
                        onClick={() => setDeleteConfirm(role.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition"
                      >
                        <Trash2 size={12} />
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

      {/* Role Form Modal */}
      <SettingsModal
        open={showModal}
        onClose={closeModal}
        title={modalMode === "create" ? "Create New Role" : "Edit Role"}
        width="max-w-2xl"
      >
        <div className="p-6">
          <RoleForm
            role={selectedRole}
            onSubmit={
              modalMode === "create" ? handleCreateRole : handleUpdateRole
            }
            loading={loading}
          />
        </div>
      </SettingsModal>

      {/* Delete Confirmation Modal */}
      <SettingsModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Role?"
        width="max-w-sm"
      >
        <div className="p-6">
          <p className="text-slate-400 mb-6 text-sm">
            Are you sure you want to delete this role? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteRole(deleteConfirm)}
              disabled={loading}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:bg-slate-600 transition"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </SettingsModal>
    </div>
  );
};

export default RolesPermissions;
