import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  Copy,
  Edit3,
  FileText,
  History,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import {
  assignFeeStructure,
  createFeeCategory,
  createFeeInvoice,
  createManagedFeeStructure,
  duplicateFeeStructure,
  getFeeAudit,
  getFeeCategories,
  getFeeGroups,
  getFeeInvoices,
  getFeeInvoice,
  getFeeStructure,
  getFeeStructures,
  recordFeePayment,
  updateManagedFeeStructure,
  updateFeeStructureStatus,
} from "../../api/feeStructureApi";

const npr = (value) =>
  `NPR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);
const emptyRule = {
  name: "",
  amount: "",
  category_id: "",
  fee_group_id: "",
  charge_type: "recurring",
  frequency: "monthly",
  mandatory: true,
  taxable: false,
  refundable: false,
};
const initialForm = () => ({
  structure_name: "",
  academic_year: "",
  class_id: "",
  section_id: "",
  effective_start_date: today(),
  effective_end_date: "",
  rules: [{ ...emptyRule }],
});

const styles = `
.fee-pro { color:var(--text-1); }
.fee-pro-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
.fee-pro-search { display:flex; align-items:center; gap:8px; min-width:260px; flex:1; max-width:420px; padding:0 12px; background:var(--bg-input); border:1px solid var(--border-card); border-radius:9px; }
.fee-pro-search input { width:100%; padding:10px 0; border:0; outline:0; background:transparent; color:var(--text-1); }
.fee-pro-btn { display:inline-flex; align-items:center; gap:7px; padding:9px 13px; border:1px solid var(--border-card); border-radius:8px; background:var(--bg-card); color:var(--text-1); font-weight:600; cursor:pointer; }
.fee-pro-btn:hover { background:var(--bg-hover); border-color:var(--accent); }
.fee-pro-btn.primary { background:var(--accent); border-color:var(--accent); color:var(--accent-text); }
.fee-pro-btn:disabled { opacity:.55; cursor:not-allowed; }
.fee-pro-summary { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
.fee-pro-card { background:var(--bg-card); border:1px solid var(--border-card); border-radius:10px; padding:16px; }
.fee-pro-summary-label,.fee-pro-muted { color:var(--text-3); font-size:12px; }
.fee-pro-summary-label { text-transform:uppercase; letter-spacing:.07em; font-weight:700; }
.fee-pro-summary-value { margin-top:6px; font-size:22px; font-weight:800; }
.fee-pro-table-wrap { overflow:auto; background:var(--bg-card); border:1px solid var(--border-card); border-radius:10px; }
.fee-pro-table { width:100%; min-width:760px; border-collapse:collapse; }
.fee-pro-table th { padding:12px 15px; text-align:left; color:var(--text-2); background:var(--bg-surface); border-bottom:1px solid var(--border-dim); font-size:12px; font-weight:700; text-transform:uppercase; }
.fee-pro-table td { padding:13px 15px; border-bottom:1px solid var(--border-dim); font-size:14px; }
.fee-pro-table tr:last-child td { border-bottom:0; }
.fee-pro-name { font-weight:700; } .fee-pro-actions { display:flex; gap:4px; }
.fee-pro-icon { display:inline-flex; padding:6px; border:0; border-radius:6px; background:transparent; color:var(--text-2); cursor:pointer; } .fee-pro-icon:hover { background:var(--bg-hover); color:var(--text-1); }
.fee-pro-badge { display:inline-flex; padding:4px 8px; border-radius:999px; background:var(--bg-hover); color:var(--text-2); font-size:11px; font-weight:700; text-transform:capitalize; }
.fee-pro-badge.active { color:var(--success); } .fee-pro-badge.draft { color:var(--warning); } .fee-pro-badge.archived { color:var(--danger); }
.fee-pro-detail { margin-top:18px; } .fee-pro-rule { display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:10px; align-items:center; padding:11px 0; border-bottom:1px solid var(--border-dim); }
.fee-pro-rule:last-child { border-bottom:0; } .fee-pro-total { display:flex; justify-content:space-between; margin-top:14px; font-weight:800; }
.fee-pro-modal-backdrop { position:fixed; inset:0; z-index:60; display:grid; place-items:center; padding:18px; background:var(--overlay); backdrop-filter:blur(7px); }
.fee-pro-modal { width:min(760px,100%); max-height:92vh; overflow:auto; background:var(--bg-card); border:1px solid var(--border-card); border-radius:14px; padding:22px; box-shadow:var(--shadow-overlay); }
.fee-pro-modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; } .fee-pro-modal h3 { margin:0; font-size:18px; }
.fee-pro-form { display:grid; grid-template-columns:1fr 1fr; gap:12px; } .fee-pro-field { display:flex; flex-direction:column; gap:6px; } .fee-pro-field.full { grid-column:1/-1; }
.fee-pro-field label { color:var(--text-2); font-size:12px; font-weight:700; } .fee-pro-field input,.fee-pro-field select { width:100%; padding:10px; border:1px solid var(--border-card); border-radius:8px; background:var(--bg-input); color:var(--text-1); outline:0; }
.fee-pro-field input:focus,.fee-pro-field select:focus { border-color:var(--accent); } .fee-pro-rule-editor { margin-top:18px; padding-top:15px; border-top:1px solid var(--border-dim); }
.fee-pro-rule-editor-row { display:grid; grid-template-columns:1.4fr 1fr 1fr 1fr auto; gap:8px; align-items:center; margin-top:8px; } .fee-pro-check { display:flex; align-items:center; gap:5px; color:var(--text-2); font-size:12px; white-space:nowrap; }
.fee-pro-modal-actions { display:flex; justify-content:flex-end; gap:9px; margin-top:20px; }
@media (max-width:700px) { .fee-pro-summary,.fee-pro-form { grid-template-columns:1fr; } .fee-pro-field.full { grid-column:auto; } .fee-pro-rule-editor-row { grid-template-columns:1fr 1fr; } .fee-pro-search { min-width:100%; max-width:none; } }
`;

export default function FeeStructurePro() {
  const [structures, setStructures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [audit, setAudit] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const [structureRes, categoryRes, groupRes, invoiceRes] =
        await Promise.all([
          getFeeStructures(),
          getFeeCategories(),
          getFeeGroups(),
          getFeeInvoices(),
        ]);
      setStructures(structureRes.data?.data || []);
      setCategories(categoryRes.data?.data || []);
      setGroups(groupRes.data?.data || []);
      setInvoices(invoiceRes.data?.data || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load fee structures",
      );
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (item) => {
    try {
      const [structureRes, auditRes] = await Promise.all([
        getFeeStructure(item.id),
        getFeeAudit(item.id),
      ]);
      setSelected(structureRes.data?.data || item);
      setAudit(auditRes.data?.data || []);
    } catch {
      setSelected(item);
      setAudit([]);
    }
  };
  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm());
    setModal("structure");
    setMessage("");
  };
  const addCategory = async () => {
    const name = window.prompt("New fee category name");
    if (!name?.trim()) return;
    try {
      await createFeeCategory({ name: name.trim() });
      await load();
      setMessage("Fee category saved.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not save fee category",
      );
    }
  };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      structure_name: item.structure_name || "",
      academic_year: item.academic_year || "",
      class_id: item.class_id || "",
      section_id: item.section_id || "",
      effective_start_date: item.effective_start_date || today(),
      effective_end_date: item.effective_end_date || "",
      rules: (item.rules || []).map((rule) => ({ ...rule })),
    });
    setModal("structure");
    setMessage("");
  };
  const updateRule = (index, key, value) =>
    setForm((current) => ({
      ...current,
      rules: current.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, [key]: value } : rule,
      ),
    }));
  const saveStructure = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        class_id: form.class_id || null,
        section_id: form.section_id || null,
      };
      if (editingId) await updateManagedFeeStructure(editingId, payload);
      else await createManagedFeeStructure(payload);
      const saved = editingId;
      setModal(null);
      setEditingId(null);
      await load();
      if (saved) await openDetail({ id: saved });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not save fee structure",
      );
    } finally {
      setBusy(false);
    }
  };
  const changeStatus = async (id, status) => {
    if (!window.confirm(`Set this structure to ${status}?`)) return;
    try {
      await updateFeeStructureStatus(id, status);
      await load();
      if (selected?.id === id) await openDetail({ id });
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update status");
    }
  };
  const duplicate = async (id) => {
    try {
      await duplicateFeeStructure(id);
      await load();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Could not duplicate structure",
      );
    }
  };
  const apply = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await assignFeeStructure({
        fee_structure_id: selected.id,
        student_id: Number(event.target.student_id.value),
        effective_date: event.target.effective_date.value,
        override_amount: event.target.override_amount.value || null,
        override_reason: event.target.override_reason.value || null,
        approval_status: "approved",
      });
      setMessage("Fee structure assigned successfully.");
      setModal(null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not assign structure");
    } finally {
      setBusy(false);
    }
  };
  const invoice = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await createFeeInvoice({
        student_id: Number(event.target.student_id.value),
        fee_structure_id: selected.id,
        fee_structure_version_id: selected.fee_structure_version_id || null,
        academic_year: selected.academic_year,
        due_date: event.target.due_date.value || null,
        items: (selected.rules || []).map((rule) => ({
          fee_rule_id: rule.id,
          line_type: "fee",
          description: rule.name,
          amount: Number(rule.amount),
        })),
      });
      setMessage(
        `Invoice ${result.data?.data?.invoice_number || "created"} generated.`,
      );
      setModal(null);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not generate invoice");
    } finally {
      setBusy(false);
    }
  };
  const payment = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await recordFeePayment(event.target.invoice_id.value, {
        amount: event.target.amount.value,
        payment_method: event.target.payment_method.value,
        provider_reference: event.target.provider_reference.value || null,
        payment_reference: event.target.provider_reference.value || null,
        idempotency_key: crypto.randomUUID(),
      });
      setMessage("Payment recorded and invoice balance updated.");
      setModal(null);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not record payment");
    } finally {
      setBusy(false);
    }
  };
  const printInvoice = async (id) => {
    try {
      const response = await getFeeInvoice(id);
      const invoice = response.data?.data;
      const lines = (invoice.items || [])
        .map(
          (item) =>
            `<tr><td>${item.description}</td><td style="text-align:right">NPR ${Number(item.amount || 0).toLocaleString("en-IN")}</td></tr>`,
        )
        .join("");
      const popup = window.open("", "_blank", "noopener,noreferrer");
      if (!popup) throw new Error("Popup blocked");
      popup.document.write(
        `<!doctype html><html><head><title>${invoice.invoice_number}</title><style>body{font-family:Arial,sans-serif;color:#111;margin:32px}table{width:100%;border-collapse:collapse;margin-top:24px}td{padding:9px;border-bottom:1px solid #ddd}.total{font-weight:bold;text-align:right;margin-top:20px}@media print{body{margin:12mm}}</style></head><body><h1>${invoice.invoice_snapshot?.institution_name || "Institution"}</h1><p>${invoice.invoice_snapshot?.institution_address || ""}</p><h2>${invoice.invoice_snapshot?.invoice_title || "Fee Invoice"}</h2><p>Invoice: ${invoice.invoice_number}<br>Date: ${new Date(invoice.issue_date).toLocaleDateString()}<br>Student: ${invoice.student_name} (${invoice.admission_no || invoice.student_id})<br>Class: ${invoice.class_name || ""} ${invoice.section_name || ""}</p><table>${lines}</table><p class="total">Total: NPR ${Number(invoice.total || 0).toLocaleString("en-IN")}<br>Paid: NPR ${Number(invoice.amount_paid || 0).toLocaleString("en-IN")}<br>Balance: NPR ${(Number(invoice.total || 0) - Number(invoice.amount_paid || 0)).toLocaleString("en-IN")}</p><p>${invoice.invoice_snapshot?.invoice_footer || ""}</p></body></html>`,
      );
      popup.document.close();
      popup.focus();
      popup.print();
    } catch (error) {
      setMessage(error.message || "Unable to print invoice");
    }
  };
  const filtered = useMemo(
    () =>
      structures.filter((item) =>
        `${item.structure_name || ""} ${item.academic_year || ""} ${item.class_name || ""} ${item.status || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [structures, search],
  );
  const total =
    selected?.rules?.reduce((sum, rule) => sum + Number(rule.amount || 0), 0) ||
    0;

  return (
    <>
      <style>{styles}</style>
      <div className="fee-pro">
        <div className="fee-pro-toolbar">
          <div>
            <div className="acc-section-title">Fee Structure</div>
            <div className="fee-pro-muted">
              Versioned pricing, assignment, invoicing, and audit history
            </div>
          </div>
          <div className="fee-pro-actions">
            <button className="fee-pro-btn" onClick={addCategory}>
              <Plus size={16} /> Add fee category
            </button>
            <button className="fee-pro-btn primary" onClick={openCreate}>
              <Plus size={16} /> New structure
            </button>
          </div>
        </div>
        {message && (
          <div
            className="fee-pro-card"
            style={{ marginBottom: 14, color: "var(--text-2)" }}
          >
            {message}
          </div>
        )}
        <div className="fee-pro-summary">
          <div className="fee-pro-card">
            <div className="fee-pro-summary-label">Structures</div>
            <div className="fee-pro-summary-value">{structures.length}</div>
          </div>
          <div className="fee-pro-card">
            <div className="fee-pro-summary-label">Active versions</div>
            <div className="fee-pro-summary-value">
              {structures.filter((item) => item.status === "active").length}
            </div>
          </div>
          <div className="fee-pro-card">
            <div className="fee-pro-summary-label">Open invoices</div>
            <div className="fee-pro-summary-value">
              {invoices.filter((item) => item.status !== "paid").length}
            </div>
          </div>
        </div>
        <div className="fee-pro-toolbar">
          <div className="fee-pro-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by structure, session, class, or status"
            />
          </div>
        </div>
        {busy && !structures.length ? (
          <div className="fee-pro-card">Loading fee structures...</div>
        ) : filtered.length === 0 ? (
          <div
            className="fee-pro-card"
            style={{ textAlign: "center", padding: 42 }}
          >
            <FileText size={28} />
            <div className="fee-pro-muted">No fee structures found.</div>
          </div>
        ) : (
          <div className="fee-pro-table-wrap">
            <table className="fee-pro-table">
              <thead>
                <tr>
                  <th>Structure</th>
                  <th>Scope</th>
                  <th>Version</th>
                  <th>Base total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="fee-pro-name">
                        {item.structure_name ||
                          item.category_name ||
                          "Fee structure"}
                      </div>
                      <div className="fee-pro-muted">
                        {item.academic_year || "No session"}
                      </div>
                    </td>
                    <td>
                      {item.class_name || "All classes"}
                      {item.section_name ? ` / ${item.section_name}` : ""}
                    </td>
                    <td>v{item.version || 1}</td>
                    <td>{npr(item.amount)}</td>
                    <td>
                      <span
                        className={`fee-pro-badge ${item.status || "draft"}`}
                      >
                        {item.status || "draft"}
                      </span>
                    </td>
                    <td>
                      <div className="fee-pro-actions">
                        <button
                          className="fee-pro-icon"
                          title="Open"
                          onClick={() => openDetail(item)}
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          className="fee-pro-icon"
                          title="Edit as new version"
                          onClick={() => openEdit(item)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="fee-pro-icon"
                          title="Duplicate"
                          onClick={() => duplicate(item.id)}
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          className="fee-pro-icon"
                          title="Activate/deactivate"
                          onClick={() =>
                            changeStatus(
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
                          className="fee-pro-icon"
                          title="Archive"
                          onClick={() => changeStatus(item.id, "archived")}
                        >
                          <Archive size={15} />
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
          <div className="fee-pro-card fee-pro-detail">
            <div className="fee-pro-toolbar">
              <div>
                <div className="fee-pro-name">{selected.structure_name}</div>
                <div className="fee-pro-muted">
                  {selected.academic_year} ·{" "}
                  {selected.class_name || "All classes"}
                  {selected.section_name ? ` · ${selected.section_name}` : ""} ·
                  Version {selected.version || 1}
                </div>
              </div>
              <button
                className="fee-pro-icon"
                onClick={() => setSelected(null)}
              >
                <X size={18} />
              </button>
            </div>
            {(selected.rules || []).map((rule) => (
              <div className="fee-pro-rule" key={rule.id}>
                <span className="fee-pro-name">{rule.name}</span>
                <span>{rule.frequency}</span>
                <span>{rule.mandatory ? "Mandatory" : "Optional"}</span>
                <span>{npr(rule.amount)}</span>
              </div>
            ))}
            <div className="fee-pro-total">
              <span>Estimated configured total</span>
              <span>{npr(total)}</span>
            </div>
            <div
              className="fee-pro-toolbar"
              style={{ marginTop: 16, justifyContent: "flex-start" }}
            >
              <button
                className="fee-pro-btn"
                disabled={selected.status !== "active"}
                onClick={() => setModal("apply")}
              >
                <UserPlus size={15} /> Apply to student
              </button>
              <button
                className="fee-pro-btn"
                onClick={() => setModal("invoice")}
              >
                <FileText size={15} /> Generate invoice
              </button>
              <button className="fee-pro-btn" onClick={() => setModal("audit")}>
                <History size={15} /> Audit history
              </button>
            </div>
            {modal === "audit" && (
              <div className="fee-pro-card" style={{ marginTop: 12 }}>
                {audit.length ? (
                  audit.map((entry) => (
                    <div className="fee-pro-muted" key={entry.id}>
                      {entry.action} ·{" "}
                      {new Date(entry.created_at).toLocaleString()}
                    </div>
                  ))
                ) : (
                  <div className="fee-pro-muted">No audit events yet.</div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="fee-pro-card" style={{ marginTop: 18 }}>
          <div className="fee-pro-toolbar">
            <div className="fee-pro-name">Invoice activity</div>
            <button
              className="fee-pro-btn"
              onClick={() => setModal("payment")}
              disabled={!invoices.length}
            >
              <Check size={15} /> Record payment
            </button>
          </div>
          {invoices.slice(0, 5).map((item) => (
            <div className="fee-pro-rule" key={item.id}>
              <span className="fee-pro-name">{item.invoice_number}</span>
              <span>{item.student_name || `Student ${item.student_id}`}</span>
              <span>{item.status}</span>
              <span>
                {npr(Number(item.total) - Number(item.amount_paid))} due
              </span>
              <button
                className="fee-pro-btn"
                type="button"
                onClick={() => printInvoice(item.id)}
              >
                Print
              </button>
            </div>
          ))}
          {!invoices.length && (
            <div className="fee-pro-muted">
              Invoices generated from this tab will appear here.
            </div>
          )}
        </div>
      </div>
      {modal && modal !== "audit" && (
        <div className="fee-pro-modal-backdrop">
          <form
            className="fee-pro-modal"
            onSubmit={
              modal === "structure"
                ? saveStructure
                : modal === "apply"
                  ? apply
                  : modal === "invoice"
                    ? invoice
                    : payment
            }
          >
            <div className="fee-pro-modal-head">
              <h3>
                {modal === "structure"
                  ? editingId
                    ? "Edit fee structure · new version"
                    : "Create fee structure"
                  : modal === "apply"
                    ? "Apply structure to student"
                    : modal === "invoice"
                      ? "Generate itemized invoice"
                      : "Record invoice payment"}
              </h3>
              <button
                type="button"
                className="fee-pro-icon"
                onClick={() => setModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            {modal === "structure" && (
              <>
                <div className="fee-pro-form">
                  <div className="fee-pro-field full">
                    <label>Structure name</label>
                    <input
                      required
                      value={form.structure_name}
                      onChange={(event) =>
                        setForm({ ...form, structure_name: event.target.value })
                      }
                      placeholder="2026/27 Grade 10 annual plan"
                    />
                  </div>
                  <div className="fee-pro-field">
                    <label>Academic session</label>
                    <input
                      required
                      value={form.academic_year}
                      onChange={(event) =>
                        setForm({ ...form, academic_year: event.target.value })
                      }
                      placeholder="2026/27"
                    />
                  </div>
                  <div className="fee-pro-field">
                    <label>Class ID</label>
                    <input
                      type="number"
                      value={form.class_id}
                      onChange={(event) =>
                        setForm({ ...form, class_id: event.target.value })
                      }
                    />
                  </div>
                  <div className="fee-pro-field">
                    <label>Section ID (optional)</label>
                    <input
                      type="number"
                      value={form.section_id}
                      onChange={(event) =>
                        setForm({ ...form, section_id: event.target.value })
                      }
                    />
                  </div>
                  <div className="fee-pro-field">
                    <label>Effective start</label>
                    <input
                      type="date"
                      value={form.effective_start_date}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          effective_start_date: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="fee-pro-field">
                    <label>Effective end</label>
                    <input
                      type="date"
                      value={form.effective_end_date}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          effective_end_date: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="fee-pro-rule-editor">
                  <div className="fee-pro-toolbar">
                    <strong>Fee rules</strong>
                    <button
                      type="button"
                      className="fee-pro-btn"
                      onClick={() =>
                        setForm({
                          ...form,
                          rules: [...form.rules, { ...emptyRule }],
                        })
                      }
                    >
                      <Plus size={14} /> Add category
                    </button>
                  </div>
                  {form.rules.map((rule, index) => (
                    <div className="fee-pro-rule-editor-row" key={index}>
                      <input
                        required
                        placeholder="Fee name"
                        value={rule.name}
                        onChange={(event) =>
                          updateRule(index, "name", event.target.value)
                        }
                      />
                      <input
                        required
                        min="0"
                        step="0.01"
                        type="number"
                        placeholder="Amount"
                        value={rule.amount}
                        onChange={(event) =>
                          updateRule(index, "amount", event.target.value)
                        }
                      />
                      <select
                        value={rule.category_id || ""}
                        onChange={(event) =>
                          updateRule(index, "category_id", event.target.value)
                        }
                      >
                        <option value="">Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={rule.frequency}
                        onChange={(event) =>
                          updateRule(index, "frequency", event.target.value)
                        }
                      >
                        <option value="monthly">Monthly</option>
                        <option value="term">Term-wise</option>
                        <option value="annual">Annual</option>
                        <option value="one_time">One-time</option>
                      </select>
                      <button
                        type="button"
                        className="fee-pro-icon"
                        disabled={form.rules.length === 1}
                        onClick={() =>
                          setForm({
                            ...form,
                            rules: form.rules.filter(
                              (_, ruleIndex) => ruleIndex !== index,
                            ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                      <label className="fee-pro-check">
                        <input
                          type="checkbox"
                          checked={rule.mandatory}
                          onChange={(event) =>
                            updateRule(index, "mandatory", event.target.checked)
                          }
                        />{" "}
                        Mandatory
                      </label>
                      <label className="fee-pro-check">
                        <input
                          type="checkbox"
                          checked={rule.taxable}
                          onChange={(event) =>
                            updateRule(index, "taxable", event.target.checked)
                          }
                        />{" "}
                        Taxable
                      </label>
                      <label className="fee-pro-check">
                        <input
                          type="checkbox"
                          checked={rule.refundable}
                          onChange={(event) =>
                            updateRule(
                              index,
                              "refundable",
                              event.target.checked,
                            )
                          }
                        />{" "}
                        Refundable
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}
            {modal === "apply" && (
              <div className="fee-pro-form">
                <div className="fee-pro-field">
                  <label>Student ID</label>
                  <input name="student_id" required type="number" min="1" />
                </div>
                <div className="fee-pro-field">
                  <label>Effective date</label>
                  <input
                    name="effective_date"
                    required
                    type="date"
                    defaultValue={today()}
                  />
                </div>
                <div className="fee-pro-field">
                  <label>Override amount (optional)</label>
                  <input
                    name="override_amount"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="fee-pro-field full">
                  <label>Override reason (required when overriding)</label>
                  <input name="override_reason" />
                </div>
              </div>
            )}
            {modal === "invoice" && (
              <div className="fee-pro-form">
                <div className="fee-pro-field">
                  <label>Student ID</label>
                  <input name="student_id" required type="number" min="1" />
                </div>
                <div className="fee-pro-field">
                  <label>Due date</label>
                  <input name="due_date" type="date" />
                </div>
                <div className="fee-pro-field full">
                  <label>Invoice items</label>
                  <div className="fee-pro-card">
                    {(selected?.rules || []).map((rule) => (
                      <div className="fee-pro-rule" key={rule.id}>
                        <span>{rule.name}</span>
                        <span>{rule.frequency}</span>
                        <span>{rule.mandatory ? "Required" : "Optional"}</span>
                        <span>{npr(rule.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {modal === "payment" && (
              <div className="fee-pro-form">
                <div className="fee-pro-field full">
                  <label>Invoice</label>
                  <select name="invoice_id" required defaultValue="">
                    <option value="" disabled>
                      Select invoice
                    </option>
                    {invoices
                      .filter((item) => item.status !== "paid")
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.invoice_number} ·{" "}
                          {item.student_name || item.student_id} ·{" "}
                          {npr(Number(item.total) - Number(item.amount_paid))}{" "}
                          due
                        </option>
                      ))}
                  </select>
                </div>
                <div className="fee-pro-field">
                  <label>Amount</label>
                  <input
                    name="amount"
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="fee-pro-field">
                  <label>Payment method</label>
                  <select name="payment_method" defaultValue="cash">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="cheque">Cheque</option>
                    <option value="esewa">eSewa</option>
                    <option value="khalti">Khalti</option>
                    <option value="connectips">ConnectIPS</option>
                  </select>
                </div>
                <div className="fee-pro-field full">
                  <label>Provider/reference number</label>
                  <input name="provider_reference" />
                </div>
              </div>
            )}
            <div className="fee-pro-modal-actions">
              <button
                type="button"
                className="fee-pro-btn"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button className="fee-pro-btn primary" disabled={busy}>
                {busy
                  ? "Saving..."
                  : modal === "structure"
                    ? "Save structure"
                    : modal === "apply"
                      ? "Apply structure"
                      : modal === "invoice"
                        ? "Generate invoice"
                        : "Record payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
