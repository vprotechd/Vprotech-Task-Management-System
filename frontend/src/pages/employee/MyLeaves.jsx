
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCalendar,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiInfo,
  FiShield,
  FiMessageSquare,
  FiUser,
  FiArrowRight,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';

const styles = `
.ml-card {
  background: #fff;
  border: 1px solid #e6ecf5;
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04),
              0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}

.ml-hover:hover {
  transform: translateY(-3px);
  border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05),
              0 18px 32px -18px rgba(14,100,200,.35);
}

.ml-rise {
  animation: ml-rise .5s cubic-bezier(.2,.8,.2,1) both;
}

@keyframes ml-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

.ml-hero {
  background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
  position: relative;
  overflow: hidden;
}

.ml-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%,rgba(56,189,248,.28),transparent 60%),
    radial-gradient(360px circle at 0% 100%,rgba(99,102,241,.25),transparent 60%);
}

.ml-tile {
  transition: transform .25s ease;
}

.ml-hover:hover .ml-tile {
  transform: scale(1.08) rotate(-4deg);
}

.ml-status {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .4rem .8rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.ml-pending {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
}

.ml-approved {
  color: #15803d;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.ml-rejected {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.ml-default {
  color: #475569;
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.ml-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  min-height: 2.65rem;
  padding: 0 1rem;
  border: 1px solid rgba(255,255,255,.2);
  border-radius: .7rem;
  background: rgba(255,255,255,.1);
  color: white;
  font-size: .8rem;
  font-weight: 600;
  transition: background .2s,transform .2s;
}

.ml-refresh:hover:not(:disabled) {
  background: rgba(255,255,255,.2);
  transform: translateY(-1px);
}

.ml-refresh:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.ml-filter {
  width: 100%;
  min-height: 2.75rem;
  padding: .65rem .85rem;
  border: 1.5px solid #dbe2ee;
  border-radius: .7rem;
  background: #f8fafc;
  color: #0f1b33;
  font-size: .875rem;
  outline: none;
  transition: border-color .2s,box-shadow .2s,background .2s;
}

.ml-filter:hover {
  border-color: #b8c4da;
}

.ml-filter:focus {
  border-color: #0ea5e9;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(14,165,233,.15);
}

.ml-info {
  background: linear-gradient(135deg,#eff8ff,#f0f5ff);
  border: 1px solid #bfdbfe;
}

.ml-info-icon {
  background: linear-gradient(135deg,#38bdf8,#2563eb);
  box-shadow: 0 8px 16px -8px rgba(37,99,235,.5);
}

.ml-spin {
  animation: ml-spin 1s linear infinite;
}

@keyframes ml-spin {
  to { transform: rotate(360deg); }
}

.ml-empty-icon {
  background: linear-gradient(135deg,#e0f2fe,#e0e7ff);
  color: #2563eb;
}

@media (prefers-reduced-motion: reduce) {
  .ml-rise {
    animation: none;
  }
  .ml-card,.ml-tile,.ml-filter,.ml-refresh {
    transition: none;
  }
}
`;

const STATUS_STYLES = {
  pending: 'ml-pending',
  approved: 'ml-approved',
  rejected: 'ml-rejected',
};

const STATUS_ICONS = {
  pending: FiClock,
  approved: FiCheckCircle,
  rejected: FiXCircle,
};

