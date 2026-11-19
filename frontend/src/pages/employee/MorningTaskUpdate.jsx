import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiSend,
  FiCheckCircle,
  FiLock,
  FiAlertCircle,
  FiClipboard,
  FiClock,
  FiFlag,
  FiSunrise,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { todayISO } from '../../utils/format';

/* Scoped styles (prefixed "mt-") so nothing clashes with your global CSS. */
const styles = `
.mt-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.mt-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.mt-rise { animation: mt-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes mt-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.mt-tile { transition: transform .25s ease; }
.mt-hover:hover .mt-tile { transform: scale(1.08) rotate(-4deg); }

.mt-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.mt-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.mt-date {
  height: 2.6rem; padding: 0 .85rem; border-radius: .75rem; border: 0; outline: none;
  background: #fff; color: #0f1b33; font-weight: 600; font-size: .875rem;
  box-shadow: 0 10px 20px -10px rgba(0,0,0,.45);
}
.mt-date:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.mt-label { display: block; margin-bottom: .25rem; font-size: .72rem; font-weight: 600; color: #475569; }
.mt-input {
  width: 100%; padding: 0 .8rem; border: 1.5px solid #dbe2ee; border-radius: .7rem;
  background: #f8fafc; color: #0f1b33; font-size: .875rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.mt-input:not(textarea) { height: 2.5rem; }
textarea.mt-input { padding-top: .6rem; padding-bottom: .6rem; line-height: 1.5; resize: vertical; }
.mt-input:hover:not(:disabled):not([readonly]) { border-color: #b8c4da; }
.mt-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.mt-input::placeholder { color: #94a3b8; }
.mt-input[readonly], .mt-input:disabled { background: #eef2f8; color: #64748b; cursor: not-allowed; }

.mt-num {
  height: 1.9rem; min-width: 1.9rem; padding: 0 .5rem; border-radius: .6rem; display: inline-flex; align-items: center; justify-content: center;
  font-size: .75rem; font-weight: 700; color: #fff; background: linear-gradient(135deg, #38bdf8, #2563eb);
}

.mt-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.7rem; padding: 0 1.3rem;
  border-radius: .75rem; font-size: .875rem; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #4f46e5); box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
  transition: transform .15s, box-shadow .2s, filter .2s;
}
.mt-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgba(79,70,229,.95); }
.mt-btn:active:not(:disabled) { transform: scale(.99); }
.mt-btn:disabled { cursor: not-allowed; filter: saturate(.5) brightness(.97); opacity: .6; }
.mt-btn:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }
.mt-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.7rem; padding: 0 1.2rem;
  border-radius: .75rem; font-size: .875rem; font-weight: 600; color: #475569; background: #fff; border: 1.5px solid #dbe2ee;
  transition: background .2s, border-color .2s;
}
.mt-btn-ghost:hover:not(:disabled) { background: #f1f5f9; border-color: #b8c4da; }
.mt-btn-ghost:disabled { cursor: not-allowed; opacity: .5; }
.mt-btn-ghost:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.mt-remove {
  height: 2.2rem; width: 2.2rem; display: inline-flex; align-items: center; justify-content: center; border-radius: .6rem;
  color: #ef4444; transition: background .15s, color .15s;
}
.mt-remove:hover:not(:disabled) { background: #fee2e2; color: #b91c1c; }
.mt-remove:disabled { opacity: .4; cursor: not-allowed; }
.mt-remove:focus-visible { outline: 2px solid #38bdf8; outline-offset: 1px; }

@media (prefers-reduced-motion: reduce) {
  .mt-rise { animation: none; }
  .mt-card, .mt-tile, .mt-input, .mt-btn, .mt-btn-ghost, .mt-remove { transition: none; }
}
`;

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
  green: { tile: 'linear-gradient(135deg,#4ade80,#16a34a)', glow: 'rgba(22,163,74,.35)' },
  amber: { tile: 'linear-gradient(135deg,#fbbf24,#d97706)', glow: 'rgba(217,119,6,.35)' },
  red: { tile: 'linear-gradient(135deg,#fb7185,#e11d48)', glow: 'rgba(225,29,72,.35)' },
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

