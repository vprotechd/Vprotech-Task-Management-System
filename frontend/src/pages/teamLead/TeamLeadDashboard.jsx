
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FiUsers,
  FiSunrise,
  FiSunset,
  FiCheckCircle,
  FiAlertTriangle,
  FiTrendingUp,
  FiClipboard,
  FiRefreshCw,
  FiActivity,
  FiFileText,
  FiShield,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import DataTable from '../../components/DataTable';

const styles = `
.tl-card {
  background: #fff;
  border: 1px solid #e6ecf5;
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04),
              0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}

.tl-hover:hover {
  transform: translateY(-3px);
  border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05),
              0 18px 32px -18px rgba(14,100,200,.35);
}

.tl-rise {
  animation: tl-rise .5s cubic-bezier(.2,.8,.2,1) both;
}

@keyframes tl-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

.tl-hero {
  background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
  position: relative;
  overflow: hidden;
}

.tl-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%,rgba(56,189,248,.28),transparent 60%),
    radial-gradient(360px circle at 0% 100%,rgba(99,102,241,.25),transparent 60%);
}

.tl-tile {
  transition: transform .25s ease;
}

.tl-hover:hover .tl-tile {
  transform: scale(1.08) rotate(-4deg);
}

.tl-stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: .8rem;
  flex-shrink: 0;
}

.tl-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  min-height: 2.8rem;
  padding: 0 1.25rem;
  border-radius: .75rem;
  font-size: .875rem;
  font-weight: 600;
  transition: transform .15s,box-shadow .2s,background .2s;
}

.tl-primary {
  color: #fff;
  background: linear-gradient(135deg,#0ea5e9,#4f46e5);
  box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
}

.tl-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px -12px rgba(79,70,229,.95);
}

.tl-secondary {
  color: #dbeafe;
  border: 1px solid rgba(255,255,255,.25);
  background: rgba(255,255,255,.1);
}

.tl-secondary:hover:not(:disabled) {
  background: rgba(255,255,255,.2);
}

.tl-action-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.tl-info {
  background: linear-gradient(135deg,#eff8ff,#f0f5ff);
  border: 1px solid #bfdbfe;
}

.tl-info-icon {
  background: linear-gradient(135deg,#38bdf8,#2563eb);
  box-shadow: 0 8px 16px -8px rgba(37,99,235,.5);
}

.tl-table-wrap {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}

.tl-table-wrap > * {
  min-width: 100%;
}

.tl-spin {
  animation: tl-spin 1s linear infinite;
}

@keyframes tl-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .tl-rise {
    animation: none;
  }

  .tl-card,.tl-tile,.tl-action-btn {
    transition: none;
  }
}
`;

