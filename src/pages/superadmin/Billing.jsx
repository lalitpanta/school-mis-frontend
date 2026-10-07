import { useEffect, useState } from "react";

const SuperAdminBilling = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        background: "var(--bg-page)",
        minHeight: "100vh",
        color: "var(--text-primary)",
      }}
      className="p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted">
            Platform billing and invoices for the superadmin view
          </p>
        </div>
      </div>

      <div
        className="rounded-xl p-4"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="text-sm text-muted">
            No billing data available in this environment.
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminBilling;
