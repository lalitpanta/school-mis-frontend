import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Info,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAuditLogs, getAuditStats } from "../../api/settingsApi";

const severityClasses = {
  success: "bg-success text-success border border-success",
  warning: "bg-warning-soft text-warning border border-warning",
  info: "bg-accent-soft text-accent border border-accent",
  error: "bg-danger-soft text-danger border border-danger",
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Activity
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
            Activity Log
          </h2>
        </div>

        <div className="w-full max-w-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search activity..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <Activity size={14} />
            Total
          </div>
          <div className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
            {stats?.summary?.total ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <CheckCircle2 size={14} />
            Success
          </div>
          <div className="mt-3 text-2xl font-bold text-success">
            {stats?.summary?.successes ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <AlertTriangle size={14} />
            Warning
          </div>
          <div className="mt-3 text-2xl font-bold text-warning">
            {stats?.summary?.warnings ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <Shield size={14} />
            Security
          </div>
          <div className="mt-3 text-2xl font-bold text-danger">
            {stats?.severities?.find((item) => item.severity === "error")
              ?.count ?? 0}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <Clock3 size={16} />
            Recent system activity
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-[var(--text-muted)]">
            Loading activity logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-6 text-sm text-[var(--text-muted)]">
            No activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${severityClasses[log.severity] || severityClasses.info}`}
                    >
                      {log.title || log.action || "Activity"}
                    </span>
                    <span className="truncate text-sm text-[var(--text-primary)]">
                      {log.user_email || "System"}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>
                      {categoryLabels[log.category] || log.category || "System"}
                    </span>
                    <span>•</span>
                    <span className="truncate">
                      {log.message || "System activity recorded"}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right text-[11px] text-[var(--text-muted)]">
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
