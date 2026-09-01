import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  DownloadCloud,
  UploadCloud,
  Info,
  Check,
  Filter,
  Edit,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

// API
import {
  getMonths,
  createMonth,
  updateMonth,
  deleteMonth,
  getAvailableDayTypes,
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
  generateCalendarDays,
  getCalendarDays,
  getCalendarDaysByYear,
  assignDayType,
  assignByWeekday,
  bulkAssignDayTypes,
  refreshYearlyStats,
} from "../../api/calendarApi";

// Utils
import {
  BS_MONTHS,
  getDaysInBsMonth,
  bsToAd,
  adToBs,
  getTodayBs,
  prevBsMonth,
  nextBsMonth,
} from "../../utils/bsCalendar";
import { dayColor } from "../../utils/calendarStyles";
import { useSettings } from "../../context/SettingsContext";
import UniversalDatePicker from "../common/UniversalDatePicker";

const AD_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SetupSection = ({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="border-b border-slate-800/50 last:border-b-0 overflow-hidden transition-all duration-300">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
    >
      <div className="flex items-center gap-4">
        <Icon
          size={16}
          className="text-slate-500 group-hover:text-indigo-400 transition-colors"
        />
        <h3 className="text-base font-black text-white tracking-tight">
          {title}
        </h3>
      </div>
      <div
        className={clsx(
          "text-slate-400 transition-transform duration-300",
          isExpanded ? "rotate-180" : "rotate-0",
        )}
      >
        <Filter size={16} className="stroke-[3]" />
      </div>
    </button>
    <div
      className={clsx(
        "px-14 pb-6 flex flex-col gap-4 overflow-hidden transition-all duration-300",
        isExpanded ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0 pb-0",
      )}
    >
      {children}
    </div>
  </div>
);

const AcademicCalendar = () => {
  const { settings, updateSetting } = useSettings();
  const calendarType = settings.calendar_type || "BS";
  const [activeTab, setActiveTab] = useState("setup"); // 'setup' | 'grid'
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data
  const [months, setMonths] = useState([]);
  const [years, setYears] = useState([]);
  const [dayTypes, setDayTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  // Setup Form State
  const [newMonth, setNewMonth] = useState({
    month_name: "",
    year_id: "",
    bs_month_index: 1,
    start_date: "",
    end_date: "",
    start_day: "",
    end_day: "",
    start_weekday: "",
    end_weekday: "",
    start_day_info: "",
    end_day_info: "",
    is_active: true,
  });
  const [newYear, setNewYear] = useState({
    year_label: "",
    year_label_AD: "",
    year_label_BS: "",
    start_date_AD: "",
    end_date_AD: "",
    start_date_BS: "",
    end_date_BS: "",
    is_current: false,
  });
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeCategoryId, setNewTypeCategoryId] = useState("");

  // Grid Editor State
  const [gridYearId, setGridYearId] = useState("");
  const [gridMonthId, setGridMonthId] = useState("");
  const [calDays, setCalDays] = useState([]);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkType, setBulkType] = useState("");
  const [monthFilterYear, setMonthFilterYear] = useState("all");
  const [weekdayBulkType, setWeekdayBulkType] = useState("");
  const [weekdayBulkDay, setWeekdayBulkDay] = useState("");
  const [weekdayBulkScope, setWeekdayBulkScope] = useState("month");
  const [weekdayBulkMonthId, setWeekdayBulkMonthId] = useState("");

  // Export State
  const [exportMonthId, setExportMonthId] = useState("");

  // Accordion State for Setup Tab
  const [expanded, setExpanded] = useState({
    years: true,
    types: false,
    addMonth: false,
    categories: false,
    monthsList: false,
  });

  const [editingMonthId, setEditingMonthId] = useState(null);
  const [editMonthData, setEditMonthData] = useState(null);
  const [editingYearId, setEditingYearId] = useState(null);
  const [editYearData, setEditYearData] = useState(null);

  const [overviewStats, setOverviewStats] = useState({
    total: 0,
    working_days: 0,
    unassigned: 0,
  });
  const [overviewYearLabel, setOverviewYearLabel] = useState("");

  const overviewYear = useMemo(() => {
    return years.find((y) => y.is_current) || years[0] || null;
  }, [years]);

  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  /* ── Load Initial Data ── */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, yRes, tRes, cRes] = await Promise.all([
        getMonths(),
        getYears(),
        getDayTypes(),
        getDayCategories(),
      ]);
      setMonths(mRes.data?.data || []);
      setYears(yRes.data?.data || []);
      setDayTypes(tRes.data?.data || []);
      setCategories(cRes.data?.data || []);

      // Defaults
      if (yRes.data?.data?.length > 0 && !gridYearId) {
        setGridYearId(yRes.data.data[0].id);
      }
    } catch (error) {
      console.error("Initial Load Error:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  }, [gridYearId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  /* ── Grid Loading ── */
  const fetchGridDays = useCallback(async () => {
    if (!gridMonthId) return setCalDays([]);
    setBusy(true);
    try {
      const res = await getCalendarDays(gridMonthId, calendarType);
      setCalDays(res.data?.data || []);
      setBulkSelected(new Set());
    } catch (e) {
      toast.error("Failed to load grid days");
    } finally {
      setBusy(false);
    }
  }, [gridMonthId, calendarType]);

  useEffect(() => {
    if (activeTab === "grid" && gridMonthId) {
      fetchGridDays();
    }
  }, [activeTab, gridMonthId, fetchGridDays]);

  const formatBsDate = (adDateStr) => {
    if (!adDateStr) return "";
    const bs = adToBs(new Date(adDateStr));
    if (!bs) return "";
    return `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
  };

  const getWeekdayName = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  /* ── Academic Year Handlers ── */
  const handleAddYear = async () => {
    if (!newYear.year_label) return toast.error("Enter a year label");
    if (!newYear.year_label_AD || !newYear.year_label_BS) {
      return toast.error("Enter both AD and BS year labels");
    }
    if (!newYear.start_date_AD || !newYear.end_date_AD) {
      return toast.error("Enter AD start and end dates");
    }
    if (!newYear.start_date_BS || !newYear.end_date_BS) {
      return toast.error("Enter BS start and end dates");
    }
    if (
      newYear.is_current &&
      overviewYear &&
      overviewYear.year_label &&
      overviewYear.year_label !== newYear.year_label
    ) {
      const ok = window.confirm(
        `Set ${newYear.year_label} as the current year? This will replace ${overviewYear.year_label}.`,
      );
      if (!ok) return;
    }
    if (years.some((y) => y.year_label === newYear.year_label))
      return toast.error("Year already exists");
    setBusy(true);
    try {
      await createYear({
        year_label: newYear.year_label,
        year_label_AD: newYear.year_label_AD,
        year_label_BS: newYear.year_label_BS,
        start_date_AD: newYear.start_date_AD,
        end_date_AD: newYear.end_date_AD,
        start_date_BS: newYear.start_date_BS,
        end_date_BS: newYear.end_date_BS,
        is_current: newYear.is_current,
      });
      toast.success("Year added");
      setNewYear({
        year_label: "",
        year_label_AD: "",
        year_label_BS: "",
        start_date_AD: "",
        end_date_AD: "",
        start_date_BS: "",
        end_date_BS: "",
        is_current: false,
      });
      loadAll();
    } catch (e) {
      toast.error("Failed to add year");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteYear = async (id, label) => {
    if (!window.confirm(`Delete ${label}? This will wipe ALL months and days.`))
      return;
    setBusy(true);
    try {
      await deleteYear(id);
      toast.success("Year deleted");
      loadAll();
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const startEditingYear = (year) => {
    setEditingYearId(year.id);
    setEditYearData({
      id: year.id,
      year_label: year.year_label || "",
      year_label_AD: year.year_label_AD || "",
      year_label_BS: year.year_label_BS || "",
      start_date_AD: year.start_date_AD || "",
      end_date_AD: year.end_date_AD || "",
      start_date_BS: year.start_date_BS || "",
      end_date_BS: year.end_date_BS || "",
      is_current: year.is_current || false,
    });
  };

  const handleUpdateYear = async () => {
    if (!editingYearId || !editYearData)
      return toast.error("Missing year data");
    if (
      !editYearData.year_label ||
      !editYearData.year_label_AD ||
      !editYearData.year_label_BS
    ) {
      return toast.error("Enter year label, AD label, and BS label");
    }
    if (!editYearData.start_date_AD || !editYearData.end_date_AD) {
      return toast.error("Enter AD start and end dates");
    }
    if (!editYearData.start_date_BS || !editYearData.end_date_BS) {
      return toast.error("Enter BS start and end dates");
    }

    // If setting as current, confirm replacement
    if (
      editYearData.is_current &&
      overviewYear &&
      overviewYear.id !== editingYearId
    ) {
      const ok = window.confirm(
        `Set ${editYearData.year_label} as the current year? This will replace ${overviewYear.year_label}.`,
      );
      if (!ok) return;
    }

    setBusy(true);
    try {
      await updateYear(editingYearId, {
        year_label: editYearData.year_label,
        year_label_AD: editYearData.year_label_AD,
        year_label_BS: editYearData.year_label_BS,
        start_date_AD: editYearData.start_date_AD,
        end_date_AD: editYearData.end_date_AD,
        start_date_BS: editYearData.start_date_BS,
        end_date_BS: editYearData.end_date_BS,
        is_current: editYearData.is_current,
      });
      toast.success("Year updated");
      setEditingYearId(null);
      setEditYearData(null);
      loadAll();
    } catch (e) {
      toast.error("Failed to update year");
    } finally {
      setBusy(false);
    }
  };

  /* ── Day Type Handlers ── */
  const handleAddDayType = async () => {
    if (!newTypeName) return toast.error("Enter type name");
    setBusy(true);
    try {
      await createDayType({
        day_type: newTypeName,
        category_id: newTypeCategoryId || null,
      });
      toast.success("Day type added");
      setNewTypeName("");
      setNewTypeCategoryId("");
      loadAll();
    } catch (e) {
      toast.error("Failed to add day type");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteDayType = async (id) => {
    setBusy(true);
    try {
      await deleteDayType(id);
      toast.success("Type removed");
      loadAll();
    } catch (e) {
      toast.error("Failed to remove type");
    } finally {
      setBusy(false);
    }
  };

  /* ── Month Handlers ── */
  const pickMonthValue = (month, keys) => {
    for (const key of keys) {
      const value = month?.[key];
      if (value) return value;
    }
    return "";
  };

  const deriveDayInfo = (dateStr) => {
    if (!dateStr) return { day: "", weekday: "", info: "" };
    const date = new Date(dateStr);
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    return {
      day: weekday,
      weekday,
      info: weekday,
    };
  };

  useEffect(() => {
    if (!newMonth.year_id || !newMonth.bs_month_index) return;

    const selectionName =
      calendarType === "BS"
        ? BS_MONTHS[newMonth.bs_month_index - 1]
        : AD_MONTHS[newMonth.bs_month_index - 1];

    const match = months.find((m) => {
      const matchYear = m.year_id === newMonth.year_id;
      const monthIndex = m.bs_month_index;
      const indexMatch = Number(monthIndex) === Number(newMonth.bs_month_index);
      const nameMatch = selectionName
        ? String(m.month_name || "")
            .toLowerCase()
            .includes(selectionName.toLowerCase())
        : false;
      return matchYear && (indexMatch || nameMatch);
    });

    if (!match) return;

    const startAd = pickMonthValue(match, [
      "month_start_date_ad",
      "month_start_date_AD",
      "start_date",
    ]);
    const endAd = pickMonthValue(match, [
      "month_end_date_ad",
      "month_end_date_AD",
      "end_date",
    ]);

    if (!startAd || !endAd) return;

    const startInfo = deriveDayInfo(startAd);
    const endInfo = deriveDayInfo(endAd);

    setNewMonth((prev) => {
      if (prev.start_date === startAd && prev.end_date === endAd) return prev;

      return {
        ...prev,
        start_date: startAd,
        end_date: endAd,
        start_day: startInfo.day,
        start_weekday: startInfo.weekday,
        start_day_info: startInfo.info,
        end_day: endInfo.day,
        end_weekday: endInfo.weekday,
        end_day_info: endInfo.info,
        month_name: prev.month_name || match.month_name || prev.month_name,
      };
    });
  }, [months, newMonth.year_id, newMonth.bs_month_index, calendarType]);

  const getDayFromDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (calendarType === "BS") {
      const bs = adToBs(date);
      return bs ? bs.day : "";
    }
    return date.getDate();
  };

  const handleAddMonth = async () => {
    if (
      !newMonth.month_name ||
      !newMonth.year_id ||
      !newMonth.start_date ||
      !newMonth.end_date
    ) {
      return toast.error("Complete all required fields");
    }
    const yearLabel = years.find((y) => y.id === newMonth.year_id)?.year_label;
    if (!yearLabel) {
      return toast.error("Select a valid academic year");
    }

    // Get weekday names from the AD dates (source of truth)
    const startWeekday = getWeekdayName(newMonth.start_date);
    const endWeekday = getWeekdayName(newMonth.end_date);

    const payload = {
      year_id: newMonth.year_id,
      year_label: yearLabel,
      month_name: newMonth.month_name,
      bs_month_index: newMonth.bs_month_index,
      // AD dates in YYYY-MM-DD format
      month_start_date_AD: newMonth.start_date,
      month_end_date_AD: newMonth.end_date,
      // BS dates converted from AD
      month_start_date_BS: formatBsDate(newMonth.start_date),
      month_end_date_BS: formatBsDate(newMonth.end_date),
      // Both use same weekday since they represent the same moment in time
      month_start_day_AD: startWeekday,
      month_end_day_AD: endWeekday,
      month_start_day_BS: startWeekday,
      month_end_day_BS: endWeekday,
      date_format: calendarType,
    };
    setBusy(true);
    try {
      await createMonth(payload);
      toast.success("Month created");
      setNewMonth({
        month_name: "",
        year_id: "",
        bs_month_index: 1,
        start_date: "",
        end_date: "",
        start_day: "",
        end_day: "",
        is_active: true,
      });
      loadAll();
    } catch (e) {
      toast.error("Failed to create month");
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
      loadAll();
    } catch (e) {
      toast.error("Failed to delete month");
    } finally {
      setBusy(false);
    }
  };

  const startEditing = (month) => {
    const startAd = pickMonthValue(month, [
      "month_start_date_ad",
      "month_start_date_AD",
      "start_date",
    ]);
    const endAd = pickMonthValue(month, [
      "month_end_date_ad",
      "month_end_date_AD",
      "end_date",
    ]);
    const dateFormat = String(month.date_format || calendarType).toUpperCase();
    const startDay =
      dateFormat === "AD"
        ? month.month_start_day_ad ||
          month.month_start_day_AD ||
          month.month_start_day_bs ||
          month.month_start_day_BS
        : month.month_start_day_bs ||
          month.month_start_day_BS ||
          month.month_start_day_ad ||
          month.month_start_day_AD;
    const endDay =
      dateFormat === "AD"
        ? month.month_end_day_ad ||
          month.month_end_day_AD ||
          month.month_end_day_bs ||
          month.month_end_day_BS
        : month.month_end_day_bs ||
          month.month_end_day_BS ||
          month.month_end_day_ad ||
          month.month_end_day_AD;

    setEditingMonthId(month.id);
    setEditMonthData({
      id: month.id,
      year_id: month.year_id,
      month_name: month.month_name || "",
      bs_month_index: month.bs_month_index || 1,
      start_date: startAd || "",
      end_date: endAd || "",
      start_day: startDay || "",
      end_day: endDay || "",
    });
  };

  const handleUpdateMonth = async () => {
    if (
      !editingMonthId ||
      !editMonthData?.start_date ||
      !editMonthData?.end_date
    ) {
      return toast.error("Select start and end dates");
    }

    // Get weekday names from the AD dates (source of truth)
    const startWeekday = getWeekdayName(editMonthData.start_date);
    const endWeekday = getWeekdayName(editMonthData.end_date);
    const yearLabel = years.find(
      (y) => y.id === editMonthData.year_id,
    )?.year_label;
    const payload = {
      month_name: editMonthData.month_name,
      bs_month_index: editMonthData.bs_month_index,
      // AD dates in YYYY-MM-DD format
      month_start_date_AD: editMonthData.start_date,
      month_end_date_AD: editMonthData.end_date,
      // BS dates converted from AD
      month_start_date_BS: formatBsDate(editMonthData.start_date),
      month_end_date_BS: formatBsDate(editMonthData.end_date),
      // Both use same weekday since they represent the same moment in time
      month_start_day_AD: startWeekday,
      month_end_day_AD: endWeekday,
      month_start_day_BS: startWeekday,
      month_end_day_BS: endWeekday,
      date_format: calendarType,
    };

    if (yearLabel) {
      payload.year_label = yearLabel;
    }

    setBusy(true);
    try {
      await updateMonth(editingMonthId, payload);
      toast.success("Month updated");
      setEditingMonthId(null);
      setEditMonthData(null);
      loadAll();
    } catch (e) {
      toast.error("Failed to update month");
    } finally {
      setBusy(false);
    }
  };

  /* ── Grid Assignment Handlers ── */
  const toggleBulk = (id) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkAssign = async (clear = false) => {
    if (bulkSelected.size === 0) return toast.error("Select days first");
    if (!clear && !bulkType) return toast.error("Select a type");

    setBusy(true);
    try {
      const assignments = Array.from(bulkSelected).map((id) => ({
        calendarDayId: id,
        dayTypeId: clear ? null : bulkType,
      }));
      await bulkAssignDayTypes(assignments);
      toast.success(clear ? "Selection cleared" : "Bulk update successful");
      fetchGridDays();
    } catch (e) {
      toast.error("Bulk update failed");
    } finally {
      setBusy(false);
    }
  };

  const handleAssignByWeekday = async () => {
    if (!weekdayBulkType) return toast.error("Select a day classification");
    if (!weekdayBulkDay) return toast.error("Select a weekday");

    const scopeIsYear = weekdayBulkScope === "year";
    const targetYearId = scopeIsYear ? gridYearId || overviewYear?.id : null;
    const targetMonthId = scopeIsYear
      ? null
      : weekdayBulkMonthId || gridMonthId;

    // Validate that we have the necessary target
    if (!scopeIsYear && !targetMonthId) {
      return toast.error("Select a month or no month is currently loaded");
    }
    if (scopeIsYear && !targetYearId) {
      return toast.error("Select a year first");
    }

    setBusy(true);
    try {
      // Build payload with correct field names
      const payload = {
        day_of_week: weekdayBulkDay,
        day_type_id: weekdayBulkType,
      };

      if (scopeIsYear) {
        payload.year_id = targetYearId;
      } else {
        payload.month_id = targetMonthId;
      }

      const response = await assignByWeekday(payload);

      const count = response?.data?.count || response?.data?.data?.length || 0;
      toast.success(
        scopeIsYear
          ? `Assigned to ${count} ${weekdayBulkDay}(s) in the whole year`
          : `Assigned to ${count} ${weekdayBulkDay}(s) in the month`,
      );

      // Reset the weekday selection after successful assignment
      setWeekdayBulkType("");
      setWeekdayBulkDay("");

      // Refresh the grid to show updated assignments
      fetchGridDays();
    } catch (e) {
      console.error("Weekday assignment error:", e);
      toast.error(e?.response?.data?.error || "Weekday assignment failed");
    } finally {
      setBusy(false);
    }
  };

  const handleQuickClear = async (id, e) => {
    e.stopPropagation();
    setBusy(true);
    try {
      await assignDayType(id, null);
      fetchGridDays();
    } catch (e) {
      toast.error("Clear failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCellClick = (id) => {
    if (bulkType) {
      // If we have a type selected, clicking a cell assigns it immediately
      (async () => {
        setBusy(true);
        try {
          await assignDayType(id, bulkType);
          fetchGridDays();
        } catch (e) {
          toast.error("Assignment failed");
        } finally {
          setBusy(false);
        }
      })();
    } else {
      toggleBulk(id);
    }
  };

  /* ── CSV Portability ── */
  const handleExportCSV = () => {
    if (calDays.length === 0) return toast.error("No data to export");

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
    toast.success("Calendar exported successfully");
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file || !gridMonthId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split("\n").slice(1); // skip headers
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
          setBusy(true);
          await bulkAssignDayTypes(assignments);
          toast.success(`Imported ${assignments.length} assignments`);
          fetchGridDays();
        } else {
          toast.error("No valid assignments found in CSV");
        }
      } catch (err) {
        toast.error("Failed to parse CSV");
      } finally {
        setBusy(false);
      }
    };
    reader.readAsText(file);
  };

  /* ── Day Category Handlers ── */
  const [newCategoryName, setNewCategoryName] = useState("");
  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    setBusy(true);
    try {
      await createDayCategory({ category_name: newCategoryName });
      toast.success("Category added");
      setNewCategoryName("");
      loadAll();
    } catch (e) {
      toast.error("Failed to add category");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    setBusy(true);
    try {
      await deleteDayCategory(id);
      toast.success("Category removed");
      loadAll();
    } catch (e) {
      toast.error("Failed to remove category");
    } finally {
      setBusy(false);
    }
  };

  /* ── Derived Data ── */
  const filteredYears = useMemo(() => {
    return years.filter((y) => {
      const yr = parseInt(y.year_label);
      if (isNaN(yr)) return true; // Keep non-numeric labels
      if (calendarType === "BS") return yr > 2040;
      return yr <= 2040;
    });
  }, [years, calendarType]);

  const filteredMonths = useMemo(() => {
    const baseList =
      monthFilterYear === "all"
        ? months
        : months.filter((m) => m.year_id === monthFilterYear);
    // Ensure the year associated with the month is also in the active filteredYears and matches calendar type
    return baseList.filter((m) => {
      const format = String(m.date_format || "BS").toUpperCase();
      return (
        filteredYears.some((y) => y.id === m.year_id) && format === calendarType
      );
    });
  }, [months, monthFilterYear, filteredYears, calendarType]);

  const gridMonthOptions = useMemo(() => {
    return months.filter((m) => {
      const format = String(m.date_format || "BS").toUpperCase();
      return m.year_id === gridYearId && format === calendarType;
    });
  }, [months, gridYearId, calendarType]);

  const currentYearMonths = useMemo(() => {
    if (!overviewYear?.id) return [];
    return months.filter((m) => {
      const format = String(m.date_format || "BS").toUpperCase();
      return m.year_id === overviewYear.id && format === calendarType;
    });
  }, [months, overviewYear, calendarType]);

  // Map categories to the stats shown in screenshot
  // Dynamically generate from actual categories with custom ordering:
  // 1. Total Days (always first)
  // 2. Working Day (calculated as Total Days - Holiday Days, always second)
  // 3. Other categories (excluding Holiday and Working Day category)
  // 4. Unassigned (always last)
  const statsConfig = useMemo(() => {
    const config = [
      {
        label: "Total Days",
        key: "total",
        icon: Calendar,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        isSpecial: true,
      },

      // Working Day is always second: calculated as Total - Holidays (not a category)
      {
        label: "Working Day",
        key: "working_days",
        icon: Check,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        isSpecial: true,
        isCalculated: true,
      },
    ];

    // Add other categories (excluding Holiday and Working Day categories if they exist)
    categories.forEach((cat) => {
      const isHoliday = cat.category_name.toLowerCase().includes("holiday");
      const isWorkingDay =
        cat.category_name.toLowerCase().includes("working") ||
        cat.category_name.toLowerCase().includes("school");

      // Skip if it's Holiday or Working Day - those are handled specially
      if (isHoliday || isWorkingDay) return;

      config.push({
        label: cat.category_name,
        key: `cat_${cat.id}`,
        icon: Check,
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        categoryId: cat.id,
        isSpecial: false,
      });
    });

    // Add unassigned at the end
    config.push({
      label: "Unassigned",
      key: "unassigned",
      icon: Info,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
      isSpecial: true,
    });

    return config;
  }, [categories]);

  const yearDateInputClass =
    "bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:text-slate-500 [color-scheme:dark]";
  const yearDateReadonlyClass =
    "bg-slate-950/60 border border-slate-800 rounded-2xl px-6 py-3 text-sm text-slate-300 cursor-not-allowed outline-none [color-scheme:dark]";

  useEffect(() => {
    const loadOverviewStats = async () => {
      if (!overviewYear?.id) {
        setOverviewStats({ total: 0, unassigned: 0, working_days: 0 });
        setOverviewYearLabel("");
        return;
      }

      setOverviewYearLabel(overviewYear.year_label || "");
      try {
        const res = await getCalendarDaysByYear(overviewYear.id);
        const days = res.data?.data || [];

        // Find the Holiday category
        const holidayCategory = categories.find((cat) =>
          cat.category_name.toLowerCase().includes("holiday"),
        );

        // Initialize stats: total + one slot per category
        const stats = { total: days.length, unassigned: 0, working_days: 0 };
        categories.forEach((cat) => {
          stats[`cat_${cat.id}`] = 0;
        });

        let holidayCount = 0;

        // Count days by category_id or as unassigned
        days.forEach((d) => {
          if (!d.day_type_id) {
            // Day is unassigned (no type selected)
            stats.unassigned += 1;
          } else {
            // Find the category this day type belongs to
            const dayType = dayTypes.find((dt) => dt.id === d.day_type_id);
            if (dayType && dayType.category_id) {
              const key = `cat_${dayType.category_id}`;
              if (stats.hasOwnProperty(key)) {
                stats[key] += 1;
              }

              // Track if this day is a holiday
              if (
                holidayCategory &&
                dayType.category_id === holidayCategory.id
              ) {
                holidayCount += 1;
              }
            } else if (!dayType?.category_id) {
              // Day type with no category - count as unassigned category
              stats.unassigned += 1;
            }
          }
        });

        // Calculate working days = Total Days - Holiday Days
        stats.working_days = Math.max(0, days.length - holidayCount);

        setOverviewStats(stats);
      } catch (err) {
        console.error("Failed to load overview stats:", err);
        setOverviewStats({ total: 0, unassigned: 0, working_days: 0 });
      }
    };

    loadOverviewStats();
  }, [overviewYear, categories, dayTypes]);

  const toggleAll = (expand) => {
    setExpanded({
      years: expand,
      types: expand,
      addMonth: expand,
      categories: expand,
      monthsList: expand,
    });
  };

  /* ── Render Tabs ── */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0f141e] rounded-2xl border border-slate-800/50">
      {/* ── Header with Stats ── */}
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-3">
              <Calendar className="text-indigo-500" size={24} />
              Academic Calendar Configuration
            </h1>
            <p className="text-slate-500 mt-1 font-medium text-[11px]">
              Configure your school year, months, and holiday rules.
              {overviewYearLabel && (
                <span className="ml-2 text-emerald-400 font-black uppercase tracking-widest text-[9px]">
                  Current Year: {overviewYearLabel}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/60 p-1 rounded-xl border border-slate-800/50">
            <button
              onClick={() => updateSetting("calendar_type", "BS")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                calendarType === "BS"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white",
              )}
            >
              Bikram Sambat (BS)
            </button>
            <button
              onClick={() => updateSetting("calendar_type", "AD")}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                calendarType === "AD"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white",
              )}
            >
              Gregorian (AD)
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {statsConfig.map((s) => (
            <div
              key={s.label}
              className="bg-slate-900/20 border border-slate-800/40 p-4 rounded-2xl flex items-center gap-4 group hover:border-indigo-500/30 transition-all"
            >
              <div
                className={clsx(
                  "p-2.5 rounded-xl transition-all group-hover:scale-110",
                  s.bg,
                  s.color,
                )}
              >
                <s.icon size={18} />
              </div>
              <div>
                <div className="text-2xl font-black text-white leading-none">
                  {overviewStats[s.key]}
                </div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1.5">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center gap-1 p-2 bg-slate-900/40 border-y border-slate-800/50">
        {[
          { id: "setup", label: "Structure & Setup", icon: Plus },
          { id: "grid", label: "Day Assignments", icon: Calendar },
          { id: "portability", label: "Import / Export", icon: DownloadCloud },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={clsx(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest",
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-500 hover:text-white hover:bg-white/5",
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}

        <div className="flex-1" />

        {busy && (
          <div className="flex items-center gap-2 px-4 text-[9px] font-black text-indigo-400 animate-pulse tracking-widest">
            <Loader2 size={12} className="animate-spin" />
            PROCESSING...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {activeTab === "setup" && (
          <div className="flex flex-col bg-slate-900/10 rounded-[40px] border border-slate-800/40 overflow-hidden shadow-2xl">
            {/* Accordion Controls */}
            <div className="px-10 py-6 border-b border-slate-800/50 flex justify-start gap-3 bg-slate-950/20">
              <button
                onClick={() => toggleAll(false)}
                className="px-6 py-2.5 bg-slate-800/50 text-white text-[11px] font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"
              >
                Collapse All
              </button>
              <button
                onClick={() => toggleAll(true)}
                className="px-6 py-2.5 bg-slate-800/50 text-white text-[11px] font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all"
              >
                Expand All
              </button>
            </div>
            <div className="flex flex-col lg:flex-row gap-6 px-10 py-6">
              <div className="flex-1 flex flex-col gap-4">
                <SetupSection
                  title="Academic Years"
                  icon={Check}
                  isExpanded={expanded.years}
                  onToggle={() => toggleSection("years")}
                >
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                          Year Label (System)
                        </label>
                        <input
                          type="text"
                          placeholder={
                            calendarType === "BS" ? "2083" : "2025-2026"
                          }
                          value={newYear.year_label}
                          onChange={(e) =>
                            setNewYear((prev) => ({
                              ...prev,
                              year_label: e.target.value,
                            }))
                          }
                          className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                          Set as Current Academic Year
                        </label>
                        <label className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={newYear.is_current}
                            onChange={(e) =>
                              setNewYear((prev) => ({
                                ...prev,
                                is_current: e.target.checked,
                              }))
                            }
                            className="accent-indigo-500"
                          />
                          Mark this year as current
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                          Year Label (AD)
                        </label>
                        <input
                          type="text"
                          placeholder="2025-2026"
                          value={newYear.year_label_AD}
                          onChange={(e) =>
                            setNewYear((prev) => ({
                              ...prev,
                              year_label_AD: e.target.value,
                              year_label:
                                prev.year_label ||
                                (calendarType === "AD"
                                  ? e.target.value
                                  : prev.year_label),
                            }))
                          }
                          className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                          Year Label (BS)
                        </label>
                        <input
                          type="text"
                          placeholder="2082-2083"
                          value={newYear.year_label_BS}
                          onChange={(e) =>
                            setNewYear((prev) => ({
                              ...prev,
                              year_label_BS: e.target.value,
                              year_label:
                                prev.year_label ||
                                (calendarType === "BS"
                                  ? e.target.value
                                  : prev.year_label),
                            }))
                          }
                          className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                        />
                      </div>
                    </div>

                    {calendarType === "BS" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                            Start Date (BS)
                          </label>
                          <UniversalDatePicker
                            value={newYear.start_date_AD}
                            onChange={(val) =>
                              setNewYear((prev) => ({
                                ...prev,
                                start_date_AD: val,
                                start_date_BS: formatBsDate(val),
                              }))
                            }
                            className="!bg-slate-950 !border-slate-800 !rounded-2xl !px-6 !py-3 !text-sm !text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                            Start Date (AD)
                          </label>
                          <input
                            type="date"
                            value={newYear.start_date_AD}
                            readOnly
                            className={yearDateReadonlyClass}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                            Start Date (AD)
                          </label>
                          <input
                            type="date"
                            value={newYear.start_date_AD}
                            onChange={(e) =>
                              setNewYear((prev) => ({
                                ...prev,
                                start_date_AD: e.target.value,
                                start_date_BS: formatBsDate(e.target.value),
                              }))
                            }
                            className={yearDateInputClass}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                            Start Date (BS)
                          </label>
                          <input
                            type="text"
                            value={newYear.start_date_BS}
                            readOnly
                            className="bg-slate-950/60 border border-slate-800 rounded-2xl px-6 py-3 text-sm text-slate-400 cursor-not-allowed outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {calendarType === "BS" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                            End Date (BS)
                          </label>
                          <UniversalDatePicker
                            value={newYear.end_date_AD}
                            onChange={(val) =>
                              setNewYear((prev) => ({
                                ...prev,
                                end_date_AD: val,
                                end_date_BS: formatBsDate(val),
                              }))
                            }
                            className="!bg-slate-950 !border-slate-800 !rounded-2xl !px-6 !py-3 !text-sm !text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                            End Date (AD)
                          </label>
                          <input
                            type="date"
                            value={newYear.end_date_AD}
                            readOnly
                            className={yearDateReadonlyClass}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                            End Date (AD)
                          </label>
                          <input
                            type="date"
                            value={newYear.end_date_AD}
                            onChange={(e) =>
                              setNewYear((prev) => ({
                                ...prev,
                                end_date_AD: e.target.value,
                                end_date_BS: formatBsDate(e.target.value),
                              }))
                            }
                            className={yearDateInputClass}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                            End Date (BS)
                          </label>
                          <input
                            type="text"
                            value={newYear.end_date_BS}
                            readOnly
                            className="bg-slate-950/60 border border-slate-800 rounded-2xl px-6 py-3 text-sm text-slate-400 cursor-not-allowed outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end">
                      <button
                        onClick={handleAddYear}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 text-xs font-black uppercase tracking-widest"
                      >
                        Add Year
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {filteredYears.map((y) => (
                      <div
                        key={y.id}
                        className="group relative flex items-center gap-3 px-6 py-3 bg-slate-800/40 rounded-2xl border border-slate-700 hover:border-indigo-500/30 transition-all"
                      >
                        <span className="text-sm font-bold text-white">
                          {y.year_label}
                        </span>
                        {y.is_current && (
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Current
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteYear(y.id, y.year_label)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 hover:text-rose-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </SetupSection>

                <SetupSection
                  title={`Add ${calendarType} Month`}
                  icon={Calendar}
                  isExpanded={expanded.addMonth}
                  onToggle={() => toggleSection("addMonth")}
                >
                  <div className="grid grid-cols-2 gap-5 mt-2">
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Academic Year
                      </label>
                      <select
                        value={newMonth.year_id}
                        onChange={(e) =>
                          setNewMonth({ ...newMonth, year_id: e.target.value })
                        }
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                      >
                        <option value="">Select Year</option>
                        {filteredYears.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.year_label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        {calendarType} Month Selection
                      </label>
                      <select
                        value={newMonth.bs_month_index}
                        onChange={(e) =>
                          setNewMonth({
                            ...newMonth,
                            bs_month_index: parseInt(e.target.value),
                          })
                        }
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        {calendarType === "BS"
                          ? BS_MONTHS.map((m, i) => (
                              <option key={m} value={i + 1}>
                                {m}
                              </option>
                            ))
                          : AD_MONTHS.map((m, i) => (
                              <option key={m} value={i + 1}>
                                {m}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Period Start
                      </label>
                      <UniversalDatePicker
                        value={newMonth.start_date}
                        onChange={(val) => {
                          const date = val ? new Date(val) : null;
                          const wday = date
                            ? date.toLocaleDateString("en-US", {
                                weekday: "long",
                              })
                            : "";
                          const info = wday;

                          let label = newMonth.month_name;
                          let yearId = newMonth.year_id;
                          let monthIdx = newMonth.bs_month_index;

                          if (date) {
                            if (calendarType === "BS") {
                              const bs = adToBs(date);
                              if (bs) {
                                if (!label)
                                  label = `${BS_MONTHS[bs.month - 1]} ${bs.year}`;
                                monthIdx = bs.month;
                                const matchedYear = years.find((y) =>
                                  y.year_label.includes(bs.year.toString()),
                                );
                                if (matchedYear) yearId = matchedYear.id;
                              }
                            } else {
                              if (!label)
                                label = date.toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                });
                              monthIdx = date.getMonth() + 1;
                              const matchedYear = years.find((y) =>
                                y.year_label.includes(
                                  date.getFullYear().toString(),
                                ),
                              );
                              if (matchedYear) yearId = matchedYear.id;
                            }
                          }

                          setNewMonth({
                            ...newMonth,
                            start_date: val,
                            start_day: wday,
                            start_weekday: wday,
                            start_day_info: info,
                            month_name: label,
                            year_id: yearId,
                            bs_month_index: monthIdx,
                          });
                        }}
                        className="!bg-slate-950 !border-slate-800 !rounded-2xl !px-6 !py-4 !text-sm !text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Period End
                      </label>
                      <UniversalDatePicker
                        value={newMonth.end_date}
                        onChange={(val) => {
                          const date = val ? new Date(val) : null;
                          const wday = date
                            ? date.toLocaleDateString("en-US", {
                                weekday: "long",
                              })
                            : "";
                          const info = wday;
                          setNewMonth({
                            ...newMonth,
                            end_date: val,
                            end_day: wday,
                            end_weekday: wday,
                            end_day_info: info,
                          });
                        }}
                        className="!bg-slate-950 !border-slate-800 !rounded-2xl !px-6 !py-4 !text-sm !text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Start Day Info
                      </label>
                      <input
                        type="text"
                        value={newMonth.start_day_info}
                        onChange={(e) =>
                          setNewMonth({
                            ...newMonth,
                            start_day_info: e.target.value,
                          })
                        }
                        placeholder="Day - Weekday"
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        End Day Info
                      </label>
                      <input
                        type="text"
                        value={newMonth.end_day_info}
                        onChange={(e) =>
                          setNewMonth({
                            ...newMonth,
                            end_day_info: e.target.value,
                          })
                        }
                        placeholder="Day - Weekday"
                        className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                      Display Label (e.g.{" "}
                      {calendarType === "BS" ? "Baisakh 2083" : "January 2024"})
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder={
                          calendarType === "BS"
                            ? "Baisakh 2083"
                            : "January 2024"
                        }
                        value={newMonth.month_name}
                        onChange={(e) =>
                          setNewMonth({
                            ...newMonth,
                            month_name: e.target.value,
                          })
                        }
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                      />
                      <button
                        onClick={handleAddMonth}
                        className="px-10 bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </SetupSection>

                <SetupSection
                  title="Day Categories"
                  icon={Info}
                  isExpanded={expanded.categories}
                  onToggle={() => toggleSection("categories")}
                >
                  <div className="flex gap-3 mt-2">
                    <input
                      type="text"
                      placeholder="New Category (e.g. Annual Day)"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="px-10 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 max-h-[200px] overflow-y-auto pr-3 custom-scrollbar">
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        className="group relative flex items-center gap-3 px-6 py-3 bg-slate-800/40 rounded-2xl border border-slate-700 hover:border-indigo-500/30 transition-all"
                      >
                        <span className="text-sm font-bold text-white">
                          {c.category_name}
                        </span>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </SetupSection>

                <SetupSection
                  title="Day Classifications"
                  icon={Info}
                  isExpanded={expanded.types}
                  onToggle={() => toggleSection("types")}
                >
                  <div className="flex flex-col gap-4 mt-2">
                    <input
                      type="text"
                      placeholder="New Type (e.g. Winter Break)"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <div className="flex gap-3">
                      <select
                        value={newTypeCategoryId}
                        onChange={(e) => setNewTypeCategoryId(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddDayType}
                        className="px-10 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all"
                      >
                        Add Type
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                    {dayTypes.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between px-6 py-4 bg-slate-950/40 rounded-2xl border border-slate-800/50 hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">
                            {t.day_type}
                          </span>
                          {t.category_name && (
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                              {t.category_name}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteDayType(t.id)}
                          className="text-rose-500 hover:text-rose-400 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </SetupSection>
              </div>

              <div className="lg:w-[360px] w-full">
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-white">
                        Current Year Months
                      </div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        {overviewYear?.year_label || "No current year set"}
                      </div>
                    </div>
                    <Calendar size={16} className="text-indigo-400" />
                  </div>
                  <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentYearMonths.length === 0 && (
                      <div className="text-xs text-slate-500 italic">
                        No months added for the current year.
                      </div>
                    )}
                    {currentYearMonths.map((m) => {
                      const isEditing = editingMonthId === m.id;
                      return (
                        <div
                          key={m.id}
                          className="flex flex-col gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-indigo-500/30 transition-all"
                        >
                          {isEditing ? (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Month Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editMonthData.month_name}
                                    onChange={(e) =>
                                      setEditMonthData({
                                        ...editMonthData,
                                        month_name: e.target.value,
                                      })
                                    }
                                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Sequence
                                  </label>
                                  <input
                                    type="number"
                                    value={editMonthData.bs_month_index}
                                    onChange={(e) =>
                                      setEditMonthData({
                                        ...editMonthData,
                                        bs_month_index: parseInt(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Start Date
                                  </label>
                                  <UniversalDatePicker
                                    value={editMonthData.start_date}
                                    onChange={(val) => {
                                      const wday = val
                                        ? new Date(val).toLocaleDateString(
                                            "en-US",
                                            { weekday: "long" },
                                          )
                                        : "";
                                      setEditMonthData({
                                        ...editMonthData,
                                        start_date: val,
                                        start_day: wday,
                                      });
                                    }}
                                    className="!bg-slate-900 !border-slate-800 !rounded-xl !px-4 !py-2.5 !text-xs !text-white"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    End Date
                                  </label>
                                  <UniversalDatePicker
                                    value={editMonthData.end_date}
                                    onChange={(val) => {
                                      const wday = val
                                        ? new Date(val).toLocaleDateString(
                                            "en-US",
                                            { weekday: "long" },
                                          )
                                        : "";
                                      setEditMonthData({
                                        ...editMonthData,
                                        end_date: val,
                                        end_day: wday,
                                      });
                                    }}
                                    className="!bg-slate-900 !border-slate-800 !rounded-xl !px-4 !py-2.5 !text-xs !text-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Start Day
                                  </label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={editMonthData.start_day || ""}
                                    placeholder="Auto"
                                    className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-500 cursor-not-allowed outline-none"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    End Day
                                  </label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={editMonthData.end_day || ""}
                                    placeholder="Auto"
                                    className="bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-500 cursor-not-allowed outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-slate-800/50">
                                <button
                                  onClick={() => setEditingMonthId(null)}
                                  className="px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleUpdateMonth}
                                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">
                                  {m.month_name}
                                </span>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                    {calendarType} Index: {m.bs_month_index}
                                  </span>
                                  <div className="w-1 h-1 rounded-full bg-slate-800" />
                                  <span className="text-[10px] text-slate-400 font-medium italic">
                                    {m.start_date} to {m.end_date}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startEditing(m)}
                                  className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMonth(m.id)}
                                  className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-6 bg-slate-950/40 border border-slate-800/60 rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-white">
                        Academic Year List
                      </div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                        All Added Years
                      </div>
                    </div>
                    <Check size={16} className="text-emerald-400" />
                  </div>
                  <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {years.length === 0 && (
                      <div className="text-xs text-slate-500 italic">
                        No academic years added yet.
                      </div>
                    )}
                    {years.map((y) => {
                      const isEditing = editingYearId === y.id;
                      return (
                        <div
                          key={y.id}
                          className="flex flex-col gap-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 hover:border-indigo-500/30 transition-all"
                        >
                          {isEditing ? (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Year Label
                                  </label>
                                  <input
                                    type="text"
                                    value={editYearData.year_label}
                                    onChange={(e) =>
                                      setEditYearData({
                                        ...editYearData,
                                        year_label: e.target.value,
                                      })
                                    }
                                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    AD Label
                                  </label>
                                  <input
                                    type="text"
                                    value={editYearData.year_label_AD}
                                    onChange={(e) =>
                                      setEditYearData({
                                        ...editYearData,
                                        year_label_AD: e.target.value,
                                      })
                                    }
                                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    BS Label
                                  </label>
                                  <input
                                    type="text"
                                    value={editYearData.year_label_BS}
                                    onChange={(e) =>
                                      setEditYearData({
                                        ...editYearData,
                                        year_label_BS: e.target.value,
                                      })
                                    }
                                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                <div className="flex items-end h-full">
                                  <label className="flex items-center gap-2 cursor-pointer mb-0">
                                    <input
                                      type="checkbox"
                                      checked={editYearData.is_current}
                                      onChange={(e) =>
                                        setEditYearData({
                                          ...editYearData,
                                          is_current: e.target.checked,
                                        })
                                      }
                                      className="w-4 h-4 rounded bg-slate-900 border border-slate-700 checked:bg-emerald-600 checked:border-emerald-500 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-300">
                                      Set as Current
                                    </span>
                                  </label>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    AD Start Date
                                  </label>
                                  <UniversalDatePicker
                                    value={editYearData.start_date_AD}
                                    onChange={(val) =>
                                      setEditYearData({
                                        ...editYearData,
                                        start_date_AD: val,
                                      })
                                    }
                                    className="!bg-slate-900 !border-slate-800 !rounded-xl !px-4 !py-2.5 !text-xs !text-white"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    AD End Date
                                  </label>
                                  <UniversalDatePicker
                                    value={editYearData.end_date_AD}
                                    onChange={(val) =>
                                      setEditYearData({
                                        ...editYearData,
                                        end_date_AD: val,
                                      })
                                    }
                                    className="!bg-slate-900 !border-slate-800 !rounded-xl !px-4 !py-2.5 !text-xs !text-white"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    BS Start Date
                                  </label>
                                  <UniversalDatePicker
                                    value={editYearData.start_date_BS}
                                    onChange={(val) =>
                                      setEditYearData({
                                        ...editYearData,
                                        start_date_BS: val,
                                      })
                                    }
                                    className="!bg-slate-900 !border-slate-800 !rounded-xl !px-4 !py-2.5 !text-xs !text-white"
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    BS End Date
                                  </label>
                                  <UniversalDatePicker
                                    value={editYearData.end_date_BS}
                                    onChange={(val) =>
                                      setEditYearData({
                                        ...editYearData,
                                        end_date_BS: val,
                                      })
                                    }
                                    className="!bg-slate-900 !border-slate-800 !rounded-xl !px-4 !py-2.5 !text-xs !text-white"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-slate-800/50">
                                <button
                                  onClick={() => setEditingYearId(null)}
                                  className="px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleUpdateYear}
                                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col flex-1">
                                <span className="text-sm font-bold text-white">
                                  {y.year_label}
                                </span>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                    {y.year_label_AD} / {y.year_label_BS}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {y.is_current && (
                                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Current
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => startEditingYear(y)}
                                    className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteYear(y.id, y.year_label)
                                    }
                                    className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "grid" && (
          <div className="flex flex-col gap-8 h-full min-h-[800px]">
            {/* Grid Filters & Actions */}
            <div className="flex items-end justify-between gap-6 flex-wrap bg-slate-900/40 p-6 rounded-3xl border border-slate-800/60">
              <div className="flex items-center gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Academic Year
                  </label>
                  <select
                    value={gridYearId}
                    onChange={(e) => setGridYearId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-xs text-white min-w-[140px]"
                  >
                    <option value="">Select Year</option>
                    {filteredYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.year_label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Month
                  </label>
                  <select
                    value={gridMonthId}
                    onChange={(e) => setGridMonthId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-xs text-white min-w-[180px]"
                  >
                    <option value="">Select Month</option>
                    {gridMonthOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.month_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bulk Action Bar */}
              <div
                className={clsx(
                  "flex items-center gap-4 bg-slate-950/60 p-3 rounded-3xl border border-indigo-500/20 transition-all",
                  bulkSelected.size > 0
                    ? "opacity-100 translate-y-0 shadow-2xl shadow-indigo-500/10"
                    : "opacity-40 translate-y-1",
                )}
              >
                <div className="flex items-center gap-3 px-4 border-r border-slate-800">
                  <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">
                    {bulkSelected.size} Selected
                  </span>
                </div>
                <select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-slate-300 outline-none"
                >
                  <option value="">Choose Day Type...</option>
                  {dayTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.day_type}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleBulkAssign(false)}
                  disabled={!bulkType || bulkSelected.size === 0}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-500 disabled:opacity-30 transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest"
                >
                  Apply to All
                </button>
                <button
                  onClick={() => handleBulkAssign(true)}
                  disabled={bulkSelected.size === 0}
                  className="px-6 py-3 bg-slate-800 text-rose-400 border border-rose-500/20 rounded-2xl text-xs font-black hover:bg-rose-500/10 disabled:opacity-30 uppercase tracking-widest"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => setBulkSelected(new Set())}
                  className="p-3 text-slate-500 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    refreshYearlyStats(gridYearId).then(() => {
                      toast.success("Stats Refreshed");
                      loadAll();
                    })
                  }
                  className="flex items-center gap-2 px-5 py-3 bg-slate-800 text-slate-400 rounded-2xl text-xs font-bold hover:text-white transition-all border border-slate-700"
                >
                  <RefreshCw size={14} /> Refresh Stats
                </button>
                <div className="flex items-center gap-2 bg-slate-900/60 p-1 rounded-2xl border border-slate-800/50">
                  <button
                    onClick={handleExportCSV}
                    className="p-3 text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                    title="Export CSV"
                  >
                    <DownloadCloud size={20} />
                  </button>
                  <label
                    className="p-3 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all cursor-pointer"
                    title="Import CSV"
                  >
                    <UploadCloud size={20} />
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Weekday Assignment */}
            <div className="flex items-end justify-between gap-6 flex-wrap bg-slate-900/30 p-6 rounded-3xl border border-slate-800/60">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Day Classification
                  </label>
                  <select
                    value={weekdayBulkType}
                    onChange={(e) => setWeekdayBulkType(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-xs text-white min-w-[180px]"
                  >
                    <option value="">Select Day Type</option>
                    {dayTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.day_type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Weekday
                  </label>
                  <select
                    value={weekdayBulkDay}
                    onChange={(e) => setWeekdayBulkDay(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-xs text-white min-w-[160px]"
                  >
                    <option value="">Select Day</option>
                    {[
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Scope
                  </label>
                  <select
                    value={weekdayBulkScope}
                    onChange={(e) => {
                      const nextScope = e.target.value;
                      setWeekdayBulkScope(nextScope);
                      if (nextScope === "year") {
                        setWeekdayBulkMonthId("");
                      }
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-xs text-white min-w-[140px]"
                  >
                    <option value="month">This Month</option>
                    <option value="year">Whole Year</option>
                  </select>
                </div>

                {weekdayBulkScope === "month" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Target Month
                    </label>
                    <select
                      value={
                        weekdayBulkMonthId !== ""
                          ? weekdayBulkMonthId
                          : gridMonthId || ""
                      }
                      onChange={(e) => setWeekdayBulkMonthId(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-xs text-white min-w-[180px]"
                    >
                      <option value="">Use Selected Month</option>
                      {gridMonthOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.month_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAssignByWeekday}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-black hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest"
                >
                  Apply Weekday Rule
                </button>
              </div>
            </div>

            {/* Visual Grid Editor */}
            {!gridMonthId ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600">
                <Calendar size={48} className="opacity-10" />
                <p className="text-sm font-medium italic">
                  Select a year and month to start assigning days
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-7 gap-2">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                    (d) => (
                      <div
                        key={d}
                        className="py-2 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest"
                      >
                        {d}
                      </div>
                    ),
                  )}
                </div>

                <div className="grid grid-cols-7 gap-3">
                  {/* Handle leading offsets for grid alignment */}
                  {(() => {
                    const monthObj = months.find((m) => m.id === gridMonthId);
                    if (!monthObj) return null;
                    const dayNames = [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ];
                    let offset = 0;

                    if (calendarType === "BS") {
                      const startDay = String(
                        monthObj.month_start_day_bs ||
                          monthObj.month_start_day_BS ||
                          monthObj.month_start_day_ad ||
                          monthObj.month_start_day_AD ||
                          "",
                      );
                      const idx = dayNames.indexOf(startDay);
                      offset = idx >= 0 ? idx : 0;
                    } else {
                      const startAd =
                        monthObj.month_start_date_ad ||
                        monthObj.month_start_date_AD ||
                        monthObj.start_date;
                      offset = startAd ? new Date(startAd).getDay() : 0;
                    }
                    return Array.from({ length: offset }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="bg-slate-900/20 border border-dashed border-slate-800/40 rounded-2xl min-h-[90px] opacity-20"
                      />
                    ));
                  })()}

                  {calDays.length === 0 && busy && (
                    <div className="col-span-7 py-20 flex flex-col items-center justify-center gap-3 text-indigo-400">
                      <Loader2 size={32} className="animate-spin" />
                      <p className="text-xs font-black uppercase tracking-widest">
                        Generating Grid...
                      </p>
                    </div>
                  )}

                  {calDays.map((day, idx) => {
                    const style = dayColor(day.day_type, day.category_name);
                    const isSelected = bulkSelected.has(day.id);
                    const ad = bsToAd(2083, 1, day.day_number); // dummy AD conversion for layout test

                    return (
                      <div
                        key={day.id}
                        onClick={() => handleCellClick(day.id)}
                        className={clsx(
                          "group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer min-h-[90px] flex flex-col justify-between",
                          isSelected
                            ? "ring-2 ring-indigo-500 scale-[0.98]"
                            : "hover:scale-[1.02]",
                          day.day_type
                            ? style.cell
                            : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80",
                          isSelected && "shadow-xl shadow-indigo-500/20",
                        )}
                      >
                        {/* Day Number */}
                        <div className="flex items-start justify-between">
                          <span
                            className={clsx(
                              "text-xl font-black leading-none",
                              day.day_type ? style.num : "text-white",
                            )}
                          >
                            {day.day_number}
                          </span>

                          {/* Selection Checkbox */}
                          <div
                            className={clsx(
                              "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-indigo-500 border-indigo-400"
                                : "border-slate-700 bg-black/20",
                            )}
                          >
                            {isSelected && (
                              <Check size={10} className="text-white" />
                            )}
                          </div>
                        </div>

                        {/* Label or Empty */}
                        <div className="flex flex-col gap-0.5 mt-auto">
                          {day.day_type ? (
                            <span
                              className={clsx(
                                "text-[9px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg border text-center shadow-sm",
                                style.badge,
                              )}
                            >
                              {day.day_type}
                            </span>
                          ) : (
                            <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                              Click to select
                            </span>
                          )}
                        </div>

                        {/* Quick Clear Button */}
                        {day.day_type && (
                          <button
                            onClick={(e) => handleQuickClear(day.id, e)}
                            className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {calDays.length === 0 && !busy && (
                    <div className="col-span-7 bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center gap-4">
                      <AlertCircle size={32} className="text-slate-600" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-400">
                          No days generated for this month yet.
                        </p>
                        <button
                          onClick={() =>
                            generateCalendarDays(gridMonthId).then(
                              fetchGridDays,
                            )
                          }
                          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-all"
                        >
                          Generate Calendar Days
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              School Day
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Holiday
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Exam
            </span>
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
          EduSphere MIS • Academic Module v2.0
        </p>
        {activeTab === "portability" && (
          <div className="grid grid-cols-2 gap-6 h-full w-full auto-rows-fr">
            {/* Export Month-wise Card - TOP LEFT */}
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/40 rounded-3xl border border-emerald-500/20 p-6 flex flex-col gap-4 shadow-2xl shadow-emerald-600/5 hover:border-emerald-500/40 transition-all min-h-0">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-widest">
                    Export Single Month
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Download calendar data for a specific month.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Select Year *
                  </label>
                  <select
                    value={gridYearId}
                    onChange={(e) => setGridYearId(e.target.value)}
                    className="bg-slate-950/80 border border-slate-700/50 rounded-lg px-4 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all"
                  >
                    <option value="">Select Year...</option>
                    {filteredYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.year_label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Select Month *
                  </label>
                  <select
                    value={exportMonthId}
                    onChange={(e) => setExportMonthId(e.target.value)}
                    disabled={!gridYearId}
                    className="bg-slate-950/80 border border-slate-700/50 rounded-lg px-4 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Month...</option>
                    {gridYearId &&
                      gridMonthOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.month_name}
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  disabled={!exportMonthId || busy}
                  onClick={async () => {
                    if (!exportMonthId) return toast.error("Select a month");
                    setBusy(true);
                    try {
                      const res = await getCalendarDays(
                        exportMonthId,
                        calendarType,
                      );
                      const days = res.data?.data || [];
                      if (days.length === 0)
                        return toast.error("No data found for this month");

                      const getWeekday = (dateStr) => {
                        if (!dateStr) return "Unknown";
                        const date = new Date(dateStr);
                        const weekdays = [
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ];
                        return weekdays[date.getDay()];
                      };

                      const monthName =
                        gridMonthOptions.find((m) => m.id === exportMonthId)
                          ?.month_name || "month";
                      const headers = [
                        "Month",
                        "Day Number",
                        "Date",
                        "Day Type",
                        "Category",
                      ];
                      const rows = days.map((d) => [
                        d.month_name,
                        d.day_number,
                        d.formatted_date || "",
                        !d.day_type ? getWeekday(d.formatted_date) : d.day_type,
                        d.category_name || "N/A",
                      ]);

                      const csvContent = [headers, ...rows]
                        .map((e) => e.map((cell) => `"${cell}"`).join(","))
                        .join("\n");
                      const blob = new Blob([csvContent], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `calendar_month_${calendarType}_${monthName}.csv`;
                      link.click();
                      URL.revokeObjectURL(link.href);
                      toast.success("Month exported successfully");
                    } catch (e) {
                      toast.error("Export failed: " + e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-wider flex items-center justify-center gap-2 mt-1"
                >
                  {busy ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />{" "}
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Export
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Export Year-wise Card - TOP RIGHT */}
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/40 rounded-3xl border border-indigo-500/20 p-6 flex flex-col gap-4 shadow-2xl shadow-indigo-600/5 hover:border-indigo-500/40 transition-all min-h-0">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-widest">
                    Export Full Year
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Download complete calendar with all months and assignments.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Select Academic Year *
                  </label>
                  <select
                    value={gridYearId}
                    onChange={(e) => setGridYearId(e.target.value)}
                    className="bg-slate-950/80 border border-slate-700/50 rounded-lg px-4 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all"
                  >
                    <option value="">Select Year...</option>
                    {filteredYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.year_label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  disabled={!gridYearId || busy}
                  onClick={async () => {
                    if (!gridYearId) return toast.error("Select a year");
                    setBusy(true);
                    try {
                      const res = await getCalendarDaysByYear(gridYearId);
                      const days = res.data?.data || [];
                      if (days.length === 0)
                        return toast.error("No data found for this year");

                      const getWeekday = (dateStr) => {
                        if (!dateStr) return "Unknown";
                        const date = new Date(dateStr);
                        const weekdays = [
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday",
                          "Friday",
                          "Saturday",
                        ];
                        return weekdays[date.getDay()];
                      };

                      const headers = [
                        "Year",
                        "Month",
                        "Day Number",
                        "Date",
                        "Day Type",
                        "Category",
                      ];
                      const rows = days.map((d) => [
                        d.year_label,
                        d.month_name,
                        d.day_number,
                        d.formatted_date || "",
                        !d.day_type ? getWeekday(d.formatted_date) : d.day_type,
                        d.category_name || "N/A",
                      ]);

                      const csvContent = [headers, ...rows]
                        .map((e) => e.map((cell) => `"${cell}"`).join(","))
                        .join("\n");
                      const blob = new Blob([csvContent], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(blob);
                      link.download = `calendar_year_${calendarType}_${gridYearId}.csv`;
                      link.click();
                      URL.revokeObjectURL(link.href);
                      toast.success("Year exported successfully");
                    } catch (e) {
                      toast.error("Export failed: " + e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-wider flex items-center justify-center gap-2 mt-1"
                >
                  {busy ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />{" "}
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Download Year
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Import Section - BOTTOM LEFT */}
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/40 rounded-3xl border border-amber-500/20 p-6 flex flex-col gap-4 shadow-2xl shadow-amber-600/5 hover:border-amber-500/40 transition-all min-h-0">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-widest">
                    Import Calendar
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Upload CSV to update day assignments.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Select Year *
                  </label>
                  <select
                    value={gridYearId}
                    onChange={(e) => setGridYearId(e.target.value)}
                    className="bg-slate-950/80 border border-slate-700/50 rounded-lg px-4 py-2.5 text-xs text-white font-medium focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all"
                  >
                    <option value="">Select Year...</option>
                    {filteredYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.year_label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-6 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-950/30 hover:border-amber-500/50 hover:bg-slate-950/50 transition-all group cursor-pointer">
                  <FileText
                    size={28}
                    className="text-slate-600 group-hover:text-amber-400 transition-colors"
                  />
                  <label className="cursor-pointer text-center">
                    <span className="px-5 py-2 bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-amber-500 transition-all inline-block">
                      Choose CSV
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      disabled={busy}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (!gridYearId)
                          return toast.error("Select a year first");

                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          try {
                            const text = event.target.result;
                            const lines = text
                              .split("\n")
                              .filter((line) => line.trim());
                            if (lines.length < 2)
                              return toast.error("CSV file is empty");

                            const assignments = [];
                            const typeMap = {};
                            dayTypes.forEach(
                              (t) => (typeMap[t.day_type.toLowerCase()] = t.id),
                            );

                            setBusy(true);
                            const res = await getCalendarDaysByYear(gridYearId);
                            const allYearDays = res.data?.data || [];

                            // Skip header row (first row)
                            for (let i = 1; i < lines.length; i++) {
                              const line = lines[i];
                              if (!line.trim()) continue;

                              // Handle quoted CSV values
                              const cols = line
                                .split(",")
                                .map((col) => col.replace(/^"|"$/g, "").trim());
                              const monthName = cols[1];
                              const dayNum = parseInt(cols[2]);
                              const typeName = cols[3]?.toLowerCase();

                              if (monthName && dayNum && typeMap[typeName]) {
                                const targetDay = allYearDays.find(
                                  (d) =>
                                    d.month_name === monthName &&
                                    d.day_number === dayNum,
                                );
                                if (targetDay) {
                                  assignments.push({
                                    calendarDayId: targetDay.id,
                                    dayTypeId: typeMap[typeName],
                                  });
                                }
                              }
                            }

                            if (assignments.length > 0) {
                              await bulkAssignDayTypes(assignments);
                              toast.success(
                                `Successfully imported ${assignments.length} assignments`,
                              );
                              fetchGridDays();
                            } else {
                              toast.warning("No valid matches found in CSV.");
                            }
                          } catch (err) {
                            console.error("Import error:", err);
                            toast.error(
                              "Import failed: " +
                                (err.message || "Invalid CSV format"),
                            );
                          } finally {
                            setBusy(false);
                          }
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <AlertCircle
                    size={14}
                    className="text-amber-500 shrink-0 mt-0.5"
                  />
                  <p className="text-[9px] text-amber-500/90 leading-tight font-bold">
                    Importing will overwrite existing assignments for matching
                    days.
                  </p>
                </div>
              </div>
            </div>

            {/* Template Download Card - BOTTOM RIGHT */}
            <div className="bg-gradient-to-br from-slate-900/60 to-slate-950/40 rounded-3xl border border-slate-700/30 p-6 flex flex-col gap-4 hover:border-slate-600/50 transition-all min-h-0">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-slate-700/30 text-slate-400 rounded-xl border border-slate-700/50 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-widest">
                    CSV Template
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Pre-formatted template for imports.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const headers = [
                    "Month",
                    "Day Number",
                    "Date",
                    "Day Type",
                    "Category",
                  ];
                  const samples = [
                    ["Baisakh", "1", "2024-04-13", "Working Day", "School Day"],
                    ["Baisakh", "2", "2024-04-14", "Holiday", "Holiday"],
                  ];
                  const csv = [headers, ...samples]
                    .map((e) => e.map((cell) => `"${cell}"`).join(","))
                    .join("\n");
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(
                    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
                  );
                  link.download = "calendar_import_template.csv";
                  link.click();
                  URL.revokeObjectURL(link.href);
                  toast.success("Template downloaded");
                }}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all border border-slate-600 flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicCalendar;
