import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  markNoticeRead,
  togglePinNotice,
  archiveNotice,
  getSmsConfig,
  updateSmsConfig,
  getSmsTemplates,
  createSmsTemplate,
  updateSmsTemplate,
  deleteSmsTemplate,
  sendSms,
  getSmsLogs,
} from "../../api/settingsApi";
import Button from "../common/Button";
import { Plus, Trash2, Send, ShieldCheck, Star } from "lucide-react";

const NOTICE_CATEGORIES = ["Academic", "Event", "Holiday", "Urgent", "General"];
const AUDIENCE_OPTIONS = [
  "All",
  "Teachers",
  "Students",
  "Parents",
  "Class-wise",
  "Section-wise",
];
const DEFAULT_SMS_CONFIG = {
  provider: "megaweblink",
  endpoint: "https://sms.megaweblink.com.np/api/v1/sms/send/",
  enabled: false,
  api_key: "",
  api_key_configured: false,
  sender_id: {
    NT: "",
    Ncell: "",
  },
  provider_name: "Mega Web Link SMS",
  message_type: "plain",
  scheduling_enabled: false,
  scheduled_at: "",
  country: "NP",
  credits: 0,
  signature: "",
};

const defaultNoticeForm = {
  title: "",
  content: "",
  category: "General",
  audience: "All",
  audienceDetails: "",
  expiryDate: "",
  pinned: false,
  status: "draft",
  emailNotification: false,
  sendImmediately: false,
  recipientEmails: "",
  attachments: [],
};

