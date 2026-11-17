import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiGrid,
  FiUserCheck,
  FiBriefcase,
  FiClipboard,
  FiCheckCircle,
  FiTrendingUp,
  FiCalendar,
  FiUsers,
  FiPauseCircle,
} from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { formatDateLabel, roleLabel, resolveAssetUrl } from '../../utils/format';

/* Scoped styles (prefixed "ud-") so nothing clashes with your global CSS. */
const styles = `
.ud-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.ud-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.ud-rise { animation: ud-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ud-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.ud-tile { transition: transform .25s ease; }
.ud-hover:hover .ud-tile { transform: scale(1.08) rotate(-4deg); }

.ud-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.ud-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.ud-avatar {
  height: 4.5rem; width: 4.5rem; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1.4rem; font-weight: 700; letter-spacing: .02em;
  box-shadow: 0 0 0 3px rgba(255,255,255,.25), 0 12px 24px -10px rgba(0,0,0,.5);
}
.ud-pill {
  display: inline-flex; align-items: center; padding: .15rem .6rem; border-radius: 999px;
  background: rgba(255,255,255,.14); color: #e2e8f0; font-size: .72rem; font-weight: 600;
}
.ud-badge-wrap { display: inline-flex; background: #fff; border-radius: 999px; padding: .1rem; }

.ud-back {
  display: inline-flex; align-items: center; gap: .4rem; font-size: .875rem; font-weight: 500; color: #475569;
  padding: .35rem .7rem .35rem .5rem; border-radius: .6rem; transition: background .15s, color .15s;
}
.ud-back:hover { background: #eef2f8; color: #0f1b33; }
.ud-back:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .ud-rise { animation: none; }
  .ud-card, .ud-tile, .ud-back { transition: none; }
}
`;

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
  teal: { tile: 'linear-gradient(135deg,#2dd4bf,#0d9488)', glow: 'rgba(13,148,136,.35)' },
  green: { tile: 'linear-gradient(135deg,#4ade80,#16a34a)', glow: 'rgba(22,163,74,.35)' },
  amber: { tile: 'linear-gradient(135deg,#fbbf24,#d97706)', glow: 'rgba(217,119,6,.35)' },
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#38bdf8,#2563eb)',
  'linear-gradient(135deg,#818cf8,#4f46e5)',
  'linear-gradient(135deg,#2dd4bf,#0d9488)',
  'linear-gradient(135deg,#fbbf24,#d97706)',
  'linear-gradient(135deg,#fb7185,#e11d48)',
  'linear-gradient(135deg,#4ade80,#16a34a)',
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function gradientFor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
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
    <div className="ud-card ud-hover ud-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="ud-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
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

