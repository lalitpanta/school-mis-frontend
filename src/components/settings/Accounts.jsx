/**
 * Accounts Module
 * Matches the design from accounts-section.html:
 *   - Dark sidebar color palette (#0d0f1e / #11141f) carried into the page
 *   - Violet accent (#7c6cf6 / #9b8dfa)
 *   - Tabs: Overview · Fee collection · Expenses · Payroll · Invoices & receipts
 *   - Overview: balance card, 4 stat mini-cards, collection %, info row,
 *               recent-transactions table, collection-by-class bars, expense pie
 */

import { useState, useEffect, useCallback } from "react";
import {
  getAccountsOverview,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getExpenseBreakdown,
  getCollectionByClass,
  getPayroll,
  createPayroll,
  updatePayrollStatus,
  exportAccountsCsv,
} from "../../api/accountsApi";

// ── tiny helpers ─────────────────────────────────────────────────────────────

const fmt = (n) =>
  "Rs. " +
  Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

const fmtShort = (n) => {
  n = Number(n || 0);
  if (n >= 1_00_000) return `Rs. ${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1000)    return `Rs. ${(n / 1000).toFixed(1)}K`;
  return fmt(n);
};

const STATUS_COLOR = {
  paid:    { bg: "rgba(16,185,129,.15)", color: "#10b981" },
  partial: { bg: "rgba(245,158,11,.15)", color: "#f59e0b" },
  overdue: { bg: "rgba(244,63,94,.15)",  color: "#f43f5e" },
  pending: { bg: "rgba(148,163,184,.15)",color: "#94a3b8" },
};

const TYPE_LABEL = { income: "Income", expense: "Expense" };

const TABS = [
  "Overview",
  "Fee Collection",
  "Expenses",
  "Payroll",
  "Transactions",
];

// ── CSS injected once ────────────────────────────────────────────────────────
const CSS = `
.acc-page {
  --ac-bg:      #0d0f1e;
  --ac-panel:   #11141f;
  --ac-panel2:  #151827;
  --ac-hover:   #1b1f30;
  --ac-border:  #1e2234;
  --ac-v500:    #7c6cf6;
  --ac-v400:    #9b8dfa;
  --ac-vglow:   rgba(124,108,246,.25);
  --ac-hi:      #eef0fa;
  --ac-mid:     #a6acc4;
  --ac-low:     #6b7290;
  --ac-green:   #10b981;
  --ac-amber:   #f59e0b;
  --ac-red:     #f43f5e;
  font-family: 'Inter', sans-serif;
  color: var(--ac-hi);
  min-height: 100%;
  padding: 0;
}

/* ── top header ── */
.acc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22px 28px 0;
  flex-wrap: wrap; gap: 12px;
}
.acc-header-left {}
.acc-breadcrumb {
  font-size: 11.5px; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; color: var(--ac-low); margin-bottom: 4px;
}
.acc-title {
  font-size: 22px; font-weight: 800; color: var(--ac-hi);
  font-family: 'Sora', sans-serif; letter-spacing: -.3px;
}
.acc-header-right { display: flex; gap: 10px; flex-wrap: wrap; }

/* ── tabs ── */
.acc-tabs {
  display: flex; gap: 4px;
  padding: 16px 28px 0;
  border-bottom: 1px solid var(--ac-border);
  overflow-x: auto;
}
.acc-tab {
  padding: 9px 18px; border-radius: 8px 8px 0 0;
  font-size: 13.5px; font-weight: 600;
  cursor: pointer; border: none; background: transparent;
  color: var(--ac-low);
  transition: color .15s, background .15s;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.acc-tab:hover { color: var(--ac-mid); }
.acc-tab.active {
  color: var(--ac-v400);
  border-bottom-color: var(--ac-v500);
  background: rgba(124,108,246,.06);
}

/* ── body ── */
.acc-body { padding: 24px 28px 32px; }

/* ── stat card ── */
.acc-stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.acc-big-card {
  background: linear-gradient(135deg, rgba(124,108,246,.2), rgba(77,63,240,.08));
  border: 1px solid rgba(124,108,246,.3);
  border-radius: 14px;
  padding: 22px 24px;
  position: relative; overflow: hidden;
}
.acc-big-card-label {
  font-size: 12px; font-weight: 600; letter-spacing: .8px;
  text-transform: uppercase; color: var(--ac-v400); margin-bottom: 8px;
}
.acc-big-card-value {
  font-size: 28px; font-weight: 800; color: #fff;
  font-family: 'Sora', sans-serif; letter-spacing: -.5px;
}
.acc-big-card-trend {
  font-size: 12px; color: var(--ac-green); margin-top: 6px;
}
.acc-big-card-glow {
  position: absolute; right: -20px; top: -20px;
  width: 120px; height: 120px; border-radius: 50%;
  background: radial-gradient(circle, rgba(124,108,246,.35) 0%, transparent 70%);
  pointer-events: none;
}

.acc-mini-card {
  background: var(--ac-panel);
  border: 1px solid var(--ac-border);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex; justify-content: space-between; align-items: flex-start;
}
.acc-mini-label {
  font-size: 12px; color: var(--ac-low); font-weight: 600;
  letter-spacing: .5px; margin-bottom: 6px;
}
.acc-mini-value {
  font-size: 17px; font-weight: 700; color: var(--ac-hi);
  font-family: 'Sora', sans-serif;
}

.acc-info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.acc-info-card {
  background: var(--ac-panel);
  border: 1px solid var(--ac-border);
  border-radius: 12px;
  padding: 16px 18px;
}
.acc-info-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .8px; color: var(--ac-low); margin-bottom: 4px;
}
.acc-info-num {
  font-size: 20px; font-weight: 800; color: var(--ac-hi);
  font-family: 'Sora', sans-serif;
}
.acc-info-sub {
  font-size: 11.5px; color: var(--ac-low); margin-top: 3px;
}
.acc-info-badge {
  display: inline-block; padding: 2px 8px; border-radius: 20px;
  font-size: 11px; font-weight: 600; margin-top: 6px;
}

