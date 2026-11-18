import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiSend, FiVolume2, FiUsers, FiUserCheck, FiUser, FiCalendar, FiEdit3 } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

/* Scoped styles (prefixed "aa-") so nothing clashes with your global CSS. */
const styles = `
.aa-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.aa-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.aa-rise { animation: aa-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes aa-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.aa-tile { transition: transform .25s ease; }
.aa-hover:hover .aa-tile { transform: scale(1.08) rotate(-4deg); }

.aa-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.aa-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}

.aa-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }
.aa-input {
  width: 100%; padding: 0 .85rem; border: 1.5px solid #dbe2ee; border-radius: .75rem;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.aa-input:not(textarea) { height: 2.8rem; }
textarea.aa-input { padding-top: .7rem; padding-bottom: .7rem; resize: vertical; min-height: 7rem; line-height: 1.5; }
.aa-input:hover { border-color: #b8c4da; }
.aa-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.aa-input::placeholder { color: #94a3b8; }
.aa-input[aria-invalid="true"] { border-color: #f87171; }

/* Audience picker cards */
.aa-aud {
  display: flex; align-items: center; gap: .65rem; padding: .7rem .85rem; cursor: pointer;
  border: 1.5px solid #dbe2ee; border-radius: .8rem; background: #fff;
  transition: border-color .2s, background .2s, box-shadow .2s;
}
.aa-aud:hover { border-color: #b8c4da; }
.aa-aud[data-checked="true"] { border-color: #0ea5e9; background: #f0f9ff; box-shadow: 0 0 0 3px rgba(14,165,233,.14); }
.aa-aud:focus-within { outline: 2px solid #38bdf8; outline-offset: 2px; }

.aa-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.8rem; padding: 0 1.4rem;
  border-radius: .75rem; font-size: .9rem; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #4f46e5); box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
  transition: transform .15s, box-shadow .2s, filter .2s;
}
.aa-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgba(79,70,229,.95); }
.aa-btn:active:not(:disabled) { transform: scale(.99); }
.aa-btn:disabled { cursor: not-allowed; filter: saturate(.6) brightness(.95); }
.aa-btn:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }

.aa-item { transition: background .15s ease; }
.aa-item:hover { background: #f8fafc; }
.aa-chip {
  display: inline-flex; align-items: center; gap: .3rem; padding: .15rem .55rem; border-radius: 999px;
  background: #eef2f8; color: #334155; font-size: .72rem; font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .aa-rise { animation: none; }
  .aa-card, .aa-tile, .aa-input, .aa-aud, .aa-btn, .aa-item { transition: none; }
}
`;

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone (Team Leads + Employees)', short: 'Everyone', icon: FiUsers },
  { value: 'team_lead', label: 'Team Leads only', short: 'Team Leads', icon: FiUserCheck },
  { value: 'employee', label: 'Employees only', short: 'Employees', icon: FiUser },
];

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
  teal: { tile: 'linear-gradient(135deg,#2dd4bf,#0d9488)', glow: 'rgba(13,148,136,.35)' },
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

