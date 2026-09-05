import { useEffect, useState } from "react";
import { getFinancialReport } from "../../api/accountsApi";

const REPORTS = [
  ["income-expenditure", "Income & Expenditure"],
  ["balance-sheet", "Balance Sheet"],
  ["cash-position", "Cash & Bank Position"],
  ["day-book", "Day Book"],
  ["voucher-register", "Voucher Register"],
];

export default function AccountingReports() {
  const [report, setReport] = useState(REPORTS[0][0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const response = await getFinancialReport(report);
      setRows(response.data?.data || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [report]);

  const isJournal = report === "day-book" || report === "voucher-register";
  return <div className="acc-settings"><div className="acc-section-row"><div><div className="acc-section-title">Financial Reports</div><div className="acc-section-sub">Reports are calculated from posted general-ledger journals.</div></div><select className="acc-select" value={report} onChange={(event) => setReport(event.target.value)}>{REPORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{error && <div className="acc-settings-message">{error}</div>}<div className="acc-table-wrap"><table className="acc-table"><thead>{isJournal ? <tr><th>Voucher</th><th>Date</th><th>Type</th><th>Narration</th><th>Debit</th><th>Credit</th><th>Status</th></tr> : <tr><th>Code</th><th>Account</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th></tr>}</thead><tbody>{loading ? <tr><td colSpan="7">Loading report...</td></tr> : rows.length === 0 ? <tr><td colSpan="7">No posted accounting data available.</td></tr> : rows.map((row) => isJournal ? <tr key={row.id}><td className="cell-main">{row.journal_number}</td><td>{String(row.journal_date).slice(0, 10)}</td><td>{row.voucher_type}</td><td>{row.narration || "-"}</td><td>{row.total_debit}</td><td>{row.total_credit}</td><td>{row.status}</td></tr> : <tr key={row.id}><td>{row.code}</td><td className="cell-main">{row.name}</td><td>{row.account_type}</td><td>{row.debit}</td><td>{row.credit}</td><td>{row.balance}</td></tr>)}</tbody></table></div></div>;
}
