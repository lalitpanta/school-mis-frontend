import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  FileText,
  Download,
  Upload,
  X,
  Check,
  Edit2,
  Settings,
  Grid3x3,
  ChevronDown,
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
  refreshYearlyStats,
} from "../../api/calendarApi";

// Utils
import { BS_MONTHS } from "../../utils/bsCalendar";
import { dayColor } from "../../utils/calendarStyles";
import { useSettings } from "../../context/SettingsContext";

const AD_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// ============================================================================
// INLINE STYLES (Matching the HTML design exactly)
// ============================================================================
const styles = `
.cal-root {
  --bg: #0c1220;
  --surface: #121a2c;
  --surface-2: #182339;
  --surface-hover: #1d2a44;
  --border: #24304a;
  --border-soft: #1a2338;
  --text: #eef1f7;
  --text-dim: #98a2ba;
  --text-faint: #5c6784;
  --accent: #8b5cf6;
  --danger: #f43f5e;
  --danger-bg: rgba(244,63,94,0.13);
  --success: #10b981;
  --success-bg: rgba(16,185,129,0.13);

  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, sans-serif;
  padding: 28px;
  border-radius: 20px;
  max-width: 1080px;
  margin: 24px auto;
  position: relative;
}

.cal-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.cal-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
  font-family: 'Space Grotesk', sans-serif;
}

.cal-subtitle {
  font-size: 13.5px;
  color: var(--text-dim);
  margin: 0;
  line-height: 1.5;
}

.cal-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cal-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
  transition: background .15s ease, border-color .15s ease;
  white-space: nowrap;
}

.cal-btn:hover:not(:disabled) {
  background: var(--surface-hover);
  border-color: #34405f;
}

.cal-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cal-btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.cal-btn-primary:hover:not(:disabled) {
  background: #7c4fee;
}

.cal-btn-danger {
  background: transparent;
  border-color: var(--border);
  color: var(--danger);
}

.cal-btn-danger:hover:not(:disabled) {
  background: var(--danger-bg);
  border-color: var(--danger);
}

.cal-btn-subtle {
  background: var(--surface-2);
}

.cal-segmented {
  display: flex;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 3px;
  gap: 2px;
}

.cal-seg-btn {
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}

.cal-seg-btn.is-active {
  background: var(--accent);
  color: white;
}

.cal-seg-btn:hover:not(.is-active) {
  color: var(--text);
}

.cal-tabs {
  display: inline-flex;
  gap: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
}

.cal-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
}

.cal-tab.is-active {
  background: var(--accent);
  color: white;
}

.cal-tab:hover:not(.is-active) {
  color: var(--text);
}

.cal-collapsible {
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
  background: var(--surface);
}

.cal-collapsible-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text);
  font-family: inherit;
  font-size: inherit;
}

.cal-collapsible-head:hover {
  background: var(--surface-2);
}

.cal-collapsible-head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cal-collapsible-title {
  font-size: 14.5px;
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
}

.cal-collapsible-chevron {
  color: var(--text-faint);
  transition: transform .2s ease;
  display: flex;
}

.cal-collapsible.is-open .cal-collapsible-chevron {
  transform: rotate(180deg);
}

.cal-collapsible-body {
  border-top: 1px solid var(--border-soft);
  padding: 18px;
  background: rgba(255,255,255,0.008);
}

.cal-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cal-field label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cal-input, .cal-select {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--text);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 9px;
  padding: 9px 11px;
  width: 100%;
}

.cal-input:focus, .cal-select:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.cal-input::placeholder {
  color: var(--text-faint);
}

.cal-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.cal-form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cal-subform {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.cal-subform-title {
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
  margin: 0 0 12px;
}

.cal-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.cal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 11px;
  transition: border-color .15s ease;
}

.cal-row:hover {
  border-color: #34405f;
}

.cal-row-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cal-row-name {
  font-weight: 600;
  font-size: 13.5px;
}

.cal-row-sub {
  font-size: 11.5px;
  color: var(--text-faint);
  margin-top: 1px;
}

.cal-row-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.cal-empty {
  text-align: center;
  padding: 26px 10px;
  color: var(--text-faint);
  font-size: 13px;
}

.cal-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 9px;
  border-radius: 999px;
}

.cal-pill-current {
  background: var(--success-bg);
  color: var(--success);
  border: 1px solid rgba(16,185,129,0.35);
}

.cal-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-dim);
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
  flex-shrink: 0;
}

.cal-icon-btn:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text);
}

.cal-icon-btn.danger:hover {
  color: var(--danger);
  background: var(--danger-bg);
}

.cal-checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cal-checkbox-field input {
  width: 15px;
  height: 15px;
  accent-color: var(--accent);
  cursor: pointer;
}

.cal-checkbox-field span {
  font-size: 12.5px;
  color: var(--text-dim);
}

.cal-panel {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.cal-card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.cal-card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}

.cal-card-title {
  font-size: 15.5px;
  font-weight: 600;
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
}

.cal-card-subtitle {
  font-size: 12px;
  color: var(--text-dim);
  margin: 2px 0 0;
}

.cal-grid-wrap {
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  overflow: hidden;
  background: var(--border-soft);
  margin-bottom: 20px;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--surface-2);
}

.cal-weekday {
  text-align: center;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-faint);
  padding: 10px 0;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: var(--border-soft);
}

.cal-cell {
  position: relative;
  min-height: 78px;
  background: var(--surface);
  border: none;
  border-left: 3px solid transparent;
  padding: 8px 9px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  text-align: left;
  transition: background .15s ease;
  font-family: inherit;
  color: inherit;
  width: 100%;
}

.cal-cell:hover:not(.is-disabled) {
  background: var(--surface-hover);
}

.cal-cell.is-disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.cal-cell.has-type {
  border-left-color: var(--tc);
  background: linear-gradient(90deg, var(--tb), transparent 65%);
}

.cal-cell.is-today {
  box-shadow: inset 0 0 0 2px var(--accent);
  border-radius: 4px;
}

.cal-cell.is-selected {
  box-shadow: inset 0 0 0 2px #fff;
}

.cal-cell-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
}

.cal-cell-primary {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  font-family: 'Space Grotesk', sans-serif;
}

.cal-cell-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--tc);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.cal-cell-check {
  width: 15px;
  height: 15px;
  border-radius: 5px;
  border: 1.5px solid var(--border);
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.cal-cell.is-selected .cal-cell-check {
  background: var(--accent);
  border-color: var(--accent);
}

.cal-cell-clear {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--danger);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity .15s ease;
  border: 2px solid var(--surface);
  cursor: pointer;
  padding: 0;
}

.cal-cell:hover .cal-cell-clear {
  opacity: 1;
}

.cal-bulkbar {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px;
  background: rgba(139,92,246,0.14);
  border: 1px solid rgba(139,92,246,0.4);
  border-radius: 12px;
  flex-wrap: wrap;
}

.cal-bulkbar-count {
  font-size: 13px;
  font-weight: 600;
}

.cal-bulkbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cal-grid-controls-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cal-weekday-rule {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border-soft);
}

.cal-io-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.cal-dropzone {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 22px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease;
}

.cal-dropzone:hover {
  border-color: var(--accent);
  background: var(--surface-2);
}

.cal-dropzone-icon {
  color: var(--accent);
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
}

.cal-dropzone-text {
  font-size: 13px;
  font-weight: 600;
}

.cal-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 500;
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: 6px 8px 6px 12px;
  border-radius: 999px;
}

.cal-chip button {
  background: none;
  border: none;
  color: var(--text-faint);
  cursor: pointer;
  display: flex;
  padding: 2px;
  border-radius: 50%;
}

.cal-chip button:hover {
  color: var(--danger);
  background: var(--danger-bg);
}

.cal-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cal-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6,9,18,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}

.cal-modal {
  width: 360px;
  max-width: 92vw;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  max-height: 86vh;
  overflow-y: auto;
}

.cal-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.cal-modal-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}

.cal-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

@media (max-width: 760px) {
  .cal-root { padding: 16px; border-radius: 0; margin: 0; }
  .cal-form-grid, .cal-form-grid-3 { grid-template-columns: 1fr; }
  .cal-grid-controls-row { grid-template-columns: 1fr; }
  .cal-io-grid { grid-template-columns: 1fr; }
  .cal-cell { min-height: 60px; padding: 6px 7px; }
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

  // Form state
  const [newYear, setNewYear] = useState({
    year_label: "",
    year_label_AD: "",
    year_label_BS: "",
    is_current: false,
    start_date_AD: "",
    end_date_AD: "",
  });

  const [newMonth, setNewMonth] = useState({
    year_id: "",
    bs_month_index: 0,
    start_date: "",
    end_date: "",
    month_name: "",
  });

  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeCategoryId, setNewTypeCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Grid state
  const [gridYearId, setGridYearId] = useState("");
  const [gridMonthId, setGridMonthId] = useState("");
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkTypeId, setBulkTypeId] = useState("");
  const [weekdayRule, setWeekdayRule] = useState({
    dayTypeId: "",
    weekday: "",
    scope: "month",
  });

  // Edit modals
  const [editYear, setEditYear] = useState(null);
  const [editMonth, setEditMonth] = useState(null);

  // UI state
  const [openSections, setOpenSections] = useState({
    years: true,
    months: false,
    categories: false,
    types: false,
  });

  // Load all data
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [yearRes, monthRes, typeRes, catRes] = await Promise.all([
        getYears(),
        getMonths(),
        getDayTypes(),
        getDayCategories(),
      ]);

      setYears(yearRes.data?.data || []);
      setMonths(monthRes.data?.data || []);
      setDayTypes(typeRes.data?.data || []);
      setCategories(catRes.data?.data || []);

      const current = (yearRes.data?.data || []).find((y) => y.is_current);
      if (current && !gridYearId) {
        setGridYearId(current.id);
      }
    } catch (e) {
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [gridYearId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Fetch calendar days
  const fetchGridDays = useCallback(async () => {
    if (!gridMonthId) {
      setCalDays([]);
      return;
    }
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

  useEffect(() => {
    fetchGridDays();
  }, [fetchGridDays]);

  // Handlers
  const handleAddYear = async () => {
    if (!newYear.year_label) {
      toast.error("Enter year label");
      return;
    }
    setBusy(true);
    try {
      await createYear(newYear);
      toast.success("Year added successfully");
      setNewYear({
        year_label: "",
        year_label_AD: "",
        year_label_BS: "",
        is_current: false,
        start_date_AD: "",
        end_date_AD: "",
      });
      await loadAll();
    } catch (e) {
      toast.error("Failed to add year");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateYear = async () => {
    if (!editYear) return;
    setBusy(true);
    try {
      await updateYear(editYear.id, editYear);
      toast.success("Year updated");
      setEditYear(null);
      await loadAll();
    } catch (e) {
      toast.error("Failed to update year");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteYear = async (id, label) => {
    if (!window.confirm(`Delete year "${label}"?`)) return;
    setBusy(true);
    try {
      await deleteYear(id);
      toast.success("Year deleted");
      if (gridYearId === id) {
        setGridYearId("");
        setGridMonthId("");
      }
      await loadAll();
    } catch (e) {
      toast.error("Failed to delete year");
    } finally {
      setBusy(false);
    }
  };

  const handleAddMonth = async () => {
    if (!newMonth.year_id) {
      toast.error("Select a year");
      return;
    }
    setBusy(true);
    try {
      await createMonth({
        ...newMonth,
        date_format: calendarType,
        bs_month_index: parseInt(newMonth.bs_month_index),
      });
      toast.success("Month added successfully");
      setNewMonth({
        year_id: newMonth.year_id,
        bs_month_index: 0,
        start_date: "",
        end_date: "",
        month_name: "",
      });
      await loadAll();
    } catch (e) {
      toast.error("Failed to add month");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteMonth = async (id) => {
    if (!window.confirm("Delete this month?")) return;
    setBusy(true);
    try {
      await deleteMonth(id);
      toast.success("Month deleted");
      if (gridMonthId === id) {
        setGridMonthId("");
        setCalDays([]);
      }
      await loadAll();
    } catch (e) {
      toast.error("Failed to delete month");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateMonth = async () => {
    if (!editMonth) return;
    setBusy(true);
    try {
      await updateMonth(editMonth.id, editMonth);
      toast.success("Month updated");
      setEditMonth(null);
      await loadAll();
    } catch (e) {
      toast.error("Failed to update month");
    } finally {
      setBusy(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setBusy(true);
    try {
      await createDayCategory({ category_name: newCategoryName });
      toast.success("Category added");
      setNewCategoryName("");
      await loadAll();
    } catch (e) {
      toast.error("Failed to add category");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    setBusy(true);
    try {
      await deleteDayCategory(id);
      toast.success("Category deleted");
      await loadAll();
    } catch (e) {
      toast.error("Failed to delete category");
    } finally {
      setBusy(false);
    }
  };

  const handleAddDayType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Enter type name");
      return;
    }
    setBusy(true);
    try {
      await createDayType({
        day_type: newTypeName,
        category_id: newTypeCategoryId || null,
      });
      toast.success("Day type added");
      setNewTypeName("");
      setNewTypeCategoryId("");
      await loadAll();
    } catch (e) {
      toast.error("Failed to add day type");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDayType = async (id) => {
    if (!window.confirm("Delete this day type?")) return;
    setBusy(true);
    try {
      await deleteDayType(id);
      toast.success("Day type deleted");
      await loadAll();
      await fetchGridDays();
    } catch (e) {
      toast.error("Failed to delete day type");
    } finally {
      setBusy(false);
    }
  };

  const monthsForYear = (yearId) => months.filter((m) => m.year_id === yearId);

  const handleBulkAssign = async (clearMode = false) => {
    if (!gridMonthId) {
      toast.error("Select a month");
      return;
    }
    if (!clearMode && !bulkTypeId) {
      toast.error("Select a day type");
      return;
    }

    setBusy(true);
    try {
      const assignments = Array.from(bulkSelected).map((dayId) => ({
        calendarDayId: dayId,
        dayTypeId: clearMode ? null : bulkTypeId,
      }));

      await bulkAssignDayTypes(assignments);
      toast.success(
        `${assignments.length} day(s) ${clearMode ? "cleared" : "assigned"}`,
      );
      setBulkSelected(new Set());
      setBulkTypeId("");
      await fetchGridDays();
    } catch (e) {
      toast.error("Bulk assignment failed");
    } finally {
      setBusy(false);
    }
  };

  const handleQuickClear = async (id) => {
    setBusy(true);
    try {
      await assignDayType(id, null);
      await fetchGridDays();
    } catch (e) {
      toast.error("Clear failed");
    } finally {
      setBusy(false);
    }
  };

  const handleAssignByWeekday = async () => {
    if (!weekdayRule.dayTypeId || weekdayRule.weekday === "") {
      toast.error("Select day type and weekday");
      return;
    }

    setBusy(true);
    try {
      // Get the weekday name based on index (0-6 = Sunday-Saturday)
      const WEEKDAYS = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const weekdayName = WEEKDAYS[parseInt(weekdayRule.weekday)];

      const payload = {
        day_of_week: weekdayName,
        day_type_id: weekdayRule.dayTypeId,
      };

      // Add the appropriate scope
      if (weekdayRule.scope === "month" && gridMonthId) {
        payload.month_id = gridMonthId;
      } else if (weekdayRule.scope === "year" && gridYearId) {
        payload.year_id = gridYearId;
      } else {
        toast.error("Please select a year or month first");
        setBusy(false);
        return;
      }

      const response = await assignByWeekday(payload);
      const count = response?.data?.count || 0;
      toast.success(`Assigned to ${count} ${weekdayName}(s)`);

      setWeekdayRule({ dayTypeId: "", weekday: "", scope: weekdayRule.scope });
      await fetchGridDays();
    } catch (e) {
      toast.error("Weekday assignment failed");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="cal-root">
        <style>{styles}</style>
        <div className="cal-empty" style={{ padding: "60px 20px" }}>
          <Loader2
            size={32}
            style={{
              margin: "0 auto 12px",
              color: "var(--accent)",
              animation: "spin 1s linear infinite",
            }}
          />
          <p>Loading calendar settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cal-root">
      <style>{styles}</style>

      {/* Header */}
      <div className="cal-page-header">
        <div>
          <h1 className="cal-title">Academic calendar settings</h1>
          <p className="cal-subtitle">
            Manage academic years, months, day categories and classification
            rules for the school calendar.
          </p>
        </div>
        <div className="cal-header-actions">
          <div className="cal-segmented">
            {["BS", "AD"].map((k) => (
              <button
                key={k}
                className={clsx(
                  "cal-seg-btn",
                  calendarType === k && "is-active",
                )}
                onClick={() => updateSetting("calendar_type", k)}
              >
                {k}
              </button>
            ))}
          </div>
          <button
            className="cal-btn cal-btn-subtle"
            onClick={loadAll}
            disabled={busy || loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="cal-tabs">
        {[
          { id: "setup", label: "Setup & Configuration", icon: Settings },
          { id: "grid", label: "Day Assignments", icon: Grid3x3 },
          { id: "io", label: "Import / Export", icon: Upload },
        ].map((tab) => (
          <button
            key={tab.id}
            className={clsx("cal-tab", activeTab === tab.id && "is-active")}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={15} /> {tab.label}
          </button>
        ))}
      </div>

      {/* SETUP TAB */}
      {activeTab === "setup" && (
        <div>
          {/* Years Section */}
          <CollapsibleSection
            isOpen={openSections.years}
            onToggle={() =>
              setOpenSections({ ...openSections, years: !openSections.years })
            }
            icon={Calendar}
            title="Academic years"
          >
            <div className="cal-subform">
              <p className="cal-subform-title">Add new year</p>
              <div className="cal-form-grid">
                <div className="cal-field">
                  <label>Year label (BS)</label>
                  <input
                    className="cal-input"
                    placeholder="2083/084"
                    value={newYear.year_label_BS}
                    onChange={(e) =>
                      setNewYear({ ...newYear, year_label_BS: e.target.value })
                    }
                  />
                </div>
                <div className="cal-field">
                  <label>Year label (AD)</label>
                  <input
                    className="cal-input"
                    placeholder="2026/27"
                    value={newYear.year_label_AD}
                    onChange={(e) =>
                      setNewYear({ ...newYear, year_label_AD: e.target.value })
                    }
                  />
                </div>
                <div className="cal-field">
                  <label>Start date (AD)</label>
                  <input
                    type="date"
                    className="cal-input"
                    value={newYear.start_date_AD}
                    onChange={(e) =>
                      setNewYear({ ...newYear, start_date_AD: e.target.value })
                    }
                  />
                </div>
                <div className="cal-field">
                  <label>End date (AD)</label>
                  <input
                    type="date"
                    className="cal-input"
                    value={newYear.end_date_AD}
                    onChange={(e) =>
                      setNewYear({ ...newYear, end_date_AD: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="cal-checkbox-field" style={{ marginTop: "12px" }}>
                <input
                  type="checkbox"
                  checked={newYear.is_current}
                  onChange={(e) =>
                    setNewYear({ ...newYear, is_current: e.target.checked })
                  }
                />
                <span>Mark this year as current</span>
              </div>
              <div className="cal-form-actions">
                <button
                  className="cal-btn cal-btn-primary"
                  onClick={handleAddYear}
                  disabled={busy}
                >
                  <Plus size={14} /> Add year
                </button>
              </div>
            </div>

            <div className="cal-list">
              {years.length === 0 ? (
                <div className="cal-empty">No academic years added yet.</div>
              ) : (
                years.map((y) => (
                  <div key={y.id} className="cal-row">
                    <div className="cal-row-main">
                      <Calendar size={17} />
                      <div>
                        <div className="cal-row-name">
                          {y.year_label_BS || y.year_label_AD || y.year_label}
                        </div>
                        <div className="cal-row-sub">
                          {y.year_label_AD} · {y.start_date_AD || "—"} to{" "}
                          {y.end_date_AD || "—"}
                        </div>
                      </div>
                      {y.is_current && (
                        <span className="cal-pill cal-pill-current">
                          <Check size={11} /> Current
                        </span>
                      )}
                    </div>
                    <div className="cal-row-actions">
                      <button
                        className="cal-icon-btn"
                        onClick={() => setEditYear(y)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="cal-icon-btn danger"
                        onClick={() =>
                          handleDeleteYear(
                            y.id,
                            y.year_label_BS || y.year_label,
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>

          {/* Months Section */}
          <CollapsibleSection
            isOpen={openSections.months}
            onToggle={() =>
              setOpenSections({ ...openSections, months: !openSections.months })
            }
            icon={Calendar}
            title="Academic months"
          >
            <div className="cal-subform">
              <p className="cal-subform-title">Add new month</p>
              <div className="cal-form-grid">
                <div className="cal-field">
                  <label>Academic year</label>
                  <select
                    className="cal-select"
                    value={newMonth.year_id}
                    onChange={(e) =>
                      setNewMonth({ ...newMonth, year_id: e.target.value })
                    }
                  >
                    <option value="">Select year…</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.year_label_BS || y.year_label_AD || y.year_label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cal-field">
                  <label>BS month</label>
                  <select
                    className="cal-select"
                    value={newMonth.bs_month_index}
                    onChange={(e) =>
                      setNewMonth({
                        ...newMonth,
                        bs_month_index: parseInt(e.target.value),
                      })
                    }
                  >
                    {BS_MONTHS.map((name, i) => (
                      <option key={name} value={i}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cal-field">
                  <label>Period start</label>
                  <input
                    type="date"
                    className="cal-input"
                    value={newMonth.start_date}
                    onChange={(e) =>
                      setNewMonth({ ...newMonth, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="cal-field">
                  <label>Period end</label>
                  <input
                    type="date"
                    className="cal-input"
                    value={newMonth.end_date}
                    onChange={(e) =>
                      setNewMonth({ ...newMonth, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="cal-form-actions">
                <button
                  className="cal-btn cal-btn-primary"
                  onClick={handleAddMonth}
                  disabled={busy}
                >
                  <Plus size={14} /> Add month
                </button>
              </div>
            </div>

            <div className="cal-list">
              {monthsForYear(newMonth.year_id).length === 0 ? (
                <div className="cal-empty">No months for selected year.</div>
              ) : (
                monthsForYear(newMonth.year_id).map((m) => (
                  <div key={m.id} className="cal-row">
                    <div className="cal-row-main">
                      <Calendar size={17} />
                      <div>
                        <div className="cal-row-name">{m.month_name}</div>
                        <div className="cal-row-sub">
                          {m.start_date} to {m.end_date}
                        </div>
                      </div>
                    </div>
                    <div className="cal-row-actions">
                      <button
                        className="cal-icon-btn"
                        onClick={() => setEditMonth(m)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="cal-icon-btn danger"
                        onClick={() => handleDeleteMonth(m.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CollapsibleSection>

          {/* Categories Section */}
          <CollapsibleSection
            isOpen={openSections.categories}
            onToggle={() =>
              setOpenSections({
                ...openSections,
                categories: !openSections.categories,
              })
            }
            icon={Settings}
            title="Day categories"
          >
            <div style={{ marginBottom: "16px" }}>
              <div className="cal-field" style={{ marginBottom: "12px" }}>
                <label>Category name</label>
                <input
                  className="cal-input"
                  placeholder="e.g., Attendance, Assessment"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <div className="cal-form-actions">
                <button
                  className="cal-btn cal-btn-primary"
                  onClick={handleAddCategory}
                  disabled={busy}
                >
                  <Plus size={14} /> Add category
                </button>
              </div>
            </div>

            <div className="cal-chip-row">
              {categories.map((c) => (
                <div key={c.id} className="cal-chip">
                  {c.category_name}
                  <button onClick={() => handleDeleteCategory(c.id)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Day Types Section */}
          <CollapsibleSection
            isOpen={openSections.types}
            onToggle={() =>
              setOpenSections({ ...openSections, types: !openSections.types })
            }
            icon={Settings}
            title="Day classifications"
          >
            <div style={{ marginBottom: "16px" }}>
              <div className="cal-form-grid-3">
                <div className="cal-field">
                  <label>Type name</label>
                  <input
                    className="cal-input"
                    placeholder="e.g., Holiday"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                  />
                </div>
                <div className="cal-field">
                  <label>Category</label>
                  <select
                    className="cal-select"
                    value={newTypeCategoryId}
                    onChange={(e) => setNewTypeCategoryId(e.target.value)}
                  >
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="cal-form-actions"
                  style={{ justifyContent: "flex-start", marginTop: 0 }}
                >
                  <button
                    className="cal-btn cal-btn-primary"
                    onClick={handleAddDayType}
                    disabled={busy}
                  >
                    <Plus size={14} /> Add type
                  </button>
                </div>
              </div>
            </div>

            <div className="cal-list">
              {dayTypes.map((t) => (
                <div key={t.id} className="cal-row">
                  <div className="cal-row-main">
                    <div>
                      <div className="cal-row-name">{t.day_type}</div>
                      {t.category_name && (
                        <div className="cal-row-sub">{t.category_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="cal-row-actions">
                    <button
                      className="cal-icon-btn danger"
                      onClick={() => handleDeleteDayType(t.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* GRID TAB */}
      {activeTab === "grid" && (
        <div>
          {/* Grid Controls */}
          <div className="cal-panel">
            <div className="cal-grid-controls-row">
              <div className="cal-field">
                <label>Academic year</label>
                <select
                  className="cal-select"
                  value={gridYearId}
                  onChange={(e) => {
                    setGridYearId(e.target.value);
                    setGridMonthId("");
                    setCalDays([]);
                  }}
                >
                  <option value="">Select year…</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.year_label_BS || y.year_label_AD || y.year_label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cal-field">
                <label>Month</label>
                <select
                  className="cal-select"
                  value={gridMonthId}
                  onChange={(e) => setGridMonthId(e.target.value)}
                >
                  <option value="">Select month…</option>
                  {monthsForYear(gridYearId).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.month_name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                className="cal-form-actions"
                style={{ justifyContent: "flex-start", marginTop: 0 }}
              >
                <button
                  className="cal-btn cal-btn-subtle"
                  onClick={() => refreshYearlyStats(gridYearId)}
                  disabled={busy || !gridYearId}
                >
                  <RefreshCw size={14} /> Stats
                </button>
              </div>
            </div>

            {/* Weekday Rule */}
            <div className="cal-weekday-rule">
              <div className="cal-grid-controls-row">
                <div className="cal-field">
                  <label>Day type</label>
                  <select
                    className="cal-select"
                    value={weekdayRule.dayTypeId}
                    onChange={(e) =>
                      setWeekdayRule({
                        ...weekdayRule,
                        dayTypeId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select type…</option>
                    {dayTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.day_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cal-field">
                  <label>Weekday</label>
                  <select
                    className="cal-select"
                    value={weekdayRule.weekday}
                    onChange={(e) =>
                      setWeekdayRule({
                        ...weekdayRule,
                        weekday: e.target.value,
                      })
                    }
                  >
                    <option value="">Select day…</option>
                    {WEEKDAYS_FULL.map((w, i) => (
                      <option key={w} value={i}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="cal-form-actions"
                  style={{ justifyContent: "flex-start", marginTop: 0 }}
                >
                  <button
                    className="cal-btn cal-btn-primary"
                    onClick={handleAssignByWeekday}
                    disabled={busy}
                  >
                    <Check size={14} /> Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          {!gridMonthId ? (
            <div
              className="cal-panel"
              style={{ textAlign: "center", padding: "60px 20px" }}
            >
              <Calendar
                size={48}
                style={{ margin: "0 auto 12px", opacity: 0.3 }}
              />
              <p style={{ color: "var(--text-faint)" }}>
                Select a year and month to view the calendar
              </p>
            </div>
          ) : (
            <div className="cal-grid-wrap">
              <div className="cal-weekdays">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
                  <div key={d} className="cal-weekday">
                    {d}
                  </div>
                ))}
              </div>
              <div className="cal-grid">
                {calDays.map((day) => {
                  const isSelected = bulkSelected.has(day.id);
                  const style = dayColor(day.day_type, day.category_name);

                  return (
                    <button
                      key={day.id}
                      className={clsx(
                        "cal-cell",
                        isSelected && "is-selected",
                        day.day_type && "has-type",
                      )}
                      onClick={() => {
                        const newSet = new Set(bulkSelected);
                        if (newSet.has(day.id)) newSet.delete(day.id);
                        else newSet.add(day.id);
                        setBulkSelected(newSet);
                      }}
                      style={{
                        "--tb": style.bgColor,
                        "--tc": style.textColor,
                      }}
                    >
                      <div className="cal-cell-top">
                        <span className="cal-cell-primary">
                          {day.day_number}
                        </span>
                        <div className="cal-cell-check" />
                      </div>
                      {day.day_type && (
                        <span className="cal-cell-badge">{day.day_type}</span>
                      )}
                      {day.day_type && (
                        <button
                          className="cal-cell-clear"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickClear(day.id);
                          }}
                        >
                          <X size={10} strokeWidth={3} />
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bulk Bar */}
          {bulkSelected.size > 0 && (
            <div className="cal-bulkbar">
              <div className="cal-bulkbar-count">
                <strong>{bulkSelected.size}</strong> day(s) selected
              </div>
              <div className="cal-bulkbar-actions">
                <select
                  className="cal-select"
                  style={{ width: "180px" }}
                  value={bulkTypeId}
                  onChange={(e) => setBulkTypeId(e.target.value)}
                >
                  <option value="">Select type…</option>
                  {dayTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.day_type}
                    </option>
                  ))}
                </select>
                <button
                  className="cal-btn cal-btn-primary"
                  onClick={() => handleBulkAssign(false)}
                  disabled={!bulkTypeId}
                >
                  Assign
                </button>
                <button
                  className="cal-btn cal-btn-danger"
                  onClick={() => handleBulkAssign(true)}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IO TAB */}
      {activeTab === "io" && (
        <div className="cal-io-grid">
          <div className="cal-panel">
            <div className="cal-card-head">
              <div className="cal-card-icon">
                <Download size={20} />
              </div>
              <div>
                <h3 className="cal-card-title">Export Month</h3>
                <p className="cal-card-subtitle">
                  Download calendar data for a specific month
                </p>
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Select year and month, then download as CSV format for backup or
              sharing.
            </p>
          </div>

          <div className="cal-panel">
            <div className="cal-card-head">
              <div className="cal-card-icon">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="cal-card-title">Import Calendar</h3>
                <p className="cal-card-subtitle">
                  Upload CSV to update assignments
                </p>
              </div>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
              Upload a pre-formatted CSV file to bulk update day assignments
              across the calendar.
            </p>
          </div>
        </div>
      )}

      {/* Edit Modals */}
      {editYear && (
        <Modal onClose={() => setEditYear(null)}>
          <h3 className="cal-modal-title">Edit Year</h3>
          <div className="cal-form-grid" style={{ marginTop: "14px" }}>
            <div className="cal-field">
              <label>Year label (BS)</label>
              <input
                className="cal-input"
                value={editYear.year_label_BS || ""}
                onChange={(e) =>
                  setEditYear({ ...editYear, year_label_BS: e.target.value })
                }
              />
            </div>
            <div className="cal-field">
              <label>Year label (AD)</label>
              <input
                className="cal-input"
                value={editYear.year_label_AD || ""}
                onChange={(e) =>
                  setEditYear({ ...editYear, year_label_AD: e.target.value })
                }
              />
            </div>
          </div>
          <div className="cal-modal-actions">
            <button className="cal-btn" onClick={() => setEditYear(null)}>
              Cancel
            </button>
            <button
              className="cal-btn cal-btn-primary"
              onClick={handleUpdateYear}
              disabled={busy}
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {editMonth && (
        <Modal onClose={() => setEditMonth(null)}>
          <h3 className="cal-modal-title">Edit Month</h3>
          <div
            className="cal-field"
            style={{ marginTop: "14px", marginBottom: "12px" }}
          >
            <label>Month name</label>
            <input
              className="cal-input"
              value={editMonth.month_name || ""}
              onChange={(e) =>
                setEditMonth({ ...editMonth, month_name: e.target.value })
              }
            />
          </div>
          <div className="cal-modal-actions">
            <button className="cal-btn" onClick={() => setEditMonth(null)}>
              Cancel
            </button>
            <button
              className="cal-btn cal-btn-primary"
              onClick={handleUpdateMonth}
              disabled={busy}
            >
              Save
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

const CollapsibleSection = ({
  isOpen,
  onToggle,
  icon: Icon,
  title,
  children,
}) => (
  <div className={clsx("cal-collapsible", isOpen && "is-open")}>
    <button className="cal-collapsible-head" onClick={onToggle}>
      <span className="cal-collapsible-head-left">
        <Icon size={18} style={{ color: "var(--text-dim)" }} />
        <span className="cal-collapsible-title">{title}</span>
      </span>
      <div className="cal-collapsible-chevron">
        <ChevronDown size={17} />
      </div>
    </button>
    {isOpen && <div className="cal-collapsible-body">{children}</div>}
  </div>
);

const Modal = ({ children, onClose }) => (
  <div className="cal-modal-backdrop" onClick={onClose}>
    <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
      <div className="cal-modal-header">
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-dim)",
            cursor: "pointer",
            fontSize: "20px",
          }}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default CalendarSettings;
