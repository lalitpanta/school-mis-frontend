import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Banknote, ClipboardCheck, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import DashboardHeader from '../components/DashboardHeader';
import axiosInstance from '../api/axiosInstance';

/* ── Donut Chart ── */
const DonutChart = ({ value = 87, size = 110 }) => {
  const r = 42, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rotate-[-90deg]">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border-default)" strokeWidth="12" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="url(#dg)" strokeWidth="12"
        strokeDasharray={`${(value/100)*circ} ${circ}`} strokeLinecap="round" />
      <defs>
        <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/* ── Bar Chart ── */
const DAYS = [
  { day:'Mon', p:88, a:12 }, { day:'Tue', p:92, a:8  }, { day:'Wed', p:85, a:15 },
  { day:'Thu', p:90, a:10 }, { day:'Fri', p:87, a:13 }, { day:'Sat', p:78, a:22 },
  { day:'Today', p:94, a:6 },
];
const BarChart = () => (
  <div className="flex items-end justify-between gap-2 px-2 pt-4" style={{ height: 110 }}>
    {DAYS.map(({ day, p, a }) => {
      const isT = day === 'Today';
      const maxH = 80;
      return (
        <div key={day} className="flex flex-col items-center gap-1 flex-1 group">
          <div className="flex items-end gap-0.5 w-full justify-center">
            <div className="w-3.5 rounded-t-md transition-all duration-500"
              style={{ height: Math.round((p/100)*maxH), background: isT ? 'var(--accent)' : 'var(--accent-dim)' }} />
            <div className="w-3.5 rounded-t-md transition-all duration-500"
              style={{ height: Math.round((a/100)*maxH), background: 'var(--border-default)' }} />
          </div>
          <p className="text-[10px] font-medium" style={{ color: isT ? 'var(--accent)' : 'var(--text-muted)' }}>{day}</p>
        </div>
      );
    })}
  </div>
);

/* ── Stat Card ── */
const iconColors = {
  indigo: { icon: 'var(--accent)', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.2)' },
  green:  { icon: 'var(--success-text)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
  amber:  { icon: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning)' },
  red:    { icon: 'var(--danger)', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.2)'  },
};
const StatCard = ({ title, value, icon: Icon, color, change, positive, sub }) => {
  const ic = iconColors[color] || iconColors.indigo;
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: ic.bg, border: `1px solid ${ic.border}`, color: ic.icon }}>
          <Icon size={18} />
        </div>
        {change && (
          <span className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: positive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                     color: positive ? 'var(--success-text)' : 'var(--danger)' }}>
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{change}
          </span>
        )}
      </div>
      <div>
        <p className="text-[28px] font-bold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{title}</p>
      </div>
      {sub && <p className="text-[11px] border-t pt-2" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-default)' }}>{sub}</p>}
    </div>
  );
};

/* ── Upcoming Events ── */
const EVENTS = [
  { date:'02', month:'NOV', title:'Mid-term Examinations', sub:'All Classes · 9:00 AM',  type:'Exam',    tc:'rgba(99,102,241,0.2)',  tx:'var(--accent)' },
  { date:'05', month:'NOV', title:'Annual Sports Day',     sub:'Main Ground · 8:00 AM',  type:'Event',   tc:'rgba(16,185,129,0.2)', tx:'var(--success-text)' },
  { date:'08', month:'NOV', title:'Parent-Teacher Meeting',sub:'Hall A · 10:00 AM',      type:'Meet',    tc:'var(--warning-bg)', tx:'var(--warning)' },
  { date:'14', month:'NOV', title:"Children's Day Holiday",sub:'School Holiday',          type:'Holiday', tc:'rgba(239,68,68,0.2)',  tx:'var(--danger)' },
];

/* ── Recent Students ── */
const STUDENTS = [
  { initials:'AR', name:'Aryan Raj',    cls:'Class X · A',  grade:'A',  fees:'Paid',    status:'Active', g:'from-indigo-500 to-purple-600' },
  { initials:'PS', name:'Priya Sharma', cls:'Class IX · B', grade:'B',  fees:'Pending', status:'Late',   g:'from-amber-500 to-orange-500'  },
  { initials:'RK', name:'Rohan Kumar',  cls:'Class XI · A', grade:'A+', fees:'Paid',    status:'Active', g:'from-emerald-500 to-teal-500'  },
  { initials:'SM', name:'Simran Mehta', cls:'Class X · C',  grade:'B+', fees:'Pending', status:'Active', g:'from-sky-500 to-blue-600'      },
  { initials:'VT', name:'Vikram Thapa', cls:'Class XII · B',grade:'C',  fees:'Overdue', status:'Late',   g:'from-rose-500 to-red-600'      },
];
const feeColor   = { Paid:'var(--success-text)', Pending:'var(--danger)', Overdue:'var(--danger)' };
const statStyles = {
  Active: { bg:'rgba(16,185,129,0.1)', color:'var(--success-text)', border:'rgba(16,185,129,0.25)' },
  Late:   { bg:'var(--warning-bg)', color:'var(--warning)', border:'var(--warning)' },
};

