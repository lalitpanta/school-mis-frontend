import { formatDate } from '../../utils/formatDate';
import { ATTENDANCE_STATUS } from '../../utils/constants';

const statusStyles = {
  [ATTENDANCE_STATUS.PRESENT]: { bg:'rgba(16,185,129,0.12)', color:'#34d399', border:'rgba(16,185,129,0.3)' },
  [ATTENDANCE_STATUS.ABSENT]:  { bg:'rgba(239,68,68,0.12)',  color:'#f87171', border:'rgba(239,68,68,0.3)'  },
  [ATTENDANCE_STATUS.LATE]:    { bg:'rgba(245,158,11,0.12)', color:'#fbbf24', border:'rgba(245,158,11,0.3)' },
  [ATTENDANCE_STATUS.EXCUSED]: { bg:'rgba(14,165,233,0.12)', color:'#38bdf8', border:'rgba(14,165,233,0.3)' },
};

const AttendanceTable = ({ records = [], loading = false, onEdit, mode = 'student' }) => {
  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor:'var(--accent)', borderTopColor:'transparent' }} />
    </div>
  );

  if (!records.length) return (
    <p className="text-center py-12 text-sm" style={{ color:'var(--text-3)' }}>No attendance records found.</p>
  );

  return (
    <div className="overflow-x-auto rounded-2xl" style={{ border:'1px solid var(--border-card)' }}>
      <table className="w-full mis-table">
        <thead>
          <tr>
            {mode === 'student' ? ['#','Student','Class','Date','Status','Marked By','Actions'].map(h=>(
              <th key={h}>{h}</th>
            )) : ['#','Name','Designation','Date','Check-in','Check-out','Status','Actions'].map(h=>(
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((rec, idx) => {
            const s = statusStyles[rec.status] || statusStyles[ATTENDANCE_STATUS.PRESENT];
            if (mode === 'student') {
              return (
                <tr key={rec.id || idx}>
                  <td style={{ color:'var(--text-3)' }}>{idx + 1}</td>
                  <td style={{ color:'var(--text-1)', fontWeight:500 }}>{rec.studentName || '—'}</td>
                  <td style={{ color:'var(--text-2)' }}>{rec.className || '—'}</td>
                  <td style={{ color:'var(--text-2)' }}>{formatDate(rec.date)}</td>
                  <td>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border capitalize"
                      style={{ background:s.bg, color:s.color, borderColor:s.border }}>
                      {rec.status}
                    </span>
                  </td>
                  <td style={{ color:'var(--text-3)' }}>{rec.markedBy || '—'}</td>
                  <td>
                    {onEdit && (
                      <button onClick={() => onEdit(rec)} className="text-xs font-medium transition-colors" style={{ color:'var(--accent)' }}>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            }

            // staff row
            return (
              <tr key={rec.id || idx}>
                <td style={{ color:'var(--text-3)' }}>{idx + 1}</td>
                <td style={{ color:'var(--text-1)', fontWeight:500 }}>{rec.name || '—'}</td>
                <td style={{ color:'var(--text-2)' }}>{rec.designation || '—'}</td>
                <td style={{ color:'var(--text-2)' }}>{rec.checkIn ? new Date(rec.checkIn).toLocaleDateString() : '—'}</td>
                <td style={{ color:'var(--text-2)' }}>{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : '—'}</td>
                <td style={{ color:'var(--text-2)' }}>{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : '—'}</td>
                <td>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border capitalize"
                    style={{ background:s.bg, color:s.color, borderColor:s.border }}>
                    {rec.status}
                  </span>
                </td>
                <td>
                  {onEdit && (
                    <button onClick={() => onEdit(rec)} className="text-xs font-medium transition-colors" style={{ color:'var(--accent)' }}>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
