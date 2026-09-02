import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Download,
  Upload,
  X,
  Check,
  Edit2,
  Settings,
  Grid3x3,
  ChevronDown,
  Zap,
  Tag,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

// API imports
import {
  getMonths,
  createMonth,
  updateMonth,
  deleteMonth,
  getDayTypes,
  createDayType,
  deleteDayType,
  updateDayType,
  getYears,
  createYear,
  deleteYear,
  updateYear,
  getDayCategories,
  createDayCategory,
  deleteDayCategory,
  getCalendarDays,
  getCalendarDaysByYear,
  assignDayType,
  assignByWeekday,
  bulkAssignDayTypes,
  generateCalendarDays,
  refreshYearlyStats,
} from "../../api/calendarApi";

// Utils
import { BS_MONTHS } from "../../utils/bsCalendar";
import { dayColor } from "../../utils/calendarStyles";
import { useSettings } from "../../context/SettingsContext";
import UniversalDatePicker from "../common/UniversalDatePicker";

const AD_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// ============================================================================
// INLINE STYLES
// ============================================================================
const styles = `
.cal-root {
  --bg: #0a0f1c;
  --surface: #101826;
  --surface-2: #141d2e;
  --surface-hover: #1a2540;
  --border: #1e2d45;
  --border-soft: #162035;
  --text: #e8edf5;
  --text-dim: #8899bb;
  --text-faint: #4a5878;
  --accent: #6366f1;
  --accent-2: #818cf8;
  --danger: #f43f5e;
  --danger-bg: rgba(244,63,94,0.1);
  --success: #10b981;
  --success-bg: rgba(16,185,129,0.1);
  --warning: #f59e0b;

  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, sans-serif;
  padding: 0;
  border-radius: 0;
  position: relative;
}

.cal-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding: 24px 28px 0;
  flex-wrap: wrap;
}

.cal-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
  color: var(--text);
}

.cal-subtitle {
  font-size: 13px;
  color: var(--text-dim);
  margin: 0;
  line-height: 1.5;
}

.cal-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cal-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease, opacity .15s ease;
  white-space: nowrap;
}
.cal-btn:hover:not(:disabled) { background: var(--surface-hover); border-color: #2a3d5e; }
.cal-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.cal-btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
.cal-btn-primary:hover:not(:disabled) { background: #5558e8; border-color: #5558e8; }

.cal-btn-success {
  background: rgba(16,185,129,0.15);
  border-color: rgba(16,185,129,0.4);
  color: var(--success);
}
.cal-btn-success:hover:not(:disabled) { background: rgba(16,185,129,0.25); }

.cal-btn-danger {
  background: transparent;
  border-color: var(--border);
  color: var(--danger);
}
.cal-btn-danger:hover:not(:disabled) { background: var(--danger-bg); border-color: var(--danger); }

.cal-btn-subtle { background: var(--surface-2); }

.cal-segmented {
  display: flex;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}
.cal-seg-btn {
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: background .15s ease, color .15s ease;
}
.cal-seg-btn.is-active { background: var(--accent); color: white; }
.cal-seg-btn:hover:not(.is-active) { color: var(--text); }

.cal-tabs {
  display: flex;
  gap: 2px;
  background: var(--surface-2);
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
  padding: 6px 28px;
  margin-bottom: 24px;
}
.cal-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: background .15s ease, color .15s ease;
}
.cal-tab.is-active { background: var(--accent); color: white; }
.cal-tab:hover:not(.is-active) { color: var(--text); background: rgba(255,255,255,0.04); }

.cal-body { padding: 0 28px 28px; }

.cal-collapsible {
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
  background: var(--surface);
  transition: border-color .15s ease;
}
.cal-collapsible:hover { border-color: var(--border); }
.cal-collapsible-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text);
  font-family: inherit;
}
.cal-collapsible-head:hover { background: rgba(255,255,255,0.025); }
.cal-collapsible-head-left { display: flex; align-items: center; gap: 10px; }
.cal-collapsible-title { font-size: 13.5px; font-weight: 600; }
.cal-collapsible-chevron {
  color: var(--text-faint);
  transition: transform .2s ease;
  display: flex;
}
.cal-collapsible.is-open .cal-collapsible-chevron { transform: rotate(180deg); }
.cal-collapsible-body {
  border-top: 1px solid var(--border-soft);
  padding: 16px;
  background: rgba(255,255,255,0.01);
}

.cal-field { display: flex; flex-direction: column; gap: 5px; }
.cal-field label {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.cal-input, .cal-select {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  width: 100%;
  transition: border-color .15s ease;
  color-scheme: dark;
}
.cal-input:focus, .cal-select:focus { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }
.cal-input::placeholder { color: var(--text-faint); }
.cal-select option { background: #1a2540; }

.cal-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.cal-form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.cal-form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

.cal-subform {
  background: rgba(255,255,255,0.025);
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
}
.cal-subform-title {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-faint);
  margin: 0 0 12px;
}

.cal-form-actions { display: flex; justify-content: flex-end; margin-top: 12px; gap: 8px; }

.cal-list { display: flex; flex-direction: column; gap: 6px; }
.cal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border-soft);
  border-radius: 9px;
  transition: border-color .15s ease;
}
.cal-row:hover { border-color: var(--border); }
.cal-row-main { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.cal-row-name { font-weight: 600; font-size: 13px; }
.cal-row-sub { font-size: 11px; color: var(--text-faint); margin-top: 1px; }
.cal-row-actions { display: flex; gap: 5px; flex-shrink: 0; }

.cal-empty { text-align: center; padding: 24px 10px; color: var(--text-faint); font-size: 13px; }

.cal-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; padding: 3px 8px; border-radius: 999px;
}
.cal-pill-current { background: var(--success-bg); color: var(--success); border: 1px solid rgba(16,185,129,0.3); }
.cal-pill-warning { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.3); }

.cal-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px;
  border-radius: 7px; border: 1px solid var(--border);
  background: var(--surface-2); color: var(--text-dim);
  cursor: pointer; transition: background .15s ease, color .15s ease;
  flex-shrink: 0;
}
.cal-icon-btn:hover:not(:disabled) { background: var(--surface-hover); color: var(--text); }
.cal-icon-btn.danger:hover { color: var(--danger); background: var(--danger-bg); border-color: rgba(244,63,94,0.35); }
.cal-icon-btn.success:hover { color: var(--success); background: var(--success-bg); border-color: rgba(16,185,129,0.35); }

.cal-checkbox-field { display: flex; align-items: center; gap: 8px; }
.cal-checkbox-field input { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
.cal-checkbox-field span { font-size: 12.5px; color: var(--text-dim); }

.cal-panel {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}
.cal-panel-title { font-size: 12px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 12px; }

.cal-card-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.cal-card-icon {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
  display: flex; align-items: center; justify-content: center;
  color: var(--accent-2); flex-shrink: 0;
}
.cal-card-title { font-size: 14px; font-weight: 600; margin: 0; }
.cal-card-subtitle { font-size: 12px; color: var(--text-dim); margin: 2px 0 0; }

.cal-grid-wrap {
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  overflow: hidden;
  background: var(--border-soft);
  margin-bottom: 16px;
}
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border-soft);
}
.cal-weekday {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  padding: 10px 0;
}
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border-soft); }

.cal-cell {
  position: relative;
  min-height: 72px;
  background: var(--surface);
  border: none;
  border-left: 3px solid transparent;
  padding: 7px 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  text-align: left;
  transition: background .12s ease;
  font-family: inherit;
  color: inherit;
  width: 100%;
}
.cal-cell:hover:not(.is-disabled) { background: var(--surface-hover); }
.cal-cell.has-type { border-left-color: var(--tc); background: linear-gradient(90deg, var(--tb), transparent 60%); }
.cal-cell.is-selected { box-shadow: inset 0 0 0 2px var(--accent-2); }

.cal-cell-top { display: flex; align-items: flex-start; justify-content: space-between; width: 100%; }
.cal-cell-primary { font-size: 15px; font-weight: 700; line-height: 1; }
.cal-cell-badge { font-size: 9.5px; font-weight: 700; color: var(--tc); text-transform: uppercase; letter-spacing: 0.02em; }
.cal-cell-check {
  width: 14px; height: 14px;
  border-radius: 4px;
  border: 1.5px solid var(--border);
  background: var(--surface-2);
  flex-shrink: 0;
}
.cal-cell.is-selected .cal-cell-check { background: var(--accent); border-color: var(--accent); }
.cal-cell-clear {
  position: absolute; top: -5px; right: -5px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--danger); color: white;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .15s ease;
  border: 2px solid var(--surface); cursor: pointer; padding: 0;
}
.cal-cell:hover .cal-cell-clear { opacity: 1; }

.cal-bulkbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 10px 14px;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.3);
  border-radius: 10px; flex-wrap: wrap;
  margin-top: 12px;
}
.cal-bulkbar-count { font-size: 13px; font-weight: 600; }
.cal-bulkbar-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.cal-grid-controls-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.cal-weekday-rule {
  margin-top: 16px; padding-top: 16px;
  border-top: 1px solid var(--border-soft);
}
.cal-weekday-rule-title {
  font-size: 10.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  color: var(--text-faint); margin-bottom: 10px;
}

.cal-io-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.cal-dropzone {
  border: 2px dashed var(--border);
  border-radius: 10px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease;
}
.cal-dropzone:hover { border-color: var(--accent); background: rgba(99,102,241,0.05); }
.cal-dropzone input { display: none; }

.cal-chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 500;
  background: var(--surface-2); border: 1px solid var(--border);
  padding: 5px 8px 5px 11px; border-radius: 999px;
}
.cal-chip button {
  background: none; border: none; color: var(--text-faint);
  cursor: pointer; display: flex; padding: 2px; border-radius: 50%;
}
.cal-chip button:hover { color: var(--danger); background: var(--danger-bg); }
.cal-chip-row { display: flex; flex-wrap: wrap; gap: 7px; }

.cal-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(4,7,16,0.7);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 60;
  animation: fadeIn .15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.cal-modal {
  width: 440px; max-width: 94vw;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  max-height: 88vh; overflow-y: auto;
  animation: slideUp .15s ease;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.cal-modal-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
}
.cal-modal-title { font-size: 16px; font-weight: 700; margin: 0; }
.cal-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }

.cal-stat-row {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px; margin-bottom: 20px; padding: 0 28px;
}
.cal-stat-card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex; align-items: center; gap: 10px;
  position: relative;
  overflow: hidden;
  transition: border-color .15s ease;
}
.cal-stat-card:hover { border-color: var(--border); }
.cal-stat-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cal-stat-num { font-size: 20px; font-weight: 800; line-height: 1; }
.cal-stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); margin-top: 2px; }

.cal-info-bar {
  display: flex; align-items: center; gap: 8px;
  background: rgba(99,102,241,0.07);
  border: 1px solid rgba(99,102,241,0.2);
  border-radius: 8px; padding: 9px 12px;
  font-size: 12px; color: var(--text-dim); margin-bottom: 14px;
}

.cal-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700;
  padding: 2px 7px; border-radius: 5px;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.cal-badge-purple { background: rgba(99,102,241,0.15); color: var(--accent-2); }
.cal-badge-green { background: var(--success-bg); color: var(--success); }

.cal-scope-row { display: flex; gap: 6px; margin-bottom: 10px; }
.cal-scope-btn {
  font-size: 11px; font-weight: 700;
  padding: 5px 11px; border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface-2); color: var(--text-dim);
  cursor: pointer; letter-spacing: 0.03em;
  transition: all .15s ease;
}
.cal-scope-btn.is-active {
  background: rgba(99,102,241,0.2);
  border-color: rgba(99,102,241,0.5);
  color: var(--accent-2);
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-fade { 0%,100% { opacity: 1; } 50% { opacity: .5; } }

@media (max-width: 760px) {
  .cal-page-header, .cal-body { padding-left: 16px; padding-right: 16px; }
  .cal-tabs { padding-left: 16px; padding-right: 16px; }
  .cal-stat-row { padding: 0 16px; grid-template-columns: repeat(3, 1fr); }
  .cal-form-grid, .cal-form-grid-3, .cal-form-grid-4 { grid-template-columns: 1fr; }
  .cal-grid-controls-row { grid-template-columns: 1fr; }
  .cal-io-grid { grid-template-columns: 1fr; }
  .cal-cell { min-height: 56px; padding: 5px 6px; }
}
`;

