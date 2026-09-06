import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createAccountingAccount,
  createAccountingVoucher,
  createBankAccount,
  getAccountingAccounts,
  getBankStatements,
  getGatewayTransactions,
  getAccountingLedger,
  getAccountingJournals,
  getAccountingVouchers,
  getPaymentGateways,
  getFinancialReport,
  postAccountingJournal,
  postAccountingVoucher,
  savePaymentGateway,
  importBankStatement,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [trialBalance, setTrialBalance] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [gatewayTransactions, setGatewayTransactions] = useState([]);
  const [bankStatements, setBankStatements] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [accountForm, setAccountForm] = useState({ code: "", name: "", account_type: "asset" });
  const [journalForm, setJournalForm] = useState({ description: "", debitAccount: "", creditAccount: "", amount: "" });
  const [voucherForm, setVoucherForm] = useState({ voucher_type: "receipt", narration: "", debitAccount: "", creditAccount: "", amount: "" });
  const [gatewayForm, setGatewayForm] = useState({ name: "", provider: "", merchant_id: "", api_key: "", api_secret: "", mode: "sandbox" });
  const [bankForm, setBankForm] = useState({ bank_account_id: "", entries: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getAccountingAccounts(), getAccountingJournals(), getTrialBalance(), getAccountingVouchers()])
      .then(([accountResponse, journalResponse, balanceResponse, voucherResponse]) => {
        setAccounts(accountResponse.data.data || []);
        setJournals(journalResponse.data.data || []);
        setTrialBalance(balanceResponse.data.data?.accounts || []);
        setVouchers(voucherResponse.data.data || []);
      })
      .catch(() => {
        setAccounts([]);
        setJournals([]);
        setTrialBalance([]);
        setError("Unable to load accounting data. Check your access and try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "reports") return;
    getFinancialReport("profit-loss")
      .then((response) => setReport(response.data.data))
      .catch(() => setReport(null));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "payments") {
      Promise.all([getPaymentGateways(), getGatewayTransactions()])
        .then(([gatewayResponse, transactionResponse]) => {
          setGateways(gatewayResponse.data.data || []);
          setGatewayTransactions(transactionResponse.data.data || []);
        })
        .catch(() => setError("Unable to load payment gateway data."));
    }
    if (activeTab === "bank") {
      getBankStatements().then((response) => setBankStatements(response.data.data || [])).catch(() => setError("Unable to load bank statements."));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "ledger") return;
    getAccountingLedger().then((response) => setLedger(response.data.data || [])).catch(() => setLedger([]));
  }, [activeTab]);

  const total = (key) => trialBalance.reduce((sum, row) => sum + Number(row[key] || 0), 0);

  const saveAccount = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await createAccountingAccount(accountForm);
      setAccounts((current) => [...current, response.data.data].sort((a, b) => a.code.localeCompare(b.code)));
      setAccountForm({ code: "", name: "", account_type: "asset" });
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create account.");
    } finally {
      setSaving(false);
    }
  };

  const postJournal = async (event) => {
    event.preventDefault();
    const amount = Number(journalForm.amount);
    if (!journalForm.debitAccount || !journalForm.creditAccount || amount <= 0) {
      setError("Select two accounts and enter a positive amount.");
      return;
    }
    setSaving(true);
    try {
      const response = await postAccountingJournal({
        description: journalForm.description,
        lines: [
          { account_id: journalForm.debitAccount, debit: amount, credit: 0 },
          { account_id: journalForm.creditAccount, debit: 0, credit: amount },
        ],
      });
      setJournals((current) => [response.data.data, ...current]);
      setJournalForm({ description: "", debitAccount: "", creditAccount: "", amount: "" });
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to post journal.");
    } finally {
      setSaving(false);
    }
  };

  const saveVoucher = async (event) => {
    event.preventDefault();
    const amount = Number(voucherForm.amount);
    if (!voucherForm.debitAccount || !voucherForm.creditAccount || amount <= 0) {
      setError("Select debit and credit accounts and enter a positive amount.");
      return;
    }
    setSaving(true);
    try {
      const response = await createAccountingVoucher({
        voucher_type: voucherForm.voucher_type,
        narration: voucherForm.narration,
        lines: [
          { account_id: voucherForm.debitAccount, debit: amount, credit: 0 },
          { account_id: voucherForm.creditAccount, debit: 0, credit: amount },
        ],
      });
      setVouchers((current) => [response.data.data, ...current]);
      setVoucherForm({ voucher_type: "receipt", narration: "", debitAccount: "", creditAccount: "", amount: "" });
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save voucher draft.");
    } finally {
      setSaving(false);
    }
  };

  const postVoucher = async (id) => {
    setSaving(true);
    try {
      const response = await postAccountingVoucher(id);
      setVouchers((current) => current.map((voucher) => voucher.id === id ? response.data.data : voucher));
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to post voucher.");
    } finally {
      setSaving(false);
    }
  };

  const saveGateway = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await savePaymentGateway(gatewayForm);
      setGateways((current) => [...current.filter((gateway) => gateway.name !== response.data.data.name), response.data.data]);
      setGatewayForm({ name: "", provider: "", merchant_id: "", api_key: "", api_secret: "", mode: "sandbox" });
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save gateway.");
    } finally { setSaving(false); }
  };

  const importStatements = async (event) => {
    event.preventDefault();
    let entries;
    try { entries = JSON.parse(bankForm.entries); } catch { setError("Statement data must be a valid JSON array."); return; }
    setSaving(true);
    try {
      await importBankStatement({ bank_account_id: bankForm.bank_account_id, entries });
      const response = await getBankStatements();
      setBankStatements(response.data.data || []);
      setBankForm({ bank_account_id: "", entries: "" });
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to import statement.");
    } finally { setSaving(false); }
  };

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
          <button key={key} type="button" onClick={() => setSearchParams(key === "dashboard" ? {} : { tab: key })} className={`shrink-0 rounded-lg px-3 py-2 text-sm ${activeTab === key ? "bg-indigo-600 text-white" : "border"}`} style={activeTab === key ? undefined : { borderColor: "var(--border-card)" }}>
            {label}
          </button>
        ))}
      </div>
      {error && <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}
      {loading ? <div className="py-12 text-center" style={{ color: "var(--text-2)" }}>Loading accounting data...</div> : (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border p-5" style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
            <h2 className="font-semibold mb-3">{tabs.find(([key]) => key === activeTab)?.[1]}</h2>
            {activeTab === "chart" ? (
              <>
                <form onSubmit={saveAccount} className="grid gap-2 mb-4 sm:grid-cols-4">
                  <input required placeholder="Code" value={accountForm.code} onChange={(event) => setAccountForm({ ...accountForm, code: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <input required placeholder="Account name" value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm sm:col-span-2" />
                  <select value={accountForm.account_type} onChange={(event) => setAccountForm({ ...accountForm, account_type: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm"><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="income">Income</option><option value="expense">Expense</option></select>
                  <button disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white sm:col-span-4">{saving ? "Saving..." : "Add account"}</button>
                </form>
                {accounts.map((account) => <div key={account.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{account.code} · {account.name}</span><span style={{ color: "var(--text-2)" }}>{account.account_type}</span></div>)}
              </>
            ) : activeTab === "journals" ? (
              <>
                <form onSubmit={postJournal} className="grid gap-2 mb-4 sm:grid-cols-2">
                  <input placeholder="Narration" value={journalForm.description} onChange={(event) => setJournalForm({ ...journalForm, description: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm sm:col-span-2" />
                  <select required value={journalForm.debitAccount} onChange={(event) => setJournalForm({ ...journalForm, debitAccount: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm"><option value="">Debit account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select>
                  <select required value={journalForm.creditAccount} onChange={(event) => setJournalForm({ ...journalForm, creditAccount: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm"><option value="">Credit account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select>
                  <input required min="0.01" step="0.01" type="number" placeholder="Amount" value={journalForm.amount} onChange={(event) => setJournalForm({ ...journalForm, amount: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <button disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">{saving ? "Posting..." : "Post balanced journal"}</button>
                </form>
                {journals.slice(0, 12).map((journal) => <div key={journal.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{journal.journal_number}<br /><span style={{ color: "var(--text-2)" }}>{journal.description || "Journal entry"}</span></span><span>NPR {Number(journal.total_debit || 0).toLocaleString("en-IN")}</span></div>)}
              </>
            ) : activeTab === "ledger" ? ledger.map((entry) => <div key={`${entry.journal_id}-${entry.account_id}`} className="grid grid-cols-4 gap-2 border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{entry.journal_date}<br /><span style={{ color: "var(--text-2)" }}>{entry.journal_number}</span></span><span className="col-span-2">{entry.account_code} · {entry.account_name}<br /><span style={{ color: "var(--text-2)" }}>{entry.description || "Ledger posting"}</span></span><span className="text-right">NPR {Number(entry.balance || 0).toLocaleString("en-IN")}</span></div>) : activeTab === "vouchers" ? (
              <>
                <form onSubmit={saveVoucher} className="grid gap-2 mb-4 sm:grid-cols-2">
                  <select value={voucherForm.voucher_type} onChange={(event) => setVoucherForm({ ...voucherForm, voucher_type: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm"><option value="receipt">Receipt</option><option value="payment">Payment</option><option value="contra">Contra</option><option value="sales">Sales</option><option value="purchase">Purchase</option><option value="journal">Journal</option></select>
                  <input required placeholder="Narration" value={voucherForm.narration} onChange={(event) => setVoucherForm({ ...voucherForm, narration: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <select required value={voucherForm.debitAccount} onChange={(event) => setVoucherForm({ ...voucherForm, debitAccount: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm"><option value="">Debit account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select>
                  <select required value={voucherForm.creditAccount} onChange={(event) => setVoucherForm({ ...voucherForm, creditAccount: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm"><option value="">Credit account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}</select>
                  <input required min="0.01" step="0.01" type="number" placeholder="Amount" value={voucherForm.amount} onChange={(event) => setVoucherForm({ ...voucherForm, amount: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <button disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">{saving ? "Saving..." : "Save draft voucher"}</button>
                </form>
                {vouchers.map((voucher) => <div key={voucher.id} className="flex items-center justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{voucher.voucher_number}<br /><span style={{ color: "var(--text-2)" }}>{voucher.voucher_type} · {voucher.narration || "No narration"}</span></span><span className="flex items-center gap-2">{voucher.status}{voucher.status === "draft" && <button type="button" onClick={() => postVoucher(voucher.id)} className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">Post</button>}</span></div>)}
              </>
            ) : activeTab === "payments" ? (
              <>
                <form onSubmit={saveGateway} className="grid gap-2 mb-4 sm:grid-cols-2">
                  <input required placeholder="Gateway name" value={gatewayForm.name} onChange={(event) => setGatewayForm({ ...gatewayForm, name: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <input required placeholder="Provider" value={gatewayForm.provider} onChange={(event) => setGatewayForm({ ...gatewayForm, provider: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <input placeholder="Merchant ID" value={gatewayForm.merchant_id} onChange={(event) => setGatewayForm({ ...gatewayForm, merchant_id: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <input placeholder="API key" value={gatewayForm.api_key} onChange={(event) => setGatewayForm({ ...gatewayForm, api_key: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <input type="password" placeholder="API secret" value={gatewayForm.api_secret} onChange={(event) => setGatewayForm({ ...gatewayForm, api_secret: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <select value={gatewayForm.mode} onChange={(event) => setGatewayForm({ ...gatewayForm, mode: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm"><option value="sandbox">Sandbox</option><option value="live">Live</option></select>
                  <button disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white sm:col-span-2">{saving ? "Saving..." : "Save gateway"}</button>
                </form>
                {gateways.map((gateway) => <div key={gateway.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{gateway.name} · {gateway.provider}<br /><span style={{ color: "var(--text-2)" }}>{gateway.mode}</span></span><span>{gateway.is_active ? "Active" : "Inactive"}</span></div>)}
                <h3 className="mt-5 mb-2 font-medium">Transactions</h3>
                {gatewayTransactions.map((transaction) => <div key={transaction.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{transaction.external_id}<br /><span style={{ color: "var(--text-2)" }}>{transaction.gateway_name}</span></span><span>NPR {Number(transaction.amount).toLocaleString("en-IN")} · {transaction.status}</span></div>)}
              </>
            ) : activeTab === "bank" ? (
              <>
                <form onSubmit={importStatements} className="grid gap-2 mb-4">
                  <input required placeholder="Bank account ID" value={bankForm.bank_account_id} onChange={(event) => setBankForm({ ...bankForm, bank_account_id: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <textarea required rows="5" placeholder='Statement JSON: [{"transaction_date":"2026-09-06","reference":"REF-1","amount":100,"direction":"credit"}]' value={bankForm.entries} onChange={(event) => setBankForm({ ...bankForm, entries: event.target.value })} className="rounded-lg border bg-transparent px-3 py-2 text-sm" />
                  <button disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">{saving ? "Importing..." : "Import statement"}</button>
                </form>
                {bankStatements.map((statement) => <div key={statement.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{statement.transaction_date}<br /><span style={{ color: "var(--text-2)" }}>{statement.reference} · {statement.bank_account_name}</span></span><span>NPR {Number(statement.amount).toLocaleString("en-IN")} · {statement.status}</span></div>)}
              </>
            ) : activeTab === "reports" ? (report?.accounts || []).map((account) => <div key={account.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{account.code} · {account.name}</span><span>NPR {Number(account.credit || account.debit || 0).toLocaleString("en-IN")}</span></div>) : journals.slice(0, 12).map((journal) => <div key={journal.id} className="flex justify-between border-b py-2 text-sm" style={{ borderColor: "var(--border-card)" }}><span>{journal.journal_number}<br /><span style={{ color: "var(--text-2)" }}>{journal.description || "Journal entry"}</span></span><span>NPR {Number(journal.total_debit || 0).toLocaleString("en-IN")}</span></div>)}
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