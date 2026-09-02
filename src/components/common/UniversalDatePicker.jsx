import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSettings } from "../../context/SettingsContext";
import {
  adToBs,
  bsToAd,
  BS_DATA,
  BS_MONTHS,
  getDaysInBsMonth,
} from "../../utils/bsCalendar";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** AD ISO "YYYY-MM-DD" → BS {year,month,day} | null */
function adIsoToBs(adIso) {
  if (!adIso) return null;
  try {
    const d = new Date(adIso + "T00:00:00");   // force local midnight
    if (isNaN(d)) return null;
    return adToBs(d);
  } catch {
    return null;
  }
}

/** BS {year,month,day} → AD ISO "YYYY-MM-DD" | "" */
function bsToAdIso(year, month, day) {
  try {
    const ad = bsToAd(year, month, day);
    if (!ad || isNaN(ad.getTime())) return "";
    const y = ad.getFullYear();
    const m = String(ad.getMonth() + 1).padStart(2, "0");
    const d2 = String(ad.getDate()).padStart(2, "0");
    return `${y}-${m}-${d2}`;
  } catch {
    return "";
  }
}

const BS_YEARS = Object.keys(BS_DATA).map(Number).sort();

// ─────────────────────────────────────────────────────────────────────────────
// BS Picker — Year / Month / Day dropdowns
// Always emits AD ISO via onChange; displays in BS.
// ─────────────────────────────────────────────────────────────────────────────
const BsPicker = ({ value, onChange }) => {
  // Derive initial BS state from the incoming AD ISO string
  const todayBs = adToBs(new Date()) || { year: 2082, month: 1, day: 1 };

  const parseValue = (adIso) => {
    const bs = adIsoToBs(adIso);
    return bs ?? { year: todayBs.year, month: todayBs.month, day: todayBs.day };
  };

  const initial = parseValue(value);
  const [bsYear,  setBsYear]  = useState(initial.year);
  const [bsMonth, setBsMonth] = useState(initial.month);
  const [bsDay,   setBsDay]   = useState(initial.day);

  // Track whether the last onChange we fired matches the current value prop —
  // prevents the re-sync loop (value changes → effect syncs state → effect fires
  // onChange → parent updates value prop → effect syncs state again …)
  const lastEmitted = useRef(value || "");

  // Re-sync state when parent resets the value from outside
  useEffect(() => {
    if (!value || value === lastEmitted.current) return;
    const bs = adIsoToBs(value);
    if (!bs) return;
    setBsYear(bs.year);
    setBsMonth(bs.month);
    setBsDay(bs.day);
  }, [value]);

  // Clamp day when month/year changes (e.g. Mangsir has 29 days)
  const maxDay = getDaysInBsMonth(bsYear, bsMonth) || 30;
  useEffect(() => {
    if (bsDay > maxDay) setBsDay(maxDay);
  }, [bsYear, bsMonth, maxDay]);

  // Emit AD equivalent whenever BS selection changes
  useEffect(() => {
    const adIso = bsToAdIso(bsYear, bsMonth, Math.min(bsDay, maxDay));
    if (!adIso) return;
    lastEmitted.current = adIso;
    if (adIso !== value) onChange(adIso);
  }, [bsYear, bsMonth, bsDay, maxDay]); // intentionally omit value/onChange to avoid loop

  const sel =
    "bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm " +
    "text-slate-200 outline-none focus:border-indigo-500 cursor-pointer hover:border-indigo-400 transition-colors";

  return (
    <div className="flex flex-col gap-1.5 w-full">

      {/* ── Mode badge ── */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-0.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
        Bikram Sambat
      </div>

      {/* ── Three dropdowns ── */}
      <div className="flex gap-1.5 w-full">
        <select
          value={bsYear}
          onChange={(e) => setBsYear(Number(e.target.value))}
          className={`${sel} flex-[3]`}
          title="BS Year"
        >
          {BS_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={bsMonth}
          onChange={(e) => setBsMonth(Number(e.target.value))}
          className={`${sel} flex-[4]`}
          title="BS Month"
        >
          {BS_MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1}>
              {String(i + 1).padStart(2, "0")} · {name}
            </option>
          ))}
        </select>

        <select
          value={Math.min(bsDay, maxDay)}
          onChange={(e) => setBsDay(Number(e.target.value))}
          className={`${sel} flex-[2]`}
          title="BS Day"
        >
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* ── AD equivalent (readonly reference) ── */}
      {value && (
        <div className="flex items-center gap-1.5 text-[11px] px-0.5">
          <span className="text-slate-600">AD equivalent →</span>
          <span className="text-slate-400 font-mono tracking-wide">{value}</span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UniversalDatePicker
// ─────────────────────────────────────────────────────────────────────────────
/**
 * A context-aware date picker that respects the global calendar_type setting.
 *
 * Props
 *   value     — AD ISO "YYYY-MM-DD" (always AD regardless of mode)
 *   onChange  — called with AD ISO string on every change
 *   className — applied to the native AD input (ignored in BS mode)
 *   label     — optional label rendered above the picker
 *
 * BS mode → year/month/day dropdowns; AD equivalent shown as readonly hint.
 * AD mode → native <input type="date"> in Gregorian.
 *
 * The contract is identical in both modes: the parent always works with AD ISO
 * strings and never needs to know which calendar mode is active.
 */
const UniversalDatePicker = ({ value, onChange, className = "", label }) => {
  const { settings } = useSettings();
  const calendarType = settings?.calendar_type || "BS";

  const adClass =
    "bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm " +
    "text-slate-200 outline-none focus:border-indigo-500 w-full " +
    className;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {label}
        </span>
      )}

      {calendarType === "BS" ? (
        <BsPicker value={value} onChange={onChange} />
      ) : (
        <>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
            Gregorian (AD)
          </div>
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={adClass}
          />
        </>
      )}
    </div>
  );
};

export default UniversalDatePicker;