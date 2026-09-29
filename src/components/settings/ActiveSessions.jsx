import { useCallback, useEffect, useState } from "react";
import { MonitorSmartphone, RefreshCw, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import {
  getActiveSessions,
  revokeActiveSession,
  revokeOtherActiveSessions,
} from "../../api/settingsApi";

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const ActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busySessionId, setBusySessionId] = useState(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const loadSessions = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await getActiveSessions();
      setSessions(response.data?.data || []);
      setCurrentSessionId(response.data?.currentSessionId || null);
    } catch (error) {
      console.error("Active sessions fetch failed", error);
      toast.error("Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (session) => {
    setBusySessionId(session.session_id);
    try {
      await revokeActiveSession(session.session_id);
      setSessions((current) =>
        current.filter((item) => item.session_id !== session.session_id),
      );
      toast.success("Session signed out");
    } catch (error) {
      console.error("Active session revoke failed", error);
      toast.error(
        error.response?.data?.message || "Failed to sign out session",
      );
    } finally {
      setBusySessionId(null);
    }
  };

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      const response = await revokeOtherActiveSessions();
      const revokedCount = response.data?.data?.revokedCount || 0;
      setSessions((current) =>
        current.filter((session) => session.session_id === currentSessionId),
      );
      toast.success(
        revokedCount
          ? `Signed out ${revokedCount} other session${revokedCount === 1 ? "" : "s"}`
          : "No other active sessions",
      );
    } catch (error) {
      console.error("Other session revoke failed", error);
      toast.error(
        error.response?.data?.message || "Failed to sign out other sessions",
      );
    } finally {
      setRevokingOthers(false);
    }
  };

  const otherSessionCount = sessions.filter(
    (session) => session.session_id !== currentSessionId,
  ).length;

  return (
    <section className="space-y-4 text-(--text-1)">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--text-3)">
            Security
          </p>
          <h2 className="mt-1 text-xl font-semibold">Active sessions</h2>
          <p className="mt-1 text-sm text-(--text-3)">
            Devices currently signed in to this tenant
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadSessions()}
          disabled={loading}
          aria-label="Refresh active sessions"
          title="Refresh active sessions"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-(--border-card) text-(--text-2) transition hover:bg-(--bg-surface) disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="overflow-hidden rounded-xl border border-(--border-card) bg-(--bg-card)">
        <div className="flex items-center gap-2 border-b border-(--border-card) px-5 py-3.5">
          <MonitorSmartphone size={17} className="text-(--text-2)" />
          <span className="text-sm font-semibold">Active sessions</span>
        </div>

        {loading ? (
          <div className="px-5 py-7 text-sm text-(--text-3)">
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-7 text-sm text-(--text-3)">
            <ShieldCheck size={18} />
            No active sessions were found for this tenant.
          </div>
        ) : (
          <div className="divide-y divide-(--border-card)">
            {sessions.map((session) => {
              const isCurrent = session.session_id === currentSessionId;
              return (
                <div
                  key={session.session_id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-semibold text-(--text-1)">
                        {session.ip_address || "IP address unavailable"}
                      </strong>
                      {isCurrent && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                          This device
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-1 max-w-full overflow-hidden text-ellipsis text-xs leading-5 text-(--text-3) sm:whitespace-nowrap"
                      title={
                        session.user_agent || "Browser information unavailable"
                      }
                    >
                      {session.user_agent || "Browser information unavailable"}
                    </p>
                    <p className="text-xs leading-5 text-(--text-3)">
                      {session.user_email} · Signed in{" "}
                      {formatDateTime(session.signed_in_at)}
                      {" · "}Last active{" "}
                      {formatDateTime(session.last_active_at)}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(session)}
                      disabled={busySessionId === session.session_id}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-(--border-card) px-4 py-2 text-sm font-semibold text-(--text-1) transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"
                    >
                      {busySessionId === session.session_id
                        ? "Signing out..."
                        : "Sign out"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <footer className="border-t border-(--border-card) px-5 py-3.5">
          <button
            type="button"
            onClick={handleRevokeOthers}
            disabled={revokingOthers || otherSessionCount === 0 || loading}
            className="rounded-lg border border-(--border-card) px-4 py-2 text-sm font-semibold text-(--text-1) transition hover:bg-(--bg-surface) disabled:cursor-not-allowed disabled:opacity-45"
          >
            {revokingOthers
              ? "Signing out sessions..."
              : "Sign out all other sessions"}
          </button>
        </footer>
      </div>
    </section>
  );
};

export default ActiveSessions;
