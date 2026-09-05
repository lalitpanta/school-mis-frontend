import { useEffect, useState } from "react";
import { createAccountingAccount, getAccountingAccounts } from "../../api/accountsApi";

const INITIAL_FORM = { code: "", name: "", account_type: "asset", parent_id: "" };

export default function AccountingChart() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const response = await getAccountingAccounts();
      setAccounts(response.data?.data || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load chart of accounts.");
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      setError("Account code and name are required.");
      return;
    }
    setSaving(true);
    try {
      await createAccountingAccount({ ...form, parent_id: form.parent_id || null });
      setForm(INITIAL_FORM);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create account.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="acc-settings"><div className="acc-section-row"><div><div className="acc-section-title">Chart of Accounts</div><div className="acc-section-sub">Configure the hierarchical accounts used by every posted journal.</div></div></div>{error && <div className="acc-settings-message">{error}</div>}<form className="acc-settings-grid" onSubmit={submit}><label>Code<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></label><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Account type<select value={form.account_type} onChange={(event) => setForm({ ...form, account_type: event.target.value })}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="income">Income</option><option value="expense">Expense</option></select></label><label>Parent account<select value={form.parent_id} onChange={(event) => setForm({ ...form, parent_id: event.target.value })}><option value="">None</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></label><div><button className="acc-btn acc-btn-primary" disabled={saving}>{saving ? "Saving..." : "Add account"}</button></div></form><div className="acc-table-wrap"><table className="acc-table"><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Parent</th><th>Status</th></tr></thead><tbody>{accounts.map((account) => <tr key={account.id}><td>{account.code}</td><td className="cell-main">{account.name}</td><td>{account.account_type}</td><td>{account.parent_name || "Top level"}</td><td>{account.is_active ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div></div>;
}