function formatDate(date) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const Icon = STATUS_ICONS[status] || FiClock;

  return (
    <span className={`ml-status ${STATUS_STYLES[status] || 'ml-default'}`}>
      <Icon />
      {status}
    </span>
  );
}

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLeaves = async () => {
    try {
      setLoading(true);

      const { data: res } = await axiosClient.get('/leaves/my');

      setLeaves(res.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to load leave applications.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const filteredLeaves =
    filter === 'all'
      ? leaves
      : leaves.filter((leave) => leave.status === filter);

  const pendingCount = leaves.filter(
    (leave) => leave.status === 'pending'
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status === 'approved'
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.status === 'rejected'
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <style>{styles}</style>

      {/* Header */}
      <div className="ml-hero ml-rise rounded-2xl px-5 py-6 sm:px-7 sm:py-7 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">

          <div>
            <div className="flex items-center gap-2 mb-2 text-sky-300">
              <FiFileText className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Employee Workspace
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              My Leave Applications
            </h2>

            <p className="text-sm text-slate-300 mt-2 max-w-xl">
              View your leave history, track application status and check admin feedback.
            </p>
          </div>

          <button
            onClick={fetchLeaves}
            disabled={loading}
            className="ml-refresh"
          >
            <FiRefreshCw className={loading ? 'ml-spin' : ''} />
            Refresh
          </button>

        </div>
      </div>

      {/* Summary Information */}
      <div className="ml-info ml-rise rounded-2xl p-4 sm:p-5 flex items-start gap-4">
        <div className="ml-info-icon h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0">
          <FiShield className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h3 className="font-semibold text-blue-950">
            Your Leave Summary
          </h3>

          <p className="text-sm text-blue-800 mt-1 leading-relaxed">
            Keep track of your leave applications and their current status.
            Approved and rejected requests are displayed in your leave history.
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 border border-blue-200 px-3 py-1.5 text-xs font-medium text-amber-700">
              <FiClock />
              Pending: {pendingCount}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 border border-blue-200 px-3 py-1.5 text-xs font-medium text-green-700">
              <FiCheckCircle />
              Approved: {approvedCount}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 border border-blue-200 px-3 py-1.5 text-xs font-medium text-red-700">
              <FiXCircle />
              Rejected: {rejectedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Applications */}
      <div className="ml-card ml-rise overflow-hidden">

        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FiFileText className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-800">
                Leave History
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                View and filter your applications
              </p>
            </div>
          </div>

          <div className="w-full sm:w-52">
            <label
              htmlFor="leave-filter"
              className="block mb-1.5 text-xs font-semibold text-slate-600"
            >
              Filter Applications
            </label>

            <select
              id="leave-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="ml-filter"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">

          {loading ? (

            <div className="py-12 text-center">
              <FiRefreshCw className="ml-spin mx-auto text-3xl text-sky-500 mb-3" />
              <p className="text-sm font-medium text-slate-700">
                Loading leave applications...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Please wait while we fetch your records.
              </p>
            </div>

          ) : filteredLeaves.length === 0 ? (

            <div className="py-12 text-center">
              <div className="ml-empty-icon h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiCalendar className="text-2xl" />
              </div>

              <h3 className="font-semibold text-slate-800">
                No leave applications found
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Your leave applications will appear here.
              </p>
            </div>

          ) : (

            filteredLeaves.map((leave) => (

              <div
                key={leave._id}
                className="ml-card ml-hover p-4 sm:p-5 space-y-4"
              >

                {/* Application Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div className="flex items-center gap-3">
                    <div className="ml-tile h-11 w-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <FiCalendar className="text-xl" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-800 capitalize">
                        {leave.leaveType} Leave
                      </h3>

                      <p className="text-xs text-slate-400 mt-1">
                        Applied on {formatDate(leave.appliedAt || leave.createdAt)}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={leave.status} />

                </div>

                <div className="border-t border-slate-100" />

                {/* Leave Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                      <FiCalendar />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Start Date
                      </p>

                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {formatDate(leave.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <FiCalendar />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        End Date
                      </p>

                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {formatDate(leave.endDate)}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Reason */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FiFileText className="text-sky-500" />
                    <p className="text-xs font-semibold text-slate-600">
                      Reason for Leave
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {leave.reason}
                  </p>
                </div>

                {/* Admin Remarks */}
                {leave.adminRemarks && (
                  <div className="ml-info rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiMessageSquare className="text-blue-600" />
                      <p className="text-xs font-semibold text-blue-950">
                        Admin Remarks
                      </p>
                    </div>

                    <p className="text-sm text-blue-800 leading-relaxed">
                      {leave.adminRemarks}
                    </p>
                  </div>
                )}

                {/* Reviewer */}
                {leave.reviewedBy && (
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <FiUser className="text-sky-500" />
                    <span>
                      Reviewed by:
                      <strong className="text-slate-700 ml-1">
                        {leave.reviewedBy.fullName}
                      </strong>
                    </span>
                  </div>
                )}

              </div>

            ))

          )}

        </div>
      </div>

      {/* Bottom Information */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pb-2">
        <FiCheckCircle className="text-green-500" />
        Your leave application history is available here.
      </div>

    </div>
  );
}
