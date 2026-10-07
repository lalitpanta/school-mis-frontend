import { useEffect, useState } from 'react';
import api from '../api/axiosInstance';
import dailyApi from '../api/dailyReportsApi';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Edit2, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_SECTIONS = [
  { title: '🍽️ Feeding & Nutrition', fields: [
    { label: 'Breakfast/Snack/Lunch eaten', type: 'select', options: ['Full', 'Half', 'Not eaten'], required: true },
    { label: 'Water intake', type: 'select', options: ['Good', 'Less', 'Not much'], required: false },
    { label: 'Food refused or allergy noted', type: 'textarea', required: false },
  ]},
  { title: '😴 Sleep & Rest', fields: [
    { label: 'Nap taken', type: 'select', options: ['Yes', 'No'], required: true },
    { label: 'Nap duration (e.g., 11:00 AM – 12:30 PM)', type: 'text', required: false },
    { label: 'Slept well / Restless', type: 'select', options: ['Slept well', 'Restless'], required: false },
  ]},
  { title: '🚽 Toilet & Hygiene', fields: [
    { label: 'Diaper changes (number of times)', type: 'number', required: false },
    { label: 'Potty/toilet visits (if in training)', type: 'text', required: false },
    { label: 'Any rashes or skin concerns noticed', type: 'textarea', required: false },
  ]},
  { title: '😊 Mood & Behavior', fields: [
    { label: 'Overall mood', type: 'select', options: ['Happy', 'Cranky', 'Calm', 'Tired'], required: true },
    { label: 'Cried', type: 'select', options: ['Yes', 'No', 'Briefly'], required: false },
    { label: 'Settled in quickly or took time', type: 'text', required: false },
  ]},
  { title: '🎨 Activities Done Today', fields: [
    { label: 'Activity name (e.g., clay play, finger painting, storytime)', type: 'text', required: true },
    { label: 'What the child engaged with most', type: 'textarea', required: false },
    { label: 'Group activity or individual play', type: 'select', options: ['Group activity', 'Individual play'], required: false },
  ]},
  { title: '📚 Learning & Development', fields: [
    { label: 'Skill practiced (e.g., color recognition, sorting, singing)', type: 'text', required: false },
    { label: 'Any new word spoken or milestone noticed', type: 'textarea', required: false },
  ]},
  { title: '🤒 Health & Safety', fields: [
    { label: 'Any fever, cough, or illness signs observed', type: 'textarea', required: false },
    { label: 'Injury or incident (if any, with details)', type: 'textarea', required: false },
    { label: 'Medication given (if applicable)', type: 'textarea', required: false },
  ]},
  { title: '💬 Teacher\'s Note', fields: [
    { label: 'Personal short note from the teacher', type: 'textarea', required: false },
    { label: 'Special behavior or achievement of the day', type: 'textarea', required: false },
    { label: 'Any request for parent (e.g., bring extra clothes)', type: 'textarea', required: false },
  ]},
];

const DailyReportPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('template');
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const [students, setStudents] = useState([]);
  const [studentsByClassSection, setStudentsByClassSection] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportFormData, setReportFormData] = useState({});
  const [sendMethod, setSendMethod] = useState(null);
  const [isSaving, setSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState(null);
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyReports, setDailyReports] = useState([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkSendMode, setBulkSendMode] = useState('twilio');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkWhatsAppLinks, setBulkWhatsAppLinks] = useState([]);
  const [bulkLoadError, setBulkLoadError] = useState(null);

  useEffect(() => {
    loadTemplates();
    loadStudents();
  }, []);

  useEffect(() => {
    if (tab === 'bulk') {
      loadReportsForDate(bulkDate);
      setBulkWhatsAppLinks([]);
      setBulkResult(null);
    }
  }, [tab, bulkDate]);

  const loadTemplates = async () => {
    try {
      const res = await dailyApi.getTemplates();
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error('Failed to load templates', err);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.get('/v1/students');
      const data = res.data.data || [];
      setStudents(data);
      
      const grouped = {};
      data.forEach(student => {
        const key = `${student.class_name || 'N/A'}-${student.section_name || 'N/A'}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(student);
      });
      setStudentsByClassSection(grouped);
    } catch (err) {
      console.error('Failed to load students', err);
    }
  };

  const saveTemplate = async () => {
    try {
      if (!name.trim()) {
        toast.error('Template name is required');
        return;
      }
      const payload = { name, description, template: { sections }, created_by: user?.id };
      
      if (editingTemplateId) {
        await dailyApi.updateTemplate(editingTemplateId, payload);
        toast.success('Template updated');
        setEditingTemplateId(null);
      } else {
        await dailyApi.createTemplate(payload);
        toast.success('Template created');
      }
      
      setName('');
      setDescription('');
      setSections(DEFAULT_SECTIONS);
      loadTemplates();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save template');
    }
  };

  const deleteTemplate = async (id) => {
    if (window.confirm('Delete this template?')) {
      try {
        await dailyApi.deleteTemplate(id);
        toast.success('Template deleted');
        loadTemplates();
      } catch (err) {
        toast.error('Failed to delete template');
      }
    }
  };

  const editTemplate = (template) => {
    setEditingTemplateId(template.id);
    setName(template.name);
    setDescription(template.description);
    setSections(template.template?.sections || DEFAULT_SECTIONS);
  };

  const addSection = () => {
    setSections([...sections, { title: 'New Section', fields: [] }]);
  };

  const removeSection = (idx) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const updateSection = (idx, field, value) => {
    const newSections = [...sections];
    newSections[idx] = { ...newSections[idx], [field]: value };
    setSections(newSections);
  };

  const addFieldToSection = (sectionIdx) => {
    const newSections = [...sections];
    newSections[sectionIdx].fields.push({ label: 'New Field', type: 'text', required: false });
    setSections(newSections);
  };

  const removeFieldFromSection = (sectionIdx, fieldIdx) => {
    const newSections = [...sections];
    newSections[sectionIdx].fields = newSections[sectionIdx].fields.filter((_, i) => i !== fieldIdx);
    setSections(newSections);
  };

  const updateField = (sectionIdx, fieldIdx, key, value) => {
    const newSections = [...sections];
    newSections[sectionIdx].fields[fieldIdx] = { ...newSections[sectionIdx].fields[fieldIdx], [key]: value };
    setSections(newSections);
  };

  const handleStudentReportClick = (student, template) => {
    setSelectedStudent(student);
    setSelectedTemplate(template);
    setSavedReportId(null);
    setReportFormData({});
    initializeFormData(template);
  };

  const initializeFormData = (template) => {
    const data = {};
    if (template?.template?.sections) {
      template.template.sections.forEach((section, sIdx) => {
        data[sIdx] = {};
        section.fields.forEach((field, fIdx) => {
          data[sIdx][fIdx] = '';
        });
      });
    }
    setReportFormData(data);
  };

  const handleFieldChange = (sectionIdx, fieldIdx, value) => {
    setReportFormData(prev => ({
      ...prev,
      [sectionIdx]: { ...prev[sectionIdx], [fieldIdx]: value },
    }));
  };

  const loadReportsForDate = async (date) => {
    try {
      setBulkLoadError(null);
      const res = await dailyApi.listReports({ date });
      setDailyReports(res.data.data || []);
    } catch (err) {
      console.error('Failed to load daily reports', err);
      setBulkLoadError('Unable to fetch saved reports for this date.');
    }
  };

  const buildWhatsAppUrl = (phone, message) => {
    const rawPhone = phone.replace(/[^0-9+]/g, '');
    const normalized = rawPhone.startsWith('+') ? rawPhone.slice(1) : rawPhone;
    const encoded = encodeURIComponent(message);
    return `whatsapp://send?phone=${normalized}&text=${encoded}`;
  };

  const sendBulkViaWhatsAppLinks = async () => {
    setBulkSending(true);
    try {
      if (dailyReports.length === 0) {
        toast.error('No reports available for this date');
        return;
      }

      const results = dailyReports.map((report) => {
        const recipient = report.guardian_phone || report.phone_no || null;
        if (!recipient) {
          return { report_id: report.id, status: 'skipped', reason: 'No phone number found' };
        }

        const message = report.pdf_url
          ? `Daily Report for ${report.student_name || 'student'} is ready. Download: ${report.pdf_url}`
          : `Daily Report for ${report.student_name || 'student'} is ready.`;

        const phone = recipient.replace(/[^0-9+]/g, '');
        const url = buildWhatsAppUrl(phone, message);
        return { report_id: report.id, status: 'ready', to: phone, url, student_name: report.student_name };
      });

      const readyLinks = results.filter((item) => item.status === 'ready');
      setBulkWhatsAppLinks(readyLinks);
      setBulkResult({ date: bulkDate, count: dailyReports.length, details: results });

      let blockedCount = 0;
      readyLinks.forEach((item) => {
        const opened = window.open(item.url, '_blank');
        if (!opened) blockedCount += 1;
      });

      if (blockedCount > 0) {
        toast.success(`Generated ${readyLinks.length} WhatsApp links. ${blockedCount} may have been blocked by the browser.`);
      } else {
        toast.success(`Opened ${readyLinks.length} WhatsApp links in new tabs.`);
      }
    } catch (err) {
      console.error('Failed to generate WhatsApp links', err);
      toast.error('Failed to generate links');
    } finally {
      setBulkSending(false);
    }
  };

  const sendBulkReports = async () => {
    if (bulkSendMode === 'link') {
      await sendBulkViaWhatsAppLinks();
      return;
    }

    try {
      setBulkSending(true);
      setBulkResult(null);
      const res = await dailyApi.bulkSendReports({ date: bulkDate });
      setBulkResult(res.data.data);
      toast.success('Bulk send completed');
      loadReportsForDate(bulkDate);
    } catch (err) {
      console.error('Failed to bulk send reports', err);
      toast.error('Bulk send failed');
    } finally {
      setBulkSending(false);
    }
  };

  const deleteBulkReport = async (reportId) => {
    if (!window.confirm('Delete this saved report?')) return;
    try {
      await dailyApi.deleteReport(reportId);
      toast.success('Report deleted');
      loadReportsForDate(bulkDate);
    } catch (err) {
      console.error('Failed to delete report', err);
      toast.error('Failed to delete report');
    }
  };

  const saveReport = async () => {
    try {
      setSaving(true);
      const report = {
        summary: `Report for ${selectedStudent.full_name}`,
        data: reportFormData,
        template_name: selectedTemplate.name,
      };
      const res = await dailyApi.createReport({
        student_id: selectedStudent.id,
        classroom_id: selectedStudent.classroom_id || null,
        template_id: selectedTemplate.id,
        report,
        created_by: user?.id,
      });
      setSavedReportId(res.data.data?.id);
      toast.success('Report saved');
    } catch (err) {
      console.error('Failed to save report', err);
      toast.error('Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const sendReport = async (method) => {
    if (!savedReportId) {
      toast.error('Please save the report first');
      return;
    }

    try {
      if (method === 'whatsapp') {
        const recipient = selectedStudent.guardian_phone || selectedStudent.phone_no;
        if (!recipient) {
          toast.error('Guardian phone not found');
          return;
        }

        const message = `Daily Report for ${selectedStudent.full_name}: ${selectedTemplate.name}`;
        // Get the PDF URL if available (from the saved report)
        try {
          const reportsRes = await dailyApi.listReports({ studentId: selectedStudent.id });
          const latestReport = reportsRes.data.data?.[0];
          
          const pdfUrl = latestReport?.pdf_url || '';
          const fullMessage = pdfUrl 
            ? `${message}\n\nDownload Report: ${pdfUrl}`
            : message;

          const whatsappUrl = buildWhatsAppUrl(recipient, fullMessage);
          window.open(whatsappUrl, '_blank');
          toast.success('WhatsApp opened. Please send the message.');
        } catch (err) {
          console.error('Error getting PDF URL:', err);
          // Fallback to basic message
          const whatsappUrl = buildWhatsAppUrl(recipient, message);
          window.open(whatsappUrl, '_blank');
          toast.success('WhatsApp opened. Please send the message.');
        }
      } else if (method === 'email') {
        const response = await dailyApi.sendReportEmail(savedReportId);
        toast.success(`Daily report emailed to ${response.data.data.sent_to}`);
      }

      setSendMethod(null);
    } catch (err) {
      console.error('Failed to send daily report', err);
      toast.error(err.response?.data?.message || 'Failed to send report');
    }
  };

  const closeReportForm = () => {
    setSelectedStudent(null);
    setSelectedTemplate(null);
    setReportFormData({});
    setSavedReportId(null);
    setSendMethod(null);
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Daily Student Report</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('template')}
          className={`px-4 py-2 rounded font-medium transition ${
            tab === 'template'
              ? 'bg-accent text-primary'
              : 'bg-subtle text-muted hover:bg-selected'
          }`}
        >
          Set Template
        </button>
        <button
          onClick={() => setTab('send')}
          className={`px-4 py-2 rounded font-medium transition ${
            tab === 'send'
              ? 'bg-accent text-primary'
              : 'bg-subtle text-muted hover:bg-selected'
          }`}
        >
          Insert & Send
        </button>
        <button
          onClick={() => setTab('bulk')}
          className={`px-4 py-2 rounded font-medium transition ${
            tab === 'bulk'
              ? 'bg-accent text-primary'
              : 'bg-subtle text-muted hover:bg-selected'
          }`}
        >
          Bulk Send
        </button>
      </div>

      {/* SET TEMPLATE TAB */}
      {tab === 'template' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Form Builder */}
          <div className="col-span-2">
            <div className="rounded-lg p-6 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Create/Edit Template</h3>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Template Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full mis-input"
                    placeholder="e.g., Daily Nursery Report"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full mis-input"
                    rows={2}
                    placeholder="Brief description of this template"
                  />
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4 mb-4">
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>Sections & Fields</h4>
                {sections.map((section, sIdx) => (
                  <div key={sIdx} className="p-3 rounded border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <input
                        value={section.title}
                        onChange={(e) => updateSection(sIdx, 'title', e.target.value)}
                        className="flex-1 px-2 py-1 rounded text-sm"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)' }}
                      />
                      <button
                        onClick={() => removeSection(sIdx)}
                        className="ml-2 p-1 text-danger hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Fields in section */}
                    <div className="ml-3 space-y-2">
                      {section.fields.map((field, fIdx) => (
                        <div key={fIdx} className="flex gap-2 items-end text-sm">
                          <input
                            value={field.label}
                            onChange={(e) => updateField(sIdx, fIdx, 'label', e.target.value)}
                            className="flex-1 px-2 py-1 rounded text-xs"
                            placeholder="Field label"
                            style={{ background: 'var(--bg-input)' }}
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateField(sIdx, fIdx, 'type', e.target.value)}
                            className="px-2 py-1 rounded text-xs"
                            style={{ background: 'var(--bg-input)' }}
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="number">Number</option>
                            <option value="select">Select</option>
                          </select>
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(sIdx, fIdx, 'required', e.target.checked)}
                              className="w-3 h-3"
                            />
                            Required
                          </label>
                          <button
                            onClick={() => removeFieldFromSection(sIdx, fIdx)}
                            className="p-1 text-danger hover:text-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addFieldToSection(sIdx)}
                        className="mt-2 px-2 py-1 bg-selected text-primary rounded text-xs hover:bg-subtle flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Field
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addSection}
                  className="px-3 py-2 bg-selected text-primary rounded text-sm hover:bg-subtle flex items-center gap-1"
                >
                  <Plus size={16} /> Add Section
                </button>
                <button
                  onClick={saveTemplate}
                  className="px-4 py-2 bg-success text-primary rounded font-medium hover:bg-success"
                >
                  Save Template
                </button>
                {editingTemplateId && (
                  <button
                    onClick={() => {
                      setEditingTemplateId(null);
                      setName('');
                      setDescription('');
                      setSections(DEFAULT_SECTIONS);
                    }}
                    className="px-4 py-2 bg-selected text-primary rounded font-medium hover:bg-subtle"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Templates List */}
          <div className="col-span-1">
            <div className="rounded-lg p-6 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Saved Templates</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No templates yet</p>
                ) : (
                  templates.map((t) => (
                    <div key={t.id} className="p-2 rounded border" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)' }}>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.description}</p>
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => editTemplate(t)}
                          className="flex-1 px-2 py-1 bg-accent text-primary rounded text-xs hover:bg-accent flex items-center justify-center gap-1"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="flex-1 px-2 py-1 bg-danger text-primary rounded text-xs hover:bg-danger flex items-center justify-center gap-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'bulk' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-lg p-6 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Bulk Daily Report Send</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Review all saved reports for the selected date and send PDF links to guardian WhatsApp numbers.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Report Date
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="ml-2 px-2 py-1 rounded text-sm mis-input"
                    style={{ minWidth: '180px' }}
                  />
                </label>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="bulkSendMode"
                      value="twilio"
                      checked={bulkSendMode === 'twilio'}
                      onChange={() => setBulkSendMode('twilio')}
                      className="accent-[var(--accent)]"
                    />
                    Use Twilio
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="bulkSendMode"
                      value="link"
                      checked={bulkSendMode === 'link'}
                      onChange={() => setBulkSendMode('link')}
                      className="accent-[var(--accent)]"
                    />
                    Send download link
                  </label>
                </div>
                <button
                  onClick={sendBulkReports}
                  disabled={bulkSending || dailyReports.length === 0}
                  className="px-4 py-2 bg-success text-primary rounded font-medium hover:bg-success disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {bulkSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>

            {bulkResult && (
              <div className="rounded-lg p-4 mb-4 bg-subtle border border-default" style={{ color: 'var(--text-primary)' }}>
                <p className="font-medium">Bulk send result</p>
                <p className="text-sm">Sent: {bulkResult.details.filter((d) => d.status === 'sent').length}</p>
                <p className="text-sm">Failed: {bulkResult.details.filter((d) => d.status === 'failed').length}</p>
                <p className="text-sm">Skipped: {bulkResult.details.filter((d) => d.status === 'skipped').length}</p>
              </div>
            )}

            {bulkLoadError && (
              <div className="rounded-lg p-4 mb-4 bg-danger-soft border border-danger text-sm" style={{ color: 'var(--text-primary)' }}>
                {bulkLoadError}
              </div>
            )}

            {bulkWhatsAppLinks.length > 0 && (
              <div className="rounded-lg p-4 mb-4 bg-surface border border-default">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>WhatsApp Links Ready</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {bulkWhatsAppLinks.length} recipients ready. Click a link to open WhatsApp for that guardian.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = bulkWhatsAppLinks.map((item) => `${item.student_name || 'Student'}: ${item.url}`).join('\n');
                        await navigator.clipboard.writeText(text);
                        toast.success('Copied all links to clipboard');
                      } catch (copyErr) {
                        console.error('Failed to copy links', copyErr);
                        toast.error('Unable to copy links');
                      }
                    }}
                    className="px-3 py-2 bg-subtle text-primary rounded hover:bg-selected text-sm"
                  >
                    Copy all links
                  </button>
                </div>
                <div className="grid gap-2">
                  {bulkWhatsAppLinks.map((item) => (
                    <a
                      key={item.report_id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-lg border border-default px-4 py-3 bg-subtle hover:bg-subtle"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.student_name || 'Student'}</p>
                          <p className="text-xs text-muted">{item.to}</p>
                        </div>
                        <span className="text-xs text-accent">Open WhatsApp</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full text-left divide-y divide-slate-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Student</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Guardian</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Contact</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Class / Section</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">PDF</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Status</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {dailyReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-sm text-muted text-center">
                        No reports saved for this date.
                      </td>
                    </tr>
                  ) : (
                    dailyReports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-4 py-3 text-sm text-primary">{report.student_name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-primary">{report.guardian_name || 'Guardian'}</td>
                        <td className="px-4 py-3 text-sm text-primary">{report.guardian_phone || report.phone_no || 'No contact'}</td>
                        <td className="px-4 py-3 text-sm text-primary">
                          {report.class_name || 'N/A'} / {report.section_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {report.pdf_url ? (
                            <a
                              href={report.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:text-accent"
                            >
                              View PDF
                            </a>
                          ) : (
                            <span className="text-muted">No PDF</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-primary">
                          {report.sent ? 'Sent' : 'Pending'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => deleteBulkReport(report.id)}
                            className="px-2 py-1 bg-danger text-primary rounded text-xs hover:bg-danger flex items-center gap-1"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INSERT & SEND TAB */}
      {tab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List (Grouped by Class/Section) */}
          <div className="lg:col-span-2">
            <div className="rounded-lg p-6 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Students by Class/Section</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(studentsByClassSection).map(([key, classStudents]) => (
                  <div key={key} className="border rounded p-3" style={{ borderColor: 'var(--border-default)' }}>
                    <p className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>📚 {key}</p>
                    <div className="space-y-2">
                      {classStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 rounded border"
                          style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-default)' }}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {student.full_name}
                            </p>
                            <div className="text-xs mt-1 space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                              <p>👨‍👩‍👧 Guardian: {student.guardian_name || 'N/A'}</p>
                              <p>📱 Contact: {student.guardian_phone || student.phone_no || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {templates.map((template) => (
                              <button
                                key={template.id}
                                onClick={() => handleStudentReportClick(student, template)}
                                className="px-2 py-1 bg-accent text-primary rounded text-xs hover:bg-accent"
                                title={`Set Report using ${template.name}`}
                              >
                                Set Report
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Report Form / Send Panel */}
          {selectedStudent && selectedTemplate ? (
            <div className="lg:col-span-1">
              <div className="rounded-lg p-6 border sticky top-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    📝 {selectedStudent.full_name}
                  </h3>
                  <button onClick={closeReportForm} className="p-1 hover:bg-subtle rounded">
                    <X size={18} />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {selectedTemplate.template?.sections?.map((section, sIdx) => (
                    <div key={sIdx}>
                      <p className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{section.title}</p>
                      {section.fields.map((field, fIdx) => (
                        <div key={fIdx} className="mb-2">
                          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                            {field.label} {field.required && <span className="text-danger">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              value={reportFormData[sIdx]?.[fIdx] || ''}
                              onChange={(e) => handleFieldChange(sIdx, fIdx, e.target.value)}
                              className="w-full mis-input text-xs"
                              rows={2}
                              required={field.required}
                            />
                          ) : field.type === 'select' ? (
                            <select
                              value={reportFormData[sIdx]?.[fIdx] || ''}
                              onChange={(e) => handleFieldChange(sIdx, fIdx, e.target.value)}
                              className="w-full mis-input text-xs"
                              required={field.required}
                            >
                              <option value="">-- Select --</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={reportFormData[sIdx]?.[fIdx] || ''}
                              onChange={(e) => handleFieldChange(sIdx, fIdx, e.target.value)}
                              className="w-full mis-input text-xs"
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Save & Send */}
                {!savedReportId ? (
                  <button
                    onClick={saveReport}
                    disabled={isSaving}
                    className="w-full px-3 py-2 bg-success text-primary rounded font-medium hover:bg-success disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : '💾 Save Report'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-success text-center">✓ Report Saved</p>
                    <button
                      onClick={() => setSendMethod('whatsapp')}
                      className="w-full px-3 py-2 bg-success text-primary rounded font-medium hover:bg-success flex items-center justify-center gap-2"
                    >
                      <Send size={16} /> Send via WhatsApp
                    </button>
                    <button
                      onClick={() => setSendMethod('email')}
                      className="w-full px-3 py-2 bg-accent text-primary rounded font-medium hover:bg-accent flex items-center justify-center gap-2"
                    >
                      <Send size={16} /> Send via Email
                    </button>

                    {sendMethod && (
                      <div className="mt-3 p-3 rounded bg-subtle border" style={{ borderColor: 'var(--border-default)' }}>
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                          Ready to send via {sendMethod === 'whatsapp' ? '📱 WhatsApp' : '📧 Email'}
                        </p>
                        <button
                          onClick={() => sendReport(sendMethod)}
                          className="w-full px-3 py-2 bg-accent text-primary rounded text-sm hover:bg-accent"
                        >
                          Confirm & Send
                        </button>
                      </div>
                    )}

                    <button
                      onClick={closeReportForm}
                      className="w-full px-3 py-2 bg-selected text-primary rounded text-sm hover:bg-subtle"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1">
              <div className="rounded-lg p-6 border text-center" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Select a student and click "Set Report" to begin</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyReportPage;
