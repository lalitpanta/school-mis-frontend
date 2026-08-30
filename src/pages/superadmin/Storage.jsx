import React, { useEffect, useState } from "react";
import { Database, Save, Cloud, Server, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import toast from "react-hot-toast";

const SuperAdminStorage = () => {
  const { user } = useAuth();
  const {
    settings,
    settingsLoaded,
    updateMultipleSettings,
    fetchSettings,
  } = useSettings();

  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized || !settingsLoaded) return;
    if (!settings || Object.keys(settings).length === 0) return;

    setForm({
      storageProvider: settings?.storage_provider || "Amazon S3 — ap-south-1",
      s3AccessKeyId: settings?.s3_access_key_id || "",
      s3SecretAccessKey: settings?.s3_secret_access_key || "",
      s3BucketName: settings?.s3_bucket_name || "",
      azureStorageAccountName: settings?.azure_storage_account_name || "",
      azureStorageAccountKey: settings?.azure_storage_account_key || "",
      azureContainerName: settings?.azure_container_name || "",
      gcpProjectId: settings?.gcp_project_id || "",
      gcpClientEmail: settings?.gcp_client_email || "",
      gcpPrivateKey: settings?.gcp_private_key || "",
      gcpBucketName: settings?.gcp_bucket_name || "",
      enableGlobalStorage: settings?.enable_global_storage !== undefined ? settings.enable_global_storage : true,
    });
    setIsInitialized(true);
  }, [settings, isInitialized, settingsLoaded]);

  const handleSettingChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        storage_provider: form.storageProvider,
        s3_access_key_id: form.s3AccessKeyId,
        s3_secret_access_key: form.s3SecretAccessKey,
        s3_bucket_name: form.s3BucketName,
        azure_storage_account_name: form.azureStorageAccountName,
        azure_storage_account_key: form.azureStorageAccountKey,
        azure_container_name: form.azureContainerName,
        gcp_project_id: form.gcpProjectId,
        gcp_client_email: form.gcpClientEmail,
        gcp_private_key: form.gcpPrivateKey,
        gcp_bucket_name: form.gcpBucketName,
        enable_global_storage: form.enableGlobalStorage,
      };

      const success = await updateMultipleSettings(payload);
      if (!success) {
        throw new Error("Server rejected settings update");
      }

      await fetchSettings();
      toast.success("Storage settings saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save storage settings");
    } finally {
      setIsSaving(false);
    }
  };

  const renderProviderFields = () => {
    if (form.storageProvider.startsWith("Amazon S3")) {
      return (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Access Key ID</label>
            <input
              type="text"
              value={form.s3AccessKeyId}
              onChange={(e) => handleSettingChange("s3AccessKeyId", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="AKIAIOSFODNN7EXAMPLE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Secret Access Key</label>
            <input
              type="password"
              value={form.s3SecretAccessKey}
              onChange={(e) => handleSettingChange("s3SecretAccessKey", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            />
          </div>
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium mb-2">Bucket Name</label>
            <input
              type="text"
              value={form.s3BucketName}
              onChange={(e) => handleSettingChange("s3BucketName", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="my-app-storage-bucket"
            />
          </div>
        </>
      );
    } else if (form.storageProvider === "Azure Blob Storage") {
      return (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Storage Account Name</label>
            <input
              type="text"
              value={form.azureStorageAccountName}
              onChange={(e) => handleSettingChange("azureStorageAccountName", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="mystorageaccount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Storage Account Key</label>
            <input
              type="password"
              value={form.azureStorageAccountKey}
              onChange={(e) => handleSettingChange("azureStorageAccountKey", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="Your Account Key"
            />
          </div>
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium mb-2">Container Name</label>
            <input
              type="text"
              value={form.azureContainerName}
              onChange={(e) => handleSettingChange("azureContainerName", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="my-container"
            />
          </div>
        </>
      );
    } else if (form.storageProvider === "Google Cloud Storage") {
      return (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Project ID</label>
            <input
              type="text"
              value={form.gcpProjectId}
              onChange={(e) => handleSettingChange("gcpProjectId", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="my-gcp-project-id"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Client Email</label>
            <input
              type="email"
              value={form.gcpClientEmail}
              onChange={(e) => handleSettingChange("gcpClientEmail", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="service-account@project.iam.gserviceaccount.com"
            />
          </div>
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium mb-2">Private Key (JSON string)</label>
            <textarea
              value={form.gcpPrivateKey}
              onChange={(e) => handleSettingChange("gcpPrivateKey", e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500 font-mono"
              placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANB..."
            />
          </div>
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium mb-2">Bucket Name</label>
            <input
              type="text"
              value={form.gcpBucketName}
              onChange={(e) => handleSettingChange("gcpBucketName", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="my-gcp-bucket"
            />
          </div>
        </>
      );
    }
  };

  if (!settingsLoaded || !form) {
    return <div className="p-8 text-slate-300">Loading storage settings...</div>;
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
          <Database size={32} className="text-indigo-400" />
          <div>
            <h1 className="text-4xl font-bold">Storage Settings</h1>
            <p className="text-sm text-slate-400">
              Configure centralized cloud storage providers for system file blobs.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-sm"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Cloud size={20} className="text-indigo-400" />
            <h2 className="text-2xl font-semibold">Provider Configuration</h2>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Active Storage Provider</label>
            <select
              value={form.storageProvider}
              onChange={(e) => handleSettingChange("storageProvider", e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-500"
            >
              <option>Amazon S3 — ap-south-1</option>
              <option>Amazon S3 — us-east-1</option>
              <option>Azure Blob Storage</option>
              <option>Google Cloud Storage</option>
            </select>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {renderProviderFields()}
          </div>
        </div>

        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-sm"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={20} className="text-indigo-400" />
            <h2 className="text-2xl font-semibold">Global Storage Policy</h2>
          </div>
          
          <label className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enableGlobalStorage}
              onChange={(e) => handleSettingChange("enableGlobalStorage", e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800"
            />
            <div>
              <p className="font-medium text-slate-100">Enforce Global Storage</p>
              <p className="text-sm text-slate-400">
                When enabled, all file blobs across the entire system (all tenants and modules) will be saved securely to this configured storage provider.
              </p>
            </div>
          </label>
        </div>

        <div
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6 shadow-sm"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Server size={20} className="text-indigo-400" />
            <h2 className="text-2xl font-semibold">System Details</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-950/60 border border-slate-700 p-4">
              <div className="text-slate-400 text-sm">Status</div>
              <div className="mt-2 font-medium text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                Ready to Connect
              </div>
              <div className="text-slate-500 text-sm mt-1">
                Will validate credentials on save.
              </div>
            </div>
            <div className="rounded-2xl bg-slate-950/60 border border-slate-700 p-4">
              <div className="text-slate-400 text-sm">Current Active Provider</div>
              <div className="mt-2 font-medium text-white">
                {form.storageProvider}
              </div>
              <div className="text-slate-500 text-sm mt-1">
                Affects new uploads immediately.
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
            {isSaving ? "Saving configuration..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SuperAdminStorage;