/* ══ DASHBOARD PAGE ══════════════════════════════════════════ */
const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    totalTeachers: 0,
    feeCollected: 0,
    feePending: 0,
    recentStudents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get('/v1/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  };

  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-sky-500 to-blue-600',
    'from-rose-500 to-red-600'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="w-8 h-8 border-2 border-accent border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
  <div className="space-y-5">
    {/* Dashboard Header */}
    <DashboardHeader title="Dashboard" />

    {/* Stat Cards */}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard title="Total Students"      value={stats.totalStudents} icon={Users}         color="indigo" change="" sub={`${stats.activeStudents} Active · ${stats.inactiveStudents} Inactive`} />
      <StatCard title="Total Teachers"      value={stats.totalTeachers}    icon={BookOpen}       color="green"  change="" sub="Staff Count" />
      <StatCard title="Fee Collected"       value={formatCurrency(stats.feeCollected)} icon={Banknote}       color="amber"  change="" sub={`${formatCurrency(stats.feePending)} Pending`} />
      <StatCard title="Avg Attendance"      value="0%" icon={ClipboardCheck} color="red"    change="" sub="0 Absent Today" />
    </div>

    {/* Main Grid */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

      {/* Left 2/3 */}
      <div className="xl:col-span-2 space-y-4">

        {/* Weekly Attendance */}
        <div className="rounded-2xl p-5" style={{ background:'var(--bg-surface)', border:'1px solid var(--border-default)', boxShadow:'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>Weekly Attendance Overview</p>
            <button className="flex items-center gap-1 text-xs font-medium transition-colors" style={{ color:'var(--accent)' }}>
              View Full Report <ExternalLink size={11} />
            </button>
          </div>
          <div className="flex items-center gap-4 mb-2">
            {[['Present','var(--accent)'],['Absent','var(--border-default)']].map(([l,c])=>(
              <span key={l} className="flex items-center gap-1.5 text-[11px]" style={{ color:'var(--text-muted)' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background:c }} /> {l}
              </span>
            ))}
          </div>
          <BarChart />
        </div>

        {/* Recent Students */}
        <div className="rounded-2xl p-5" style={{ background:'var(--bg-surface)', border:'1px solid var(--border-default)', boxShadow:'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>Recent Students</p>
            <button className="text-xs font-medium flex items-center gap-1" style={{ color:'var(--accent)' }}>
              View All <ExternalLink size={11} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs mis-table">
              <thead>
                <tr>
                  {['STUDENT','CLASS','GRADE','FEES','STATUS'].map(h=>(
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentStudents.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No recent students found</td></tr>
                ) : stats.recentStudents.map((s,i)=>(
                  <tr key={i} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0`}>
                          {getInitials(s.full_name)}
                        </div>
                        <span className="font-medium" style={{ color:'var(--text-primary)' }}>{s.full_name}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--text-muted)' }}>{s.class_name || 'N/A'}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                        style={{ background:'var(--accent-dim)', color:'var(--accent)' }}>-</span>
                    </td>
                    <td style={{ color: feeColor['Pending'], fontWeight:500 }}>-</td>
                    <td>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                        style={{ ...statStyles[s.is_active ? 'Active' : 'Late'] }}>{s.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right 1/3 */}
      <div className="space-y-4">

        {/* Pass Rate */}
        <div className="rounded-2xl p-5" style={{ background:'var(--bg-surface)', border:'1px solid var(--border-default)', boxShadow:'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>Pass Rate by Class</p>
            <button className="text-xs font-medium" style={{ color:'var(--accent)' }}>Details</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <DonutChart value={87} size={106} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-bold leading-none" style={{ color:'var(--text-primary)' }}>87%</p>
                <p className="text-[9px] mt-0.5" style={{ color:'var(--text-muted)' }}>Overall</p>
              </div>
            </div>
            <div className="space-y-2.5 flex-1">
              {[{cls:'Class X',pct:70,c:'var(--accent)'},{cls:'Class XI',pct:20,c:'var(--accent)'},{cls:'Class XII',pct:10,c:'var(--accent)'}].map(({cls,pct,c})=>(
                <div key={cls}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1.5" style={{ color:'var(--text-muted)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background:c }} />{cls}
                    </span>
                    <span className="font-medium" style={{ color:'var(--text-muted)' }}>{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background:'var(--border-default)' }}>
                    <div className="h-full rounded-full" style={{ width:`${pct}%`, background:c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-2xl p-5" style={{ background:'var(--bg-surface)', border:'1px solid var(--border-default)', boxShadow:'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>Upcoming Events</p>
            <button className="text-xs font-medium" style={{ color:'var(--accent)' }}>Calendar</button>
          </div>
          <div className="space-y-1">
            {EVENTS.map((ev,i)=>(
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer"
                style={{ ':hover':{ background:'var(--bg-subtle)' } }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-subtle)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <div className="flex-shrink-0 w-10 text-center">
                  <p className="text-base font-bold leading-none" style={{ color:'var(--text-primary)' }}>{ev.date}</p>
                  <p className="text-[9px] font-semibold tracking-widest mt-0.5" style={{ color:'var(--text-muted)' }}>{ev.month}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-medium truncate" style={{ color:'var(--text-primary)' }}>{ev.title}</p>
                    <span className="flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background:ev.tc, color:ev.tx }}>{ev.type}</span>
                  </div>
                  <p className="text-[10px]" style={{ color:'var(--text-muted)' }}>{ev.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default DashboardPage;
