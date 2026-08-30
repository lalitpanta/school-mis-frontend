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

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text-1)" }}
        >
          Departments
        </h2>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
        >
          <Plus size={14} /> Create
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-700/60">
        {departments.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            {loading ? "Loading..." : "No departments yet."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 border-b border-slate-700/60">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3">{d.code || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {d.is_active ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEdit(d)}
                      className="px-3 py-1 bg-slate-700/60 text-slate-200 rounded"
                    >
                      {" "}
                      <Edit size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-300 rounded"
                    >
                      {" "}
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SettingsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === "create" ? "Create Department" : "Edit Department"}
        width="max-w-md"
      >
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-800 border rounded text-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
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