function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'text-sky-600',
  background = 'bg-sky-50',
}) {
  return (
    <div className="tl-card tl-hover tl-rise p-4 sm:p-5 flex items-center gap-3">
      <div className={`tl-tile tl-stat-icon ${background} ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">
          {label}
        </p>

        <p className="text-xl sm:text-2xl font-semibold text-slate-800 mt-1">
          {value ?? 0}
        </p>
      </div>
    </div>
  );
}

export default function TeamLeadDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: response } = await axiosClient.get(
        '/dashboard/team-lead'
      );

      setData(response?.data || {});
    } catch (err) {
      console.error(
        'Team Lead Dashboard Error:',
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        'Failed to load team dashboard.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <LoadingSpinner
        full
        label="Loading team dashboard..."
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={load}
      />
    );
  }

  if (!data) {
    return null;
  }

  const weeklyPerformance = Array.isArray(
    data.weeklyPerformance
  )
    ? data.weeklyPerformance
    : [];

  const monthlyPerformance = Array.isArray(
    data.monthlyPerformance
  )
    ? data.monthlyPerformance
    : [];

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">
            {row?.employee?.fullName ||
              'Unknown Employee'}
          </p>

          {row?.employee?.employeeCode && (
            <p className="text-xs text-slate-400">
              {row.employee.employeeCode}
            </p>
          )}
        </div>
      ),
    },

    {
      key: 'planned',
      label: 'Planned',
      render: (row) =>
        row?.totalPlannedTasks ?? 0,
    },

    {
      key: 'completed',
      label: 'Completed',
      render: (row) =>
        row?.totalCompletedTasks ?? 0,
    },

    {
      key: 'completion',
      label: 'Completion %',
      render: (row) =>
        `${row?.overallCompletionPercentage ?? 0}%`,
    },

    {
      key: 'missingMorning',
      label: 'Missing Morning',
      render: (row) =>
        row?.missingMorningUpdates ?? 0,
    },

    {
      key: 'missingEvening',
      label: 'Missing Evening',
      render: (row) =>
        row?.missingEveningUpdates ?? 0,
    },
  ];

  const weeklyRows = weeklyPerformance.map(
    (row, index) => ({
      ...row,
      _id:
        row?.employee?._id ||
        row?.employee?.id ||
        `weekly-${index}`,
    })
  );

  const monthlyRows = monthlyPerformance.map(
    (row, index) => ({
      ...row,
      _id:
        row?.employee?._id ||
        row?.employee?.id ||
        `monthly-${index}`,
    })
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <style>{styles}</style>

      {/* Hero */}
      <div className="tl-hero tl-rise rounded-2xl px-5 py-6 sm:px-7 sm:py-7 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">

          <div>
            <div className="flex items-center gap-2 mb-2 text-sky-300">
              <FiActivity className="h-5 w-5" />

              <span className="text-xs font-semibold uppercase tracking-wider">
                Team Lead Workspace
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Team Dashboard
            </h2>

            <p className="text-sm text-slate-300 mt-2 max-w-xl">
              Monitor team activity, track employee performance
              and manage daily task progress.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-4 py-3">
            <FiUsers className="h-6 w-6 text-sky-300" />

            <div>
              <p className="text-xs text-slate-300">
                Total Employees
              </p>

              <p className="text-2xl font-bold">
                {data.totalEmployees ?? 0}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Actions */}
      <div className="tl-card tl-rise p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FiClipboard className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800">
                Quick Actions
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                Manage your team and assign work.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                navigate('/team-lead/assign-task')
              }
              className="tl-action-btn tl-primary"
            >
              <FiClipboard className="h-4 w-4" />
              Assign Task
            </button>

            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="tl-action-btn border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <FiRefreshCw
                className={`h-4 w-4 ${
                  loading ? 'tl-spin' : ''
                }`}
              />
              Refresh
            </button>

          </div>
        </div>
      </div>

      {/* Main Statistics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FiTrendingUp className="text-sky-500" />

          <h3 className="font-semibold text-slate-800">
            Team Overview
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <StatCard
            icon={FiUsers}
            label="Total Employees"
            value={data.totalEmployees}
          />

          <StatCard
            icon={FiSunrise}
            label="Morning Submitted Today"
            value={`${data.todayMorningSubmitted ?? 0} / ${
              data.totalEmployees ?? 0
            }`}
            accent="text-amber-600"
            background="bg-amber-50"
          />

          <StatCard
            icon={FiSunset}
            label="Evening Submitted Today"
            value={`${data.todayEveningSubmitted ?? 0} / ${
              data.totalEmployees ?? 0
            }`}
            accent="text-indigo-600"
            background="bg-indigo-50"
          />

          <StatCard
            icon={FiTrendingUp}
            label="Team Completion Today"
            value={`${data.teamCompletionPercentage ?? 0}%`}
            accent="text-emerald-600"
            background="bg-emerald-50"
          />

        </div>
      </div>

      {/* Task Statistics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FiClipboard className="text-sky-500" />

          <h3 className="font-semibold text-slate-800">
            Today's Task Statistics
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <StatCard
            icon={FiCheckCircle}
            label="Completed Tasks Today"
            value={data.completedTasks}
            accent="text-emerald-600"
            background="bg-emerald-50"
          />

          <StatCard
            icon={FiAlertTriangle}
            label="Pending Tasks Today"
            value={data.pendingTasks}
            accent="text-amber-600"
            background="bg-amber-50"
          />

        </div>
      </div>

      {/* Weekly Performance */}
      <div className="tl-card tl-rise overflow-hidden">

        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FiSunrise className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800">
                Weekly Performance
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                Employee performance for the last 7 days.
              </p>
            </div>
          </div>

          <span className="text-xs font-medium text-slate-500 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            {weeklyRows.length} employee
            {weeklyRows.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-4 sm:p-5 tl-table-wrap">
          <DataTable
            columns={columns}
            rows={weeklyRows}
            loading={loading}
            emptyTitle="No weekly data yet"
            emptyDescription="Employee performance will appear here once task activity is recorded."
          />
        </div>

      </div>

      {/* Monthly Performance */}
      <div className="tl-card tl-rise overflow-hidden">

        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiFileText className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800">
                Monthly Performance
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                Employee performance for the last 30 days.
              </p>
            </div>
          </div>

          <span className="text-xs font-medium text-slate-500 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            {monthlyRows.length} employee
            {monthlyRows.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-4 sm:p-5 tl-table-wrap">
          <DataTable
            columns={columns}
            rows={monthlyRows}
            loading={loading}
            emptyTitle="No monthly data yet"
            emptyDescription="Employee performance will appear here once task activity is recorded."
          />
        </div>

      </div>

      {/* Bottom Information */}
      <div className="tl-info rounded-2xl p-4 flex items-start gap-3">
        <div className="tl-info-icon h-9 w-9 rounded-lg flex items-center justify-center text-white shrink-0">
          <FiShield />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-blue-950">
            Team Performance Monitoring
          </h4>

          <p className="text-xs text-blue-800 mt-1 leading-relaxed">
            Review employee task submissions regularly to monitor
            progress and identify pending updates.
          </p>
        </div>
      </div>

    </div>
  );
}
