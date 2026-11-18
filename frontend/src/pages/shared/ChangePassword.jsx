import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiKey, FiShield, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import { logout } from '../../store/authSlice';

/* Scoped styles (prefixed "cp-") so nothing clashes with your global CSS. */
const styles = `
.cp-card {
  background: #fff; border: 1px solid #e6ecf5; border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04), 0 8px 24px -16px rgba(15,27,51,.18);
}
.cp-rise { animation: cp-rise .55s cubic-bezier(.2,.8,.2,1) both; }
@keyframes cp-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.cp-hero {
  background: linear-gradient(135deg, #0f1b33 0%, #16305c 55%, #1d4a8a 100%);
  position: relative; overflow: hidden;
}
.cp-hero::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%, rgba(56,189,248,.28), transparent 60%),
    radial-gradient(360px circle at 0% 100%, rgba(99,102,241,.25), transparent 60%);
}

.cp-label { display: block; margin-bottom: .3rem; font-size: .78rem; font-weight: 600; color: #475569; }
.cp-field { position: relative; }
.cp-input {
  width: 100%; height: 2.8rem; padding: 0 2.7rem 0 2.5rem; border: 1.5px solid #dbe2ee; border-radius: .75rem;
  background: #f8fafc; color: #0f1b33; font-size: .9rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.cp-input:hover { border-color: #b8c4da; }
.cp-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.cp-input[aria-invalid="true"] { border-color: #f87171; }
.cp-input[aria-invalid="true"]:focus { box-shadow: 0 0 0 4px rgba(248,113,113,.18); }
.cp-icon { position: absolute; left: .85rem; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
.cp-eye {
  position: absolute; right: .4rem; top: 50%; transform: translateY(-50%);
  height: 2rem; width: 2rem; display: inline-flex; align-items: center; justify-content: center;
  border-radius: .55rem; color: #64748b; transition: background .15s, color .15s;
}
.cp-eye:hover { background: #e2e8f0; color: #0f1b33; }
.cp-eye:focus-visible { outline: 2px solid #38bdf8; outline-offset: 1px; }

.cp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem; width: 100%; height: 2.9rem;
  border-radius: .75rem; font-size: .9rem; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #0ea5e9, #4f46e5); box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
  transition: transform .15s, box-shadow .2s, filter .2s;
}
.cp-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 26px -12px rgba(79,70,229,.95); }
.cp-btn:active:not(:disabled) { transform: scale(.99); }
.cp-btn:disabled { cursor: not-allowed; filter: saturate(.6) brightness(.95); }
.cp-btn:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }

.cp-meter-seg { height: .3rem; flex: 1; border-radius: 999px; background: #e9eff8; transition: background .25s; }

@media (prefers-reduced-motion: reduce) {
  .cp-rise { animation: none; }
  .cp-input, .cp-btn, .cp-eye, .cp-meter-seg { transition: none; }
}
`;

const STRENGTH = [
  { label: 'Too short', color: '#ef4444' },
  { label: 'Weak', color: '#ef4444' },
  { label: 'Fair', color: '#f59e0b' },
  { label: 'Good', color: '#38bdf8' },
  { label: 'Strong', color: '#22c55e' },
];

function scorePassword(pw = '') {
  if (!pw) return 0;
  if (pw.length < 8) return 0;
  let score = 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score += 1;
  return score;
}

function PasswordField({ id, label, icon: Icon, error, registration, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="cp-label">{label}</label>
      <div className="cp-field">
        <Icon className="cp-icon h-4 w-4" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="cp-input"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          {...registration}
        />
        <button
          type="button"
          className="cp-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          title={visible ? 'Hide' : 'Show'}
        >
          {visible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-red-600 mt-1">{error.message}</p>}
    </div>
  );
}

function Tip({ done, children }) {
  return (
    <li className="flex items-start gap-2 text-sm text-navy-500">
      <span
        className="mt-0.5 h-4 w-4 shrink-0 rounded-full flex items-center justify-center"
        style={{ background: done ? '#22c55e' : '#e2e8f0', color: '#fff' }}
      >
        {done && <FiCheck className="h-3 w-3" />}
      </span>
      <span className={done ? 'text-navy-700' : ''}>{children}</span>
    </li>
  );
}

export default function ChangePassword() {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const newPassword = watch('newPassword') || '';
  const confirmPassword = watch('confirmPassword') || '';
  const score = useMemo(() => scorePassword(newPassword), [newPassword]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await axiosClient.patch('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed. Please log in again.');
      reset();
      dispatch(logout());
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <style>{styles}</style>

      {/* Banner */}
      <div className="cp-hero cp-rise rounded-2xl px-5 py-5 sm:px-7 sm:py-6 text-white">
        <div className="relative">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Change Password</h2>
          <p className="text-sm text-slate-300 mt-1">
            Choose a strong password. You'll be signed out and asked to log in again afterwards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="cp-card cp-rise p-6 space-y-4 md:col-span-3" style={{ animationDelay: '60ms' }} noValidate>
          <PasswordField
            id="cp-current"
            label="Current Password"
            icon={FiLock}
            autoComplete="current-password"
            error={errors.currentPassword}
            registration={register('currentPassword', { required: 'Required' })}
          />

          <div>
            <PasswordField
              id="cp-new"
              label="New Password"
              icon={FiKey}
              autoComplete="new-password"
              error={errors.newPassword}
              registration={register('newPassword', { required: 'Required', minLength: { value: 8, message: 'At least 8 characters' } })}
            />
            {newPassword && (
              <div className="mt-2" aria-live="polite">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <span key={i} className="cp-meter-seg" style={i <= score ? { background: STRENGTH[score].color } : undefined} />
                  ))}
                </div>
                <p className="text-xs mt-1.5 font-medium" style={{ color: STRENGTH[score].color }}>{STRENGTH[score].label}</p>
              </div>
            )}
          </div>

          <PasswordField
            id="cp-confirm"
            label="Confirm New Password"
            icon={FiKey}
            autoComplete="new-password"
            error={errors.confirmPassword}
            registration={register('confirmPassword', {
              required: 'Required',
              validate: (v) => v === watch('newPassword') || 'Passwords do not match',
            })}
          />

          <button type="submit" disabled={saving} className="cp-btn">
            <FiShield className="h-4 w-4" /> {saving ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        {/* Tips */}
        <aside className="cp-card cp-rise p-5 md:col-span-2 self-start" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-navy-500">
              <FiShield className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-navy-800">Good passwords</h3>
          </div>
          <ul className="space-y-2.5">
            <Tip done={newPassword.length >= 8}>At least 8 characters</Tip>
            <Tip done={/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)}>Upper and lower case letters</Tip>
            <Tip done={/\d/.test(newPassword)}>At least one number</Tip>
            <Tip done={/[^A-Za-z0-9]/.test(newPassword)}>A symbol, like ! or #</Tip>
            <Tip done={!!confirmPassword && confirmPassword === newPassword}>Both new passwords match</Tip>
          </ul>
          <p className="text-xs text-navy-400 mt-4">Only the 8-character minimum is required. The rest make your password harder to guess.</p>
        </aside>
      </div>
    </div>
  );
}