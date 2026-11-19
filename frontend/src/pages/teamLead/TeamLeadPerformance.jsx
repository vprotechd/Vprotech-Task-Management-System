
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

import {
  FiBarChart2,
  FiCalendar,
  FiTrendingUp,
  FiTarget,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiRefreshCw,
  FiUsers,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { todayISO } from '../../utils/format';

const TABS = [
  { key: 'weekly', label: 'Weekly', icon: FiCalendar },
  { key: 'monthly', label: 'Monthly', icon: FiBarChart2 },
  { key: 'custom', label: 'Custom Range', icon: FiFilter },
];

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Shortens a full name to fit as a chart axis label without crowding.
function shortName(name) {
  if (!name) return '-';
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}

const styles = `
.tlp-page {
  animation: tlpFadeIn .45s ease both;
}

@keyframes tlpFadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.tlp-hero {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  color: white;
  background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
  box-shadow: 0 12px 30px rgba(15,35,70,.13);
}

.tlp-hero::before {
  content: "";
  position: absolute;
  width: 280px;
  height: 280px;
  right: -70px;
  top: -160px;
  border-radius: 50%;
  background: rgba(56,189,248,.19);
}

.tlp-hero::after {
  content: "";
  position: absolute;
  width: 210px;
  height: 210px;
  right: 160px;
  bottom: -170px;
  border-radius: 50%;
  background: rgba(99,102,241,.22);
}

.tlp-hero-content {
  position: relative;
  z-index: 1;
}

.tlp-card {
  background: #fff;
  border: 1px solid #e6ecf5;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(15,35,70,.045);
  transition: box-shadow .2s ease, transform .2s ease;
}

.tlp-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15,35,70,.075);
}

.tlp-icon-box {
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

.tlp-tab-list {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap: 8px;
}

.tlp-tab {
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

.tlp-tab:hover:not(.tlp-tab-active) {
  background: #eff6ff;
  color: #0369a1;
}

.tlp-tab-active {
  color: white;
  background: linear-gradient(135deg,#0ea5e9,#4f46e5);
  box-shadow: 0 4px 12px rgba(14,165,233,.2);
}

.tlp-label {
  display: block;
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  margin-bottom: 7px;
}

.tlp-input {
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

.tlp-input:focus {
  border-color: #38bdf8;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(14,165,233,.12);
}

.tlp-info {
  background: linear-gradient(110deg,#eff8ff,#f0f5ff);
  border: 1px solid #dbeafe;
  border-radius: 12px;
}

.tlp-chart-container {
  width: 100%;
  min-width: 0;
}

.tlp-chart-tooltip {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 13px;
  box-shadow: 0 5px 16px rgba(15,35,70,.09);
  font-size: 12px;
}

@media (max-width: 640px) {
  .tlp-hero {
    border-radius: 14px;
  }

  .tlp-tab-list {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }

  .tlp-tab:last-child {
    grid-column: span 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tlp-page, .tlp-card, .tlp-stat-card, .tlp-tab, .tlp-input {
    animation: none !important;
    transition: none !important;
  }
}
`;

export default function TeamLeadPerformance() {
  const [tab, setTab] = useState('weekly');
  const [weekStart, setWeekStart] = useState(todayISO());
  const [month, setMonth] = useState(currentMonthValue());
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const paramsForTab = () => {
    if (tab === 'weekly') return { weekStart };
    if (tab === 'monthly') return { month };
    return { from, to };
  };

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: res } = await axiosClient.get(
        `/reports/${tab}`,
        { params: paramsForTab() }
      );

      setRows(res.data.summary || []);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Failed to load performance data.';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [tab, weekStart, month, from, to]);

  const chartData = rows.map((r) => ({
    name: shortName(r.employee?.fullName),
    fullName: r.employee?.fullName,
    Planned: r.totalPlannedTasks,
    Completed: r.totalCompletedTasks,
    'Completion %': r.overallCompletionPercentage,
  }));

  const totalEmployees = rows.length;

  const totalPlanned = rows.reduce(
    (sum, row) => sum + (Number(row.totalPlannedTasks) || 0),
    0
  );

  const totalCompleted = rows.reduce(
    (sum, row) => sum + (Number(row.totalCompletedTasks) || 0),
    0
  );

  const averageCompletion = rows.length
    ? Math.round(
        rows.reduce(
          (sum, row) =>
            sum + (Number(row.overallCompletionPercentage) || 0),
          0
        ) / rows.length
      )
    : 0;

  const selectedTab = TABS.find((item) => item.key === tab);

  const reportTitle = {
    weekly: 'Weekly Performance',
    monthly: 'Monthly Performance',
    custom: 'Custom Range Performance',
  }[tab];

  return (
    <div className="tlp-page max-w-7xl mx-auto space-y-5">
      <style>{styles}</style>

      {/* Hero */}
      <div className="tlp-hero p-5 sm:p-7">
        <div className="tlp-hero-content flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15">
                <FiTrendingUp className="w-5 h-5" />
              </span>

              <span className="text-xs font-semibold tracking-widest uppercase text-sky-200">
                Team Analytics
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Team Performance
            </h1>

            <p className="text-sm text-blue-100/80 mt-2 max-w-xl">
              Monitor employee productivity, compare planned and completed
              tasks, and track overall team completion.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3">
            <FiBarChart2 className="w-5 h-5 text-sky-200" />
            <div>
              <p className="text-xs text-blue-100/70">Report Period</p>
              <p className="text-sm font-bold text-white">
                {selectedTab?.label}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Period selection */}
      <section className="tlp-card p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="tlp-icon-box">
            <FiCalendar className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              Select Performance Period
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the reporting period for your team analytics.
            </p>
          </div>
        </div>

        <div className="tlp-tab-list">
          {TABS.map((t) => {
            const Icon = t.icon;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`tlp-tab ${
                  tab === t.key ? 'tlp-tab-active' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Filters */}
      <section className="tlp-card p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="tlp-icon-box">
            <FiFilter className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">
              Date Filters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust the date range to view performance data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tab === 'weekly' && (
            <div>
              <label className="tlp-label">Any Date in Week</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  max={todayISO()}
                  className="tlp-input pl-10"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </div>
            </div>
          )}

          {tab === 'monthly' && (
            <div>
              <label className="tlp-label">Select Month</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="month"
                  className="tlp-input pl-10"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
            </div>
          )}

          {tab === 'custom' && (
            <>
              <div>
                <label className="tlp-label">From Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    max={todayISO()}
                    className="tlp-input pl-10"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="tlp-label">To Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    max={todayISO()}
                    className="tlp-input pl-10"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {tab === 'custom' && from && to && from > to && (
          <p className="text-xs text-red-600">
            The start date should not be later than the end date.
          </p>
        )}

        <div className="tlp-info p-3 flex items-start gap-3">
          <FiCheckCircle className="w-5 h-5 text-sky-700 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Performance data is automatically refreshed whenever you
            change the selected period or date range.
          </p>
        </div>
      </section>

      {/* Loading */}
      {loading ? (
        <div className="tlp-card p-8">
          <LoadingSpinner label="Loading performance data..." />
        </div>
      ) : error ? (
        <div className="tlp-card p-6">
          <ErrorState
            message={error}
            onRetry={load}
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="tlp-card p-6">
          <EmptyState
            title="No performance data"
            description="No submissions found for this team in this range."
          />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="tlp-card tlp-stat-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Team Employees
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {totalEmployees}
                  </p>
                </div>
                <div className="tlp-icon-box">
                  <FiUsers className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="tlp-card tlp-stat-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Planned Tasks
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {totalPlanned}
                  </p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FiTarget className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="tlp-card tlp-stat-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Completed Tasks
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {totalCompleted}
                  </p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <FiCheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="tlp-card tlp-stat-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Average Completion
                  </p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">
                    {averageCompletion}%
                  </p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <FiTrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Planned vs completed chart */}
          <section className="tlp-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="tlp-icon-box">
                  <FiBarChart2 className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Planned vs Completed Tasks
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Employee-wise task comparison
                  </p>
                </div>
              </div>

              <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-100 rounded-full px-3 py-1.5">
                {reportTitle}
              </span>
            </div>

            <div
              className="tlp-chart-container"
              style={{
                height: Math.max(280, chartData.length * 45),
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#EEF2F7"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />

                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName || ''
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="Planned"
                    fill="#87A6C7"
                    radius={[0, 5, 5, 0]}
                    barSize={13}
                  />

                  <Bar
                    dataKey="Completed"
                    fill="#5CB85C"
                    radius={[0, 5, 5, 0]}
                    barSize={13}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Completion percentage chart */}
          <section className="tlp-card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FiTrendingUp className="w-5 h-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Completion Percentage by Employee
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overall task completion comparison
                </p>
              </div>
            </div>

            <div
              className="tlp-chart-container"
              style={{ height: 320 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 15, bottom: 35, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#EEF2F7"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={65}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName || ''
                    }
                    formatter={(value) => [`${value}%`, 'Completion']}
                  />

                  <Bar
                    dataKey="Completion %"
                    fill="#3D6B9C"
                    radius={[5, 5, 0, 0]}
                    barSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