/* ── progress bar ── */
.acc-progress-wrap {
  background: var(--ac-panel);
  border: 1px solid var(--ac-border);
  border-radius: 12px;
  padding: 20px 24px;
  margin-top: 16px;
  display: flex; align-items: center; gap: 20px;
}
.acc-progress-pct {
  font-size: 36px; font-weight: 800;
  color: var(--ac-v400); font-family: 'Sora', sans-serif;
  white-space: nowrap;
}
.acc-progress-bar-track {
  flex: 1; height: 8px; border-radius: 999px;
  background: var(--ac-hover);
}
.acc-progress-bar-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--ac-v500), var(--ac-v400));
  transition: width .5s ease;
}
.acc-progress-label {
  font-size: 13.5px; color: var(--ac-mid); line-height: 1.5;
}

/* ── section heading ── */
.acc-section-row {
  display: flex; align-items: center; justify-content: space-between;
  margin: 24px 0 12px;
}
.acc-section-title {
  font-size: 15px; font-weight: 700; color: var(--ac-hi);
}
.acc-link-btn {
  font-size: 12.5px; font-weight: 600;
  color: var(--ac-v400); background: none; border: none;
  cursor: pointer; padding: 0;
  font-family: 'Inter', sans-serif;
  transition: color .15s;
}
.acc-link-btn:hover { color: var(--ac-hi); }

/* ── table ── */
.acc-table-wrap {
  background: var(--ac-panel);
  border: 1px solid var(--ac-border);
  border-radius: 14px;
  overflow: hidden;
}
.acc-table {
  width: 100%; border-collapse: collapse;
  font-size: 13.5px;
}
.acc-table thead th {
  padding: 12px 16px; text-align: left;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .8px; color: var(--ac-low);
  background: rgba(255,255,255,.02);
  border-bottom: 1px solid var(--ac-border);
}
.acc-table tbody tr {
  border-bottom: 1px solid var(--ac-border);
  transition: background .12s;
}
.acc-table tbody tr:last-child { border-bottom: none; }
.acc-table tbody tr:hover { background: rgba(255,255,255,.02); }
.acc-table tbody td {
  padding: 13px 16px; vertical-align: middle;
  color: var(--ac-mid);
}
.acc-table .cell-main { color: var(--ac-hi); font-weight: 600; }
.acc-table .cell-sub  { font-size: 12px; color: var(--ac-low); margin-top: 2px; }
.acc-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 11.5px; font-weight: 600;
}
.acc-amount-pos { color: var(--ac-green); font-weight: 700; }
.acc-amount-neg { color: var(--ac-red);   font-weight: 700; }

/* ── two-col layout ── */
.acc-two-col {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
@media (max-width: 900px) { .acc-two-col { grid-template-columns: 1fr; } }

/* ── bar chart (collection by class) ── */
.acc-bar-list { display: flex; flex-direction: column; gap: 14px; }
.acc-bar-row { display: flex; flex-direction: column; gap: 5px; }
.acc-bar-meta {
  display: flex; justify-content: space-between;
  font-size: 12.5px; color: var(--ac-mid);
}
.acc-bar-track {
  height: 7px; border-radius: 999px; background: var(--ac-hover);
}
.acc-bar-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--ac-v500), var(--ac-v400));
  transition: width .5s ease;
}

/* ── expense donut / list ── */
.acc-expense-list { display: flex; flex-direction: column; gap: 12px; }
.acc-expense-row {
  display: flex; align-items: center; gap: 12px;
}
.acc-expense-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.acc-expense-name { flex: 1; font-size: 13.5px; color: var(--ac-mid); }
.acc-expense-val  { font-size: 13.5px; font-weight: 700; color: var(--ac-hi); }

