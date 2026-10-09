import { useState, useEffect, useRef } from "react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../api/departmentsApi";
import Button from "../common/Button";
import { Plus, Edit, Trash2 } from "lucide-react";
import SettingsModal from "../common/SettingsModal";
import useSettingsInlinePanelLayout from "../../hooks/useSettingsInlinePanelLayout";
import RecordTableToolbar from "../common/RecordTableToolbar";
import CsvImportControls from "../common/CsvImportControls";
import CsvExportButton from "../common/CsvExportButton";
import { downloadRecordCsv, parseRecordCsv } from "../../utils/recordCsv";
import toast from "react-hot-toast";

const Departments = () => {
  const layoutRef = useRef(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState(["name", "code", "active"]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    is_active: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter((department) => {
    const text = `${department.name || ""} ${department.code || ""} ${department.description || ""}`.toLowerCase();
    return (
      text.includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" ||
        Boolean(department.is_active) === (statusFilter === "active"))
    );
  });
  const departmentColumns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    { key: "active", label: "Active" },
  ];
  const toggleDepartmentColumn = (key) =>
    setVisibleColumns((current) =>
      current.includes(key)
        ? current.filter((column) => column !== key)
        : [...current, key],
    );
  const importDepartmentsCsv = async (file) => {
    try {
      const rows = parseRecordCsv(await file.text());
      let imported = 0;
      const failures = [];
      const existingNames = new Set(
        departments.map((department) => department.name?.toLowerCase()),
      );
      for (const row of rows) {
        const name = row.values.name?.trim();
        if (!name) {
          failures.push(`Row ${row.rowNumber}: name is required.`);
          continue;
        }
        if (existingNames.has(name.toLowerCase())) {
          failures.push(`Row ${row.rowNumber}: department "${name}" already exists.`);
          continue;
        }
        try {
          await createDepartment({
            name,
            code: row.values.code || "",
            description: row.values.description || "",
            is_active: !["false", "0", "no", "inactive"].includes(
              (row.values.is_active || "true").toLowerCase(),
            ),
          });
          existingNames.add(name.toLowerCase());
          imported += 1;
        } catch (err) {
          failures.push(
            `Row ${row.rowNumber}: ${err.response?.data?.message || err.message || "creation failed"}`,
          );
        }
      }
      if (imported) await load();
      if (failures.length) {
        toast.error(`${imported} departments imported; ${failures.length} row(s) failed. ${failures[0]}`);
      } else {
        toast.success(`${imported} departments imported.`);
      }
    } catch (err) {
      toast.error(err.message || "Could not read this CSV file.");
    }
  };
  const exportDepartmentsCsv = () =>
    downloadRecordCsv(
      "departments.csv",
      [
        { label: "name", value: (department) => department.name },
        { label: "code", value: (department) => department.code },
        { label: "description", value: (department) => department.description },
        { label: "is_active", value: (department) => department.is_active },
      ],
      filteredDepartments,
    );

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setModalMode("create");
    setSelected(null);
    setForm({ name: "", code: "", description: "", is_active: true });
    setShowModal(true);
  };
  const openEdit = (d) => {
    setModalMode("edit");
    setSelected(d);
    setForm({
      name: d.name || "",
      code: d.code || "",
      description: d.description || "",
      is_active: d.is_active,
    });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (modalMode === "create") {
        await createDepartment(form);
      } else if (selected) {
        await updateDepartment(selected.id, form);
      }
      await load();
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this department?")) return;
    try {
      setLoading(true);
      await deleteDepartment(id);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isEditingDepartment = showModal && modalMode === "edit";
  const editPanelStyle = useSettingsInlinePanelLayout(
    isEditingDepartment,
    layoutRef,
  );

  return (
    <div
      ref={layoutRef}
      data-settings-screen="departments"
      className={`entity-admin-page relative min-w-0 rounded-2xl p-4 ${isEditingDepartment ? "is-editing flex h-[calc(100dvh-5rem)] min-h-128 w-full flex-col overflow-visible max-md:h-auto max-md:min-h-0" : "flex h-full min-h-0 w-full flex-col"}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className={`w-full min-w-0 ${isEditingDepartment ? "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" : "flex min-h-0 flex-1 flex-col"}`}
      >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          className="text-[28px] font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Departments
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <CsvImportControls onImport={importDepartmentsCsv} entityLabel="departments" disabled={loading} />
          <button onClick={openCreate} className="settings-admin-create-button bg-accent text-primary transition hover:bg-accent">
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      <RecordTableToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search departments..."
        columns={departmentColumns}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleDepartmentColumn}
        filterContent={
          <label className="grid gap-1 text-sm text-slate-300">
            Status
            <select className="entity-admin-input rounded border border-slate-700 px-2 py-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </label>
        }
        views={[
          { label: "All departments", onSelect: () => setStatusFilter("all") },
          { label: "Active departments", onSelect: () => setStatusFilter("active") },
          { label: "Inactive departments", onSelect: () => setStatusFilter("inactive") },
        ]}
        recordCount={filteredDepartments.length}
        rightContent={<CsvExportButton onExport={exportDepartmentsCsv} entityLabel="departments" disabled={!departments.length} />}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
      <div className={`entity-admin-list h-full min-w-0 rounded-lg border border-default ${isEditingDepartment ? "w-full overflow-y-auto overflow-x-hidden md:w-1/2" : "overflow-auto"}`}>
        {filteredDepartments.length === 0 ? (
          <div className="p-6 text-center text-muted">
            {loading ? "Loading..." : "No departments yet."}
          </div>
        ) : (
          <table className="w-full min-w-0 table-fixed text-sm">
            <thead className="bg-subtle border-b border-default">
              <tr>
                <th className={`px-4 py-3 text-left ${!visibleColumns.includes("name") ? "hidden" : ""}`}>Name</th>
                <th className={`px-4 py-3 text-left ${!visibleColumns.includes("code") ? "hidden" : ""}`}>Code</th>
                <th className={`px-4 py-3 ${!visibleColumns.includes("active") ? "hidden" : ""}`}>Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filteredDepartments.map((d) => (
                <tr key={d.id} className="hover:bg-subtle transition">
                  <td className={`px-4 py-3 ${!visibleColumns.includes("name") ? "hidden" : ""}`}>{d.name}</td>
                  <td className={`px-4 py-3 ${!visibleColumns.includes("code") ? "hidden" : ""}`}>{d.code || "—"}</td>
                  <td className={`px-4 py-3 text-center ${!visibleColumns.includes("active") ? "hidden" : ""}`}>
                    {d.is_active ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(d)}
                      className="rounded p-2 text-accent transition hover:bg-accent-soft hover:text-accent"
                      title={`Edit ${d.name}`}
                      aria-label={`Edit ${d.name}`}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="rounded p-2 text-danger transition hover:bg-danger-soft hover:text-danger"
                      title={`Delete ${d.name}`}
                      aria-label={`Delete ${d.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
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

      <SettingsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === "create" ? "Create Department" : "Edit Department"}
        width="max-w-md"
        inlinePanel={isEditingDepartment}
        inlinePanelClassName="entity-edit-panel settings-inline-edit-panel"
        inlinePanelStyle={editPanelStyle}
        inlinePanelSurfaceClassName="rounded-xl border border-default shadow-lg"
        inlinePanelSurfaceStyle={{ background: "var(--bg-card)" }}
        inlinePanelHeaderClassName="entity-edit-header min-h-11 items-center px-5 py-2"
        inlinePanelBodyClassName="entity-edit-body px-5 py-4"
      >
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-muted mb-1">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-subtle border rounded text-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 bg-subtle border rounded text-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-subtle border rounded text-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
              />{" "}
              Active
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              {modalMode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </SettingsModal>
    </div>
  );
};

export default Departments;
