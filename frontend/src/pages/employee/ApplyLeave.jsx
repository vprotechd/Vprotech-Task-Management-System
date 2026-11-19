
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCalendar,
  FiSend,
  FiInfo,
  FiFileText,
  FiClock,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';

const styles = `
.al-card {
  background: #fff;
  border: 1px solid #e6ecf5;
  border-radius: 1rem;
  box-shadow: 0 1px 2px rgba(15,27,51,.04),
              0 8px 24px -16px rgba(15,27,51,.18);
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}

.al-hover:hover {
  transform: translateY(-3px);
  border-color: #cfe0f5;
  box-shadow: 0 2px 4px rgba(15,27,51,.05),
              0 18px 32px -18px rgba(14,100,200,.35);
}

.al-rise {
  animation: al-rise .5s cubic-bezier(.2,.8,.2,1) both;
}

@keyframes al-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

.al-hero {
  background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
  position: relative;
  overflow: hidden;
}

.al-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(420px circle at 90% 0%,rgba(56,189,248,.28),transparent 60%),
    radial-gradient(360px circle at 0% 100%,rgba(99,102,241,.25),transparent 60%);
}

.al-tile {
  transition: transform .25s ease;
}

.al-hover:hover .al-tile {
  transform: scale(1.08) rotate(-4deg);
}

.al-label {
  display: block;
  margin-bottom: .4rem;
  font-size: .75rem;
  font-weight: 600;
  color: #475569;
}

.al-input {
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

.al-input:not(textarea) {
  height: 2.75rem;
}

.al-input:hover {
  border-color: #b8c4da;
}

.al-input:focus {
  border-color: #0ea5e9;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(14,165,233,.15);
}

.al-input::placeholder {
  color: #94a3b8;
}

.al-date-wrap {
  position: relative;
}

.al-date-wrap .al-input {
  padding-left: 2.65rem;
}

.al-date-icon {
  position: absolute;
  left: .9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.al-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  min-height: 2.8rem;
  padding: 0 1.4rem;
  border-radius: .75rem;
  font-size: .875rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg,#0ea5e9,#4f46e5);
  box-shadow: 0 10px 22px -12px rgba(79,70,229,.9);
  transition: transform .15s,box-shadow .2s,filter .2s;
}

.al-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px -12px rgba(79,70,229,.95);
}

.al-btn:disabled {
  cursor: not-allowed;
  opacity: .6;
  filter: saturate(.5);
}

.al-btn:focus-visible {
  outline: 3px solid #bae6fd;
  outline-offset: 2px;
}

.al-info {
  background: linear-gradient(135deg,#eff8ff,#f0f5ff);
  border: 1px solid #bfdbfe;
}

.al-info-icon {
  background: linear-gradient(135deg,#38bdf8,#2563eb);
  box-shadow: 0 8px 16px -8px rgba(37,99,235,.5);
}

.al-pop {
  animation: al-pop .5s cubic-bezier(.2,.9,.3,1.3) both;
}

@keyframes al-pop {
  from { opacity: 0; transform: scale(.7); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .al-rise,.al-pop {
    animation: none;
  }
  .al-card,.al-tile,.al-input,.al-btn {
    transition: none;
  }
}
`;

export default function ApplyLeave() {
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [loading, setLoading] = useState(false);

  // Calculate earliest allowed leave date (10 days from today)
  const minimumDate = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 10);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.startDate < minimumDate) {
      toast.error(
        'You must apply at least 10 days before your leave.'
      );
      return;
    }

    if (formData.endDate < formData.startDate) {
      toast.error('End date cannot be before start date.');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please enter your leave reason.');
      return;
    }

    try {
      setLoading(true);

      const { data } = await axiosClient.post(
        '/leaves/apply',
        formData
      );

      toast.success(
        data.message || 'Leave application submitted successfully!'
      );

      setFormData({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
      });

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to submit leave application.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <style>{styles}</style>

      {/* Header */}
      <div className="al-hero al-rise rounded-2xl px-5 py-6 sm:px-7 sm:py-7 text-white">
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sky-300">
              <FiFileText className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Employee Workspace
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Apply for Leave
            </h2>

            <p className="text-sm text-slate-300 mt-2 max-w-xl">
              Submit your leave request with the required details.
              Your application will be sent to the admin for review.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-white/10 border border-white/15 px-4 py-3">
            <FiCalendar className="h-6 w-6 text-sky-300" />
            <div>
              <p className="text-xs text-slate-300">Notice Period</p>
              <p className="text-2xl font-bold">10 Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Information */}
      <div className="al-info al-rise rounded-2xl p-4 sm:p-5 flex items-start gap-4">
        <div className="al-info-icon h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0">
          <FiShield className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h3 className="font-semibold text-blue-950">
            10-Day Advance Notice Policy
          </h3>

          <p className="text-sm text-blue-800 mt-1 leading-relaxed">
            Leave applications must be submitted at least
            10 calendar days before the leave start date.
            Please plan your leave accordingly.
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-800">
              <FiCalendar />
              Earliest allowed date:
            </span>

            <span className="text-sm font-bold text-blue-950">
              {minimumDate}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="al-card al-rise overflow-hidden">
        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FiFileText className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-semibold text-navy-800">
              Leave Application Form
            </h3>
            <p className="text-xs text-navy-400 mt-0.5">
              Fill in all required information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">

          {/* Leave Type */}
          <div>
            <label className="al-label" htmlFor="leaveType">
              Leave Type <span className="text-red-500">*</span>
            </label>

            <select
              id="leaveType"
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className="al-input"
              required
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="al-label" htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </label>

              <div className="al-date-wrap">
                <FiCalendar className="al-date-icon" />

                <input
                  id="startDate"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={minimumDate}
                  className="al-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="al-label" htmlFor="endDate">
                End Date <span className="text-red-500">*</span>
              </label>

              <div className="al-date-wrap">
                <FiCalendar className="al-date-icon" />

                <input
                  id="endDate"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || minimumDate}
                  className="al-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Selected dates information */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FiClock className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs text-slate-400">Selected Leave Period</p>
              <p className="text-sm font-semibold text-navy-700 mt-0.5">
                {formData.startDate && formData.endDate
                  ? `${formData.startDate} to ${formData.endDate}`
                  : 'Select your start and end dates'}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="al-label mb-0" htmlFor="reason">
                Reason for Leave <span className="text-red-500">*</span>
              </label>

              <span className="text-xs text-slate-400">
                {formData.reason.length}/1000
              </span>
            </div>

            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="5"
              maxLength="1000"
              placeholder="Explain why you need leave..."
              className="al-input resize-none"
              required
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <FiInfo className="text-sky-500 shrink-0" />
              Your request will be reviewed by the admin.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="al-btn w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend className="h-4 w-4" />
                  Submit Leave Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom information */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pb-2">
        <FiCheckCircle className="text-green-500" />
        Please verify your leave dates before submitting.
      </div>
    </div>
  );
}
