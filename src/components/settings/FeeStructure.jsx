import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Edit3,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  createManagedFeeStructure,
  duplicateFeeStructure,
  getFeeCategories,
  getFeeGroups,
  getFeeStructure,
  getFeeStructures,
  updateFeeStructureStatus,
  getFeeAudit,
  assignFeeStructure,
  createFeeInvoice,
  updateManagedFeeStructure,
} from "../../api/feeStructureApi";

const npr = (value) =>
  `NPR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const styles = `
.fee-structure { color: var(--text-1); }
.fee-toolbar { display:flex; gap:10px; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; }
.fee-search { display:flex; align-items:center; gap:8px; background:var(--bg-input); border:1px solid var(--border-card); border-radius:8px; padding:0 12px; min-width:260px; }
.fee-search input { background:transparent; border:0; outline:0; color:var(--text-1); padding:10px 0; width:100%; }
.fee-btn { border:1px solid var(--border-card); background:var(--bg-card); color:var(--text-1); border-radius:8px; padding:9px 13px; display:inline-flex; align-items:center; gap:7px; cursor:pointer; font-weight:600; }
.fee-btn.primary { background:var(--accent); color:#fff; border-color:var(--accent); }
.fee-btn.danger { color:var(--danger); }
.fee-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
.fee-summary-card, .fee-panel { background:var(--bg-card); border:1px solid var(--border-card); border-radius:10px; padding:16px; }
.fee-summary-label { color:var(--text-3); font-size:12px; text-transform:uppercase; letter-spacing:.6px; }
.fee-summary-value { font:700 22px 'Sora', sans-serif; margin-top:7px; }
.fee-table-wrap { overflow-x:auto; background:var(--bg-card); border:1px solid var(--border-card); border-radius:10px; }
.fee-table { width:100%; border-collapse:collapse; min-width:720px; }
.fee-table th { text-align:left; color:var(--text-3); font-size:11px; text-transform:uppercase; letter-spacing:.5px; padding:13px 16px; border-bottom:1px solid var(--border-card); }
.fee-table td { padding:14px 16px; border-bottom:1px solid var(--border-card); font-size:13px; }
.fee-table tr:last-child td { border-bottom:0; }
.fee-name { font-weight:700; } .fee-muted { color:var(--text-3); font-size:12px; margin-top:3px; }
.fee-badge { display:inline-flex; border-radius:999px; padding:4px 8px; font-size:11px; font-weight:700; text-transform:capitalize; background:var(--bg-input); }
.fee-badge.active { color:var(--success); } .fee-badge.draft { color:var(--warning); } .fee-badge.archived { color:var(--danger); }
.fee-actions { display:flex; gap:6px; }
.fee-icon-btn { border:0; background:transparent; color:var(--text-2); cursor:pointer; padding:6px; border-radius:6px; } .fee-icon-btn:hover { background:var(--bg-hover); color:var(--text-1); }
.fee-empty { text-align:center; padding:45px 20px; color:var(--text-3); }
.fee-modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.48); display:grid; place-items:center; z-index:50; padding:20px; }
.fee-modal { width:min(720px,100%); max-height:90vh; overflow:auto; background:var(--bg-card); border:1px solid var(--border-card); border-radius:12px; padding:22px; box-shadow:0 18px 60px rgba(0,0,0,.25); }
.fee-modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; } .fee-modal h3 { margin:0; font-size:18px; }
.fee-form-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; } .fee-field { display:flex; flex-direction:column; gap:6px; } .fee-field.full { grid-column:1/-1; }
.fee-field label { font-size:12px; color:var(--text-2); font-weight:600; } .fee-field input,.fee-field select { border:1px solid var(--border-card); background:var(--bg-input); color:var(--text-1); border-radius:7px; padding:10px; outline:none; }
.fee-rules { margin-top:18px; border-top:1px solid var(--border-card); padding-top:15px; } .fee-rule { display:grid; grid-template-columns:1.4fr 1fr 1fr auto; gap:8px; margin-bottom:8px; }
.fee-rule input,.fee-rule select { min-width:0; border:1px solid var(--border-card); background:var(--bg-input); color:var(--text-1); border-radius:7px; padding:9px; }
.fee-modal-actions { display:flex; justify-content:flex-end; gap:9px; margin-top:20px; }
@media (max-width:700px) { .fee-summary { grid-template-columns:1fr; } .fee-form-grid { grid-template-columns:1fr; } .fee-field.full { grid-column:auto; } .fee-rule { grid-template-columns:1fr 1fr; } }
`;

const emptyRule = {
  name: "",
  amount: "",
  frequency: "monthly",
  charge_type: "recurring",
  mandatory: true,
  taxable: false,
};

export default function FeeStructure() {
  const [structures, setStructures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [audit, setAudit] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    structure_name: "",
    academic_year: "",
    class_id: "",
    section_id: "",
    rules: [{ ...emptyRule }],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [structuresRes, categoriesRes, groupsRes] = await Promise.all([
        getFeeStructures(),
        getFeeCategories(),
        getFeeGroups(),
      ]);
      setStructures(structuresRes.data?.data || []);
      setCategories(categoriesRes.data?.data || []);
      setGroups(groupsRes.data?.data || []);
    } catch {
      setStructures([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      structure_name: "",
      academic_year: "",
      class_id: "",
      section_id: "",
      rules: [{ ...emptyRule }],
    });
    setModal(true);
  };
  const openEdit = (structure) => {
    setEditingId(structure.id);
    setForm({
      structure_name: structure.structure_name || "",
      academic_year: structure.academic_year || "",
      class_id: structure.class_id || "",
      section_id: structure.section_id || "",
      rules: (structure.rules || []).map((rule) => ({ ...rule })),
    });
    setModal(true);
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        class_id: form.class_id || null,
        section_id: form.section_id || null,
      };
      if (editingId) await updateManagedFeeStructure(editingId, payload);
      else await createManagedFeeStructure(payload);
      setModal(false);
      const savedId = editingId;
      setEditingId(null);
      await load();
      if (savedId) await select({ id: savedId });
    } catch (error) {
      window.alert(
        error.response?.data?.message || "Could not save fee structure",
      );
    } finally {
      setSaving(false);
    }
  };
  const select = async (structure) => {
    try {
      const [response, auditResponse] = await Promise.all([
        getFeeStructure(structure.id),
        getFeeAudit(structure.id),
      ]);
      setSelected(response.data?.data || structure);
      setAudit(auditResponse.data?.data || []);
    } catch {
      setSelected(structure);
      setAudit([]);
    }
  };
  const status = async (id, next) => {
    if (!window.confirm(`Set this structure to ${next}?`)) return;
    await updateFeeStructureStatus(id, next);
    await load();
    if (selected?.id === id) setSelected(null);
  };
  const duplicate = async (id) => {
    await duplicateFeeStructure(id);
    await load();
  };
  const applyToStudent = async () => {
    const studentId = window.prompt("Student ID to assign this structure to");
    if (!studentId) return;
    try {
      await assignFeeStructure({
        fee_structure_id: selected.id,
        student_id: Number(studentId),
        effective_date: new Date().toISOString().slice(0, 10),
        approval_status: "approved",
      });
      window.alert("Fee structure assigned to student.");
    } catch (error) {
      window.alert(
        error.response?.data?.message || "Could not assign structure",
      );
    }
  };
  const filtered = structures.filter((item) =>
    `${item.structure_name || ""} ${item.academic_year || ""} ${item.class_name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const totalRules =
    selected?.rules?.reduce((sum, rule) => sum + Number(rule.amount || 0), 0) ||
    0;

  return (
    <>
      <style>{styles}</style>
      <div className="fee-structure">
        <div className="fee-toolbar">
          <div>
            <div className="acc-section-title">Fee Structures</div>
            <div className="fee-muted">
              Versioned academic-session pricing and student assignment
            </div>
          </div>
          <button className="fee-btn primary" onClick={openCreate}>
            <Plus size={16} /> New structure
          </button>
        </div>
        <div className="fee-summary">
          <div className="fee-summary-card">
            <div className="fee-summary-label">Configured structures</div>
            <div className="fee-summary-value">{structures.length}</div>
          </div>
          <div className="fee-summary-card">
            <div className="fee-summary-label">Active structures</div>
            <div className="fee-summary-value">
              {structures.filter((x) => x.status === "active").length}
            </div>
          </div>
          <div className="fee-summary-card">
            <div className="fee-summary-label">Estimated line items</div>
            <div className="fee-summary-value">
              {structures.reduce((sum, x) => sum + (x.rules?.length || 0), 0)}
            </div>
          </div>
        </div>
        <div className="fee-toolbar">
          <div className="fee-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search structures"
            />
          </div>
        </div>
        {loading ? (
          <div className="fee-panel">Loading fee structures...</div>
        ) : filtered.length === 0 ? (
          <div className="fee-panel fee-empty">
            <FileText size={28} />
            <div>No fee structures match this search.</div>
          </div>
        ) : (
          <div className="fee-table-wrap">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Structure</th>
                  <th>Scope</th>
                  <th>Version</th>
                  <th>Annual estimate</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="fee-name">
                        {item.structure_name ||
                          item.category_name ||
                          "Fee structure"}
                      </div>
                      <div className="fee-muted">
                        {item.academic_year || "No academic session"}
                      </div>
                    </td>
                    <td>
                      {item.class_name || "All classes"}
                      {item.section_name ? ` / ${item.section_name}` : ""}
                    </td>
                    <td>v{item.version || 1}</td>
                    <td>
                      {npr(
                        item.rules?.reduce(
                          (sum, rule) => sum + Number(rule.amount || 0),
                          0,
                        ) || item.amount,
                      )}
                    </td>
                    <td>
                      <span className={`fee-badge ${item.status || "draft"}`}>
                        {item.status || "draft"}
                      </span>
                    </td>
                    <td>
                      <div className="fee-actions">
                        <button
                          className="fee-icon-btn"
                          title="View builder"
                          onClick={() => select(item)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="fee-icon-btn"
                          title="Duplicate"
                          onClick={() => duplicate(item.id)}
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          className="fee-icon-btn"
                          title="Activate"
                          onClick={() =>
                            status(
                              item.id,
                              item.status === "active" ? "inactive" : "active",
                            )
                          }
                        >
                          {item.status === "active" ? (
                            <ToggleRight size={17} />
                          ) : (
                            <ToggleLeft size={17} />
                          )}
                        </button>
                        <button
                          className="fee-icon-btn"
                          title="Archive"
                          onClick={() => status(item.id, "archived")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selected && (
          <div className="fee-panel" style={{ marginTop: 18 }}>
            <div className="fee-toolbar">
              <div>
                <div className="fee-name">
                  {selected.structure_name || "Fee structure"}
                </div>
                <div className="fee-muted">
                  {selected.academic_year} ·{" "}
                  {selected.class_name || "All classes"}
                  {selected.section_name ? ` · ${selected.section_name}` : ""} ·
                  Version {selected.version || 1}
                </div>
              </div>
              <button
                className="fee-icon-btn"
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="fee-rules">
              {(selected.rules || []).map((rule) => (
                <div className="fee-rule" key={rule.id}>
                  <span className="fee-name">{rule.name}</span>
                  <span>{rule.frequency}</span>
                  <span>{npr(rule.amount)}</span>
                  <span className="fee-badge">
                    {rule.mandatory ? "Mandatory" : "Optional"}
                  </span>
                </div>
              ))}
              <div className="fee-toolbar" style={{ marginTop: 15 }}>
                <span className="fee-name">Total configured base</span>
                <span className="fee-name">{npr(totalRules)}</span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              <button className="fee-btn" onClick={applyToStudent}>
                <Users size={15} /> Apply to students
              </button>
              <button
                className="fee-btn"
                onClick={() =>
                  window.alert(
                    "Invoices use the saved fee-rule snapshot and calculate discounts, levies, fines, payments, and balance separately.",
                  )
                }
              >
                <ShieldCheck size={15} /> Billing rules
              </button>
            </div>
            <div className="fee-rules">
              <div className="fee-name">Audit history</div>
              {audit.length ? (
                audit.map((entry) => (
                  <div className="fee-muted" key={entry.id}>
                    {entry.action} ·{" "}
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                ))
              ) : (
                <div className="fee-muted">No audit events yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
      {modal && (
        <div className="fee-modal-backdrop" role="presentation">
          <form className="fee-modal" onSubmit={save}>
            <div className="fee-modal-head">
              <h3>Create fee structure</h3>
              <button
                type="button"
                className="fee-icon-btn"
                onClick={() => setModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="fee-form-grid">
              <div className="fee-field full">
                <label>Structure name</label>
                <input
                  required
                  value={form.structure_name}
                  onChange={(e) =>
                    setForm({ ...form, structure_name: e.target.value })
                  }
                  placeholder="Grade 10 annual fee plan"
                />
              </div>
              <div className="fee-field">
                <label>Academic session</label>
                <input
                  required
                  value={form.academic_year}
                  onChange={(e) =>
                    setForm({ ...form, academic_year: e.target.value })
                  }
                  placeholder="2026/27"
                />
              </div>
              <div className="fee-field">
                <label>Class ID (optional)</label>
                <input
                  type="number"
                  value={form.class_id}
                  onChange={(e) =>
                    setForm({ ...form, class_id: e.target.value })
                  }
                  placeholder="Class scope"
                />
              </div>
            </div>
            <div className="fee-rules">
              <div className="fee-toolbar">
                <span className="fee-name">Fee rules</span>
                <button
                  type="button"
                  className="fee-btn"
                  onClick={() =>
                    setForm({
                      ...form,
                      rules: [...form.rules, { ...emptyRule }],
                    })
                  }
                >
                  <Plus size={14} /> Add line
                </button>
              </div>
              {form.rules.map((rule, index) => (
                <div className="fee-rule" key={index}>
                  <input
                    required
                    placeholder="Fee name"
                    value={rule.name}
                    onChange={(e) => {
                      const rules = [...form.rules];
                      rules[index] = { ...rule, name: e.target.value };
                      setForm({ ...form, rules });
                    }}
                  />
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={rule.amount}
                    onChange={(e) => {
                      const rules = [...form.rules];
                      rules[index] = { ...rule, amount: e.target.value };
                      setForm({ ...form, rules });
                    }}
                  />
                  <select
                    value={rule.frequency}
                    onChange={(e) => {
                      const rules = [...form.rules];
                      rules[index] = { ...rule, frequency: e.target.value };
                      setForm({ ...form, rules });
                    }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="term">Term-wise</option>
                    <option value="annual">Annual</option>
                    <option value="one_time">One-time</option>
                  </select>
                  <button
                    type="button"
                    className="fee-icon-btn danger"
                    disabled={form.rules.length === 1}
                    onClick={() =>
                      setForm({
                        ...form,
                        rules: form.rules.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="fee-modal-actions">
              <button
                type="button"
                className="fee-btn"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="fee-btn primary" disabled={saving}>
                {saving ? "Saving..." : "Save draft"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
