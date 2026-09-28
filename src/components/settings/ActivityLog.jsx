import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Info, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { getAuditLogs, getAuditStats } from "../../api/settingsApi";

const severityClasses = {
  success: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  info: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
  error: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
};

const categoryLabels = {
  authentication: "Authentication",
  tenant_lifecycle: "Tenant Lifecycle",
  user_roles: "User & Roles",
  billing: "Billing",
  data_storage: "Data & Storage",
  academic: "Academic",
  system_config: "System & Config",
  security: "Security",
};

const formatDateTime = (input) => {
  if (!input) return "—";

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        getAuditLogs({ limit: 80, search: query }),
        getAuditStats(),
      ]);

      setLogs(logsRes.data?.data || []);
      setStats(statsRes.data?.data || null);
    } catch (error) {
      console.error("ActivityLog fetch failed", error);
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [query]);

  const filteredLogs = useMemo(() => {
    if (!query.trim()) return logs;

    const q = query.toLowerCase();
    return logs.filter((log) => {
      const source = [
        log.title,
        log.message,
        log.action,
        log.user_email,
        log.tenant_name,
        categoryLabels[log.category] || "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return source.includes(q);
    });
  }, [logs, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-3)]">
            Activity
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--text-1)]">
            Activity Log
          </h2>
        </div>

        <div className="w-full max-w-xs rounded-xl border border-[var(--border-card)] bg-[var(--bg-surface)] px-3 py-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activity..."
            className="w-full bg-transparent text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">
            <Activity size={14} />
            Total
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--text-1)]">
            {stats?.summary?.total ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">
            <CheckCircle2 size={14} />
            Success
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-300">
            {stats?.summary?.successes ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">
            <AlertTriangle size={14} />
            Warning
          </div>
          <div className="mt-3 text-2xl font-bold text-amber-300">
            {stats?.summary?.warnings ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-3)]">
            <Shield size={14} />
            Security
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-300">
            {stats?.severities?.find((item) => item.severity === "error")?.count ?? 0}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border-card)] bg-[var(--bg-surface)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-1)]">
            <Clock3 size={16} />
            Recent system activity
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[var(--text-2)]">Loading activity logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 text-sm text-[var(--text-2)]">
            No activity recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--bg-surface)] text-[var(--text-3)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-t border-[var(--border-card)] align-top">
                    <td className="px-4 py-3 text-[var(--text-2)] whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-1)] whitespace-nowrap">
                      <div className="font-medium">{log.user_email || "System"}</div>
                      <div className="text-[11px] text-[var(--text-3)]">
                        {log.user_type || "system"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text-1)]">{log.title || log.action}</div>
                      <div className="text-[11px] text-[var(--text-3)]">{log.action}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-1 text-[11px] font-medium text-[var(--text-1)] bg-[var(--bg-surface)] border border-[var(--border-card)]">
                        {categoryLabels[log.category] || log.category || "System"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="text-[var(--text-2)]">{log.message}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              `inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${severityClasses[log.severity] || severityClasses.info}`
                            }
                          >
                            {log.severity || "info"}
                          </span>
                          {log.tenant_name && (
                            <span className="text-[11px] text-[var(--text-3)]">
                              {log.tenant_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