/* ── action buttons ── */
.acc-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 16px; border-radius: 9px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: 'Inter', sans-serif; border: none;
  transition: opacity .15s, transform .1s;
}
.acc-btn:hover   { opacity: .88; transform: translateY(-1px); }
.acc-btn:active  { transform: translateY(0); }
.acc-btn-primary {
  background: linear-gradient(135deg, var(--ac-v500), #4d3ff0);
  color: #fff;
  box-shadow: 0 4px 12px var(--ac-vglow);
}
.acc-btn-ghost {
  background: var(--ac-panel);
  border: 1px solid var(--ac-border);
  color: var(--ac-mid);
}
.acc-btn-danger {
  background: rgba(244,63,94,.12);
  border: 1px solid rgba(244,63,94,.3);
  color: var(--ac-red);
}

/* ── modal ── */
.acc-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 24px;
}
.acc-modal {
  background: #181c2e;
  border: 1px solid var(--ac-border);
  border-radius: 16px;
  padding: 28px;
  width: 100%; max-width: 520px;
  max-height: 90vh; overflow-y: auto;
}
.acc-modal-title {
  font-size: 17px; font-weight: 800;
  color: var(--ac-hi); margin-bottom: 20px;
  font-family: 'Sora', sans-serif;
}
.acc-form-row { margin-bottom: 14px; }
.acc-label {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--ac-low); text-transform: uppercase;
  letter-spacing: .6px; margin-bottom: 6px;
}
.acc-input, .acc-select, .acc-textarea {
  width: 100%; padding: 10px 13px;
  background: var(--ac-panel2);
  border: 1px solid var(--ac-border);
  border-radius: 8px;
  font-size: 13.5px; color: var(--ac-hi);
  font-family: 'Inter', sans-serif;
  outline: none; transition: border-color .15s;
  box-sizing: border-box;
}
.acc-input:focus, .acc-select:focus, .acc-textarea:focus {
  border-color: var(--ac-v500);
}
.acc-select option { background: #181c2e; }
.acc-textarea { resize: vertical; min-height: 72px; }
.acc-modal-footer {
  display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;
}

/* ── empty + loading ── */
.acc-empty {
  text-align: center; padding: 48px 24px;
  color: var(--ac-low); font-size: 14px;
}
.acc-spinner {
  display: inline-block; width: 20px; height: 20px;
  border: 2px solid var(--ac-border);
  border-top-color: var(--ac-v500);
  border-radius: 50%;
  animation: acc-spin .7s linear infinite;
}
@keyframes acc-spin { to { transform: rotate(360deg); } }

/* ── flow steps ── */
.acc-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 16px; }
.acc-step {
  background: var(--ac-panel);
  border: 1px solid var(--ac-border);
  border-radius: 12px;
  padding: 20px;
}
.acc-step-num {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, var(--ac-v500), #4d3ff0);
  color: #fff; font-size: 13px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 10px;
  font-family: 'Sora', sans-serif;
}
.acc-step-title {
  font-size: 14px; font-weight: 700; color: var(--ac-hi); margin-bottom: 6px;
}
.acc-step-desc { font-size: 13px; color: var(--ac-low); line-height: 1.5; }

