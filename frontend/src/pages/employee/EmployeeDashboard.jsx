import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import {
  FiSunrise,
  FiSunset,
  FiCheckCircle,
  FiTrendingUp,
  FiBarChart2,
  FiClock,
  FiChevronRight,
  FiAlertCircle,
  FiEdit3,
} from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import StatusBadge from '../../components/StatusBadge';
import { formatDateLabel } from '../../utils/format';
import { toast } from 'react-toastify';

/* Scoped styles (prefixed "ed-") so nothing clashes with your global CSS. */
const styles = `
.ed-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.ed-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.ed-rise { animation: ed-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ed-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.ed-tile { transition: transform .25s ease; }
.ed-hover:hover .ed-tile { transform: scale(1.08) rotate(-4deg); }

.ed-ring { transition: stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1); }
.ed-bar { transition: width 1s cubic-bezier(.2,.8,.2,1); }

.ed-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.ed-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.ed-live { animation: ed-pulse 1.8s ease-in-out infinite; }
@keyframes ed-pulse { 50% { opacity: .35; transform: scale(.8); } }

.ed-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.5rem; padding: 0 1.1rem;
  border-radius: .75rem; font-size: .85rem; font-weight: 600; color: #fff; white-space: nowrap;
  background: linear-gradient(135deg, #0ea5e9, #4f46e5); box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
  transition: transform .15s, box-shadow .2s;
}
.ed-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgba(79,70,229,.95); }
.ed-btn:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }

.ed-row { transition: background .15s ease; border-radius: .75rem; }
.ed-row:hover { background: #f4f8fd; }
.ed-row:hover .ed-chevron { transform: translateX(3px); color: #0f1b33; }
.ed-row:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.ed-chevron { transition: transform .2s ease, color .2s ease; color: #94a3b8; }

.ed-link { display: inline-flex; align-items: center; gap: .25rem; font-size: .85rem; font-weight: 600; color: #475569; transition: color .15s; }
.ed-link:hover { color: #0f1b33; }
.ed-link:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; border-radius: .4rem; }

@media (prefers-reduced-motion: reduce) {
  .ed-rise, .ed-live { animation: none; }
  .ed-card, .ed-tile, .ed-ring, .ed-bar, .ed-btn, .ed-row, .ed-chevron { transition: none; }
}
`;

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

