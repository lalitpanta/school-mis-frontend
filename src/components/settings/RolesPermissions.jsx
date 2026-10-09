import { useState, useEffect, useRef } from "react";
import { useRolesPermissions } from "../../context/RolesPermissionsContext";
import { RoleForm } from "../common/RoleForm";
import { Shield, Plus, Edit, Trash2, X } from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import clsx from "clsx";
import useSettingsInlinePanelLayout from "../../hooks/useSettingsInlinePanelLayout";

const RolesPermissions = () => {
  const layoutRef = useRef(null);
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

  const isEditingRole = showModal;
  const editPanelStyle = useSettingsInlinePanelLayout(isEditingRole, layoutRef);

  return (
    <div
      ref={layoutRef}
      className={`entity-admin-page relative min-w-0 rounded-2xl border border-default bg-subtle p-4 ${isEditingRole ? "is-editing grid h-[calc(100dvh-10rem)] min-h-128 grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4 overflow-hidden max-lg:h-auto max-lg:max-h-none max-lg:grid-cols-1" : "flex h-full min-h-0 w-full flex-col"}`}
    >
      <div
        className={`min-w-0 ${isEditingRole ? "flex min-h-0 flex-col overflow-hidden" : "flex min-h-0 flex-1 flex-col"}`}
      >
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-2">
          Roles & Permissions
        </h2>
        <p className="text-sm text-muted">
          Manage roles and assign permissions to users
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-danger-soft border border-danger rounded-lg flex justify-between items-center">
          <span className="text-sm text-danger">{error}</span>
          <button
            onClick={clearError}
            className="text-danger hover:text-danger"
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
          className="flex-1 px-3 py-2 bg-subtle border border-default text-primary text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-focus"
        />
        <button
          onClick={openCreateModal}
          className="settings-admin-create-button bg-accent text-primary transition hover:bg-accent"
        >
          <Plus size={16} />
          Create Role
        </button>
      </div>

      {/* Roles Table */}
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-default">
        {filteredRoles.length === 0 ? (
          <div className="p-6 text-center text-muted bg-subtle">
            {loading ? "Loading roles..." : "No roles found."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-subtle border-b border-default">
              <tr>
                <th className="px-4 py-3 text-left text-muted font-medium">
                  Role Name
                </th>
                <th className="px-4 py-3 text-left text-muted font-medium">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-muted font-medium">
                  Permissions
                </th>
                <th className="px-4 py-3 text-right text-muted font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredRoles.map((role) => (
                <tr key={role.id} className="hover:bg-subtle transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-accent" />
                      <span className="font-medium text-primary">
                        {role.role_name}
                      </span>
                      {role.is_system && (
                        <span className="text-xs bg-accent-soft text-accent px-2 py-0.5 rounded">
                          System
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {role.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-subtle text-muted px-2.5 py-1 rounded-full text-xs font-medium">
                      {role.permission_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(role)}
                      className="rounded p-2 text-accent transition hover:bg-accent-soft hover:text-accent"
                      title={`Edit ${role.role_name}`}
                      aria-label={`Edit ${role.role_name}`}
                    >
                      <Edit size={16} />
                    </button>
                    {!role.is_system && (
                      <button
                        onClick={() => setDeleteConfirm(role.id)}
                        className="rounded p-2 text-danger transition hover:bg-danger-soft hover:text-danger"
                        title={`Delete ${role.role_name}`}
                        aria-label={`Delete ${role.role_name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>

      {/* Role Form Modal */}
      <SettingsModal
        open={showModal}
        onClose={closeModal}
        title={modalMode === "create" ? "Create New Role" : "Edit Role"}
        width="max-w-2xl"
        inlinePanel={isEditingRole}
        inlinePanelClassName="entity-edit-panel settings-inline-edit-panel"
        inlinePanelStyle={editPanelStyle}
        inlinePanelSurfaceClassName="rounded-xl border border-default shadow-lg"
        inlinePanelSurfaceStyle={{ background: "var(--bg-card)" }}
        inlinePanelHeaderClassName="entity-edit-header min-h-11 items-center px-5 py-2"
        inlinePanelBodyClassName="entity-edit-body px-5 py-4"
      >
        <div className="min-h-full">
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
          <p className="text-muted mb-6 text-sm">
            Are you sure you want to delete this role? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm bg-subtle hover:bg-selected text-primary rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteRole(deleteConfirm)}
              disabled={loading}
              className="px-4 py-2 text-sm bg-danger hover:bg-danger text-primary rounded-lg disabled:bg-selected transition"
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
