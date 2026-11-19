
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import {
  FiDownload,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiBarChart2,
  FiRefreshCw,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiFileSpreadsheet,
  FiClipboard,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { todayISO } from '../../utils/format';

const TABS = [
  { key: 'daily', label: 'Daily', icon: FiCalendar },
  { key: 'weekly', label: 'Weekly', icon: FiBarChart2 },
  { key: 'monthly', label: 'Monthly', icon: FiClock },
  { key: 'custom', label: 'Custom Range', icon: FiFilter },
];

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const SUMMARY_COLUMNS = [
  {
    key: 'employee',
    label: 'Employee',
    render: (r) => (
      <span className="font-semibold text-slate-700">
        {r.employee?.fullName || '-'}
      </span>
    ),
  },
  { key: 'workingDays', label: 'Working Days' },
  { key: 'totalPlannedTasks', label: 'Planned' },
  { key: 'totalCompletedTasks', label: 'Completed' },
  { key: 'totalPartialTasks', label: 'Partial' },
  { key: 'totalNotCompletedTasks', label: 'Not Completed' },
  {
    key: 'overallCompletionPercentage',
    label: 'Completion %',
    render: (r) => {
      const percentage = Number(r.overallCompletionPercentage) || 0;

      return (
        <div className="min-w-[105px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700">
              {percentage}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
              style={{
                width: `${Math.min(100, Math.max(0, percentage))}%`,
              }}
            />
          </div>
        </div>
      );
    },
  },
  { key: 'missingMorningUpdates', label: 'Missing Morning' },
  { key: 'missingEveningUpdates', label: 'Missing Evening' },
];

const DAILY_COLUMNS = [
  {
    key: 'employee',
    label: 'Employee',
    render: (r) => (
      <span className="font-semibold text-slate-700">
        {r.employee?.fullName || '-'}
      </span>
    ),
  },
  { key: 'morningTaskCount', label: 'Planned' },
  { key: 'completedCount', label: 'Completed' },
  { key: 'partialCount', label: 'Partial' },
  { key: 'notCompletedCount', label: 'Not Completed' },
  {
    key: 'completionPercentage',
    label: 'Completion %',
    render: (r) => {
      const percentage = Number(r.completionPercentage) || 0;

      return (
        <div className="min-w-[105px]">
          <div className="mb-1">
            <span className="text-xs font-bold text-slate-700">
              {percentage}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
              style={{
                width: `${Math.min(100, Math.max(0, percentage))}%`,
              }}
            />
          </div>
        </div>
      );
    },
  },
  {
    key: 'eveningStatus',
    label: 'Evening',
    render: (r) => <StatusBadge status={r.eveningStatus} />,
  },
];

const styles = `
.tlr-page {
  animation: tlrFadeIn .45s ease both;
}

@keyframes tlrFadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.tlr-hero {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  color: white;
  background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
  box-shadow: 0 12px 30px rgba(15,35,70,.13);
}

.tlr-hero::before {
  content: "";
  position: absolute;
  width: 280px;
  height: 280px;
  right: -70px;
  top: -160px;
  border-radius: 50%;
  background: rgba(56,189,248,.19);
}

.tlr-hero::after {
  content: "";
  position: absolute;
  width: 210px;
  height: 210px;
  right: 160px;
  bottom: -170px;
  border-radius: 50%;
  background: rgba(99,102,241,.22);
}

.tlr-hero-content {
  position: relative;
  z-index: 1;
}

.tlr-card {
  background: #fff;
  border: 1px solid #e6ecf5;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(15,35,70,.045);
  transition: box-shadow .2s ease, transform .2s ease;
}

.tlr-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15,35,70,.075);
}

.tlr-icon-box {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #eaf6ff;
  color: #0284c7;
}

.tlr-tab-list {
  display: grid;
  grid-template-columns: repeat(4,minmax(0,1fr));
  gap: 8px;
}

.tlr-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 10px;
  border-radius: 10px;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 650;
  transition: all .2s ease;
}

.tlr-tab:hover:not(.tlr-tab-active) {
  background: #eff6ff;
  color: #0369a1;
}

.tlr-tab-active {
  color: white;
  background: linear-gradient(135deg,#0ea5e9,#4f46e5);
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(14,165,233,.2);
}

.tlr-label {
  display: block;
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  margin-bottom: 7px;
}

.tlr-input {
  width: 100%;
  min-width: 160px;
  border: 1px solid #dce5f0;
  background: #f8fafc;
  color: #1e293b;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}

.tlr-input:focus {
  border-color: #38bdf8;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(14,165,233,.12);
}

.tlr-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 18px;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 650;
  background: linear-gradient(135deg,#0ea5e9,#4f46e5);
  box-shadow: 0 4px 12px rgba(14,165,233,.2);
  transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
}

.tlr-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 7px 17px rgba(14,165,233,.28);
}

.tlr-primary:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.tlr-export {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #dce5f0;
  border-radius: 10px;
  background: white;
  color: #475569;
  font-size: 12px;
  font-weight: 650;
  transition: all .2s ease;
}

.tlr-export:hover:not(:disabled) {
  background: #f0f9ff;
  border-color: #bae6fd;
  color: #0369a1;
}

.tlr-export:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.tlr-info {
  background: linear-gradient(110deg,#eff8ff,#f0f5ff);
  border: 1px solid #dbeafe;
  border-radius: 12px;
}

@media (max-width: 640px) {
  .tlr-hero {
    border-radius: 14px;
  }

  .tlr-tab-list {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }

  .tlr-filter-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .tlr-filter-actions button {
    width: 100%;
  }

  .tlr-export-actions {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    width: 100%;
  }

  .tlr-export-actions button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tlr-page, .tlr-card, .tlr-stat-card, .tlr-tab,
  .tlr-primary, .tlr-export, .tlr-input {
    animation: none !important;
    transition: none !important;
  }
}
`;

export default function TeamLeadReports() {
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(todayISO());
  const [weekStart, setWeekStart] = useState(todayISO());
  const [month, setMonth] = useState(currentMonthValue());
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    axiosClient.get('/users', {
      params: { role: 'employee', limit: 100 },
    })
      .then(({ data: res }) => setEmployees(res.data.users))
      .catch(() => {});
  }, []);

  const paramsForTab = () => {
    const base = { employeeId: employeeId || undefined };

    if (tab === 'daily') return { ...base, date };
    if (tab === 'weekly') return { ...base, weekStart };
    if (tab === 'monthly') return { ...base, month };

    return { ...base, from, to };
  };

  const runReport = async () => {
    setLoading(true);
    setRows(null);

    try {
      const { data: res } = await axiosClient.get(
        `/reports/${tab}`,
        { params: paramsForTab() }
      );

      setRows(tab === 'daily' ? res.data.details : res.data.summary);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Failed to generate report.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);

    try {
      const res = await axiosClient.get('/reports/export', {
        params: {
          type: tab,
          format,
          ...paramsForTab(),
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');

      link.href = url;
      link.download = `${tab}-team-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;

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

  const selectedTab = TABS.find((item) => item.key === tab);

  const reportTitle = {
    daily: 'Daily Report',
    weekly: 'Weekly Report',
    monthly: 'Monthly Report',
    custom: 'Custom Range Report',
  }[tab];

  return (
    <div className="tlr-page max-w-7xl mx-auto space-y-5">
      <style>{styles}</style>

      {/* Hero */}
      <div className="tlr-hero p-5 sm:p-7">
        <div className="tlr-hero-content flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15">
                <FiBarChart2 className="w-5 h-5" />
              </span>

              <span className="text-xs font-semibold tracking-widest uppercase text-sky-200">
                Analytics & Insights
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Team Reports
            </h1>

            <p className="text-sm text-blue-100/80 mt-2 max-w-xl">
              Generate daily, weekly, monthly, and custom reports
              to monitor your team's work and productivity.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
            <FiClipboard className="w-5 h-5 text-sky-200" />
            <div>
              <p className="text-xs text-blue-100/70">
                Report Type
              </p>
              <p className="text-sm font-bold text-white">
                {selectedTab?.label}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report type selection */}
      <section className="tlr-card p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="tlr-icon-box">
            <FiBarChart2 className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              Choose Report Period
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the type of report you want to generate.
            </p>
          </div>
        </div>

        <div className="tlr-tab-list">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setRows(null);
                }}
                className={`tlr-tab ${active ? 'tlr-tab-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters */}
      <section className="tlr-card p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="tlr-icon-box">
            <FiFilter className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              Report Filters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set the reporting period and employee.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Daily date */}
          {tab === 'daily' && (
            <div>
              <label className="tlr-label">Report Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  max={todayISO()}
                  className="tlr-input pl-10"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Weekly date */}
          {tab === 'weekly' && (
            <div>
              <label className="tlr-label">
                Any Date in Week
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  max={todayISO()}
                  className="tlr-input pl-10"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Monthly */}
          {tab === 'monthly' && (
            <div>
              <label className="tlr-label">Select Month</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="month"
                  className="tlr-input pl-10"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Custom range */}
          {tab === 'custom' && (
            <>
              <div>
                <label className="tlr-label">From Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    max={todayISO()}
                    className="tlr-input pl-10"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="tlr-label">To Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    max={todayISO()}
                    className="tlr-input pl-10"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Employee */}
          <div>
            <label className="tlr-label">Employee</label>
            <div className="relative">
              <FiUsers className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                className="tlr-input pl-10"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">All My Employees</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {tab === 'custom' && from && to && from > to && (
          <p className="text-xs text-red-600">
            The start date should not be later than the end date.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 tlr-filter-actions">
          <p className="text-xs text-slate-400">
            Selected report: <span className="font-semibold text-slate-600">{reportTitle}</span>
          </p>

          <button
            type="button"
            onClick={runReport}
            disabled={loading || (tab === 'custom' && from > to)}
            className="tlr-primary"
          >
            {loading ? (
              <>
                <FiRefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiBarChart2 className="w-4 h-4" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <div className="tlr-card p-8">
          <LoadingSpinner label="Generating report..." />
        </div>
      )}

      {/* Report results */}
      {!loading && rows && (
        <section className="tlr-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="tlr-icon-box">
                <FiFileText className="w-5 h-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {reportTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rows.length} record{rows.length === 1 ? '' : 's'} found
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 tlr-export-actions">
              <button
                type="button"
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="tlr-export"
              >
                {exporting ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiFileSpreadsheet className="w-4 h-4 text-emerald-600" />
                )}
                Excel
              </button>

              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="tlr-export"
              >
                {exporting ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiFileText className="w-4 h-4 text-rose-500" />
                )}
                PDF
              </button>
            </div>
          </div>

          <DataTable
            columns={tab === 'daily' ? DAILY_COLUMNS : SUMMARY_COLUMNS}
            rows={rows.map((r, i) => ({
              ...r,
              _id: r.employee?._id || i,
            }))}
            emptyTitle="No report data"
            emptyDescription="No submissions found for this selection."
          />
        </section>
      )}

      {/* Initial guidance */}
      {!loading && !rows && (
        <div className="tlr-info p-4 flex items-start gap-3">
          <FiCheckCircle className="w-5 h-5 text-sky-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Ready to generate your report
            </p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Choose a reporting period, optionally select an employee,
              and click Generate Report. You can export the results
              as Excel or PDF once the report is available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