/* Card showing either a number (animated) or a short text such as "Submitted". */
function StatCard({ icon: Icon, label, value, text, tone = 'blue', delay = 0 }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="ed-card ed-hover ed-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="ed-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{ background: t.tile, boxShadow: `0 10px 18px -8px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        {text !== undefined ? (
          <p className="text-xl font-semibold text-navy-800 leading-tight truncate">{text}</p>
        ) : (
          <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">{shown}</p>
        )}
      </div>
    </div>
  );
}

/* Circular progress for today's completion */
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
    <div className="ed-card ed-hover ed-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id="ed-ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9eff8" strokeWidth={stroke} />
          <circle
            className="ed-ring"
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#ed-ring-grad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <FiTrendingUp className="absolute inset-0 m-auto h-5 w-5 text-navy-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400">Today's Completion</p>
        <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">{shown}%</p>
      </div>
    </div>
  );
}

function CardHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-navy-500">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-navy-800">{title}</h3>
          <p className="text-xs text-navy-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
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
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/* Small progress bar + number used for each recent task */
function CompletionCell({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="hidden sm:flex items-center gap-2 w-36">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-navy-700 tabular-nums w-9 text-right">{pct}%</span>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await axiosClient.get('/dashboard/employee');
      setData(res.data);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load dashboard.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner full label="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const chartData = [
    { period: 'Today', Planned: data.today.plannedTasks, Completed: data.today.completedTasks },
    { period: 'This Week', Planned: data.weekly.plannedTasks, Completed: data.weekly.completedTasks },
    { period: 'This Month', Planned: data.monthly.plannedTasks, Completed: data.monthly.completedTasks },
  ];

  const planned = Number(data.today.plannedTasks) || 0;
  const completed = Number(data.today.completedTasks) || 0;
  const todayBarPct = planned > 0 ? Math.min(100, (completed / planned) * 100) : 0;
  const completionPercentage = Number(data.today.completionPercentage) || 0;
  const firstName = user?.fullName?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="ed-hero ed-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              {firstName ? `Welcome back, ${firstName}` : 'My Dashboard'}
            </h2>
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
                <span className="ed-live h-2 w-2 rounded-full bg-emerald-400" />
                Today's tasks
              </span>
              <span className="tabular-nums">{completed} / {planned}</span>
            </div>
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="ed-bar h-full rounded-full"
                style={{ width: `${todayBarPct}%`, background: 'linear-gradient(90deg,#38bdf8,#22c55e)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiSunrise}
          label="Morning Update"
          text={data.today.morningSubmitted ? 'Submitted' : 'Pending'}
          tone={data.today.morningSubmitted ? 'green' : 'amber'}
          delay={40}
        />
        <StatCard
          icon={FiSunset}
          label="Evening Update"
          text={data.today.eveningSubmitted ? 'Submitted' : 'Pending'}
          tone={data.today.eveningSubmitted ? 'green' : 'amber'}
          delay={80}
        />
        <StatCard icon={FiCheckCircle} label="Today Completed" text={`${completed} / ${planned}`} tone="blue" delay={120} />
        <CompletionRing percent={completionPercentage} delay={160} />
      </div>

      {/* Reminders */}
      {!data.today.morningSubmitted && (
        <div className="ed-rise rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3" style={{ animationDelay: '200ms' }}>
          <p className="flex items-center gap-3 text-sm text-amber-900">
            <span className="h-9 w-9 shrink-0 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <FiAlertCircle className="h-5 w-5" />
            </span>
            You haven't submitted your morning plan for today yet.
          </p>
          <Link to="/employee/morning-update" className="ed-btn">
            <FiEdit3 className="h-4 w-4" /> Plan Today's Tasks
          </Link>
        </div>
      )}
      {data.today.morningSubmitted && !data.today.eveningSubmitted && (
        <div className="ed-rise rounded-2xl border border-sky-200 bg-sky-50 p-4 flex flex-wrap items-center justify-between gap-3" style={{ animationDelay: '200ms' }}>
          <p className="flex items-center gap-3 text-sm text-sky-900">
            <span className="h-9 w-9 shrink-0 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600">
              <FiClock className="h-5 w-5" />
            </span>
            Don't forget to record what you completed today.
          </p>
          <Link to="/employee/evening-update" className="ed-btn">
            <FiEdit3 className="h-4 w-4" /> Update Evening Progress
          </Link>
        </div>
      )}

      {/* Chart */}
      <div className="ed-card ed-rise p-5" style={{ animationDelay: '240ms' }}>
        <CardHeader icon={FiBarChart2} title="Morning Planned vs Evening Completed" subtitle="Today, this week and this month" />
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} barGap={4} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="ed-planned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a5b9d6" />
                  <stop offset="100%" stopColor="#7f9bc2" />
                </linearGradient>
                <linearGradient id="ed-completed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(14,165,233,.07)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Planned" fill="url(#ed-planned)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar dataKey="Completed" fill="url(#ed-completed)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="ed-card ed-rise p-5" style={{ animationDelay: '300ms' }}>
        <CardHeader icon={FiClock} title="Recent Tasks" subtitle="Your latest daily reports">
          <Link to="/employee/my-tasks" className="ed-link shrink-0">
            View Full History <FiChevronRight className="h-4 w-4" />
          </Link>
        </CardHeader>

        {data.recentTasks.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center">
              <FiClock className="h-6 w-6 text-navy-300" />
            </div>
            <p className="text-sm font-medium text-navy-600">No task history yet</p>
            <p className="text-xs text-navy-400 mt-1">Your daily reports will appear here after your first plan.</p>
          </div>
        ) : (
          <div className="space-y-1 -mx-2">
            {data.recentTasks.map((r) => (
              <Link
                key={r._id}
                to={`/employee/my-tasks/${r._id}`}
                className="ed-row flex items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy-800">{formatDateLabel(r.taskDate)}</p>
                  <p className="text-xs text-navy-400">{r.summary.totalPlanned} planned · {r.summary.totalCompleted} completed</p>
                </div>
                <div className="flex items-center gap-4">
                  <CompletionCell value={r.summary.completionPercentage} />
                  <StatusBadge status={r.status} />
                  <FiChevronRight className="ed-chevron h-4 w-4 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}