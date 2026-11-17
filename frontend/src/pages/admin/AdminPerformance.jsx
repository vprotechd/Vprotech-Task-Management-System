import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { FiUsers, FiClipboard, FiCheckCircle, FiTrendingUp, FiGrid, FiBarChart2, FiPercent } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { todayISO } from '../../utils/format';

/* Scoped styles (prefixed "ap-") so nothing clashes with your global CSS. */
const styles = `
.ap-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.ap-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.ap-rise { animation: ap-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ap-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.ap-tile { transition: transform .25s ease; }
.ap-hover:hover .ap-tile { transform: scale(1.08) rotate(-4deg); }

.ap-bar { transition: width 1s cubic-bezier(.2,.8,.2,1); }

.ap-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.ap-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.ap-live { animation: ap-pulse 1.8s ease-in-out infinite; }
@keyframes ap-pulse { 50% { opacity: .35; transform: scale(.8); } }

/* Segmented tabs with a sliding pill */
.ap-tabs { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); padding: .25rem; width: 24rem; max-width: 100%;
  background: #eef2f8; border-radius: .85rem; }
.ap-pill { position: absolute; top: .25rem; bottom: .25rem; left: .25rem; width: calc((100% - .5rem) / 3);
  background: #fff; border-radius: .65rem; box-shadow: 0 2px 8px -2px rgba(15,27,51,.25);
  transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.ap-tab { position: relative; z-index: 1; padding: .5rem .75rem; font-size: .875rem; font-weight: 600; color: #64748b;
  border-radius: .65rem; transition: color .2s; text-align: center; }
.ap-tab:hover { color: #0f1b33; }
.ap-tab[aria-selected="true"] { color: #0f1b33; }
.ap-tab:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.ap-input {
  height: 2.6rem; padding: 0 .85rem; border: 1.5px solid #dbe2ee; border-radius: .7rem;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.ap-input:hover { border-color: #b8c4da; }
.ap-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.ap-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }

@media (prefers-reduced-motion: reduce) {
  .ap-rise, .ap-live { animation: none; }
  .ap-card, .ap-tile, .ap-bar, .ap-pill, .ap-input, .ap-tab { transition: none; }
}
`;

const TABS = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'custom', label: 'Custom Range' },
];

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
  teal: { tile: 'linear-gradient(135deg,#2dd4bf,#0d9488)', glow: 'rgba(13,148,136,.35)' },
  green: { tile: 'linear-gradient(135deg,#4ade80,#16a34a)', glow: 'rgba(22,163,74,.35)' },
};

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shortName(name) {
  if (!name) return '-';
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}

