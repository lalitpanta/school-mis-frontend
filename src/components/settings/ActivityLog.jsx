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
          <div className="divide-y divide-[var(--border-card)]">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        `inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${severityClasses[log.severity] || severityClasses.info}`
                      }
                    >
                      {log.title || log.action || "Activity"}
                    </span>
                    <span className="truncate text-sm text-[var(--text-1)]">
                      {log.user_email || "System"}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-3)]">
                    <span>{categoryLabels[log.category] || log.category || "System"}</span>
                    <span>•</span>
                    <span className="truncate">{log.message || "System activity recorded"}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right text-[11px] text-[var(--text-3)]">
                  {formatDateTime(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
