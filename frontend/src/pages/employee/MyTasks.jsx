
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiClipboard,
  FiCheckCircle,
  FiTrendingUp,
  FiCalendar,
  FiFilter,
  FiRefreshCw,
  FiList,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { formatDateLabel } from '../../utils/format';

const styles = `
.mt-page {
  max-width: 1200px;
  margin: 0 auto;
}

.mt-card {
  background: #fff;
  border: 1px solid #e6ecf5;
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04),
              0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}

.mt-hover:hover {
  transform: translateY(-3px);
  border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05),
              0 18px 32px -18px rgba(14,100,200,.35);
}

.mt-rise {
  animation: mt-rise .5s cubic-bezier(.2,.8,.2,1) both;
}

@keyframes mt-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

.mt-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative;
  overflow: hidden;
}

.mt-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}

.mt-tile {
  transition: transform .25s ease;
}

.mt-hover:hover .mt-tile {
  transform: scale(1.08) rotate(-4deg);
}

.mt-input {
  width: 100%;
  height: 2.65rem;
  padding: 0 .8rem;
  border: 1.5px solid #dbe2ee;
  border-radius: .7rem;
  background: #f8fafc;
  color: #0f1b33;
  font-size: .875rem;
  outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}

.mt-input:hover {
  border-color: #b8c4da;
}

.mt-input:focus {
  border-color: #0ea5e9;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(14,165,233,.15);
}

.mt-label {
  display: block;
  margin-bottom: .35rem;
  font-size: .75rem;
  font-weight: 600;
  color: #475569;
}

.mt-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  height: 2.65rem;
  padding: 0 1rem;
  border-radius: .7rem;
  font-size: .875rem;
  font-weight: 600;
  color: #475569;
  background: #fff;
  border: 1.5px solid #dbe2ee;
  transition: background .2s, border-color .2s;
}

.mt-reset:hover {
  background: #f1f5f9;
  border-color: #b8c4da;
}

@media (prefers-reduced-motion: reduce) {
  .mt-rise, .mt-card, .mt-tile {
    animation: none;
    transition: none;
  }
}
`;

const TONES = {
  blue: {
    background: 'linear-gradient(135deg,#38bdf8,#2563eb)',
    shadow: 'rgba(37,99,235,.3)',
  },
  green: {
    background: 'linear-gradient(135deg,#4ade80,#16a34a)',
    shadow: 'rgba(22,163,74,.3)',
  },
  teal: {
    background: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
    shadow: 'rgba(13,148,136,.3)',
  },
  indigo: {
    background: 'linear-gradient(135deg,#818cf8,#4f46e5)',
    shadow: 'rgba(79,70,229,.3)',
  },
};

function StatCard({ icon: Icon, label, value, tone = 'blue', delay = 0 }) {
  const theme = TONES[tone];

  return (
    <div
      className="mt-card mt-hover mt-rise p-4 flex items-center gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="mt-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{
          background: theme.background,
          boxShadow: `0 10px 18px -8px ${theme.shadow}`,
        }}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        <p className="text-2xl font-semibold text-navy-800 tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'morning_submitted', label: 'Morning Submitted' },
  { value: 'evening_submitted', label: 'Evening Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs_correction', label: 'Needs Correction' },
];

