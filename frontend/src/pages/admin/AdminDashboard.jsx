import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  FiUsers,
  FiUserCheck,
  FiGrid,
  FiSunrise,
  FiSunset,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';

/* Scoped styles (prefixed "ad-") so nothing clashes with your global CSS. */
const styles = `
.ad-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.ad-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.ad-rise { animation: ad-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ad-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.ad-tile { transition: transform .25s ease; }
.ad-hover:hover .ad-tile { transform: scale(1.08) rotate(-4deg); }

.ad-ring { transition: stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1); }
.ad-bar { transition: width 1s cubic-bezier(.2,.8,.2,1); }

.ad-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.ad-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.ad-live { animation: ad-pulse 1.8s ease-in-out infinite; }
@keyframes ad-pulse { 50% { opacity: .35; transform: scale(.8); } }

@media (prefers-reduced-motion: reduce) {
  .ad-rise, .ad-live { animation: none; }
  .ad-card, .ad-tile, .ad-ring, .ad-bar { transition: none; }
}
`;

const PIE_COLORS = {
  Completed: '#22c55e',
  Partial: '#f59e0b',
  'Not Completed': '#ef4444',
};

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
  teal: { tile: 'linear-gradient(135deg,#2dd4bf,#0d9488)', glow: 'rgba(13,148,136,.35)' },
  green: { tile: 'linear-gradient(135deg,#4ade80,#16a34a)', glow: 'rgba(22,163,74,.35)' },
  amber: { tile: 'linear-gradient(135deg,#fbbf24,#d97706)', glow: 'rgba(217,119,6,.35)' },
};

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
    <div
      className="ad-card ad-hover ad-rise p-4 flex items-center gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="ad-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
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

/* Circular progress for today's overall completion */
function CompletionRing({ percent, delay = 0 }) {
  const shown = useCountUp(percent);
  const size = 76;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = ready ? c - (clamped / 100) * c : c;

  return (
    <div
      className="ad-card ad-hover ad-rise p-4 flex items-center gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="ad-ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9eff8" strokeWidth={stroke} />
          <circle
            className="ad-ring"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#ad-ring-grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <FiTrendingUp className="absolute inset-0 m-auto h-5 w-5 text-navy-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400">Overall Completion Today</p>
        <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">{shown}%</p>
      </div>
    </div>
  );
}

function CardHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="font-semibold text-navy-800">{title}</h3>
        <p className="text-xs text-navy-400 mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ icon: Icon, title, hint }) {
  return (
    <div className="h-[280px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
      <div className="text-center px-4">
        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center">
          <Icon className="h-6 w-6 text-navy-300" />
        </div>
        <p className="text-sm font-medium text-navy-600">{title}</p>
        <p className="text-xs text-navy-400 mt-1">{hint}</p>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-navy-900 px-3 py-2 text-xs text-white shadow-xl">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.payload?.fill || p.color || p.fill }}
          />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function extractApiData(response) {
  // Handles { success, message, data } and APIs that return the payload directly.
  return response?.data?.data ?? response?.data ?? {};
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsRes, monthlyRes] = await Promise.all([
        axiosClient.get('/dashboard/admin'),
        axiosClient.get('/reports/monthly', {
          params: { month: currentMonthValue() },
        }),
      ]);

      setStats(extractApiData(statsRes));
      setMonthly(extractApiData(monthlyRes));
    } catch (err) {
      console.error('Admin dashboard error:', err);
      const message = err.response?.data?.message || 'Failed to load dashboard.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner full label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats) return null;

  /* Monthly department chart */
  const departmentSummary = monthly?.departmentSummary || {};
  const deptChartData = Object.entries(departmentSummary).map(([name, value]) => ({
    department: name,
    Planned: Number(value?.planned || 0),
    Completed: Number(value?.completed || 0),
  }));

  /* Monthly summary totals */
  const monthlySummary = Array.isArray(monthly?.summary) ? monthly.summary : [];
  const totals = monthlySummary.reduce(
    (acc, report) => {
      acc.completed += Number(report?.totalCompletedTasks || 0);
      acc.partial += Number(report?.totalPartialTasks || 0);
      acc.notCompleted += Number(report?.totalNotCompletedTasks || 0);
      return acc;
    },
    { completed: 0, partial: 0, notCompleted: 0 }
  );

  const pieData = [
    { name: 'Completed', value: totals.completed },
    { name: 'Partial', value: totals.partial },
    { name: 'Not Completed', value: totals.notCompleted },
  ].filter((item) => item.value > 0);

  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0);

  const completionPercentage = Number(stats.overallCompletionPercentage) || 0;
  const plannedTasks = Number(stats.plannedTasks) || 0;
  const completedTasks = Number(stats.completedTasks) || 0;
  const pendingTasks =
    Number(stats.pendingTasks) || Math.max(0, plannedTasks - completedTasks);

  const todayBarPct = plannedTasks > 0 ? Math.min(100, (completedTasks / plannedTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="ad-hero ad-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Admin Dashboard</h2>
            <p className="text-sm text-slate-300 mt-1">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="min-w-[220px] flex-1 sm:max-w-sm">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="flex items-center gap-2">
                <span className="ad-live h-2 w-2 rounded-full bg-emerald-400" />
                Today's tasks
              </span>
              <span className="tabular-nums">
                {completedTasks} / {plannedTasks}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="ad-bar h-full rounded-full"
                style={{
                  width: `${todayBarPct}%`,
                  background: 'linear-gradient(90deg,#38bdf8,#22c55e)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers} label="Total Employees" value={stats.totalEmployees || 0} tone="blue" delay={40} />
        <StatCard icon={FiUserCheck} label="Total Team Leads" value={stats.totalTeamLeads || 0} tone="indigo" delay={80} />
        <StatCard icon={FiGrid} label="Total Departments" value={stats.totalDepartments || 0} tone="teal" delay={120} />
        <CompletionRing percent={completionPercentage} delay={160} />
      </div>

      {/* Today's updates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiSunrise} label="Today's Morning Updates" value={stats.todayMorningUpdates || 0} tone="blue" delay={200} />
        <StatCard icon={FiSunset} label="Today's Evening Updates" value={stats.todayEveningUpdates || 0} tone="indigo" delay={240} />
        <StatCard icon={FiAlertTriangle} label="Missing Morning" value={stats.employeesMissingMorning || 0} tone="amber" delay={280} />
        <StatCard icon={FiAlertTriangle} label="Missing Evening" value={stats.employeesMissingEvening || 0} tone="amber" delay={320} />
      </div>

      {/* Task statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FiGrid} label="Today's Planned Tasks" value={plannedTasks} tone="blue" delay={360} />
        <StatCard icon={FiCheckCircle} label="Today's Completed Tasks" value={completedTasks} tone="green" delay={400} />
        <StatCard icon={FiClock} label="Today's Pending Tasks" value={pendingTasks} tone="amber" delay={440} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Department Performance */}
        <div className="ad-card ad-rise p-5 lg:col-span-2" style={{ animationDelay: '480ms' }}>
          <CardHeader title="Department Performance" subtitle="Current month" />

          {deptChartData.length === 0 ? (
            <EmptyChart
              icon={FiGrid}
              title="No department data available"
              hint="Data will appear when employees submit tasks."
            />
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={deptChartData} barGap={4} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ad-planned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a5b9d6" />
                      <stop offset="100%" stopColor="#7f9bc2" />
                    </linearGradient>
                    <linearGradient id="ad-completed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(14,165,233,.07)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Planned" fill="url(#ad-planned)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="Completed" fill="url(#ad-completed)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Task Completion donut */}
        <div className="ad-card ad-rise p-5" style={{ animationDelay: '540ms' }}>
          <CardHeader title="Task Completion" subtitle="Current month" />

          {pieData.length === 0 ? (
            <EmptyChart
              icon={FiTrendingUp}
              title="No task data available"
              hint="The chart will appear after task updates."
            />
          ) : (
            <div className="relative" style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={62}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div
                className="pointer-events-none absolute left-1/2 text-center"
                style={{ top: '46%', transform: 'translate(-50%, -50%)' }}
              >
                <p className="text-2xl font-semibold text-navy-800 tabular-nums leading-none">{pieTotal}</p>
                <p className="text-[11px] text-navy-400 mt-1">tasks</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}