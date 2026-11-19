
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiEye,
  FiRefreshCw,
  FiSunset,
  FiCalendar,
  FiClipboard,
  FiUsers,
  FiArrowUpRight,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { todayISO } from '../../utils/format';

const styles = `
  .eu-page {
    animation: euRise .45s ease both;
  }

  @keyframes euRise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .eu-hero {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
    border-radius: 1rem;
    box-shadow: 0 12px 30px rgba(15,27,51,.16);
  }

  .eu-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(circle at 85% 15%,rgba(56,189,248,.25),transparent 32%),
      radial-gradient(circle at 10% 100%,rgba(99,102,241,.2),transparent 35%);
  }

  .eu-card {
    background: #fff;
    border: 1px solid #e6ecf5;
    border-radius: 1rem;
    box-shadow: 0 5px 18px rgba(15,27,51,.045);
    transition: box-shadow .2s ease, transform .2s ease;
  }

  .eu-card:hover {
    box-shadow: 0 10px 26px rgba(15,27,51,.075);
  }

  .eu-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 13px;
    background: linear-gradient(135deg,#e0f2fe,#eef2ff);
    color: #2563eb;
  }

  .eu-date-input {
    width: 100%;
    min-width: 0;
    border: 1px solid #dbe5f1;
    background: #f8fafc;
    color: #172554;
    border-radius: .75rem;
    padding: .7rem .85rem;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
  }

  .eu-date-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(14,165,233,.13);
  }

  .eu-info {
    background: linear-gradient(110deg,#eff8ff,#f0f5ff);
    border: 1px solid #dbeafe;
    border-radius: .85rem;
  }

  .eu-refresh {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    padding: .7rem 1rem;
    border-radius: .75rem;
    color: white;
    font-size: .85rem;
    font-weight: 600;
    background: linear-gradient(110deg,#0ea5e9,#4f46e5);
    box-shadow: 0 5px 12px rgba(37,99,235,.2);
    transition: transform .2s ease, box-shadow .2s ease;
  }

  .eu-refresh:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(37,99,235,.27);
  }

  .eu-refresh:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .eu-view-btn {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    padding: .45rem .7rem;
    border: 1px solid #dbeafe;
    border-radius: .6rem;
    color: #1d4ed8;
    background: #eff6ff;
    font-size: .8rem;
    font-weight: 600;
    transition: background .2s, color .2s;
  }

  .eu-view-btn:hover {
    background: #dbeafe;
    color: #1e40af;
  }

  .eu-table {
    min-width: 0;
    overflow-x: auto;
  }

  .eu-table > * {
    min-width: 100%;
  }

  @media (max-width: 640px) {
    .eu-hero {
      border-radius: .85rem;
    }

    .eu-card {
      border-radius: .85rem;
    }

    .eu-refresh {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .eu-page, .eu-card, .eu-refresh {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default function EveningUpdates() {
  const [date, setDate] = useState(todayISO());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const loadEveningUpdates = async () => {
    setLoading(true);

    try {
      const response = await axiosClient.get('/tasks', {
        params: {
          from: date,
          to: date,
          limit: 100,
          page: 1,
        },
      });

      const data = response.data;

      const allReports =
        data?.data?.reports ||
        data?.reports ||
        data?.data?.results ||
        data?.results ||
        [];

      if (!Array.isArray(allReports)) {
        setReports([]);
        return;
      }

      /*
       * Only show evening-related submissions.
       *
       * The backend must already restrict /tasks results
       * according to req.user for Team Lead access.
       */
      const eveningReports = allReports.filter((report) =>
        [
          'evening_submitted',
          'approved',
          'needs_correction',
        ].includes(report.status)
      );

      setReports(eveningReports);
    } catch (err) {
      console.error('Evening updates error:', err);

      toast.error(
        err.response?.data?.message ||
          'Failed to load evening updates.'
      );

      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEveningUpdates();
  }, [date]);

  const getSummary = (report) => {
    return report?.summary || {};
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (report) => (
        <div>
          <p className="font-semibold text-slate-800">
            {report.employee?.fullName ||
              report.user?.fullName ||
              'Unknown Employee'}
          </p>

          {(report.employee?.employeeCode ||
            report.user?.employeeCode) && (
            <p className="text-xs text-slate-400 mt-0.5">
              {report.employee?.employeeCode ||
                report.user?.employeeCode}
            </p>
          )}
        </div>
      ),
    },

    {
      key: 'planned',
      label: 'Planned',
      render: (report) =>
        getSummary(report).totalPlanned ?? 0,
    },

    {
      key: 'completed',
      label: 'Completed',
      render: (report) =>
        getSummary(report).totalCompleted ?? 0,
    },

    {
      key: 'partial',
      label: 'Partial',
      render: (report) =>
        getSummary(report).totalPartial ?? 0,
    },

    {
      key: 'notCompleted',
      label: 'Not Completed',
      render: (report) =>
        getSummary(report).totalNotCompleted ?? 0,
    },

    {
      key: 'completionPercentage',
      label: 'Completion %',
      render: (report) => {
        const percentage =
          getSummary(report).completionPercentage ?? 0;

        return (
          <span
            className={
              percentage >= 80
                ? 'font-semibold text-green-600'
                : percentage >= 50
                ? 'font-semibold text-yellow-600'
                : 'font-semibold text-red-600'
            }
          >
            {percentage}%
          </span>
        );
      },
    },

    {
      key: 'status',
      label: 'Status',
      render: (report) => (
        <StatusBadge status={report.status} />
      ),
    },

    {
      key: 'action',
      label: 'Action',
      render: (report) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();

            if (report._id) {
              navigate(`/team-lead/review/${report._id}`);
            }
          }}
          className="eu-view-btn"
        >
          <FiEye className="h-4 w-4" />
          View
        </button>
      ),
    },
  ];

  return (
    <>
      <style>{styles}</style>

      <div className="eu-page max-w-7xl mx-auto space-y-6">

        {/* Hero Section */}
        <section className="eu-hero p-6 sm:p-8 text-white">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-200 mb-4">
                <FiSunset />
                Team Lead Workspace
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Evening Updates
              </h1>

              <p className="text-sm sm:text-base text-blue-100/80 mt-2 max-w-2xl">
                Track employee task completion, review evening
                submissions, and monitor your team's daily progress.
              </p>
            </div>

            <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl border border-white/15 bg-white/10">
              <FiSunset className="text-4xl text-sky-200" />
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-wrap gap-4 text-sm text-blue-100/85">
            <span className="flex items-center gap-2">
              <FiCalendar className="text-sky-300" />
              Selected date: {date}
            </span>

            <span className="flex items-center gap-2">
              <FiUsers className="text-sky-300" />
              Team submissions
            </span>

            <span className="flex items-center gap-2">
              <FiClipboard className="text-sky-300" />
              {reports.length} evening reports
            </span>
          </div>
        </section>

        {/* Date Filter */}
        <section className="eu-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="eu-icon">
                <FiCalendar size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Select Report Date
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose a date to view evening submissions.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[230px]">
              <label
                htmlFor="evening-update-date"
                className="block text-xs font-semibold text-slate-600 mb-2"
              >
                Date
              </label>

              <input
                id="evening-update-date"
                type="date"
                max={todayISO()}
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                className="eu-date-input"
              />
            </div>
          </div>
        </section>

        {/* Evening Updates Table */}
        <section className="eu-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="eu-icon">
                <FiClipboard size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Evening Completion Details
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Employee evening updates for {date}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5">
                {reports.length} submission
                {reports.length !== 1 ? 's' : ''}
              </span>

              <button
                type="button"
                onClick={loadEveningUpdates}
                disabled={loading}
                className="eu-refresh"
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${
                    loading ? 'animate-spin' : ''
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>

          <div className="eu-info p-4 mb-5 flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <FiArrowUpRight size={18} />
            </div>

            <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
              Review planned, completed, partially completed, and
              unfinished tasks. Use the View action or select an
              employee row to open their evening review.
            </p>
          </div>

          <div className="eu-table">
            <DataTable
              columns={columns}
              rows={reports}
              loading={loading}
              onRowClick={(report) => {
                if (report._id) {
                  navigate(`/team-lead/review/${report._id}`);
                }
              }}
              emptyTitle="No evening submissions yet"
              emptyDescription="Employees who submit an evening update for this date will appear here."
            />
          </div>
        </section>

        {/* Information Panel */}
        <div className="eu-info p-4 sm:p-5 flex items-start gap-3">
          <div className="eu-icon !w-9 !h-9 !rounded-xl">
            <FiSunset size={18} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-950">
              Evening Review
            </h3>

            <p className="text-xs sm:text-sm text-blue-800/80 mt-1 leading-relaxed">
              Evening submissions include reports with evening-submitted,
              approved, and needs-correction statuses.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
