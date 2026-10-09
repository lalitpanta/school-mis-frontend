import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import { getAllTenants } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";

const downloadJsonFile = (payload, fileName) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

const getBackupErrorMessage = (error) => {
  const responseData = error?.response?.data;
  if (typeof responseData === "string") {
    try {
      const parsed = JSON.parse(responseData);
      if (parsed?.message) return parsed.message;
    } catch {
      if (responseData.trim()) return responseData;
    }
  }
  return (
    responseData?.message ||
    error?.message ||
    "Failed to download backup."
  );
};

const Backup = () => {
  const { token, user, isAdmin } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("all");
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const canViewAllTenants = useMemo(
    () => isAdmin() || user?.type === "super_admin" || user?.type === "admin",
    [isAdmin, user?.type],
  );

  useEffect(() => {
    let isMounted = true;

    const loadTenants = async () => {
      setLoadingTenants(true);
      setError("");

      try {
        if (!token) {
          if (isMounted) {
            setTenants([]);
            setSelectedTenantId("none");
          }
          return;
        }

        if (!canViewAllTenants) {
          if (isMounted) {
            const currentTenantId = user?.tenantId || user?.id || "current-tenant";
            const currentTenantName =
              user?.name ||
              user?.firstName ||
              user?.email ||
              "Current Tenant";
            setTenants([
              {
                id: currentTenantId,
                name: currentTenantName,
                slug: user?.slug || user?.databaseName || "current-tenant",
                database_name: user?.databaseName || "current-tenant",
              },
            ]);
            setSelectedTenantId(currentTenantId);
          }
          return;
        }

        const response = await getAllTenants(token);
        const list = Array.isArray(response?.data) ? response.data : [];
        const activeTenants = list.filter(
          (tenant) => tenant && (!tenant.is_active || tenant.is_active !== false),
        );

        if (isMounted) {
          setTenants(activeTenants);
          setSelectedTenantId(activeTenants.length > 0 ? "all" : "none");
        }
      } catch (err) {
        if (isMounted) {
          const message =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to load tenant list";
          setError(message);
          setSelectedTenantId("none");
        }
      } finally {
        if (isMounted) {
          setLoadingTenants(false);
        }
      }
    };

    loadTenants();

    return () => {
      isMounted = false;
    };
  }, [canViewAllTenants, token, user?.id, user?.firstName, user?.slug, user?.databaseName, user?.email, user?.name]);

  const tenantOptions = useMemo(() => {
    const options = [];

    if (canViewAllTenants) {
      options.push({ value: "all", label: "All Tenants" });
    }

    tenants.forEach((tenant) => {
      if (!tenant || !tenant.id) return;
      options.push({
        value: String(tenant.id),
        label: tenant.name || tenant.slug || tenant.database_name || "Unnamed tenant",
      });
    });

    return options;
  }, [canViewAllTenants, tenants]);

  const handleDownload = async () => {
    if (!token) {
      const message = "Authentication required to download backup.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!selectedTenantId || selectedTenantId === "none") {
      const message = "No tenant is available to back up.";
      setError(message);
      toast.error(message);
      return;
    }

    setDownloading(true);
    setError("");

    try {
      if (selectedTenantId === "all") {
        if (!tenants.length) {
          throw new Error("No tenant records are available for a full backup.");
        }

        const backups = await Promise.all(
          tenants.map(async (tenant) => {
            const response = await axiosInstance.get(
              `/v1/auth/tenant/${tenant.id}/backup`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                responseType: "text",
              },
            );

            const parsed = JSON.parse(response.data || "{}");
            return parsed && parsed.tenant ? parsed : { ...parsed, tenant: tenant };
          }),
        );

        const payload = {
          exported_at: new Date().toISOString(),
          scope: "all_tenants",
          tenant_count: backups.length,
          tenants: backups,
        };

        downloadJsonFile(payload, `all-tenants-backup-${new Date().toISOString().slice(0, 10)}.json`);
        toast.success(`Downloaded backup for ${backups.length} tenants.`);
        return;
      }

      const response = await axiosInstance.get(
        `/v1/auth/tenant/${selectedTenantId}/backup`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "text",
        },
      );

      const parsed = JSON.parse(response.data || "{}");
      const fileName =
        parsed?.tenant?.slug ||
        parsed?.tenant?.database_name ||
        selectedTenantId + "-backup.json";

      downloadJsonFile(parsed, `${fileName}.json`);
      toast.success("Tenant backup downloaded successfully.");
    } catch (err) {
      const message = getBackupErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-6" style={{ color: "var(--text-primary)" }}>
      <div className="flex flex-col gap-2 mb-6">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--text-muted)" }}
        >
          Data Protection
        </p>
        <h2 className="text-xl font-bold">Backup</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Download tenant data as a structured JSON backup. Use the tenant selector to export either one tenant or every tenant in the system.
        </p>
      </div>

      {error && (
        <div
          className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.08)",
            borderColor: "rgba(239,68,68,0.35)",
            color: "var(--danger)",
          }}
        >
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div
        className="rounded-2xl border p-5"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="min-w-0 flex-1">
            <label
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Tenant
            </label>
            <select
              value={selectedTenantId}
              onChange={(event) => setSelectedTenantId(event.target.value)}
              disabled={loadingTenants || tenantOptions.length === 0}
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              {tenantOptions.length === 0 ? (
                <option value="none">No tenants available</option>
              ) : (
                tenantOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={loadingTenants || downloading || tenantOptions.length === 0}
            className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent))",
              color: "var(--text-primary)",
              boxShadow: "0 10px 24px rgba(79,70,229,0.25)",
            }}
          >
            {downloading ? "Preparing backup..." : "Download Backup"}
          </button>
        </div>

        <div className="mt-5 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}>
          {selectedTenantId === "all"
            ? "All Tenants: downloads a complete JSON backup containing each tenant’s data in a single file."
            : "Single Tenant: downloads only the selected tenant’s dataset as JSON."}
        </div>
      </div>

      {loadingTenants && (
        <div className="mt-5 flex items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-accent" />
          Loading tenant list...
        </div>
      )}
    </div>
  );
};

export default Backup;
