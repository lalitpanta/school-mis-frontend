import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { Settings, Save, ImagePlus } from "lucide-react";
import toast from "react-hot-toast";

const SuperAdminSettings = () => {
  const { user } = useAuth();
  const {
    settings,
    settingsLoaded,
    updateMultipleSettings,
    fetchSettings,
    loading,
  } = useSettings();
  const [form, setForm] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized || !settingsLoaded) return;
    if (!settings || Object.keys(settings).length === 0) return;

    const profile = settings?.school_profile || {};
    const ipAllowlist =
      typeof settings?.restrict_login_by_ip_allowlist === "object"
        ? settings.restrict_login_by_ip_allowlist.list || ""
        : "";

    setForm({
      platformName:
        settings?.platform_name ||
        settings?.system_name ||
        profile.name ||
        "EduSphere School ERP",
      language: settings?.language || "English",
      systemEmail: settings?.system_email || "admin@system.local",
      supportEmail: settings?.support_email || "support@system.local",
      timezone: settings?.timezone || "Asia/Kathmandu (GMT+5:45)",
      currency: settings?.currency || "INR",
      defaultPlan: settings?.default_plan || "Trial - 14 days",
      sessionDomain: settings?.session_domain || ".edusphere.io",
      platformTagline:
        settings?.platform_tagline || "A smarter school ERP platform",
      maintenanceMode:
        settings?.maintenance_mode !== undefined
          ? settings.maintenance_mode
          : false,
      allowNewTenants:
        settings?.allow_new_tenants !== undefined
          ? settings.allow_new_tenants
          : true,
      autoSuspendOverdueInvoice:
        settings?.auto_suspend_overdue_invoice !== undefined
          ? settings.auto_suspend_overdue_invoice
          : true,
      enforce2FAAdmins:
        settings?.enforce_2fa_admins !== undefined
          ? settings.enforce_2fa_admins
          : false,
      enforce2FATenantAdmins:
        settings?.enforce_2fa_tenant_admins !== undefined
          ? settings.enforce_2fa_tenant_admins
          : false,
      restrictLoginByIP:
        settings?.restrict_login_by_ip_allowlist?.enabled || false,
      ipAllowlist,
      sessionTimeoutMinutes:
        settings?.session_timeout_minutes !== undefined
          ? settings.session_timeout_minutes
          : 30,
      minimumPasswordLength:
        settings?.minimum_password_length !== undefined
          ? settings.minimum_password_length
          : 10,
      passwordRotationDays:
        settings?.password_rotation_days !== undefined
          ? settings.password_rotation_days
          : 90,
      apiRateLimitPerMinute:
        settings?.api_rate_limit_per_minute !== undefined
          ? settings.api_rate_limit_per_minute
          : 120,
      defaultStorageQuota: settings?.default_storage_quota || "5 GB (Starter)",
      maxUploadFileSize: settings?.max_upload_file_size || "10 MB",
      allowedFileTypes:
        settings?.allowed_file_types || "pdf, docx, xlsx, jpg, png",
      storageProvider: settings?.storage_provider || "Amazon S3 — ap-south-1",
      warnTenantsAt60:
        settings?.warn_tenants_at_60_percent !== undefined
          ? settings.warn_tenants_at_60_percent
          : true,
      blockUploadsAt100:
        settings?.block_uploads_at_100_percent !== undefined
          ? settings.block_uploads_at_100_percent
          : true,
      autoArchiveFilesOlderThanYears:
        settings?.auto_archive_files_older_than_years !== undefined
          ? settings.auto_archive_files_older_than_years
          : 2,
    });
    setLogoPreview(profile.logo || null);
    setIsInitialized(true);
  }, [settings, isInitialized]);

  const handleSettingChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const profile = settings?.school_profile || {};
      const payload = {
        system_name: form.platformName,
        platform_name: form.platformName,
        platform_tagline: form.platformTagline,
        system_email: form.systemEmail,
        support_email: form.supportEmail,
        timezone: form.timezone,
        currency: form.currency,
        default_plan: form.defaultPlan,
        session_domain: form.sessionDomain,
        maintenance_mode: form.maintenanceMode,
        allow_new_tenants: form.allowNewTenants,
        auto_suspend_overdue_invoice: form.autoSuspendOverdueInvoice,
        enforce_2fa_admins: form.enforce2FAAdmins,
        enforce_2fa_tenant_admins: form.enforce2FATenantAdmins,
        restrict_login_by_ip_allowlist: {
          enabled: form.restrictLoginByIP,
          list: form.ipAllowlist,
        },
        session_timeout_minutes: form.sessionTimeoutMinutes,
        minimum_password_length: form.minimumPasswordLength,
        password_rotation_days: form.passwordRotationDays,
        api_rate_limit_per_minute: form.apiRateLimitPerMinute,
        default_storage_quota: form.defaultStorageQuota,
        max_upload_file_size: form.maxUploadFileSize,
        allowed_file_types: form.allowedFileTypes,
        storage_provider: form.storageProvider,
        warn_tenants_at_60_percent: form.warnTenantsAt60,
        block_uploads_at_100_percent: form.blockUploadsAt100,
        auto_archive_files_older_than_years:
          form.autoArchiveFilesOlderThanYears,
        school_profile: {
          ...profile,
          logo: logoPreview || null,
        },
      };

      const success = await updateMultipleSettings(payload);
      if (!success) {
        throw new Error("Server rejected settings update");
      }

      await fetchSettings();
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!settingsLoaded || !form) {
    return (
      <div className="p-8 text-slate-300">Loading platform settings...</div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-main)",
        minHeight: "100vh",
        color: "var(--text-1)",
      }}
      className="p-8"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings size={32} className="text-indigo-400" />
          <div>
            <h1 className="text-4xl font-bold">Superadmin Settings</h1>
            <p className="text-sm text-slate-400">
              Configure platform defaults and shared tenant branding.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-sm"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <h2 className="text-2xl font-semibold mb-4">Platform settings</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Platform name
                </label>
                <input
                  value={form.platformName}
                  onChange={(e) =>
                    handleSettingChange("platformName", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Default currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    handleSettingChange("currency", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                >
                  <option>INR</option>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>NPR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Default plan for new tenants
                </label>
                <select
                  value={form.defaultPlan}
                  onChange={(e) =>
                    handleSettingChange("defaultPlan", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                >
                  <option>Trial - 14 days</option>
                  <option>Starter</option>
                  <option>Growth</option>
                  <option>Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Session domain
                </label>
                <input
                  value={form.sessionDomain}
                  onChange={(e) =>
                    handleSettingChange("sessionDomain", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  System email
                </label>
                <input
                  type="email"
                  value={form.systemEmail}
                  onChange={(e) =>
                    handleSettingChange("systemEmail", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Support email
                </label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) =>
                    handleSettingChange("supportEmail", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Platform tagline
                </label>
                <input
                  value={form.platformTagline}
                  onChange={(e) =>
                    handleSettingChange("platformTagline", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Timezone
                  </label>
                  <select
                    value={form.timezone}
                    onChange={(e) =>
                      handleSettingChange("timezone", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                  >
                    <option>Asia/Kathmandu (GMT+5:45)</option>
                    <option>Asia/Kolkata (GMT+5:30)</option>
                    <option>Asia/Singapore (GMT+8)</option>
                    <option>UTC</option>
                    <option>EST (US)</option>
                    <option>PST (US)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Language
                  </label>
                  <select
                    value={form.language}
                    onChange={(e) =>
                      handleSettingChange("language", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                  >
                    <option>English</option>
                    <option>Nepali</option>
                    <option>Hindi</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-sm"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-semibold">Tenant branding</h2>
              <p className="text-sm text-slate-400">
                Upload a shared system logo. This logo will appear for tenants
                in their navbar and tenant dashboards.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3 w-24 h-24 flex items-center justify-center">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Platform logo preview"
                  className="h-full w-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-slate-500">
                  <ImagePlus size={32} />
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Platform logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="w-full text-slate-200"
              />
              <p className="text-xs text-slate-500 mt-2">
                Use a transparent PNG or SVG for best results.
              </p>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-2">
              <label className="block text-sm font-medium mb-2">
                Logo preview
              </label>
              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-center text-slate-400">
                {logoPreview ? (
                  <div className="text-slate-200">
                    Logo will be visible to tenants
                  </div>
                ) : (
                  <div className="text-slate-500">No logo selected yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-sm"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <h2 className="text-2xl font-semibold mb-4">Platform controls</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.maintenanceMode}
                onChange={(e) =>
                  handleSettingChange("maintenanceMode", e.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800"
              />
              <div>
                <p className="font-medium">Maintenance mode</p>
                <p className="text-sm text-slate-400">
                  Disable tenant access while you update the platform.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowNewTenants}
                onChange={(e) =>
                  handleSettingChange("allowNewTenants", e.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800"
              />
              <div>
                <p className="font-medium">Allow new tenant registration</p>
                <p className="text-sm text-slate-400">
                  Enable or disable tenant self-signup across the platform.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoSuspendOverdueInvoice}
                onChange={(e) =>
                  handleSettingChange(
                    "autoSuspendOverdueInvoice",
                    e.target.checked,
                  )
                }
                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800"
              />
              <div>
                <p className="font-medium">Auto-suspend overdue invoices</p>
                <p className="text-sm text-slate-400">
                  Automatically suspend tenant access when payment is overdue.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-sm"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <h2 className="text-2xl font-semibold mb-4">Security settings</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enforce2FAAdmins}
                onChange={(e) =>
                  handleSettingChange("enforce2FAAdmins", e.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800"
              />
              <div>
                <p className="font-medium">Enforce 2FA for admins</p>
                <p className="text-sm text-slate-400">
                  Require two-factor authentication for superadmin users.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enforce2FATenantAdmins}
                onChange={(e) =>
                  handleSettingChange(
                    "enforce2FATenantAdmins",
                    e.target.checked,
                  )
                }
                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800"
              />
              <div>
                <p className="font-medium">Enforce 2FA for tenant admins</p>
                <p className="text-sm text-slate-400">
                  Require two-factor authentication for tenant administrator
                  logins.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.restrictLoginByIP}
                onChange={(e) =>
                  handleSettingChange("restrictLoginByIP", e.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800"
              />
              <div>
                <p className="font-medium">Restrict login by IP allowlist</p>
                <p className="text-sm text-slate-400">
                  Only allow sign-in from approved network addresses.
                </p>
              </div>
            </label>
            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Session timeout (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.sessionTimeoutMinutes}
                  onChange={(e) =>
                    handleSettingChange(
                      "sessionTimeoutMinutes",
                      Number(e.target.value),
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum password length
                </label>
                <input
                  type="number"
                  min={6}
                  value={form.minimumPasswordLength}
                  onChange={(e) =>
                    handleSettingChange(
                      "minimumPasswordLength",
                      Number(e.target.value),
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password rotation (days)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.passwordRotationDays}
                  onChange={(e) =>
                    handleSettingChange(
                      "passwordRotationDays",
                      Number(e.target.value),
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  API rate limit (req/min)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.apiRateLimitPerMinute}
                  onChange={(e) =>
                    handleSettingChange(
                      "apiRateLimitPerMinute",
                      Number(e.target.value),
                    )
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                IP allowlist
              </label>
              <textarea
                value={form.ipAllowlist}
                onChange={(e) =>
                  handleSettingChange("ipAllowlist", e.target.value)
                }
                rows={4}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
                placeholder="103.221.4.12\n45.90.12.201/28"
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-sm"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <h2 className="text-2xl font-semibold mb-4">
            File & storage settings
          </h2>
          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Default storage quota per tenant
              </label>
              <input
                value={form.defaultStorageQuota}
                onChange={(e) =>
                  handleSettingChange("defaultStorageQuota", e.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Max upload file size
              </label>
              <input
                value={form.maxUploadFileSize}
                onChange={(e) =>
                  handleSettingChange("maxUploadFileSize", e.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Allowed file types
              </label>
              <input
                value={form.allowedFileTypes}
                onChange={(e) =>
                  handleSettingChange("allowedFileTypes", e.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Storage provider
              </label>
              <select
                value={form.storageProvider}
                onChange={(e) =>
                  handleSettingChange("storageProvider", e.target.value)
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              >
                <option>Amazon S3 — ap-south-1</option>
                <option>Amazon S3 — us-east-1</option>
                <option>Azure Blob Storage</option>
                <option>Google Cloud Storage</option>
              </select>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.warnTenantsAt60}
                onChange={(e) =>
                  handleSettingChange("warnTenantsAt60", e.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800"
              />
              <div>
                <p className="font-medium">Warn tenants at 60% usage</p>
                <p className="text-sm text-slate-400">
                  Send an in-app notice when tenants reach 60% quota.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.blockUploadsAt100}
                onChange={(e) =>
                  handleSettingChange("blockUploadsAt100", e.target.checked)
                }
                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800"
              />
              <div>
                <p className="font-medium">Block uploads at 100% usage</p>
                <p className="text-sm text-slate-400">
                  Prevent new uploads once a tenant reaches full quota.
                </p>
              </div>
            </label>
            <div>
              <label className="block text-sm font-medium mb-2">
                Auto-archive files older than years
              </label>
              <input
                type="number"
                min={0}
                value={form.autoArchiveFilesOlderThanYears}
                onChange={(e) =>
                  handleSettingChange(
                    "autoArchiveFilesOlderThanYears",
                    Number(e.target.value),
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-sm"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <h2 className="text-2xl font-semibold mb-4">Account details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-950/60 border border-slate-700 p-4">
              <div className="text-slate-400 text-sm">Current admin</div>
              <div className="mt-2 font-medium text-white">
                {user?.name || user?.email}
              </div>
              <div className="text-slate-500 text-sm mt-1">
                Superadmin access
              </div>
            </div>
            <div className="rounded-2xl bg-slate-950/60 border border-slate-700 p-4">
              <div className="text-slate-400 text-sm">Status</div>
              <div className="mt-2 font-medium text-white">Active</div>
              <div className="text-slate-500 text-sm mt-1">
                Live platform configuration
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? "Saving settings..." : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SuperAdminSettings;
