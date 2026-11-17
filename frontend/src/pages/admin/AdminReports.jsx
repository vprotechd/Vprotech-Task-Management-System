import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiFileText, FiUsers, FiClipboard, FiCheckCircle, FiTrendingUp, FiBarChart2, FiTable } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { todayISO } from '../../utils/format';

/* Scoped styles (prefixed "ar-") so nothing clashes with your global CSS. */
const styles = `
.ar-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.ar-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.ar-rise { animation: ar-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ar-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.ar-tile { transition: transform .25s ease; }
.ar-hover:hover .ar-tile { transform: scale(1.08) rotate(-4deg); }

.ar-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.ar-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}

/* Segmented tabs with a sliding pill */
.ar-tabs { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); padding: .25rem; width: 32rem; max-width: 100%;
  background: #eef2f8; border-radius: .85rem; }
.ar-pill { position: absolute; top: .25rem; bottom: .25rem; left: .25rem; width: calc((100% - .5rem) / 4);
  background: #fff; border-radius: .65rem; box-shadow: 0 2px 8px -2px rgba(15,27,51,.25);
  transition: transform .3s cubic-bezier(.2,.8,.2,1); }
.ar-tab { position: relative; z-index: 1; padding: .5rem .5rem; font-size: .85rem; font-weight: 600; color: #64748b;
  border-radius: .65rem; transition: color .2s; text-align: center; white-space: nowrap; }
.ar-tab:hover { color: #0f1b33; }
.ar-tab[aria-selected="true"] { color: #0f1b33; }
.ar-tab:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.ar-input {
  height: 2.6rem; padding: 0 .85rem; border: 1.5px solid #dbe2ee; border-radius: .7rem;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.ar-input:hover { border-color: #b8c4da; }
.ar-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.ar-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }

.ar-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.6rem; padding: 0 1.2rem;
  border-radius: .7rem; font-size: .875rem; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #4f46e5); box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
  transition: transform .15s, box-shadow .2s, filter .2s;
}
.ar-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgba(79,70,229,.95); }
.ar-btn:active:not(:disabled) { transform: scale(.98); }
.ar-btn:disabled { cursor: not-allowed; filter: saturate(.6) brightness(.95); }
.ar-btn:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }
.ar-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.6rem; padding: 0 1rem;
  border-radius: .7rem; font-size: .875rem; font-weight: 600; color: #475569; background: #fff; border: 1.5px solid #dbe2ee;
  transition: background .2s, border-color .2s;
}
.ar-btn-ghost:hover:not(:disabled) { background: #f1f5f9; border-color: #b8c4da; }
.ar-btn-ghost:disabled { cursor: not-allowed; opacity: .6; }
.ar-btn-ghost:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .ar-rise { animation: none; }
  .ar-card, .ar-tile, .ar-pill, .ar-input, .ar-btn, .ar-tab { transition: none; }
}
`;

