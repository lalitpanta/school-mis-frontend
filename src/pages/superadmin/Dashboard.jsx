import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllTenants } from "../../api/authApi";
import { 
  Building2, Activity, IndianRupee, Database, 
  MessageSquare, Search, Bell, ChevronRight, TrendingUp, TrendingDown, Minus, LogOut, User, Settings as SettingsIcon
} from "lucide-react";
import toast from "react-hot-toast";

const SuperAdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [token]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await getAllTenants(token);
      if (response.success) {
        setTenants(response.data || []);
      }
    } catch (err) {
      toast.error(err.message || "Failed to fetch tenants");
    } finally {
      setLoading(false);
    }
  };

  // --- REAL DATA CALCULATIONS ---
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((tenant) => tenant.is_active && tenant.status !== 'suspended').length;
  const suspendedTenants = tenants.filter((tenant) => tenant.status === 'suspended').length;
  const trialTenants = tenants.filter((tenant) => tenant.status === 'trial').length;
  const inactiveTenants = totalTenants - activeTenants - suspendedTenants - trialTenants;

  // Plan Distribution (Currently no real plan column on tenant, defaulting to empty stats or derived logic if any)
  // We'll set counts to 0 since no real data exists for plans/subscriptions yet.
  const plans = [
    { name: "Starter", count: 0, percentage: 0, color: "bg-accent" },
    { name: "Pro", count: 0, percentage: 0, color: "bg-accent" },
    { name: "Enterprise", count: 0, percentage: 0, color: "bg-success" },
    { name: "Trial", count: trialTenants, percentage: totalTenants ? Math.round((trialTenants/totalTenants)*100) : 0, color: "bg-warning" },
  ];

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Recent tenants mapped accurately from DB
  const displayTenants = filteredTenants.slice(0, searchTerm ? filteredTenants.length : 5).map((t, i) => {
    return {
      id: t.id,
      initials: (t.name || 'TN').substring(0,2).toUpperCase(),
      name: t.name || 'Unknown',
      email: t.email,
      plan: 'N/A', // Real data: plans are not yet linked to tenants in schema
      storage: 0, // Real data: storage metrics not yet tracked per tenant
      storageColor: 'bg-selected',
      status: t.status || (t.is_active ? 'Active' : 'Inactive'),
      date: new Date(t.created_at || Date.now()).toLocaleDateString(),
      avatarBg: 'bg-subtle'
    };
  });

  // Analytics Metrics (No real backend endpoints for these yet, so they are 0 as requested)
  const uptimeScore = 0;
  const mrr = 0;
  const storageUsed = 0;
  const supportTickets = 0;
  const healthScore = 0;

  const getStatusWidth = (count) => {
    if (totalTenants === 0) return '0%';
    return `${(count / totalTenants) * 100}%`;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        background: "var(--accent-soft)", 
        minHeight: "100vh",
        color: "var(--text-primary)",
      }}
      className="p-8 font-sans flex flex-col gap-6"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-1">Dashboard</h1>
          <p className="text-sm text-muted">Platform-wide overview across all school tenants</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tenants, status, email..."
              className="w-full pl-9 pr-4 py-2.5 bg-surface border border-default rounded-xl text-sm text-primary focus:outline-none focus:border-accent transition-colors placeholder-slate-500 shadow-sm"
            />
          </div>
          
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-surface border border-default rounded-xl text-muted hover:text-primary transition shadow-sm relative"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-danger rounded-full border border-default"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-subtle border border-default rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b border-default flex justify-between items-center bg-surface">
                  <h3 className="font-semibold text-primary">Notifications</h3>
                  <button className="text-xs text-accent hover:text-accent">Mark all as read</button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="p-4 border-b border-default hover:bg-subtle cursor-pointer transition">
                    <p className="text-sm text-muted mb-1"><span className="font-semibold text-primary">New Tenant</span> registered successfully.</p>
                    <p className="text-xs text-muted">2 minutes ago</p>
                  </div>
                  <div className="p-4 border-b border-default hover:bg-subtle cursor-pointer transition">
                    <p className="text-sm text-muted mb-1"><span className="font-semibold text-primary">System Update</span> completed.</p>
                    <p className="text-xs text-muted">1 hour ago</p>
                  </div>
                </div>
                <div className="p-3 text-center bg-surface border-t border-default">
                  <button className="text-xs text-muted hover:text-primary transition">View all notifications</button>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative" ref={profileRef}>
            <div 
              className="flex items-center gap-3 pl-4 border-l border-default cursor-pointer hover:opacity-80 transition"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary shadow-lg">
                SA
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-sm font-semibold text-primary">{user?.email || "admin@system.local"}</div>
                <div className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Super Admin</div>
              </div>
            </div>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-subtle border border-default rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-default bg-surface">
                  <p className="text-sm text-primary font-medium truncate">{user?.email || "admin@system.local"}</p>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => navigate("/superadmin/settings")}
                    className="w-full text-left px-4 py-2.5 text-sm text-muted hover:bg-subtle hover:text-primary transition flex items-center gap-2"
                  >
                    <User size={16} /> Edit Profile
                  </button>
                  <button 
                    onClick={() => navigate("/superadmin/settings")}
                    className="w-full text-left px-4 py-2.5 text-sm text-muted hover:bg-subtle hover:text-primary transition flex items-center gap-2"
                  >
                    <SettingsIcon size={16} /> Settings
                  </button>
                  <div className="h-px bg-subtle my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger-soft transition flex items-center gap-2"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOP METRICS (5 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-5">
        {/* Card 1: Tenants */}
        <div className="bg-surface border border-default rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-default transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent hidden group-hover:block transition-all"></div>
          <div className="flex justify-between items-start mb-5">
            <div className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center border border-accent">
              <Building2 size={20} />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-subtle text-muted text-xs font-bold rounded-full">
              <Minus size={12} /> 0%
            </div>
          </div>
          <div className="text-3xl font-bold text-primary mb-1">{totalTenants}</div>
          <div className="text-sm text-muted mb-5">Total tenants</div>
          <div className="text-xs font-medium text-muted">{activeTenants} active - {inactiveTenants} inactive - {trialTenants} trial</div>
        </div>

        {/* Card 2: Uptime */}
        <div className="bg-surface border border-default rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-default transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-success hidden group-hover:block transition-all"></div>
          <div className="flex justify-between items-start mb-5">
            <div className="w-11 h-11 rounded-xl bg-success text-success flex items-center justify-center border border-success">
              <Activity size={20} />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-subtle text-muted text-xs font-bold rounded-full">
              <Minus size={12} /> 0%
            </div>
          </div>
          <div className="text-3xl font-bold text-primary mb-1">{uptimeScore}%</div>
          <div className="text-sm text-muted mb-5">Avg. platform uptime</div>
          <div className="text-xs font-medium text-muted">Awaiting monitoring data</div>
        </div>

        {/* Card 3: MRR */}
        <div className="bg-surface border border-default rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-default transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent hidden group-hover:block transition-all"></div>
          <div className="flex justify-between items-start mb-5">
            <div className="w-11 h-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center border border-accent">
              <IndianRupee size={20} />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-subtle text-muted text-xs font-bold rounded-full">
              <Minus size={12} /> 0%
            </div>
          </div>
          <div className="text-3xl font-bold text-primary mb-1">₹{mrr}</div>
          <div className="text-sm text-muted mb-5">Monthly recurring revenue</div>
          <div className="text-xs font-medium text-muted">₹0 pending invoices</div>
        </div>

        {/* Card 4: Storage */}
        <div className="bg-surface border border-default rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-default transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-warning hidden group-hover:block transition-all"></div>
          <div className="flex justify-between items-start mb-5">
            <div className="w-11 h-11 rounded-xl bg-warning-soft text-warning flex items-center justify-center border border-warning">
              <Database size={20} />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-subtle text-muted text-xs font-bold rounded-full">
              <Minus size={12} /> 0%
            </div>
          </div>
          <div className="text-3xl font-bold text-primary mb-1 flex items-baseline gap-1">{storageUsed}<span className="text-lg text-muted font-medium tracking-wide">/0 TB</span></div>
          <div className="text-sm text-muted mb-5">Total storage used</div>
          <div className="text-xs font-medium text-muted">0 tenants above 80% quota</div>
        </div>

        {/* Card 5: Tickets */}
        <div className="bg-surface border border-default rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-default transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-danger hidden group-hover:block transition-all"></div>
          <div className="flex justify-between items-start mb-5">
            <div className="w-11 h-11 rounded-xl bg-danger-soft text-danger flex items-center justify-center border border-danger">
              <MessageSquare size={20} />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-subtle text-muted text-xs font-bold rounded-full">
              <Minus size={12} /> 0 today
            </div>
          </div>
          <div className="text-3xl font-bold text-primary mb-1">{supportTickets}</div>
          <div className="text-sm text-muted mb-5">Open support tickets</div>
          <div className="text-xs font-medium text-muted">0 flagged high priority</div>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recent Tenants Table */}
        <div className="lg:col-span-2 bg-surface border border-default rounded-2xl p-7 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-primary">Recent tenants</h2>
            <button className="text-accent hover:text-accent text-sm font-semibold flex items-center gap-1">
              View all <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted border-b border-default">
                  <th className="pb-4 font-semibold w-1/3 pl-2">TENANT</th>
                  <th className="pb-4 font-semibold">PLAN</th>
                  <th className="pb-4 font-semibold">STORAGE</th>
                  <th className="pb-4 font-semibold">STATUS</th>
                  <th className="pb-4 font-semibold text-right pr-2">CREATED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {displayTenants.length === 0 ? (
                   <tr>
                     <td colSpan="5" className="py-8 text-center text-muted text-sm">No tenants available</td>
                   </tr>
                ) : displayTenants.map((t, idx) => (
                  <tr key={idx} className="hover:bg-surface/[0.02] transition-colors group">
                    <td className="py-4 pl-2 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${t.avatarBg} text-primary flex items-center justify-center text-sm font-bold shadow-inner`}>
                        {t.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-primary group-hover:text-primary transition-colors text-[15px]">{t.name}</div>
                        <div className="text-[12px] text-muted">{t.email}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-3 py-1.5 rounded-lg bg-subtle text-muted text-[11px] font-medium border border-default shadow-sm">
                        {t.plan}
                      </span>
                    </td>
                    <td className="py-4 pr-8">
                      <div className="flex items-center gap-3">
                        <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden flex-1">
                          <div className={`h-full ${t.storageColor} rounded-full`} style={{ width: `${t.storage}%` }}></div>
                        </div>
                        <span className="text-xs font-semibold text-muted w-8">{t.storage}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full w-fit border ${
                        t.status === 'Active' || t.status === 'active'
                        ? 'bg-success text-success border-success'
                        : 'bg-subtle text-muted border-default'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'Active' || t.status === 'active' ? 'bg-success animate-pulse' : 'bg-selected'}`}></div>
                        <span className="text-[11px] font-bold capitalize">{t.status}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs text-muted font-medium text-right pr-2">
                      {t.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Pulse */}
        <div className="bg-surface border border-default rounded-2xl p-7 shadow-lg flex flex-col">
          <h2 className="text-lg font-bold text-primary mb-8">Platform pulse</h2>
          
          <div className="flex items-center justify-center gap-8 flex-1 mb-4">
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="10" fill="none" />
                <circle 
                  cx="50" cy="50" r="40" 
                  stroke="var(--accent)" 
                  strokeWidth="10" 
                  fill="none" 
                  strokeDasharray="251.2" 
                  strokeDashoffset="251.2" // 0% 
                  strokeLinecap="round" 
                  style={{ filter: 'drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.5))', transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
                <span className="text-4xl font-bold text-primary tracking-tight">{healthScore}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted mt-1">Health Score</span>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center text-[13px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-selected shadow-[0_0_8px_rgba(71,85,105,0.6)]"></div>
                  <span className="text-muted font-medium">Uptime & perf</span>
                </div>
                <span className="font-bold text-muted">0</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-selected shadow-[0_0_8px_rgba(71,85,105,0.6)]"></div>
                  <span className="text-muted font-medium">Billing health</span>
                </div>
                <span className="font-bold text-muted">0</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-selected shadow-[0_0_8px_rgba(71,85,105,0.6)]"></div>
                  <span className="text-muted font-medium">Storage headroom</span>
                </div>
                <span className="font-bold text-muted">0</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-selected shadow-[0_0_8px_rgba(71,85,105,0.6)]"></div>
                  <span className="text-muted font-medium">Support response</span>
                </div>
                <span className="font-bold text-muted">0</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Plan Distribution */}
        <div className="lg:col-span-2 bg-surface border border-default rounded-2xl p-7 shadow-lg">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-primary">Plan distribution</h2>
            <div className="text-xs text-muted font-semibold tracking-wide uppercase">{totalTenants} tenants</div>
          </div>
          
          <div className="space-y-6">
            {plans.map((plan, idx) => (
              <div key={idx} className="flex items-center">
                <div className="w-28 text-sm font-semibold text-muted">{plan.name}</div>
                <div className="flex-1 mx-4">
                  <div className="h-2 bg-subtle rounded-full overflow-hidden w-full max-w-lg">
                    <div className={`h-full ${plan.percentage > 0 ? plan.color : 'bg-subtle'} rounded-full relative overflow-hidden`} style={{ width: `${plan.percentage}%` }}>
                       {plan.percentage > 0 && <div className="absolute inset-0 bg-surface/10"></div>}
                    </div>
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm font-bold text-primary">{plan.count}</span>
                  <span className="text-xs font-medium text-muted ml-2">- {plan.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-surface border border-default rounded-2xl p-7 shadow-lg">
          <h2 className="text-lg font-bold text-primary mb-8">Status overview</h2>
          
          <div className="h-4 w-full rounded-full flex overflow-hidden mb-8 shadow-inner border border-default bg-subtle">
             {activeTenants > 0 && (
                <div className="h-full bg-success relative overflow-hidden" style={{ width: getStatusWidth(activeTenants) }}>
                  <div className="absolute inset-0 bg-surface/10"></div>
                </div>
             )}
             {inactiveTenants > 0 && (
                <div className="h-full bg-selected relative overflow-hidden" style={{ width: getStatusWidth(inactiveTenants) }}>
                  <div className="absolute inset-0 bg-surface/10"></div>
                </div>
             )}
             {suspendedTenants > 0 && (
                <div className="h-full bg-danger relative overflow-hidden" style={{ width: getStatusWidth(suspendedTenants) }}>
                  <div className="absolute inset-0 bg-surface/10"></div>
                </div>
             )}
             {trialTenants > 0 && (
                <div className="h-full bg-accent relative overflow-hidden" style={{ width: getStatusWidth(trialTenants) }}>
                  <div className="absolute inset-0 bg-surface/10"></div>
                </div>
             )}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[13px]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="text-muted font-medium">Active</span>
              </div>
              <span className="font-bold text-primary">{activeTenants}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-selected"></div>
                <span className="text-muted font-medium">Inactive</span>
              </div>
              <span className="font-bold text-primary">{inactiveTenants}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-danger"></div>
                <span className="text-muted font-medium">Suspended</span>
              </div>
              <span className="font-bold text-primary">{suspendedTenants}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                <span className="text-muted font-medium">Trial</span>
              </div>
              <span className="font-bold text-primary">{trialTenants}</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