function InfoItem({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-200 min-w-0">
      <Icon className="h-4 w-4 shrink-0 text-sky-300" />
      <span className="truncate">{children}</span>
    </span>
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

function SectionHeader({ icon: Icon, title, subtitle, count }) {
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
      {typeof count === 'number' && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy-600 tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: userRes } = await axiosClient.get(`/users/${id}`);
        setUser(userRes.data.user);

        if (userRes.data.user.role === 'employee') {
          const { data: taskRes } = await axiosClient.get('/tasks', { params: { employeeId: id, limit: 15 } });
          setReports(taskRes.data.reports);
        } else if (userRes.data.user.role === 'team_lead') {
          const { data: teamRes } = await axiosClient.get('/users', { params: { role: 'employee', teamLead: id, limit: 100 } });
          setTeamMembers(teamRes.data.users);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load user details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* Numbers for the stat cards, from the data already loaded */
  const stats = useMemo(() => {
    const planned = reports.reduce((s, r) => s + (Number(r.summary?.totalPlanned) || 0), 0);
    const completed = reports.reduce((s, r) => s + (Number(r.summary?.totalCompleted) || 0), 0);
    const avg = reports.length
      ? Math.round(reports.reduce((s, r) => s + (Number(r.summary?.completionPercentage) || 0), 0) / reports.length)
      : 0;
    const active = teamMembers.filter((m) => m.status === 'active').length;
    return { planned, completed, avg, active, inactive: teamMembers.length - active };
  }, [reports, teamMembers]);

  if (loading) return <LoadingSpinner full label="Loading user..." />;
  if (!user) return null;

  const taskColumns = [
    { key: 'taskDate', label: 'Date', render: (r) => formatDateLabel(r.taskDate) },
    { key: 'planned', label: 'Planned', render: (r) => r.summary.totalPlanned },
    { key: 'completed', label: 'Completed', render: (r) => r.summary.totalCompleted },
    { key: 'completionPercentage', label: 'Completion %', render: (r) => <CompletionCell value={r.summary.completionPercentage} /> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const teamColumns = [
    { key: 'employeeCode', label: 'ID' },
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <style>{styles}</style>

      <Link to="/admin/employees" className="ud-back">
        <FiArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* Profile banner */}
      <div className="ud-hero ud-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="ud-avatar" style={{ background: user.profileImage ? '#16305c' : gradientFor(user.fullName) }}>
            {user.profileImage ? (
              <img src={resolveAssetUrl(user.profileImage)} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(user.fullName)
            )}
          </div>

          <div className="flex-1 min-w-[16rem]">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{user.fullName}</h2>
              <span className="ud-badge-wrap"><StatusBadge status={user.status} /></span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="ud-pill">{user.employeeCode}</span>
              <span className="ud-pill">{roleLabel(user.role)}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <InfoItem icon={FiBriefcase}>{user.designation || 'No designation'}</InfoItem>
              <InfoItem icon={FiMail}>{user.email}</InfoItem>
              {user.phone && <InfoItem icon={FiPhone}>{user.phone}</InfoItem>}
              <InfoItem icon={FiGrid}>{user.department?.name || 'Unassigned'}</InfoItem>
              {user.role === 'employee' && <InfoItem icon={FiUserCheck}>Team Lead: {user.teamLead?.fullName || 'Unassigned'}</InfoItem>}
            </div>
          </div>
        </div>
      </div>

      {user.role === 'employee' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FiCalendar} label="Recent Reports" value={reports.length} tone="blue" delay={40} />
            <StatCard icon={FiClipboard} label="Tasks Planned" value={stats.planned} tone="indigo" delay={80} />
            <StatCard icon={FiCheckCircle} label="Tasks Completed" value={stats.completed} tone="green" delay={120} />
            <StatCard icon={FiTrendingUp} label="Avg. Completion" value={stats.avg} suffix="%" tone="teal" delay={160} />
          </div>

          <div className="ud-card ud-rise p-5" style={{ animationDelay: '200ms' }}>
            <SectionHeader icon={FiClipboard} title="Recent Task History" subtitle="Last 15 reports. Select a row to review it" count={reports.length} />
            <DataTable columns={taskColumns} rows={reports} onRowClick={(r) => navigate(`/admin/review/${r._id}`)} emptyTitle="No task history yet" />
          </div>
        </>
      )}

      {user.role === 'team_lead' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={FiUsers} label="Assigned Employees" value={teamMembers.length} tone="blue" delay={40} />
            <StatCard icon={FiCheckCircle} label="Active" value={stats.active} tone="green" delay={80} />
            <StatCard icon={FiPauseCircle} label="Inactive" value={stats.inactive} tone="amber" delay={120} />
          </div>

          <div className="ud-card ud-rise p-5" style={{ animationDelay: '160ms' }}>
            <SectionHeader icon={FiUsers} title="Assigned Employees" subtitle="Select a row to open their profile" count={teamMembers.length} />
            <DataTable columns={teamColumns} rows={teamMembers} onRowClick={(r) => navigate(`/admin/users/${r._id}`)} emptyTitle="No employees assigned yet" />
          </div>
        </>
      )}
    </div>
  );
}