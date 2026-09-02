import React from "react";
import { useSettings } from "../../context/SettingsContext";
import { adToBs } from "../../utils/bsCalendar";

/**
 * UniversalDatePicker
 *
 * - In AD mode  : renders a single native <input type="date"> in AD.
 * - In BS mode  : renders an AD native picker (for input) + a readonly
 *   BS text field that auto-calculates from the chosen AD date.
 *
 * The `value` prop and `onChange` callback always use YYYY-MM-DD AD strings
 * so all parent components stay unchanged.
 */
const UniversalDatePicker = ({ value, onChange, className = "" }) => {
  const { settings } = useSettings();
  const calendarType = settings.calendar_type || "BS";

  const baseInput =
    "bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500";

  const adToBsString = (adVal) => {
    if (!adVal) return "";
    try {
      const d = new Date(adVal);
      if (isNaN(d)) return "";
      const bs = adToBs(d);
      if (!bs) return "";
      return `${bs.year}-${String(bs.month).padStart(2, "0")}-${String(bs.day).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  if (calendarType === "BS") {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* AD input — user picks date here */}
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInput} ${className}`}
          placeholder="AD date"
        />
        {/* BS readonly display */}
        <input
          type="text"
          readOnly
          value={adToBsString(value) || "BS date auto-calculated"}
          className="bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 cursor-not-allowed outline-none"
          tabIndex={-1}
        />
      </div>
    );
  }

  // AD mode — plain native date picker
  return (
    <input
      type="date"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseInput} ${className}`}
    />
  );
};

export default UniversalDatePicker;