const TABS = [
  { key: 'daily', label: 'Daily' },
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
    <div className="ar-card ar-hover ar-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="ar-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
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

/* Small progress bar + number used in the Completion % columns */
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

const SUMMARY_COLUMNS = [
  { key: 'employee', label: 'Employee', render: (r) => r.employee?.fullName },
  { key: 'department', label: 'Department', render: (r) => r.department?.name || '-' },
  { key: 'teamLead', label: 'Team Lead', render: (r) => r.teamLead?.fullName || '-' },
  { key: 'workingDays', label: 'Working Days' },
  { key: 'totalPlannedTasks', label: 'Planned' },
  { key: 'totalCompletedTasks', label: 'Completed' },
  { key: 'overallCompletionPercentage', label: 'Completion %', render: (r) => <CompletionCell value={r.overallCompletionPercentage} /> },
  { key: 'missingMorningUpdates', label: 'Missing Morning' },
  { key: 'missingEveningUpdates', label: 'Missing Evening' },
];

const DAILY_COLUMNS = [
  { key: 'employee', label: 'Employee', render: (r) => r.employee?.fullName },
  { key: 'department', label: 'Department', render: (r) => r.department?.name || '-' },
  { key: 'morningTaskCount', label: 'Planned' },
  { key: 'completedCount', label: 'Completed' },
  { key: 'completionPercentage', label: 'Completion %', render: (r) => <CompletionCell value={r.completionPercentage} /> },
  { key: 'eveningStatus', label: 'Evening', render: (r) => <StatusBadge status={r.eveningStatus} /> },
];

export default function AdminReports() {
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(todayISO());
  const [weekStart, setWeekStart] = useState(todayISO());
  const [month, setMonth] = useState(currentMonthValue());
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [department, setDepartment] = useState('');
  const [teamLead, setTeamLead] = useState('');
  const [departments, setDepartments] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    axiosClient.get('/departments', { params: { limit: 100, status: 'active' } }).then(({ data: res }) => setDepartments(res.data.departments)).catch(() => {});
    axiosClient.get('/users/team-leads', { params: { status: 'active' } }).then(({ data: res }) => setTeamLeads(res.data.teamLeads)).catch(() => {});
  }, []);

  const paramsForTab = () => {
    const base = { department: department || undefined, teamLead: teamLead || undefined };
    if (tab === 'daily') return { ...base, date };
    if (tab === 'weekly') return { ...base, weekStart };
    if (tab === 'monthly') return { ...base, month };
    return { ...base, from, to };
  };

  const runReport = async () => {
    setLoading(true);
    setRows(null);
    try {
      const { data: res } = await axiosClient.get(`/reports/${tab}`, { params: paramsForTab() });
      setRows(tab === 'daily' ? res.data.details : res.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await axiosClient.get('/reports/export', { params: { type: tab, format, ...paramsForTab() }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tab}-company-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  /* Summary numbers; daily rows and summary rows use different field names. */
  const summary = useMemo(() => {
    if (!rows) return null;
    const isDaily = tab === 'daily';
    const planned = rows.reduce((s, r) => s + (Number(isDaily ? r.morningTaskCount : r.totalPlannedTasks) || 0), 0);
    const completed = rows.reduce((s, r) => s + (Number(isDaily ? r.completedCount : r.totalCompletedTasks) || 0), 0);
    const avg = rows.length
      ? Math.round(rows.reduce((s, r) => s + (Number(isDaily ? r.completionPercentage : r.overallCompletionPercentage) || 0), 0) / rows.length)
      : 0;
    return { employees: rows.length, planned, completed, avg };
  }, [rows, tab]);

  const tabIndex = TABS.findIndex((t) => t.key === tab);
  const tabLabel = TABS[tabIndex]?.label;

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="ar-hero ar-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Reports</h2>
          <p className="text-sm text-slate-300 mt-1">
            Generate company-wide reports by day, week, month or custom range, then export them to Excel or PDF.
          </p>
        </div>
      </div>

      {/* Tabs + filters + actions */}
      <div className="ar-card ar-rise p-3 sm:p-4 space-y-4" style={{ animationDelay: '60ms' }}>
        <div className="ar-tabs" role="tablist">
          <span className="ar-pill" style={{ transform: `translateX(${tabIndex * 100}%)` }} aria-hidden="true" />
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => { setTab(t.key); setRows(null); }}
              className="ar-tab"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {tab === 'daily' && (
            <div>
              <label htmlFor="ar-date" className="ar-label">Date</label>
              <input id="ar-date" type="date" max={todayISO()} className="ar-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
          {tab === 'weekly' && (
            <div>
              <label htmlFor="ar-week" className="ar-label">Any date in week</label>
              <input id="ar-week" type="date" max={todayISO()} className="ar-input" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            </div>
          )}
          {tab === 'monthly' && (
            <div>
              <label htmlFor="ar-month" className="ar-label">Month</label>
              <input id="ar-month" type="month" className="ar-input" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          )}
          {tab === 'custom' && (
            <>
              <div>
                <label htmlFor="ar-from" className="ar-label">From</label>
                <input id="ar-from" type="date" max={todayISO()} className="ar-input" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ar-to" className="ar-label">To</label>
                <input id="ar-to" type="date" max={todayISO()} className="ar-input" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}
          <div>
            <label htmlFor="ar-dept" className="ar-label">Department</label>
            <select id="ar-dept" className="ar-input min-w-[11rem]" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ar-lead" className="ar-label">Team Lead</label>
            <select id="ar-lead" className="ar-input min-w-[11rem]" value={teamLead} onChange={(e) => setTeamLead(e.target.value)}>
              <option value="">All Team Leads</option>
              {teamLeads.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
            </select>
          </div>

          <button onClick={runReport} disabled={loading} className="ar-btn">
            <FiBarChart2 className="h-4 w-4" /> {loading ? 'Generating...' : 'Generate Report'}
          </button>

          {rows && (
            <div className="flex gap-2 ml-auto">
              <button onClick={() => handleExport('excel')} disabled={exporting} className="ar-btn-ghost">
                <FiDownload className="h-4 w-4" /> Excel
              </button>
              <button onClick={() => handleExport('pdf')} disabled={exporting} className="ar-btn-ghost">
                <FiFileText className="h-4 w-4" /> PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <LoadingSpinner label="Generating report..." />}

      {/* Before the first run */}
      {!loading && !rows && (
        <div className="ar-card ar-rise py-14 flex items-center justify-center border-dashed bg-slate-50/60" style={{ animationDelay: '120ms' }}>
          <div className="text-center px-4">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-white shadow-sm flex items-center justify-center">
              <FiTable className="h-6 w-6 text-navy-300" />
            </div>
            <p className="text-sm font-medium text-navy-600">No report generated yet</p>
            <p className="text-xs text-navy-400 mt-1">Pick your {tabLabel?.toLowerCase()} options above and select Generate Report.</p>
          </div>
        </div>
      )}

      {!loading && rows && summary && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FiUsers} label="Employees" value={summary.employees} tone="blue" delay={40} />
            <StatCard icon={FiClipboard} label="Tasks Planned" value={summary.planned} tone="indigo" delay={80} />
            <StatCard icon={FiCheckCircle} label="Tasks Completed" value={summary.completed} tone="green" delay={120} />
            <StatCard icon={FiTrendingUp} label="Avg. Completion" value={summary.avg} suffix="%" tone="teal" delay={160} />
          </div>

          {/* Results */}
          <div className="ar-card ar-rise p-5" style={{ animationDelay: '200ms' }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-navy-500">
                  <FiTable className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-navy-800">{tabLabel} Report</h3>
                  <p className="text-xs text-navy-400 mt-0.5">Use Excel or PDF above to download this data</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy-600 tabular-nums">
                {rows.length}
              </span>
            </div>
            <DataTable
              columns={tab === 'daily' ? DAILY_COLUMNS : SUMMARY_COLUMNS}
              rows={rows.map((r, i) => ({ ...r, _id: r.employee?._id || i }))}
              emptyTitle="No report data"
              emptyDescription="No submissions found for this selection."
            />
          </div>
        </>
      )}
    </div>
  );
}