import { useState, useEffect, useRef } from "react";
import {
  getAllSettings,
  updateSettings,
  sendTestEmail,
} from "../../api/settingsApi";
import {
  Mail,
  Key,
  Save,
  Server,
  Send,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
} from "lucide-react";
import toast from "react-hot-toast";

const parseSettingsValue = (value) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const DEFAULT_EMAIL_CONFIG = {
  enabled: false,
  email_address: "",
  admin_email: "",
  app_password: "",
  sender_name: "School Admin",
  smtp_host: "smtp.gmail.com",
  smtp_port: 465,
  smtp_secure: true,
  notifications: {
    student_created: true,
    user_created: true,
    fee_payment_success: true,
    exam_results_published: true,
    attendance_alert: true,
  },
};

const DEFAULT_EMAIL_TEMPLATES = {
  student_created: {
    subject: "🎉 Admission Confirmed — Welcome to {{schoolName}}",
    body: `<div style="font-family:Arial,Helvetica,sans-serif;color:#333"><div style="background:#f3f4f6;padding:24px;border-radius:8px"><h1 style="color:#0f172a">Welcome to {{schoolName}}</h1><p style="color:#374151">Hello <strong>{{studentName}}</strong>,</p><p style="color:#374151">Your admission has been confirmed. Admission No: {{admissionNo}}</p><h3>Student Portal Login</h3><p><strong>Login email:</strong> {{loginEmail}}<br/><strong>Temporary password:</strong> {{password}}</p><p>Please change your password after signing in.</p><p style="color:#6b7280">— {{schoolName}} Admissions Team</p></div></div>`,
  },
  user_created: {
    subject: "🔐 New User Account Created",
    body: `<div style="font-family:Arial,Helvetica,sans-serif;color:#111"><div style="padding:20px;border-radius:8px;background:#ffffff;border:1px solid #e5e7eb"><h2 style="color:#0b63ce">Account Created</h2><p>Hi <strong>{{name}}</strong>,</p><p>An account has been created for you.</p><p><strong>Username:</strong> {{username}}<br/><strong>Password:</strong> {{password}}</p><p>Please change your password after your first login.</p><p style="color:#6b7280">If you did not request this, contact the admin immediately.</p></div></div>`,
  },
  fee_payment_success: {
    subject: "Payment Receipt - {{receiptNo}}",
    body: `<h2>Payment Successful</h2><p>Dear {{studentName}},</p><p>We have received your payment of {{amount}}.</p><p>Receipt Number: {{receiptNo}}</p>`,
  },
  exam_results_published: {
    subject: "Exam Results Published - {{examName}}",
    body: `<h2>Exam Results</h2><p>Dear {{studentName}},</p><p>Your results for {{examName}} have been published. Please check the portal.</p>`,
  },
  attendance_alert: {
    subject: "Attendance Alert - {{date}}",
    body: `<h2>Attendance Notice</h2><p>Dear Parent,</p><p>{{studentName}} was marked absent on {{date}}.</p>`,
  },
};

const DEFAULT_WHATSAPP_CONFIG = {
  enabled: false,
  provider: "twilio",
  account_sid: "",
  auth_token: "",
  from_number: "",
  messaging_service_sid: "",
  admin_whatsapp_phone: "",
  notifications: {
    student_created: true,
    user_created: true,
    fee_payment_success: true,
    exam_results_published: true,
    attendance_alert: true,
  },
};

const DEFAULT_WHATSAPP_TEMPLATES = {
  student_created: {
    body: "Welcome {{studentName}}! Your admission has been confirmed. Admission no: {{admissionNo}}.",
  },
  user_created: {
    body: "Hello {{name}}, your account has been created. Username: {{username}}. Please change your password after first login.",
  },
  fee_payment_success: {
    body: "Dear {{studentName}}, we have received your payment of {{amount}}. Receipt no: {{receiptNo}}.",
  },
  exam_results_published: {
    body: "Hello {{studentName}}, your results for {{examName}} are now available. Please check your portal.",
  },
  attendance_alert: {
    body: "Alert: {{studentName}} was absent on {{date}}.",
  },
};

const TEMPLATE_KEYS = [
  { key: "student_created", label: "Student Registration" },
  { key: "user_created", label: "User Account Created" },
  { key: "fee_payment_success", label: "Fee Payment Receipt" },
  { key: "exam_results_published", label: "Exam Results Published" },
  { key: "attendance_alert", label: "Attendance Alert" },
];

