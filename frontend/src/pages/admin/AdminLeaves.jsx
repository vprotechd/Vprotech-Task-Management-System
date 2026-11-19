import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCalendar,
  FiCheck,
  FiX,
  FiClock,
  FiRefreshCw,
  FiMessageSquare,
  FiInbox,
  FiTag,
  FiSun,
  FiSunset,
  FiUserCheck,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

/* Scoped styles (prefixed "lv-") so nothing clashes with your global CSS. */
const styles = `
.lv-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.lv-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.lv-rise { animation: lv-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes lv-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes lv-fade { from { opacity: 0; } to { opacity: 1; } }

.lv-tile { transition: transform .25s ease; }
.lv-hover:hover .lv-tile { transform: scale(1.08) rotate(-4deg); }

.lv-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.lv-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.lv-hero-btn {
  display: inline-flex; align-items: center; gap: .5rem;
  background: #fff; color: #0f1b33; font-weight: 600; font-size: .875rem;
  padding: .6rem 1rem; border-radius: .75rem; box-shadow: 0 10px 20px -10px rgba(0,0,0,.45);
  transition: transform .2s ease, box-shadow .2s ease, opacity .2s;
}
.lv-hero-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 24px -10px rgba(0,0,0,.5); }
.lv-hero-btn:disabled { opacity: .7; cursor: progress; }
.lv-hero-btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.lv-tab {
  display: inline-flex; align-items: center; gap: .45rem; padding: .4rem .85rem; border-radius: 999px;
  font-size: .8rem; font-weight: 500; color: #64748b; transition: all .15s ease;
}
.lv-tab:hover { color: #0f1b33; background: #eef3fb; }
.lv-tab[aria-pressed="true"] { color: #fff; background: #16305c; }
.lv-tab:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.lv-tab-count {
  font-size: .7rem; font-weight: 700; min-width: 1.25rem; text-align: center; padding: 0 .35rem; border-radius: 999px;
  background: rgba(100,116,139,.15);
}
.lv-tab[aria-pressed="true"] .lv-tab-count { background: rgba(255,255,255,.22); }

.lv-avatar {
  height: 2.8rem; width: 2.8rem; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
  color: #fff; font-size: .9rem; font-weight: 700; flex-shrink: 0;
}
.lv-fact { background: #f8fafc; border: 1px solid #eef2f8; border-radius: .8rem; padding: .65rem .8rem; }

.lv-approve {
  display: inline-flex; align-items: center; gap: .5rem; height: 2.4rem; padding: 0 1rem; border-radius: .7rem;
  font-size: .85rem; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #4ade80, #16a34a); box-shadow: 0 10px 20px -12px rgba(22,163,74,.9);
  transition: transform .15s, box-shadow .2s, filter .2s;
}
.lv-approve:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 24px -12px rgba(22,163,74,.95); }
.lv-reject {
  display: inline-flex; align-items: center; gap: .5rem; height: 2.4rem; padding: 0 1rem; border-radius: .7rem;
  font-size: .85rem; font-weight: 600; color: #dc2626; background: #fff; border: 1.5px solid #fecaca;
  transition: background .15s, border-color .15s;
}
.lv-reject:hover:not(:disabled) { background: #fef2f2; border-color: #fca5a5; }
.lv-approve:focus-visible, .lv-reject:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }
.lv-approve:disabled, .lv-reject:disabled { opacity: .55; cursor: not-allowed; }

.lv-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center; height: 2.6rem; padding: 0 1.1rem;
  border-radius: .7rem; font-size: .875rem; font-weight: 600; color: #475569; background: #fff; border: 1.5px solid #dbe2ee;
  transition: background .2s, border-color .2s;
}
.lv-btn-ghost:hover:not(:disabled) { background: #f1f5f9; border-color: #b8c4da; }
.lv-btn-ghost:disabled { opacity: .6; cursor: not-allowed; }
.lv-btn-ghost:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
.lv-btn-confirm {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.6rem; padding: 0 1.2rem;
  border-radius: .7rem; font-size: .875rem; font-weight: 600; color: #fff; transition: transform .15s, filter .2s;
}
.lv-btn-confirm:hover:not(:disabled) { transform: translateY(-1px); }
.lv-btn-confirm:disabled { cursor: not-allowed; filter: saturate(.6) brightness(.95); }
.lv-btn-confirm:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }

.lv-input {
  width: 100%; padding: .7rem .85rem; border: 1.5px solid #dbe2ee; border-radius: .75rem; resize: none;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none; line-height: 1.5;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.lv-input:hover { border-color: #b8c4da; }
.lv-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.lv-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }

.lv-overlay { animation: lv-fade .2s ease both; }

@media (prefers-reduced-motion: reduce) {
  .lv-rise, .lv-overlay { animation: none; }
  .lv-card, .lv-tile, .lv-hero-btn, .lv-tab, .lv-approve, .lv-reject, .lv-input, .lv-btn-confirm { transition: none; }
}
`;

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  green: { tile: 'linear-gradient(135deg,#4ade80,#16a34a)', glow: 'rgba(22,163,74,.35)' },
  amber: { tile: 'linear-gradient(135deg,#fbbf24,#d97706)', glow: 'rgba(217,119,6,.35)' },
  red: { tile: 'linear-gradient(135deg,#fb7185,#e11d48)', glow: 'rgba(225,29,72,.35)' },
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#38bdf8,#2563eb)',
  'linear-gradient(135deg,#818cf8,#4f46e5)',
  'linear-gradient(135deg,#2dd4bf,#0d9488)',
  'linear-gradient(135deg,#fbbf24,#d97706)',
  'linear-gradient(135deg,#fb7185,#e11d48)',
  'linear-gradient(135deg,#4ade80,#16a34a)',
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function gradientFor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function formatDate(date) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/* Inclusive number of calendar days between two dates, or null if unknown. */
function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const diff = Math.round((e - s) / 86400000) + 1;
  return diff > 0 ? diff : null;
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