const NoticesSms = () => {
  const [activeTab, setActiveTab] = useState("notices");
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState(defaultNoticeForm);
  const [editingNotice, setEditingNotice] = useState(null);
  const [smsConfig, setSmsConfig] = useState(DEFAULT_SMS_CONFIG);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [smsForm, setSmsForm] = useState({
    recipientType: "manual",
    recipientPhones: "",
    templateName: "",
    message: "",
    scheduledAt: "",
  });
  const [templateForm, setTemplateForm] = useState({ name: "", content: "" });
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [noticeRes, smsConfigRes, templatesRes, logsRes] =
        await Promise.all([
          getNotices(),
          getSmsConfig(),
          getSmsTemplates(),
          getSmsLogs(),
        ]);
      setNotices(noticeRes.data?.data || []);
      const config = smsConfigRes.data?.data || DEFAULT_SMS_CONFIG;
      setSmsConfig({
        ...DEFAULT_SMS_CONFIG,
        ...config,
        sender_id: {
          NT: config?.sender_id?.NT || config?.sender_id || "",
          Ncell: config?.sender_id?.Ncell || "",
        },
        api_key: "",
      });
      setSmsTemplates(templatesRes.data?.data || []);
      setSmsLogs(logsRes.data?.data || []);
    } catch (err) {
      console.error(
        "NoticesSms fetchData error",
        err.response?.data || err.message,
        err,
      );
      toast.error(err.response?.data?.message || "Failed to load SMS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetNoticeForm = () => {
    setEditingNotice(null);
    setNoticeForm(defaultNoticeForm);
  };

  const handleNoticeSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!noticeForm.title || !noticeForm.content) {
        return toast.error("Title and content are required.");
      }
      const payload = {
        ...noticeForm,
        recipientEmails: noticeForm.recipientEmails
          .split(/[;,\n]/)
          .map((email) => email.trim())
          .filter(Boolean),
        sendImmediately: !!noticeForm.sendImmediately,
      };
      if (editingNotice) {
        await updateNotice(editingNotice.id, payload);
        toast.success("Notice updated");
      } else {
        await createNotice(payload);
        toast.success("Notice created");
      }
      await fetchData();
      resetNoticeForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save notice");
    }
  };

  const handleNoticeDelete = async (noticeId) => {
    if (!window.confirm("Delete this notice permanently?")) return;
    try {
      await deleteNotice(noticeId);
      toast.success("Notice deleted");
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Could not delete notice");
    }
  };

  const handleReadNotice = async (noticeId) => {
    try {
      await markNoticeRead(noticeId);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Could not mark notice read");
    }
  };

  const handleTogglePin = async (noticeId, pinned) => {
    try {
      await togglePinNotice(noticeId, { pinned });
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Could not update pin state");
    }
  };

  const handleArchive = async (noticeId) => {
    if (!window.confirm("Archive this notice?")) return;
    try {
      await archiveNotice(noticeId);
      toast.success("Notice archived");
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Could not archive notice");
    }
  };

  const noticesByStatus = useMemo(
    () => ({
      published: notices.filter((item) => item.status === "published"),
      review: notices.filter((item) => item.status === "review"),
      draft: notices.filter((item) => item.status === "draft"),
      archived: notices.filter((item) => item.status === "archived"),
    }),
    [notices],
  );

  const saveSmsSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      if (!smsConfig.api_key?.trim()) {
        toast.error("API key is required to save the SMS configuration.");
        return;
      }
      if (
        !smsConfig.sender_id?.NT?.trim() &&
        !smsConfig.sender_id?.Ncell?.trim()
      ) {
        toast.error("At least one approved Sender ID is required.");
        return;
      }
      if (!smsConfig.endpoint?.trim()) {
        toast.error("SMS endpoint is required.");
        return;
      }

      const payload = {
        provider: "megaweblink",
        endpoint: "https://sms.megaweblink.com.np/api/v1/sms/send/",
        provider_name: "Mega Web Link SMS",
        api_key: smsConfig.api_key.trim(),
        sender_id: {
          NT: smsConfig.sender_id?.NT?.trim() || "",
          Ncell: smsConfig.sender_id?.Ncell?.trim() || "",
        },
        message_type: smsConfig.message_type || "plain",
        scheduling_enabled: !!smsConfig.scheduling_enabled,
        scheduled_at: smsConfig.scheduling_enabled
          ? smsConfig.scheduled_at
          : "",
        enabled: !!smsConfig.enabled,
      };

      await updateSmsConfig(payload);
      toast.success("SMS configuration saved successfully.");
      setSmsConfig((prev) => ({ ...prev, api_key: "" }));
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save SMS settings");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSmsSend = async (e) => {
    e.preventDefault();
    try {
      setSendingTest(true);
      if (!smsForm.recipientPhones?.trim()) {
        toast.error("Please enter a test phone number.");
        return;
      }
      if (!smsForm.message?.trim()) {
        toast.error("Please enter a test message.");
        return;
      }

      const payload = {
        recipientPhones: smsForm.recipientPhones,
        message: smsForm.message,
        recipientType: smsForm.recipientType,
        scheduledAt: smsForm.scheduledAt || "",
        sender_id: {
          NT: smsConfig.sender_id?.NT || "",
          Ncell: smsConfig.sender_id?.Ncell || "",
        },
        message_type: smsConfig.message_type || "plain",
      };

      const result = await sendSms(payload);
      const batchId = result.data?.data?.batch_id;
      toast.success(
        batchId
          ? `Test SMS sent successfully. Batch ID: ${batchId}`
          : "Test SMS sent successfully.",
      );
      setSmsForm({
        recipientType: "manual",
        recipientPhones: "",
        templateName: "",
        message: "",
        scheduledAt: "",
      });
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send test SMS");
    } finally {
      setSendingTest(false);
    }
  };

  const handleTemplateSave = async (e) => {
    e.preventDefault();
    try {
      if (!templateForm.name || !templateForm.content) {
        return toast.error("Template name and content are required");
      }
      if (editingTemplateId) {
        await updateSmsTemplate(editingTemplateId, templateForm);
        toast.success("Template updated");
      } else {
        await createSmsTemplate(templateForm);
        toast.success("Template created");
      }
      setEditingTemplateId(null);
      setTemplateForm({ name: "", content: "" });
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save template");
    }
  };

  const handleTemplateEdit = (template) => {
    setEditingTemplateId(template.id);
    setTemplateForm({ name: template.name, content: template.content });
    setActiveTab("templates");
  };

  const handleTemplateDelete = async (templateId) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await deleteSmsTemplate(templateId);
      toast.success("Template deleted");
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Could not delete template");
    }
  };

  const addAttachment = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNoticeForm((prev) => ({
        ...prev,
        attachments: [
          ...(prev.attachments || []),
          { name: file.name, type: file.type, data: reader.result },
        ],
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index) => {
    setNoticeForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== index),
    }));
  };

  const chooseNoticeEdit = (notice) => {
    setEditingNotice(notice);
    setNoticeForm({
      title: notice.title || "",
      content: notice.content || "",
      category: notice.category || "General",
      audience: notice.audience || "All",
      audienceDetails: notice.audienceDetails || "",
      expiryDate: notice.expiryDate || "",
      pinned: !!notice.pinned,
      status: notice.status || "draft",
      emailNotification: !!notice.emailNotification,
      recipientEmails: (notice.recipientEmails || []).join("\n"),
      attachments: notice.attachments || [],
    });
    setActiveTab("notices");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="p-6 text-muted">Loading SMS configuration...</div>
    );
  }

  const statusColor =
    smsConfig.enabled && smsConfig.api_key_configured
      ? "text-success"
      : smsConfig.enabled
        ? "text-warning"
        : "text-muted";
  const statusLabel =
    smsConfig.enabled && smsConfig.api_key_configured
      ? "Connected"
      : smsConfig.enabled
        ? "Configuration Error"
        : "Not Configured";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 bg-surface border border-default shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-primary">SMS</h2>
            <p className="text-muted mt-1">
              Configure your Mega Web Link SMS provider and test delivery.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["sms", "notices", "templates", "logs"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeTab === tab ? "bg-accent text-primary" : "bg-subtle text-muted hover:bg-subtle"}`}
              >
                {tab === "notices"
                  ? "Notices"
                  : tab === "sms"
                    ? "SMS"
                    : tab === "templates"
                      ? "SMS Templates"
                      : "SMS Logs"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "notices" && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    Notice Board
                  </h3>
                  <p className="text-muted text-sm">
                    Create announcements, assign audience, track reads and
                    archive outdated notices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetNoticeForm}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success text-primary hover:bg-success transition"
                >
                  <Plus size={16} /> New Notice
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {["published", "review", "draft", "archived"].map((status) => (
                  <div
                    key={status}
                    className="rounded-2xl bg-subtle border border-default p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-muted uppercase tracking-[0.18em] text-[11px]">
                        {status}
                      </p>
                      <span className="text-primary font-semibold">
                        {noticesByStatus[status]?.length || 0}
                      </span>
                    </div>
                    <p className="text-muted text-sm">
                      {status === "published"
                        ? "Live notices"
                        : status === "review"
                          ? "Awaiting review"
                          : status === "draft"
                            ? "Drafts"
                            : "Archived items"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {notices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-default p-6 text-muted">
                    No notices found. Create one to begin.
                  </div>
                ) : (
                  notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="rounded-2xl bg-subtle border border-default p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-accent-soft text-accent text-xs uppercase px-2 py-1">
                              {notice.category}
                            </span>
                            <span className="text-muted text-xs">
                              {notice.audience}
                            </span>
                            {notice.pinned && (
                              <span className="inline-flex items-center gap-1 text-warning text-xs">
                                <Star size={12} /> Pinned
                              </span>
                            )}
                            {notice.status && (
                              <span className="text-muted text-xs">
                                Status: {notice.status}
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-semibold text-primary">
                            {notice.title}
                          </h4>
                          <p className="text-muted text-sm leading-6">
                            {notice.content}
                          </p>
                          <div className="flex flex-wrap gap-3 text-muted text-xs">
                            <span>
                              Created:{" "}
                              {new Date(notice.createdAt).toLocaleDateString()}
                            </span>
                            {notice.expiryDate && (
                              <span>
                                Expires:{" "}
                                {new Date(
                                  notice.expiryDate,
                                ).toLocaleDateString()}
                              </span>
                            )}
                            <span>{notice.readCount || 0} read</span>
                            {notice.recipientEmails?.length > 0 && (
                              <span>
                                {notice.recipientEmails.length} recipients
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => chooseNoticeEdit(notice)}
                            className="px-3 py-2 rounded-lg bg-subtle text-primary text-sm hover:bg-selected transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleNoticeDelete(notice.id)}
                            className="px-3 py-2 rounded-lg bg-danger-soft text-danger text-sm hover:bg-danger transition"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() =>
                              handleTogglePin(notice.id, !notice.pinned)
                            }
                            className="px-3 py-2 rounded-lg bg-subtle text-primary text-sm hover:bg-selected transition"
                          >
                            {notice.pinned ? "Unpin" : "Pin"}
                          </button>
                          {notice.status !== "archived" && (
                            <button
                              onClick={() => handleArchive(notice.id)}
                              className="px-3 py-2 rounded-lg bg-subtle text-primary text-sm hover:bg-selected transition"
                            >
                              Archive
                            </button>
                          )}
                          {!notice.read && (
                            <button
                              onClick={() => handleReadNotice(notice.id)}
                              className="px-3 py-2 rounded-lg bg-success text-primary text-sm hover:bg-success transition"
                            >
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-subtle border border-default p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {editingNotice ? "Edit Notice" : "Create Notice"}
                  </h3>
                  <p className="text-muted text-sm">
                    Use the notice form to create announcements and control
                    distribution.
                  </p>
                </div>
                {editingNotice && (
                  <button
                    onClick={resetNoticeForm}
                    className="text-muted text-sm hover:text-primary"
                  >
                    Clear
                  </button>
                )}
              </div>

              <form onSubmit={handleNoticeSubmit} className="space-y-4">
                <div>
                  <label className="mis-label">Title</label>
                  <input
                    className="mis-input"
                    value={noticeForm.title}
                    onChange={(e) =>
                      setNoticeForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mis-label">Content</label>
                  <textarea
                    rows={4}
                    className="mis-input resize-none"
                    value={noticeForm.content}
                    onChange={(e) =>
                      setNoticeForm((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mis-label">Category</label>
                    <select
                      className="mis-input"
                      value={noticeForm.category}
                      onChange={(e) =>
                        setNoticeForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                    >
                      {NOTICE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mis-label">Audience</label>
                    <select
                      className="mis-input"
                      value={noticeForm.audience}
                      onChange={(e) =>
                        setNoticeForm((prev) => ({
                          ...prev,
                          audience: e.target.value,
                        }))
                      }
                    >
                      {AUDIENCE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mis-label">Expiry Date</label>
                    <input
                      type="date"
                      className="mis-input"
                      value={noticeForm.expiryDate}
                      onChange={(e) =>
                        setNoticeForm((prev) => ({
                          ...prev,
                          expiryDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mis-label">Workflow Status</label>
                    <select
                      className="mis-input"
                      value={noticeForm.status}
                      onChange={(e) =>
                        setNoticeForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      {["draft", "review", "published", "archived"].map(
                        (value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="mis-label flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={noticeForm.pinned}
                      onChange={(e) =>
                        setNoticeForm((prev) => ({
                          ...prev,
                          pinned: e.target.checked,
                        }))
                      }
                    />
                    Pin notice to top
                  </label>
                  <label className="mis-label flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={noticeForm.emailNotification}
                      onChange={(e) =>
                        setNoticeForm((prev) => ({
                          ...prev,
                          emailNotification: e.target.checked,
                        }))
                      }
                    />
                    Email Notification
                  </label>
                </div>
                {noticeForm.emailNotification && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="mis-label flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={noticeForm.sendImmediately}
                        onChange={(e) =>
                          setNoticeForm((prev) => ({
                            ...prev,
                            sendImmediately: e.target.checked,
                          }))
                        }
                      />
                      Send to recipients immediately
                    </label>
                    <div className="text-muted text-sm">
                      If checked, the notice will be emailed as soon as you save
                      it.
                    </div>
                  </div>
                )}
                <div>
                  <label className="mis-label">Notification Emails</label>
                  <textarea
                    rows={3}
                    className="mis-input resize-none"
                    placeholder="example@school.edu, parent@example.com"
                    value={noticeForm.recipientEmails}
                    onChange={(e) =>
                      setNoticeForm((prev) => ({
                        ...prev,
                        recipientEmails: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted mt-1">
                    One email per line or comma-separated.
                  </p>
                </div>
                <div>
                  <label className="mis-label">Attachments</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={addAttachment}
                    className="w-full text-primary"
                  />
                  {noticeForm.attachments?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {noticeForm.attachments.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-default bg-surface px-3 py-2 text-sm text-primary"
                        >
                          <div className="truncate">{file.name}</div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-danger hover:text-danger"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    {editingNotice ? "Update Notice" : "Publish Notice"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "sms" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-default bg-subtle p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${statusColor.replace("text-", "bg-")}`}
                />
                <div>
                  <p className="text-sm font-semibold text-primary">Status</p>
                  <p className="text-xs text-muted">{statusLabel}</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-default px-3 py-2 text-sm text-primary hover:bg-subtle"
              >
                Test Connection
              </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <div className="rounded-2xl bg-subtle border border-default p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">
                  SMS Provider
                </h3>
                <form onSubmit={saveSmsSettings} className="space-y-4">
                  <div>
                    <label className="mis-label">API Endpoint</label>
                    <input
                      className="mis-input"
                      value={
                        smsConfig.endpoint ||
                        "https://sms.megaweblink.com.np/api/v1/sms/send/"
                      }
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="mis-label">API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        className="mis-input pr-11"
                        value={smsConfig.api_key}
                        placeholder="Enter your SMS API key"
                        onChange={(e) =>
                          setSmsConfig((prev) => ({
                            ...prev,
                            api_key: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-primary"
                        onClick={() => setShowApiKey((prev) => !prev)}
                      >
                        {showApiKey ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      Your API key is encrypted/secured and is never exposed to
                      the client.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-default bg-surface p-4">
                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                      Sender ID Configuration
                    </h4>
                    <p className="mb-4 text-xs text-muted">
                      Sender IDs must be approved for the corresponding operator
                      before they can be used.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="mis-label">NT / Nepal Telecom</label>
                        <input
                          className="mis-input"
                          value={smsConfig.sender_id?.NT || ""}
                          placeholder="Sender ID"
                          onChange={(e) =>
                            setSmsConfig((prev) => ({
                              ...prev,
                              sender_id: {
                                ...prev.sender_id,
                                NT: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="mis-label">Ncell</label>
                        <input
                          className="mis-input"
                          value={smsConfig.sender_id?.Ncell || ""}
                          placeholder="Sender ID"
                          onChange={(e) =>
                            setSmsConfig((prev) => ({
                              ...prev,
                              sender_id: {
                                ...prev.sender_id,
                                Ncell: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-default bg-surface p-4">
                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                      Message Settings
                    </h4>
                    <div>
                      <label className="mis-label">Message Type</label>
                      <select
                        className="mis-input"
                        value={smsConfig.message_type || "plain"}
                        onChange={(e) =>
                          setSmsConfig((prev) => ({
                            ...prev,
                            message_type: e.target.value,
                          }))
                        }
                      >
                        <option value="plain">Plain</option>
                        <option value="unicode">Unicode</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-default bg-surface p-4">
                    <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
                      Scheduled SMS
                    </h4>
                    <label className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-primary">
                        Enable Scheduling
                      </span>
                      <input
                        type="checkbox"
                        checked={!!smsConfig.scheduling_enabled}
                        onChange={(e) =>
                          setSmsConfig((prev) => ({
                            ...prev,
                            scheduling_enabled: e.target.checked,
                          }))
                        }
                      />
                    </label>

                    {smsConfig.scheduling_enabled && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mis-label">Scheduled Date</label>
                          <input
                            type="date"
                            className="mis-input"
                            value={
                              smsConfig.scheduled_at
                                ? smsConfig.scheduled_at.slice(0, 10)
                                : ""
                            }
                            onChange={(e) =>
                              setSmsConfig((prev) => ({
                                ...prev,
                                scheduled_at: `${e.target.value}${prev.scheduled_at?.slice(10) || "T00:00"}`,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="mis-label">Scheduled Time</label>
                          <input
                            type="time"
                            className="mis-input"
                            value={
                              smsConfig.scheduled_at
                                ? smsConfig.scheduled_at.slice(11, 16)
                                : ""
                            }
                            onChange={(e) =>
                              setSmsConfig((prev) => ({
                                ...prev,
                                scheduled_at: `${prev.scheduled_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)}T${e.target.value}`,
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingConfig}>
                      {savingConfig ? "Saving..." : "Save Configuration"}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="rounded-2xl bg-subtle border border-default p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Configuration Summary
                </h3>
                <div className="space-y-3 text-sm text-muted">
                  <div className="rounded-xl bg-surface p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      SMS Provider
                    </div>
                    <div className="mt-1 text-primary">Mega Web Link SMS</div>
                  </div>
                  <div className="rounded-xl bg-surface p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      API Endpoint
                    </div>
                    <div className="mt-1 break-all">
                      https://sms.megaweblink.com.np/api/v1/sms/send/
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      API Key
                    </div>
                    <div className="mt-1 text-primary">••••••••••••••••</div>
                  </div>
                  <div className="rounded-xl bg-surface p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      Operators
                    </div>
                    <div className="mt-1 text-primary">
                      {smsConfig.sender_id?.NT
                        ? "✓ Nepal Telecom"
                        : "— Nepal Telecom"}
                      {smsConfig.sender_id?.Ncell ? " · ✓ Ncell" : " · — Ncell"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      Message Type
                    </div>
                    <div className="mt-1 text-primary">
                      {smsConfig.message_type === "unicode"
                        ? "Unicode"
                        : "Plain"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-surface p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      Scheduling
                    </div>
                    <div className="mt-1 text-primary">
                      {smsConfig.scheduling_enabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-subtle border border-default p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Test SMS
              </h3>
              <form onSubmit={handleSmsSend} className="space-y-4">
                <div>
                  <label className="mis-label">Test Phone Number</label>
                  <input
                    className="mis-input"
                    value={smsForm.recipientPhones}
                    placeholder="98XXXXXXXX"
                    onChange={(e) =>
                      setSmsForm((prev) => ({
                        ...prev,
                        recipientPhones: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mis-label">Test Message</label>
                  <textarea
                    rows={4}
                    className="mis-input resize-none"
                    value={smsForm.message}
                    placeholder="This is a test SMS from your application."
                    onChange={(e) =>
                      setSmsForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={sendingTest}>
                    {sendingTest ? "Sending..." : "Send Test SMS"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="grid gap-6 lg:grid-cols-[0.65fr,0.35fr]">
            <div className="space-y-4">
              {smsTemplates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-default p-6 text-muted">
                  No SMS templates yet. Create one to reuse messages.
                </div>
              ) : (
                smsTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-2xl bg-subtle border border-default p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-primary font-semibold">
                          {template.name}
                        </h4>
                        <p className="text-muted text-sm mt-1">
                          {template.content.slice(0, 120)}
                          {template.content.length > 120 ? "..." : ""}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <button
                          onClick={() => handleTemplateEdit(template)}
                          className="text-muted hover:text-primary text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTemplateDelete(template.id)}
                          className="text-danger hover:text-danger text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-2xl bg-subtle border border-default p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">
                {editingTemplateId ? "Edit Template" : "Create Template"}
              </h3>
              <form onSubmit={handleTemplateSave} className="space-y-4">
                <div>
                  <label className="mis-label">Template Name</label>
                  <input
                    className="mis-input"
                    value={templateForm.name}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mis-label">Message Content</label>
                  <textarea
                    rows={5}
                    className="mis-input resize-none"
                    value={templateForm.content}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-3">
                  {editingTemplateId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplateId(null);
                        setTemplateForm({ name: "", content: "" });
                      }}
                      className="px-4 py-2 rounded-full bg-subtle text-primary hover:bg-selected transition"
                    >
                      Cancel
                    </button>
                  )}
                  <Button type="submit">Save Template</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="rounded-2xl bg-subtle border border-default p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  SMS Delivery Logs
                </h3>
                <p className="text-muted text-sm">
                  Track all outgoing SMS deliveries and scheduled sends.
                </p>
              </div>
              <div className="rounded-full bg-subtle px-4 py-2 text-sm text-primary">
                {smsLogs.length} records
              </div>
            </div>
            {smsLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-default p-6 text-muted">
                No SMS activity yet.
              </div>
            ) : (
              <div className="space-y-3">
                {smsLogs.slice(0, 20).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl bg-surface border border-default p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-2 items-center text-muted text-xs uppercase tracking-[0.18em]">
                          <span>{log.recipientType}</span>
                          <span>{log.status}</span>
                          {log.templateName && <span>{log.templateName}</span>}
                        </div>
                        <p className="text-primary font-semibold">{log.to}</p>
                        <p className="text-muted text-sm">
                          {log.message.slice(0, 100)}
                          {log.message.length > 100 ? "..." : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                        {log.providerResponse && (
                          <p className="text-muted text-xs mt-1">
                            {log.providerResponse}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "sms" && (
          <div className="rounded-2xl bg-subtle border border-default p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary">Send SMS</h3>
                <p className="text-muted text-sm">
                  Dispatch a message to individuals or groups, including
                  scheduled sends.
                </p>
              </div>
              <div className="text-muted text-xs">
                If gateway is disabled, logs are still recorded but message is
                not sent.
              </div>
            </div>
            <form onSubmit={handleSmsSend} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mis-label">Recipient Type</label>
                  <select
                    className="mis-input"
                    value={smsForm.recipientType}
                    onChange={(e) =>
                      setSmsForm((prev) => ({
                        ...prev,
                        recipientType: e.target.value,
                      }))
                    }
                  >
                    <option value="manual">Individual / Group</option>
                    <option value="class">Class-wise</option>
                    <option value="section">Section-wise</option>
                    <option value="role">Role-wise</option>
                  </select>
                </div>
                <div>
                  <label className="mis-label">Scheduled Send</label>
                  <input
                    type="datetime-local"
                    className="mis-input"
                    value={smsForm.scheduledAt}
                    onChange={(e) =>
                      setSmsForm((prev) => ({
                        ...prev,
                        scheduledAt: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="mis-label">Recipient Phones</label>
                <textarea
                  rows={3}
                  className="mis-input resize-none"
                  placeholder="Use comma, newline or semicolon separated numbers"
                  value={smsForm.recipientPhones}
                  onChange={(e) =>
                    setSmsForm((prev) => ({
                      ...prev,
                      recipientPhones: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mis-label">Template</label>
                  <select
                    className="mis-input"
                    value={smsForm.templateName}
                    onChange={(e) => {
                      const template = smsTemplates.find(
                        (item) => item.id === e.target.value,
                      );
                      setSmsForm((prev) => ({
                        ...prev,
                        templateName: e.target.value,
                        message: template ? template.content : prev.message,
                      }));
                    }}
                  >
                    <option value="">Manual message</option>
                    {smsTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mis-label">Signature</label>
                  <input
                    className="mis-input"
                    value={smsConfig.signature}
                    readOnly
                  />
                </div>
              </div>
              <div>
                <label className="mis-label">Message</label>
                <textarea
                  rows={5}
                  className="mis-input resize-none"
                  value={smsForm.message}
                  onChange={(e) =>
                    setSmsForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit">
                  <Send size={16} /> Send SMS
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticesSms;
