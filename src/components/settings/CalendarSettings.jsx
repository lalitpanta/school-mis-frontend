import React, { useState, useEffect } from "react";
import {
  getYearOptions,
  getMonthAuto,
  seedNepaliYear,
  getYears,
} from "../../api/calendarApi";
import "./CalendarSettings.css";

// Constants
const BS_YEAR_MIN = 2082,
  BS_YEAR_MAX = 2099;
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
  if (!date || typeof date === "string") return date || "";
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

function adToBSState(date) {
  for (let year = BS_YEAR_MIN; year <= BS_YEAR_MAX; year++) {
    for (let month = 1; month <= 12; month++) {
      const info = bsMonthInfo(year, month);
      const end = addDays(info.adStart, info.days - 1);
      if (date >= info.adStart && date <= end) {
        return {
          year,
          month,
          day: Math.floor((date - info.adStart) / 86400000) + 1,
        };
      }
    }
  }
  return { year: BS_YEAR_MIN, month: 1, day: 1 };
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

  useEffect(() => {
    loadYearOptions();
  }, [mode]);

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
    const start = dateStateToAD(academicStart, mode);
    const end = dateStateToAD(academicEnd, mode);
    const days = inclusiveDays(start, end);
    return { start, end, days };
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

    const newYear = {
      id: nextId,
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

    setYears((prevYears) => [...prevYears, newYear]);
    setNextId((prev) => prev + 1);
    setYearLabel("");
    setIsCurrentYear(false);
  };

  const handleDeleteYear = (id) => {
    setYears((prevYears) => prevYears.filter((y) => y.id !== id));
  };

  const handleAddCategory = () => {
    const name = categoryName.trim();
    if (!name) {
      alert("Enter a category name.");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert("That category already exists.");
      return;
    }
    setCategories((prev) => [...prev, { id: nextId, name }]);
    setNextId((prev) => prev + 1);
    setCategoryName("");
  };

  const handleDeleteCategory = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setClassifications((prev) =>
      prev.map((cl) =>
        cl.categoryId === id ? { ...cl, categoryId: "" } : cl
      )
    );
  };

  const handleAddClassification = () => {
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
    setClassifications((prev) => [
      ...prev,
      { id: nextId, name, categoryId: classificationCategory },
    ]);
    setNextId((prev) => prev + 1);
    setClassificationName("");
    setClassificationCategory("");
  };

  const handleDeleteClassification = (id) => {
    setClassifications((prev) => prev.filter((c) => c.id !== id));
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

  const preview = refreshYearPreview();
  const tableYears = years.filter((y) => y.mode === mode);

  return (
    <div className="calendar-settings-wrap">
      <div className="page-head">
        <div>
          <h1 className="page-title">Calendar Setup &amp; Configuration</h1>
          <p className="page-sub">
            Choose the calendar mode, select academic dates, and configure day
            classifications.
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

      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-title">
              <span className="num">1</span>Academic year
            </p>
            <p className="panel-desc">
              {mode === "BS"
                ? "Pick a BS year from the fixed range — nothing is typed by hand."
                : "Pick an AD year from the fixed range — nothing is typed by hand."}
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
                onClick={() => handleOpenAcademicDatePicker("academicStart")}
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
                      <span style={{
                        color: "var(--text-faint)",
                        fontSize: "11.5px",
                      }}>
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
                  (item) => String(item.id) === String(classification.categoryId)
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
        calendar dates.
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