const DEFAULT_VARIABLES = {
  student_created: [
    "schoolName",
    "studentName",
    "admissionNo",
    "loginEmail",
    "password",
  ],
  user_created: ["name", "username", "password"],
  fee_payment_success: ["studentName", "amount", "receiptNo"],
  exam_results_published: ["studentName", "examName"],
  attendance_alert: ["studentName", "date"],
};

const normalizeTemplates = (value, defaults) => {
  const parsed = parseSettingsValue(value);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }
  return defaults;
};

const EDITOR_COMMANDS = [
  { command: "bold", label: "Bold", Icon: Bold },
  { command: "italic", label: "Italic", Icon: Italic },
  { command: "underline", label: "Underline", Icon: Underline },
  { command: "insertUnorderedList", label: "Bulleted list", Icon: List },
  { command: "insertOrderedList", label: "Numbered list", Icon: ListOrdered },
];

const EmailBodyEditor = ({ value, onChange, variables }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const applyCommand = (command) => {
    editorRef.current?.focus();
    if (command === "createLink") {
      const url = window.prompt("Enter link URL");
      if (!url) return;
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false);
    }
    onChange(editorRef.current?.innerHTML || "");
  };

  const insertVariable = (variable) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    let range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();
    const token = document.createTextNode(`{{${variable}}}`);
    range.insertNode(token);
    range.setStartAfter(token);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    onChange(editor.innerHTML);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-white text-slate-900">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {EDITOR_COMMANDS.map(({ command, label, Icon }) => (
          <button
            key={command}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyCommand(command)}
            className="rounded p-2 text-slate-700 hover:bg-slate-200"
          >
            <Icon size={16} />
          </button>
        ))}
        <button
          type="button"
          title="Insert link"
          aria-label="Insert link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyCommand("createLink")}
          className="rounded p-2 text-slate-700 hover:bg-slate-200"
        >
          <Link2 size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Email template body editor"
        aria-multiline="true"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="min-h-64 max-h-[520px] overflow-y-auto p-5 text-sm leading-6 outline-none [&_a]:text-blue-700 [&_h1]:my-3 [&_h1]:text-2xl [&_h2]:my-3 [&_h2]:text-xl [&_li]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_ul]:list-disc"
      />
      <div className="border-t border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Insert variable
        </p>
        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <button
              key={variable}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertVariable(variable)}
              className="rounded border border-blue-200 bg-white px-2 py-1 font-mono text-xs text-blue-700 hover:bg-blue-50"
            >
              {`{{${variable}}}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Integrations = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("config"); // 'config', 'notifications', 'templates'
  const [config, setConfig] = useState(DEFAULT_EMAIL_CONFIG);
  const [templates, setTemplates] = useState(DEFAULT_EMAIL_TEMPLATES);
  const [whatsappConfig, setWhatsappConfig] = useState(DEFAULT_WHATSAPP_CONFIG);
  const [whatsappTemplates, setWhatsappTemplates] = useState(
    DEFAULT_WHATSAPP_TEMPLATES,
  );
  const [selectedTemplateKey, setSelectedTemplateKey] =
    useState("student_created");
  const [templateChannel, setTemplateChannel] = useState("email");
  const [testRecipient, setTestRecipient] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (!templates || !templates[selectedTemplateKey]) {
      const firstKey = Object.keys(templates || DEFAULT_EMAIL_TEMPLATES)[0];
      if (firstKey) setSelectedTemplateKey(firstKey);
    }
  }, [templates, selectedTemplateKey]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getAllSettings();
      const settings = res.data?.data || {};

      if (settings.email_config) {
        setConfig({
          ...DEFAULT_EMAIL_CONFIG,
          ...parseSettingsValue(settings.email_config),
        });
      }
      if (settings.email_templates) {
        setTemplates({
          ...DEFAULT_EMAIL_TEMPLATES,
          ...normalizeTemplates(
            settings.email_templates,
            DEFAULT_EMAIL_TEMPLATES,
          ),
        });
      }
      if (settings.whatsapp_config) {
        setWhatsappConfig({
          ...DEFAULT_WHATSAPP_CONFIG,
          ...parseSettingsValue(settings.whatsapp_config),
        });
      }
      if (settings.whatsapp_templates) {
        setWhatsappTemplates({
          ...DEFAULT_WHATSAPP_TEMPLATES,
          ...normalizeTemplates(
            settings.whatsapp_templates,
            DEFAULT_WHATSAPP_TEMPLATES,
          ),
        });
      }
    } catch (err) {
      console.error("Failed to load settings", err);
      toast.error("Failed to load integrations settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings({
        email_config: config,
        email_templates: templates,
        whatsapp_config: whatsappConfig,
        whatsapp_templates: whatsappTemplates,
      });
      toast.success("Integration settings saved successfully!");
    } catch (err) {
      console.error("Failed to save", err);
      toast.error("Failed to save integration settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testRecipient.trim()) {
      toast.error("Enter a recipient email address first.");
      return;
    }
    try {
      setSendingTest(true);
      await sendTestEmail({
        to: testRecipient.trim(),
        config,
      });
      toast.success(
        config.enabled
          ? "SMTP verified and test email sent. Check the recipient inbox."
          : "SMTP test email sent. Enable and save email notifications to send automated emails.",
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Unknown SMTP test request error.";
      toast.error(
        `SMTP test failed${err.response?.status ? ` (HTTP ${err.response.status})` : ""}: ${errorMessage}`,
      );
    } finally {
      setSendingTest(false);
    }
  };

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateWhatsappConfig = (key, value) => {
    setWhatsappConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateNotification = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateWhatsappNotification = (key, value) => {
    setWhatsappConfig((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateTemplate = (key, field, value) => {
    setTemplates((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));
  };

  const updateWhatsappTemplate = (key, field, value) => {
    setWhatsappTemplates((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));
  };

  const updateTemplateChannel = (channel) => {
    setTemplateChannel(channel);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading Integrations...
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 bg-slate-900 border border-slate-700/60 shadow-xl">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail className="text-blue-400" /> Email Settings
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure SMTP delivery and notification templates.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-slate-300">Enable Email Service</span>
            <div
              className={`w-12 h-6 rounded-full p-1 transition-colors ${config.enabled ? "bg-blue-600" : "bg-slate-700"}`}
              onClick={() => updateConfig("enabled", !config.enabled)}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full transition-transform ${config.enabled ? "translate-x-6" : "translate-x-0"}`}
              />
            </div>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition ${activeTab === "config" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
        >
          SMTP Configuration
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition ${activeTab === "notifications" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
        >
          Notification Triggers
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 border-b-2 font-medium text-sm transition ${activeTab === "templates" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}
        >
          Email Templates
        </button>
      </div>

      <div className="mt-4">
        {activeTab === "config" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-2.5 text-slate-500"
                    size={18}
                  />
                  <input
                    type="email"
                    value={config.email_address}
                    onChange={(e) =>
                      updateConfig("email_address", e.target.value)
                    }
                    placeholder="e.g., no-reply@yourschool.edu"
                    className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Admin Notification Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-2.5 text-slate-500"
                    size={18}
                  />
                  <input
                    type="email"
                    value={config.admin_email}
                    onChange={(e) =>
                      updateConfig("admin_email", e.target.value)
                    }
                    placeholder="e.g., admin@yourschool.edu"
                    className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Receive system notifications (new user accounts, critical
                  alerts).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  SMTP Password
                </label>
                <div className="relative">
                  <Key
                    className="absolute left-3 top-2.5 text-slate-500"
                    size={18}
                  />
                  <input
                    type="password"
                    value={config.app_password}
                    onChange={(e) =>
                      updateConfig("app_password", e.target.value)
                    }
                    placeholder="Mailbox password or provider app password"
                    className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  For hosted mailboxes, use the mailbox account password. Use an
                  app password only when your email provider requires one.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Sender Name
                </label>
                <input
                  type="text"
                  value={config.sender_name}
                  onChange={(e) => updateConfig("sender_name", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="pt-6 border-t border-slate-700/60">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  WhatsApp Integration
                </h3>
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <span className="text-sm text-slate-300">
                    Enable WhatsApp Service
                  </span>
                  <div
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${whatsappConfig.enabled ? "bg-green-600" : "bg-slate-700"}`}
                    onClick={() =>
                      updateWhatsappConfig("enabled", !whatsappConfig.enabled)
                    }
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${whatsappConfig.enabled ? "translate-x-6" : "translate-x-0"}`}
                    />
                  </div>
                </label>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    WhatsApp Provider
                  </label>
                  <input
                    type="text"
                    value={whatsappConfig.provider}
                    onChange={(e) =>
                      updateWhatsappConfig("provider", e.target.value)
                    }
                    placeholder="twilio"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Twilio Account SID
                  </label>
                  <input
                    type="text"
                    value={whatsappConfig.account_sid}
                    onChange={(e) =>
                      updateWhatsappConfig("account_sid", e.target.value)
                    }
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Twilio Auth Token
                  </label>
                  <input
                    type="password"
                    value={whatsappConfig.auth_token}
                    onChange={(e) =>
                      updateWhatsappConfig("auth_token", e.target.value)
                    }
                    placeholder="Your Twilio auth token"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    WhatsApp From Number
                  </label>
                  <input
                    type="text"
                    value={whatsappConfig.from_number}
                    onChange={(e) =>
                      updateWhatsappConfig("from_number", e.target.value)
                    }
                    placeholder="+1234567890 or whatsapp:+1234567890"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use this when sending from a WhatsApp-enabled Twilio number.
                    Leave empty if using Messaging Service SID.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Messaging Service SID
                  </label>
                  <input
                    type="text"
                    value={whatsappConfig.messaging_service_sid}
                    onChange={(e) =>
                      updateWhatsappConfig(
                        "messaging_service_sid",
                        e.target.value,
                      )
                    }
                    placeholder="MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use this if you prefer Twilio Messaging Service instead of a
                    specific WhatsApp sender number.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Admin WhatsApp Phone
                  </label>
                  <input
                    type="text"
                    value={whatsappConfig.admin_whatsapp_phone}
                    onChange={(e) =>
                      updateWhatsappConfig(
                        "admin_whatsapp_phone",
                        e.target.value,
                      )
                    }
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Use Twilio account details to send WhatsApp messages. The
                  provider supports Twilio by default.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  SMTP Host
                </label>
                <div className="relative">
                  <Server
                    className="absolute left-3 top-2.5 text-slate-500"
                    size={18}
                  />
                  <input
                    type="text"
                    value={config.smtp_host}
                    onChange={(e) => updateConfig("smtp_host", e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={config.smtp_port}
                    onChange={(e) =>
                      updateConfig("smtp_port", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Connection Security
                  </label>
                  <div className="flex items-center h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.smtp_secure}
                        onChange={(e) =>
                          updateConfig("smtp_secure", e.target.checked)
                        }
                        className="rounded border-slate-600"
                      />
                      <span className="text-sm text-slate-300">SSL/TLS</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="max-w-3xl">
            <p className="text-slate-400 text-sm mb-6">
              Select which events should automatically trigger an email
              notification.
            </p>

            <div className="space-y-3">
              {[
                {
                  key: "student_created",
                  label: "New Student Registration",
                  desc: "Send a welcome email when a new student is added.",
                },
                {
                  key: "user_created",
                  label: "New Staff/User Account",
                  desc: "Send credentials when a new user account is created.",
                },
                {
                  key: "fee_payment_success",
                  label: "Fee Payment Receipt",
                  desc: "Send a receipt automatically upon successful fee payment.",
                },
                {
                  key: "exam_results_published",
                  label: "Exam Results Published",
                  desc: "Notify students and parents when exam results are out.",
                },
                {
                  key: "attendance_alert",
                  label: "Attendance Alert",
                  desc: "Send an alert when a student is marked absent.",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl hover:bg-slate-800 transition"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${config.notifications[item.key] ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/50 text-slate-500"}`}
                    >
                      <Send size={20} />
                    </div>
                    <div>
                      <h4 className="text-slate-200 font-medium">
                        {item.label}
                      </h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <div
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${config.notifications[item.key] ? "bg-blue-600" : "bg-slate-700"}`}
                      onClick={() =>
                        updateNotification(
                          item.key,
                          !config.notifications[item.key],
                        )
                      }
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${config.notifications[item.key] ? "translate-x-6" : "translate-x-0"}`}
                      />
                    </div>
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <p className="text-slate-400 text-sm mb-6">
                Select which events should automatically trigger a WhatsApp
                notification.
              </p>
              <div className="space-y-3">
                {[
                  {
                    key: "student_created",
                    label: "New Student Registration",
                    desc: "Send a welcome WhatsApp message when a new student is added.",
                  },
                  {
                    key: "user_created",
                    label: "New Staff/User Account",
                    desc: "Send credentials to staff via WhatsApp when a new user account is created.",
                  },
                  {
                    key: "fee_payment_success",
                    label: "Fee Payment Receipt",
                    desc: "Send a payment receipt via WhatsApp.",
                  },
                  {
                    key: "exam_results_published",
                    label: "Exam Results Published",
                    desc: "Notify students and parents with exam results via WhatsApp.",
                  },
                  {
                    key: "attendance_alert",
                    label: "Attendance Alert",
                    desc: "Send an attendance absence alert via WhatsApp.",
                  },
                ].map((item) => (
                  <div
                    key={`whatsapp-${item.key}`}
                    className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl hover:bg-slate-800 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-lg ${whatsappConfig.notifications[item.key] ? "bg-green-500/20 text-green-400" : "bg-slate-700/50 text-slate-500"}`}
                      >
                        <Send size={20} />
                      </div>
                      <div>
                        <h4 className="text-slate-200 font-medium">
                          {item.label}
                        </h4>
                        <p className="text-slate-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <div
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${whatsappConfig.notifications[item.key] ? "bg-green-600" : "bg-slate-700"}`}
                        onClick={() =>
                          updateWhatsappNotification(
                            item.key,
                            !whatsappConfig.notifications[item.key],
                          )
                        }
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform ${whatsappConfig.notifications[item.key] ? "translate-x-6" : "translate-x-0"}`}
                        />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="flex flex-col md:flex-row gap-6 max-w-6xl">
            {/* Template List */}
            <div className="w-full md:w-1/3 flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Available Templates
              </h3>
              {TEMPLATE_KEYS.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => setSelectedTemplateKey(tpl.key)}
                  className={`text-left px-4 py-3 rounded-lg transition-colors ${selectedTemplateKey === tpl.key ? "bg-blue-600/20 border-blue-500 text-blue-300 border" : "bg-slate-800 border-slate-700 border text-slate-300 hover:bg-slate-700"}`}
                >
                  <div className="font-medium">{tpl.label}</div>
                  <div className="text-xs opacity-70 mt-1 truncate">
                    {templates[tpl.key]?.subject || "No subject set"}
                  </div>
                </button>
              ))}
            </div>

            {/* Template Editor */}
            <div className="w-full md:w-2/3 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 capitalize">
                    {selectedTemplateKey.replace(/_/g, " ")} Template
                  </h3>
                  <p className="text-sm text-slate-400">
                    Edit the template for email or WhatsApp delivery.
                  </p>
                </div>
                <div className="inline-flex rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateTemplateChannel("email")}
                    className={`px-4 py-2 text-sm ${templateChannel === "email" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTemplateChannel("whatsapp")}
                    className={`px-4 py-2 text-sm ${templateChannel === "whatsapp" ? "bg-green-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    WhatsApp
                  </button>
                </div>
              </div>

              {templateChannel === "email" && (
                <div className="mb-5 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(event) => setTestRecipient(event.target.value)}
                    placeholder="Send a test to email address"
                    aria-label="Test email recipient"
                    className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                  >
                    <Send size={15} />{" "}
                    {sendingTest ? "Sending..." : "Send test"}
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {templateChannel === "email" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={
                        templates[selectedTemplateKey]?.subject ||
                        DEFAULT_EMAIL_TEMPLATES[selectedTemplateKey]?.subject ||
                        ""
                      }
                      onChange={(e) =>
                        updateTemplate(
                          selectedTemplateKey,
                          "subject",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {templateChannel === "email"
                      ? "Email body"
                      : "Message body"}
                  </label>
                  {templateChannel === "email" ? (
                    <EmailBodyEditor
                      value={
                        templates[selectedTemplateKey]?.body ||
                        DEFAULT_EMAIL_TEMPLATES[selectedTemplateKey]?.body ||
                        ""
                      }
                      onChange={(value) =>
                        updateTemplate(selectedTemplateKey, "body", value)
                      }
                      variables={DEFAULT_VARIABLES[selectedTemplateKey] || []}
                    />
                  ) : (
                    <textarea
                      rows={10}
                      value={
                        whatsappTemplates[selectedTemplateKey]?.body ||
                        DEFAULT_WHATSAPP_TEMPLATES[selectedTemplateKey]?.body ||
                        ""
                      }
                      onChange={(e) =>
                        updateWhatsappTemplate(
                          selectedTemplateKey,
                          "body",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                    />
                  )}
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">
                    Available Variables
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select a variable above to insert it at the cursor. Its
                    value is supplied by the matching system event.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Integrations;
