import { useEffect, useState } from "react";
import {
  getAccountingAccounts,
  getAccountingJournals,
  getTrialBalance,
} from "../api/accountsApi";

const tabs = [
  ["dashboard", "Dashboard"],
  ["chart", "Chart of Accounts"],
  ["ledger", "General Ledger"],
  ["journals", "Journal Entries"],
  ["vouchers", "Vouchers"],
  ["payments", "Payment Gateway"],
  ["bank", "Bank Reconciliation"],
  ["reports", "Reports"],
  ["settings", "Settings"],
];

const AccountingPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [trialBalance, setTrialBalance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tabs.some(([key]) => key === tab)) setActiveTab(tab);
    Promise.all([getAccountingAccounts(), getAccountingJournals(), getTrialBalance()])
      .then(([accountResponse, journalResponse, balanceResponse]) => {
        setAccounts(accountResponse.data.data || []);
        setJournals(journalResponse.data.data || []);
        setTrialBalance(balanceResponse.data.data?.accounts || []);
      })
      .catch(() => {
        setAccounts([]);
        setJournals([]);
        setTrialBalance([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = (key) => trialBalance.reduce((sum, row) => sum + Number(row[key] || 0), 0);

  return (
    <div className="h-full overflow-y-auto p-6" style={{ color: "var(--text-1)" }}>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Finance</p>
          <h1 className="text-2xl font-bold">Accounting</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>Authoritative general ledger and financial controls</p>
        </div>
        <div className="flex gap-2">
          {[["debit", "Debit"], ["credit", "Credit"]].map(([key, label]) => (
            <div key={key} className="rounded-xl border px-4 py-3" style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
              <div className="text-xs" style={{ color: "var(--text-3)" }}>{label}</div>
              <div className="font-semibold">NPR {total(key).toLocaleString("en-IN")}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)} className={`shrink-0 rounded-lg px-3 py-2 text-sm ${activeTab === key ? "bg-indigo-600 text-white" : "border"}`} style={activeTab === key ? undefined : { borderColor: "var(--border-card)" }}>
            {label}
          </button>
        ))}
      </div>
      {loading ? <div className="py-12 text-center" style={{ color: "var(--text-2)" }}>Loading accounting data...</div> : (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
            <h2 className="font-semibold mb-3">{tabs.find(([key]) => key === activeTab)?.[1]}</h2>
            {activeTab === "chart" ? accounts.map((account) => <div key={account.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{account.code} · {account.name}</span><span style={{ color: "var(--text-2)" }}>{account.account_type}</span></div>) : journals.slice(0, 12).map((journal) => <div key={journal.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{journal.journal_number}<br /><span style={{ color: "var(--text-2)" }}>{journal.description || "Journal entry"}</span></span><span>NPR {Number(journal.total_debit || 0).toLocaleString("en-IN")}</span></div>)}
            {!accounts.length && !journals.length && <p style={{ color: "var(--text-2)" }}>No accounting records are available yet.</p>}
          </section>
          <section className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
            <h2 className="font-semibold mb-3">Trial Balance</h2>
            {trialBalance.map((row) => <div key={row.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{row.code} · {row.name}</span><span>NPR {Number(row.debit || 0).toLocaleString("en-IN")}</span></div>)}
          </section>
        </div>
      )}
    </div>
  );
};

export default AccountingPage;