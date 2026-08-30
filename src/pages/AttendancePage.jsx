import { useState, useEffect } from 'react';
import AttendanceTable from '../components/attendance/AttendanceTable';
import AttendanceSummary from '../components/attendance/AttendanceSummary';
import { getAttendance, getAttendanceSummary, getAttendanceHistory } from '../api/attendanceApi';
import { formatForApi } from '../utils/formatDate';
import { Filter } from 'lucide-react';
import UniversalDatePicker from '../components/common/UniversalDatePicker';

const EMPTY_SUMMARY = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };

const AttendancePage = () => {
  const [records, setRecords]   = useState([]);
  const [summary, setSummary]   = useState(EMPTY_SUMMARY);
  const [loading, setLoading]   = useState(false);
  const [date, setDate]         = useState(formatForApi(new Date()));
  const [primaryTab, setPrimaryTab] = useState('today'); // today | history
  const [entityTab, setEntityTab] = useState('teacher'); // teacher | employee
  const [historyRange, setHistoryRange] = useState({ start: null, end: null });

  const loadToday = async () => {
    setLoading(true);
    try {
      const [recRes, sumRes] = await Promise.all([
        getAttendance({ date, type: entityTab }),
        getAttendanceSummary({ date, type: entityTab }),
      ]);
      setRecords(recRes.data || []);
      setSummary(sumRes.data || EMPTY_SUMMARY);
    } catch {
      setRecords([]);
      setSummary(EMPTY_SUMMARY);
    } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = { type: entityTab };
      if (historyRange.start) params.startDate = historyRange.start;
      if (historyRange.end) params.endDate = historyRange.end;
      const res = await getAttendanceHistory(params);
      setRecords(res.data || []);
    } catch (e) {
      setRecords([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (primaryTab === 'today') loadToday();
    else loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, primaryTab, entityTab, historyRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color:'var(--text-1)' }}>Attendance</h1>
          <p className="text-sm mt-1" style={{ color:'var(--text-2)' }}>Track and manage teacher and employee attendance (device-backed).</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card rounded-lg overflow-hidden" style={{ gap:6 }}>
            <button onClick={() => setPrimaryTab('today')} className={primaryTab==='today'? 'px-3 py-2 font-semibold':'px-3 py-2'} style={{ background: primaryTab==='today' ? 'var(--bg-card)' : 'transparent', color:'var(--text-1)' }}>Today</button>
            <button onClick={() => setPrimaryTab('history')} className={primaryTab==='history'? 'px-3 py-2 font-semibold':'px-3 py-2'} style={{ background: primaryTab==='history' ? 'var(--bg-card)' : 'transparent', color:'var(--text-1)' }}>History</button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setEntityTab('teacher')} className={entityTab==='teacher'? 'px-3 py-2 font-semibold rounded-lg':'px-3 py-2 rounded-lg'} style={{ background: entityTab==='teacher' ? 'var(--accent-dim)' : 'transparent', color: entityTab==='teacher'? 'var(--accent)': 'var(--text-2)'}}>Teachers</button>
            <button onClick={() => setEntityTab('employee')} className={entityTab==='employee'? 'px-3 py-2 font-semibold rounded-lg':'px-3 py-2 rounded-lg'} style={{ background: entityTab==='employee' ? 'var(--accent-dim)' : 'transparent', color: entityTab==='employee'? 'var(--accent)': 'var(--text-2)'}}>Employees</button>
          </div>

          {primaryTab === 'today' && (
            <>
              <Filter size={16} className="text-slate-400" />
              <UniversalDatePicker value={date} onChange={setDate} />
            </>
          )}

          {primaryTab === 'history' && (
            <>
              <UniversalDatePicker value={historyRange.start} onChange={(v) => setHistoryRange((s)=> ({...s, start: v}))} />
              <UniversalDatePicker value={historyRange.end} onChange={(v) => setHistoryRange((s)=> ({...s, end: v}))} />
            </>
          )}

        </div>
      </div>

      {/* Summary only for today */}
      {primaryTab === 'today' && <AttendanceSummary summary={summary} />}
      <AttendanceTable records={records} loading={loading} mode={'staff'} />
    </div>
  );
};

export default AttendancePage;
