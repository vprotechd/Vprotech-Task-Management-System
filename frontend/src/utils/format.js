export function toISODate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

export function todayISO() {
  return toISODate(new Date());
}

export function tomorrowISO() {
  const date = new Date(`${todayISO()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function formatDateLabel(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export function minutesToHours(mins) {
  if (mins === undefined || mins === null) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
}

export function minutesToDecimalHours(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Number((value / 60).toFixed(2));
}

export function hoursToMinutes(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 60);
}

export function roleLabel(role) {
  return { admin: 'Administrator', team_lead: 'Team Lead', employee: 'Employee' }[role] || role;
}

// The backend returns profile images as a relative path (e.g. "/uploads/xyz.jpg")
// which must be resolved against the API's origin, not the frontend's own origin,
// otherwise the <img> tag 404s whenever the frontend and backend are on different
// domains (the normal case in production).
export function resolveAssetUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const apiOrigin = apiUrl.replace(/\/api\/?$/, '');
  return `${apiOrigin}${path}`;
}
