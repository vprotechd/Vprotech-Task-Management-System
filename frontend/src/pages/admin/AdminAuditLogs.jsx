import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiList, FiFileText, FiUsers, FiX, FiActivity } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';

/* Scoped styles (prefixed "al-") so nothing clashes with your global CSS. */
const styles = `
.al-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.al-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.al-rise { animation: al-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes al-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.al-tile { transition: transform .25s ease; }
.al-hover:hover .al-tile { transform: scale(1.08) rotate(-4deg); }

.al-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.al-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}

.al-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }
.al-input {
  height: 2.6rem; padding: 0 .85rem; border: 1.5px solid #dbe2ee; border-radius: .7rem;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.al-input:hover { border-color: #b8c4da; }
.al-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }

.al-clear {
  display: inline-flex; align-items: center; gap: .4rem; height: 2.6rem; padding: 0 .9rem;
  border-radius: .7rem; font-size: .85rem; font-weight: 600; color: #475569; background: #fff; border: 1.5px solid #dbe2ee;
  transition: background .2s, border-color .2s;
}
.al-clear:hover { background: #f1f5f9; border-color: #b8c4da; }
.al-clear:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.al-chip {
  display: inline-block; padding: .15rem .6rem; border-radius: 999px; font-size: .72rem; font-weight: 600; white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .al-rise { animation: none; }
  .al-card, .al-tile, .al-input, .al-clear { transition: none; }
}
`;

const MODULES = ['Auth', 'User', 'Department', 'Task', 'Report'];

const MODULE_STYLES = {
  Auth: { bg: '#e0f2fe', color: '#0369a1' },
  User: { bg: '#e0e7ff', color: '#4338ca' },
  Department: { bg: '#ccfbf1', color: '#0f766e' },
  Task: { bg: '#fef3c7', color: '#b45309' },
  Report: { bg: '#dcfce7', color: '#15803d' },
};
const DEFAULT_MODULE_STYLE = { bg: '#eef2f8', color: '#334155' };

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
  teal: { tile: 'linear-gradient(135deg,#2dd4bf,#0d9488)', glow: 'rgba(13,148,136,.35)' },
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

function StatCard({ icon: Icon, label, value, tone = 'blue', delay = 0 }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="al-card al-hover al-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="al-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{ background: t.tile, boxShadow: `0 10px 18px -8px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">{shown}</p>
      </div>
    </div>
  );
}

function capitalize(text = '') {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [moduleFilter, setModuleFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const limit = 20;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: res } = await axiosClient.get('/audit-logs', {
          params: { page, limit, module: moduleFilter || undefined, from: from || undefined, to: to || undefined },
        });
        setLogs(res.data.logs);
        setTotal(res.meta.total);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load audit logs.');
      } finally {
        setLoading(false);
      }
    })();
  }, [page, moduleFilter, from, to]);

  const columns = [
    { key: 'timestamp', label: 'Timestamp', render: (l) => <span className="whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</span> },
    { key: 'user', label: 'User', render: (l) => <span className="font-medium text-navy-800">{l.user?.fullName || 'Unknown'}</span> },
    { key: 'role', label: 'Role', render: (l) => l.role },
    {
      key: 'module',
      label: 'Module',
      render: (l) => {
        const s = MODULE_STYLES[l.module] || DEFAULT_MODULE_STYLE;
        return <span className="al-chip" style={{ background: s.bg, color: s.color }}>{l.module}</span>;
      },
    },
    { key: 'action', label: 'Action', render: (l) => capitalize(l.action.replace(/_/g, ' ')) },
    { key: 'description', label: 'Description', render: (l) => l.description || '-' },
  ];

  const hasFilters = Boolean(moduleFilter || from || to);

  const clearFilters = () => {
    setModuleFilter('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  /* Numbers for the stat cards, from the page already loaded */
  const pageUsers = useMemo(() => new Set(logs.map((l) => l.user?._id || l.user?.fullName).filter(Boolean)).size, [logs]);

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="al-hero al-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Audit Logs</h2>
          <p className="text-sm text-slate-300 mt-1">
            A record of sign-ins and changes to users, departments, tasks and reports.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FiActivity} label={hasFilters ? 'Matching Entries' : 'Total Entries'} value={total} tone="blue" delay={40} />
        <StatCard icon={FiList} label="Shown on This Page" value={logs.length} tone="indigo" delay={80} />
        <StatCard icon={FiUsers} label="Users on This Page" value={pageUsers} tone="teal" delay={120} />
      </div>

      {/* Filters */}
      <div className="al-card al-rise p-4 flex flex-wrap items-end gap-4" style={{ animationDelay: '160ms' }}>
        <div>
          <label htmlFor="al-module" className="al-label">Module</label>
          <select id="al-module" className="al-input min-w-[11rem]" value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
            <option value="">All Modules</option>
            {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="al-from" className="al-label">From</label>
          <input id="al-from" type="date" className="al-input" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label htmlFor="al-to" className="al-label">To</label>
          <input id="al-to" type="date" className="al-input" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </div>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="al-clear">
            <FiX className="h-4 w-4" /> Clear filters
          </button>
        )}
      </div>

      {/* Log table */}
      <div className="al-card al-rise overflow-hidden" style={{ animationDelay: '220ms' }}>
        <div className="flex items-start justify-between gap-3 p-5 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-navy-500">
              <FiFileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-navy-800">Activity</h3>
              <p className="text-xs text-navy-400 mt-0.5">Most recent first</p>
            </div>
          </div>
          {!loading && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy-600 tabular-nums">
              {total}
            </span>
          )}
        </div>
        <DataTable columns={columns} rows={logs} loading={loading} emptyTitle="No audit log entries found" rowKey="_id" />
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}