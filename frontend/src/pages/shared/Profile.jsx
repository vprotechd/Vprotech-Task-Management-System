import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FiUpload, FiUser, FiMail, FiPhone, FiBriefcase, FiHash, FiShield, FiGrid, FiLock, FiSave } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import useAuth from '../../hooks/useAuth';
import { updateUser } from '../../store/authSlice';
import { roleLabel, resolveAssetUrl } from '../../utils/format';

/* Scoped styles (prefixed "pf-") so nothing clashes with your global CSS. */
const styles = `
.pf-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.pf-hover:hover {
  transform: translateY(-3px); border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05), 0 18px 32px -18px rgba(14,100,200,.35);
}
.pf-rise { animation: pf-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes pf-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.pf-tile { transition: transform .25s ease; }
.pf-hover:hover .pf-tile { transform: scale(1.08) rotate(-4deg); }

.pf-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.pf-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}
.pf-avatar {
  height: 5.5rem; width: 5.5rem; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1.7rem; font-weight: 700; letter-spacing: .02em;
  box-shadow: 0 0 0 3px rgba(255,255,255,.25), 0 12px 24px -10px rgba(0,0,0,.5);
}
.pf-pill {
  display: inline-flex; align-items: center; padding: .15rem .6rem; border-radius: 999px;
  background: rgba(255,255,255,.14); color: #e2e8f0; font-size: .72rem; font-weight: 600;
}
.pf-upload {
  display: inline-flex; align-items: center; gap: .5rem; cursor: pointer;
  background: #fff; color: #0f1b33; font-weight: 600; font-size: .82rem;
  padding: .5rem .9rem; border-radius: .7rem; box-shadow: 0 10px 20px -10px rgba(0,0,0,.45);
  transition: transform .2s ease, box-shadow .2s ease, opacity .2s;
}
.pf-upload:hover { transform: translateY(-2px); box-shadow: 0 14px 24px -10px rgba(0,0,0,.5); }
.pf-upload:focus-within { outline: 2px solid #38bdf8; outline-offset: 2px; }
.pf-upload[aria-disabled="true"] { opacity: .7; cursor: progress; }

.pf-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }
.pf-field { position: relative; }
.pf-icon { position: absolute; left: .85rem; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
.pf-input {
  width: 100%; height: 2.8rem; padding: 0 .85rem 0 2.5rem; border: 1.5px solid #dbe2ee; border-radius: .75rem;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.pf-input:hover:not(:disabled) { border-color: #b8c4da; }
.pf-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.pf-input:disabled { background: #eef2f8; color: #64748b; cursor: not-allowed; }
.pf-input[aria-invalid="true"] { border-color: #f87171; }

.pf-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.8rem; padding: 0 1.4rem;
  border-radius: .75rem; font-size: .9rem; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #4f46e5); box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
  transition: transform .15s, box-shadow .2s, filter .2s;
}
.pf-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgba(79,70,229,.95); }
.pf-btn:active:not(:disabled) { transform: scale(.99); }
.pf-btn:disabled { cursor: not-allowed; filter: saturate(.6) brightness(.95); }
.pf-btn:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  .pf-rise { animation: none; }
  .pf-card, .pf-tile, .pf-upload, .pf-input, .pf-btn { transition: none; }
}
`;

