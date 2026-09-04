import React, { useEffect, useMemo, useState } from "react";
import { getAuditLogs, getAuditStats } from "../../api/settingsApi";
import { getAllTenants } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { 
  Shield, Key, Building, CreditCard, Database, 
  GraduationCap, Settings, ShieldAlert, Lock, 
  Search, Filter, AlertTriangle, CheckCircle, 
  Info, XCircle, Activity, EyeOff, Server
} from "lucide-react";
import clsx from "clsx";

const categoryMeta = {
  authentication: { label: "Authentication", icon: Key, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  tenant_lifecycle: { label: "Tenant Lifecycle", icon: Building, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  user_roles: { label: "User & Roles", icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  billing: { label: "Billing", icon: CreditCard, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  data_storage: { label: "Data & Storage", icon: Database, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
  academic: { label: "Academic (Confidential)", icon: GraduationCap, color: "text-slate-500", bg: "bg-slate-800/50", border: "border-slate-700/50", isConfidential: true },
  system_config: { label: "System & Config", icon: Settings, color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  security: { label: "Security Threat", icon: ShieldAlert, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const severityMeta = {
  success: { label: "Success", icon: CheckCircle, color: "text-emerald-400" },
  warning: { label: "Warning", icon: AlertTriangle, color: "text-amber-400" },
  info: { label: "Info", icon: Info, color: "text-sky-400" },
  error: { label: "Critical", icon: XCircle, color: "text-rose-400" },
};

const SuperAdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("threats"); // threats, operations, confidential
  const [tenantFilter, setTenantFilter] = useState("all");
  const [tenantOptions, setTenantOptions] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [logsRes, statsRes] = await Promise.all([
          getAuditLogs({
            limit: 500,
            search,
            tenantName: tenantFilter === "all" ? "" : tenantFilter,
          }),
          getAuditStats({
            tenantName: tenantFilter === "all" ? "" : tenantFilter,
          }),
        ]);
        setLogs(logsRes.data?.data || []);
        setStats(statsRes.data?.data || null);
      } catch (err) {
        toast.error("Failed to load audit logs");
        setLogs([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [search, tenantFilter]);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        if (!token) return;
        const response = await getAllTenants(token);
        const items = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.tenants)
            ? response.data.tenants
            : [];
        const names = items
          .map((tenant) => tenant?.name || tenant?.slug || tenant?.email)
          .filter(Boolean)
          .sort();
        setTenantOptions(names);
      } catch (err) {
        setTenantOptions([]);
      }
    };

    loadTenants();
  }, [token]);

  const visibleLogs = useMemo(() => {
    return logs.filter(log => {
      if (activeTab === "threats") {
        return log.category === "security" || log.category === "authentication" || log.severity === "error";
      }
      if (activeTab === "operations") {
        return !["security", "academic"].includes(log.category) && log.severity !== "error";
      }
      if (activeTab === "confidential") {
        return log.category === "academic";
      }
      return true;
    });
  }, [logs, activeTab]);

  const getThreatLevel = () => {
    const errors = stats?.summary?.errors || 0;
    const warnings = stats?.summary?.warnings || 0;
    if (errors > 10) return { label: "Elevated Risk", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: ShieldAlert };
    if (warnings > 20) return { label: "Monitoring", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: AlertTriangle };
    return { label: "Secure", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Shield };
  };

  const threatStatus = getThreatLevel();
  const ThreatIcon = threatStatus.icon;

  return (
    <div
      style={{
        background: "var(--bg-main)",
        minHeight: "100vh",
        color: "var(--text-1)",
      }}
      className="p-8 font-sans"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="text-indigo-400" size={32} />
            Security & Audit Logs
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            Monitor system-wide activity, track security anomalies, and oversee tenant operations. 
            Academic data is strictly redacted to maintain college confidentiality.
          </p>
        </div>
        
        <div className={clsx("flex items-center gap-4 px-5 py-3 rounded-2xl border backdrop-blur-md shadow-lg", threatStatus.bg, threatStatus.border)}>
          <div className={clsx("p-2 rounded-full bg-white/5", threatStatus.color)}>
            <ThreatIcon size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">System Posture</div>
            <div className={clsx("text-lg font-bold", threatStatus.color)}>{threatStatus.label}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="text-sm text-slate-400 font-medium flex items-center gap-2 mb-2"><Server size={16} /> Total Events</div>
          <div className="text-3xl font-bold text-white">
            {stats?.summary?.total?.toLocaleString() ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="text-sm text-slate-400 font-medium flex items-center gap-2 mb-2"><ShieldAlert size={16} /> Security Threats</div>
          <div className="text-3xl font-bold text-rose-400">
            {logs.filter(l => l.category === 'security' || l.severity === 'error').length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="text-sm text-slate-400 font-medium flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Warnings</div>
          <div className="text-3xl font-bold text-amber-400">
            {stats?.summary?.warnings?.toLocaleString() ?? 0}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="text-sm text-slate-400 font-medium flex items-center gap-2 mb-2"><Lock size={16} /> Redacted Events</div>
          <div className="text-3xl font-bold text-slate-500">
            {logs.filter(l => l.category === 'academic').length}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Toolbar */}
        <div className="border-b border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            
            {/* Tabs */}
            <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800 w-full lg:w-auto">
              <button
                onClick={() => setActiveTab("threats")}
                className={clsx("flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "threats" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "text-slate-400 hover:text-slate-200")}
              >
                <ShieldAlert size={16} /> Threat Intel
              </button>
              <button
                onClick={() => setActiveTab("operations")}
                className={clsx("flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "operations" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-slate-400 hover:text-slate-200")}
              >
                <Server size={16} /> System Ops
              </button>
              <button
                onClick={() => setActiveTab("confidential")}
                className={clsx("flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "confidential" ? "bg-slate-800 text-slate-300 border border-slate-700" : "text-slate-400 hover:text-slate-200")}
              >
                <EyeOff size={16} /> Academic (Redacted)
              </button>
            </div>

            {/* Filters */}
            <div className="flex w-full lg:w-auto gap-3">
              <div className="relative w-full lg:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <select
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none min-w-[140px]"
              >
                <option value="all">All Tenants</option>
                {tenantOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Log List */}
        <div className="p-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p>Analyzing system logs...</p>
            </div>
          ) : visibleLogs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Filter size={32} className="opacity-50" />
              <p>No audit events match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {visibleLogs.map((log) => {
                const category = categoryMeta[log.category] || categoryMeta.system_config;
                const severity = severityMeta[log.severity] || severityMeta.info;
                const SevIcon = severity.icon;
                const CatIcon = category.icon;
                const metadata = log.metadata || {};

                return (
                  <div
                    key={log.id}
                    className={clsx(
                      "group flex flex-col md:flex-row gap-4 p-4 rounded-xl border transition-all hover:bg-slate-800/30",
                      category.isConfidential ? "bg-slate-950/40 border-slate-800/50" : "bg-slate-900/60 border-slate-800",
                      log.severity === 'error' && "border-rose-500/30 bg-rose-950/10"
                    )}
                  >
                    {/* Icon & Time */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start md:w-32 shrink-0 gap-2 border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-4">
                      <div className={clsx("p-2 rounded-lg border", category.bg, category.border, category.color)}>
                        <CatIcon size={20} />
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-slate-300">
                          {new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className={clsx("font-semibold text-base", category.isConfidential ? "text-slate-500" : "text-slate-200")}>
                          {log.title || log.action || "System Event"}
                        </h3>
                        {!category.isConfidential && (
                          <span className={clsx("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-950 border border-slate-800", severity.color)}>
                            <SevIcon size={10} /> {severity.label}
                          </span>
                        )}
                      </div>

                      {category.isConfidential ? (
                         <div className="flex items-center gap-2 text-sm text-slate-500 italic mt-2 bg-slate-950/50 p-2 rounded-md border border-slate-800/50 w-fit">
                           <Lock size={14} />
                           <span>[Confidential College Data - Payload Redacted]</span>
                         </div>
                      ) : (
                         <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                           {log.message || "Action processed successfully with no additional details."}
                         </p>
                      )}

                      {/* Meta Tags */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {log.user_email && (
                          <div className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-400">
                            <span className="text-slate-600 mr-1">Actor:</span>{category.isConfidential ? '***@***.***' : log.user_email}
                          </div>
                        )}
                        {log.tenant_name && (
                          <div className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-400">
                            <span className="text-slate-600 mr-1">Tenant:</span>{log.tenant_name}
                          </div>
                        )}
                        {log.ip_address && !category.isConfidential && (
                          <div className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-400">
                            <span className="text-slate-600 mr-1">IP:</span>{log.ip_address}
                          </div>
                        )}
                        {Object.keys(metadata).length > 0 && !category.isConfidential && (
                           <div className="px-2.5 py-1 rounded-md bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300">
                             + {Object.keys(metadata).length} parameters logged
                           </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Scrollbar Styles embedded */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--bg-hover);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border-card);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--accent);
        }
      `}} />
    </div>
  );
};

export default SuperAdminAuditLogs;
