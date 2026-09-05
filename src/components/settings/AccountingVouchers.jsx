import { useEffect, useState } from "react";
import { getAccountingAccounts, getAccountingJournals, postAccountingJournal } from "../../api/accountsApi";

const EMPTY_LINE = { account_code: "", debit: "", credit: "" };
const TYPES = ["receipt", "payment", "contra", "journal", "sales", "purchase"];
const amount = (value) => Number(value || 0);

export default function AccountingVouchers() {
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [voucherType, setVoucherType] = useState("receipt");
  const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [accountResponse, journalResponse] = await Promise.all([
        getAccountingAccounts(),
        getAccountingJournals({ limit: 10 }),
      ]);
      setAccounts(accountResponse.data?.data || []);
      setJournals(journalResponse.data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load voucher data.");
    }
  };

  useEffect(() => { load(); }, []);

  const updateLine = (index, key, value) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value } : line));
  };

  const submit = async (event) => {
    event.preventDefault();
    const usableLines = lines.filter((line) => line.account_code && (amount(line.debit) > 0 || amount(line.credit) > 0));
    const totalDebit = usableLines.reduce((sum, line) => sum + amount(line.debit), 0);
    const totalCredit = usableLines.reduce((sum, line) => sum + amount(line.credit), 0);
    if (usableLines.length < 2) return setError("At least two account lines are required.");
    if (Math.abs(totalDebit - totalCredit) > 0.005) return setError("Total debit must equal total credit.");
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await postAccountingJournal({
        voucher_type: voucherType,
        journal_date: journalDate,
        narration,
        lines: usableLines,
      });
      setMessage(`Posted ${response.data?.data?.journal_number || "voucher"}.`);
      setNarration("");
      setLines([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to post voucher.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="acc-settings"><div className="acc-section-row"><div><div className="acc-section-title">Voucher Entry</div><div className="acc-section-sub">Post a balanced receipt, payment, contra, journal, sales, or purchase voucher.</div></div></div>{error && <div className="acc-settings-message">{error}</div>}{message && <div className="acc-settings-message">{message}</div>}<form onSubmit={submit} className="acc-settings-grid"><label>Voucher type<select value={voucherType} onChange={(event) => setVoucherType(event.target.value)}>{TYPES.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)} voucher</option>)}</select></label><label>Date<input type="date" value={journalDate} onChange={(event) => setJournalDate(event.target.value)} /></label><label className="full">Narration<input value={narration} onChange={(event) => setNarration(event.target.value)} /></label><div className="full"><div className="acc-section-title">Journal lines</div>{lines.map((line, index) => <div key={index} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: 8, marginTop: 8 }}><select value={line.account_code} onChange={(event) => updateLine(index, "account_code", event.target.value)}><option value="">Select account</option>{accounts.map((account) => <option key={account.id} value={account.code}>{account.code} - {account.name}</option>)}</select><input type="number" min="0" step="0.01" placeholder="Debit" value={line.debit} onChange={(event) => updateLine(index, "debit", event.target.value)} /><input type="number" min="0" step="0.01" placeholder="Credit" value={line.credit} onChange={(event) => updateLine(index, "credit", event.target.value)} /><button type="button" className="acc-btn acc-btn-danger" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}>Remove</button></div>)}<button type="button" className="acc-btn acc-btn-ghost" style={{ marginTop: 10 }} onClick={() => setLines((current) => [...current, { ...EMPTY_LINE }])}>Add line</button></div><div><button className="acc-btn acc-btn-primary" disabled={saving}>{saving ? "Posting..." : "Post voucher"}</button></div></form><div className="acc-section-row"><div className="acc-section-title">Recent vouchers</div></div><div className="acc-table-wrap"><table className="acc-table"><thead><tr><th>Number</th><th>Date</th><th>Type</th><th>Narration</th><th>Debit</th><th>Credit</th><th>Status</th></tr></thead><tbody>{journals.length === 0 ? <tr><td colSpan="7">No vouchers posted yet.</td></tr> : journals.map((journal) => <tr key={journal.id}><td className="cell-main">{journal.journal_number}</td><td>{String(journal.journal_date).slice(0, 10)}</td><td>{journal.voucher_type}</td><td>{journal.narration || "-"}</td><td>{journal.total_debit}</td><td>{journal.total_credit}</td><td>{journal.status}</td></tr>)}</tbody></table></div></div>;
}
