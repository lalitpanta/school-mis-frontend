import { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import {
  BS_MONTHS, bsToAd, adToBs, getTodayBs,
  getDaysInBsMonth, prevBsMonth, nextBsMonth,
} from '../utils/bsCalendar';
import { getMonths, getCalendarDays, getAvailableDayTypes, assignDayType, getYears } from '../api/calendarApi';
import { useSettings } from '../context/SettingsContext';


const AD_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS      = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const WEEKDAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

import { dayColor } from '../utils/calendarStyles';

/* ─── Legend dot ─────────────────────────────────────── */
const LEGEND = [
  { label: 'School Day', cls: 'bg-emerald-600' },
  { label: 'Holiday',    cls: 'bg-rose-600' },
  { label: 'Exam',       cls: 'bg-amber-500' },
  { label: 'Other',     cls: 'bg-indigo-600' },
];

/* ═════════════════════════════════════════════════════════ */
const CalendarPage = () => {
  const todayBs = useMemo(() => getTodayBs(), []);

  /* ── view state ── */
  const { settings, updateSetting } = useSettings();
  const calendarType = settings.calendar_type || 'BS';

  const [view,    setView]    = useState({ year: todayBs?.year ?? 2083, month: todayBs?.month ?? 1 });
  const [showBs,  setShowBs]  = useState(calendarType === 'BS');
  const [showAd,  setShowAd]  = useState(calendarType === 'AD');

  // Sync toggles when global setting changes
  useEffect(() => {
    if (calendarType === 'BS') {
      setShowBs(true);
      setShowAd(false);
    } else {
      setShowBs(false);
      setShowAd(true);
    }
  }, [calendarType]);


  /* ── API data ── */
  const [years,       setYears]       = useState([]);  // from DB
  const [months,      setMonths]      = useState([]);  // from DB
  const [dayTypeMap,  setDayTypeMap]  = useState({});  // { "day_number": { type: "Holiday", category: "Holiday" }, ... }
  const [dayIdMap,    setDayIdMap]    = useState({});  // { "day_number": "uuid", ... }
  const [apiMonth,    setApiMonth]    = useState(null); // matched DB month record
  const [loadingDays, setLoadingDays] = useState(false);
  const [apiError,    setApiError]    = useState(null);

  /* ── interaction state ── */
  const [availableDayTypes, setAvailableDayTypes] = useState([]);
  const [selectedDay,       setSelectedDay]       = useState(null);
  const [savingDay,         setSavingDay]         = useState(false);

  /* ── load month list once ── */
  useEffect(() => {
    const loadData = async () => {
      try {
        const yRes = await getYears();
        const yData = yRes.data?.data || yRes.data || [];
        const yearList = Array.isArray(yData) ? yData : [];
        setYears(yearList);
        console.log('✅ Years loaded:', yearList);
      } catch (e) {
        console.error('Failed to load years:', e);
      }

      try {
        const mRes = await getMonths();
        const mData = mRes.data?.data || mRes.data || [];
        const monthList = Array.isArray(mData) ? mData : [];
        setMonths(monthList);
        console.log('✅ Months loaded:', monthList);
      } catch (e) {
        console.error('Failed to load months:', e);
      }

      try {
        const tRes = await getAvailableDayTypes();
        const tData = tRes.data?.data || tRes.data || [];
        const typeList = Array.isArray(tData) ? tData : [];
        setAvailableDayTypes(typeList);
        console.log('✅ Day types loaded:', typeList);
      } catch (e) {
        console.error('Failed to load day types:', e);
      }
    };
    loadData();
  }, []);

  /* ── find current academic year ── */
  const currentYear = useMemo(() => {
    return years.find(y => y.is_current === true) || years[0] || null;
  }, [years]);

  /* ── find matching DB month for current BS view ── */
  const matchedMonth = useMemo(() => {
    if (!months.length || !currentYear) {
      if (!currentYear) console.warn('⚠️ No current year found');
      if (!months.length) console.warn('⚠️ No months loaded');
      return null;
    }
    
    // Match by year_id + bs_month_index (view.month is 1-12 BS)
    const found = months.find(m => {
      const yearMatch = m.year_id === currentYear.id;
      const indexMatch = m.bs_month_index === view.month;
      
      if (yearMatch && !indexMatch) {
        console.log(`⚠️ Year matches but index doesn't: month.bs_month_index=${m.bs_month_index}, view.month=${view.month}`);
      }
      
      return yearMatch && indexMatch;
    });

    if (!found) {
      console.warn(`⚠️ No month found for year ${currentYear.year_label} (${currentYear.id}) with month index ${view.month}`);
      console.log('Available months:', months.filter(m => m.year_id === currentYear.id));
    } else {
      console.log('✅ Matched month:', found);
    }

    return found || null;
  }, [months, view, currentYear]);

  /* ── fetch calendar days when matched month changes ── */
  const fetchCalendarDays = useCallback(async (monthId) => {
    if (!monthId) {
      setDayTypeMap({});
      setDayIdMap({});
      return;
    }
    setLoadingDays(true);
    setApiError(null);
    try {
      const res = await getCalendarDays(monthId, 'BS');
      const days = res.data?.data || res.data || [];
      const tMap = {};
      const iMap = {};
      days.forEach(d => {
        tMap[d.day_number] = d.day_type ? { type: d.day_type, category: d.category_name || '' } : null;
        iMap[d.day_number] = d.id;
      });
      setDayTypeMap(tMap);
      setDayIdMap(iMap);
      setApiMonth(months.find(m => m.id === monthId) || null);
    } catch {
      setApiError('Could not load day types for this month.');
      setDayTypeMap({});
      setDayIdMap({});
    } finally { setLoadingDays(false); }
  }, [months]);

  useEffect(() => {
    fetchCalendarDays(matchedMonth?.id ?? null);
  }, [matchedMonth, fetchCalendarDays]);

  /* ── navigation ── */
  const goToday = () => setView({ year: todayBs?.year ?? 2083, month: todayBs?.month ?? 1 });

  const refAd   = bsToAd(view.year, view.month, 15);
  const adLabel = refAd ? `${AD_MONTHS[refAd.getMonth()]} ${refAd.getFullYear()}` : '';

  /* ── build grid ── */
  const grid = useMemo(() => {
    const daysInMonth = getDaysInBsMonth(view.year, view.month);
    const firstAd     = bsToAd(view.year, view.month, 1);
    const startDow    = firstAd ? firstAd.getDay() : 0;

    const cells = [];

    // Leading empty
    if (startDow > 0) {
      const prev = prevBsMonth(view.year, view.month);
      const prevDays = getDaysInBsMonth(prev.year, prev.month);
      for (let i = startDow - 1; i >= 0; i--) {
        cells.push({ bsYear: prev.year, bsMonth: prev.month, bsDay: prevDays - i, current: false });
      }
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ bsYear: view.year, bsMonth: view.month, bsDay: d, current: true });
    }

    // Trailing
    const remaining = (7 - (cells.length % 7)) % 7;
    const next = nextBsMonth(view.year, view.month);
    for (let d = 1; d <= remaining; d++) {
      cells.push({ bsYear: next.year, bsMonth: next.month, bsDay: d, current: false });
    }

    return cells;
  }, [view]);

  const isToday = (y, m, d) => todayBs && y === todayBs.year && m === todayBs.month && d === todayBs.day;

  /* ─── day-type stats for the info bar ─── */
  const stats = useMemo(() => {
    const counts = {};
    Object.values(dayTypeMap).forEach(dayData => {
      if (dayData && dayData.type) {
        counts[dayData.type] = (counts[dayData.type] || 0) + 1;
      }
    });
    return counts;
  }, [dayTypeMap]);

  /* ── cell click handler ── */
  const handleCellClick = (bsDay, isCurrent) => {
    if (!isCurrent || !matchedMonth) return;
    const dayId = dayIdMap[bsDay];
    if (!dayId) return toast.error('This day has not been generated in the database yet.');

    const dayData = dayTypeMap[bsDay];
    const currentTypeName = dayData ? dayData.type : null;
    const currentTypeObj = currentTypeName ? availableDayTypes.find(t => t.day_type === currentTypeName) : null;
    
    setSelectedDay({
      dayNumber: bsDay,
      dayId: dayId,
      selectedTypeId: currentTypeObj ? String(currentTypeObj.id) : ''
    });
  };

  /* ── save assigned day type ── */
  const handleSaveDayType = async () => {
    if (!selectedDay || !selectedDay.selectedTypeId) return;
    setSavingDay(true);
    try {
      await assignDayType(selectedDay.dayId, selectedDay.selectedTypeId);
      toast.success(`Day ${selectedDay.dayNumber} updated successfully!`);
      fetchCalendarDays(matchedMonth.id);
      setSelectedDay(null);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update day type');
    } finally {
      setSavingDay(false);
    }
  };



  /* ═════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">School Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Live B.S / A.D dual-view with day types from settings
          </p>
        </div>
        <button
          onClick={() => fetchCalendarDays(matchedMonth?.id ?? null)}
          disabled={loadingDays}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium disabled:opacity-40"
        >
          {loadingDays
            ? <Loader2 size={13} className="animate-spin" />
            : <RefreshCw size={13} />}
          Refresh
        </button>
      </div>

      {/* ── Month Nav + Toggles ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => setView(prevBsMonth(view.year, view.month))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={16} />
          </button>

          <div className="text-center min-w-[180px]">
            <p className="text-sm font-bold text-white">{BS_MONTHS[view.month - 1]} {view.year}</p>
            <p className="text-[11px] text-slate-500">{adLabel}</p>
          </div>

          <button onClick={() => setView(nextBsMonth(view.year, view.month))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronRight size={16} />
          </button>

          <button onClick={goToday}
            className="px-3 py-1 text-xs font-medium border border-slate-700 text-slate-300 hover:bg-white/5 rounded-lg transition-colors ml-1">
            Today
          </button>
        </div>

        {/* B.S / A.D toggles */}
        <div className="flex items-center gap-4 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={() => updateSetting('calendar_type', 'BS')}
            className={clsx(
              "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
              calendarType === 'BS' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            B.S Mode
          </button>
          <button
            onClick={() => updateSetting('calendar_type', 'AD')}
            className={clsx(
              "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
              calendarType === 'AD' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            A.D Mode
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <div className="flex items-center gap-3 pr-2">
            {[
              ['showBs', 'BS', showBs, setShowBs],
              ['showAd', 'AD', showAd, setShowAd]
            ].map(([id, label, val, setter]) => (
              <label key={id} className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-300 hover:text-white transition-colors">
                <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)}
                  className="accent-indigo-500 w-3 h-3" />
                {label}
              </label>
            ))}
          </div>
        </div>

      </div>

      {/* ── Info / Status bar ── */}
      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
        {matchedMonth ? (
          <>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Live data — {matchedMonth.month_name}
            </span>
            {loadingDays && <Loader2 size={11} className="animate-spin text-slate-500" />}
            {Object.entries(stats).map(([type, count]) => {
              const s = dayColor(type);
              return (
                <span key={type} className={`px-2.5 py-1 rounded-full border ${s.badge}`}>
                  {count} {type}
                </span>
              );
            })}
            {Object.keys(dayTypeMap).length === 0 && !loadingDays && (
              <span className="px-2.5 py-1 rounded-full border border-slate-700 text-slate-500 bg-slate-800/60">
                No day types configured — set them in Settings → Calendar
              </span>
            )}
          </>
        ) : (
          <span className="flex items-center gap-1">
            <AlertCircle size={11} />
            {!currentYear ? 'No current year set in Settings → Calendar' : months.length === 0 ? 'API unavailable — grid view only' : 'No matching month in DB for this view'}
          </span>
        )}
        {apiError && <span className="text-red-400 flex items-center gap-1"><AlertCircle size={11} /> {apiError}</span>}
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 flex-wrap">
        {LEGEND.map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
            {label}
          </div>
        ))}
      </div>

      {/* ── Calendar Grid ── */}
      <div
        className="flex-1 overflow-hidden"
        style={{ background: 'transparent' }}
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="py-2.5 text-center text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7" style={{ gridAutoRows: 'minmax(90px, 1fr)' }}>
          {grid.map(({ bsYear, bsMonth, bsDay, current }, idx) => {
            const adDate  = bsToAd(bsYear, bsMonth, bsDay);
            const today   = isToday(bsYear, bsMonth, bsDay);
            const dayData = current ? (dayTypeMap[bsDay] || null) : null;
            const dayType = dayData ? dayData.type : null;
            const dayCategory = dayData ? dayData.category : null;
            const s       = dayColor(dayType, dayCategory);

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(bsDay, current)}
                className={clsx(
                  'relative p-3 rounded-2xl flex flex-col gap-1 transition-all duration-300 cursor-pointer shadow-sm m-1',
                  !current && 'opacity-10 opacity-0 pointer-events-none',
                  current && (dayType ? s.cell : 'bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/60'),
                  today && 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-[#0c1220] z-10',
                )}
              >
                {/* Dates row */}
                <div className="flex items-start justify-between">
                  {showBs && (
                    <span className={clsx(
                      'text-2xl font-black leading-none',
                      today ? 'text-indigo-400' : current ? s.num : 'text-slate-700'
                    )}>
                      {bsDay}
                    </span>
                  )}
                  {showAd && adDate && (
                    <span className="text-[9px] font-medium text-slate-500 leading-none text-right">
                      {AD_MONTHS[adDate.getMonth()]}<br />{adDate.getDate()}
                    </span>
                  )}
                </div>

                {/* Day type badge */}
                {current && dayData && dayType && (
                  <span className={clsx(
                    'mt-auto text-[10px] font-black px-2 py-1.5 rounded-lg border self-stretch text-center shadow-md uppercase tracking-tighter',
                    s.badge
                  )}>
                    {dayType}
                  </span>
                )}

                {/* Default label for untyped days */}
                {current && !dayType && !loadingDays && matchedMonth && (
                  <span className="text-[10px] text-slate-700 mt-auto opacity-0 hover:opacity-100 transition-opacity">Click to assign</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Assign Day Type Modal ── */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-1">
              Assign Day Type
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              Select an event or label for Day {selectedDay.dayNumber} of {BS_MONTHS[view.month - 1]}
            </p>
            
            <div className="space-y-5">
              <div>
                <select
                  value={selectedDay?.selectedTypeId ?? ''}
                  onChange={(e) => setSelectedDay({ ...selectedDay, selectedTypeId: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700/80 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">Choose a day type...</option>
                  {availableDayTypes && availableDayTypes.map(t => (
                    <option key={t.id} value={String(t.id)}>{t.day_type}</option>
                  ))}
                </select>
                {(!availableDayTypes || availableDayTypes.length === 0) && (
                  <p className="text-xs text-amber-500 mt-2">No day types available. Please add them in Settings.</p>
                )}
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setSelectedDay(null)}
                  disabled={savingDay}
                  className="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDayType}
                  disabled={!selectedDay.selectedTypeId || savingDay}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                >
                  {savingDay ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
