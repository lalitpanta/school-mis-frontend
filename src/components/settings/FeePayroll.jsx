import { useEffect, useState } from "react";
import FeeStructure from "./FeeStructurePro";
import FeesNotifications from "./FeesNotifications";
import {
  getAccountsOverview,
  getCollectionByClass,
  getPayroll,
  createPayroll,
  updatePayrollStatus,
} from "../../api/accountsApi";

const money = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const DEFAULT_PAYROLL = {
  employee_name: "",
  employee_type: "staff",
  pay_month: "",
  basic_salary: "",
  allowances: "",
  deductions: "",
  payment_mode: "bank",
  notes: "",
};

function PayrollEntry({ onSaved }) {
  const [form, setForm] = useState(DEFAULT_PAYROLL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.employee_name.trim() || !form.pay_month.trim()) {
      setError("Employee name and pay month are required.");
      return;
    }
    if (!form.basic_salary || Number.isNaN(Number(form.basic_salary))) {
      setError("Enter a valid basic salary.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createPayroll({
        ...form,
        employee_id: crypto.randomUUID(),
        basic_salary: Number(form.basic_salary),
        allowances: Number(form.allowances || 0),
        deductions: Number(form.deductions || 0),
      });
      setForm(DEFAULT_PAYROLL);
      onSaved();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save payroll entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="fp-payroll-form">
      <div className="fp-form-grid">
        <label>Employee name<input value={form.employee_name} onChange={(event) => set("employee_name", event.target.value)} /></label>
        <label>Employee type<select value={form.employee_type} onChange={(event) => set("employee_type", event.target.value)}><option value="teacher">Teacher</option><option value="staff">Staff</option><option value="admin">Admin</option></select></label>
        <label>Pay month<input placeholder="e.g. Shrawan 2082" value={form.pay_month} onChange={(event) => set("pay_month", event.target.value)} /></label>
        <label>Basic salary<input type="number" min="0" step="0.01" value={form.basic_salary} onChange={(event) => set("basic_salary", event.target.value)} /></label>
        <label>Allowances<input type="number" min="0" step="0.01" value={form.allowances} onChange={(event) => set("allowances", event.target.value)} /></label>
        <label>Deductions<input type="number" min="0" step="0.01" value={form.deductions} onChange={(event) => set("deductions", event.target.value)} /></label>
      </div>
      {error && <div className="fp-error">{error}</div>}
      <button className="fp-primary" disabled={saving}>{saving ? "Saving..." : "Add payroll entry"}</button>
    </form>
  );
}

function PayrollTab() {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await getPayroll();
      setPayroll(response.data?.data || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load payroll.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    try {
      await updatePayrollStatus(id, "paid");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update payroll status.");
    }
  };

  const total = payroll.reduce((sum, item) => sum + Number(item.net_salary || 0), 0);
  return (
    <div className="fp-panel">
      <div className="fp-section-head"><div><h2>Payroll</h2><p>Salary processing remains owned by Fee & Payroll.</p></div></div>
      <PayrollEntry onSaved={load} />
      {error && <div className="fp-error">{error}</div>}
      <div className="fp-metrics"><div><span>Total payroll</span><strong>{money(total)}</strong></div><div><span>Entries</span><strong>{payroll.length}</strong></div><div><span>Pending</span><strong>{payroll.filter((item) => item.status !== "paid").length}</strong></div></div>
      <div className="fp-table-wrap"><table><thead><tr><th>Employee</th><th>Type</th><th>Month</th><th>Net salary</th><th>Status</th><th /></tr></thead><tbody>
        {loading && <tr><td colSpan="6">Loading payroll...</td></tr>}
        {!loading && payroll.length === 0 && <tr><td colSpan="6">No payroll entries yet.</td></tr>}
        {payroll.map((item) => <tr key={item.id}><td>{item.employee_name}</td><td>{item.employee_type}</td><td>{item.pay_month}</td><td>{money(item.net_salary)}</td><td><span className={`fp-status ${item.status}`}>{item.status}</span></td><td>{item.status === "pending" && <button className="fp-link" onClick={() => markPaid(item.id)}>Mark paid</button>}</td></tr>)}
      </tbody></table></div>
    </div>
  );
}

