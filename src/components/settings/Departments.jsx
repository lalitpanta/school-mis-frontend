import { useState, useEffect } from "react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../api/departmentsApi";
import Button from "../common/Button";
import { Plus, Edit, Trash2 } from "lucide-react";
import SettingsModal from "../common/SettingsModal";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selected, setSelected] = useState(null);
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

  const isEditingDepartment = showModal;

  return (
    <div
      className={`min-w-0 rounded-2xl p-4 ${isEditingDepartment ? "grid h-[calc(100vh-10rem)] max-h-192 min-h-128 grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4 overflow-hidden max-lg:h-auto max-lg:max-h-none max-lg:grid-cols-1" : "flex h-full min-h-0 w-full flex-col"}`}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className={`min-w-0 ${isEditingDepartment ? "flex min-h-0 flex-col overflow-hidden" : "flex min-h-0 flex-1 flex-col"}`}
      >
      <div className="flex justify-between items-center mb-4">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Departments
        </h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-3 py-1 bg-accent hover:bg-accent text-primary rounded"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-default">
        {departments.length === 0 ? (
          <div className="p-6 text-center text-muted">
            {loading ? "Loading..." : "No departments yet."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-subtle border-b border-default">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-subtle transition">
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3">{d.code || "—"}</td>
                  <td className="px-4 py-3 text-center">
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

      <SettingsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === "create" ? "Create Department" : "Edit Department"}
        width="max-w-md"
        inlinePanel={isEditingDepartment}
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
