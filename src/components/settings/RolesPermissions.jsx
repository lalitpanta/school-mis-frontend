import { useState, useEffect, useRef } from "react";
import { useRolesPermissions } from "../../context/RolesPermissionsContext";
import { RoleForm } from "../common/RoleForm";
import { Shield, Plus, Edit, Trash2, X, Power } from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import clsx from "clsx";
import useSettingsInlinePanelLayout from "../../hooks/useSettingsInlinePanelLayout";
import RecordTableToolbar from "../common/RecordTableToolbar";
import CsvImportControls from "../common/CsvImportControls";
import CsvExportButton from "../common/CsvExportButton";
import { downloadRecordCsv, parseRecordCsv } from "../../utils/recordCsv";
import toast from "react-hot-toast";
import RecordSelectCheckbox from "../common/RecordSelectCheckbox";
import BulkDeleteBar from "../common/BulkDeleteBar";

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
  const [roleFilter, setRoleFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState([
    "role_name",
    "description",
    "permissions",
  ]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [togglingRoleId, setTogglingRoleId] = useState(null);

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
      setSelectedRoleIds((current) => current.filter((id) => id !== roleId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting role:", err);
    }
  };

  const handleToggleRoleActive = async (role) => {
    const isActive = role.is_active !== false;
    try {
      setTogglingRoleId(role.id);
      await updateRole(role.id, { is_active: !isActive });
      await fetchRoles();
      toast.success(
        `Role ${isActive ? "deactivated" : "activated"}. Changes apply to staff access immediately.`,
      );
    } catch (err) {
      console.error("Failed to update role status:", err);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to update role status.",
      );
    } finally {
      setTogglingRoleId(null);
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

  const filteredRoles = roles.filter((role) => {
    const text = `${role.role_name || ""} ${role.description || ""}`.toLowerCase();
    return (
      text.includes(searchTerm.toLowerCase()) &&
      (roleFilter === "all" ||
        (roleFilter === "system" ? role.is_system : !role.is_system))
    );
  });
  const deletableRoleIds = filteredRoles
    .filter((role) => !role.is_system)
    .map((role) => role.id);
  const allVisibleRolesSelected =
    deletableRoleIds.length > 0 &&
    deletableRoleIds.every((id) => selectedRoleIds.includes(id));

  const handleBulkDeleteRoles = async () => {
    const ids = selectedRoleIds;
    if (
      ids.length === 0 ||
      !window.confirm(
        `Delete ${ids.length} selected role${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
      )
    ) {
      return;
    }

    const results = await Promise.allSettled(ids.map((id) => deleteRole(id)));
    const failedIds = ids.filter(
      (_, index) => results[index].status === "rejected",
    );
    const deletedCount = ids.length - failedIds.length;
    setSelectedRoleIds(failedIds);
    await fetchRoles();
    if (failedIds.length > 0) {
      toast.error(
        `${deletedCount} role${deletedCount === 1 ? "" : "s"} deleted; ${failedIds.length} could not be deleted.`,
      );
    } else {
      toast.success(`${deletedCount} role${deletedCount === 1 ? "" : "s"} deleted.`);
    }
  };
  const roleColumns = [
    { key: "role_name", label: "Role name" },
    { key: "description", label: "Description" },
    { key: "permissions", label: "Permissions" },
  ];
  const toggleRoleColumn = (key) =>
    setVisibleColumns((current) =>
      current.includes(key)
        ? current.filter((column) => column !== key)
        : [...current, key],
    );
  const importRolesCsv = async (file) => {
    try {
      const rows = parseRecordCsv(await file.text());
      let imported = 0;
      const failures = [];
      const existingNames = new Set(roles.map((role) => role.role_name?.toLowerCase()));
      for (const row of rows) {
        const roleName = row.values.role_name?.trim();
        if (!roleName) {
          failures.push(`Row ${row.rowNumber}: role_name is required.`);
          continue;
        }
        if (existingNames.has(roleName.toLowerCase())) {
          failures.push(`Row ${row.rowNumber}: role "${roleName}" already exists.`);
          continue;
        }
        try {
          await createRole({
            role_name: roleName,
            description: row.values.description || "",
            permissions: [],
          });
          existingNames.add(roleName.toLowerCase());
          imported += 1;
        } catch (err) {
          failures.push(
            `Row ${row.rowNumber}: ${err.response?.data?.message || err.message || "creation failed"}`,
          );
        }
      }
      if (imported) await fetchRoles();
      if (failures.length) {
        toast.error(`${imported} roles imported; ${failures.length} row(s) failed. ${failures[0]}`);
      } else {
        toast.success(`${imported} roles imported with no permissions assigned.`);
      }
    } catch (err) {
      toast.error(err.message || "Could not read this CSV file.");
    }
  };
  const exportRolesCsv = () =>
    downloadRecordCsv(
      "roles-permissions.csv",
      [
        { label: "role_name", value: (role) => role.role_name },
        { label: "description", value: (role) => role.description },
        { label: "permission_count", value: (role) => role.permission_count || 0 },
        { label: "is_system", value: (role) => Boolean(role.is_system) },
      ],
      filteredRoles,
    );

  const isEditingRole = showModal && modalMode === "edit";
  const editPanelStyle = useSettingsInlinePanelLayout(isEditingRole, layoutRef);

  return (
    <div
      ref={layoutRef}
      data-settings-screen="roles"
      className={`entity-admin-page relative min-w-0 rounded-2xl border border-default bg-subtle p-4 ${isEditingRole ? "is-editing flex h-[calc(100dvh-5rem)] min-h-128 w-full flex-col overflow-visible max-md:h-auto max-md:min-h-0" : "flex h-full min-h-0 w-full flex-col"}`}
    >
      <div
        className={`w-full min-w-0 ${isEditingRole ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" : "flex min-h-0 flex-1 flex-col"}`}
      >
      {/* Header */}
      <div>
        <h2 className="text-[28px] font-bold text-primary">
          Roles & Permissions
        </h2>
        <p className="mt-1 text-sm text-muted">
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
      <div className="flex flex-wrap justify-end gap-2">
        <CsvImportControls onImport={importRolesCsv} entityLabel="roles" disabled={loading} />
        <button
          onClick={openCreateModal}
          className="settings-admin-create-button bg-accent text-primary transition hover:bg-accent"
        >
          <Plus size={16} />
          Create Role
        </button>
      </div>

      <RecordTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search roles..."
        columns={roleColumns}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleRoleColumn}
        filterContent={
          <label className="grid gap-1 text-sm text-slate-300">
            Role type
            <select className="entity-admin-input rounded border border-slate-700 px-2 py-2" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option><option value="system">System</option><option value="custom">Custom</option>
            </select>
          </label>
        }
        views={[
          { label: "All roles", onSelect: () => setRoleFilter("all") },
          { label: "System roles", onSelect: () => setRoleFilter("system") },
          { label: "Custom roles", onSelect: () => setRoleFilter("custom") },
        ]}
        recordCount={filteredRoles.length}
        rightContent={<CsvExportButton onExport={exportRolesCsv} entityLabel="roles" disabled={!roles.length} />}
      />
      <BulkDeleteBar
        count={selectedRoleIds.length}
        itemLabel="roles"
        disabled={loading}
        onDelete={handleBulkDeleteRoles}
        onClear={() => setSelectedRoleIds([])}
      />
      {/* Roles Table */}
      <div className="min-h-0 flex-1 overflow-hidden">
      <div className={`entity-admin-list h-full min-w-0 rounded-lg border border-default ${isEditingRole ? "w-full overflow-y-auto overflow-x-hidden md:w-1/2" : "overflow-auto"}`}>
        {filteredRoles.length === 0 ? (
          <div className="p-6 text-center text-muted bg-subtle">
            {loading ? "Loading roles..." : "No roles found."}
          </div>
        ) : (
          <table className="w-full min-w-0 table-fixed text-sm">
            <thead className="bg-subtle border-b border-default">
              <tr>
                <th className="w-10 px-2 text-center">
                  <RecordSelectCheckbox
                    checked={allVisibleRolesSelected}
                    onChange={(event) =>
                      setSelectedRoleIds((current) =>
                        event.target.checked
                          ? Array.from(new Set([...current, ...deletableRoleIds]))
                          : current.filter((id) => !deletableRoleIds.includes(id)),
                      )
                    }
                    label="Select all visible deletable roles"
                  />
                </th>
                <th className={`px-4 py-3 text-left text-muted font-medium ${!visibleColumns.includes("role_name") ? "hidden" : ""}`}>
                  Role Name
                </th>
                <th className={`px-4 py-3 text-left text-muted font-medium ${!visibleColumns.includes("description") ? "hidden" : ""}`}>
                  Description
                </th>
                <th className={`px-4 py-3 text-center text-muted font-medium ${!visibleColumns.includes("permissions") ? "hidden" : ""}`}>
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
                <td className="w-10 px-2 text-center">
                  {!role.is_system && (
                    <RecordSelectCheckbox
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={(event) =>
                        setSelectedRoleIds((current) =>
                          event.target.checked
                            ? [...new Set([...current, role.id])]
                            : current.filter((id) => id !== role.id),
                        )
                      }
                      label={`Select role ${role.role_name}`}
                    />
                  )}
                </td>
                <td className={`px-4 py-3 ${!visibleColumns.includes("role_name") ? "hidden" : ""}`}>
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
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          role.is_active === false
                            ? "bg-danger-soft text-danger"
                            : "bg-success text-success"
                        }`}
                      >
                        {role.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-muted ${!visibleColumns.includes("description") ? "hidden" : ""}`}>
                    {role.description || "—"}
                  </td>
                  <td className={`px-4 py-3 text-center ${!visibleColumns.includes("permissions") ? "hidden" : ""}`}>
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
                    <button
                      type="button"
                      onClick={() => handleToggleRoleActive(role)}
                      disabled={togglingRoleId === role.id}
                      className={`rounded p-2 transition disabled:cursor-wait disabled:opacity-50 ${
                        role.is_active === false
                          ? "text-success hover:bg-success"
                          : "text-warning hover:bg-warning-soft"
                      }`}
                      title={`${role.is_active === false ? "Activate" : "Deactivate"} ${role.role_name}`}
                      aria-label={`${role.is_active === false ? "Activate" : "Deactivate"} ${role.role_name}`}
                    >
                      <Power size={15} />
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
      </div>

      {/* Role Form Modal */}
      <SettingsModal
        open={showModal}
        onClose={closeModal}
        title={
          modalMode === "create"
            ? "Create New Role"
            : `EDIT ROLE · ${selectedRole?.role_name || ""}`
        }
        width="max-w-2xl"
        inlinePanel={isEditingRole}
        inlinePanelClassName="entity-edit-panel settings-inline-edit-panel"
        inlinePanelStyle={editPanelStyle}
        inlinePanelSurfaceClassName="rounded-xl border border-slate-700/70 shadow-lg"
        inlinePanelSurfaceStyle={{ background: "var(--bg-card)" }}
        inlinePanelHeaderClassName="entity-edit-header student-entity-edit-header items-center px-5"
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