export default function MyTasks() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const limit = 10;
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const fetchReports = async () => {
      setLoading(true);

      try {
        const { data: res } = await axiosClient.get('/tasks', {
          params: {
            page,
            limit,
            status: status || undefined,
            from: from || undefined,
            to: to || undefined,
          },
        });

        if (!active) return;

        setReports(res.data?.reports || []);
        setTotal(res.meta?.total ?? 0);
      } catch (err) {
        if (!active) return;

        toast.error(
          err.response?.data?.message || 'Failed to load task history.'
        );
        setReports([]);
        setTotal(0);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchReports();

    return () => {
      active = false;
    };
  }, [page, status, from, to]);

  const resetFilters = () => {
    setFrom('');
    setTo('');
    setStatus('');
    setPage(1);
  };

  const columns = [
    {
      key: 'taskDate',
      label: 'Date',
      render: (r) => formatDateLabel(r.taskDate),
    },
    {
      key: 'planned',
      label: 'Planned',
      render: (r) => r.summary?.totalPlanned ?? 0,
    },
    {
      key: 'completed',
      label: 'Completed',
      render: (r) => r.summary?.totalCompleted ?? 0,
    },
    {
      key: 'partial',
      label: 'Partial',
      render: (r) => r.summary?.totalPartial ?? 0,
    },
    {
      key: 'notCompleted',
      label: 'Not Completed',
      render: (r) => r.summary?.totalNotCompleted ?? 0,
    },
    {
      key: 'completionPercentage',
      label: 'Completion %',
      render: (r) => (
        <span className="font-semibold text-navy-700">
          {r.summary?.completionPercentage ?? 0}%
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const activeFilters = [status, from, to].filter(Boolean).length;

  const currentStatusLabel =
    STATUS_OPTIONS.find((item) => item.value === status)?.label || 'All Statuses';

  return (
    <div className="mt-page space-y-6">
      <style>{styles}</style>

      {/* Header */}
      <div className="mt-hero mt-rise rounded-2xl px-5 py-6 sm:px-7 sm:py-7 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sky-300">
              <FiClipboard className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Employee Workspace
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              My Tasks
            </h2>

            <p className="text-sm text-slate-300 mt-2 max-w-xl">
              Track your daily task updates, review completion progress, and
              check the status of your submissions.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-4 py-3">
            <FiList className="h-6 w-6 text-sky-300" />
            <div>
              <p className="text-xs text-slate-300">Total Records</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={FiClipboard}
          label="Total Task Reports"
          value={total}
          tone="blue"
          delay={40}
        />

        <StatCard
          icon={FiList}
          label="Records on This Page"
          value={reports.length}
          tone="indigo"
          delay={80}
        />

        <StatCard
          icon={FiCheckCircle}
          label="Current Page"
          value={page}
          tone="green"
          delay={120}
        />

        <StatCard
          icon={FiFilter}
          label="Active Filters"
          value={activeFilters}
          tone="teal"
          delay={160}
        />
      </div>

      {/* Filters */}
      <div className="mt-card mt-rise p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <FiFilter className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-semibold text-navy-800">Filter Task History</h3>
              <p className="text-xs text-navy-400">
                Find reports using date and status filters
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="mt-reset"
          >
            <FiRefreshCw className="h-4 w-4" />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="mt-label" htmlFor="mt-from">
              From Date
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="mt-from"
                type="date"
                className="mt-input pl-9"
                value={from}
                max={to || undefined}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div>
            <label className="mt-label" htmlFor="mt-to">
              To Date
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="mt-to"
                type="date"
                className="mt-input pl-9"
                value={to}
                min={from || undefined}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div>
            <label className="mt-label" htmlFor="mt-status">
              Task Status
            </label>
            <select
              id="mt-status"
              className="mt-input"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
            <p className="text-xs text-slate-400">Selected Status</p>
            <p className="text-sm font-semibold text-navy-700 mt-1">
              {currentStatusLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Task history table */}
      <div className="mt-card mt-rise overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-navy-800">Task History</h3>
            <p className="text-xs text-navy-400 mt-1">
              Select a report to view its complete details
            </p>
          </div>

          <span className="text-xs font-semibold rounded-full bg-sky-50 text-sky-700 px-3 py-1.5">
            {total} {total === 1 ? 'Report' : 'Reports'}
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={reports}
          loading={loading}
          onRowClick={(r) => navigate(`/employee/my-tasks/${r._id}`)}
          emptyTitle="No task history found"
          emptyDescription="Try adjusting your filters or check back after submitting a morning update."
        />

        <div className="border-t border-slate-100 px-4 py-3">
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