function formatDay(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/* Animated count-up for numbers */
function useCountUp(target, duration = 800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const end = Number(target) || 0;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(end);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setN(Math.round(end * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

function StatCard({ icon: Icon, label, value, suffix = '', tone = 'blue', delay = 0 }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="ap-card ap-hover ap-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="ap-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{ background: t.tile, boxShadow: `0 10px 18px -8px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">
          {shown}
          {suffix}
        </p>
      </div>
    </div>
  );
}

function CardHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-navy-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h3 className="font-semibold text-navy-800">{title}</h3>
        <p className="text-xs text-navy-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, percent = false }) {
  if (!active || !payload?.length) return null;
  const heading = payload[0]?.payload?.fullName || label;
  return (
    <div className="rounded-lg bg-navy-900 px-3 py-2 text-xs text-white shadow-xl">
      {heading && <p className="mb-1 font-semibold">{heading}</p>}
      {payload[0]?.payload?.department && <p className="mb-1 text-slate-300">{payload[0].payload.department}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold">
            {p.value}
            {percent ? '%' : ''}
          </span>
        </p>
      ))}
    </div>
  );
}

// Company-wide version of the performance charts - same shape as
// TeamLeadPerformance.jsx, but with department/team lead/employee
// filters and no team scoping (Admin sees everyone, including Team
// Leads' own self-submitted reports, automatically - no special-casing
// needed here since /reports/* already returns them for Admin).
export default function AdminPerformance() {
  const [tab, setTab] = useState('weekly');
  const [weekStart, setWeekStart] = useState(todayISO());
  const [month, setMonth] = useState(currentMonthValue());
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [department, setDepartment] = useState('');
  const [teamLead, setTeamLead] = useState('');
  const [departments, setDepartments] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axiosClient.get('/departments', { params: { limit: 100, status: 'active' } }).then(({ data: res }) => setDepartments(res.data.departments)).catch(() => {});
    axiosClient.get('/users/team-leads', { params: { status: 'active' } }).then(({ data: res }) => setTeamLeads(res.data.teamLeads)).catch(() => {});
  }, []);

  const paramsForTab = () => {
    const base = { department: department || undefined, teamLead: teamLead || undefined };
    if (tab === 'weekly') return { ...base, weekStart };
    if (tab === 'monthly') return { ...base, month };
    return { ...base, from, to };
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await axiosClient.get(`/reports/${tab}`, { params: paramsForTab() });
      setRows(res.data.summary || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load performance data.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [tab, weekStart, month, from, to, department, teamLead]);

  const chartData = rows.map((r) => ({
    name: shortName(r.employee?.fullName),
    fullName: r.employee?.fullName,
    department: r.department?.name,
    Planned: r.totalPlannedTasks,
    Completed: r.totalCompletedTasks,
    'Completion %': r.overallCompletionPercentage,
  }));

  // Department-level roll-up for a second, higher-level view.
  const byDepartment = new Map();
  rows.forEach((r) => {
    const key = r.department?.name || 'Unassigned';
    if (!byDepartment.has(key)) byDepartment.set(key, { department: key, Planned: 0, Completed: 0 });
    const agg = byDepartment.get(key);
    agg.Planned += r.totalPlannedTasks;
    agg.Completed += r.totalCompletedTasks;
  });
  const deptChartData = Array.from(byDepartment.values());

  /* Summary numbers for the banner and stat cards */
  const summary = useMemo(() => {
    const planned = rows.reduce((s, r) => s + (Number(r.totalPlannedTasks) || 0), 0);
    const completed = rows.reduce((s, r) => s + (Number(r.totalCompletedTasks) || 0), 0);
    const avg = rows.length
      ? Math.round(rows.reduce((s, r) => s + (Number(r.overallCompletionPercentage) || 0), 0) / rows.length)
      : 0;
    return { employees: rows.length, planned, completed, avg };
  }, [rows]);

  const tabIndex = TABS.findIndex((t) => t.key === tab);

  const periodLabel = useMemo(() => {
    if (tab === 'weekly') return `Week of ${formatDay(weekStart)}`;
    if (tab === 'monthly') {
      const d = new Date(`${month}-01T00:00:00`);
      return Number.isNaN(d.getTime()) ? month : d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    return from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
  }, [tab, weekStart, month, from, to]);

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="ap-hero ap-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Performance</h2>
            <p className="text-sm text-slate-300 mt-1">{periodLabel}</p>
          </div>
          <div className="min-w-[220px] flex-1 sm:max-w-sm">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="flex items-center gap-2">
                <span className="ap-live h-2 w-2 rounded-full bg-emerald-400" />
                Average completion
              </span>
              <span className="tabular-nums">{summary.avg}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="ap-bar h-full rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, summary.avg))}%`, background: 'linear-gradient(90deg,#38bdf8,#22c55e)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers} label="Employees Reporting" value={summary.employees} tone="blue" delay={40} />
        <StatCard icon={FiClipboard} label="Tasks Planned" value={summary.planned} tone="indigo" delay={80} />
        <StatCard icon={FiCheckCircle} label="Tasks Completed" value={summary.completed} tone="green" delay={120} />
        <StatCard icon={FiTrendingUp} label="Avg. Completion" value={summary.avg} suffix="%" tone="teal" delay={160} />
      </div>

      {/* Tabs + filters */}
      <div className="ap-card ap-rise p-3 sm:p-4 space-y-4" style={{ animationDelay: '200ms' }}>
        <div className="ap-tabs" role="tablist">
          <span className="ap-pill" style={{ transform: `translateX(${tabIndex * 100}%)` }} aria-hidden="true" />
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className="ap-tab">
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {tab === 'weekly' && (
            <div>
              <label htmlFor="ap-week" className="ap-label">Any date in week</label>
              <input id="ap-week" type="date" max={todayISO()} className="ap-input" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            </div>
          )}
          {tab === 'monthly' && (
            <div>
              <label htmlFor="ap-month" className="ap-label">Month</label>
              <input id="ap-month" type="month" className="ap-input" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          )}
          {tab === 'custom' && (
            <>
              <div>
                <label htmlFor="ap-from" className="ap-label">From</label>
                <input id="ap-from" type="date" max={todayISO()} className="ap-input" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ap-to" className="ap-label">To</label>
                <input id="ap-to" type="date" max={todayISO()} className="ap-input" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}
          <div>
            <label htmlFor="ap-dept" className="ap-label">Department</label>
            <select id="ap-dept" className="ap-input min-w-[11rem]" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ap-lead" className="ap-label">Team Lead</label>
            <select id="ap-lead" className="ap-input min-w-[11rem]" value={teamLead} onChange={(e) => setTeamLead(e.target.value)}>
              <option value="">All Team Leads</option>
              {teamLeads.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading performance data..." />
      ) : error ? (
        <div className="ap-card"><ErrorState message={error} onRetry={load} /></div>
      ) : rows.length === 0 ? (
        <div className="ap-card"><EmptyState title="No performance data" description="No submissions found for this selection." /></div>
      ) : (
        <>
          {/* Gradients shared by every chart below */}
          <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="ap-planned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a5b9d6" />
                <stop offset="100%" stopColor="#7f9bc2" />
              </linearGradient>
              <linearGradient id="ap-completed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="ap-planned-h" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a5b9d6" />
                <stop offset="100%" stopColor="#7f9bc2" />
              </linearGradient>
              <linearGradient id="ap-completed-h" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="ap-pct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </svg>

          <div className="ap-card ap-rise p-5" style={{ animationDelay: '240ms' }}>
            <CardHeader icon={FiGrid} title="Department Performance" subtitle="Planned vs completed tasks per department" />
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={deptChartData} barGap={4} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(14,165,233,.07)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Planned" fill="url(#ap-planned)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="Completed" fill="url(#ap-completed)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ap-card ap-rise p-5" style={{ animationDelay: '300ms' }}>
            <CardHeader icon={FiBarChart2} title="Planned vs Completed Tasks" subtitle="Per employee" />
            <div style={{ width: '100%', height: Math.max(260, chartData.length * 36) }}>
              <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" barGap={3} margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(14,165,233,.07)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Planned" fill="url(#ap-planned-h)" radius={[0, 6, 6, 0]} maxBarSize={14} />
                  <Bar dataKey="Completed" fill="url(#ap-completed-h)" radius={[0, 6, 6, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="ap-card ap-rise p-5" style={{ animationDelay: '360ms' }}>
            <CardHeader icon={FiPercent} title="Completion % by Employee" subtitle="Share of planned tasks completed" />
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip percent />} cursor={{ fill: 'rgba(14,165,233,.07)' }} />
                  <Bar dataKey="Completion %" fill="url(#ap-pct)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}