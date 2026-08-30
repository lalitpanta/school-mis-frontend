import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
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
} from '../../api/settingsApi';
import Button from '../common/Button';
import { Plus, Trash2, Send, ShieldCheck, Star } from 'lucide-react';

const NOTICE_CATEGORIES = ['Academic', 'Event', 'Holiday', 'Urgent', 'General'];
const AUDIENCE_OPTIONS = ['All', 'Teachers', 'Students', 'Parents', 'Class-wise', 'Section-wise'];
const DEFAULT_SMS_CONFIG = {
  enabled: false,
  gateway: 'sparrow',
  api_key: '',
  sender_id: '',
  provider_name: 'Sparrow SMS',
  country: 'NP',
  credits: 0,
  signature: '',
};

const defaultNoticeForm = {
  title: '',
  content: '',
  category: 'General',
  audience: 'All',
  audienceDetails: '',
  expiryDate: '',
  pinned: false,
  status: 'draft',
  emailNotification: false,
  sendImmediately: false,
  recipientEmails: '',
  attachments: [],
};

const NoticesSms = () => {
  const [activeTab, setActiveTab] = useState('notices');
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState(defaultNoticeForm);
  const [editingNotice, setEditingNotice] = useState(null);
  const [smsConfig, setSmsConfig] = useState(DEFAULT_SMS_CONFIG);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [smsForm, setSmsForm] = useState({ recipientType: 'manual', recipientPhones: '', templateName: '', message: '', scheduledAt: '' });
  const [templateForm, setTemplateForm] = useState({ name: '', content: '' });
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [noticeRes, smsConfigRes, templatesRes, logsRes] = await Promise.all([
        getNotices(),
        getSmsConfig(),
        getSmsTemplates(),
        getSmsLogs(),
      ]);
      setNotices(noticeRes.data?.data || []);
      setSmsConfig(smsConfigRes.data?.data || DEFAULT_SMS_CONFIG);
      setSmsTemplates(templatesRes.data?.data || []);
      setSmsLogs(logsRes.data?.data || []);
    } catch (err) {
      console.error('NoticesSms fetchData error', err.response?.data || err.message, err);
      toast.error(err.response?.data?.message || 'Failed to load Notices / SMS data');
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
        return toast.error('Title and content are required.');
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
        toast.success('Notice updated');
      } else {
        await createNotice(payload);
        toast.success('Notice created');
      }
      await fetchData();
      resetNoticeForm();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save notice');
    }
  };

  const handleNoticeDelete = async (noticeId) => {
    if (!window.confirm('Delete this notice permanently?')) return;
    try {
      await deleteNotice(noticeId);
      toast.success('Notice deleted');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Could not delete notice');
    }
  };

  const handleReadNotice = async (noticeId) => {
    try {
      await markNoticeRead(noticeId);
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Could not mark notice read');
    }
  };

  const handleTogglePin = async (noticeId, pinned) => {
    try {
      await togglePinNotice(noticeId, { pinned });
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Could not update pin state');
    }
  };

  const handleArchive = async (noticeId) => {
    if (!window.confirm('Archive this notice?')) return;
    try {
      await archiveNotice(noticeId);
      toast.success('Notice archived');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Could not archive notice');
    }
  };

  const noticesByStatus = useMemo(() => ({
    published: notices.filter((item) => item.status === 'published'),
    review: notices.filter((item) => item.status === 'review'),
    draft: notices.filter((item) => item.status === 'draft'),
    archived: notices.filter((item) => item.status === 'archived'),
  }), [notices]);

  const saveSmsSettings = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...smsConfig };
      await updateSmsConfig(payload);
      toast.success('SMS configuration saved');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save SMS settings');
    }
  };

  const handleSmsSend = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...smsForm,
      };
      const result = await sendSms(payload);
      toast.success(result.data?.data?.sent ? 'SMS queued' : 'SMS saved as draft');
      setSmsForm({ recipientType: 'manual', recipientPhones: '', templateName: '', message: '', scheduledAt: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send SMS');
    }
  };

  const handleTemplateSave = async (e) => {
    e.preventDefault();
    try {
      if (!templateForm.name || !templateForm.content) {
        return toast.error('Template name and content are required');
      }
      if (editingTemplateId) {
        await updateSmsTemplate(editingTemplateId, templateForm);
        toast.success('Template updated');
      } else {
        await createSmsTemplate(templateForm);
        toast.success('Template created');
      }
      setEditingTemplateId(null);
      setTemplateForm({ name: '', content: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save template');
    }
  };

  const handleTemplateEdit = (template) => {
    setEditingTemplateId(template.id);
    setTemplateForm({ name: template.name, content: template.content });
    setActiveTab('templates');
  };

  const handleTemplateDelete = async (templateId) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await deleteSmsTemplate(templateId);
      toast.success('Template deleted');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Could not delete template');
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
      title: notice.title || '',
      content: notice.content || '',
      category: notice.category || 'General',
      audience: notice.audience || 'All',
      audienceDetails: notice.audienceDetails || '',
      expiryDate: notice.expiryDate || '',
      pinned: !!notice.pinned,
      status: notice.status || 'draft',
      emailNotification: !!notice.emailNotification,
      recipientEmails: (notice.recipientEmails || []).join('\n'),
      attachments: notice.attachments || [],
    });
    setActiveTab('notices');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="p-6 text-slate-300">Loading Notices & SMS...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 bg-slate-900 border border-slate-700/60 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">Notices & SMS</h2>
            <p className="text-slate-400 mt-1">Manage internal notices, SMS settings, templates and delivery tracking.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['notices','sms','templates','logs'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {tab === 'notices' ? 'Notices' : tab === 'sms' ? 'SMS' : tab === 'templates' ? 'SMS Templates' : 'SMS Logs'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'notices' && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Notice Board</h3>
                  <p className="text-slate-400 text-sm">Create announcements, assign audience, track reads and archive outdated notices.</p>
                </div>
                <button
                  type="button"
                  onClick={resetNoticeForm}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition"
                >
                  <Plus size={16} /> New Notice
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {['published','review','draft','archived'].map((status) => (
                  <div key={status} className="rounded-2xl bg-slate-800/80 border border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-300 uppercase tracking-[0.18em] text-[11px]">{status}</p>
                      <span className="text-white font-semibold">{noticesByStatus[status]?.length || 0}</span>
                    </div>
                    <p className="text-slate-500 text-sm">{status === 'published' ? 'Live notices' : status === 'review' ? 'Awaiting review' : status === 'draft' ? 'Drafts' : 'Archived items'}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {notices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-600 p-6 text-slate-400">No notices found. Create one to begin.</div>
                ) : (
                  notices.map((notice) => (
                    <div key={notice.id} className="rounded-2xl bg-slate-800/70 border border-slate-700 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-indigo-600/20 text-indigo-200 text-xs uppercase px-2 py-1">{notice.category}</span>
                            <span className="text-slate-500 text-xs">{notice.audience}</span>
                            {notice.pinned && <span className="inline-flex items-center gap-1 text-amber-300 text-xs"><Star size={12} /> Pinned</span>}
                            {notice.status && <span className="text-slate-400 text-xs">Status: {notice.status}</span>}
                          </div>
                          <h4 className="text-lg font-semibold text-white">{notice.title}</h4>
                          <p className="text-slate-300 text-sm leading-6">{notice.content}</p>
                          <div className="flex flex-wrap gap-3 text-slate-400 text-xs">
                            <span>Created: {new Date(notice.createdAt).toLocaleDateString()}</span>
                            {notice.expiryDate && <span>Expires: {new Date(notice.expiryDate).toLocaleDateString()}</span>}
                            <span>{notice.readCount || 0} read</span>
                            {notice.recipientEmails?.length > 0 && <span>{notice.recipientEmails.length} recipients</span>}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => chooseNoticeEdit(notice)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 text-sm hover:bg-slate-600 transition">Edit</button>
                          <button onClick={() => handleNoticeDelete(notice.id)} className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/25 transition">Delete</button>
                          <button onClick={() => handleTogglePin(notice.id, !notice.pinned)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 text-sm hover:bg-slate-600 transition">{notice.pinned ? 'Unpin' : 'Pin'}</button>
                          {notice.status !== 'archived' && (
                            <button onClick={() => handleArchive(notice.id)} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-100 text-sm hover:bg-slate-600 transition">Archive</button>
                          )}
                          {!notice.read && <button onClick={() => handleReadNotice(notice.id)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 transition">Mark Read</button>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">{editingNotice ? 'Edit Notice' : 'Create Notice'}</h3>
                  <p className="text-slate-400 text-sm">Use the notice form to create announcements and control distribution.</p>
                </div>
                {editingNotice && (
                  <button onClick={resetNoticeForm} className="text-slate-300 text-sm hover:text-white">Clear</button>
                )}
              </div>

              <form onSubmit={handleNoticeSubmit} className="space-y-4">
                <div>
                  <label className="mis-label">Title</label>
                  <input className="mis-input" value={noticeForm.title} onChange={(e) => setNoticeForm((prev) => ({ ...prev, title: e.target.value }))} />
                </div>
                <div>
                  <label className="mis-label">Content</label>
                  <textarea rows={4} className="mis-input resize-none" value={noticeForm.content} onChange={(e) => setNoticeForm((prev) => ({ ...prev, content: e.target.value }))} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mis-label">Category</label>
                    <select className="mis-input" value={noticeForm.category} onChange={(e) => setNoticeForm((prev) => ({ ...prev, category: e.target.value }))}>
                      {NOTICE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mis-label">Audience</label>
                    <select className="mis-input" value={noticeForm.audience} onChange={(e) => setNoticeForm((prev) => ({ ...prev, audience: e.target.value }))}>
                      {AUDIENCE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mis-label">Expiry Date</label>
                    <input type="date" className="mis-input" value={noticeForm.expiryDate} onChange={(e) => setNoticeForm((prev) => ({ ...prev, expiryDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mis-label">Workflow Status</label>
                    <select className="mis-input" value={noticeForm.status} onChange={(e) => setNoticeForm((prev) => ({ ...prev, status: e.target.value }))}>
                      {['draft','review','published','archived'].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="mis-label flex items-center gap-3">
                    <input type="checkbox" checked={noticeForm.pinned} onChange={(e) => setNoticeForm((prev) => ({ ...prev, pinned: e.target.checked }))} />
                    Pin notice to top
                  </label>
                  <label className="mis-label flex items-center gap-3">
                    <input type="checkbox" checked={noticeForm.emailNotification} onChange={(e) => setNoticeForm((prev) => ({ ...prev, emailNotification: e.target.checked }))} />
                    Email Notification
                  </label>
                </div>
                {noticeForm.emailNotification && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="mis-label flex items-center gap-3">
                      <input type="checkbox" checked={noticeForm.sendImmediately} onChange={(e) => setNoticeForm((prev) => ({ ...prev, sendImmediately: e.target.checked }))} />
                      Send to recipients immediately
                    </label>
                    <div className="text-slate-400 text-sm">If checked, the notice will be emailed as soon as you save it.</div>
                  </div>
                )}
                <div>
                  <label className="mis-label">Notification Emails</label>
                  <textarea rows={3} className="mis-input resize-none" placeholder="example@school.edu, parent@example.com" value={noticeForm.recipientEmails} onChange={(e) => setNoticeForm((prev) => ({ ...prev, recipientEmails: e.target.value }))} />
                  <p className="text-xs text-slate-500 mt-1">One email per line or comma-separated.</p>
                </div>
                <div>
                  <label className="mis-label">Attachments</label>
                  <input type="file" accept="image/*,application/pdf" onChange={addAttachment} className="w-full text-slate-200" />
                  {noticeForm.attachments?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {noticeForm.attachments.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                          <div className="truncate">{file.name}</div>
                          <button type="button" onClick={() => removeAttachment(index)} className="text-rose-300 hover:text-rose-100">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit">{editingNotice ? 'Update Notice' : 'Publish Notice'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="grid gap-6 lg:grid-cols-[0.65fr,0.35fr]">
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">SMS Configuration</h3>
              <form onSubmit={saveSmsSettings} className="space-y-4">
                <label className="mis-label">Gateway</label>
                <select className="mis-input" value={smsConfig.gateway} onChange={(e) => setSmsConfig((prev) => ({ ...prev, gateway: e.target.value }))}>
                  <option value="sparrow">Sparrow SMS</option>
                  <option value="aakash">Aakash SMS</option>
                  <option value="twilio">Twilio</option>
                  <option value="nexmo">Nexmo</option>
                </select>

                <label className="mis-label">API Key</label>
                <input className="mis-input" value={smsConfig.api_key} onChange={(e) => setSmsConfig((prev) => ({ ...prev, api_key: e.target.value }))} />

                <label className="mis-label">Sender ID</label>
                <input className="mis-input" value={smsConfig.sender_id} onChange={(e) => setSmsConfig((prev) => ({ ...prev, sender_id: e.target.value }))} />

                <label className="mis-label">Provider Name</label>
                <input className="mis-input" value={smsConfig.provider_name} onChange={(e) => setSmsConfig((prev) => ({ ...prev, provider_name: e.target.value }))} />

                <label className="mis-label">Signature</label>
                <input className="mis-input" value={smsConfig.signature} onChange={(e) => setSmsConfig((prev) => ({ ...prev, signature: e.target.value }))} />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mis-label">Country</label>
                    <input className="mis-input" value={smsConfig.country} onChange={(e) => setSmsConfig((prev) => ({ ...prev, country: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mis-label">SMS Credits</label>
                    <input type="number" className="mis-input" value={smsConfig.credits} onChange={(e) => setSmsConfig((prev) => ({ ...prev, credits: Number(e.target.value) }))} />
                  </div>
                </div>
                <label className="mis-label flex items-center gap-3">
                  <input type="checkbox" checked={smsConfig.enabled} onChange={(e) => setSmsConfig((prev) => ({ ...prev, enabled: e.target.checked }))} />
                  Enable SMS Gateway
                </label>
                <div className="flex justify-end">
                  <Button type="submit">Save SMS Config</Button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4 text-slate-300">
                <ShieldCheck size={18} />
                <div>
                  <p className="text-sm font-semibold text-white">Gateway Status</p>
                  <p className="text-xs text-slate-500">{smsConfig.enabled ? `Active (${smsConfig.provider_name})` : 'Disabled'}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                  <div className="text-slate-400 text-xs uppercase tracking-[0.2em]">Remaining Credits</div>
                  <div className="text-3xl font-semibold text-white">{smsConfig.credits ?? 0}</div>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-4 border border-slate-700">
                  <div className="text-slate-400 text-xs uppercase tracking-[0.2em]">Country</div>
                  <div className="text-xl font-semibold text-white">{smsConfig.country || 'NP'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid gap-6 lg:grid-cols-[0.65fr,0.35fr]">
            <div className="space-y-4">
              {smsTemplates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-600 p-6 text-slate-400">No SMS templates yet. Create one to reuse messages.</div>
              ) : (
                smsTemplates.map((template) => (
                  <div key={template.id} className="rounded-2xl bg-slate-800/70 border border-slate-700 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-white font-semibold">{template.name}</h4>
                        <p className="text-slate-400 text-sm mt-1">{template.content.slice(0, 120)}{template.content.length > 120 ? '...' : ''}</p>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        <button onClick={() => handleTemplateEdit(template)} className="text-slate-300 hover:text-white text-sm">Edit</button>
                        <button onClick={() => handleTemplateDelete(template.id)} className="text-rose-300 hover:text-rose-100 text-sm">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{editingTemplateId ? 'Edit Template' : 'Create Template'}</h3>
              <form onSubmit={handleTemplateSave} className="space-y-4">
                <div>
                  <label className="mis-label">Template Name</label>
                  <input className="mis-input" value={templateForm.name} onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <label className="mis-label">Message Content</label>
                  <textarea rows={5} className="mis-input resize-none" value={templateForm.content} onChange={(e) => setTemplateForm((prev) => ({ ...prev, content: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-3">
                  {editingTemplateId && (
                    <button type="button" onClick={() => { setEditingTemplateId(null); setTemplateForm({ name: '', content: '' }); }} className="px-4 py-2 rounded-full bg-slate-700 text-slate-200 hover:bg-slate-600 transition">Cancel</button>
                  )}
                  <Button type="submit">Save Template</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">SMS Delivery Logs</h3>
                <p className="text-slate-400 text-sm">Track all outgoing SMS deliveries and scheduled sends.</p>
              </div>
              <div className="rounded-full bg-slate-700 px-4 py-2 text-sm text-slate-200">{smsLogs.length} records</div>
            </div>
            {smsLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-600 p-6 text-slate-400">No SMS activity yet.</div>
            ) : (
              <div className="space-y-3">
                {smsLogs.slice(0, 20).map((log) => (
                  <div key={log.id} className="rounded-2xl bg-slate-900/70 border border-slate-700 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-2 items-center text-slate-400 text-xs uppercase tracking-[0.18em]">
                          <span>{log.recipientType}</span>
                          <span>{log.status}</span>
                          {log.templateName && <span>{log.templateName}</span>}
                        </div>
                        <p className="text-slate-200 font-semibold">{log.to}</p>
                        <p className="text-slate-400 text-sm">{log.message.slice(0, 100)}{log.message.length > 100 ? '...' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500 text-xs">{new Date(log.createdAt).toLocaleString()}</p>
                        {log.providerResponse && <p className="text-slate-500 text-xs mt-1">{log.providerResponse}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Send SMS</h3>
                <p className="text-slate-400 text-sm">Dispatch a message to individuals or groups, including scheduled sends.</p>
              </div>
              <div className="text-slate-400 text-xs">If gateway is disabled, logs are still recorded but message is not sent.</div>
            </div>
            <form onSubmit={handleSmsSend} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mis-label">Recipient Type</label>
                  <select className="mis-input" value={smsForm.recipientType} onChange={(e) => setSmsForm((prev) => ({ ...prev, recipientType: e.target.value }))}>
                    <option value="manual">Individual / Group</option>
                    <option value="class">Class-wise</option>
                    <option value="section">Section-wise</option>
                    <option value="role">Role-wise</option>
                  </select>
                </div>
                <div>
                  <label className="mis-label">Scheduled Send</label>
                  <input type="datetime-local" className="mis-input" value={smsForm.scheduledAt} onChange={(e) => setSmsForm((prev) => ({ ...prev, scheduledAt: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="mis-label">Recipient Phones</label>
                <textarea rows={3} className="mis-input resize-none" placeholder="Use comma, newline or semicolon separated numbers" value={smsForm.recipientPhones} onChange={(e) => setSmsForm((prev) => ({ ...prev, recipientPhones: e.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mis-label">Template</label>
                  <select className="mis-input" value={smsForm.templateName} onChange={(e) => {
                    const template = smsTemplates.find((item) => item.id === e.target.value);
                    setSmsForm((prev) => ({
                      ...prev,
                      templateName: e.target.value,
                      message: template ? template.content : prev.message,
                    }));
                  }}>
                    <option value="">Manual message</option>
                    {smsTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mis-label">Signature</label>
                  <input className="mis-input" value={smsConfig.signature} readOnly />
                </div>
              </div>
              <div>
                <label className="mis-label">Message</label>
                <textarea rows={5} className="mis-input resize-none" value={smsForm.message} onChange={(e) => setSmsForm((prev) => ({ ...prev, message: e.target.value }))} />
              </div>
              <div className="flex justify-end">
                <Button type="submit"><Send size={16} /> Send SMS</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticesSms;