// ============================================================================
// REACT COMPONENT
// ============================================================================
const CalendarSettings = () => {
  const { settings, updateSetting } = useSettings();
  const calendarType = settings.calendar_type || "BS";

  const [activeTab, setActiveTab] = useState("setup");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data state
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [dayTypes, setDayTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [calDays, setCalDays] = useState([]);
  const [yearStats, setYearStats] = useState(null);

  // Form state
  const [newYear, setNewYear] = useState({
    year_label: "", year_label_AD: "", year_label_BS: "",
    is_current: false, start_date_AD: "", end_date_AD: "",
  });
  const [newMonth, setNewMonth] = useState({
    year_id: "", bs_month_index: 1,
    start_date: "", end_date: "", month_name: "",
  });
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeCategoryId, setNewTypeCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Grid state
  const [gridYearId, setGridYearId] = useState("");
  const [gridMonthId, setGridMonthId] = useState("");
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkTypeId, setBulkTypeId] = useState("");
  const [weekdayRule, setWeekdayRule] = useState({ dayTypeId: "", weekday: "", scope: "month" });

  // Edit modals
  const [editYear, setEditYear] = useState(null);
  const [editMonth, setEditMonth] = useState(null);
  const [editDayType, setEditDayType] = useState(null);

  // IO state
  const [exportYearId, setExportYearId] = useState("");
  const [exportMonthId, setExportMonthId] = useState("");
  const importRef = useRef(null);

  // UI state
  const [openSections, setOpenSections] = useState({
    years: true, months: false, categories: false, types: false,
  });

  // Load all data
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [yearRes, monthRes, typeRes, catRes] = await Promise.all([
        getYears(), getMonths(), getDayTypes(), getDayCategories(),
      ]);
      const ys = yearRes.data?.data || [];
      setYears(ys);
      setMonths(monthRes.data?.data || []);
      setDayTypes(typeRes.data?.data || []);
      setCategories(catRes.data?.data || []);

      const current = ys.find((y) => y.is_current);
      if (current && !gridYearId) setGridYearId(current.id);
      if (!exportYearId && ys.length) setExportYearId(ys[0].id);
    } catch (e) {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [gridYearId, exportYearId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Fetch calendar days
  const fetchGridDays = useCallback(async () => {
    if (!gridMonthId) { setCalDays([]); return; }
    setBusy(true);
    try {
      const res = await getCalendarDays(gridMonthId, calendarType);
      setCalDays(res.data?.data || []);
    } catch (e) {
      toast.error("Failed to load calendar days");
    } finally {
      setBusy(false);
    }
  }, [gridMonthId, calendarType]);

  useEffect(() => { fetchGridDays(); }, [fetchGridDays]);

  // Fetch year stats
  const fetchYearStats = useCallback(async (yearId) => {
    if (!yearId) { setYearStats(null); return; }
    try {
      const res = await getCalendarDaysByYear(yearId);
      const days = res.data?.data || [];
      const total = days.length;
      const assigned = days.filter((d) => d.day_type_id).length;
      const unassigned = total - assigned;
      setYearStats({ total, assigned, unassigned });
    } catch (_) { setYearStats(null); }
  }, []);

  useEffect(() => { if (gridYearId) fetchYearStats(gridYearId); }, [gridYearId, fetchYearStats]);

  // ── Handlers ──
  const handleAddYear = async () => {
    if (!newYear.year_label) return toast.error("Enter year label");
    setBusy(true);
    try {
      await createYear(newYear);
      toast.success("Year added");
      setNewYear({ year_label: "", year_label_AD: "", year_label_BS: "", is_current: false, start_date_AD: "", end_date_AD: "" });
      await loadAll();
    } catch (e) { toast.error("Failed to add year"); }
    finally { setBusy(false); }
  };

  const handleUpdateYear = async () => {
    if (!editYear) return;
    setBusy(true);
    try {
      await updateYear(editYear.id, editYear);
      toast.success("Year updated");
      setEditYear(null);
      await loadAll();
    } catch (e) { toast.error("Failed to update year"); }
    finally { setBusy(false); }
  };

  const handleDeleteYear = async (id, label) => {
    if (!window.confirm(`Delete year "${label}"? All months and day data will be removed.`)) return;
    setBusy(true);
    try {
      await deleteYear(id);
      toast.success("Year deleted");
      if (gridYearId === id) { setGridYearId(""); setGridMonthId(""); }
      await loadAll();
    } catch (e) { toast.error("Failed to delete year"); }
    finally { setBusy(false); }
  };

  const handleAddMonth = async () => {
    if (!newMonth.year_id) return toast.error("Select a year");
    if (!newMonth.month_name) return toast.error("Enter month name");
    setBusy(true);
    try {
      await createMonth({ ...newMonth, date_format: calendarType, bs_month_index: parseInt(newMonth.bs_month_index) });
      toast.success("Month added");
      setNewMonth({ year_id: newMonth.year_id, bs_month_index: 1, start_date: "", end_date: "", month_name: "" });
      await loadAll();
    } catch (e) { toast.error("Failed to add month"); }
    finally { setBusy(false); }
  };

  const handleDeleteMonth = async (id) => {
    if (!window.confirm("Delete this month and all its day data?")) return;
    setBusy(true);
    try {
      await deleteMonth(id);
      toast.success("Month deleted");
      if (gridMonthId === id) { setGridMonthId(""); setCalDays([]); }
      await loadAll();
    } catch (e) { toast.error("Failed to delete month"); }
    finally { setBusy(false); }
  };

  const handleUpdateMonth = async () => {
    if (!editMonth) return;
    setBusy(true);
    try {
      await updateMonth(editMonth.id, {
        month_name: editMonth.month_name,
        start_date: editMonth.start_date || editMonth.month_start_date_AD,
        end_date: editMonth.end_date || editMonth.month_end_date_AD,
        bs_month_index: editMonth.bs_month_index,
        date_format: calendarType,
      });
      toast.success("Month updated");
      setEditMonth(null);
      await loadAll();
      if (gridMonthId === editMonth.id) fetchGridDays();
    } catch (e) { toast.error("Failed to update month"); }
    finally { setBusy(false); }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setBusy(true);
    try {
      await createDayCategory({ category_name: newCategoryName });
      toast.success("Category added");
      setNewCategoryName("");
      await loadAll();
    } catch (e) { toast.error("Failed to add category"); }
    finally { setBusy(false); }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category? Day types linked to it will lose their category.")) return;
    setBusy(true);
    try {
      await deleteDayCategory(id);
      toast.success("Category deleted");
      await loadAll();
    } catch (e) { toast.error("Failed to delete category"); }
    finally { setBusy(false); }
  };

  const handleAddDayType = async () => {
    if (!newTypeName.trim()) return toast.error("Enter type name");
    setBusy(true);
    try {
      await createDayType({ day_type: newTypeName, category_id: newTypeCategoryId || null });
      toast.success("Day type added");
      setNewTypeName(""); setNewTypeCategoryId("");
      await loadAll();
    } catch (e) { toast.error("Failed to add day type"); }
    finally { setBusy(false); }
  };

  const handleUpdateDayType = async () => {
    if (!editDayType) return;
    setBusy(true);
    try {
      await updateDayType(editDayType.id, {
        day_type: editDayType.day_type,
        category_id: editDayType.category_id || null,
      });
      toast.success("Day type updated");
      setEditDayType(null);
      await loadAll();
    } catch (e) { toast.error("Failed to update day type"); }
    finally { setBusy(false); }
  };

  const handleDeleteDayType = async (id) => {
    if (!window.confirm("Delete this day type? All calendar days using it will be unassigned.")) return;
    setBusy(true);
    try {
      await deleteDayType(id);
      toast.success("Day type deleted");
      await loadAll();
      await fetchGridDays();
    } catch (e) { toast.error("Failed to delete day type"); }
    finally { setBusy(false); }
  };

  const monthsForYear = (yearId) => months.filter((m) => m.year_id === yearId);

  // ── Grid handlers ──
  const handleGenerateDays = async () => {
    if (!gridMonthId) return toast.error("Select a month first");
    if (!window.confirm("Generate calendar days for this month? Existing day assignments will be preserved.")) return;
    setBusy(true);
    try {
      const res = await generateCalendarDays(gridMonthId);
      const count = res.data?.data?.length || 0;
      toast.success(`Generated ${count} calendar days`);
      await fetchGridDays();
    } catch (e) {
      const msg = e?.response?.data?.error || "Failed to generate calendar days";
      toast.error(msg);
    } finally { setBusy(false); }
  };

  const handleRefreshStats = async () => {
    if (!gridYearId) return toast.error("Select a year first");
    setBusy(true);
    try {
      await refreshYearlyStats(gridYearId);
      toast.success("Year stats refreshed");
      await fetchYearStats(gridYearId);
    } catch (e) { toast.error("Failed to refresh stats"); }
    finally { setBusy(false); }
  };

  const handleBulkAssign = async (clearMode = false) => {
    if (!gridMonthId) return toast.error("Select a month");
    if (!clearMode && !bulkTypeId) return toast.error("Select a day type");
    if (bulkSelected.size === 0) return toast.error("Select days first");
    setBusy(true);
    try {
      const assignments = Array.from(bulkSelected).map((dayId) => ({
        calendarDayId: dayId,
        dayTypeId: clearMode ? null : bulkTypeId,
      }));
      await bulkAssignDayTypes(assignments);
      toast.success(`${assignments.length} day(s) ${clearMode ? "cleared" : "assigned"}`);
      setBulkSelected(new Set());
      setBulkTypeId("");
      await fetchGridDays();
    } catch (e) { toast.error("Bulk assignment failed"); }
    finally { setBusy(false); }
  };

  const handleQuickClear = async (id) => {
    setBusy(true);
    try {
      await assignDayType(id, null);
      await fetchGridDays();
    } catch (e) { toast.error("Clear failed"); }
    finally { setBusy(false); }
  };

  const handleAssignByWeekday = async () => {
    if (!weekdayRule.dayTypeId || weekdayRule.weekday === "") {
      return toast.error("Select day type and weekday");
    }
    setBusy(true);
    try {
      const weekdayName = WEEKDAYS_FULL[parseInt(weekdayRule.weekday)];
      const payload = { day_of_week: weekdayName, day_type_id: weekdayRule.dayTypeId };
      if (weekdayRule.scope === "month" && gridMonthId) {
        payload.month_id = gridMonthId;
      } else if (weekdayRule.scope === "year" && gridYearId) {
        payload.year_id = gridYearId;
      } else {
        setBusy(false);
        return toast.error("Select a year or month first");
      }
      const response = await assignByWeekday(payload);
      const count = response?.data?.count || 0;
      toast.success(`Assigned to ${count} ${weekdayName}(s)`);
      setWeekdayRule({ dayTypeId: "", weekday: "", scope: weekdayRule.scope });
      await fetchGridDays();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Weekday assignment failed");
    } finally { setBusy(false); }
  };

  // ── Import / Export ──
  const handleExportCSV = async () => {
    if (!exportMonthId) return toast.error("Select a month to export");
    setBusy(true);
    try {
      const res = await getCalendarDays(exportMonthId, calendarType);
      const days = res.data?.data || [];
      if (days.length === 0) { toast.error("No calendar days found for this month"); return; }

      const selectedMonth = months.find((m) => m.id === exportMonthId);
      const headers = ["Day Number", "Day of Week", "Day Type", "Category"];
      const rows = days.map((d) => [
        d.day_number,
        d.day_of_week || "",
        d.day_type || "Unassigned",
        d.category_name || "N/A",
      ]);

      const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `calendar_${selectedMonth?.month_name || exportMonthId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${days.length} days`);
    } catch (e) { toast.error("Export failed"); }
    finally { setBusy(false); }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!gridMonthId) { toast.error("Select a month in Day Assignments tab first"); return; }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split("\n").slice(1); // skip header
        const assignments = [];
        for (const line of lines) {
          if (!line.trim()) continue;
          const cols = line.split(",").map((c) => c.replace(/"/g, "").trim());
          const dayNum = parseInt(cols[0]);
          const typeName = cols[2];
          if (!typeName || typeName === "Unassigned") continue;
          const typeObj = dayTypes.find((t) => t.day_type.toLowerCase() === typeName.toLowerCase());
          const dayObj = calDays.find((d) => d.day_number === dayNum);
          if (typeObj && dayObj) assignments.push({ calendarDayId: dayObj.id, dayTypeId: typeObj.id });
        }
        if (assignments.length === 0) { toast.error("No valid assignments found in CSV"); return; }
        setBusy(true);
        await bulkAssignDayTypes(assignments);
        toast.success(`Imported ${assignments.length} assignments`);
        await fetchGridDays();
      } catch (err) {
        toast.error("Failed to parse CSV");
      } finally {
        setBusy(false);
        if (importRef.current) importRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // ── Computed ──
  const exportMonthsForYear = useMemo(
    () => months.filter((m) => m.year_id === exportYearId),
    [months, exportYearId]
  );

  if (loading) {
    return (
      <div className="cal-root" style={{ padding: "60px 28px" }}>
        <style>{styles}</style>
        <div className="cal-empty">
          <Loader2 size={32} style={{ margin: "0 auto 12px", color: "var(--accent)", animation: "spin 1s linear infinite" }} />
          <p>Loading calendar settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cal-root">
      <style>{styles}</style>

      {/* ── Header ── */}
      <div className="cal-page-header">
        <div>
          <h1 className="cal-title">Calendar Settings</h1>
          <p className="cal-subtitle">
            Manage academic years, months, day categories and day classification rules.
          </p>
        </div>
        <div className="cal-header-actions">
          <div className="cal-segmented">
            {["BS", "AD"].map((k) => (
              <button
                key={k}
                className={clsx("cal-seg-btn", calendarType === k && "is-active")}
                onClick={() => updateSetting("calendar_type", k)}
              >
                {k}
              </button>
            ))}
          </div>
          <button className="cal-btn cal-btn-subtle" onClick={loadAll} disabled={busy}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Year Stats Bar ── */}
      {yearStats && (
        <div className="cal-stat-row">
          <div className="cal-stat-card">
            <div className="cal-stat-icon" style={{ background: "rgba(99,102,241,0.12)" }}>
              <Calendar size={16} style={{ color: "var(--accent-2)" }} />
            </div>
            <div>
              <div className="cal-stat-num">{yearStats.total}</div>
              <div className="cal-stat-label">Total Days</div>
            </div>
          </div>
          <div className="cal-stat-card">
            <div className="cal-stat-icon" style={{ background: "var(--success-bg)" }}>
              <Check size={16} style={{ color: "var(--success)" }} />
            </div>
            <div>
              <div className="cal-stat-num">{yearStats.assigned}</div>
              <div className="cal-stat-label">Assigned</div>
            </div>
          </div>
          <div className="cal-stat-card">
            <div className="cal-stat-icon" style={{ background: "rgba(245,158,11,0.1)" }}>
              <AlertCircle size={16} style={{ color: "var(--warning)" }} />
            </div>
            <div>
              <div className="cal-stat-num">{yearStats.unassigned}</div>
              <div className="cal-stat-label">Unassigned</div>
            </div>
          </div>
          {yearStats.total > 0 && (
            <div className="cal-stat-card" style={{ gridColumn: "span 1" }}>
              <div className="cal-stat-icon" style={{ background: "rgba(16,185,129,0.08)" }}>
                <Check size={16} style={{ color: "var(--success)" }} />
              </div>
              <div>
                <div className="cal-stat-num" style={{ fontSize: 17 }}>
                  {Math.round((yearStats.assigned / yearStats.total) * 100)}%
                </div>
                <div className="cal-stat-label">Coverage</div>
              </div>
              {/* Coverage bar */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: 3, background: "var(--border-soft)", borderRadius: "0 0 10px 10px"
              }}>
                <div style={{
                  height: "100%",
                  width: `${Math.round((yearStats.assigned / yearStats.total) * 100)}%`,
                  background: "var(--success)",
                  borderRadius: "0 0 10px 10px",
                  transition: "width .4s ease",
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="cal-tabs">
        {[
          { id: "setup", label: "Setup & Configuration", icon: Settings },
          { id: "grid", label: "Day Assignments", icon: Grid3x3 },
          { id: "io", label: "Import / Export", icon: FileSpreadsheet },
        ].map((tab) => (
          <button
            key={tab.id}
            className={clsx("cal-tab", activeTab === tab.id && "is-active")}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
        {busy && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-faint)" }}>
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
            Processing…
          </div>
        )}
      </div>

      <div className="cal-body">

        {/* ══ SETUP TAB ══ */}
        {activeTab === "setup" && (
          <div>
            {/* Academic Years */}
            <CollapsibleSection
              isOpen={openSections.years}
              onToggle={() => setOpenSections((p) => ({ ...p, years: !p.years }))}
              icon={Calendar}
              title="Academic Years"
              badge={years.length}
            >
                                          <div className="cal-subform">
                <p className="cal-subform-title">Add New Month</p>
                <div className="cal-form-grid">
                  <div className="cal-field">
                    <label>Academic Year</label>
                    <select className="cal-select" value={newMonth.year_id}
                      onChange={(e) => setNewMonth({ ...newMonth, year_id: e.target.value })}>
                      <option value="">Select year…</option>
                      {years.map((y) => (
                        <option key={y.id} value={y.id}>{y.year_label_BS || y.year_label_AD || y.year_label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cal-field">
                    <label>Month Name</label>
                    <input className="cal-input" placeholder="e.g., Shrawan" value={newMonth.month_name}
                      onChange={(e) => setNewMonth({ ...newMonth, month_name: e.target.value })} />
                  </div>
                  <div className="cal-field">
                    <label>{calendarType === "BS" ? "BS Month Index" : "Month"}</label>
                    <select className="cal-select" value={newMonth.bs_month_index}
                      onChange={(e) => setNewMonth({ ...newMonth, bs_month_index: parseInt(e.target.value) })}>
                      {(calendarType === "BS" ? BS_MONTHS : AD_MONTHS).map((name, i) => (
                        <option key={name} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cal-field">
                    <label>Start Date</label>
                    <UniversalDatePicker
                      value={newMonth.start_date}
                      onChange={(val) => setNewMonth({ ...newMonth, start_date: val })}
                    />
                  </div>
                  <div className="cal-field">
                    <label>End Date</label>
                    <UniversalDatePicker
                      value={newMonth.end_date}
                      onChange={(val) => setNewMonth({ ...newMonth, end_date: val })}
                    />
                  </div>
                  <div className="cal-form-actions" style={{ alignItems: "flex-end", justifyContent: "flex-start" }}>
                    <button className="cal-btn cal-btn-primary" onClick={handleAddMonth} disabled={busy}>
                      <Plus size={13} /> Add Month
                    </button>
                  </div>
                </div>
              </div>
              <div className="cal-list">
                {months.length === 0
                  ? <div className="cal-empty">No months added yet.</div>
                  : months.map((m) => (
                    <div key={m.id} className="cal-row">
                      <div className="cal-row-main">
                        <Calendar size={16} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div className="cal-row-name">{m.month_name}</div>
                          <div className="cal-row-sub">
                            {years.find((y) => y.id === m.year_id)?.year_label_BS || ""}
                            {(m.month_start_date_AD || m.start_date) && ` · ${m.month_start_date_AD || m.start_date} → ${m.month_end_date_AD || m.end_date || "?"}`}
                          </div>
                        </div>
                      </div>
                      <div className="cal-row-actions">
                        <button className="cal-icon-btn" onClick={() => setEditMonth({ ...m })} title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button className="cal-icon-btn danger" onClick={() => handleDeleteMonth(m.id)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </CollapsibleSection>

            {/* Day Categories */}
            <CollapsibleSection
              isOpen={openSections.categories}
              onToggle={() => setOpenSections((p) => ({ ...p, categories: !p.categories }))}
              icon={Tag}
              title="Day Categories"
              badge={categories.length}
            >
              <div className="cal-info-bar">
                <AlertCircle size={14} />
                Categories group day types (e.g., "Holiday" contains "Public Holiday", "Saturday", etc.)
              </div>
              <div style={{ marginBottom: "14px", display: "flex", gap: 8 }}>
                <input className="cal-input" placeholder="Category name (e.g., Holiday)" value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
                <button className="cal-btn cal-btn-primary" onClick={handleAddCategory} disabled={busy}>
                  <Plus size={13} /> Add
                </button>
              </div>
              {categories.length === 0
                ? <div className="cal-empty">No categories yet. Add one above.</div>
                : <div className="cal-chip-row">
                  {categories.map((c) => (
                    <div key={c.id} className="cal-chip">
                      {c.category_name}
                      <button onClick={() => handleDeleteCategory(c.id)} title="Delete category"><X size={11} /></button>
                    </div>
                  ))}
                </div>
              }
            </CollapsibleSection>

            {/* Day Types */}
            <CollapsibleSection
              isOpen={openSections.types}
              onToggle={() => setOpenSections((p) => ({ ...p, types: !p.types }))}
              icon={Settings}
              title="Day Classifications"
              badge={dayTypes.length}
            >
              <div className="cal-subform">
                <p className="cal-subform-title">Add New Classification</p>
                <div className="cal-form-grid-3">
                  <div className="cal-field">
                    <label>Type Name</label>
                    <input className="cal-input" placeholder="e.g., Public Holiday" value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)} />
                  </div>
                  <div className="cal-field">
                    <label>Category</label>
                    <select className="cal-select" value={newTypeCategoryId}
                      onChange={(e) => setNewTypeCategoryId(e.target.value)}>
                      <option value="">None</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.category_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cal-form-actions" style={{ justifyContent: "flex-start", marginTop: 0, alignItems: "flex-end" }}>
                    <button className="cal-btn cal-btn-primary" onClick={handleAddDayType} disabled={busy}>
                      <Plus size={13} /> Add Type
                    </button>
                  </div>
                </div>
              </div>
              <div className="cal-list">
                {dayTypes.length === 0
                  ? <div className="cal-empty">No day types yet.</div>
                  : dayTypes.map((t) => (
                    <div key={t.id} className="cal-row">
                      <div className="cal-row-main">
                        <div style={{ flex: 1 }}>
                          <div className="cal-row-name">{t.day_type}</div>
                          {t.category_name && <div className="cal-row-sub">{t.category_name}</div>}
                        </div>
                      </div>
                      <div className="cal-row-actions">
                        <button className="cal-icon-btn" onClick={() => setEditDayType({ ...t })} title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button className="cal-icon-btn danger" onClick={() => handleDeleteDayType(t.id)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* ══ GRID TAB ══ */}
        {activeTab === "grid" && (
          <div>
            {/* Controls */}
            <div className="cal-panel">
              <p className="cal-panel-title">Select Month</p>
              <div className="cal-grid-controls-row">
                <div className="cal-field">
                  <label>Academic Year</label>
                  <select className="cal-select" value={gridYearId}
                    onChange={(e) => { setGridYearId(e.target.value); setGridMonthId(""); setCalDays([]); fetchYearStats(e.target.value); }}>
                    <option value="">Select year…</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>{y.year_label_BS || y.year_label_AD || y.year_label}</option>
                    ))}
                  </select>
                </div>
                <div className="cal-field">
                  <label>Month</label>
                  <select className="cal-select" value={gridMonthId}
                    onChange={(e) => setGridMonthId(e.target.value)}>
                    <option value="">Select month…</option>
                    {monthsForYear(gridYearId).map((m) => (
                      <option key={m.id} value={m.id}>{m.month_name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                  <button className="cal-btn cal-btn-success" onClick={handleGenerateDays} disabled={busy || !gridMonthId} title="Generate calendar day rows for this month">
                    <Zap size={13} /> Generate Days
                  </button>
                  <button className="cal-btn cal-btn-subtle" onClick={handleRefreshStats} disabled={busy || !gridYearId} title="Refresh year stats">
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>

              {/* Weekday Rule */}
              <div className="cal-weekday-rule">
                <p className="cal-weekday-rule-title">Assign by Weekday</p>
                <div className="cal-scope-row">
                  {["month", "year"].map((s) => (
                    <button key={s} className={clsx("cal-scope-btn", weekdayRule.scope === s && "is-active")}
                      onClick={() => setWeekdayRule((p) => ({ ...p, scope: s }))}>
                      {s === "month" ? "This Month" : "Whole Year"}
                    </button>
                  ))}
                </div>
                <div className="cal-grid-controls-row">
                  <div className="cal-field">
                    <label>Day Type</label>
                    <select className="cal-select" value={weekdayRule.dayTypeId}
                      onChange={(e) => setWeekdayRule((p) => ({ ...p, dayTypeId: e.target.value }))}>
                      <option value="">Select type…</option>
                      {dayTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.day_type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cal-field">
                    <label>Weekday</label>
                    <select className="cal-select" value={weekdayRule.weekday}
                      onChange={(e) => setWeekdayRule((p) => ({ ...p, weekday: e.target.value }))}>
                      <option value="">Select day…</option>
                      {WEEKDAYS_FULL.map((w, i) => (
                        <option key={w} value={i}>{w}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button className="cal-btn cal-btn-primary" onClick={handleAssignByWeekday} disabled={busy}>
                      <Check size={13} /> Apply Rule
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            {!gridMonthId
              ? (
                <div className="cal-panel" style={{ textAlign: "center", padding: "48px 20px" }}>
                  <Calendar size={40} style={{ margin: "0 auto 12px", opacity: 0.2 }} />
                  <p style={{ color: "var(--text-faint)", fontSize: 13 }}>Select a year and month to view the calendar grid</p>
                  <p style={{ color: "var(--text-faint)", fontSize: 11.5, marginTop: 4 }}>Use "Generate Days" after selecting a month if no days appear</p>
                </div>
              )
              : (
                <>
                  {calDays.length === 0
                    ? (
                      <div className="cal-panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                        <AlertCircle size={32} style={{ margin: "0 auto 10px", color: "var(--warning)" }} />
                        <p style={{ color: "var(--text-dim)", fontSize: 13, fontWeight: 600 }}>No calendar days generated yet</p>
                        <p style={{ color: "var(--text-faint)", fontSize: 12, marginTop: 4 }}>Click "Generate Days" above to create day entries for this month</p>
                      </div>
                    )
                    : (
                      <div className="cal-grid-wrap">
                        <div className="cal-weekdays">
                          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                            <div key={d} className="cal-weekday">{d}</div>
                          ))}
                        </div>
                        <div className="cal-grid">
                          {calDays.map((day) => {
                            const isSelected = bulkSelected.has(day.id);
                            const style = dayColor(day.day_type, day.category_name);
                            return (
                              <button
                                key={day.id}
                                className={clsx("cal-cell", isSelected && "is-selected", day.day_type && "has-type")}
                                onClick={() => {
                                  const next = new Set(bulkSelected);
                                  next.has(day.id) ? next.delete(day.id) : next.add(day.id);
                                  setBulkSelected(next);
                                }}
                                style={{ "--tb": style.bgColor, "--tc": style.textColor }}
                              >
                                <div className="cal-cell-top">
                                  <span className="cal-cell-primary">{day.day_number}</span>
                                  <div className="cal-cell-check" />
                                </div>
                                {day.day_type && <span className="cal-cell-badge">{day.day_type}</span>}
                                {day.day_type && (
                                  <button className="cal-cell-clear" onClick={(e) => { e.stopPropagation(); handleQuickClear(day.id); }}>
                                    <X size={9} strokeWidth={3} />
                                  </button>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  }
                  {/* Bulk bar */}
                  {bulkSelected.size > 0 && (
                    <div className="cal-bulkbar">
                      <div className="cal-bulkbar-count">
                        <strong>{bulkSelected.size}</strong> day(s) selected
                      </div>
                      <div className="cal-bulkbar-actions">
                        <select className="cal-select" style={{ width: 170 }} value={bulkTypeId}
                          onChange={(e) => setBulkTypeId(e.target.value)}>
                          <option value="">Select type…</option>
                          {dayTypes.map((t) => (
                            <option key={t.id} value={t.id}>{t.day_type}</option>
                          ))}
                        </select>
                        <button className="cal-btn cal-btn-primary" onClick={() => handleBulkAssign(false)} disabled={!bulkTypeId}>
                          Assign
                        </button>
                        <button className="cal-btn cal-btn-danger" onClick={() => handleBulkAssign(true)}>
                          Clear
                        </button>
                        <button className="cal-btn" onClick={() => setBulkSelected(new Set())}>
                          Deselect All
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )
            }
          </div>
        )}

        {/* ══ IO TAB ══ */}
        {activeTab === "io" && (
          <div className="cal-io-grid">
            {/* Export */}
            <div className="cal-panel">
              <div className="cal-card-head">
                <div className="cal-card-icon"><Download size={18} /></div>
                <div>
                  <h3 className="cal-card-title">Export Calendar</h3>
                  <p className="cal-card-subtitle">Download month data as CSV</p>
                </div>
              </div>
              <div className="cal-field" style={{ marginBottom: 10 }}>
                <label>Academic Year</label>
                <select className="cal-select" value={exportYearId}
                  onChange={(e) => { setExportYearId(e.target.value); setExportMonthId(""); }}>
                  <option value="">Select year…</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>{y.year_label_BS || y.year_label_AD || y.year_label}</option>
                  ))}
                </select>
              </div>
              <div className="cal-field" style={{ marginBottom: 14 }}>
                <label>Month</label>
                <select className="cal-select" value={exportMonthId}
                  onChange={(e) => setExportMonthId(e.target.value)}>
                  <option value="">Select month…</option>
                  {exportMonthsForYear.map((m) => (
                    <option key={m.id} value={m.id}>{m.month_name}</option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14 }}>
                Downloads a CSV file with all day numbers, weekdays, types and categories for the selected month.
              </p>
              <button className="cal-btn cal-btn-primary" onClick={handleExportCSV} disabled={busy || !exportMonthId}
                style={{ width: "100%", justifyContent: "center" }}>
                <Download size={14} /> Export CSV
              </button>
            </div>

            {/* Import */}
            <div className="cal-panel">
              <div className="cal-card-head">
                <div className="cal-card-icon"><Upload size={18} /></div>
                <div>
                  <h3 className="cal-card-title">Import Calendar</h3>
                  <p className="cal-card-subtitle">Upload CSV to update assignments</p>
                </div>
              </div>
              <div className="cal-info-bar" style={{ marginBottom: 14 }}>
                <AlertCircle size={13} />
                <span>First select a month in the <strong>Day Assignments</strong> tab — imported data applies to that month.</span>
              </div>
              {gridMonthId
                ? (
                  <div style={{ marginBottom: 14 }}>
                    <span className="cal-badge cal-badge-green">
                      <Check size={10} /> Target: {months.find((m) => m.id === gridMonthId)?.month_name || "Selected month"}
                    </span>
                  </div>
                )
                : (
                  <div style={{ marginBottom: 14 }}>
                    <span className="cal-badge cal-badge-purple">No month selected</span>
                  </div>
                )
              }
              <p style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14 }}>
                CSV format: <code style={{ background: "var(--surface-2)", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>Day Number, Day of Week, Day Type, Category</code>
                <br />Day Type must exactly match an existing classification name.
              </p>
              <input ref={importRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleImportCSV} />
              <div className="cal-dropzone" onClick={() => importRef.current?.click()}>
                <div style={{ color: "var(--accent-2)", marginBottom: 8, display: "flex", justifyContent: "center" }}>
                  <Upload size={28} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Click to select CSV file</p>
                <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 4 }}>or drag and drop</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODALS ══ */}
      {editYear && (
        <Modal onClose={() => setEditYear(null)}>
          <div className="cal-modal-header">
            <h3 className="cal-modal-title">Edit Academic Year</h3>
            <button onClick={() => setEditYear(null)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div className="cal-form-grid" style={{ gap: 10 }}>
            <div className="cal-field">
              <label>System Label</label>
              <input className="cal-input" value={editYear.year_label || ""}
                onChange={(e) => setEditYear((p) => ({ ...p, year_label: e.target.value }))} />
            </div>
            <div className="cal-field">
              <label>BS Label</label>
              <input className="cal-input" value={editYear.year_label_BS || ""}
                onChange={(e) => setEditYear((p) => ({ ...p, year_label_BS: e.target.value }))} />
            </div>
            <div className="cal-field">
              <label>AD Label</label>
              <input className="cal-input" value={editYear.year_label_AD || ""}
                onChange={(e) => setEditYear((p) => ({ ...p, year_label_AD: e.target.value }))} />
            </div>            <div className="cal-field">
              <label>Start Date</label>
              <UniversalDatePicker
                value={editYear.start_date_AD || ""}
                onChange={(val) => setEditYear((p) => ({ ...p, start_date_AD: val }))}
              />
            </div>            <div className="cal-field">
              <label>End Date</label>
              <UniversalDatePicker
                value={editYear.end_date_AD || ""}
                onChange={(val) => setEditYear((p) => ({ ...p, end_date_AD: val }))}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <label className="cal-checkbox-field">
                <input type="checkbox" checked={editYear.is_current || false}
                  onChange={(e) => setEditYear((p) => ({ ...p, is_current: e.target.checked }))} />
                <span>Current year</span>
              </label>
            </div>
          </div>
          <div className="cal-modal-actions">
            <button className="cal-btn" onClick={() => setEditYear(null)}>Cancel</button>
            <button className="cal-btn cal-btn-primary" onClick={handleUpdateYear} disabled={busy}>
              {busy ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
              Save Changes
            </button>
          </div>
        </Modal>
      )}

            {editMonth && (
        <Modal onClose={() => setEditMonth(null)}>
          <div className="cal-modal-header">
            <h3 className="cal-modal-title">Edit Month</h3>
            <button onClick={() => setEditMonth(null)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="cal-field">
              <label>Month Name</label>
              <input className="cal-input" value={editMonth.month_name || ""}
                onChange={(e) => setEditMonth((p) => ({ ...p, month_name: e.target.value }))} />
            </div>
            <div className="cal-form-grid">
              <div className="cal-field">
                <label>Start Date</label>
                <UniversalDatePicker
                  value={editMonth.start_date || editMonth.month_start_date_AD || ""}
                  onChange={(val) => setEditMonth((p) => ({ ...p, start_date: val, month_start_date_AD: val }))}
                />
              </div>
              <div className="cal-field">
                <label>End Date</label>
                <UniversalDatePicker
                  value={editMonth.end_date || editMonth.month_end_date_AD || ""}
                  onChange={(val) => setEditMonth((p) => ({ ...p, end_date: val, month_end_date_AD: val }))}
                />
              </div>
            </div>
            <div className="cal-field">
              <label>Month Index</label>
              <select className="cal-select" value={editMonth.bs_month_index || 1}
                onChange={(e) => setEditMonth((p) => ({ ...p, bs_month_index: parseInt(e.target.value) }))}>
                {(calendarType === "BS" ? BS_MONTHS : AD_MONTHS).map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="cal-modal-actions">
            <button className="cal-btn" onClick={() => setEditMonth(null)}>Cancel</button>
            <button className="cal-btn cal-btn-primary" onClick={handleUpdateMonth} disabled={busy}>
              {busy ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {editDayType && (
        <Modal onClose={() => setEditDayType(null)}>
          <div className="cal-modal-header">
            <h3 className="cal-modal-title">Edit Day Classification</h3>
            <button onClick={() => setEditDayType(null)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="cal-field">
              <label>Type Name</label>
              <input className="cal-input" value={editDayType.day_type || ""}
                onChange={(e) => setEditDayType((p) => ({ ...p, day_type: e.target.value }))} />
            </div>
            <div className="cal-field">
              <label>Category</label>
              <select className="cal-select" value={editDayType.category_id || ""}
                onChange={(e) => setEditDayType((p) => ({ ...p, category_id: e.target.value || null }))}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.category_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="cal-modal-actions">
            <button className="cal-btn" onClick={() => setEditDayType(null)}>Cancel</button>
            <button className="cal-btn cal-btn-primary" onClick={handleUpdateDayType} disabled={busy}>
              {busy ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
              Save Changes
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const CollapsibleSection = ({ isOpen, onToggle, icon: Icon, title, badge, children }) => (
  <div className={clsx("cal-collapsible", isOpen && "is-open")}>
    <button className="cal-collapsible-head" onClick={onToggle}>
      <span className="cal-collapsible-head-left">
        <Icon size={16} style={{ color: "var(--accent-2)" }} />
        <span className="cal-collapsible-title">{title}</span>
        {badge !== undefined && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
            background: "rgba(99,102,241,0.12)", color: "var(--accent-2)", marginLeft: 2,
          }}>
            {badge}
          </span>
        )}
      </span>
      <div className="cal-collapsible-chevron">
        <ChevronDown size={15} />
      </div>
    </button>
    {isOpen && <div className="cal-collapsible-body">{children}</div>}
  </div>
);

const Modal = ({ children, onClose }) => (
  <div className="cal-modal-backdrop" onClick={onClose}>
    <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

export default CalendarSettings;