function FeeCollectionTab() {
  const [overview, setOverview] = useState(null);
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getAccountsOverview(), getCollectionByClass()])
      .then(([overviewResponse, collectionResponse]) => {
        setOverview(overviewResponse.data?.data || null);
        setCollections(collectionResponse.data?.data || []);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load fee collection."));
  }, []);

  return <div className="fp-panel"><div className="fp-section-head"><div><h2>Fee Collection</h2><p>Student fee calculations and collection remain in the Fee module.</p></div></div>{error && <div className="fp-error">{error}</div>}<div className="fp-metrics"><div><span>Total collected</span><strong>{money(overview?.fees_collected)}</strong></div><div><span>Outstanding</span><strong>{money(overview?.fees_outstanding)}</strong></div><div><span>Collection rate</span><strong>{overview?.collection_pct || 0}%</strong></div></div><div className="fp-table-wrap"><table><thead><tr><th>Class</th><th>Billed</th><th>Collected</th><th>Progress</th></tr></thead><tbody>{collections.length === 0 ? <tr><td colSpan="4">No collection data available.</td></tr> : collections.map((item) => <tr key={item.class_name}><td>{item.class_name}</td><td>{money(item.billed)}</td><td>{money(item.collected)}</td><td>{item.pct}%</td></tr>)}</tbody></table></div></div>;
}

const STYLES = `
.fp-page { color: var(--text-1); }
.fp-tabs { display:flex; gap:8px; border-bottom:1px solid var(--border-card); margin-bottom:20px; overflow:auto; }
.fp-tab { border:0; border-bottom:2px solid transparent; background:transparent; color:var(--text-3); padding:10px 14px; cursor:pointer; white-space:nowrap; font:600 13px inherit; }
.fp-tab.active { color:var(--text-1); border-bottom-color:var(--accent); }
.fp-panel { background:var(--bg-card); border:1px solid var(--border-card); border-radius:10px; padding:20px; }
.fp-section-head { display:flex; justify-content:space-between; align-items:start; margin-bottom:18px; }
.fp-section-head h2 { margin:0 0 4px; font-size:18px; }
.fp-section-head p { margin:0; color:var(--text-3); font-size:13px; }
.fp-payroll-form { border:1px solid var(--border-card); border-radius:8px; padding:16px; margin-bottom:20px; }
.fp-form-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; margin-bottom:14px; }
.fp-form-grid label { display:flex; flex-direction:column; gap:6px; color:var(--text-2); font-size:12px; font-weight:600; }
.fp-form-grid input,.fp-form-grid select { border:1px solid var(--border-card); border-radius:7px; background:var(--bg-input); color:var(--text-1); padding:9px; }
.fp-primary { border:0; border-radius:7px; padding:9px 13px; background:var(--accent); color:var(--accent-text); font-weight:700; cursor:pointer; }
.fp-primary:disabled { opacity:.6; cursor:wait; }
.fp-error { color:var(--danger); background:var(--danger-dim); border:1px solid var(--danger); border-radius:7px; padding:9px 11px; margin-bottom:12px; font-size:13px; }
.fp-metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
.fp-metrics > div { border:1px solid var(--border-card); border-radius:8px; padding:14px; }
.fp-metrics span { display:block; color:var(--text-3); font-size:12px; margin-bottom:6px; }
.fp-metrics strong { font-size:19px; }
.fp-table-wrap { overflow:auto; border:1px solid var(--border-card); border-radius:8px; }
.fp-table-wrap table { width:100%; border-collapse:collapse; min-width:640px; }
.fp-table-wrap th,.fp-table-wrap td { padding:12px 14px; border-bottom:1px solid var(--border-card); text-align:left; font-size:13px; }
.fp-table-wrap th { color:var(--text-3); font-size:11px; text-transform:uppercase; }
.fp-status { color:var(--text-2); text-transform:capitalize; }
.fp-status.paid { color:var(--success); }.fp-status.pending { color:var(--warning); }
.fp-link { border:0; background:transparent; color:var(--accent); cursor:pointer; font-weight:700; }
@media (max-width:700px) { .fp-form-grid,.fp-metrics { grid-template-columns:1fr; } }
`;

export default function FeePayroll() {
  const [activeTab, setActiveTab] = useState("fee");
  return <><style>{STYLES}</style><div className="fp-page"><div className="fp-tabs"><button className={`fp-tab ${activeTab === "fee" ? "active" : ""}`} onClick={() => setActiveTab("fee")}>Fee Structure</button><button className={`fp-tab ${activeTab === "collection" ? "active" : ""}`} onClick={() => setActiveTab("collection")}>Fee Collection</button><button className={`fp-tab ${activeTab === "payroll" ? "active" : ""}`} onClick={() => setActiveTab("payroll")}>Payroll</button><button className={`fp-tab ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>Fee Settings</button></div>{activeTab === "fee" && <FeeStructure />}{activeTab === "collection" && <FeeCollectionTab />}{activeTab === "payroll" && <PayrollTab />}{activeTab === "settings" && <FeesNotifications />}</div></>;
}
