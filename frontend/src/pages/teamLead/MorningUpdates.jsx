
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiSunrise,
  FiCalendar,
  FiClipboard,
  FiUsers,
  FiArrowUpRight,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { minutesToHours, todayISO } from '../../utils/format';

const styles = `
  .mu-page {
    animation: muRise .45s ease both;
  }

  @keyframes muRise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .mu-hero {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
    border-radius: 1rem;
    box-shadow: 0 12px 30px rgba(15,27,51,.16);
  }

  .mu-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(circle at 85% 15%,rgba(56,189,248,.25),transparent 32%),
      radial-gradient(circle at 10% 100%,rgba(99,102,241,.2),transparent 35%);
  }

  .mu-card {
    background: #fff;
    border: 1px solid #e6ecf5;
    border-radius: 1rem;
    box-shadow: 0 5px 18px rgba(15,27,51,.045);
    transition: box-shadow .2s ease, transform .2s ease;
  }

  .mu-card:hover {
    box-shadow: 0 10px 26px rgba(15,27,51,.075);
  }

  .mu-icon {
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

  .mu-date-input {
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

  .mu-date-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(14,165,233,.13);
  }

  .mu-info {
    background: linear-gradient(110deg,#eff8ff,#f0f5ff);
    border: 1px solid #dbeafe;
    border-radius: .85rem;
  }

  .mu-table {
    min-width: 0;
    overflow-x: auto;
  }

  .mu-table > * {
    min-width: 100%;
  }

  @media (max-width: 640px) {
    .mu-hero {
      border-radius: .85rem;
    }

    .mu-card {
      border-radius: .85rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .mu-page, .mu-card {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default function MorningUpdates() {
  const [date, setDate] = useState(todayISO());
  const [missing, setMissing] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadMorningUpdates = async () => {
      setLoading(true);

      try {
        const [missingRes, reportsRes] = await Promise.all([
          axiosClient.get('/tasks/missing', {
            params: { date },
          }),

          axiosClient.get('/tasks', {
            params: {
              from: date,
              to: date,
              limit: 100,
            },
          }),
        ]);

        const missingPayload =
          missingRes?.data?.data ??
          missingRes?.data ??
          {};

        const reportsPayload =
          reportsRes?.data?.data ??
          reportsRes?.data ??
          {};

        const missingResults = Array.isArray(missingPayload?.results)
          ? missingPayload.results
          : [];

        let reportResults = Array.isArray(reportsPayload?.reports)
          ? reportsPayload.reports
          : Array.isArray(reportsPayload?.results)
            ? reportsPayload.results
            : [];

        /*
         * Only show reports where the morning update
         * has been submitted.
         *
         * Keep approved / needs_correction because
         * those morning reports may still need to be viewed.
         */
        reportResults = reportResults.filter((report) => {
          const morningSubmitted =
            !!report?.morning?.submittedAt;

          const status = report?.status;

          return (
            morningSubmitted ||
            status === 'morning_submitted' ||
            status === 'approved' ||
            status === 'needs_correction'
          );
        });

        if (!mounted) return;

        setMissing(missingResults);
        setReports(reportResults);
      } catch (err) {
        console.error('Morning Updates Error:', err);

        if (!mounted) return;

        setMissing([]);
        setReports([]);

        toast.error(
          err?.response?.data?.message ||
          err?.response?.data?.data?.message ||
          'Failed to load morning updates.'
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMorningUpdates();

    return () => {
      mounted = false;
    };
  }, [date]);

  /*
   * Submission status table
   */
  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) =>
        row?.employee?.fullName || 'Unknown Employee',
    },
    {
      key: 'morning',
      label: 'Morning',
      render: (row) => (
        <StatusBadge status={row?.morning || 'missing'} />
      ),
    },
    {
      key: 'evening',
      label: 'Evening',
      render: (row) => (
        <StatusBadge status={row?.evening || 'missing'} />
      ),
    },
  ];

  /*
   * Morning task table
   */
  const reportColumns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) =>
        row?.employee?.fullName || 'Unknown Employee',
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
      key: 'estimatedTime',
      label: 'Estimated Time',
      render: (row) =>
        minutesToHours(row?.summary?.totalEstimatedMinutes ?? 0),
    },
    {
      key: 'completed',
      label: 'Completed',
      render: (row) =>
        row?.summary?.totalCompleted ??
        row?.totalCompleted ??
        0,
    },
    {
      key: 'status',
      label: 'Morning Status',
      render: (row) => (
        <StatusBadge
          status={row?.morning?.status || row?.status || 'pending'}
        />
      ),
    },
  ];

  /*
   * Missing employees
   */
  const missingRows = missing.map((item, index) => ({
    ...item,
    _id:
      item?.employee?._id ||
      item?.employee?.id ||
      item?._id ||
      `missing-${index}`,
  }));

  /*
   * Morning report opens the MORNING REVIEW page.
   */
  const handleReportClick = (row) => {
    const reportId =
      row?._id ||
      row?.id;

    if (!reportId) {
      toast.error('Unable to open this morning report.');
      return;
    }

    navigate(`/team-lead/morning-review/${reportId}`);
  };

  return (
    <>
      <style>{styles}</style>

      <div className="mu-page max-w-7xl mx-auto space-y-6">

        {/* Hero Section */}
        <section className="mu-hero p-6 sm:p-8 text-white">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-200 mb-4">
                <FiSunrise />
                Team Lead Workspace
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Morning Updates
              </h1>

              <p className="text-sm sm:text-base text-blue-100/80 mt-2 max-w-2xl">
                Monitor employee morning submissions, check task plans,
                and review daily updates from your team.
              </p>
            </div>

            <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl border border-white/15 bg-white/10">
              <FiSunrise className="text-4xl text-sky-200" />
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-wrap gap-4 text-sm text-blue-100/85">
            <span className="flex items-center gap-2">
              <FiCalendar className="text-sky-300" />
              Selected date: {date}
            </span>

            <span className="flex items-center gap-2">
              <FiUsers className="text-sky-300" />
              {missing.length} employee records
            </span>

            <span className="flex items-center gap-2">
              <FiClipboard className="text-sky-300" />
              {reports.length} morning reports
            </span>
          </div>
        </section>

        {/* Date Filter */}
        <section className="mu-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="mu-icon">
                <FiCalendar size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Select Report Date
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose a date to view employee submissions.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[230px]">
              <label
                htmlFor="morning-update-date"
                className="block text-xs font-semibold text-slate-600 mb-2"
              >
                Date
              </label>

              <input
                id="morning-update-date"
                type="date"
                max={todayISO()}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mu-date-input"
              />
            </div>
          </div>
        </section>

        {/* Submission Status */}
        <section className="mu-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="mu-icon">
                <FiUsers size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Submission Status
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Employee morning and evening submission overview.
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 w-fit">
              {date}
            </span>
          </div>

          <div className="mu-table">
            <DataTable
              columns={columns}
              rows={missingRows}
              loading={loading}
              emptyTitle="No employees found"
              emptyDescription="No employee submission information is available for this date."
            />
          </div>
        </section>

        {/* Morning Task Details */}
        <section className="mu-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="mu-icon">
                <FiClipboard size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Morning Task Details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Click an employee to review and approve their morning task.
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5 w-fit">
              {reports.length} Reports
            </span>
          </div>

          <div className="mu-info p-4 mb-5 flex items-start gap-3">
            <div className="text-blue-600 mt-0.5">
              <FiArrowUpRight size={18} />
            </div>

            <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
              Select any employee row to open the morning review page.
              You can view their submitted task plan and review its status.
            </p>
          </div>

          <div className="mu-table">
            <DataTable
              columns={reportColumns}
              rows={reports}
              loading={loading}
              onRowClick={handleReportClick}
              emptyTitle="No morning submissions yet"
              emptyDescription="Employees who submit a morning plan for this date will appear here."
            />
          </div>
        </section>

        {/* Information Panel */}
        <div className="mu-info p-4 sm:p-5 flex items-start gap-3">
          <div className="mu-icon !w-9 !h-9 !rounded-xl">
            <FiSunrise size={18} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-blue-950">
              Morning Review
            </h3>

            <p className="text-xs sm:text-sm text-blue-800/80 mt-1 leading-relaxed">
              This page displays submitted morning reports only.
              Reports with approved or needs-correction statuses remain
              available for review.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
