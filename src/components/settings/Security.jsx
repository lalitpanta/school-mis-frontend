import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getAllSettings, updateSettings } from "../../api/settingsApi";
import {
  Shield,
  Save,
  Lock,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const DEFAULT_SECURITY_CONFIG = {
  twoFactorEnabled: false,
  autoLogoutEnabled: false,
  sessionTimeoutMinutes: 30,
  ipWhitelistEnabled: false,
  ipWhitelistAddresses: [],
  ssoEnabled: false,
  ssoProvider: "google",
  passwordExpiryEnabled: false,
  passwordExpiryDays: 90,
  maxFailedLoginAttempts: 5,
  forceStrongPassword: true,
  allowMultipleSessions: false,
  auditLogRetentionDays: 365,
  dataEncryptionEnabled: true,
  rbacEnabled: true,
  emailAlertSuspiciousLogin: true,
  apiRateLimitingEnabled: true,
  apiRequestsPerMinute: 60,
  requireEmailVerification: true,
};

const ToggleSwitch = ({ enabled, onChange, label, description = "" }) => (
  <div className="flex items-start justify-between p-4 bg-slate-800/50 border border-slate-700/60 rounded-lg hover:bg-slate-800 transition">
    <div className="flex-1">
      <h4 className="text-slate-200 font-medium">{label}</h4>
      {description && (
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      )}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`toggle-switch relative ml-4 w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${
        enabled ? "bg-green-600 toggle-on" : "bg-slate-700 toggle-off"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full transition-transform ${
          enabled ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

const Security = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(DEFAULT_SECURITY_CONFIG);
  const [expandedSections, setExpandedSections] = useState({
    authentication: true,
    session: true,
    password: true,
    network: true,
    dataProtection: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getAllSettings();
      const settings = res.data?.data || {};
      if (settings.security_config) {
        const parsed =
          typeof settings.security_config === "string"
            ? JSON.parse(settings.security_config)
            : settings.security_config;
        setConfig({ ...DEFAULT_SECURITY_CONFIG, ...parsed });
      }
    } catch (err) {
      console.error("Failed to load security settings", err);
      toast.error("Failed to load security settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings({ security_config: config });
      toast.success("Security settings saved successfully!");
    } catch (err) {
      console.error("Failed to save", err);
      toast.error("Failed to save security settings");
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const expandAll = () => {
    setExpandedSections({
      authentication: true,
      session: true,
      password: true,
      network: true,
      dataProtection: true,
    });
  };

  const collapseAll = () => {
    setExpandedSections({
      authentication: false,
      session: false,
      password: false,
      network: false,
      dataProtection: false,
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading Security Settings...
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-slate-900 border border-slate-700/60 shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-green-400" size={24} /> Security
            Configuration
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure security policies and authentication mechanisms.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Collapse/Expand All Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={collapseAll}
          className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-300 text-sm font-medium transition-colors"
        >
          Collapse All
        </button>
        <button
          onClick={expandAll}
          className="px-4 py-2 rounded-lg bg-green-600/50 hover:bg-green-600 border border-green-500 text-green-300 text-sm font-medium transition-colors"
        >
          Expand All
        </button>
      </div>

      <div className="space-y-8">
        {/* Authentication Section */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("authentication")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-slate-700/50"
          >
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Authentication & Access
              </h3>
            </div>
            {expandedSections.authentication ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>
          {expandedSections.authentication && (
            <div className="px-6 py-5 space-y-3">
              <ToggleSwitch
                enabled={config.twoFactorEnabled}
                onChange={(v) => updateConfig("twoFactorEnabled", v)}
                label="Enable Two-Factor Authentication (2FA)"
                description="Require users to provide an additional verification method during login."
              />
              <ToggleSwitch
                enabled={config.ssoEnabled}
                onChange={(v) => updateConfig("ssoEnabled", v)}
                label="Single Sign-On (SSO)"
                description="Allow users to login using external identity providers (Google, Microsoft, etc.)."
              />
              <ToggleSwitch
                enabled={config.requireEmailVerification}
                onChange={(v) => updateConfig("requireEmailVerification", v)}
                label="Require Email Verification on Signup"
                description="New users must verify their email address before account activation."
              />
            </div>
          )}
        </div>

        {/* Session Management Section */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("session")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-slate-700/50"
          >
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              <h3 className="text-lg font-semibold text-white">
                Session Management
              </h3>
            </div>
            {expandedSections.session ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>
          {expandedSections.session && (
            <div className="px-6 py-5 space-y-3">
              <ToggleSwitch
                enabled={config.autoLogoutEnabled}
                onChange={(v) => updateConfig("autoLogoutEnabled", v)}
                label="Auto-logout after Inactivity"
                description="Automatically logout users after they remain inactive."
              />
              {config.autoLogoutEnabled && (
                <div className="ml-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.sessionTimeoutMinutes}
                    onChange={(e) =>
                      updateConfig(
                        "sessionTimeoutMinutes",
                        Math.max(5, parseInt(e.target.value) || 5),
                      )
                    }
                    min={5}
                    max={480}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Minimum 5 minutes, maximum 480 minutes (8 hours).
                  </p>
                </div>
              )}
              <ToggleSwitch
                enabled={config.allowMultipleSessions}
                onChange={(v) => updateConfig("allowMultipleSessions", v)}
                label="Allow Multiple Sessions"
                description="Allow users to be logged in from multiple devices/locations simultaneously."
              />
            </div>
          )}
        </div>

        {/* Password Policy Section */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("password")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-slate-700/50"
          >
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Password Policy
              </h3>
            </div>
            {expandedSections.password ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>
          {expandedSections.password && (
            <div className="px-6 py-5 space-y-3">
              <ToggleSwitch
                enabled={config.forceStrongPassword}
                onChange={(v) => updateConfig("forceStrongPassword", v)}
                label="Force Strong Password"
                description="Require passwords to contain uppercase, lowercase, numbers, and special characters."
              />
              <ToggleSwitch
                enabled={config.passwordExpiryEnabled}
                onChange={(v) => updateConfig("passwordExpiryEnabled", v)}
                label="Password Expiry Policy"
                description="Require users to change their password periodically."
              />
              {config.passwordExpiryEnabled && (
                <div className="ml-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password Expiry Period (days)
                  </label>
                  <input
                    type="number"
                    value={config.passwordExpiryDays}
                    onChange={(e) =>
                      updateConfig(
                        "passwordExpiryDays",
                        Math.max(30, parseInt(e.target.value) || 90),
                      )
                    }
                    min={30}
                    max={365}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Users will be prompted to change password after this period.
                  </p>
                </div>
              )}
              <ToggleSwitch
                enabled={config.maxFailedLoginAttempts > 0}
                onChange={(v) =>
                  updateConfig("maxFailedLoginAttempts", v ? 5 : 0)
                }
                label="Maximum Failed Login Attempts"
                description="Lock account after multiple failed login attempts."
              />
              {config.maxFailedLoginAttempts > 0 && (
                <div className="ml-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Attempts Before Lockout
                  </label>
                  <input
                    type="number"
                    value={config.maxFailedLoginAttempts}
                    onChange={(e) =>
                      updateConfig(
                        "maxFailedLoginAttempts",
                        Math.max(3, parseInt(e.target.value) || 5),
                      )
                    }
                    min={3}
                    max={10}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Account will be temporarily locked after this many failed
                    attempts.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Network & Access Control Section */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("network")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-slate-700/50"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-red-400" />
              <h3 className="text-lg font-semibold text-white">
                Network & Access Control
              </h3>
            </div>
            {expandedSections.network ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>
          {expandedSections.network && (
            <div className="px-6 py-5 space-y-3">
              <ToggleSwitch
                enabled={config.ipWhitelistEnabled}
                onChange={(v) => updateConfig("ipWhitelistEnabled", v)}
                label="Enable IP Whitelist"
                description="Restrict access to specific IP addresses."
              />
              {config.ipWhitelistEnabled && (
                <div className="ml-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Whitelisted IP Addresses
                  </label>
                  <textarea
                    value={(config.ipWhitelistAddresses || []).join("\n")}
                    onChange={(e) =>
                      updateConfig(
                        "ipWhitelistAddresses",
                        e.target.value.split("\n").filter((ip) => ip.trim()),
                      )
                    }
                    placeholder="Enter IP addresses (one per line)&#10;Example:&#10;192.168.1.1&#10;10.0.0.0/8"
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Supports IPv4 addresses and CIDR notation.
                  </p>
                </div>
              )}
              <ToggleSwitch
                enabled={config.rbacEnabled}
                onChange={(v) => updateConfig("rbacEnabled", v)}
                label="Restrict Access by Role (RBAC)"
                description="Enforce role-based access control for all resources."
              />
              <ToggleSwitch
                enabled={config.emailAlertSuspiciousLogin}
                onChange={(v) => updateConfig("emailAlertSuspiciousLogin", v)}
                label="Email Alert on Suspicious Login"
                description="Send email alerts when login is attempted from new location or device."
              />
            </div>
          )}
        </div>

        {/* Data Protection Section */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("dataProtection")}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-slate-700/50"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-teal-400" />
              <h3 className="text-lg font-semibold text-white">
                Data Protection
              </h3>
            </div>
            {expandedSections.dataProtection ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </button>
          {expandedSections.dataProtection && (
            <div className="px-6 py-5 space-y-3">
              <ToggleSwitch
                enabled={config.dataEncryptionEnabled}
                onChange={(v) => updateConfig("dataEncryptionEnabled", v)}
                label="Data Encryption at Rest"
                description="Encrypt sensitive data when stored in the database."
              />
              <ToggleSwitch
                enabled={config.apiRateLimitingEnabled}
                onChange={(v) => updateConfig("apiRateLimitingEnabled", v)}
                label="API Rate Limiting"
                description="Limit API requests to prevent abuse and brute force attacks."
              />
              {config.apiRateLimitingEnabled && (
                <div className="ml-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    API Requests Per Minute
                  </label>
                  <input
                    type="number"
                    value={config.apiRequestsPerMinute}
                    onChange={(e) =>
                      updateConfig(
                        "apiRequestsPerMinute",
                        Math.max(10, parseInt(e.target.value) || 60),
                      )
                    }
                    min={10}
                    max={1000}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Maximum number of API requests allowed per minute.
                  </p>
                </div>
              )}
              <ToggleSwitch
                enabled={config.auditLogRetentionDays > 0}
                onChange={(v) =>
                  updateConfig("auditLogRetentionDays", v ? 365 : 0)
                }
                label="Audit Log Retention"
                description="Store audit logs for compliance and security investigations."
              />
              {config.auditLogRetentionDays > 0 && (
                <div className="ml-4 p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Retention Period (days)
                  </label>
                  <input
                    type="number"
                    value={config.auditLogRetentionDays}
                    onChange={(e) =>
                      updateConfig(
                        "auditLogRetentionDays",
                        Math.max(30, parseInt(e.target.value) || 365),
                      )
                    }
                    min={30}
                    max={1825}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Audit logs will be automatically purged after this period
                    (30 days to 5 years).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SSO Configuration */}
        {config.ssoEnabled && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              SSO Provider Configuration
            </h3>
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                SSO Provider
              </label>
              <select
                value={config.ssoProvider}
                onChange={(e) => updateConfig("ssoProvider", e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="google">Google</option>
                <option value="microsoft">Microsoft</option>
                <option value="okta">Okta</option>
                <option value="custom">Custom OpenID Connect</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Select the SSO provider for your organization.
              </p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-slate-300">
            <strong>Note:</strong> These security settings control how your
            system handles authentication, authorization, and data protection.
            Changes take effect immediately. Always test settings in a
            non-production environment first.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 font-medium"
          >
            <Save size={18} /> {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Security;