function StatCard({ icon: Icon, label, value, tone = 'blue', delay = 0 }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="lv-card lv-hover lv-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="lv-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
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

function Fact({ icon: Icon, label, children }) {
  return (
    <div className="lv-fact">
      <p className="flex items-center gap-1.5 text-xs text-navy-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="font-semibold mt-1 text-navy-800">{children}</p>
    </div>
  );
}

const FILTERS = [
  { value: 'all', label: 'All Applications' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all leave applications
  const loadLeaves = useCallback(async () => {
    setLoading(true);

    try {
      const { data: res } = await axiosClient.get('/leaves');

      setLeaves(Array.isArray(res.data) ? res.data : []);

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to load leave applications.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // Filter applications
  const filteredLeaves =
    filter === 'all'
      ? leaves
      : leaves.filter((leave) => leave.status === filter);

  // Summary counts
  const pendingCount = leaves.filter(
    (leave) => leave.status === 'pending'
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status === 'approved'
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.status === 'rejected'
  ).length;

  const countFor = (value) => (value === 'all' ? leaves.length : leaves.filter((l) => l.status === value).length);

  // Open review dialog
  const openReview = (leave, status) => {
    setSelectedLeave(leave);
    setReviewStatus(status);
    setRemarks('');
  };

  // Close review dialog
  const closeReview = () => {
    setSelectedLeave(null);
    setReviewStatus('');
    setRemarks('');
  };

  // Close the dialog with the Escape key (unless a request is in flight)
  useEffect(() => {
    if (!selectedLeave) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) closeReview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedLeave, submitting]);

  // Approve or reject leave
  const handleReview = async (e) => {
    e.preventDefault();

    if (!selectedLeave) return;

    try {
      setSubmitting(true);

      const { data: res } = await axiosClient.patch(
        `/leaves/${selectedLeave._id}/review`,
        {
          status: reviewStatus,
          adminRemarks: remarks.trim(),
        }
      );

      toast.success(
        res.message ||
        `Leave ${reviewStatus} successfully.`
      );

      closeReview();
      await loadLeaves();

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to review leave application.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isApproving = reviewStatus === 'approved';

  return (
    <div className="space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="lv-hero lv-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Leave Management</h2>
            <p className="text-sm text-slate-300 mt-1">
              {loading
                ? 'Loading applications...'
                : pendingCount > 0
                  ? `${pendingCount} ${pendingCount === 1 ? 'application is' : 'applications are'} waiting for your review.`
                  : 'No applications are waiting for review.'}
            </p>
          </div>
          <button onClick={loadLeaves} disabled={loading} className="lv-hero-btn">
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiInbox} label="Total Applications" value={leaves.length} tone="blue" delay={40} />
        <StatCard icon={FiClock} label="Pending" value={pendingCount} tone="amber" delay={80} />
        <StatCard icon={FiCheck} label="Approved" value={approvedCount} tone="green" delay={120} />
        <StatCard icon={FiX} label="Rejected" value={rejectedCount} tone="red" delay={160} />
      </div>

      {/* Filters */}
      <div className="lv-card lv-rise p-3 flex flex-wrap gap-1" style={{ animationDelay: '200ms' }} role="group" aria-label="Filter applications">
        {FILTERS.map((item) => (
          <button key={item.value} type="button" className="lv-tab" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>
            {item.label}
            <span className="lv-tab-count tabular-nums">{countFor(item.value)}</span>
          </button>
        ))}
      </div>

      {/* Application list */}
      {loading ? (
        <LoadingSpinner label="Loading leave applications..." />
      ) : filteredLeaves.length === 0 ? (
        <div className="lv-card lv-rise" style={{ animationDelay: '240ms' }}>
          <EmptyState
            icon={FiCalendar}
            title="No leave applications found"
            description="Employee leave applications will appear here."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLeaves.map((leave, index) => {
            const employee = leave.employee || {};
            const days = daysBetween(leave.startDate, leave.endDate);

            return (
              <div
                key={leave._id}
                className="lv-card lv-rise p-5 space-y-4"
                style={{ animationDelay: `${240 + Math.min(index, 6) * 40}ms` }}
              >
                {/* Employee details */}
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="lv-avatar" style={{ background: gradientFor(employee.fullName) }}>
                      {initials(employee.fullName)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-navy-800">{employee.fullName || 'Unknown Employee'}</h3>
                      <p className="text-xs text-navy-400 mt-0.5">
                        ID: {employee.employeeCode || '-'}
                        {' · '}
                        {employee.department?.name || '-'}
                      </p>
                      {employee.email && <p className="text-xs text-navy-400">{employee.email}</p>}
                    </div>
                  </div>

                  <StatusBadge status={leave.status} />
                </div>

                {/* Leave details */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Fact icon={FiTag} label="Leave Type">
                    <span className="capitalize">{leave.leaveType} Leave</span>
                  </Fact>
                  <Fact icon={FiSun} label="Start Date">{formatDate(leave.startDate)}</Fact>
                  <Fact icon={FiSunset} label="End Date">{formatDate(leave.endDate)}</Fact>
                  <Fact icon={FiCalendar} label="Duration">
                    {days ? `${days} ${days === 1 ? 'day' : 'days'}` : '-'}
                  </Fact>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-xs font-semibold text-navy-400 mb-1">Reason for Leave</p>
                  <p className="text-sm text-navy-700 whitespace-pre-line">{leave.reason}</p>
                </div>

                {/* Admin remarks */}
                {leave.adminRemarks && (
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-sky-800">
                      <FiMessageSquare className="h-3.5 w-3.5" /> Admin Remarks
                    </p>
                    <p className="text-sm text-sky-900 mt-1">{leave.adminRemarks}</p>
                  </div>
                )}

                {/* Footer meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-navy-400">
                  <span>Applied on: {formatDate(leave.appliedAt || leave.createdAt)}</span>
                  {leave.reviewedBy && (
                    <span className="inline-flex items-center gap-1.5">
                      <FiUserCheck className="h-3.5 w-3.5" /> Reviewed by {leave.reviewedBy.fullName}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                {leave.status === 'pending' && (
                  <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-slate-100">
                    <button onClick={() => openReview(leave, 'rejected')} className="lv-reject">
                      <FiX className="h-4 w-4" /> Reject
                    </button>
                    <button onClick={() => openReview(leave, 'approved')} className="lv-approve">
                      <FiCheck className="h-4 w-4" /> Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {selectedLeave && (
        <div
          className="lv-overlay fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) closeReview(); }}
        >
          <div
            className="lv-rise bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lv-review-title"
          >
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ background: isApproving ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#e11d48,#be123c)' }}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
                  {isApproving ? <FiCheck className="h-5 w-5" /> : <FiX className="h-5 w-5" />}
                </div>
                <h3 id="lv-review-title" className="text-lg font-semibold">
                  {isApproving ? 'Approve Leave' : 'Reject Leave'}
                </h3>
              </div>

              <button
                onClick={closeReview}
                disabled={submitting}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/20 disabled:opacity-50"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                <span className="lv-avatar" style={{ background: gradientFor(selectedLeave.employee?.fullName) }}>
                  {initials(selectedLeave.employee?.fullName)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-navy-800">{selectedLeave.employee?.fullName}</p>
                  <p className="text-sm text-navy-400 mt-0.5">
                    {formatDate(selectedLeave.startDate)}
                    {' - '}
                    {formatDate(selectedLeave.endDate)}
                  </p>
                </div>
              </div>

              <form onSubmit={handleReview} className="space-y-4">
                <div>
                  <label htmlFor="lv-remarks" className="lv-label">Admin Remarks</label>
                  <textarea
                    id="lv-remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows="3"
                    maxLength="1000"
                    className="lv-input"
                    placeholder="Enter remarks (optional)..."
                    autoFocus
                  />
                  <p className="text-[11px] text-navy-400 mt-1 text-right tabular-nums">{remarks.length} / 1000</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeReview} disabled={submitting} className="lv-btn-ghost">
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="lv-btn-confirm"
                    style={{ background: isApproving ? 'linear-gradient(135deg,#4ade80,#16a34a)' : 'linear-gradient(135deg,#fb7185,#e11d48)' }}
                  >
                    {submitting
                      ? 'Processing...'
                      : isApproving
                        ? 'Confirm Approval'
                        : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}