import React, { useMemo } from "react";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const COLORS = ["#3fbf8f", "#e2574c", "#f0b429", "#5b8def", "#c264e0"];

const getYearLabel = (year) => year?.label || year?.year_label || "";
const getTypeName = (type) => type?.day_type || type?.name || "";

const DayAssignmentBuilder = ({
  years,
  months,
  dayTypes,
  calDays,
  gridYearId,
  gridMonthId,
  assignmentMode,
  selectedWeekdays,
  selectedDates,
  selectedClassification,
  message,
  isAssigning,
  isLoading,
  loadError,
  onYearChange,
  onMonthChange,
  onModeChange,
  onWeekdayToggle,
  onDateToggle,
  onClassificationChange,
  onAssign,
}) => {
  const selectedYear = years.find(
    (year) => String(year.id) === String(gridYearId),
  );
  const selectedMonth = months.find(
    (month) => String(month.id) === String(gridMonthId),
  );
  const monthName = selectedMonth?.month_name || "selected month";
  const assignedCount = useMemo(
    () => calDays.filter((day) => day.day_type).length,
    [calDays],
  );
  const weekdayCounts = useMemo(
    () =>
      WEEKDAYS.map(
        (weekday) =>
          calDays.filter((day) => day.day_of_week === weekday).length,
      ),
    [calDays],
  );
  const leadingBlanks = Math.max(0, WEEKDAYS.indexOf(calDays[0]?.day_of_week));
  const selectedTotal =
    assignmentMode === "weekday" ? selectedWeekdays.size : selectedDates.size;
  const getTypeColor = (dayType) => {
    const typeIndex = dayTypes.findIndex(
      (type) => String(type.day_type || type.name) === String(dayType),
    );
    return COLORS[typeIndex >= 0 ? typeIndex % COLORS.length : 0];
  };

  return (
    <div className="assignment-workspace">
      <div className="assignment-stats">
        <div className="assignment-stat">
          <span>Working days</span>
          <strong>{Math.max(0, calDays.length - assignedCount)}</strong>
          <small>{monthName}</small>
        </div>
        <div className="assignment-stat">
          <span>Month days</span>
          <strong>{calDays.length}</strong>
          <small>{getYearLabel(selectedYear)}</small>
        </div>
        <div className="assignment-stat">
          <span>Assigned dates</span>
          <strong>{assignedCount}</strong>
          <small>{monthName}</small>
        </div>
        <div className="assignment-stat">
          <span>Selected</span>
          <strong>{selectedTotal}</strong>
          <small>
            {assignmentMode === "weekday" ? "weekday group" : "specific dates"}
          </small>
        </div>
      </div>

      <div className="assignment-shell">
        <div className="assignment-heading">
          <div>
            <p className="panel-title">Calendar Setup &amp; Configuration</p>
            <p className="panel-desc">
              Assign by recurring weekday or by exact date.
            </p>
          </div>
          <span className="assignment-mode-badge">Bikram Sambat</span>
        </div>

        <div className="assignment-columns">
          <div className="assignment-builder">
            <div className="assignment-title-row">
              <span className="num">2</span>
              <h2>Day assignments</h2>
            </div>
            <p className="panel-desc assignment-indent">
              Select a month, choose days, then assign a classification.
            </p>

            <div className="assignment-mode-toggle">
              <button
                type="button"
                className={assignmentMode === "weekday" ? "active" : ""}
                onClick={() => onModeChange("weekday")}
              >
                By weekday
              </button>
              <button
                type="button"
                className={assignmentMode === "date" ? "active" : ""}
                onClick={() => onModeChange("date")}
              >
                By specific date
              </button>
            </div>

            <div className="assignment-fields">
              <div className="field">
                <label>Select year</label>
                <select
                  value={gridYearId}
                  onChange={(event) => onYearChange(event.target.value)}
                >
                  <option value="">Choose a year</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {getYearLabel(year)} ({year.mode || "BS"}{" "}
                      {year.value || ""})
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Select month</label>
                <select
                  value={gridMonthId}
                  disabled={!gridYearId}
                  onChange={(event) => onMonthChange(event.target.value)}
                >
                  <option value="">Choose a month</option>
                  {months
                    .filter(
                      (month) => String(month.year_id) === String(gridYearId),
                    )
                    .sort(
                      (first, second) =>
                        (first.bs_month_index || 0) -
                        (second.bs_month_index || 0),
                    )
                    .map((month) => (
                      <option key={month.id} value={month.id}>
                        {month.month_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {!gridMonthId ? (
              <div className="assignment-empty">
                Select a year and month to load available days.
              </div>
            ) : isLoading ? (
              <div className="assignment-empty">Loading calendar days...</div>
            ) : loadError ? (
              <div className="assignment-empty assignment-error">
                {loadError}
              </div>
            ) : assignmentMode === "weekday" ? (
              <div className="assignment-choice-group">
                <p>
                  Select weekdays - applies to every matching day in {monthName}
                </p>
                <div className="weekday-choice-grid">
                  {WEEKDAYS.map((weekday, index) => (
                    <button
                      type="button"
                      key={weekday}
                      className={
                        selectedWeekdays.has(weekday) ? "selected" : ""
                      }
                      onClick={() => onWeekdayToggle(weekday)}
                    >
                      <span>{WEEKDAY_SHORT[index]}</span>
                      <small>{weekdayCounts[index]}</small>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="assignment-choice-group">
                <p>Select exact dates in {monthName}</p>
                <div className="date-choice-grid">
                  {calDays.map((day) => (
                    <button
                      type="button"
                      key={day.id}
                      className={`${selectedDates.has(day.day_number) ? "selected" : ""} ${day.day_type ? "assigned" : ""}`}
                      onClick={() => onDateToggle(day.day_number)}
                      title={day.day_type || "Unassigned"}
                    >
                      <strong>{day.day_number}</strong>
                      <small>{day.day_of_week?.slice(0, 3)}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="classification-group">
              <label>Day classification</label>
              <div className="classification-grid">
                {dayTypes.map((type, index) => (
                  <button
                    type="button"
                    key={type.id}
                    className={
                      String(selectedClassification) === String(type.id)
                        ? "selected"
                        : ""
                    }
                    style={{
                      "--classification-color": COLORS[index % COLORS.length],
                    }}
                    onClick={() =>
                      onClassificationChange({ target: { value: type.id } })
                    }
                  >
                    <span />
                    {getTypeName(type)}
                  </button>
                ))}
              </div>
            </div>
            {message?.text && (
              <div className={`assignment-message ${message.type || ""}`}>
                {message.text}
              </div>
            )}
            <button
              type="button"
              className="assignment-submit"
              disabled={
                !gridMonthId ||
                !selectedClassification ||
                selectedTotal === 0 ||
                isAssigning
              }
              onClick={onAssign}
            >
              {isAssigning ? "Assigning..." : "Assign classification"}
            </button>
          </div>

          <div className="assignment-preview">
            <p className="assignment-preview-label">
              Sidebar calendar preview - {monthName} {selectedYear?.value || ""}
            </p>
            <div className="mini-calendar">
              <div className="mini-weekdays">
                {WEEKDAY_SHORT.map((weekday) => (
                  <span key={weekday}>{weekday[0]}</span>
                ))}
              </div>
              <div className="mini-days">
                {Array.from({ length: leadingBlanks }, (_, index) => (
                  <i key={`blank-${index}`} />
                ))}
                {calDays.map((day) => {
                  const color = getTypeColor(day.day_type);
                  return (
                    <span
                      key={day.id}
                      className={day.day_type ? "assigned" : ""}
                      style={
                        day.day_type
                          ? {
                              background: `${color}22`,
                              border: `1px solid ${color}66`,
                              color,
                            }
                          : undefined
                      }
                    >
                      {day.day_number}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="assignment-legend">
              <p>Legend</p>
              {dayTypes.map((type, index) => (
                <span key={type.id}>
                  <i style={{ background: COLORS[index % COLORS.length] }} />
                  {getTypeName(type)}
                </span>
              ))}
              <span>
                <i className="unassigned-dot" />
                Unassigned
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayAssignmentBuilder;
