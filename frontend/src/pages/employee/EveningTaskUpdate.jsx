import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  FiSave,
  FiSend,
  FiSunrise,
  FiCheckCircle,
  FiEdit2,
  FiClipboard,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { todayISO, minutesToHours } from '../../utils/format';

/* Scoped styles (prefixed "et-") so nothing clashes with your global CSS. */
const styles = `
.et-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.et-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.et-rise { animation: et-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes et-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.et-tile { transition: transform .25s ease; }
.et-hover:hover .et-tile { transform: scale(1.08) rotate(-4deg); }

.et-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.et-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.et-date {
  height: 2.6rem; padding: 0 .85rem; border-radius: .75rem; border: 0; outline: none;
  background: #fff; color: #0f1b33; font-weight: 600; font-size: .875rem;
  box-shadow: 0 10px 20px -10px rgba(0,0,0,.45);
}
.et-date:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.et-label { display: block; margin-bottom: .25rem; font-size: .72rem; font-weight: 600; color: #475569; }
.et-input {
  width: 100%; padding: 0 .8rem; border: 1.5px solid #dbe2ee; border-radius: .7rem;
  background: #f8fafc; color: #0f1b33; font-size: .875rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.et-input:not(textarea) { height: 2.5rem; }
textarea.et-input { padding-top: .6rem; padding-bottom: .6rem; line-height: 1.5; resize: vertical; }
.et-input:hover { border-color: #b8c4da; }
.et-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.et-input::placeholder { color: #94a3b8; }

.et-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.7rem; padding: 0 1.3rem;
  border-radius: .75rem; font-size: .875rem; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #4f46e5); box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
  transition: transform .15s, box-shadow .2s, filter .2s;
}
.et-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgba(79,70,229,.95); }
.et-btn:active:not(:disabled) { transform: scale(.99); }
.et-btn:disabled { cursor: not-allowed; filter: saturate(.5); opacity: .6; }
.et-btn:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }
.et-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.7rem; padding: 0 1.2rem;
  border-radius: .75rem; font-size: .875rem; font-weight: 600; color: #475569; background: #fff; border: 1.5px solid #dbe2ee;
  transition: background .2s, border-color .2s;
}
.et-btn-ghost:hover:not(:disabled) { background: #f1f5f9; border-color: #b8c4da; }
.et-btn-ghost:disabled { cursor: not-allowed; opacity: .5; }
.et-btn-ghost:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.et-pop { animation: et-pop .6s cubic-bezier(.2,.9,.3,1.3) both; }
@keyframes et-pop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .et-rise, .et-pop { animation: none; }
  .et-card, .et-tile, .et-input, .et-btn, .et-btn-ghost { transition: none; }
}
`;

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
  teal: { tile: 'linear-gradient(135deg,#2dd4bf,#0d9488)', glow: 'rgba(13,148,136,.35)' },
  green: { tile: 'linear-gradient(135deg,#4ade80,#16a34a)', glow: 'rgba(22,163,74,.35)' },
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

