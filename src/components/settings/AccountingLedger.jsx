import { useEffect, useState } from "react";
import { getAccountingAccounts, getTrialBalance } from "../../api/accountsApi";

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function AccountingLedger() {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getAccountingAccounts(), getTrialBalance()])
      .then(([accountsResponse, balanceResponse]) => {
        if (!active) return;
        setAccounts(accountsResponse.data?.data || []);
        setBalances(balanceResponse.data?.data || []);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || "Unable to load accounting data.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const totalDebit = balances.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const totalCredit = balances.reduce((sum, row) => sum + Number(row.credit || 0), 0);

  return (
    <div className="acc-settings">
      <div className="acc-section-row">
        <div>
          <div className="acc-section-title">General ledger</div>
          <div className="acc-section-sub">Authoritative double-entry account balances</div>
        </div>
        <span className={`acc-badge ${Math.abs(totalDebit - totalCredit) < 0.01 ? "success" : "danger"}`}>
          {Math.abs(totalDebit - totalCredit) < 0.01 ? "Balanced" : "Needs review"}
        </span>
      </div>

      {error && <div className="acc-settings-message">{error}</div>}
      {loading ? (
        <div className="acc-settings-message">Loading ledger...</div>
      ) : (
        <>
          <div className="acc-stat-grid">
            <div className="acc-mini-card"><div className="acc-mini-label">Chart of accounts</div><div className="acc-mini-value">{accounts.length}</div></div>
            <div className="acc-mini-card"><div className="acc-mini-label">Total debits</div><div className="acc-mini-value">Rs. {formatAmount(totalDebit)}</div></div>
            <div className="acc-mini-card"><div className="acc-mini-label">Total credits</div><div className="acc-mini-value">Rs. {formatAmount(totalCredit)}</div></div>
          </div>
          <div className="acc-table-wrap">
            <table className="acc-table">
              <thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Debit</th><th>Credit</th></tr></thead>
              <tbody>
                {balances.map((row) => (
                  <tr key={row.id}>
                    <td>{row.code}</td>
                    <td className="cell-main">{row.name}</td>
                    <td>{row.account_type}</td>
                    <td className="acc-amount-pos">Rs. {formatAmount(row.debit)}</td>
                    <td className="acc-amount-neg">Rs. {formatAmount(row.credit)}</td>
                  </tr>
                ))}
                {!balances.length && <tr><td colSpan="5">No posted journal entries yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
