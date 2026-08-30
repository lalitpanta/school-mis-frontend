const cards = [
  { key:'present', label:'Present', c:'#34d399', bg:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.2)' },
  { key:'absent',  label:'Absent',  c:'#f87171', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.2)'  },
  { key:'late',    label:'Late',    c:'#fbbf24', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.2)' },
  { key:'excused', label:'Excused', c:'#38bdf8', bg:'rgba(14,165,233,0.1)', border:'rgba(14,165,233,0.2)' },
];

const AttendanceSummary = ({ summary = {} }) => {
  const total = summary.total || 1;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ key, label, c, bg, border }) => {
        const count = summary[key] || 0;
        const pct   = Math.round((count / total) * 100);
        return (
          <div key={key} className="rounded-2xl border p-4 flex flex-col gap-1"
            style={{ background: bg, borderColor: border }}>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: c, opacity: 0.8 }}>{label}</p>
            <p className="text-3xl font-bold" style={{ color: c }}>{count}</p>
            <p className="text-xs" style={{ color: c, opacity: 0.6 }}>{pct}% of total</p>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: c }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendanceSummary;