function StatCard({ icon: Icon, label, value, text, tone = 'blue', delay = 0 }) {
  const shown = useCountUp(value);
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="aa-card aa-hover aa-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="aa-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{ background: t.tile, boxShadow: `0 10px 18px -8px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        {text !== undefined ? (
          <p className="text-base font-semibold text-navy-800 leading-tight truncate">{text}</p>
        ) : (
          <p className="text-2xl font-semibold text-navy-800 leading-tight tabular-nums">{shown}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { title: '', message: '', audience: 'all' },
  });

  const audience = watch('audience');
  const messageLength = (watch('message') || '').length;

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await axiosClient.get('/notifications/announcements', { params: { limit: 50 } });
      setAnnouncements(res.data.announcements);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (values) => {
    try {
      await axiosClient.post('/notifications/announcement', values);
      toast.success('Announcement sent.');
      reset({ title: '', message: '', audience: 'all' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send announcement.');
    }
  };

  const stats = useMemo(() => {
    const recipients = announcements.reduce((sum, a) => sum + (Number(a.recipientCount) || 0), 0);
    const last = announcements[0]?.createdAt
      ? new Date(announcements[0].createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : 'None yet';
    return { sent: announcements.length, recipients, last };
  }, [announcements]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="aa-hero aa-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Announcements</h2>
          <p className="text-sm text-slate-300 mt-1">
            Send a message to team leads, employees or everyone. It appears in their notifications.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FiVolume2} label="Announcements Sent" value={stats.sent} tone="blue" delay={40} />
        <StatCard icon={FiUsers} label="Total Recipients" value={stats.recipients} tone="indigo" delay={80} />
        <StatCard icon={FiCalendar} label="Last Sent" text={stats.last} tone="teal" delay={120} />
      </div>

      {/* Compose */}
      <form onSubmit={handleSubmit(onSubmit)} className="aa-card aa-rise p-6 space-y-4" style={{ animationDelay: '160ms' }} noValidate>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-navy-500">
            <FiEdit3 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-800">New Announcement</h3>
            <p className="text-xs text-navy-400 mt-0.5">Write your message and choose who receives it</p>
          </div>
        </div>

        <div>
          <label htmlFor="aa-title" className="aa-label">Title</label>
          <input
            id="aa-title"
            className="aa-input"
            placeholder="e.g. Office closed on Friday"
            aria-invalid={errors.title ? 'true' : 'false'}
            aria-describedby={errors.title ? 'aa-title-error' : undefined}
            {...register('title', { required: true })}
          />
          {errors.title && <p id="aa-title-error" role="alert" className="text-xs text-red-600 mt-1">Required</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="aa-message" className="aa-label">Message</label>
            <span className="text-[11px] text-navy-400 tabular-nums mb-1">{messageLength} characters</span>
          </div>
          <textarea
            id="aa-message"
            rows={4}
            className="aa-input"
            placeholder="Write the announcement..."
            aria-invalid={errors.message ? 'true' : 'false'}
            aria-describedby={errors.message ? 'aa-message-error' : undefined}
            {...register('message', { required: true })}
          />
          {errors.message && <p id="aa-message-error" role="alert" className="text-xs text-red-600 mt-1">Required</p>}
        </div>

        <fieldset>
          <legend className="aa-label">Send to</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {AUDIENCE_OPTIONS.map((opt) => (
              <label key={opt.value} className="aa-aud" data-checked={audience === opt.value}>
                <input type="radio" value={opt.value} className="sr-only" {...register('audience')} />
                <opt.icon className="h-4 w-4 shrink-0" style={{ color: audience === opt.value ? '#0284c7' : '#94a3b8' }} />
                <span className="text-sm font-medium text-navy-700">{opt.short}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-navy-400 mt-2">{AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label}</p>
        </fieldset>

        <div className="flex justify-end pt-1">
          <button type="submit" disabled={isSubmitting} className="aa-btn">
            <FiSend className="h-4 w-4" /> {isSubmitting ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      </form>

      {/* Past announcements */}
      <div className="aa-card aa-rise overflow-hidden" style={{ animationDelay: '220ms' }}>
        <div className="flex items-start justify-between gap-3 p-5 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-navy-500">
              <FiVolume2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-navy-800">Past Announcements</h3>
              <p className="text-xs text-navy-400 mt-0.5">Most recent first</p>
            </div>
          </div>
          {!loading && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy-600 tabular-nums">
              {announcements.length}
            </span>
          )}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading announcements..." />
        ) : announcements.length === 0 ? (
          <EmptyState icon={FiVolume2} title="No announcements yet" description="Announcements you send will show up here." />
        ) : (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {announcements.map((a) => {
              const audienceMeta = AUDIENCE_OPTIONS.find((o) => o.value === a.audience);
              return (
                <li key={a._id} className="aa-item p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-navy-800">{a.title}</p>
                    <span className="text-xs text-navy-400 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-navy-600 mt-1.5 whitespace-pre-line">{a.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="aa-chip">
                      {audienceMeta ? <audienceMeta.icon className="h-3 w-3" /> : <FiUsers className="h-3 w-3" />}
                      {audienceMeta?.label || a.audience}
                    </span>
                    <span className="aa-chip">
                      {a.recipientCount} recipient{a.recipientCount === 1 ? '' : 's'}
                    </span>
                    {a.createdBy?.fullName && <span className="text-xs text-navy-400">by {a.createdBy.fullName}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}