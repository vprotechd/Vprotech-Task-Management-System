import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import { setCredentials } from '../../store/authSlice';
import logo from '../../assets/logo.png';

/* Scoped styles: floating labels, shake, glow, shimmer, spinner.
   Everything is prefixed "lg-" so it can't clash with your global CSS. */
const styles = `
.lg-root { --mx: 50%; --my: 40%; }
.lg-spot {
  background:
    radial-gradient(480px circle at var(--mx) var(--my), rgba(56,189,248,.22), transparent 60%),
    radial-gradient(700px circle at 85% 100%, rgba(99,102,241,.18), transparent 60%);
  transition: background .2s ease-out;
}
.lg-grid {
  background-image:
    linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(420px circle at var(--mx) var(--my), #000, transparent 75%);
          mask-image: radial-gradient(420px circle at var(--mx) var(--my), #000, transparent 75%);
}
.lg-card {
  background: rgba(255,255,255,.96);
  box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 30px 60px -20px rgba(0,0,0,.55);
  transition: transform .15s ease-out;
  transform: perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
}
.lg-intro { animation: lg-rise .7s cubic-bezier(.2,.8,.2,1) both; }
@keyframes lg-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

.lg-field { position: relative; }
.lg-input {
  width: 100%; height: 3.25rem; padding: 1.15rem 2.5rem 0 2.5rem;
  border: 1.5px solid #dbe2ee; border-radius: .75rem; background: #f8fafc;
  color: #0f1b33; font-size: .95rem; outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.lg-input::placeholder { color: transparent; }
.lg-input:focus::placeholder { color: #94a3b8; }
.lg-input:hover { border-color: #b8c4da; }
.lg-input:focus { border-color: #0ea5e9; background: #fff; box-shadow: 0 0 0 4px rgba(14,165,233,.15); }
.lg-input.lg-err { border-color: #ef4444; background: #fff5f5; }
.lg-input.lg-err:focus { box-shadow: 0 0 0 4px rgba(239,68,68,.15); }
.lg-label {
  position: absolute; left: 2.5rem; top: 50%; transform: translateY(-50%);
  color: #7b8aa6; font-size: .95rem; pointer-events: none;
  transition: all .18s ease; transform-origin: left;
}
.lg-input:focus ~ .lg-label,
.lg-input:not(:placeholder-shown) ~ .lg-label {
  top: .8rem; font-size: .7rem; font-weight: 600; color: #0284c7;
}
.lg-input.lg-err ~ .lg-label { color: #dc2626; }
.lg-icon { position: absolute; left: .85rem; top: 50%; transform: translateY(-50%); color: #94a3b8; transition: color .2s; }
.lg-input:focus ~ .lg-icon { color: #0ea5e9; }

.lg-btn {
  position: relative; overflow: hidden; width: 100%; height: 3rem; border-radius: .75rem;
  color: #fff; font-weight: 600; letter-spacing: .01em;
  background: linear-gradient(135deg, #0ea5e9, #4f46e5);
  box-shadow: 0 10px 24px -10px rgba(79,70,229,.8);
  transition: transform .15s, box-shadow .2s, filter .2s;
}
.lg-btn::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%);
  transform: translateX(-120%); transition: transform .6s;
}
.lg-btn:hover:not(:disabled)::after { transform: translateX(120%); }
.lg-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 28px -10px rgba(79,70,229,.9); }
.lg-btn:active:not(:disabled) { transform: translateY(0) scale(.985); }
.lg-btn:disabled { cursor: not-allowed; filter: saturate(.7) brightness(.95); }
.lg-btn:focus-visible { outline: 3px solid #bae6fd; outline-offset: 2px; }

.lg-spin { width: 1.1rem; height: 1.1rem; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: lg-rot .7s linear infinite; }
@keyframes lg-rot { to { transform: rotate(360deg); } }

.lg-shake { animation: lg-shake .45s; }
@keyframes lg-shake {
  10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-7px); } 40%, 60% { transform: translateX(7px); }
}
.lg-logo { animation: lg-float 5s ease-in-out infinite; }
@keyframes lg-float { 50% { transform: translateY(-6px); } }

@media (prefers-reduced-motion: reduce) {
  .lg-intro, .lg-logo, .lg-shake, .lg-spin { animation: none; }
  .lg-card, .lg-spot, .lg-btn::after { transition: none; }
}
`;

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [shake, setShake] = useState(false);
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Cursor-follow spotlight + subtle card tilt
  const handleMove = useCallback((e) => {
    const root = rootRef.current;
    if (!root) return;
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    root.style.setProperty('--mx', `${x}%`);
    root.style.setProperty('--my', `${y}%`);
    const card = cardRef.current;
    if (card && window.innerWidth >= 640) {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      card.style.setProperty('--ry', `${dx * 6}deg`);
      card.style.setProperty('--rx', `${-dy * 6}deg`);
    }
  }, []);

  const handleLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const onSubmit = async (values) => {
    try {
      const { data } = await axiosClient.post('/auth/login', values);
      const { token, user } = data.data;
      dispatch(setCredentials({ token, user }));
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      const dashboardPaths = {
        admin: '/admin/dashboard',
        team_lead: '/team-lead/dashboard',
        employee: '/employee/dashboard',
      };
      navigate(dashboardPaths[user.role] || '/login', { replace: true });
    } catch (err) {
      triggerShake();
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const onInvalid = () => triggerShake();

  return (
    <div
      ref={rootRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="lg-root relative min-h-screen flex items-center justify-center bg-navy-900 px-4 py-8 overflow-hidden"
    >
      <style>{styles}</style>

      {/* Ambient background that reacts to the cursor */}
      <div className="lg-spot pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="lg-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="lg-intro flex flex-col items-center mb-6">
          <img
            src={logo}
            alt="VproTech Digital"
            className="lg-logo h-16 w-auto bg-white rounded-xl p-2 shadow-lg"
          />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">VproTech Digital</h1>
          <p className="text-sm text-navy-300">Employee Daily Task Management</p>
        </div>

        <div
          ref={cardRef}
          className={`lg-card lg-intro rounded-2xl p-6 sm:p-8 ${shake ? 'lg-shake' : ''}`}
          style={{ animationDelay: '.12s' }}
        >
          <h2 className="text-lg font-semibold text-navy-800 mb-1">Sign in to your account</h2>
          <p className="text-sm text-navy-400 mb-6">Enter your work email and password.</p>

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <div className="lg-field">
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@vprotech.com"
                  aria-invalid={!!errors.email}
                  className={`lg-input ${errors.email ? 'lg-err' : ''}`}
                  {...register('email', { required: 'Email is required' })}
                />
                <label className="lg-label" htmlFor="email">Email</label>
                <FiMail className="lg-icon h-4 w-4" />
              </div>
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600" role="alert">
                  <FiAlertCircle className="h-3.5 w-3.5" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="lg-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className={`lg-input ${errors.password ? 'lg-err' : ''}`}
                  onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))}
                  {...register('password', {
                    required: 'Password is required',
                    onBlur: () => setCapsOn(false),
                  })}
                />
                <label className="lg-label" htmlFor="password">Password</label>
                <FiLock className="lg-icon h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-navy-300 hover:text-navy-600 hover:bg-slate-100 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600" role="alert">
                  <FiAlertCircle className="h-3.5 w-3.5" /> {errors.password.message}
                </p>
              )}
              {capsOn && !errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                  <FiAlertCircle className="h-3.5 w-3.5" /> Caps Lock is on
                </p>
              )}
            </div>

            <button type="submit" className="lg-btn flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="lg-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="lg-intro text-center text-xs text-navy-300 mt-6" style={{ animationDelay: '.24s' }}>
          Internal system for VproTech Digital employees only.
        </p>
      </div>
    </div>
  );
}