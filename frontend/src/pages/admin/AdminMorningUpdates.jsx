import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUsers, FiSunrise, FiAlertTriangle, FiSunset, FiCalendar, FiClipboard } from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { todayISO } from '../../utils/format';

/* Scoped styles (prefixed "mu-") so nothing clashes with your global CSS. */
const styles = `
.mu-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.mu-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.mu-rise { animation: mu-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes mu-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.mu-tile { transition: transform .25s ease; }
.mu-hover:hover .mu-tile { transform: scale(1.08) rotate(-4deg); }

.mu-bar { transition: width 1s cubic-bezier(.2,.8,.2,1); }

.mu-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.mu-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.mu-live { animation: mu-pulse 1.8s ease-in-out infinite; }
@keyframes mu-pulse { 50% { opacity: .35; transform: scale(.8); } }

.mu-input {
  height: 2.6rem; padding: 0 .85rem; border: 1.5px solid #dbe2ee; border-radius: .7rem;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.mu-input:hover:not(:disabled) { border-color: #b8c4da; }
.mu-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.mu-input:disabled { opacity: .6; cursor: not-allowed; }
.mu-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }

@media (prefers-reduced-motion: reduce) {
  .mu-rise, .mu-live { animation: none; }
  .mu-card, .mu-tile, .mu-bar, .mu-input { transition: none; }
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

function StatCard({ icon: Icon, label, value, tone = 'blue', delay = 0 }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="mu-card mu-hover mu-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="mu-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
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

function SectionCard({ icon: Icon, title, subtitle, count, delay, children }) {
  return (
    <div className="mu-card mu-rise p-5" style={{ animationDelay: `${delay}ms` }}>
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
      {children}
    </div>
  );
}

/* A submission counts as missing when the API gives no value or says "missing". */
const isMissing = (value) => !value || value === 'missing';

export default function AdminMorningUpdates() {
  const [date, setDate] = useState(todayISO());
  const [department, setDepartment] = useState('');

  const [departments, setDepartments] = useState([]);
  const [missing, setMissing] = useState([]);
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [departmentLoading, setDepartmentLoading] = useState(true);

  const navigate = useNavigate();

  /*
   * Handles both possible API response structures:
   *
   * response.data.data.results
   * response.data.results
   */
  const unwrapResponse = (response) => {
    return response?.data?.data ?? response?.data ?? {};
  };

  const getReports = (response) => {
    const payload = unwrapResponse(response);

    if (Array.isArray(payload?.reports)) {
      return payload.reports;
    }

    if (Array.isArray(payload?.results)) {
      return payload.results;
    }

    return [];
  };

  const getResults = (response) => {
    const payload = unwrapResponse(response);

    if (Array.isArray(payload?.results)) {
      return payload.results;
    }

    return [];
  };

  /*
   * Load Departments
   */
  const loadDepartments = useCallback(async () => {
    setDepartmentLoading(true);

    try {
      const response = await axiosClient.get('/departments', {
        params: {
          limit: 100,
          status: 'active',
        },
      });

      const payload = unwrapResponse(response);

      const departmentList = Array.isArray(payload?.departments)
        ? payload.departments
        : Array.isArray(payload?.results)
          ? payload.results
          : [];

      setDepartments(departmentList);
    } catch (err) {
      console.error('Department loading error:', err);

      setDepartments([]);

      toast.error(
        err?.response?.data?.message ||
          'Failed to load departments.'
      );
    } finally {
      setDepartmentLoading(false);
    }
  }, []);

  /*
   * Load Morning Updates
   */
  const loadMorningUpdates = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        date,
      };

      if (department) {
        params.department = department;
      }

      const [missingRes, reportsRes] = await Promise.all([
        axiosClient.get('/tasks/missing', {
          params,
        }),

        axiosClient.get('/tasks', {
          params: {
            from: date,
            to: date,
            ...(department
              ? { department }
              : {}),
            limit: 200,
          },
        }),
      ]);

      const missingResults = getResults(missingRes);
      const reportResults = getReports(reportsRes);

      setMissing(missingResults);
      setReports(reportResults);
    } catch (err) {
      console.error(
        'Admin Morning Updates Error:',
        err
      );

      setMissing([]);
      setReports([]);

      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.data?.message ||
          'Failed to load morning updates.'
      );
    } finally {
      setLoading(false);
    }
  }, [date, department]);

  /*
   * Load departments once
   */
  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  /*
   * Reload when date or department changes
   */
  useEffect(() => {
    loadMorningUpdates();
  }, [loadMorningUpdates]);

  /*
   * Submission Status Columns
   */
  const statusColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) =>
        row?.employee?.fullName ||
        'Unknown Employee',
    },

    {
      key: 'morning',
      label: 'Morning',
      render: (row) => (
        <StatusBadge
          status={row?.morning || 'missing'}
        />
      ),
    },

    {
      key: 'evening',
      label: 'Evening',
      render: (row) => (
        <StatusBadge
          status={row?.evening || 'missing'}
        />
      ),
    },
  ];

  /*
   * Report Columns
   */
  const reportColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) =>
        row?.employee?.fullName ||
        'Unknown Employee',
    },

    {
      key: 'department',
      label: 'Department',
      render: (row) =>
        row?.department?.name ||
        row?.employee?.department?.name ||
        '-',
    },

    {
      key: 'planned',
      label: 'Tasks Planned',
      render: (row) =>
        row?.summary?.totalPlanned ??
        row?.totalPlanned ??
        0,
    },

    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge
          status={row?.status || 'pending'}
        />
      ),
    },
  ];

  /*
   * Make missing employee rows safe
   */
  const missingRows = missing.map(
    (item, index) => ({
      ...item,

      _id:
        item?.employee?._id ||
        item?.employee?.id ||
        item?._id ||
        `missing-${index}`,
    })
  );

  /*
   * Open Admin Review
   */
  const handleReportClick = (row) => {
    const reportId =
      row?._id ||
      row?.id;

    if (!reportId) {
      toast.error(
        'Unable to open this morning report.'
      );
      return;
    }

    navigate(`/admin/review/${reportId}`);
  };

  /* Summary numbers for the stat cards and banner */
  const summary = useMemo(() => {
    const total = missingRows.length;
    const missingMorning = missingRows.filter((r) => isMissing(r?.morning)).length;
    const missingEvening = missingRows.filter((r) => isMissing(r?.evening)).length;
    return {
      total,
      missingMorning,
      missingEvening,
      submittedMorning: total - missingMorning,
    };
  }, [missingRows]);

  const progressPct = summary.total > 0 ? Math.min(100, (summary.submittedMorning / summary.total) * 100) : 0;

  const prettyDate = useMemo(() => {
    const d = new Date(`${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [date]);

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="mu-hero mu-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Morning Updates</h2>
            <p className="text-sm text-slate-300 mt-1">{prettyDate}</p>
          </div>
          <div className="min-w-[220px] flex-1 sm:max-w-sm">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="flex items-center gap-2">
                <span className="mu-live h-2 w-2 rounded-full bg-emerald-400" />
                Morning plans submitted
              </span>
              <span className="tabular-nums">
                {summary.submittedMorning} / {summary.total}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="mu-bar h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg,#38bdf8,#22c55e)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers} label="Employees" value={summary.total} tone="blue" delay={40} />
        <StatCard icon={FiSunrise} label="Morning Submitted" value={summary.submittedMorning} tone="green" delay={80} />
        <StatCard icon={FiAlertTriangle} label="Missing Morning" value={summary.missingMorning} tone="amber" delay={120} />
        <StatCard icon={FiSunset} label="Missing Evening" value={summary.missingEvening} tone="indigo" delay={160} />
      </div>

      {/* Filters */}
      <div className="mu-card mu-rise p-4 flex flex-wrap items-end gap-4" style={{ animationDelay: '200ms' }}>
        <div>
          <label htmlFor="mu-date" className="mu-label">Date</label>
          <input
            id="mu-date"
            type="date"
            max={todayISO()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mu-input"
          />
        </div>

        <div>
          <label htmlFor="mu-dept" className="mu-label">Department</label>
          <select
            id="mu-dept"
            className="mu-input min-w-[12rem]"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            disabled={departmentLoading}
          >
            <option value="">All Departments</option>

            {departments.map((item) => (
              <option key={item?._id || item?.id} value={item?._id || item?.id}>
                {item?.name || 'Unnamed Department'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submission Status */}
      <SectionCard
        icon={FiCalendar}
        title="Submission Status"
        subtitle={`Who has and hasn't submitted on ${date}`}
        count={loading ? undefined : missingRows.length}
        delay={240}
      >
        <DataTable
          columns={statusColumns}
          rows={missingRows}
          loading={loading}
          emptyTitle="No employees found"
          emptyDescription="No employee submission information is available for this date."
        />
      </SectionCard>

      {/* Morning Task Details */}
      <SectionCard
        icon={FiClipboard}
        title="Morning Task Details"
        subtitle="Select a row to open the full report"
        count={loading ? undefined : reports.length}
        delay={300}
      >
        <DataTable
          columns={reportColumns}
          rows={reports}
          loading={loading}
          onRowClick={handleReportClick}
          emptyTitle="No morning submissions yet"
          emptyDescription="Employees who submit a morning plan for this date will appear here."
        />
      </SectionCard>
    </div>
  );
}