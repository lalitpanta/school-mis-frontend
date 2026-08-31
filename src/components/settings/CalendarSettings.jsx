import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Upload,
  X,
  DownloadCloud,
  UploadCloud,
  Check,
  Edit2,
  Settings,
  Grid3x3,
  FileUp,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

// API
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

// Professional Card Component
const Card = ({ children, className = "", shadow = true }) => (
  <div
    className={clsx(
      "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:border-white/20",
      shadow && "shadow-2xl",
      className,
    )}
  >
    {children}
  </div>
);

// Professional Section Header
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-4 mb-6">
    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 shadow-lg">
      <Icon className="text-indigo-400" size={24} />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Professional Input Component
const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-2">
    {label && (
      <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">
        {label}
      </label>
    )}
    <input
      {...props}
      className={clsx(
        "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500",
        "focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all",
        "backdrop-blur-sm font-medium",
        props.className,
      )}
    />
  </div>
);

// Professional Select Component
const Select = ({ label, options = [], ...props }) => (
  <div className="flex flex-col gap-2">
    {label && (
      <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">
        {label}
      </label>
    )}
    <select
      {...props}
      className={clsx(
        "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white",
        "focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all",
        "backdrop-blur-sm font-medium cursor-pointer appearance-none",
        "bg-no-repeat bg-right bg-[length:20px]",
        props.className,
      )}
      style={{
        backgroundImage:
          'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E")',
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// Professional Button Component
const Button = ({
  variant = "primary",
  size = "md",
  icon: Icon,
  children,
  className = "",
  ...props
}) => {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={clsx(
        "font-bold rounded-lg transition-all duration-200 flex items-center gap-2 uppercase tracking-wider",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

// Collapsible Section
const CollapsibleSection = ({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Icon
            className="text-indigo-400 group-hover:scale-110 transition-transform"
            size={20}
          />
          <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
            {title}
          </h3>
        </div>
        <div
          className={clsx(
            "text-slate-400 transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </button>
      <div
        className={clsx(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[2000px]" : "max-h-0",
        )}
      >
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          {children}
        </div>
      </div>
    </div>
  );
};

// Badge Component
const Badge = ({ variant = "primary", children, icon: Icon }) => {
  const variants = {
    primary: "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30",
    success: "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-200 border border-amber-500/30",
    danger: "bg-rose-500/20 text-rose-200 border border-rose-500/30",
    secondary: "bg-slate-500/20 text-slate-200 border border-slate-500/30",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
        variants[variant],
      )}
    >
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
};

const CalendarSettings = () => {
  const { settings, updateSetting } = useSettings();
  const calendarType = settings.calendar_type || "BS";
  const [activeTab, setActiveTab] = useState("setup");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data
  const [months, setMonths] = useState([]);
  const [years, setYears] = useState([]);
  const [dayTypes, setDayTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [calDays, setCalDays] = useState([]);
  const [overviewYear, setOverviewYear] = useState(null);
  const [overviewStats, setOverviewStats] = useState({
    total: 0,
    unassigned: 0,
    working_days: 0,
  });

  // Form States
  const [newYear, setNewYear] = useState({
    year_label: "",
    year_label_AD: "",
    year_label_BS: "",
    is_current: false,
    start_date_AD: "",
    end_date_AD: "",
    start_date_BS: "",
    end_date_BS: "",
  });

  const [newMonth, setNewMonth] = useState({
    month_name: "",
    year_id: "",
    bs_month_index: 1,
    start_date: "",
    end_date: "",
    start_day_info: "",
    end_day_info: "",
  });

  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeCategoryId, setNewTypeCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Grid States
  const [gridYearId, setGridYearId] = useState("");
  const [gridMonthId, setGridMonthId] = useState("");
  const [bulkType, setBulkType] = useState("");
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [editingYearId, setEditingYearId] = useState(null);
  const [editingMonthId, setEditingMonthId] = useState(null);
  const [editYearData, setEditYearData] = useState({});
  const [editMonthData, setEditMonthData] = useState({});

  // Weekday bulk assignment
  const [weekdayBulkType, setWeekdayBulkType] = useState("");
  const [weekdayBulkDay, setWeekdayBulkDay] = useState("");
  const [weekdayBulkScope, setWeekdayBulkScope] = useState("month");
  const [weekdayBulkMonthId, setWeekdayBulkMonthId] = useState("");

  // Export/Import
  const [exportMonthId, setExportMonthId] = useState("");

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

      const currentYear = (yearRes.data?.data || []).find((y) => y.is_current);
      if (currentYear) {
        setOverviewYear(currentYear);
      }
    } catch (e) {
      toast.error("Failed to load calendar data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Fetch calendar days for grid
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
    if (!newYear.year_label) return toast.error("Enter year label");
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
        start_date_BS: "",
        end_date_BS: "",
      });
      loadAll();
    } catch (e) {
      toast.error("Failed to add year");
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
      loadAll();
    } catch (e) {
      toast.error("Failed to delete year");
    } finally {
      setBusy(false);
    }
  };

  const startEditingYear = (year) => {
    setEditingYearId(year.id);
    setEditYearData(year);
  };

  const handleUpdateYear = async () => {
    setBusy(true);
    try {
      await updateYear(editingYearId, editYearData);
      toast.success("Year updated");
      setEditingYearId(null);
      loadAll();
    } catch (e) {
      toast.error("Failed to update year");
    } finally {
      setBusy(false);
    }
  };

  const handleAddMonth = async () => {
    if (!newMonth.year_id || !newMonth.month_name) {
      return toast.error("Fill all required fields");
    }
    setBusy(true);
    try {
      await createMonth({
        ...newMonth,
        date_format: calendarType,
      });
      toast.success("Month added successfully");
      setNewMonth({
        month_name: "",
        year_id: "",
        bs_month_index: 1,
        start_date: "",
        end_date: "",
        start_day_info: "",
        end_day_info: "",
      });
      loadAll();
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
      loadAll();
    } catch (e) {
      toast.error("Failed to delete month");
    } finally {
      setBusy(false);
    }
  };

  const startEditing = (month) => {
    setEditingMonthId(month.id);
    setEditMonthData(month);
  };

  const handleUpdateMonth = async () => {
    setBusy(true);
    try {
      await updateMonth(editingMonthId, editMonthData);
      toast.success("Month updated");
      setEditingMonthId(null);
      loadAll();
    } catch (e) {
      toast.error("Failed to update month");
    } finally {
      setBusy(false);
    }
  };

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
    if (!window.confirm("Delete this day type?")) return;
    setBusy(true);
    try {
      await deleteDayType(id);
      toast.success("Day type deleted");
      loadAll();
    } catch (e) {
      toast.error("Failed to delete day type");
    } finally {
      setBusy(false);
    }
  };

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
    if (!window.confirm("Delete this category?")) return;
    setBusy(true);
    try {
      await deleteDayCategory(id);
      toast.success("Category deleted");
      loadAll();
    } catch (e) {
      toast.error("Failed to delete category");
    } finally {
      setBusy(false);
    }
  };

  const handleBulkAssign = async (clearMode = false) => {
    if (!gridMonthId) return toast.error("Select a month");
    if (!clearMode && !bulkType) return toast.error("Select a day type");

    setBusy(true);
    try {
      const assignments = Array.from(bulkSelected).map((id) => ({
        calendarDayId: id,
        dayTypeId: clearMode ? null : bulkType,
      }));

      await bulkAssignDayTypes(assignments);
      toast.success(
        `${assignments.length} days ${clearMode ? "cleared" : "assigned"}`,
      );
      setBulkSelected(new Set());
      setBulkType("");
      fetchGridDays();
    } catch (e) {
      toast.error("Bulk assignment failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCellClick = (id) => {
    const newSet = new Set(bulkSelected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setBulkSelected(newSet);
  };

  const handleQuickClear = async (id) => {
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

  const handleAssignByWeekday = async () => {
    if (!weekdayBulkType || !weekdayBulkDay) {
      return toast.error("Select day type and weekday");
    }

    setBusy(true);
    try {
      const payload = {
        dayType: weekdayBulkType,
        weekday: weekdayBulkDay,
        monthId: weekdayBulkScope === "month" ? weekdayBulkMonthId || gridMonthId : null,
        year_id: weekdayBulkScope === "year" ? gridYearId : null,
      };

      const response = await assignByWeekday(payload);
      const count = response?.data?.count || response?.data?.data?.length || 0;
      toast.success(`Assigned to ${count} ${weekdayBulkDay}(s)`);

      setWeekdayBulkType("");
      setWeekdayBulkDay("");
      fetchGridDays();
    } catch (e) {
      toast.error(e?.response?.data?.error || "Weekday assignment failed");
    } finally {
      setBusy(false);
    }
  };

  // Filter years
  const filteredYears = useMemo(() => {
    return years.filter((y) => {
      const yr = parseInt(y.year_label);
      if (isNaN(yr)) return true;
      if (calendarType === "BS") return yr > 2040;
      return yr <= 2040;
    });
  }, [years, calendarType]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-300 font-medium">Loading calendar settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/10 to-transparent rounded-3xl blur-3xl" />
        <Card className="relative border-indigo-500/30 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                Academic Calendar Settings
              </h1>
              <p className="text-slate-300 flex items-center gap-2">
                <Zap size={16} className="text-indigo-400" />
                Manage academic years, months, and holiday rules
              </p>
            </div>
            <div className="flex gap-3 p-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <Button
                size="md"
                variant={calendarType === "BS" ? "primary" : "ghost"}
                onClick={() => updateSetting("calendar_type", "BS")}
              >
                BS
              </Button>
              <Button
                size="md"
                variant={calendarType === "AD" ? "primary" : "ghost"}
                onClick={() => updateSetting("calendar_type", "AD")}
              >
                AD
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-3 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm w-fit">
        {[
          { id: "setup", label: "Setup & Configuration", icon: Settings },
          { id: "grid", label: "Day Assignments", icon: Grid3x3 },
          { id: "portability", label: "Import / Export", icon: FileUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all duration-200",
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "setup" && (
          <div className="space-y-6">
            {/* Years Section */}
            <CollapsibleSection
              title="Academic Years"
              icon={Calendar}
              defaultOpen={true}
            >
              <div className="space-y-6">
                {/* Add Year Form */}
                <div className="p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-xl">
                  <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                    Add New Year
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Year Label"
                      placeholder={calendarType === "BS" ? "2083" : "2025-2026"}
                      value={newYear.year_label}
                      onChange={(e) =>
                        setNewYear({ ...newYear, year_label: e.target.value })
                      }
                    />
                    <div className="flex items-end gap-2">
                      <Input
                        label="Set as Current"
                        type="checkbox"
                        checked={newYear.is_current}
                        onChange={(e) =>
                          setNewYear({
                            ...newYear,
                            is_current: e.target.checked,
                          })
                        }
                        className="w-5 h-5 cursor-pointer"
                      />
                      <span className="text-sm text-slate-400 mb-3">
                        Mark this year as current
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Input
                      label="Year Label (AD)"
                      placeholder="2025-2026"
                      value={newYear.year_label_AD}
                      onChange={(e) =>
                        setNewYear({
                          ...newYear,
                          year_label_AD: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Year Label (BS)"
                      placeholder="2082-2083"
                      value={newYear.year_label_BS}
                      onChange={(e) =>
                        setNewYear({
                          ...newYear,
                          year_label_BS: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <UniversalDatePicker
                      label="Start Date (AD)"
                      value={newYear.start_date_AD}
                      onChange={(val) =>
                        setNewYear({
                          ...newYear,
                          start_date_AD: val,
                        })
                      }
                    />
                    <UniversalDatePicker
                      label="End Date (AD)"
                      value={newYear.end_date_AD}
                      onChange={(val) =>
                        setNewYear({
                          ...newYear,
                          end_date_AD: val,
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      icon={Plus}
                      onClick={handleAddYear}
                      disabled={busy}
                    >
                      Add Year
                    </Button>
                  </div>
                </div>

                {/* Years List */}
                <div className="grid gap-3">
                  {filteredYears.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      No years added yet
                    </div>
                  ) : (
                    filteredYears.map((year) => (
                      <div
                        key={year.id}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Calendar
                            size={20}
                            className="text-indigo-400 group-hover:scale-110 transition-transform"
                          />
                          <div>
                            <p className="font-bold text-white">
                              {year.year_label}
                            </p>
                            <p className="text-xs text-slate-400">
                              {year.year_label_AD} / {year.year_label_BS}
                            </p>
                          </div>
                          {year.is_current && (
                            <Badge variant="success">
                              <Check size={12} />
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit2}
                            onClick={() => startEditingYear(year)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() =>
                              handleDeleteYear(year.id, year.year_label)
                            }
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* Months Section */}
            <CollapsibleSection
              title="Academic Months"
              icon={Calendar}
              defaultOpen={false}
            >
              <div className="space-y-6">
                <div className="p-6 bg-emerald-600/10 border border-emerald-500/30 rounded-xl">
                  <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                    Add New Month
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Academic Year"
                      value={newMonth.year_id}
                      onChange={(e) =>
                        setNewMonth({ ...newMonth, year_id: e.target.value })
                      }
                      options={[
                        { value: "", label: "Select Year..." },
                        ...filteredYears.map((y) => ({
                          value: y.id,
                          label: y.year_label,
                        })),
                      ]}
                    />
                    <Select
                      label={`${calendarType} Month`}
                      value={newMonth.bs_month_index}
                      onChange={(e) =>
                        setNewMonth({
                          ...newMonth,
                          bs_month_index: parseInt(e.target.value),
                        })
                      }
                      options={
                        calendarType === "BS"
                          ? BS_MONTHS.map((m, i) => ({
                              value: i + 1,
                              label: m,
                            }))
                          : AD_MONTHS.map((m, i) => ({
                              value: i + 1,
                              label: m,
                            }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <UniversalDatePicker
                      label="Period Start"
                      value={newMonth.start_date}
                      onChange={(val) =>
                        setNewMonth({ ...newMonth, start_date: val })
                      }
                    />
                    <UniversalDatePicker
                      label="Period End"
                      value={newMonth.end_date}
                      onChange={(val) =>
                        setNewMonth({ ...newMonth, end_date: val })
                      }
                    />
                  </div>
                  <Input
                    label="Display Label"
                    placeholder={
                      calendarType === "BS" ? "Baisakh 2083" : "January 2024"
                    }
                    value={newMonth.month_name}
                    onChange={(e) =>
                      setNewMonth({ ...newMonth, month_name: e.target.value })
                    }
                    className="mt-4"
                  />
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="success"
                      size="lg"
                      icon={Plus}
                      onClick={handleAddMonth}
                      disabled={busy}
                    >
                      Create Month
                    </Button>
                  </div>
                </div>

                {/* Months List */}
                <div className="grid gap-3">
                  {currentYearMonths.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      No months for current year
                    </div>
                  ) : (
                    currentYearMonths.map((month) => (
                      <div
                        key={month.id}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Calendar
                            size={20}
                            className="text-emerald-400 group-hover:scale-110 transition-transform"
                          />
                          <div>
                            <p className="font-bold text-white">
                              {month.month_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {month.start_date} to {month.end_date}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit2}
                            onClick={() => startEditing(month)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDeleteMonth(month.id)}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CollapsibleSection>

            {/* Categories Section */}
            <CollapsibleSection
              title="Day Categories"
              icon={Settings}
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    label="Category Name"
                    placeholder="e.g., Annual Day, Sports Day"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-end">
                    <Button
                      variant="primary"
                      onClick={handleAddCategory}
                      disabled={busy}
                      icon={Plus}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant="secondary"
                      className="group cursor-pointer hover:border-rose-500/50"
                    >
                      {cat.category_name}
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {/* Day Types Section */}
            <CollapsibleSection
              title="Day Classifications"
              icon={Zap}
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Type Name"
                    placeholder="e.g., Holiday, Working Day"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                  />
                  <Select
                    label="Category"
                    value={newTypeCategoryId}
                    onChange={(e) => setNewTypeCategoryId(e.target.value)}
                    options={[
                      { value: "", label: "Select Category..." },
                      ...categories.map((c) => ({
                        value: c.id,
                        label: c.category_name,
                      })),
                    ]}
                  />
                  <div className="flex items-end">
                    <Button
                      variant="primary"
                      onClick={handleAddDayType}
                      disabled={busy}
                      icon={Plus}
                      className="w-full"
                    >
                      Add Type
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  {dayTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-all group"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">
                          {type.day_type}
                        </p>
                        {type.category_name && (
                          <p className="text-xs text-slate-400">
                            {type.category_name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDeleteDayType(type.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}

        {activeTab === "grid" && (
          <div className="space-y-6">
            {/* Grid Controls */}
            <Card className="bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent border-indigo-500/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Select
                  label="Select Year"
                  value={gridYearId}
                  onChange={(e) => setGridYearId(e.target.value)}
                  options={[
                    { value: "", label: "Select Year..." },
                    ...filteredYears.map((y) => ({
                      value: y.id,
                      label: y.year_label,
                    })),
                  ]}
                />
                <Select
                  label="Select Month"
                  value={gridMonthId}
                  onChange={(e) => setGridMonthId(e.target.value)}
                  options={[
                    { value: "", label: "Select Month..." },
                    ...gridMonthOptions.map((m) => ({
                      value: m.id,
                      label: m.month_name,
                    })),
                  ]}
                />
                <div className="flex items-end">
                  <Button
                    variant="secondary"
                    size="md"
                    icon={RefreshCw}
                    className="w-full"
                    onClick={() => {
                      if (gridYearId) {
                        refreshYearlyStats(gridYearId).then(() => {
                          toast.success("Stats refreshed");
                          loadAll();
                        });
                      }
                    }}
                  >
                    Refresh Stats
                  </Button>
                </div>
              </div>

              {/* Weekday Assignment */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
                  Assign by Weekday
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select
                    label="Day Type"
                    value={weekdayBulkType}
                    onChange={(e) => setWeekdayBulkType(e.target.value)}
                    options={[
                      { value: "", label: "Select Type..." },
                      ...dayTypes.map((t) => ({ value: t.id, label: t.day_type })),
                    ]}
                  />
                  <Select
                    label="Weekday"
                    value={weekdayBulkDay}
                    onChange={(e) => setWeekdayBulkDay(e.target.value)}
                    options={[
                      { value: "", label: "Select Day..." },
                      { value: "Sunday", label: "Sunday" },
                      { value: "Monday", label: "Monday" },
                      { value: "Tuesday", label: "Tuesday" },
                      { value: "Wednesday", label: "Wednesday" },
                      { value: "Thursday", label: "Thursday" },
                      { value: "Friday", label: "Friday" },
                      { value: "Saturday", label: "Saturday" },
                    ]}
                  />
                  <Select
                    label="Scope"
                    value={weekdayBulkScope}
                    onChange={(e) => {
                      setWeekdayBulkScope(e.target.value);
                      if (e.target.value === "year") {
                        setWeekdayBulkMonthId("");
                      }
                    }}
                    options={[
                      { value: "month", label: "This Month" },
                      { value: "year", label: "Whole Year" },
                    ]}
                  />
                  <div className="flex items-end">
                    <Button
                      variant="success"
                      size="md"
                      icon={Check}
                      className="w-full"
                      onClick={handleAssignByWeekday}
                      disabled={busy}
                    >
                      Apply Rule
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Calendar Grid */}
            {!gridMonthId ? (
              <Card className="flex flex-col items-center justify-center gap-4 py-12">
                <Calendar size={48} className="text-slate-500" />
                <p className="text-slate-400 font-medium">
                  Select a year and month to view the calendar grid
                </p>
              </Card>
            ) : (
              <Card>
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-bold text-slate-400 py-2"
                      >
                        {day}
                      </div>
                    ),
                  )}
                </div>
                <div className="grid grid-cols-7 gap-3">
                  {calDays.map((day) => {
                    const isSelected = bulkSelected.has(day.id);
                    const style = dayColor(day.day_type, day.category_name);

                    return (
                      <div
                        key={day.id}
                        onClick={() => handleCellClick(day.id)}
                        className={clsx(
                          "relative p-3 rounded-lg border transition-all duration-200 cursor-pointer min-h-[80px] flex flex-col justify-between group",
                          isSelected
                            ? "ring-2 ring-indigo-400 scale-[0.98] border-indigo-400"
                            : "border-white/10 hover:border-white/30 hover:scale-[1.02]",
                          day.day_type ? style.cell : "bg-white/5",
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white text-lg">
                            {day.day_number}
                          </span>
                          <div
                            className={clsx(
                              "w-4 h-4 rounded-full border flex items-center justify-center",
                              isSelected
                                ? "bg-indigo-500 border-indigo-400"
                                : "border-slate-600 bg-white/5",
                            )}
                          >
                            {isSelected && (
                              <Check size={10} className="text-white" />
                            )}
                          </div>
                        </div>
                        {day.day_type && (
                          <span
                            className={clsx(
                              "text-[10px] font-bold uppercase px-2 py-1 rounded text-center",
                              style.badge,
                            )}
                          >
                            {day.day_type}
                          </span>
                        )}
                        {day.day_type && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickClear(day.id);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                          >
                            <X size={12} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bulk Actions */}
                {bulkSelected.size > 0 && (
                  <div className="mt-6 p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {bulkSelected.size} day(s) selected
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={bulkType}
                        onChange={(e) => setBulkType(e.target.value)}
                        options={[
                          { value: "", label: "Select Type..." },
                          ...dayTypes.map((t) => ({
                            value: t.id,
                            label: t.day_type,
                          })),
                        ]}
                      />
                      <Button
                        variant="primary"
                        onClick={() => handleBulkAssign(false)}
                        disabled={!bulkType}
                      >
                        Assign
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleBulkAssign(true)}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {activeTab === "portability" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Month Card */}
            <Card className="bg-gradient-to-br from-emerald-600/10 to-emerald-600/5 border-emerald-500/20">
              <SectionHeader
                icon={Download}
                title="Export Month"
                subtitle="Download calendar data for a specific month"
              />
              <div className="space-y-4">
                <Select
                  label="Year"
                  value={gridYearId}
                  onChange={(e) => setGridYearId(e.target.value)}
                  options={[
                    { value: "", label: "Select Year..." },
                    ...filteredYears.map((y) => ({
                      value: y.id,
                      label: y.year_label,
                    })),
                  ]}
                />
                <Select
                  label="Month"
                  value={exportMonthId}
                  onChange={(e) => setExportMonthId(e.target.value)}
                  options={[
                    { value: "", label: "Select Month..." },
                    ...gridMonthOptions.map((m) => ({
                      value: m.id,
                      label: m.month_name,
                    })),
                  ]}
                />
                <Button
                  variant="success"
                  size="lg"
                  icon={Download}
                  className="w-full"
                  disabled={!exportMonthId || busy}
                  onClick={async () => {
                    if (!exportMonthId) return;
                    setBusy(true);
                    try {
                      const res = await getCalendarDays(
                        exportMonthId,
                        calendarType,
                      );
                      const days = res.data?.data || [];
                      if (days.length === 0)
                        return toast.error("No data found");

                      const headers = ["Day", "Type", "Category"];
                      const rows = days.map((d) => [
                        d.day_number,
                        d.day_type || "Unassigned",
                        d.category_name || "N/A",
                      ]);

                      const csv = [headers, ...rows]
                        .map((e) => e.join(","))
                        .join("\n");
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(
                        new Blob([csv], { type: "text/csv" }),
                      );
                      link.download = `calendar_${exportMonthId}.csv`;
                      link.click();
                      toast.success("Exported successfully");
                    } catch (e) {
                      toast.error("Export failed");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Export CSV
                </Button>
              </div>
            </Card>

            {/* Export Year Card */}
            <Card className="bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 border-indigo-500/20">
              <SectionHeader
                icon={Download}
                title="Export Year"
                subtitle="Download full academic year data"
              />
              <div className="space-y-4">
                <Select
                  label="Academic Year"
                  value={gridYearId}
                  onChange={(e) => setGridYearId(e.target.value)}
                  options={[
                    { value: "", label: "Select Year..." },
                    ...filteredYears.map((y) => ({
                      value: y.id,
                      label: y.year_label,
                    })),
                  ]}
                />
                <Button
                  variant="primary"
                  size="lg"
                  icon={Download}
                  className="w-full"
                  disabled={!gridYearId || busy}
                  onClick={async () => {
                    if (!gridYearId) return;
                    setBusy(true);
                    try {
                      const res = await getCalendarDaysByYear(gridYearId);
                      const days = res.data?.data || [];
                      if (days.length === 0)
                        return toast.error("No data found");

                      const headers = ["Year", "Month", "Day", "Type", "Category"];
                      const rows = days.map((d) => [
                        d.year_label,
                        d.month_name,
                        d.day_number,
                        d.day_type || "Unassigned",
                        d.category_name || "N/A",
                      ]);

                      const csv = [headers, ...rows]
                        .map((e) => e.join(","))
                        .join("\n");
                      const link = document.createElement("a");
                      link.href = URL.createObjectURL(
                        new Blob([csv], { type: "text/csv" }),
                      );
                      link.download = `calendar_year_${gridYearId}.csv`;
                      link.click();
                      toast.success("Exported successfully");
                    } catch (e) {
                      toast.error("Export failed");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Export Year
                </Button>
              </div>
            </Card>

            {/* Import Card */}
            <Card className="bg-gradient-to-br from-amber-600/10 to-amber-600/5 border-amber-500/20">
              <SectionHeader
                icon={Upload}
                title="Import Calendar"
                subtitle="Upload CSV to update day assignments"
              />
              <div className="space-y-4">
                <Select
                  label="Target Year"
                  value={gridYearId}
                  onChange={(e) => setGridYearId(e.target.value)}
                  options={[
                    { value: "", label: "Select Year..." },
                    ...filteredYears.map((y) => ({
                      value: y.id,
                      label: y.year_label,
                    })),
                  ]}
                />
                <div className="p-4 border-2 border-dashed border-amber-500/30 rounded-xl text-center hover:border-amber-500/50 transition-colors">
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="text-amber-400" size={24} />
                    <span className="text-sm font-bold text-white">
                      Choose CSV File
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file || !gridYearId) {
                          toast.error("Select year and file");
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          try {
                            setBusy(true);
                            const text = event.target.result;
                            const lines = text.split("\n").slice(1);
                            const assignments = [];

                            const typeMap = {};
                            dayTypes.forEach(
                              (t) =>
                                (typeMap[t.day_type.toLowerCase()] = t.id),
                            );

                            const res = await getCalendarDaysByYear(gridYearId);
                            const allDays = res.data?.data || [];

                            for (const line of lines) {
                              if (!line.trim()) continue;
                              const cols = line
                                .split(",")
                                .map((c) => c.replace(/^"|"$/g, "").trim());
                              const monthName = cols[1];
                              const dayNum = parseInt(cols[2]);
                              const typeName = cols[3]?.toLowerCase();

                              if (
                                monthName &&
                                dayNum &&
                                typeMap[typeName]
                              ) {
                                const targetDay = allDays.find(
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
                                `Imported ${assignments.length} assignments`,
                              );
                              fetchGridDays();
                            } else {
                              toast.error("No valid data found");
                            }
                          } catch (err) {
                            toast.error("Import failed");
                          } finally {
                            setBusy(false);
                          }
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </Card>

            {/* Template Card */}
            <Card className="bg-gradient-to-br from-slate-600/10 to-slate-600/5 border-slate-500/20">
              <SectionHeader
                icon={FileText}
                title="Download Template"
                subtitle="Get a pre-formatted CSV template"
              />
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  Use this template to import calendar data in the correct format.
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={Download}
                  className="w-full"
                  onClick={() => {
                    const csv = `"Month","Day Number","Date","Day Type","Category"
"Baisakh","1","2024-04-13","Working Day","School Day"
"Baisakh","2","2024-04-14","Holiday","Holiday"`;
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(
                      new Blob([csv], { type: "text/csv" }),
                    );
                    link.download = "template.csv";
                    link.click();
                    toast.success("Template downloaded");
                  }}
                >
                  Download Template
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarSettings;
