import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiBell, FiCheck, FiVolume2, FiInbox, FiMail } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

/* Scoped styles (prefixed "nt-") so nothing clashes with your global CSS. */
const styles = `
.nt-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.nt-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.nt-rise { animation: nt-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes nt-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.nt-tile { transition: transform .25s ease; }
.nt-hover:hover .nt-tile { transform: scale(1.08) rotate(-4deg); }

.nt-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.nt-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.nt-hero-btn {
  display: inline-flex; align-items: center; gap: .5rem;
  background: #fff; color: #0f1b33; font-weight: 600; font-size: .875rem;
  padding: .6rem 1rem; border-radius: .75rem; box-shadow: 0 10px 20px -10px rgba(0,0,0,.45);
  transition: transform .2s ease, box-shadow .2s ease;
}
.nt-hero-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 24px -10px rgba(0,0,0,.5); }
.nt-hero-btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.nt-tab {
  display: inline-flex; align-items: center; gap: .4rem; padding: .4rem .85rem; border-radius: 999px;
  font-size: .8rem; font-weight: 500; color: #64748b; transition: all .15s ease;
}
.nt-tab:hover { color: #0f1b33; background: #eef3fb; }
.nt-tab[aria-pressed="true"] { color: #fff; background: #16305c; }
.nt-tab:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

.nt-item { transition: background .15s ease; border-left: 3px solid transparent; }
.nt-item:hover { background: #f8fafc; }
.nt-item[data-unread="true"] { background: #f1f7ff; border-left-color: #38bdf8; }
.nt-item[data-unread="true"]:hover { background: #e8f2ff; }

.nt-read-btn {
  display: inline-flex; align-items: center; gap: .3rem; white-space: nowrap;
  font-size: .75rem; font-weight: 600; color: #475569; padding: .35rem .65rem; border-radius: .6rem;
  border: 1.5px solid #dbe2ee; background: #fff; transition: background .15s, border-color .15s, color .15s;
}
.nt-read-btn:hover { background: #f1f5f9; border-color: #b8c4da; color: #0f1b33; }
.nt-read-btn:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .nt-rise { animation: none; }
  .nt-card, .nt-tile, .nt-hero-btn, .nt-tab, .nt-item, .nt-read-btn { transition: none; }
}
`;

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
  amber: { tile: 'linear-gradient(135deg,#fbbf24,#d97706)', glow: 'rgba(217,119,6,.35)' },
  slate: { tile: 'linear-gradient(135deg,#cbd5e1,#94a3b8)', glow: 'rgba(100,116,139,.25)' },
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'announcement', label: 'Announcements' },
];

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
    <div className="nt-card nt-hover nt-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="nt-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
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

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await axiosClient.get('/notifications', { params: { limit: 50 } });
      setNotifications(res.data.notifications);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (_e) {
      toast.error('Could not update notification.');
    }
  };

  const markAllRead = async () => {
    try {
      await axiosClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (_e) {
      toast.error('Could not update notifications.');
    }
  };

  const counts = useMemo(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    const announcements = notifications.filter((n) => n.type === 'announcement').length;
    return { total: notifications.length, unread, announcements };
  }, [notifications]);

  const visible = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.isRead);
    if (filter === 'announcement') return notifications.filter((n) => n.type === 'announcement');
    return notifications;
  }, [notifications, filter]);

  if (loading) return <LoadingSpinner full label="Loading notifications..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="nt-hero nt-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Notifications</h2>
            <p className="text-sm text-slate-300 mt-1">
              {counts.unread > 0
                ? `You have ${counts.unread} unread ${counts.unread === 1 ? 'notification' : 'notifications'}.`
                : "You're all caught up."}
            </p>
          </div>
          {counts.unread > 0 && (
            <button onClick={markAllRead} className="nt-hero-btn">
              <FiCheck className="h-4 w-4" /> Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FiInbox} label="Total" value={counts.total} tone="blue" delay={40} />
        <StatCard icon={FiMail} label="Unread" value={counts.unread} tone="amber" delay={80} />
        <StatCard icon={FiVolume2} label="Announcements" value={counts.announcements} tone="indigo" delay={120} />
      </div>

      {notifications.length === 0 ? (
        <div className="nt-card nt-rise" style={{ animationDelay: '160ms' }}>
          <EmptyState icon={FiBell} title="No notifications yet" description="You'll see approvals, returns, and reminders here." />
        </div>
      ) : (
        <div className="nt-card nt-rise overflow-hidden" style={{ animationDelay: '160ms' }}>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1 p-3 border-b border-slate-100" role="group" aria-label="Filter notifications">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" className="nt-tab" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="py-12 text-center px-4">
              <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center">
                <FiBell className="h-6 w-6 text-navy-300" />
              </div>
              <p className="text-sm font-medium text-navy-600">
                {filter === 'unread' ? 'No unread notifications' : 'No announcements'}
              </p>
              <p className="text-xs text-navy-400 mt-1">Nothing to show for this filter.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visible.map((n) => {
                const isAnnouncement = n.type === 'announcement';
                const tone = !n.isRead ? (isAnnouncement ? TONES.indigo : TONES.blue) : TONES.slate;
                const Icon = isAnnouncement ? FiVolume2 : FiBell;
                return (
                  <li key={n._id} className="nt-item flex items-start justify-between gap-3 p-4" data-unread={!n.isRead}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-white"
                        style={{ background: tone.tile, boxShadow: n.isRead ? 'none' : `0 8px 14px -8px ${tone.glow}` }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        {isAnnouncement && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 mb-0.5">
                            Announcement
                          </span>
                        )}
                        <p className={`text-sm ${n.isRead ? 'text-navy-600' : 'text-navy-800 font-medium'}`}>{n.message}</p>
                        <p className="text-xs text-navy-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {!n.isRead && (
                      <button onClick={() => markRead(n._id)} className="nt-read-btn" aria-label="Mark this notification as read">
                        <FiCheck className="h-3.5 w-3.5" /> Mark read
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}