/* Card showing either a number (animated) or a short text. */
function StatCard({ icon: Icon, label, value, text, tone = 'blue', delay = 0 }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="mt-card mt-hover mt-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="mt-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{ background: t.tile, boxShadow: `0 10px 18px -8px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        {text !== undefined ? (
          <p className="text-lg font-semibold text-navy-800 leading-tight truncate">{text}</p>
        ) : (
          <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">{shown}</p>
        )}
      </div>
    </div>
  );
}

/* Coloured callout used for status messages */
const CALLOUT_STYLES = {
  info: { box: 'bg-sky-50 border-sky-200 text-sky-900', icon: 'bg-sky-100 text-sky-600' },
  warn: { box: 'bg-amber-50 border-amber-200 text-amber-900', icon: 'bg-amber-100 text-amber-600' },
  danger: { box: 'bg-red-50 border-red-200 text-red-900', icon: 'bg-red-100 text-red-600' },
  success: { box: 'bg-green-50 border-green-200 text-green-900', icon: 'bg-green-100 text-green-600' },
  muted: { box: 'bg-slate-50 border-slate-200 text-slate-700', icon: 'bg-slate-100 text-slate-500' },
};

function Callout({ tone = 'info', icon: Icon, title, children }) {
  const s = CALLOUT_STYLES[tone];
  return (
    <div className={`mt-rise rounded-2xl border p-4 flex items-start gap-3 text-sm ${s.box}`}>
      <span className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${s.icon}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
    </div>
  );
}

/* ============================================================
   CONSTANTS
============================================================ */

const MORNING_CUTOFF_HOUR = 10;
const MORNING_CUTOFF_MINUTE = 0;

const LATE_REASON_STORAGE_PREFIX = 'morning-update-late-reason';

/* ============================================================
   HELPERS
============================================================ */

const emptyTask = () => ({
  _id: '',
  title: '',
  description: '',
  priority: 'Medium',
  expectedCompletion: '',
  estimatedTimeHours: 1,
  remarks: '',
});

function hoursToMinutes(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 60);
}

function minutesToHours(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Number((value / 60).toFixed(2));
}

function hoursHint(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value) || value <= 0) return null;

  const totalMinutes = Math.round(value * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`;
  if (h === 0) return `${m} minutes`;
  return `${h}h ${m}m`;
}

function isToday(date) {
  return date === todayISO();
}

function isPastDate(date) {
  if (!date) return false;

  const selected = new Date(`${date}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(selected.getTime())) return false;

  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return selected < today;
}

function isFutureDate(date) {
  if (!date) return false;

  const selected = new Date(`${date}T00:00:00`);
  const today = new Date();

  if (Number.isNaN(selected.getTime())) return false;

  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return selected > today;
}

function isMorningTaskLocked(date) {
  if (isPastDate(date)) return true;
  if (isFutureDate(date)) return false;
  if (!isToday(date)) return false;

  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(MORNING_CUTOFF_HOUR, MORNING_CUTOFF_MINUTE, 0, 0);

  return now >= cutoff;
}

function cutoffLabel() {
  return '10:15 AM';
}

/* ============================================================
   LATE REASON LOCAL STORAGE

   React state disappears when the user leaves the page and comes
   back, so the successful late reason is also kept in localStorage,
   separately for every date.
============================================================ */

function getLateReasonStorageKey(date) {
  return `${LATE_REASON_STORAGE_PREFIX}:${date}`;
}

function getStoredLateReason(date) {
  if (!date) return '';

  try {
    const value = localStorage.getItem(getLateReasonStorageKey(date));
    return typeof value === 'string' ? value.trim() : '';
  } catch (error) {
    console.error('Could not read late reason from localStorage:', error);
    return '';
  }
}

function saveStoredLateReason(date, reason) {
  if (!date || !reason) return;

  try {
    localStorage.setItem(getLateReasonStorageKey(date), String(reason).trim());
  } catch (error) {
    console.error('Could not save late reason to localStorage:', error);
  }
}

/* ============================================================
   API RESPONSE HELPERS
============================================================ */

function extractReport(response) {
  return (
    response?.data?.data?.report ||
    response?.data?.report ||
    response?.data?.data ||
    null
  );
}

/* Supports all known backend locations for late reason. */
function extractLateSubmissionReason(report) {
  if (!report) return '';

  const possibleReasons = [
    report?.lateSubmissionReason,
    report?.lateReason,
    report?.reasonForLateSubmission,

    report?.morning?.lateSubmissionReason,
    report?.morning?.lateReason,
    report?.morning?.reasonForLateSubmission,

    report?.morningReport?.lateSubmissionReason,
    report?.morningReport?.lateReason,
    report?.morningReport?.reasonForLateSubmission,

    report?.morningUpdate?.lateSubmissionReason,
    report?.morningUpdate?.lateReason,
    report?.morningUpdate?.reasonForLateSubmission,
  ];

  const found = possibleReasons.find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  return found ? found.trim() : '';
}

/* ============================================================
   TASK MAPPING
============================================================ */

function mapTaskFromServer(task) {
  return {
    _id: task?._id || '',
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    expectedCompletion: task?.expectedCompletion || '',
    estimatedTimeHours: minutesToHours(task?.estimatedTimeMinutes),
    remarks: task?.remarks || '',
  };
}

function mapReportToForm(report, fallbackLateReason = '') {
  const tasks = Array.isArray(report?.morning?.tasks)
    ? report.morning.tasks.map(mapTaskFromServer)
    : [];

  const serverLateReason = extractLateSubmissionReason(report);
  const lateReason = serverLateReason || String(fallbackLateReason || '').trim();

  return {
    tasks: tasks.length > 0 ? tasks : [emptyTask()],
    remarks: report?.morning?.remarks || '',
    lateSubmissionReason: lateReason,
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function MorningTaskUpdate() {
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lockCheck, setLockCheck] = useState(Date.now());

  /* React copy of the late reason. The permanent copy is in localStorage. */
  const [savedLateReason, setSavedLateReason] = useState(() => getStoredLateReason(todayISO()));

  /* ==========================================================
     FORM
  ========================================================== */

  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      tasks: [emptyTask()],
      remarks: '',
      lateSubmissionReason: getStoredLateReason(todayISO()),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'tasks' });

  const watchedTasks = watch('tasks') || [];
  const lateSubmissionReason = watch('lateSubmissionReason') || '';

  /* ==========================================================
     REPORT STATUS
  ========================================================== */

  const morningAlreadySubmitted =
    Boolean(existingReport?.morning?.submittedAt) ||
    ['morning_submitted', 'evening_submitted', 'approved'].includes(existingReport?.status);

  const submittedButEditable = existingReport?.status === 'morning_submitted';
  const approvedButEditable = existingReport?.status === 'approved';
  const reopenedForEdit = existingReport?.status === 'evening_submitted';

  /* ==========================================================
     LOCK STATE
  ========================================================== */

  const morningLocked = useMemo(() => {
    void lockCheck;
    return isMorningTaskLocked(date);
  }, [date, lockCheck]);

  /* After the cutoff the employee can still create/edit today's tasks.
   * A reason is required for the first late submission. */
  const lateSubmissionAllowed = isToday(date) && morningLocked;

  /* Today's tasks stay editable after the cutoff. Past dates remain locked. */
  const canEditTasks = !isPastDate(date);

  /* Drafts are blocked before the first late submission, matching the
   * backend. Once a late report is accepted, drafts are allowed. */
  const canSaveDraft = !morningLocked || Boolean(existingReport?.isLateSubmission === true);

  /* ==========================================================
     CUTOFF TIMER
  ========================================================== */

  useEffect(() => {
    const interval = setInterval(() => {
      setLockCheck(Date.now());
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* ==========================================================
     DATE CHANGE: load the saved reason for that date
  ========================================================== */

  useEffect(() => {
    setSavedLateReason(getStoredLateReason(date));
  }, [date]);

  /* ==========================================================
     LOAD DAY
  ========================================================== */

  const loadDay = useCallback(
    async (selectedDate) => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await axiosClient.get('/tasks/day', {
          params: { date: selectedDate },
        });

        const report = extractReport(response);

        setExistingReport(report);

        /* 1. Backend first, 2. localStorage, 3. backend wins. */
        const serverLateReason = extractLateSubmissionReason(report);
        const localLateReason = getStoredLateReason(selectedDate);
        const reasonToUse = serverLateReason || localLateReason || '';

        setSavedLateReason(reasonToUse);

        /* If backend has a reason, keep a local copy too. */
        if (serverLateReason) {
          saveStoredLateReason(selectedDate, serverLateReason);
        }

        /* Reset form WITHOUT losing the reason. */
        reset(mapReportToForm(report, reasonToUse));
      } catch (err) {
        console.error('Load morning tasks error:', err);

        const message =
          err?.response?.data?.message || 'Failed to load tasks for this date.';

        setLoadError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [reset]
  );

  useEffect(() => {
    loadDay(date);
  }, [date, loadDay]);

  /* ==========================================================
     TASK VALIDATION
  ========================================================== */

  const getValidTasks = useCallback((values) => {
    return (values?.tasks || []).filter((task) => {
      const title = String(task?.title || '').trim();
      const hours = Number(task?.estimatedTimeHours);

      return title.length > 0 && Number.isFinite(hours) && hours >= 0.25 && hours <= 24;
    });
  }, []);

  const validateTasks = useCallback(
    (values) => {
      const tasks = values?.tasks || [];

      if (tasks.length === 0) {
        toast.error('Please add at least one task.');
        return false;
      }

      const validTasks = getValidTasks(values);

      if (validTasks.length === 0) {
        toast.error('Please add at least one valid task with a title and estimated time.');
        return false;
      }

      const invalidRow = tasks.some((task) => {
        const title = String(task?.title || '').trim();
        const hoursValue = String(task?.estimatedTimeHours ?? '').trim();

        /* Completely empty row is allowed. */
        if (!title && !hoursValue) return false;

        const hours = Number(task?.estimatedTimeHours);

        /* Title exists but hours invalid. */
        if (title && (!Number.isFinite(hours) || hours < 0.25 || hours > 24)) return true;

        /* Hours exist but title doesn't. */
        if (!title && hoursValue) return true;

        return false;
      });

      if (invalidRow) {
        toast.error(
          'Please complete every partially filled task with a title and valid estimated hours.'
        );
        return false;
      }

      return true;
    },
    [getValidTasks]
  );

  /* ==========================================================
     VALIDATE BEFORE SAVE
  ========================================================== */

  const validateBeforeSave = useCallback(
    (values, submit) => {
      if (isPastDate(date)) {
        toast.error('Morning updates are locked for past dates.');
        return false;
      }

      if (isFutureDate(date)) {
        toast.error('Morning tasks cannot be entered for a future date.');
        return false;
      }

      /* AFTER CUTOFF */
      if (morningLocked) {
        /* Draft is never allowed. */
        if (!submit) {
          toast.error(`Save Draft is unavailable after ${cutoffLabel()}.`);
          return false;
        }

        /* New plan cannot be created after cutoff. */
        if (!lateSubmissionAllowed) {
          toast.error(`A new morning plan cannot be created after ${cutoffLabel()}.`);
          return false;
        }

        /* Late reason required. */
        const reason = String(values?.lateSubmissionReason || '').trim();

        if (!reason) {
          toast.error(
            `Please provide a reason for the late submission after ${cutoffLabel()}.`
          );
          return false;
        }

        if (reason.length < 5) {
          toast.error('Late submission reason must contain at least 5 characters.');
          return false;
        }
      }

      return validateTasks(values);
    },
    [date, morningLocked, lateSubmissionAllowed, validateTasks]
  );

  /* ==========================================================
     SAVE / SUBMIT
  ========================================================== */

  const onSave = async (values, submit) => {
    if (saving) return;

    if (!validateBeforeSave(values, submit)) return;

    setSaving(true);

    try {
      /* Remove empty task rows. */
      const validTasks = getValidTasks(values);

      /* Convert hours to backend minutes. */
      const formattedTasks = validTasks.map((task) => ({
        ...(task?._id ? { _id: task._id } : {}),
        title: String(task.title || '').trim(),
        description: String(task.description || '').trim(),
        priority: task.priority || 'Medium',
        expectedCompletion: String(task.expectedCompletion || '').trim(),
        estimatedTimeMinutes: hoursToMinutes(task.estimatedTimeHours),
        remarks: String(task.remarks || '').trim(),
      }));

      if (formattedTasks.length === 0) {
        toast.error('Please add at least one valid task.');
        return;
      }

      /* ====================================================
         LATE REASON
      ==================================================== */

      const typedLateReason = String(values?.lateSubmissionReason || '').trim();

      /* If the form somehow lost the value, use the saved local value. */
      const storedLateReason = getStoredLateReason(date);

      const lateReason = lateSubmissionAllowed
        ? typedLateReason || storedLateReason || String(savedLateReason || '').trim()
        : '';

      /* Make sure a late reason exists. */
      if (submit && lateSubmissionAllowed && !lateReason) {
        toast.error('Please provide a reason for the late submission.');
        return;
      }

      const payload = {
        date,
        tasks: formattedTasks,
        remarks: String(values?.remarks || '').trim(),
        lateSubmissionReason: lateReason,
        lateReason,
        submit,
      };

      /* ====================================================
         API REQUEST
      ==================================================== */

      const response = await axiosClient.post('/tasks/morning', payload);

      const report = extractReport(response);

      /* Save the reason permanently (React state + browser storage). */
      if (submit && lateSubmissionAllowed && lateReason) {
        setSavedLateReason(lateReason);
        saveStoredLateReason(date, lateReason);
      }

      /* Reason returned by backend. */
      const serverReason = extractLateSubmissionReason(report);

      /* Backend > current reason > localStorage > state */
      const reasonToDisplay =
        serverReason || lateReason || getStoredLateReason(date) || savedLateReason || '';

      /* If backend returned the reason, save it locally as well. */
      if (serverReason) {
        saveStoredLateReason(date, serverReason);
        setSavedLateReason(serverReason);
      }

      if (report) {
        setExistingReport(report);
      }

      /* Reset form WITHOUT losing the reason. */
      reset(mapReportToForm(report, reasonToDisplay));

      if (submit) {
        if (lateSubmissionAllowed) {
          toast.success('Late morning update submitted successfully!');
        } else {
          toast.success('Morning tasks submitted successfully!');
        }
      } else {
        toast.success('Draft saved successfully!');
      }
    } catch (err) {
      console.error('Morning task save error:', err);

      const status = err?.response?.status;

      const message =
        err?.response?.data?.message || err?.message || 'Could not save morning tasks.';

      if (status === 401) {
        toast.error('Your session has expired. Please login again.');
      } else if (status === 403) {
        toast.error(message || 'You are not allowed to update this morning report.');
      } else if (status === 409) {
        toast.error(message || 'This morning report was changed. Please reload the page.');
      } else {
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     DERIVED VALUES FOR THE UI
  ========================================================== */

  const validWatchedTasks = getValidTasks({ tasks: watchedTasks });
  const totalTasks = validWatchedTasks.length;

  const totalHours = validWatchedTasks.reduce(
    (sum, task) => sum + (Number(task.estimatedTimeHours) || 0),
    0
  );

  const displayedLateReason = String(
    lateSubmissionReason || savedLateReason || getStoredLateReason(date) || ''
  ).trim();

  const statusText = (() => {
    const status = existingReport?.status;
    if (status === 'approved') return 'Approved';
    if (status === 'evening_submitted') return 'Evening submitted';
    if (status === 'morning_submitted') return 'Submitted';
    if (existingReport) return 'Draft';
    return 'Not submitted';
  })();

  const statusTone = morningAlreadySubmitted ? 'green' : existingReport ? 'indigo' : 'amber';

  const prettyDate = (() => {
    const d = new Date(`${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  })();

  const readOnly = !canEditTasks;

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="mt-hero mt-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Morning Task Update</h2>
            <p className="text-sm text-slate-300 mt-1">{prettyDate}</p>
            <p className="text-xs text-slate-400 mt-1">
              Plan what you intend to work on today. Estimated task time is entered in hours.
            </p>
          </div>
          <div>
            <label htmlFor="mt-date" className="sr-only">Date</label>
            <input
              id="mt-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="mt-date"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiClipboard} label="Planned Tasks" value={totalTasks} tone="blue" delay={40} />
        <StatCard icon={FiClock} label="Estimated Time" text={totalHours > 0 ? `${Number(totalHours.toFixed(2))} hrs` : '-'} tone="indigo" delay={80} />
        <StatCard icon={FiSunrise} label="Status" text={statusText} tone={statusTone} delay={120} />
        <StatCard
          icon={morningLocked ? FiLock : FiCheckCircle}
          label="Cutoff"
          text={cutoffLabel()}
          tone={morningLocked ? (lateSubmissionAllowed ? 'amber' : 'red') : 'green'}
          delay={160}
        />
      </div>

      {/* Cutoff message (today only) */}
      {isToday(date) && (
        <>
          {!morningLocked && (
            <Callout tone="info" icon={FiCheckCircle} title={`Morning submission cutoff: ${cutoffLabel()}`}>
              You can add, edit and submit morning tasks normally until {cutoffLabel()}.
            </Callout>
          )}
          {morningLocked && lateSubmissionAllowed && (
            <Callout tone="warn" icon={FiAlertCircle} title={`Morning submission cutoff: ${cutoffLabel()}`}>
              The {cutoffLabel()} cutoff has passed. Enter a reason below and submit today's morning
              tasks. You can continue editing and re-submit them later today.
            </Callout>
          )}
          {morningLocked && !lateSubmissionAllowed && (
            <Callout tone="danger" icon={FiLock} title={`Morning submission cutoff: ${cutoffLabel()}`}>
              The {cutoffLabel()} cutoff has passed. A new morning plan cannot be created today.
            </Callout>
          )}
        </>
      )}

      {loading ? (
        <LoadingSpinner label="Loading..." />
      ) : loadError ? (
        <div className="mt-card">
          <ErrorState message={loadError} onRetry={() => loadDay(date)} />
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Submitted / approved / past-date messages */}
          {submittedButEditable && (
            <Callout tone="success" icon={FiCheckCircle}>
              Morning update submitted for review. You can still edit tasks or add more. After{' '}
              {cutoffLabel()}, changes require a late-submission reason.
            </Callout>
          )}

          {(approvedButEditable || reopenedForEdit) && (
            <Callout tone="warn" icon={FiCheckCircle}>
              {approvedButEditable
                ? 'This morning plan was already approved. Editing and resubmitting sends it back for review.'
                : 'Evening tasks were already submitted. Editing this plan sends it back for review.'}
            </Callout>
          )}

          {isPastDate(date) && (
            <Callout tone="muted" icon={FiLock} title="Morning update locked">
              Morning task entry is locked for past dates.
            </Callout>
          )}

          {/* Task list header */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-navy-700">
              Total Planned Tasks: <span className="text-navy-900 font-semibold">{totalTasks}</span>
            </p>

            <button
              type="button"
              disabled={saving || !canEditTasks}
              onClick={() => append(emptyTask())}
              className="mt-btn-ghost"
            >
              <FiPlus className="h-4 w-4" /> Add Task
            </button>
          </div>

          {/* Tasks */}
          {fields.map((field, idx) => {
            const hint = hoursHint(watchedTasks?.[idx]?.estimatedTimeHours);

            return (
              <div key={field.id} className="mt-card mt-rise p-4 space-y-3" style={{ animationDelay: `${Math.min(idx, 5) * 40}ms` }}>
                <input type="hidden" {...register(`tasks.${idx}._id`)} />

                <div className="flex items-center justify-between">
                  <span className="mt-num">Task {idx + 1}</span>

                  {fields.length > 1 && (
                    <button
                      type="button"
                      disabled={!canEditTasks || saving}
                      onClick={() => remove(idx)}
                      className="mt-remove"
                      aria-label={`Remove task ${idx + 1}`}
                      title="Remove task"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                  <div className="sm:col-span-3">
                    <label htmlFor={`mt-title-${idx}`} className="mt-label">Task title</label>
                    <input
                      id={`mt-title-${idx}`}
                      readOnly={readOnly}
                      className="mt-input"
                      placeholder="e.g. Develop login API"
                      {...register(`tasks.${idx}.title`)}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label htmlFor={`mt-priority-${idx}`} className="mt-label">Priority</label>
                    <select
                      id={`mt-priority-${idx}`}
                      disabled={readOnly}
                      className="mt-input"
                      {...register(`tasks.${idx}.priority`)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor={`mt-hours-${idx}`} className="mt-label">
                      Estimated time {hint && <span className="font-normal text-navy-400">({hint})</span>}
                    </label>
                    <div className="relative">
                      <input
                        id={`mt-hours-${idx}`}
                        type="number"
                        min="0.25"
                        max="24"
                        step="0.25"
                        readOnly={readOnly}
                        className="mt-input pr-12"
                        placeholder="Hours"
                        {...register(`tasks.${idx}.estimatedTimeHours`)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-navy-400 pointer-events-none">
                        hrs
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor={`mt-desc-${idx}`} className="mt-label">Description (optional)</label>
                    <input
                      id={`mt-desc-${idx}`}
                      readOnly={readOnly}
                      className="mt-input"
                      placeholder="What will you do?"
                      {...register(`tasks.${idx}.description`)}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label htmlFor={`mt-due-${idx}`} className="mt-label">Due by</label>
                    <input
                      id={`mt-due-${idx}`}
                      readOnly={readOnly}
                      className="mt-input"
                      placeholder="e.g. 5 PM"
                      {...register(`tasks.${idx}.expectedCompletion`)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor={`mt-remarks-${idx}`} className="mt-label">Remarks (optional)</label>
                    <input
                      id={`mt-remarks-${idx}`}
                      readOnly={readOnly}
                      className="mt-input"
                      placeholder="Anything to note"
                      {...register(`tasks.${idx}.remarks`)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Overall remarks */}
          <div className="mt-card p-4">
            <label htmlFor="mt-overall" className="mt-label">Overall remarks (optional)</label>
            <textarea
              id="mt-overall"
              rows={2}
              readOnly={readOnly}
              className="mt-input"
              placeholder="Overall remarks for today's plan"
              {...register('remarks')}
            />
          </div>

          {/* Late submission */}
          {lateSubmissionAllowed && (
            <div className="mt-card p-5 border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <span className="h-9 w-9 shrink-0 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <FiFlag className="h-5 w-5" />
                </span>

                <div className="flex-1 min-w-0">
                  <label htmlFor="mt-late" className="block text-sm font-semibold text-amber-900 mb-1">
                    Reason for Late Submission <span className="text-red-600">*</span>
                  </label>

                  <p className="text-xs text-amber-800 mb-2">
                    The {cutoffLabel()} deadline has passed. Enter a reason before submitting the morning
                    plan. You can reuse the reason when editing and re-submitting today's tasks.
                  </p>

                  <textarea
                    id="mt-late"
                    rows={3}
                    className="mt-input bg-white"
                    style={displayedLateReason ? { borderColor: '#4ade80' } : undefined}
                    placeholder="Example: Late start due to unexpected internet connectivity issue."
                    {...register('lateSubmissionReason')}
                  />

                  {displayedLateReason ? (
                    <div className="mt-3 rounded-xl border border-green-300 bg-green-50 p-3 flex items-start gap-2">
                      <FiCheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-green-800">
                          Your reason for late submission has been saved.
                        </p>
                        <p className="text-sm text-green-800 mt-1 break-words">{displayedLateReason}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-red-600 mt-1">Reason is required for late submission.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No plan yet and the cutoff has passed */}
          {isToday(date) && morningLocked && !morningAlreadySubmitted && (
            <Callout tone="info" icon={FiAlertCircle} title="Late morning update">
              No morning plan has been submitted yet. Enter your reason above and submit today's tasks.
              After the late submission is accepted, you can continue editing and re-submit the tasks
              during the day.
            </Callout>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              disabled={saving || !canSaveDraft}
              onClick={handleSubmit((values) => onSave(values, false))}
              className="mt-btn-ghost"
            >
              <FiSave className="h-4 w-4" /> Save Draft
            </button>

            <button
              type="button"
              disabled={
                saving ||
                totalTasks === 0 ||
                !canEditTasks ||
                (morningLocked &&
                  (!lateSubmissionAllowed ||
                    !String(
                      lateSubmissionReason || savedLateReason || getStoredLateReason(date) || ''
                    ).trim()))
              }
              onClick={handleSubmit((values) => onSave(values, true))}
              className="mt-btn"
            >
              <FiSend className="h-4 w-4" />
              {saving
                ? 'Saving...'
                : lateSubmissionAllowed
                  ? 'Submit Late Morning Update'
                  : existingReport
                    ? 'Update Submission'
                    : 'Submit Morning Update'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}