.acc-grid-top { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; }
@media (max-width: 860px) { .acc-grid-top { grid-template-columns: 1fr; } }
`;

// ── sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return (
    <span className="acc-badge" style={{ background: s.bg, color: s.color }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Spinner() {
  return (
    <div className="acc-empty">
      <span className="acc-spinner" />
    </div>
  );
}

// ── Transaction form modal ────────────────────────────────────────────────────

const TXN_DEFAULTS = {
  txn_date: new Date().toISOString().split("T")[0],
  particulars: "",
  sub_text: "",
  category: "",
  txn_type: "income",
  amount: "",
  payment_mode: "cash",
  status: "paid",
  notes: "",
};

function TransactionModal({ open, onClose, onSaved, initial }) {
  const [form, setForm] = useState(TXN_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) setForm(initial ? { ...TXN_DEFAULTS, ...initial } : TXN_DEFAULTS);
    setErr("");
  }, [open, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.particulars.trim()) return setErr("Particulars is required");
    if (!form.amount || isNaN(form.amount)) return setErr("Valid amount is required");
    if (!form.category.trim()) return setErr("Category is required");
    setSaving(true);
    setErr("");
    try {
      if (initial?.id) {
        await updateTransaction(initial.id, form);
      } else {
        await createTransaction(form);
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="acc-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="acc-modal">
        <div className="acc-modal-title">
          {initial?.id ? "Edit Transaction" : "Record Transaction"}
        </div>
        <form onSubmit={submit}>
          <div className="acc-form-row">
            <label className="acc-label">Type</label>
            <select className="acc-select" value={form.txn_type} onChange={(e) => set("txn_type", e.target.value)}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div className="acc-form-row">
            <label className="acc-label">Date</label>
            <input className="acc-input" type="date" value={form.txn_date} onChange={(e) => set("txn_date", e.target.value)} />
          </div>
          <div className="acc-form-row">
            <label className="acc-label">Particulars *</label>
            <input className="acc-input" placeholder="e.g. Aarav Shrestha — Term 2 fee" value={form.particulars} onChange={(e) => set("particulars", e.target.value)} />
          </div>
          <div className="acc-form-row">
            <label className="acc-label">Sub-text / Detail</label>
            <input className="acc-input" placeholder="e.g. Grade 8B · Term 2 fee" value={form.sub_text} onChange={(e) => set("sub_text", e.target.value)} />
          </div>
          <div className="acc-form-row">
            <label className="acc-label">Category *</label>
            <input className="acc-input" placeholder="e.g. Tuition fee, Utilities, Transport…" value={form.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="acc-form-row">
            <label className="acc-label">Amount (Rs.) *</label>
            <input className="acc-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="acc-form-row">
              <label className="acc-label">Payment Mode</label>
              <select className="acc-select" value={form.payment_mode} onChange={(e) => set("payment_mode", e.target.value)}>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="acc-form-row">
              <label className="acc-label">Status</label>
              <select className="acc-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="acc-form-row">
            <label className="acc-label">Notes</label>
            <textarea className="acc-textarea" placeholder="Optional notes…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          {err && <p style={{ color: "#f43f5e", fontSize: 13, marginBottom: 8 }}>{err}</p>}
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary" disabled={saving}>
              {saving ? <span className="acc-spinner" style={{ width: 14, height: 14 }} /> : (initial?.id ? "Update" : "Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Payroll form modal ────────────────────────────────────────────────────────

const PAY_DEFAULTS = {
  employee_name: "", employee_type: "staff",
  pay_month: "", basic_salary: "", allowances: "", deductions: "",
  payment_mode: "bank", notes: "",
};

function PayrollModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(PAY_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) { setForm(PAY_DEFAULTS); setErr(""); }
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.employee_name.trim()) return setErr("Employee name is required");
    if (!form.pay_month.trim())     return setErr("Pay month is required");
    if (!form.basic_salary || isNaN(form.basic_salary)) return setErr("Valid salary required");
    setSaving(true); setErr("");
    try {
      await createPayroll({
        ...form,
        employee_id: crypto.randomUUID(),
        basic_salary: parseFloat(form.basic_salary),
        allowances:   parseFloat(form.allowances)  || 0,
        deductions:   parseFloat(form.deductions)  || 0,
      });
      onSaved(); onClose();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="acc-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="acc-modal">
        <div className="acc-modal-title">Add Payroll Entry</div>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="acc-form-row">
              <label className="acc-label">Employee Name *</label>
              <input className="acc-input" value={form.employee_name} onChange={(e) => set("employee_name", e.target.value)} />
            </div>
            <div className="acc-form-row">
              <label className="acc-label">Type</label>
              <select className="acc-select" value={form.employee_type} onChange={(e) => set("employee_type", e.target.value)}>
                <option value="teacher">Teacher</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="acc-form-row">
            <label className="acc-label">Pay Month *</label>
            <input className="acc-input" placeholder="e.g. Shrawan 2082" value={form.pay_month} onChange={(e) => set("pay_month", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="acc-form-row">
              <label className="acc-label">Basic (Rs.) *</label>
              <input className="acc-input" type="number" min="0" value={form.basic_salary} onChange={(e) => set("basic_salary", e.target.value)} />
            </div>
            <div className="acc-form-row">
              <label className="acc-label">Allowances</label>
              <input className="acc-input" type="number" min="0" value={form.allowances} onChange={(e) => set("allowances", e.target.value)} />
            </div>
            <div className="acc-form-row">
              <label className="acc-label">Deductions</label>
              <input className="acc-input" type="number" min="0" value={form.deductions} onChange={(e) => set("deductions", e.target.value)} />
            </div>
          </div>
          <div className="acc-form-row">
            <label className="acc-label">Payment Mode</label>
            <select className="acc-select" value={form.payment_mode} onChange={(e) => set("payment_mode", e.target.value)}>
              <option value="bank">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div className="acc-form-row">
            <label className="acc-label">Notes</label>
            <textarea className="acc-textarea" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          {err && <p style={{ color: "#f43f5e", fontSize: 13, marginBottom: 8 }}>{err}</p>}
          <div className="acc-modal-footer">
            <button type="button" className="acc-btn acc-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="acc-btn acc-btn-primary" disabled={saving}>
              {saving ? <span className="acc-spinner" style={{ width: 14, height: 14 }} /> : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ overview, collections, expenses, transactions, onNewTxn }) {
  if (!overview) return <Spinner />;

  const {
    balance_in_hand, income_this_month, expense_this_month,
    fees_outstanding, fees_collected, income_trend,
    collection_pct, students_billed, payments_overdue,
    avg_days_late, staff_on_payroll, scholarships_count, scholarships_total,
  } = overview;

  const trendPositive = income_trend >= 0;

  return (
    <>
      {/* ── top cards ── */}
      <div className="acc-grid-top">
        {/* Balance card */}
        <div className="acc-big-card">
          <div className="acc-big-card-glow" />
          <div className="acc-big-card-label">Balance in Hand</div>
          <div className="acc-big-card-value">{fmt(balance_in_hand)}</div>
          <div className="acc-big-card-trend" style={{ color: trendPositive ? "var(--ac-green)" : "var(--ac-red)" }}>
            {trendPositive ? "▲" : "▼"} {fmt(Math.abs(income_trend))} since last month
          </div>
          {/* mini sub-stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            {[
              { label: "Income this month",  val: fmt(income_this_month)  },
              { label: "Expenses this month",val: fmt(expense_this_month) },
              { label: "Fees outstanding",   val: fmt(fees_outstanding)   },
              { label: "Fees collected",     val: fmt(fees_collected)     },
            ].map(({ label, val }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,.04)", borderRadius: 9,
                padding: "10px 14px", border: "1px solid rgba(255,255,255,.06)"
              }}>
                <div style={{ fontSize: 11, color: "var(--ac-low)", fontWeight: 600, letterSpacing: ".5px", marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Sora', sans-serif" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection progress */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="acc-progress-wrap" style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
              <div className="acc-progress-pct">{collection_pct}%</div>
              <div className="acc-progress-label">of this term's fees have been collected</div>
            </div>
            <div className="acc-progress-bar-track" style={{ width: "100%" }}>
              <div className="acc-progress-bar-fill" style={{ width: `${collection_pct}%` }} />
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { n: 1, title: "Fee billed",      desc: "System generates a fee slip per student." },
              { n: 2, title: "Parent pays",     desc: "Payment recorded and receipt issued." },
              { n: 3, title: "Ledger updates",  desc: "Account and class collection rate update instantly." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="acc-step">
                <div className="acc-step-num">{n}</div>
                <div className="acc-step-title">{title}</div>
                <div className="acc-step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── info cards row ── */}
      <div className="acc-info-grid">
        <div className="acc-info-card">
          <div className="acc-info-title">Students Billed</div>
          <div className="acc-info-num">{students_billed.toLocaleString()}</div>
        </div>
        <div className="acc-info-card">
          <div className="acc-info-title">Payments Overdue</div>
          <div className="acc-info-num">{payments_overdue}</div>
          <div className="acc-info-sub">{avg_days_late} days avg. late</div>
        </div>
        <div className="acc-info-card">
          <div className="acc-info-title">Staff on Payroll</div>
          <div className="acc-info-num">{staff_on_payroll}</div>
        </div>
        <div className="acc-info-card">
          <div className="acc-info-title">Scholarships Active</div>
          <div className="acc-info-num">{scholarships_count}</div>
          <div className="acc-info-sub">{fmt(scholarships_total)} waived</div>
        </div>
      </div>

      {/* ── recent transactions + charts ── */}
      <div className="acc-section-row">
        <div className="acc-section-title">Recent Transactions</div>
        <button className="acc-link-btn" onClick={onNewTxn}>+ Record payment</button>
      </div>

      <div className="acc-table-wrap">
        <table className="acc-table">
          <thead>
            <tr>
              <th>Particulars</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr><td colSpan={4} className="acc-empty" style={{ padding: "24px 16px" }}>No transactions yet. Record your first one above.</td></tr>
            )}
            {transactions.slice(0, 8).map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="cell-main">{t.particulars}</div>
                  {t.sub_text && <div className="cell-sub">{t.sub_text}</div>}
                </td>
                <td>{t.expense_category_name || t.category}</td>
                <td>
                  <span className={t.txn_type === "income" ? "acc-amount-pos" : "acc-amount-neg"}>
                    {t.txn_type === "income" ? "+ " : "− "}{fmt(t.amount)}
                  </span>
                </td>
                <td><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── collection by class + expense breakdown ── */}
      <div className="acc-two-col" style={{ marginTop: 20 }}>
        {/* Collection by class */}
        <div className="acc-table-wrap" style={{ padding: "20px 22px" }}>
          <div className="acc-section-row" style={{ marginTop: 0 }}>
            <div className="acc-section-title">Collection by Class</div>
          </div>
          <div className="acc-bar-list">
            {collections.length === 0 && <div className="acc-empty">No class data yet.</div>}
            {collections.map((c) => (
              <div key={c.class_name} className="acc-bar-row">
                <div className="acc-bar-meta">
                  <span>{c.class_name}</span>
                  <span style={{ color: "var(--ac-v400)", fontWeight: 700 }}>{c.pct}%</span>
                </div>
                <div className="acc-bar-track">
                  <div className="acc-bar-fill" style={{ width: `${Math.min(c.pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense breakdown */}
        <div className="acc-table-wrap" style={{ padding: "20px 22px" }}>
          <div className="acc-section-row" style={{ marginTop: 0 }}>
            <div className="acc-section-title">Where Expenses Go</div>
          </div>
          <div className="acc-expense-list">
            {expenses.length === 0 && <div className="acc-empty">No expense data yet.</div>}
            {expenses.map((e) => (
              <div key={e.category} className="acc-expense-row">
                <span className="acc-expense-dot" style={{ background: e.color }} />
                <span className="acc-expense-name">{e.category}</span>
                <span className="acc-expense-val">{fmt(e.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Transactions tab ──────────────────────────────────────────────────────────

function TransactionsTab({ transactions, total, loading, onNew, onEdit, onDelete, onFilter, filter }) {
  return (
    <>
      <div className="acc-section-row" style={{ marginTop: 0 }}>
        <div className="acc-section-title">All Transactions</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            className="acc-select"
            style={{ width: "auto", padding: "7px 12px" }}
            value={filter.txn_type || ""}
            onChange={(e) => onFilter({ ...filter, txn_type: e.target.value || undefined })}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            className="acc-select"
            style={{ width: "auto", padding: "7px 12px" }}
            value={filter.status || ""}
            onChange={(e) => onFilter({ ...filter, status: e.target.value || undefined })}
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
          </select>
          <button className="acc-btn acc-btn-primary" onClick={onNew}>+ Add</button>
        </div>
      </div>

      <div className="acc-table-wrap">
        <table className="acc-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8}><Spinner /></td></tr>}
            {!loading && transactions.length === 0 && (
              <tr><td colSpan={8} className="acc-empty">No transactions found.</td></tr>
            )}
            {transactions.map((t) => (
              <tr key={t.id}>
                <td style={{ whiteSpace: "nowrap" }}>{t.txn_date?.slice(0, 10)}</td>
                <td>
                  <div className="cell-main">{t.particulars}</div>
                  {t.sub_text && <div className="cell-sub">{t.sub_text}</div>}
                </td>
                <td>{t.expense_category_name || t.category}</td>
                <td>
                  <span className="acc-badge" style={{
                    background: t.txn_type === "income" ? "rgba(16,185,129,.12)" : "rgba(244,63,94,.12)",
                    color: t.txn_type === "income" ? "var(--ac-green)" : "var(--ac-red)",
                  }}>
                    {TYPE_LABEL[t.txn_type]}
                  </span>
                </td>
                <td>
                  <span className={t.txn_type === "income" ? "acc-amount-pos" : "acc-amount-neg"}>
                    {t.txn_type === "income" ? "+" : "−"} {fmt(t.amount)}
                  </span>
                </td>
                <td style={{ textTransform: "capitalize" }}>{t.payment_mode}</td>
                <td><StatusBadge status={t.status} /></td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="acc-btn acc-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => onEdit(t)}>Edit</button>
                    <button className="acc-btn acc-btn-danger" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => onDelete(t.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--ac-low)" }}>
        Showing {transactions.length} of {total} records
      </div>
    </>
  );
}

// ── Expenses tab ──────────────────────────────────────────────────────────────

function ExpensesTab({ expenses, transactions, onNew }) {
  const expenseTxns = transactions.filter((t) => t.txn_type === "expense");
  const totalExpense = expenseTxns.reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  return (
    <>
      <div className="acc-section-row" style={{ marginTop: 0 }}>
        <div className="acc-section-title">Expense Breakdown</div>
        <button className="acc-btn acc-btn-primary" onClick={onNew}>+ Record Expense</button>
      </div>

      <div className="acc-two-col">
        {/* Breakdown list */}
        <div className="acc-table-wrap" style={{ padding: "20px 22px" }}>
          <div style={{ marginBottom: 14, fontSize: 12, color: "var(--ac-low)", fontWeight: 600, letterSpacing: ".5px", textTransform: "uppercase" }}>
            Total: {fmt(totalExpense)}
          </div>
          <div className="acc-expense-list">
            {expenses.length === 0 && <div className="acc-empty">No expense data yet.</div>}
            {expenses.map((e) => (
              <div key={e.category} className="acc-expense-row">
                <span className="acc-expense-dot" style={{ background: e.color }} />
                <span className="acc-expense-name">{e.category}</span>
                <span className="acc-expense-val">{fmt(e.total)}</span>
                {totalExpense > 0 && (
                  <span style={{ fontSize: 11.5, color: "var(--ac-low)", marginLeft: 6 }}>
                    {Math.round((e.total / totalExpense) * 100)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expense transactions */}
        <div className="acc-table-wrap">
          <table className="acc-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Particulars</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {expenseTxns.length === 0 && (
                <tr><td colSpan={4} className="acc-empty">No expense transactions yet.</td></tr>
              )}
              {expenseTxns.slice(0, 10).map((t) => (
                <tr key={t.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{t.txn_date?.slice(0, 10)}</td>
                  <td>
                    <div className="cell-main">{t.particulars}</div>
                    {t.sub_text && <div className="cell-sub">{t.sub_text}</div>}
                  </td>
                  <td><span className="acc-amount-neg">− {fmt(t.amount)}</span></td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── Fee Collection tab ────────────────────────────────────────────────────────

function FeeCollectionTab({ collections, overview }) {
  return (
    <>
      <div className="acc-section-row" style={{ marginTop: 0 }}>
        <div className="acc-section-title">Fee Collection by Class</div>
      </div>

      {overview && (
        <div className="acc-info-grid" style={{ marginTop: 0, marginBottom: 20 }}>
          {[
            { title: "Total Collected",   val: fmt(overview.fees_collected)  },
            { title: "Outstanding",       val: fmt(overview.fees_outstanding) },
            { title: "Students Billed",   val: overview.students_billed      },
            { title: "Collection Rate",   val: `${overview.collection_pct}%` },
          ].map(({ title, val }) => (
            <div key={title} className="acc-info-card">
              <div className="acc-info-title">{title}</div>
              <div className="acc-info-num">{val}</div>
            </div>
          ))}
        </div>
      )}

      <div className="acc-table-wrap" style={{ padding: "20px 24px" }}>
        {collections.length === 0 && <div className="acc-empty">No class data available.</div>}
        <div className="acc-bar-list">
          {collections.map((c) => (
            <div key={c.class_name} className="acc-bar-row">
              <div className="acc-bar-meta">
                <span style={{ fontWeight: 600, color: "var(--ac-hi)" }}>{c.class_name}</span>
                <span>
                  <span style={{ color: "var(--ac-v400)", fontWeight: 700 }}>{c.pct}%</span>
                  <span style={{ color: "var(--ac-low)", fontSize: 12, marginLeft: 8 }}>
                    {fmtShort(c.collected)} / {fmtShort(c.billed)}
                  </span>
                </span>
              </div>
              <div className="acc-bar-track">
                <div className="acc-bar-fill" style={{ width: `${Math.min(c.pct, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Payroll tab ───────────────────────────────────────────────────────────────

function PayrollTab({ payroll, loading, onNew, onStatus }) {
  const totalNet = payroll.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
  const paidCount = payroll.filter((p) => p.status === "paid").length;

  return (
    <>
      <div className="acc-section-row" style={{ marginTop: 0 }}>
        <div className="acc-section-title">Payroll</div>
        <button className="acc-btn acc-btn-primary" onClick={onNew}>+ Add Entry</button>
      </div>

      <div className="acc-info-grid" style={{ marginTop: 0, marginBottom: 20 }}>
        {[
          { title: "Total Payroll", val: fmt(totalNet)        },
          { title: "Entries",       val: payroll.length       },
          { title: "Paid",          val: paidCount            },
          { title: "Pending",       val: payroll.length - paidCount },
        ].map(({ title, val }) => (
          <div key={title} className="acc-info-card">
            <div className="acc-info-title">{title}</div>
            <div className="acc-info-num">{val}</div>
          </div>
        ))}
      </div>

      <div className="acc-table-wrap">
        <table className="acc-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Month</th>
              <th>Basic</th>
              <th>Allowances</th>
              <th>Deductions</th>
              <th>Net</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9}><Spinner /></td></tr>}
            {!loading && payroll.length === 0 && (
              <tr><td colSpan={9} className="acc-empty">No payroll entries yet.</td></tr>
            )}
            {payroll.map((p) => (
              <tr key={p.id}>
                <td className="cell-main">{p.employee_name}</td>
                <td style={{ textTransform: "capitalize" }}>{p.employee_type}</td>
                <td>{p.pay_month}</td>
                <td>{fmt(p.basic_salary)}</td>
                <td>{fmt(p.allowances)}</td>
                <td>{fmt(p.deductions)}</td>
                <td style={{ fontWeight: 700, color: "var(--ac-hi)" }}>{fmt(p.net_salary)}</td>
                <td><StatusBadge status={p.status} /></td>
                <td>
                  {p.status === "pending" && (
                    <button
                      className="acc-btn acc-btn-ghost"
                      style={{ padding: "5px 10px", fontSize: 12 }}
                      onClick={() => onStatus(p.id, "paid")}
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Accounts() {
  const [activeTab,    setActiveTab]    = useState(0);
  const [overview,     setOverview]     = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txnTotal,     setTxnTotal]     = useState(0);
  const [expenses,     setExpenses]     = useState([]);
  const [collections,  setCollections]  = useState([]);
  const [payroll,      setPayroll]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [txnLoading,   setTxnLoading]   = useState(false);
  const [payLoading,   setPayLoading]   = useState(false);
  const [txnFilter,    setTxnFilter]    = useState({});

  // modals
  const [txnModal,     setTxnModal]     = useState(false);
  const [txnEdit,      setTxnEdit]      = useState(null);
  const [payModal,     setPayModal]     = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const res = await getAccountsOverview();
      setOverview(res.data?.data || null);
    } catch { setOverview(null); }
  }, []);

  const loadTransactions = useCallback(async (filter = {}) => {
    setTxnLoading(true);
    try {
      const res = await getTransactions({ limit: 50, ...filter });
      setTransactions(res.data?.data || []);
      setTxnTotal(res.data?.total || 0);
    } catch { setTransactions([]); }
    finally { setTxnLoading(false); }
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      const res = await getExpenseBreakdown();
      setExpenses(res.data?.data || []);
    } catch { setExpenses([]); }
  }, []);

  const loadCollections = useCallback(async () => {
    try {
      const res = await getCollectionByClass();
      setCollections(res.data?.data || []);
    } catch { setCollections([]); }
  }, []);

  const loadPayroll = useCallback(async () => {
    setPayLoading(true);
    try {
      const res = await getPayroll();
      setPayroll(res.data?.data || []);
    } catch { setPayroll([]); }
    finally { setPayLoading(false); }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadOverview(), loadTransactions(), loadExpenses(),
      loadCollections(), loadPayroll(),
    ]);
    setLoading(false);
  }, [loadOverview, loadTransactions, loadExpenses, loadCollections, loadPayroll]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleFilterChange = (f) => {
    setTxnFilter(f);
    loadTransactions(f);
  };

  const handleDeleteTxn = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await deleteTransaction(id);
      loadTransactions(txnFilter);
      loadOverview();
    } catch { alert("Failed to delete."); }
  };

  const handlePayrollStatus = async (id, status) => {
    try {
      await updatePayrollStatus(id, status);
      loadPayroll();
    } catch { alert("Failed to update status."); }
  };

  const handleExport = async () => {
    try {
      const res = await exportAccountsCsv();
      const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a"); a.href = url;
      a.download = "accounts.csv"; a.click(); URL.revokeObjectURL(url);
    } catch { alert("Export failed."); }
  };

  const openNewTxn = () => { setTxnEdit(null); setTxnModal(true); };
  const openEditTxn = (t) => { setTxnEdit(t); setTxnModal(true); };

  return (
    <>
      <style>{CSS}</style>
      <div className="acc-page">

        {/* ── Header ── */}
        <div className="acc-header">
          <div className="acc-header-left">
            <div className="acc-breadcrumb">Accounts office · FY {overview?.fiscal_year || "…"}</div>
            <div className="acc-title">Accounts overview</div>
          </div>
          <div className="acc-header-right">
            <button className="acc-btn acc-btn-ghost" onClick={handleExport}>
              ↓ Export report
            </button>
            <button className="acc-btn acc-btn-primary" onClick={openNewTxn}>
              + Record payment
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="acc-tabs">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`acc-tab${activeTab === i ? " active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab body ── */}
        <div className="acc-body">
          {loading && activeTab === 0 ? (
            <Spinner />
          ) : (
            <>
              {activeTab === 0 && (
                <OverviewTab
                  overview={overview}
                  collections={collections}
                  expenses={expenses}
                  transactions={transactions}
                  onNewTxn={openNewTxn}
                />
              )}
              {activeTab === 1 && (
                <FeeCollectionTab collections={collections} overview={overview} />
              )}
              {activeTab === 2 && (
                <ExpensesTab
                  expenses={expenses}
                  transactions={transactions}
                  onNew={() => { setTxnEdit({ txn_type: "expense" }); setTxnModal(true); }}
                />
              )}
              {activeTab === 3 && (
                <PayrollTab
                  payroll={payroll}
                  loading={payLoading}
                  onNew={() => setPayModal(true)}
                  onStatus={handlePayrollStatus}
                />
              )}
              {activeTab === 4 && (
                <TransactionsTab
                  transactions={transactions}
                  total={txnTotal}
                  loading={txnLoading}
                  onNew={openNewTxn}
                  onEdit={openEditTxn}
                  onDelete={handleDeleteTxn}
                  onFilter={handleFilterChange}
                  filter={txnFilter}
                />
              )}
            </>
          )}
        </div>

        {/* ── Modals ── */}
        <TransactionModal
          open={txnModal}
          onClose={() => { setTxnModal(false); setTxnEdit(null); }}
          onSaved={() => { loadTransactions(txnFilter); loadOverview(); loadExpenses(); }}
          initial={txnEdit}
        />
        <PayrollModal
          open={payModal}
          onClose={() => setPayModal(false)}
          onSaved={loadPayroll}
        />
      </div>
    </>
  );
}
