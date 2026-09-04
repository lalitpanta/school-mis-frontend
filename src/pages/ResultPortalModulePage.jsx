import { useEffect, useMemo, useState } from "react";
import { Copy, Eye, Lock, Unlock, Download, Send, Search } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const defaultPortalSettings = {
  enabled: true,
  allowDownload: true,
  allowPublicLookup: true,
  message:
    "Students and parents can use the shared link with roll number and date of birth to view results.",
};

const ResultPortalModulePage = () => {
  const { user } = useAuth();
  const [portalConfig, setPortalConfig] = useState(defaultPortalSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [examFormats, setExamFormats] = useState([]);
  const [publishingExamId, setPublishingExamId] = useState(null);
  const [copied, setCopied] = useState(false);

  const publicLink = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const tenantSlug = user?.tenantSlug || user?.slug || "";
    return `${base}/result-portal${tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : ""}`;
  }, [user]);

  const loadPortalConfig = async () => {
    try {
      const response = await axiosInstance.get("/v1/settings");
      const settings = response.data?.data || {};
      const portalSetting = settings.result_portal || {};
      setPortalConfig({
        ...defaultPortalSettings,
        ...portalSetting,
        enabled: portalSetting.enabled !== false,
        allowDownload: portalSetting.allowDownload !== false,
        allowPublicLookup: portalSetting.allowPublicLookup !== false,
      });
    } catch (error) {
      console.error("Failed to load portal settings", error);
    }
  };

  const loadExamFormats = async () => {
    try {
      const response = await axiosInstance.get("/v1/results/exam-formats");
      setExamFormats(response.data?.data || []);
    } catch (error) {
      console.error("Failed to load exam formats", error);
    }
  };

  const savePortalConfig = async (updates) => {
    try {
      setSaving(true);
      const nextConfig = { ...portalConfig, ...updates };
      setPortalConfig(nextConfig);
      await axiosInstance.patch("/v1/settings", {
        result_portal: nextConfig,
      });
    } catch (error) {
      console.error("Failed to update portal settings", error);
      await loadPortalConfig();
    } finally {
      setSaving(false);
    }
  };

  const toggleExamPublication = async (exam, nextState) => {
    try {
      setPublishingExamId(exam.id);
      await axiosInstance.patch(`/v1/results/exam-formats/${exam.id}/publish`, {
        is_published: nextState,
      });
      await loadExamFormats();
    } catch (error) {
      console.error("Failed to update exam publication", error);
    } finally {
      setPublishingExamId(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadPortalConfig(), loadExamFormats()]);
      setLoading(false);
    };

    init();
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen px-4 py-8 text-[var(--text-1)]" style={{ background: "var(--bg-main)" }}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="mis-card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-400">
                Result Portal
              </p>
              <h1 className="mis-page-title">
                Manage public result distribution
              </h1>
              <p className="mt-2 max-w-2xl text-[var(--text-2)]">
                Share one public link with students and parents. They only need
                the roll number and date of birth to open the result, view
                marks, grades, pass/fail status, and download a PDF.
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
              {portalConfig.enabled ? "Portal is live" : "Portal is disabled"}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="mis-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Portal controls</h2>
                <p className="mt-1 text-[var(--text-2)]">
                  Enable, disable, or revoke the shared result link at any time.
                </p>
              </div>
              <button
                onClick={() =>
                  savePortalConfig({ enabled: !portalConfig.enabled })
                }
                disabled={saving}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${portalConfig.enabled ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/20" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20"}`}
              >
                {portalConfig.enabled ? (
                  <Lock size={16} />
                ) : (
                  <Unlock size={16} />
                )}
                {portalConfig.enabled ? "Disable link" : "Enable link"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-surface)] p-4">
              <label className="mb-2 block text-sm font-semibold text-[var(--text-1)]">
                Public link
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  readOnly
                  value={publicLink}
                  className="mis-input flex-1"
                />
                <button
                  onClick={copyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-hover)] px-4 py-2.5 text-sm font-semibold text-[var(--text-1)] transition hover:border-[var(--accent)]"
                >
                  <Copy size={16} /> {copied ? "Copied" : "Copy link"}
                </button>
              </div>
              <p className="mt-3 text-sm text-[var(--text-2)]">
                Students and parents open this link and enter their roll number
                plus date of birth.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-1)]">
                <input
                  type="checkbox"
                  checked={portalConfig.allowDownload}
                  onChange={(e) =>
                    savePortalConfig({ allowDownload: e.target.checked })
                  }
                  className="h-4 w-4 rounded"
                />
                Allow PDF download from the public result page
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-1)]">
                <input
                  type="checkbox"
                  checked={portalConfig.allowPublicLookup}
                  onChange={(e) =>
                    savePortalConfig({ allowPublicLookup: e.target.checked })
                  }
                  className="h-4 w-4 rounded"
                />
                Allow public lookup without login
              </label>
            </div>
          </div>

          <div className="mis-card p-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Send size={18} className="text-indigo-400" />
              Published exams
            </div>
            <p className="mt-2 text-[var(--text-2)]">
              Publish an exam to make its results visible through the public
              portal.
            </p>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-2)]">
                Loading published results...
              </div>
            ) : examFormats.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-2)]">
                No exam formats found yet.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {examFormats.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-2xl border border-[var(--border-dim)] bg-[var(--bg-surface)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[var(--text-1)]">
                          {exam.exam_type}
                        </div>
                        <div className="mt-1 text-sm text-[var(--text-2)]">
                          {exam.class_name || "Class"} •{" "}
                          {exam.section_name || "Section"} •{" "}
                          {exam.term || "Term"}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${exam.is_published ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-[var(--bg-hover)] text-[var(--text-2)]"}`}
                      >
                        {exam.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-[var(--text-2)]">
                        {exam.is_published
                          ? "Students can see this exam result from the shared portal."
                          : "Publish this exam to open it publicly."}
                      </div>
                      <button
                        onClick={() =>
                          toggleExamPublication(exam, !exam.is_published)
                        }
                        disabled={publishingExamId === exam.id}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${exam.is_published ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/20" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20"}`}
                      >
                        {publishingExamId === exam.id
                          ? "Updating..."
                          : exam.is_published
                            ? "Unpublish"
                            : "Publish"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPortalModulePage;