function StatCard({ icon: Icon, label, value, suffix = '', text, tone = 'blue', delay = 0 }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="et-card et-hover et-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="et-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{ background: t.tile, boxShadow: `0 10px 18px -8px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        {text !== undefined ? (
          <p className="text-lg font-semibold text-navy-800 leading-tight truncate">{text}</p>
        ) : (
          <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">
            {shown}
            {suffix}
          </p>
        )}
      </div>
    </div>
  );
}

/* Coloured callout used for status messages */
const CALLOUT_STYLES = {
  success: { box: 'bg-green-50 border-green-200 text-green-900', icon: 'bg-green-100 text-green-600' },
  warn: { box: 'bg-amber-50 border-amber-200 text-amber-900', icon: 'bg-amber-100 text-amber-600' },
};

function Callout({ tone = 'success', children }) {
  const s = CALLOUT_STYLES[tone];
  return (
    <div className={`et-rise rounded-2xl border p-4 flex items-center gap-3 text-sm ${s.box}`}>
      <span className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${s.icon}`}>
        <FiCheckCircle className="h-5 w-5" />
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const STATUS_OPTIONS = ['Completed', 'Partially Completed', 'Not Completed'];

const STATUS_DOT = {
  Completed: '#22c55e',
  'Partially Completed': '#f59e0b',
  'Not Completed': '#ef4444',
};

// Keeps completion % and status roughly in sync without fighting the user:
// picking "Completed" jumps % to 100, "Not Completed" to 0; typing a %
// manually is always respected as-is.
function defaultPercentForStatus(status) {
  if (status === 'Completed') return 100;
  if (status === 'Not Completed') return 0;
  return 50;
}

/* Plain "2h 30m" style text for the summed time spent. */
function formatMinutes(total) {
  const minutes = Math.round(Number(total) || 0);
  if (minutes <= 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function EveningTaskUpdate() {
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [report, setReport] = useState(null);
  const [saving, setSaving] = useState(false);

  // When today's evening update is already submitted (or approved),
  // default to showing the success summary instead of the form -
  // editTasks flips back to the editable form, since the backend keeps
  // accepting edits at any status now (an edit after approval sends the
  // report back to evening_submitted for re-review).
  const [editTasks, setEditTasks] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm({ defaultValues: { entries: [], remarks: '' } });

  const loadDay = useCallback(async (d) => {
    setLoading(true);
    setLoadError(null);
    setEditTasks(false);
    try {
      const { data: res } = await axiosClient.get('/tasks/day', { params: { date: d } });
      const r = res.data.report;
      setReport(r);

      if (r && r.morning && r.morning.tasks.length > 0) {
        const eveningByRef = new Map((r.evening?.tasks || []).map((e) => [String(e.taskRef), e]));
        reset({
          entries: r.morning.tasks.map((t) => {
            const existing = eveningByRef.get(String(t._id));
            return {
              taskRef: t._id,
              title: t.title,
              estimatedTimeMinutes: t.estimatedTimeMinutes,
              status: existing?.status || 'Completed',
              completionPercentage: existing ? existing.completionPercentage : 100,
              actualTimeSpentMinutes: existing ? existing.actualTimeSpentMinutes : t.estimatedTimeMinutes,
              remarks: existing?.remarks || '',
            };
          }),
          remarks: r.evening?.remarks || '',
        });
      } else {
        reset({ entries: [], remarks: '' });
      }
    } catch (err) {
      // IMPORTANT: this sets loadError, NOT just a toast. `report` stays
      // null on failure same as it would for a genuine "no plan yet" day -
      // loadError is what lets the render below tell those two cases apart
      // instead of showing a misleading "go plan your day" message for an
      // actual network/auth/server failure.
      const message = err.response?.data?.message || 'Failed to load tasks for this date.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => { loadDay(date); }, [date, loadDay]);

  const entries = watch('entries') || [];
  const noMorningPlan = !loadError && (!report || !report.morning || report.morning.tasks.length === 0);

  // Editable at every status now (see taskController.submitEveningTasks) -
  // editing after 'approved' sends the report back to evening_submitted
  // for a fresh review.
  const isApproved = report?.status === 'approved';
  const isSubmitted = report?.status === 'evening_submitted';
  const showSuccessSummary = (isSubmitted || isApproved) && !editTasks;

  const onSave = async (values, submit) => {
    setSaving(true);
    try {
      const { data: res } = await axiosClient.post('/tasks/evening', {
        date,
        tasks: values.entries.map((e) => ({
          taskRef: e.taskRef,
          status: e.status,
          completionPercentage: Number(e.completionPercentage),
          actualTimeSpentMinutes: Number(e.actualTimeSpentMinutes),
          remarks: e.remarks,
        })),
        remarks: values.remarks,
        submit,
      });
      setReport(res.data.report);
      if (submit) {
        setEditTasks(false);
        toast.success("Today's evening task submitted successfully!");
      } else {
        toast.success('Draft saved.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save evening update.');
    } finally {
      setSaving(false);
    }
  };

  /* Numbers for the stat cards, from the form values */
  const completedCount = entries.filter((e) => e?.status === 'Completed').length;
  const avgCompletion = entries.length
    ? Math.round(entries.reduce((s, e) => s + (Number(e?.completionPercentage) || 0), 0) / entries.length)
    : 0;
  const totalSpent = entries.reduce((s, e) => s + (Number(e?.actualTimeSpentMinutes) || 0), 0);

  const prettyDate = (() => {
    const d = new Date(`${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const showStats = !loading && !loadError && !noMorningPlan && entries.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="et-hero et-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Evening Task Update</h2>
            <p className="text-sm text-slate-300 mt-1">{prettyDate}</p>
            <p className="text-xs text-slate-400 mt-1">Your morning tasks for this date load automatically below.</p>
          </div>
          <div>
            <label htmlFor="et-date" className="sr-only">Date</label>
            <input
              id="et-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="et-date"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FiClipboard} label="Planned Tasks" value={entries.length} tone="blue" delay={40} />
          <StatCard icon={FiCheckCircle} label="Marked Completed" value={completedCount} tone="green" delay={80} />
          <StatCard icon={FiTrendingUp} label="Avg. Completion" value={avgCompletion} suffix="%" tone="teal" delay={120} />
          <StatCard icon={FiClock} label="Time Spent" text={formatMinutes(totalSpent)} tone="indigo" delay={160} />
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading..." />
      ) : loadError ? (
        <div className="et-card"><ErrorState message={loadError} onRetry={() => loadDay(date)} /></div>
      ) : noMorningPlan ? (
        <div className="et-card et-rise">
          <EmptyState
            icon={FiSunrise}
            title="No morning plan found for this date"
            description="Submit a morning update first — evening completion is always linked to that day's planned tasks."
            action={<Link to="/employee/morning-update" className="et-btn">Go to Morning Update</Link>}
          />
        </div>
      ) : showSuccessSummary ? (
        <div className="et-card et-rise p-8">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div
              className="et-pop flex items-center justify-center w-20 h-20 rounded-full mb-5 text-white"
              style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)', boxShadow: '0 16px 28px -12px rgba(22,163,74,.6)' }}
            >
              <FiCheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-semibold text-navy-800 mb-3">
              {isApproved ? 'Evening Update Approved' : 'Evening Task Submitted'}
            </h2>
            <p className="text-navy-500 text-base mb-2">
              {isApproved
                ? "Today's evening update has been reviewed and approved."
                : "Today's evening task has been submitted successfully."}
            </p>
            <p className="text-sm text-navy-400 mb-6">Date: {date}</p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-medium">
                <FiCheckCircle className="w-4 h-4" /> {isApproved ? 'Approved' : 'Evening update submitted'}
              </span>
              <button onClick={() => setEditTasks(true)} className="et-btn-ghost">
                <FiEdit2 className="h-4 w-4" /> Edit / Add More Tasks
              </button>
            </div>
            {isApproved && (
              <p className="text-xs text-amber-600 mt-3">Editing an approved update sends it back for review.</p>
            )}
            <p className="text-xs text-navy-400 mt-4">
              Forgot to plan something? <Link to="/employee/morning-update" className="text-navy-600 underline">Add it to your Morning Update</Link> first, then it'll appear here.
            </p>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {isSubmitted && (
            <Callout tone="success">
              Already submitted — you're editing your submission. Save to update it.
            </Callout>
          )}
          {isApproved && (
            <Callout tone="warn">
              This was already approved. Editing and resubmitting sends it back for review.
            </Callout>
          )}

          {entries.map((entry, idx) => {
            const pct = Math.max(0, Math.min(100, Number(entry?.completionPercentage) || 0));
            const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

            return (
              <div key={entry.taskRef} className="et-card et-rise p-4 space-y-3" style={{ animationDelay: `${Math.min(idx, 5) * 40}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-800 truncate" title={entry.title}>{entry.title}</p>
                    <p className="text-xs text-navy-400 mt-0.5">Planned: {minutesToHours(entry.estimatedTimeMinutes)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_DOT[entry?.status] || '#94a3b8' }} />
                    {entry?.status}
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor, transition: 'width .4s ease' }} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                  <div className="sm:col-span-2">
                    <label htmlFor={`et-status-${idx}`} className="et-label">Status</label>
                    <select
                      id={`et-status-${idx}`}
                      className="et-input"
                      {...register(`entries.${idx}.status`)}
                      onChange={(e) => {
                        setValue(`entries.${idx}.status`, e.target.value);
                        setValue(`entries.${idx}.completionPercentage`, defaultPercentForStatus(e.target.value));
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label htmlFor={`et-pct-${idx}`} className="et-label">Completion %</label>
                    <input
                      id={`et-pct-${idx}`}
                      type="number"
                      min={0}
                      max={100}
                      className="et-input"
                      placeholder="%"
                      {...register(`entries.${idx}.completionPercentage`, { min: 0, max: 100 })}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label htmlFor={`et-min-${idx}`} className="et-label">
                      Minutes spent <span className="font-normal text-navy-400">({minutesToHours(entries[idx]?.actualTimeSpentMinutes)})</span>
                    </label>
                    <input
                      id={`et-min-${idx}`}
                      type="number"
                      min={0}
                      className="et-input"
                      placeholder={`${entry.estimatedTimeMinutes} min plan`}
                      {...register(`entries.${idx}.actualTimeSpentMinutes`, { min: 0 })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor={`et-remarks-${idx}`} className="et-label">Remarks (optional)</label>
                    <input
                      id={`et-remarks-${idx}`}
                      className="et-input"
                      placeholder="Anything to note"
                      {...register(`entries.${idx}.remarks`)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="et-card p-4">
            <label htmlFor="et-overall" className="et-label">Overall remarks (optional)</label>
            <textarea id="et-overall" rows={2} className="et-input" placeholder="Overall remarks for today" {...register('remarks')} />
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <button type="button" disabled={saving} onClick={handleSubmit((v) => onSave(v, false))} className="et-btn-ghost">
              <FiSave className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button type="button" disabled={saving} onClick={handleSubmit((v) => onSave(v, true))} className="et-btn">
              <FiSend className="h-4 w-4" /> {saving ? 'Submitting...' : (report?.status ? 'Update Submission' : 'Submit Evening Update')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}