const TONES = {
  blue: { tile: 'linear-gradient(135deg,#38bdf8,#2563eb)', glow: 'rgba(37,99,235,.35)' },
  indigo: { tile: 'linear-gradient(135deg,#818cf8,#4f46e5)', glow: 'rgba(79,70,229,.35)' },
  teal: { tile: 'linear-gradient(135deg,#2dd4bf,#0d9488)', glow: 'rgba(13,148,136,.35)' },
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

function InfoCard({ icon: Icon, label, value, tone = 'blue', delay = 0 }) {
  const t = TONES[tone] || TONES.blue;
  return (
    <div className="pf-card pf-hover pf-rise p-4 flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="pf-tile h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
        style={{ background: t.tile, boxShadow: `0 10px 18px -8px ${t.glow}` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400 truncate">{label}</p>
        <p className="text-base font-semibold text-navy-800 leading-tight truncate">{value || '-'}</p>
      </div>
    </div>
  );
}

function Field({ id, label, icon: Icon, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="pf-label">{label}</label>
      <div className="pf-field">
        <Icon className="pf-icon h-4 w-4" />
        {children}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      designation: user?.designation || '',
    },
  });

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const { data: res } = await axiosClient.patch(`/users/${user._id}`, values);
      dispatch(updateUser(res.data.user));
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('profileImage', file);
    try {
      // IMPORTANT: don't set a Content-Type header manually here. The
      // axios instance's default header ('application/json') would
      // otherwise apply, and even 'multipart/form-data' set explicitly
      // breaks the upload because it omits the multipart boundary the
      // browser normally attaches. Passing FormData without a
      // Content-Type override lets the browser set the header itself
      // (including the boundary), which is what the backend's multer
      // parser needs to read the file. This was why photo uploads
      // failed / silently didn't update.
      const { data: res } = await axiosClient.post('/uploads/profile-image', formData, {
        headers: { 'Content-Type': undefined },
      });
      dispatch(updateUser({ profileImage: res.data.profileImage }));
      toast.success('Profile image updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      // Allow re-selecting the same file (e.g. after a failed upload)
      // by resetting the input - without this, choosing the identical
      // file twice in a row doesn't fire onChange the second time.
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <style>{styles}</style>

      {/* Banner with photo */}
      <div className="pf-hero pf-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="pf-avatar" style={{ background: user?.profileImage ? '#16305c' : gradientFor(user?.fullName) }}>
            {user?.profileImage ? (
              <img src={resolveAssetUrl(user.profileImage)} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              initials(user?.fullName)
            )}
          </div>

          <div className="flex-1 min-w-[14rem]">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{user?.fullName}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="pf-pill">{roleLabel(user?.role)}</span>
              {user?.employeeCode && <span className="pf-pill">{user.employeeCode}</span>}
            </div>
            <div className="mt-3">
              <label className="pf-upload" aria-disabled={uploading}>
                <FiUpload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Change Photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleUpload} disabled={uploading} />
              </label>
              <span className="ml-3 text-xs text-slate-300">JPG, PNG or WebP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoCard icon={FiHash} label="Employee ID" value={user?.employeeCode} tone="blue" delay={40} />
        <InfoCard icon={FiShield} label="Role" value={roleLabel(user?.role)} tone="indigo" delay={80} />
        <InfoCard icon={FiGrid} label="Department" value={user?.department?.name} tone="teal" delay={120} />
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit(onSubmit)} className="pf-card pf-rise p-6 space-y-4" style={{ animationDelay: '160ms' }} noValidate>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-navy-500">
            <FiUser className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-800">Edit Profile</h3>
            <p className="text-xs text-navy-400 mt-0.5">Update your name, phone and designation</p>
          </div>
        </div>

        <Field id="pf-name" label="Full Name" icon={FiUser} error={errors.fullName && 'Required'}>
          <input
            id="pf-name"
            className="pf-input"
            aria-invalid={errors.fullName ? 'true' : 'false'}
            aria-describedby={errors.fullName ? 'pf-name-error' : undefined}
            {...register('fullName', { required: true })}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="pf-email" label="Email" icon={FiLock}>
            <input id="pf-email" className="pf-input" value={user?.email || ''} disabled readOnly />
          </Field>
          <Field id="pf-phone" label="Phone" icon={FiPhone}>
            <input id="pf-phone" className="pf-input" {...register('phone')} />
          </Field>
        </div>

        <Field id="pf-designation" label="Designation" icon={FiBriefcase}>
          <input id="pf-designation" className="pf-input" {...register('designation')} />
        </Field>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-navy-400 flex items-center gap-1.5">
            <FiMail className="h-3.5 w-3.5" /> Email can't be changed here.
          </p>
          <button type="submit" disabled={saving} className="pf-btn">
            <FiSave className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}