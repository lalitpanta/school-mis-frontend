import React, { useState, useEffect } from "react";
import {
  createYear,
  deleteYear,
  createDayCategory,
  deleteDayCategory,
  createDayType,
  deleteDayType,
  getYearOptions,
  getMonthAuto,
  seedNepaliYear,
  getYears,
  getMonths,
  getDayTypes,
  getDayCategories,
  getCalendarDays,
  assignDayType,
  bulkAssignDayTypes,
  assignByWeekday,
  manualAssignDayTypes,
} from "../../api/calendarApi";
import "./CalendarSettings.css";

// Constants
const BS_YEAR_MIN = 2082,
  BS_YEAR_MAX = 2120;
const AD_YEAR_MIN = 2025,
  AD_YEAR_MAX = 2050;
const BS_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];
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
const WEEKDAYS_NP = [
  ["आइत", "Sun"],
  ["सोम", "Mon"],
  ["मंगल", "Tue"],
  ["बुध", "Wed"],
  ["बिही", "Thu"],
  ["शुक्र", "Fri"],
  ["शनि", "Sat"],
];
const WEEKDAYS_EN = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

// BS 2082 Baisakh 1 = AD 2025-04-14
const BS_EPOCH_AD = new Date(2025, 3, 14);
const BS_LEN_PATTERN = [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function bsMonthInfo(year, monthIndex) {
  let cursor = new Date(BS_EPOCH_AD);
  let y = BS_YEAR_MIN,
    m = 1;
  while (y < year || (y === year && m < monthIndex)) {
    const len =
      BS_LEN_PATTERN[(m - 1) % 12] + (y % 4 === 0 && m === 12 ? 1 : 0);
    cursor = addDays(cursor, len);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  const len =
    BS_LEN_PATTERN[(monthIndex - 1) % 12] +
    (year % 4 === 0 && monthIndex === 12 ? 1 : 0);
  return { days: len, adStart: new Date(cursor) };
}

function adMonthInfo(year, monthIndex) {
  const start = new Date(year, monthIndex - 1, 1);
  const days = new Date(year, monthIndex, 0).getDate();
  return { days, adStart: start };
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtAD(date) {
  if (!date) return "";
  if (typeof date === "string") return date;
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toNepaliNum(n) {
  const map = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(n)
    .split("")
    .map((c) => (/\d/.test(c) ? map[+c] : c))
    .join("");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function inclusiveDays(start, end) {
  return (
    Math.floor(
      (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
        86400000
    ) + 1
  );
}

function dateStateToAD(state, mode) {
  if (mode === "BS") {
    const adStart = bsMonthInfo(state.year, state.month).adStart;
    return addDays(adStart, state.day - 1);
  } else {
    return new Date(state.value + "T00:00:00");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character]));
}

// ============================================================================
// COMPONENT
// ============================================================================

const CalendarSettings = () => {
  const [mode, setMode] = useState("BS");
  const [activeTab, setActiveTab] = useState("setup"); // "setup", "grid", "portability"
  const [yearOptions, setYearOptions] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearLabel, setYearLabel] = useState("");
  const [isCurrentYear, setIsCurrentYear] = useState(false);
  const [academicStart, setAcademicStart] = useState(null);
  const [academicEnd, setAcademicEnd] = useState(null);
  const [years, setYears] = useState([]);
  const [categories, setCategories] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [classificationName, setClassificationName] = useState("");
  const [classificationCategory, setClassificationCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextId, setNextId] = useState(1);

  // Popup calendar state
  const [showPopupCalendar, setShowPopupCalendar] = useState(false);
  const [popupYear, setPopupYear] = useState(BS_YEAR_MIN);
  const [popupMonth, setPopupMonth] = useState(1);
  const [popupSelectedISO, setPopupSelectedISO] = useState(null);
  const [academicDateTarget, setAcademicDateTarget] = useState("academicStart");

  // Grid state
  const [gridYearId, setGridYearId] = useState("");
  const [gridMonthId, setGridMonthId] = useState("");
  const [calDays, setCalDays] = useState([]);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkType, setBulkType] = useState("");
  const [dayTypes, setDayTypes] = useState([]);
  const [months, setMonths] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);

  // Import/Export state
  const [exportMonthId, setExportMonthId] = useState("");

  // ── ADVANCED ASSIGNMENT STATE ──
  
  /**
   * Selected weekday for advanced assignment workflow
   * @type {string|null} - "Sunday"|"Monday"|...|"Saturday" or null
   */
  const [advancedSelectedWeekdays, setAdvancedSelectedWeekdays] = useState(new Set());
  
  /**
   * Set of selected specific dates for advanced assignment workflow  
   * @type {Set<number>} - Set containing 1..N day numbers for selected month
   */
  const [advancedSelectedDates, setAdvancedSelectedDates] = useState(new Set());
  
  /**
   * Selected classification UUID for advanced assignment workflow
   * @type {string|null} - UUID string or null
   */
  const [advancedSelectedClassification, setAdvancedSelectedClassification] = useState(null);
  
  /**
   * Loading state during advanced assignment API calls
   * @type {boolean} - true during API call, disables button and shows spinner
   */
  const [advancedIsAssigning, setAdvancedIsAssigning] = useState(false);
  
  /**
   * Status message for advanced assignment operations
   * @type {Object} - { type: "success"|"error"|"warning"|null, text: string, timestamp: number|null }
   */
  const [advancedMessage, setAdvancedMessage] = useState({
    type: null,       // null | "success" | "error" | "warning"
    text: "",         // Human-readable message
    timestamp: null   // For auto-dismiss logic
  });

  // Stats
  const [overviewStats, setOverviewStats] = useState({
    total: 0,
    working_days: 0,
    unassigned: 0,
  });

  // ── ADVANCED ASSIGNMENT HELPER FUNCTIONS ──

  /**
   * Count weekday occurrences in selected month
   * @returns {number} Count of calendar days matching selected weekday
   */
  const countWeekdayOccurrences = () => {
    if (advancedSelectedWeekdays.size === 0 || !gridMonthId) return 0;
    return calDays.filter((d) => advancedSelectedWeekdays.has(d.day_of_week)).length;
  };

  /**
   * Generate summary preview text for combined selections
   * @returns {string} Formatted text like "4 Mondays + 3 specific dates = 7 total days"
   */
  const generateAssignmentSummary = () => {
    const weekdayCount = countWeekdayOccurrences();
    const dateCount = advancedSelectedDates.size;
    const total = weekdayCount + dateCount;
    
    if (total === 0) return "No days selected";
    
    const parts = [];
    if (weekdayCount > 0) {
      parts.push(`${weekdayCount} selected weekday occurrence${weekdayCount !== 1 ? 's' : ''}`);
    }
    if (dateCount > 0) {
      parts.push(`${dateCount} specific date${dateCount > 1 ? 's' : ''}`);
    }
    
    if (parts.length === 1) {
      return `${parts[0]} = ${total} total days`;
    }
    
    return `${parts.join(' + ')} = ${total} total days`;
  };

  /**
   * Check if assignment operation can proceed
   * @returns {boolean} True if all prerequisites met for assignment
   */
  const canAssign = () => {
    const hasDaysSelected = advancedSelectedDates.size > 0 || advancedSelectedWeekdays.size > 0;
    const hasClassification = !!advancedSelectedClassification;
    return hasDaysSelected && hasClassification && !advancedIsAssigning && !!gridMonthId;
  };

  /**
   * Get validation error messages for current state
   * @returns {string[]} Array of validation error messages
   */
  const getValidationErrors = () => {
    const errors = [];
    const hasDaysSelected = advancedSelectedDates.size > 0 || advancedSelectedWeekdays.size > 0;
    
    if (!gridMonthId) {
      errors.push("Please select a month first");
    }
    if (!hasDaysSelected) {
      errors.push("Please select at least one day (weekday or specific date)");
    }
    if (!advancedSelectedClassification) {
      errors.push("Please select a classification");
    }
    
    return errors;
  };

  /**
   * Extract user-friendly error message from API response
   * @param {Error} error - API error object
   * @returns {string} User-friendly error message
   */
  const extractErrorMessage = (error) => {
    // Priority 1: Backend error response
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Priority 2: HTTP status message
    if (error.response?.status) {
      const statusMap = {
        400: "Bad request. Check your input.",
        401: "Unauthorized. Please log in again.",
        403: "You don't have permission to perform this action.",
        404: "Resource not found.",
        409: "Conflict. The data may have changed.",
        500: "Server error. Please try again later.",
        503: "Service unavailable. Please try again later."
      };
      return statusMap[error.response.status] || "Request failed.";
    }
    
    // Priority 3: Network error
    if (!error.response) {
      return "Connection lost. Please check your internet and retry.";
    }
    
    // Fallback
    return "An unexpected error occurred.";
  };

  // ── ADVANCED ASSIGNMENT EVENT HANDLERS ──

  /**
   * Handle weekday selection change from dropdown
   * @param {Event} e - Select change event
   */
  const handleAdvancedWeekdayToggle = (weekday) => {
    setAdvancedSelectedWeekdays((prev) => {
      const next = new Set(prev);
      next.has(weekday) ? next.delete(weekday) : next.add(weekday);
      return next;
    });
  };

  /**
   * Clear the selected weekday
   */
  const handleClearAdvancedWeekday = () => {
    setAdvancedSelectedWeekdays(new Set());
  };

  /**
   * Get occurrence count for a specific weekday in the current month
   * @param {string} weekday - Weekday name (e.g., "Monday")
   * @returns {number} Count of occurrences
   */
  const getWeekdayOccurrenceCount = (weekday) => {
    if (!gridMonthId || calDays.length === 0) return 0;
    return calDays.filter(d => d.day_of_week === weekday).length;
  };

  /**
   * Toggle a specific date in/out of advancedSelectedDates Set
   * @param {number} dayNum - 1-based day number
   */
  const handleAdvancedDateToggle = (dayNum) => {
    setAdvancedSelectedDates(prev => {
      const next = new Set(prev);
      next.has(dayNum) ? next.delete(dayNum) : next.add(dayNum);
      return next;
    });
  };

  /**
   * Clear all selected specific dates
   */
  const handleClearAdvancedDates = () => {
    setAdvancedSelectedDates(new Set());
  };

  /**
   * Handle classification dropdown change
   * @param {Event} e - Select change event
   */
  const handleAdvancedClassificationChange = (e) => {
    setAdvancedSelectedClassification(e.target.value || null);
  };

  /**
   * Perform the assignment API calls (weekday and/or manual)
   */
  const performAdvancedAssignment = async () => {
    setAdvancedIsAssigning(true);
    let weekdayResult = null;
    let manualResult = null;

    try {
      // Call assign-by-weekday if weekday selected
      for (const weekday of advancedSelectedWeekdays) {
        try {
          await assignByWeekday({
            day_of_week: weekday,
            day_type_id: advancedSelectedClassification,
            month_id: gridMonthId,
          });
          weekdayResult = {
            success: true,
            count: (weekdayResult?.count || 0) + getWeekdayOccurrenceCount(weekday),
          };
        } catch (err) {
          weekdayResult = { success: false, error: extractErrorMessage(err) };
          break;
        }
      }

      // Call manual-assign if specific dates selected
      if (advancedSelectedDates.size > 0) {
        try {
          const assignments = Array.from(advancedSelectedDates).map(dayNum => ({
            day_number: dayNum,
            day_type_id: advancedSelectedClassification,
          }));
          await manualAssignDayTypes(gridMonthId, assignments);
          manualResult = { success: true, count: advancedSelectedDates.size };
        } catch (err) {
          manualResult = { success: false, error: extractErrorMessage(err) };
        }
      }

      // Determine outcome and set message
      const weekdayOk = !weekdayResult || weekdayResult.success;
      const manualOk = !manualResult || manualResult.success;

      if (weekdayOk && manualOk) {
        const total = (weekdayResult?.count || 0) + (manualResult?.count || 0);
        setAdvancedMessage({
          type: 'success',
          text: `${total} day${total !== 1 ? 's' : ''} assigned successfully. ${generateAssignmentSummary()}`,
          timestamp: Date.now(),
        });
        // Clear selections on success
        setAdvancedSelectedWeekdays(new Set());
        setAdvancedSelectedDates(new Set());
        setAdvancedSelectedClassification(null);
        // Reload grid data
        handleLoadGridMonth(gridMonthId);
      } else if (!weekdayOk && !manualOk) {
        setAdvancedMessage({
          type: 'error',
          text: `Assignment failed. Weekday: ${weekdayResult?.error || 'unknown error'}. Dates: ${manualResult?.error || 'unknown error'}.`,
          timestamp: Date.now(),
        });
      } else {
        const successPart = weekdayOk
          ? `Assigned ${weekdayResult.count} weekday occurrence${weekdayResult.count !== 1 ? 's' : ''}`
          : `Assigned ${manualResult.count} specific date${manualResult.count !== 1 ? 's' : ''}`;
        const failPart = !weekdayOk
          ? `Failed to assign weekday occurrences: ${weekdayResult.error}`
          : `Failed to assign specific dates: ${manualResult.error}`;
        setAdvancedMessage({
          type: 'warning',
          text: `Partial success — ${successPart}. ${failPart}. Please retry.`,
          timestamp: Date.now(),
        });
        handleLoadGridMonth(gridMonthId);
      }
    } finally {
      setAdvancedIsAssigning(false);
    }
  };

  /**
   * Handle the Assign button click with validation
   */
  const handleAdvancedAssignClick = () => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      setAdvancedMessage({ type: 'error', text: errors.join(' • '), timestamp: Date.now() });
      return;
    }
    performAdvancedAssignment();
  };

  useEffect(() => {
    loadYearOptions();
    loadSetupData();
    loadGridData();
  }, [mode]);
  // Auto-dismiss success/warning messages after 5 seconds
  useEffect(() => {
    if (advancedMessage.type && advancedMessage.type !== 'error') {
      const timer = setTimeout(() => {
        setAdvancedMessage({ type: null, text: '', timestamp: null });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [advancedMessage.timestamp]);

  const loadYearOptions = async () => {
    try {
      setLoading(true);
      const res = await getYearOptions(mode);
      const opts = res.data?.data?.years || [];
      setYearOptions(opts);
      if (opts.length > 0) {
        setSelectedYear(opts[0]);
        setDefaultAcademicDates(opts[0]);
      }
    } catch (err) {
      console.error("Failed to load year options:", err);
    } finally {
      setLoading(false);
    }
  };


  const loadSetupData = async () => {
    try {
      // Load years
      const yearsRes = await getYears();
      const dbYears = yearsRes.data?.data || [];
      const transformedYears = dbYears.map((y) => {
        // DB columns can be lowercase (year_label_bs) or mixed (year_label_BS)
        const bsLabel = y.year_label_bs || y.year_label_BS || "";
        const adLabel = y.year_label_ad || y.year_label_AD || "";
        const startDate = y.start_date_ad || y.start_date_AD || y.start_date;
        const endDate   = y.end_date_ad   || y.end_date_AD   || y.end_date;
        const isBS = !!bsLabel && bsLabel.trim() !== "";
        let value = 0;
        if (isBS) {
          // bsLabel like "2082/83" → 2082, or just "2082"
          value = parseInt(bsLabel.split("/")[0]) || 0;
        } else {
          value = parseInt(adLabel.split("/")[0]) || parseInt(y.year_label) || 0;
        }
        return {
          id: y.id,
          mode: isBS ? "BS" : "AD",
          value,
          label: y.year_label || bsLabel || adLabel,
          start: startDate ? new Date(startDate) : null,
          end:   endDate   ? new Date(endDate)   : null,
          days: (startDate && endDate)
            ? Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1
            : 0,
          isCurrent: y.is_current || false,
        };
      });
      setYears(transformedYears);

      // Load categories
      const catsRes = await getDayCategories();
      const dbCategories = catsRes.data?.data || [];
      setCategories(dbCategories.map(c => ({ id: c.id, name: c.category_name || c.name || "" })));

      // Load classifications (day types)
      const typesRes = await getDayTypes();
      const dbTypes = typesRes.data?.data || [];
      setClassifications(dbTypes.map(t => ({
        id: t.id,
        name: t.day_type || t.name || "",
        categoryId: t.category_id || t.day_category_id || "",
      })));

    } catch (err) {
      console.error("Failed to load setup data:", err);
    }
  };

  const loadGridData = async () => {
    try {
      const [monthRes, typesRes] = await Promise.all([
        getMonths(),
        getDayTypes(),
      ]);
      setMonths(monthRes.data?.data || []);
      setDayTypes(typesRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load grid data:", err);
    }
  };

  const setDefaultAcademicDates = (year) => {
    if (mode === "BS") {
      setAcademicStart({ year, month: 1, day: 1 });
      const endInfo = bsMonthInfo(year, 12);
      setAcademicEnd({ year, month: 12, day: endInfo.days });
    } else {
      setAcademicStart({ value: `${year}-01-01` });
      setAcademicEnd({ value: `${year}-12-31` });
    }
  };

  const refreshYearPreview = () => {
    if (!selectedYear || !academicStart || !academicEnd) return null;
    try {
      const start = dateStateToAD(academicStart, mode);
      const end = dateStateToAD(academicEnd, mode);
      if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      const days = inclusiveDays(start, end);
      return { start, end, days };
    } catch {
      return null;
    }
  };

  const handleAddYear = async () => {
    if (!yearLabel.trim()) {
      alert("Enter a year label.");
      return;
    }
    if (!academicStart || !academicEnd) {
      alert("Select both academic dates.");
      return;
    }
    const start = dateStateToAD(academicStart, mode);
    const end = dateStateToAD(academicEnd, mode);
    const days = inclusiveDays(start, end);
    if (days <= 0) {
      alert("Academic end date must be on or after the start date.");
      return;
    }
    if (years.some((y) => y.mode === mode && y.value === selectedYear)) {
      alert(`${mode} year ${selectedYear} has already been added.`);
      return;
    }

    try {
      setLoading(true);
      let savedYear;
      
      if (mode === "BS") {
        // Use seedNepaliYear for BS - automatically creates year + 12 months
        const res = await seedNepaliYear({
          bs_year: selectedYear,
          set_as_current: isCurrentYear,
        });
        savedYear = res.data?.data?.year;
      } else {
        // Use createYear for AD
        const yearData = {
          year_label: yearLabel,
          year_label_AD: String(selectedYear),
          year_label_BS: `${selectedYear}/${String(selectedYear + 1).slice(-2)}`,
          start_date_AD: fmtAD(start),
          end_date_AD: fmtAD(end),
          start_date_BS: fmtAD(start),
          end_date_BS: fmtAD(end),
          start_date: fmtAD(start),
          end_date: fmtAD(end),
          is_current: isCurrentYear,
        };
        const res = await createYear(yearData);
        savedYear = res.data?.data;
      }
      
      if (!savedYear) throw new Error("Failed to save year");
      const newYear = {
        id: savedYear.id,
        mode,
        value: selectedYear,
        label: yearLabel,
        start,
        end,
        days,
        isCurrent: isCurrentYear,
      };
      if (isCurrentYear) {
        setYears((prevYears) =>
          prevYears.map((y) =>
            y.mode === mode ? { ...y, isCurrent: false } : y
          )
        );
      }
      // Reload everything from DB to get accurate data
      await loadSetupData();
      await loadGridData();
      setYearLabel("");
      setIsCurrentYear(false);
      alert("Year saved successfully! Months auto-created.");
    } catch (err) {
      console.error("Failed to save year:", err);
      alert("Failed to save year: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYear = async (id) => {
    try {
      await deleteYear(id);
      setYears((prevYears) => prevYears.filter((y) => y.id !== id));
      alert("Year deleted!");
    } catch (err) {
      console.error("Failed to delete year:", err);
      alert("Failed to delete year");
    }
  };

  const handleAddCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      alert("Enter a category name.");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert("That category already exists.");
      return;
    }
    try {
      setLoading(true);
      const res = await createDayCategory({ category_name: name });
      const saved = res.data?.data;
      if (!saved) throw new Error("Failed");
      setCategories((prev) => [...prev, { id: saved.id, name }]);
      setCategoryName("");
      alert("Category saved!");
    } catch (err) {
      console.error("Failed to save category:", err);
      alert("Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteDayCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setClassifications((prev) =>
        prev.map((cl) =>
          cl.categoryId === id ? { ...cl, categoryId: "" } : cl
        )
      );
      alert("Category deleted!");
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert("Failed to delete category");
    }
  };

  const handleAddClassification = async () => {
    const name = classificationName.trim();
    if (!name) {
      alert("Enter a classification name.");
      return;
    }
    if (
      classifications.some((c) => c.name.toLowerCase() === name.toLowerCase())
    ) {
      alert("That classification already exists.");
      return;
    }
    try {
      setLoading(true);
      const data = {
        day_type: name,
        category_id: classificationCategory || null,
      };
      const res = await createDayType(data);
      const saved = res.data?.data;
      if (!saved) throw new Error("Failed");
      setClassifications((prev) => [
        ...prev,
        { id: saved.id, name, categoryId: classificationCategory },
      ]);
      setClassificationName("");
      setClassificationCategory("");
      alert("Classification saved!");
    } catch (err) {
      console.error("Failed to save classification:", err);
      alert("Failed to save classification");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassification = async (id) => {
    try {
      await deleteDayType(id);
      setClassifications((prev) => prev.filter((c) => c.id !== id));
      alert("Classification deleted!");
    } catch (err) {
      console.error("Failed to delete classification:", err);
      alert("Failed to delete classification");
    }
  };

  const handleOpenAcademicDatePicker = (target) => {
    setAcademicDateTarget(target);
    const state = target === "academicStart" ? academicStart : academicEnd;
    if (state) {
      setPopupYear(mode === "BS" ? state.year : new Date().getFullYear());
      setPopupMonth(mode === "BS" ? state.month : new Date().getMonth() + 1);
      const iso = fmtAD(dateStateToAD(state, mode));
      setPopupSelectedISO(iso);
    }
    setShowPopupCalendar(true);
  };

  const handleClosePopupCalendar = () => {
    setShowPopupCalendar(false);
  };

  const handleSelectPopupDay = (iso, bsDay) => {
    setPopupSelectedISO(iso);
    if (mode === "BS") {
      if (academicDateTarget === "academicStart") {
        setAcademicStart({ year: popupYear, month: popupMonth, day: bsDay });
      }
      if (academicDateTarget === "academicEnd") {
        setAcademicEnd({ year: popupYear, month: popupMonth, day: bsDay });
      }
    } else {
      if (academicDateTarget === "academicStart") {
        setAcademicStart({ value: iso });
      }
      if (academicDateTarget === "academicEnd") {
        setAcademicEnd({ value: iso });
      }
    }
    setShowPopupCalendar(false);
  };

  const handleShiftPopupMonth = (delta) => {
    let newMonth = popupMonth + delta;
    let newYear = popupYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    const min = mode === "BS" ? BS_YEAR_MIN : AD_YEAR_MIN;
    const max = mode === "BS" ? BS_YEAR_MAX : AD_YEAR_MAX;
    newYear = Math.min(max, Math.max(min, newYear));
    setPopupYear(newYear);
    setPopupMonth(newMonth);
  };

  const handlePopupGoToday = () => {
    const today = new Date();
    if (mode === "BS") {
      for (let y = BS_YEAR_MIN; y <= BS_YEAR_MAX; y++) {
        for (let m = 1; m <= 12; m++) {
          const info = bsMonthInfo(y, m);
          const end = addDays(info.adStart, info.days - 1);
          if (today >= info.adStart && today <= end) {
            setPopupYear(y);
            setPopupMonth(m);
            handleSelectPopupDay(
              fmtAD(today),
              Math.round((today - info.adStart) / 86400000) + 1
            );
            return;
          }
        }
      }
    } else {
      setPopupYear(today.getFullYear());
      setPopupMonth(today.getMonth() + 1);
      handleSelectPopupDay(fmtAD(today), today.getDate());
    }
  };

  const handlePopupClear = () => {
    setPopupSelectedISO(null);
  };

  // Grid functions
  const handleLoadGridMonth = async (monthId) => {
    if (!monthId) return;
    setGridMonthId(monthId);
    setAdvancedSelectedWeekdays(new Set());
    setAdvancedSelectedDates(new Set());
    setAdvancedMessage({ type: null, text: "", timestamp: null });
    try {
      const res = await getCalendarDays(monthId, mode);
      setCalDays(res.data?.data || []);
      setBulkSelected(new Set());
    } catch (err) {
      console.error("Failed to load grid:", err);
    }
  };

  const toggleBulk = (id) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkAssign = async () => {
    if (bulkSelected.size === 0) {
      alert("Select days first");
      return;
    }
    if (!bulkType) {
      alert("Select a type");
      return;
    }
    try {
      const assignments = Array.from(bulkSelected).map((id) => ({
        calendarDayId: id,
        dayTypeId: bulkType,
      }));
      await bulkAssignDayTypes(assignments);
      alert("Bulk update successful");
      handleLoadGridMonth(gridMonthId);
    } catch (err) {
      console.error("Bulk assign failed:", err);
    }
  };

  const handleExportCSV = () => {
    if (calDays.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = ["Day Number", "Day Type", "Category"];
    const rows = calDays.map((d) => [
      d.day_number,
      d.day_type || "Unassigned",
      d.category_name || "N/A",
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `academic_calendar_${gridMonthId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Calendar exported successfully");
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file || !gridMonthId) {
      alert("No file selected or month loaded");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split("\n").slice(1);
        const assignments = [];
        for (const line of lines) {
          if (!line.trim()) continue;
          const [dayNum, typeName] = line.split(",");
          const typeObj = dayTypes.find((t) => t.day_type === typeName.trim());
          const dayObj = calDays.find((d) => d.day_number === parseInt(dayNum));
          if (typeObj && dayObj) {
            assignments.push({
              calendarDayId: dayObj.id,
              dayTypeId: typeObj.id,
            });
          }
        }
        if (assignments.length > 0) {
          await bulkAssignDayTypes(assignments);
          alert(`Imported ${assignments.length} assignments`);
          handleLoadGridMonth(gridMonthId);
        } else {
          alert("No valid assignments found in CSV");
        }
      } catch (err) {
        console.error("CSV import failed:", err);
        alert("Failed to parse CSV");
      }
    };
    reader.readAsText(file);
  };

  const preview = refreshYearPreview();
  const tableYears = years.filter((y) => y.mode === mode || years.length === 0);
  const allYears = years;
  const gridMonthOptions = months.filter((m) => m.year_id === years[0]?.id);

  return (
    <div className="calendar-settings-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Calendar Setup &amp; Configuration</h1>
          <p className="page-sub">
            Choose the calendar mode, select academic dates, and configure day
            classifications across years 2082-2120.
          </p>
        </div>
        <div className="mode-toggle" role="tablist" aria-label="Calendar mode">
          <button
            className={`mode-btn ${mode === "BS" ? "active" : ""}`}
            onClick={() => setMode("BS")}
          >
            Bikram Sambat
          </button>
          <button
            className={`mode-btn ${mode === "AD" ? "active" : ""}`}
            onClick={() => setMode("AD")}
          >
            English (AD)
          </button>
        </div>
      </div>

      <div className="mode-banner">
        📅 Running in{" "}
        <b>{mode === "BS" ? "Bikram Sambat" : "English (AD)"}</b> mode —
        year list shows{" "}
        {mode === "BS"
          ? `${BS_YEAR_MIN}–${BS_YEAR_MAX}`
          : `${AD_YEAR_MIN}–${AD_YEAR_MAX}`}
        , and date pickers use the{" "}
        {mode === "BS" ? "Nepali calendar" : "Gregorian calendar"}.
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "setup" ? "active" : ""}`}
          onClick={() => setActiveTab("setup")}
        >
          Setup
        </button>
        <button
          className={`tab-btn ${activeTab === "grid" ? "active" : ""}`}
          onClick={() => setActiveTab("grid")}
        >
          Day Assignments
        </button>
        <button
          className={`tab-btn ${activeTab === "portability" ? "active" : ""}`}
          onClick={() => setActiveTab("portability")}
        >
          Import/Export
        </button>
      </div>

      {/* TAB: SETUP */}
      {activeTab === "setup" && (
        <>
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="panel-title">
                  <span className="num">1</span>Academic year
                </p>
                <p className="panel-desc">
                  {mode === "BS"
                    ? "Pick a BS year from the range 2082-2120 — nothing is typed by hand."
                    : "Pick an AD year from the range 2025-2050 — nothing is typed by hand."}
                </p>
              </div>
              <span className="badge badge-auto">Auto-calculated</span>
            </div>

            <div className="grid-4" style={{ alignItems: "end" }}>
              <div className="field">
                <label>
                  {mode === "BS" ? "Bikram Sambat year" : "AD year"}
                </label>
                <select
                  value={selectedYear || ""}
                  onChange={(e) => {
                    const year = parseInt(e.target.value);
                    setSelectedYear(year);
                    setDefaultAcademicDates(year);
                  }}
                >
                  <option value="">Select a year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="yearLabel">Year label</label>
                <input
                  type="text"
                  id="yearLabel"
                  value={yearLabel}
                  onChange={(e) => setYearLabel(e.target.value)}
                  placeholder="e.g. Academic Year 2082/83"
                />
              </div>
              <div className="field">
                <label>Academic start date</label>
                {mode === "BS" ? (
                  <button
                    className="btn"
                    type="button"
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                    }}
                    onClick={() =>
                      handleOpenAcademicDatePicker("academicStart")
                    }
                  >
                    {academicStart
                      ? `${academicStart.year}-${pad2(academicStart.month)}-${pad2(
                          academicStart.day
                        )} · ${BS_MONTHS[academicStart.month - 1]}`
                      : "Select date"}
                  </button>
                ) : (
                  <input
                    type="date"
                    value={academicStart?.value || ""}
                    onChange={(e) =>
                      setAcademicStart({ value: e.target.value })
                    }
                  />
                )}
              </div>
              <div className="field">
                <label>Academic end date</label>
                {mode === "BS" ? (
                  <button
                    className="btn"
                    type="button"
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                    }}
                    onClick={() => handleOpenAcademicDatePicker("academicEnd")}
                  >
                    {academicEnd
                      ? `${academicEnd.year}-${pad2(academicEnd.month)}-${pad2(
                          academicEnd.day
                        )} · ${BS_MONTHS[academicEnd.month - 1]}`
                      : "Select date"}
                  </button>
                ) : (
                  <input
                    type="date"
                    value={academicEnd?.value || ""}
                    onChange={(e) => setAcademicEnd({ value: e.target.value })}
                  />
                )}
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: "12px", alignItems: "end" }}>
              <div className="field" style={{ flexDirection: "row", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="isCurrentYear"
                  checked={isCurrentYear}
                  onChange={(e) => setIsCurrentYear(e.target.checked)}
                  style={{
                    width: "15px",
                    height: "15px",
                    accentColor: "var(--accent)",
                    cursor: "pointer",
                  }}
                />
                <label
                  htmlFor="isCurrentYear"
                  style={{
                    fontSize: "12.5px",
                    color: "var(--text-dim)",
                    fontWeight: "500",
                    textTransform: "none",
                    letterSpacing: "0",
                  }}
                >
                  Mark as current year
                </label>
              </div>
              <button className="btn btn-primary" onClick={handleAddYear}>
                + Add year
              </button>
            </div>

            {preview && (
              <div className="preview-box">
                <div>
                  <div className="preview-line">
                    <b>
                      {mode === "BS" ? "BS " + selectedYear : "AD " + selectedYear}
                    </b>{" "}
                    — {preview.days > 0 ? preview.days : "Invalid"} total days
                  </div>
                  <div className="preview-sub">
                    AD equivalent → {fmtAD(preview.start)} → {fmtAD(preview.end)}
                  </div>
                </div>
                <span className="badge badge-purple">Computed automatically</span>
              </div>
            )}

            {!preview && (
              <div className="preview-box empty">
                Select the academic start and end dates.
              </div>
            )}

            <table>
              <thead>
                <tr>
                  <th>Year label</th>
                  <th>AD range</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tableYears.length === 0 ? (
                  <tr className="row-empty">
                    <td colSpan="5">No academic years added yet.</td>
                  </tr>
                ) : (
                  tableYears.map((y) => (
                    <tr key={y.id}>
                      <td>
                        <strong>{y.label}</strong>
                        <div className="preview-sub">
                          {y.mode === "BS" ? "BS " + y.value : "AD " + y.value}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-dim)" }}>
                        {fmtAD(y.start)} → {fmtAD(y.end)}
                      </td>
                      <td>{y.days}</td>
                      <td>
                        {y.isCurrent ? (
                          <span className="badge badge-auto">Current</span>
                        ) : (
                          <span
                            style={{
                              color: "var(--text-faint)",
                              fontSize: "11.5px",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          onClick={() => handleDeleteYear(y.id)}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <section className="setup-section">
            <div className="setup-section-head">
              <span className="section-icon">◇</span>
              <h2>Day Categories</h2>
              <span className="count-badge">{categories.length}</span>
              <span className="section-chevron">⌃</span>
            </div>
            <div className="setup-section-body">
              <div className="info-strip">
                ⓘ Categories group day types (e.g., "Holiday" contains "Public
                Holiday", "Saturday", etc.).
              </div>
              <div className="inline-form">
                <div className="field">
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCategory();
                    }}
                    placeholder="Category name (e.g., Holiday)"
                  />
                </div>
                <button className="btn btn-primary" onClick={handleAddCategory}>
                  + Add
                </button>
              </div>
              <div className="item-list">
                {categories.length === 0 ? (
                  <div className="empty-message">
                    No categories yet. Add one above.
                  </div>
                ) : (
                  categories.map((category) => (
                    <div key={category.id} className="setup-item">
                      <span>{escapeHtml(category.name)}</span>
                      <button
                        className="icon-btn"
                        onClick={() => handleDeleteCategory(category.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="setup-section">
            <div className="setup-section-head">
              <span className="section-icon">⚙</span>
              <h2>Day Classifications</h2>
              <span className="count-badge">{classifications.length}</span>
              <span className="section-chevron">⌃</span>
            </div>
            <div className="setup-section-body">
              <div className="field" style={{ marginBottom: "14px" }}>
                <label>ADD NEW CLASSIFICATION</label>
              </div>
              <div className="inline-form">
                <div className="field">
                  <label>TYPE NAME</label>
                  <input
                    type="text"
                    value={classificationName}
                    onChange={(e) => setClassificationName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddClassification();
                    }}
                    placeholder="e.g., Public Holiday"
                  />
                </div>
                <div className="field">
                  <label>CATEGORY</label>
                  <select
                    value={classificationCategory}
                    onChange={(e) => setClassificationCategory(e.target.value)}
                  >
                    <option value="">None</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {escapeHtml(category.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleAddClassification}
                >
                  + Add Type
                </button>
              </div>
              <div className="item-list">
                {classifications.length === 0 ? (
                  <div className="empty-message">No day types yet.</div>
                ) : (
                  classifications.map((classification) => {
                    const category = categories.find(
                      (item) =>
                        String(item.id) === String(classification.categoryId)
                    );
                    return (
                      <div key={classification.id} className="setup-item">
                        <span>
                          {escapeHtml(classification.name)}
                          <small>
                            {category
                              ? escapeHtml(category.name)
                              : "No category"}
                          </small>
                        </span>
                        <button
                          className="icon-btn"
                          onClick={() =>
                            handleDeleteClassification(classification.id)
                          }
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* TAB: DAY ASSIGNMENTS */}
      {activeTab === "grid" && (
        <>
          {/* Existing Bulk Grid Assignment Interface */}
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="panel-title">
                  <span className="num">2</span>Day Assignments (Bulk Grid)
                </p>
                <p className="panel-desc">
                  Select multiple days from the grid and assign a single day type.
                </p>
              </div>
            </div>

          <div className="grid-3" style={{ marginBottom: "14px" }}>
            <div className="field">
              <label>Select Year</label>
              <select
                value={gridYearId}
                onChange={(e) => {
                  setGridYearId(e.target.value);
                  setGridMonthId("");
                  setCalDays([]);
                  setAdvancedSelectedWeekdays(new Set());
                  setAdvancedSelectedDates(new Set());
                }}
              >
                <option value="">Choose a year</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label} ({y.mode === "BS" ? "BS " + y.value : "AD " + y.value})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Select Month</label>
              <select
                value={gridMonthId}
                onChange={(e) => handleLoadGridMonth(e.target.value)}
                disabled={!gridYearId}
              >
                <option value="">Choose a month</option>
                {months
                  .filter(m => String(m.year_id) === String(gridYearId))
                  .sort((a, b) => (a.bs_month_index || 0) - (b.bs_month_index || 0))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.month_name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="field">
              <label>Bulk Assign Type</label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value)}
              >
                <option value="">Select type</option>
                {dayTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.day_type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {gridMonthId && (
            <>
              <div className="grid-2" style={{ marginBottom: "14px" }}>
                <button className="btn btn-primary" onClick={handleBulkAssign}>
                  ✓ Assign Selected to {bulkType ? "Type" : "..."}
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setCalDays((prev) =>
                      prev.map((d) =>
                        bulkSelected.has(d.id) ? { ...d, day_type_id: null } : d
                      )
                    );
                    setBulkSelected(new Set());
                  }}
                >
                  🗑 Clear Selected
                </button>
              </div>

              <div className="cal-grid">
                {calDays.map((day) => (
                  <button
                    key={day.id}
                    className={`cal-grid-item ${
                      bulkSelected.has(day.id) ? "selected" : ""
                    } ${day.day_type ? "assigned" : "unassigned"}`}
                    onClick={() => toggleBulk(day.id)}
                  >
                    <div className="day-number">{day.day_number}</div>
                    <div className="day-type">
                      {day.day_type ? day.day_type : "—"}
                    </div>
                  </button>
                ))}
              </div>

              <div className="preview-box" style={{ marginTop: "14px" }}>
                <div>
                  <div className="preview-line">
                    Selected: {bulkSelected.size} of {calDays.length} days
                  </div>
                  <div className="preview-sub">
                    Click days to select, then choose a type to assign.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        </>
      )}

      {/* TAB: IMPORT/EXPORT */}
      {activeTab === "portability" && (
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="panel-title">
                <span className="num">3</span>Import/Export
              </p>
              <p className="panel-desc">
                Export and import calendar day assignments via CSV.
              </p>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: "14px" }}>
            <div className="field">
              <label>Select Month to Export</label>
              <select
                value={exportMonthId}
                onChange={(e) => setExportMonthId(e.target.value)}
              >
                <option value="">Choose a month</option>
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.month_name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (exportMonthId) {
                    setGridMonthId(exportMonthId);
                    setTimeout(() => handleExportCSV(), 100);
                  } else {
                    alert("Select a month first");
                  }
                }}
              >
                ↓ Export CSV
              </button>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: "14px" }}>
            <div className="field">
              <label>Import CSV for Selected Month</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div
                className="info-strip"
                style={{
                  fontSize: "11px",
                  padding: "8px 10px",
                  marginBottom: "0",
                }}
              >
                First load a month in the Day Assignments tab.
              </div>
            </div>
          </div>

          <div className="preview-box">
            <div>
              <div className="preview-line">📋 CSV Format</div>

          {gridMonthId && (
            <div className="panel" style={{ marginBottom: "14px" }}>
              <div className="panel-head">
                <div>
                  <p className="panel-title">Select days to assign</p>
                  <p className="panel-desc">
                    Choose one or more weekdays, specific dates, or both.
                  </p>
                </div>
              </div>

              <div className="field" style={{ marginBottom: "12px" }}>
                <label>Weekdays</label>
                <div className="grid-4">
                  {WEEKDAYS_EN.map((shortName, index) => {
                    const weekday = [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ][index];
                    const selected = advancedSelectedWeekdays.has(weekday);
                    const count = getWeekdayOccurrenceCount(weekday);
                    return (
                      <button
                        key={weekday}
                        type="button"
                        className={`btn ${selected ? "btn-primary" : ""}`}
                        onClick={() => handleAdvancedWeekdayToggle(weekday)}
                        style={{ justifyContent: "space-between" }}
                      >
                        <span>{weekday}</span>
                        <small>{count}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="field" style={{ marginBottom: "12px" }}>
                <label>Specific dates in selected month</label>
                <div className="cal-grid">
                  {calDays.map((day) => {
                    const selected = advancedSelectedDates.has(day.day_number);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        className={`cal-grid-item ${selected ? "selected" : ""} ${day.day_type ? "assigned" : "unassigned"}`}
                        onClick={() => handleAdvancedDateToggle(day.day_number)}
                        aria-pressed={selected}
                      >
                        <div className="day-number">{day.day_number}</div>
                        <div className="day-type">{day.day_of_week}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid-2" style={{ alignItems: "end" }}>
                <div className="field">
                  <label>Day classification</label>
                  <select
                    value={advancedSelectedClassification || ""}
                    onChange={handleAdvancedClassificationChange}
                  >
                    <option value="">Select classification</option>
                    {classifications.map((classification) => (
                      <option key={classification.id} value={classification.id}>
                        {classification.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAdvancedAssignClick}
                  disabled={!canAssign()}
                >
                  {advancedIsAssigning ? "Assigning..." : "Assign selected days"}
                </button>
              </div>

              <div className="preview-box" style={{ marginTop: "12px" }}>
                <div className="preview-line">{generateAssignmentSummary()}</div>
                {advancedMessage.text && (
                  <div className="preview-sub">{advancedMessage.text}</div>
                )}
              </div>
            </div>
          )}
              <div className="preview-sub" style={{ marginTop: "6px" }}>
                Headers: Day Number, Day Type, Category
                <br />
                Example: 1, Public Holiday, Holiday
              </div>
            </div>
          </div>
        </div>
      )}

      {showPopupCalendar && (
        <PopupCalendar
          mode={mode}
          year={popupYear}
          month={popupMonth}
          selectedISO={popupSelectedISO}
          onSelectDay={handleSelectPopupDay}
          onClose={handleClosePopupCalendar}
          onShiftMonth={handleShiftPopupMonth}
          onGoToday={handlePopupGoToday}
          onClear={handlePopupClear}
        />
      )}

      <footer className="note">
        Configure categories and classifications before assigning day types to
        calendar dates. Year range: {BS_YEAR_MIN}-{BS_YEAR_MAX} (BS) / {AD_YEAR_MIN}-{AD_YEAR_MAX} (AD)
      </footer>
    </div>
  );
};

// ============================================================================
// POPUP CALENDAR COMPONENT
// ============================================================================

const PopupCalendar = ({
  mode,
  year,
  month,
  selectedISO,
  onSelectDay,
  onClose,
  onShiftMonth,
  onGoToday,
  onClear,
}) => {
  const renderWeekRow = () => {
    if (mode === "BS") {
      return WEEKDAYS_NP.map((w, i) => (
        <div
          key={i}
          className={`cal-weekcell ${i === 0 ? "weekend" : ""}`}
        >
          <span className="np">{w[0]}</span>
          <span className="en">{w[1]}</span>
        </div>
      ));
    } else {
      return WEEKDAYS_EN.map((w, i) => (
        <div
          key={i}
          className={`cal-weekcell ${i === 0 ? "weekend" : ""}`}
        >
          <span className="np" style={{ color: "var(--text)" }}>
            {w}
          </span>
        </div>
      ));
    }
  };

  const renderDayGrid = () => {
    let cells = [];
    let info, startWeekday, title;

    if (mode === "BS") {
      info = bsMonthInfo(year, month);
      startWeekday = info.adStart.getDay();
      title = `${pad2(month)} · ${BS_MONTHS[month - 1]} ${year}`;

      for (let i = 0; i < startWeekday; i++) {
        cells.push(
          <div key={`empty-${i}`} className="cal-day empty"></div>
        );
      }

      const todayISO = fmtAD(new Date());
      for (let d = 1; d <= info.days; d++) {
        const adDate = addDays(info.adStart, d - 1);
        const iso = fmtAD(adDate);
        const wd = adDate.getDay();
        const isToday = iso === todayISO;
        const isSel = iso === selectedISO;

        cells.push(
          <button
            key={`day-${d}`}
            className={`cal-day ${wd === 0 ? "weekend" : ""} ${
              isToday ? "today" : ""
            } ${isSel ? "selected" : ""}`}
            onClick={() => onSelectDay(iso, d)}
          >
            <span className="num">{toNepaliNum(d)}</span>
            <span className="sub">
              {adDate.getMonth() + 1}/{adDate.getDate()}
            </span>
          </button>
        );
      }
    } else {
      info = adMonthInfo(year, month);
      startWeekday = info.adStart.getDay();
      title = `${AD_MONTHS[month - 1]} ${year}`;

      for (let i = 0; i < startWeekday; i++) {
        cells.push(
          <div key={`empty-${i}`} className="cal-day empty"></div>
        );
      }

      const todayISO = fmtAD(new Date());
      for (let d = 1; d <= info.days; d++) {
        const adDate = new Date(year, month - 1, d);
        const iso = fmtAD(adDate);
        const wd = adDate.getDay();
        const isToday = iso === todayISO;
        const isSel = iso === selectedISO;

        cells.push(
          <button
            key={`day-${d}`}
            className={`cal-day ad-day ${wd === 0 ? "weekend" : ""} ${
              isToday ? "today" : ""
            } ${isSel ? "selected" : ""}`}
            onClick={() => onSelectDay(iso, d)}
          >
            <span className="num">{d}</span>
          </button>
        );
      }
    }

    return { cells, title };
  };

  const { cells, title } = renderDayGrid();

  return (
    <div className="cal-modal-backdrop open" onClick={onClose}>
      <div className="cal-popup" onClick={(e) => e.stopPropagation()}>
        <div className="cal-popup-topbar"></div>
        <div className="cal-popup-head">
          <button
            className="cal-popup-navbtn"
            onClick={() => onShiftMonth(-1)}
          >
            ‹
          </button>
          <div className="cal-popup-title">
            {title}
            <small>{mode === "BS" ? "Bikram Sambat" : "English (AD)"}</small>
          </div>
          <button
            className="cal-popup-navbtn"
            onClick={() => onShiftMonth(1)}
          >
            ›
          </button>
        </div>
        <div className="cal-weekrow">{renderWeekRow()}</div>
        <div className="cal-daygrid">{cells}</div>
        <div className="cal-popup-actions">
          <button onClick={onGoToday}>⏱ Today</button>
          <button onClick={onClear}>🗑 Clear</button>
          <button className="close-btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarSettings;