import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSunset, FiCheckCircle, FiAlertTriangle, FiTrendingUp, FiClipboard } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { todayISO } from '../../utils/format';

/* Scoped styles (prefixed "eu-") so nothing clashes with your global CSS. */
const styles = `
.eu-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.eu-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.eu-rise { animation: eu-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes eu-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.eu-tile { transition: transform .25s ease; }
.eu-hover:hover .eu-tile { transform: scale(1.08) rotate(-4deg); }

.eu-bar { transition: width 1s cubic-bezier(.2,.8,.2,1); }

.eu-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.eu-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.eu-live { animation: eu-pulse 1.8s ease-in-out infinite; }
@keyframes eu-pulse { 50% { opacity: .35; transform: scale(.8); } }

.eu-input {
  height: 2.6rem; padding: 0 .85rem; border: 1.5px solid #dbe2ee; border-radius: .7rem;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.eu-input:hover { border-color: #b8c4da; }
.eu-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.eu-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }

@media (prefers-reduced-motion: reduce) {
  .eu-rise, .eu-live { animation: none; }
  .eu-card, .eu-tile, .eu-bar, .eu-input { transition: none; }
}
`;

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
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
    <div className="eu-card eu-hover eu-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="eu-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
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

/* Small progress bar + number used in the Completion % column */
function CompletionCell({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2 min-w-[7rem]">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-navy-700 tabular-nums w-9 text-right">{pct}%</span>
    </div>
  );
}

export default function AdminEveningUpdates() {
  const [date, setDate] = useState(todayISO());
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosClient.get('/departments', { params: { limit: 100, status: 'active' } }).then(({ data: res }) => setDepartments(res.data.departments)).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: res } = await axiosClient.get('/tasks', { params: { from: date, to: date, department: department || undefined, limit: 200 } });
        setReports(res.data.reports.filter((r) => ['evening_submitted', 'approved', 'needs_correction'].includes(r.status)));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load evening updates.');
      } finally {
        setLoading(false);
      }
    })();
  }, [date, department]);

  const columns = [
    { key: 'employee', label: 'Employee', render: (r) => r.employee?.fullName },
    { key: 'department', label: 'Department', render: (r) => r.department?.name || '-' },
    { key: 'completed', label: 'Completed', render: (r) => r.summary.totalCompleted },
    { key: 'partial', label: 'Partial', render: (r) => r.summary.totalPartial },
    { key: 'notCompleted', label: 'Not Completed', render: (r) => r.summary.totalNotCompleted },
    { key: 'completionPercentage', label: 'Completion %', render: (r) => <CompletionCell value={r.summary.completionPercentage} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  /* Summary numbers for the banner and stat cards */
  const summary = useMemo(() => {
    const submitted = reports.length;
    const approved = reports.filter((r) => r.status === 'approved').length;
    const needsCorrection = reports.filter((r) => r.status === 'needs_correction').length;
    const avg = submitted
      ? Math.round(reports.reduce((sum, r) => sum + (Number(r.summary?.completionPercentage) || 0), 0) / submitted)
      : 0;
    return { submitted, approved, needsCorrection, avg };
  }, [reports]);

  const prettyDate = useMemo(() => {
    const d = new Date(`${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [date]);

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="eu-hero eu-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Evening Updates</h2>
            <p className="text-sm text-slate-300 mt-1">{prettyDate}</p>
          </div>
          <div className="min-w-[220px] flex-1 sm:max-w-sm">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="flex items-center gap-2">
                <span className="eu-live h-2 w-2 rounded-full bg-emerald-400" />
                Average completion
              </span>
              <span className="tabular-nums">{summary.avg}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="eu-bar h-full rounded-full"
                style={{
                  width: `${summary.avg}%`,
                  background: 'linear-gradient(90deg,#38bdf8,#22c55e)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiSunset} label="Evening Submitted" value={summary.submitted} tone="blue" delay={40} />
        <StatCard icon={FiCheckCircle} label="Approved" value={summary.approved} tone="green" delay={80} />
        <StatCard icon={FiAlertTriangle} label="Needs Correction" value={summary.needsCorrection} tone="amber" delay={120} />
        <StatCard icon={FiTrendingUp} label="Avg. Completion" value={summary.avg} suffix="%" tone="indigo" delay={160} />
      </div>

      {/* Filters */}
      <div className="eu-card eu-rise p-4 flex flex-wrap items-end gap-4" style={{ animationDelay: '200ms' }}>
        <div>
          <label htmlFor="eu-date" className="eu-label">Date</label>
          <input
            id="eu-date"
            type="date"
            max={todayISO()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="eu-input"
          />
        </div>
        <div>
          <label htmlFor="eu-dept" className="eu-label">Department</label>
          <select
            id="eu-dept"
            className="eu-input min-w-[12rem]"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Details */}
      <div className="eu-card eu-rise p-5" style={{ animationDelay: '240ms' }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-navy-500">
              <FiClipboard className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-navy-800">Evening Completion Details</h3>
              <p className="text-xs text-navy-400 mt-0.5">Select a row to review the full report</p>
            </div>
          </div>
          {!loading && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy-600 tabular-nums">
              {reports.length}
            </span>
          )}
        </div>
        <DataTable columns={columns} rows={reports} loading={loading} onRowClick={(r) => navigate(`/admin/review/${r._id}`)} emptyTitle="No evening submissions yet" />
      </div>
    </div>
  );
}