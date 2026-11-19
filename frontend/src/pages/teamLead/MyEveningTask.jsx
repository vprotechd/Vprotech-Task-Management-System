
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  FiSave,
  FiSend,
  FiSunrise,
  FiCheckCircle,
  FiEdit2,
  FiCalendar,
  FiClock,
  FiClipboard,
  FiArrowRight,
  FiFileText
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { todayISO, minutesToHours } from '../../utils/format';

const STATUS_OPTIONS = [
  'Completed',
  'Partially Completed',
  'Not Completed'
];

function defaultPercentForStatus(status) {
  if (status === 'Completed') return 100;
  if (status === 'Not Completed') return 0;
  return 50;
}

export default function MyEveningTask() {
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [report, setReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editTasks, setEditTasks] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      entries: [],
      remarks: ''
    }
  });

  const loadDay = useCallback(async (d) => {
    setLoading(true);
    setLoadError(null);
    setEditTasks(false);

    try {
      const { data: res } = await axiosClient.get('/tasks/day', {
        params: { date: d }
      });

      const r = res.data.report;
      setReport(r);

      if (r && r.morning && r.morning.tasks.length > 0) {
        const eveningByRef = new Map(
          (r.evening?.tasks || []).map((e) => [
            String(e.taskRef),
            e
          ])
        );

        reset({
          entries: r.morning.tasks.map((t) => {
            const existing = eveningByRef.get(String(t._id));

            return {
              taskRef: t._id,
              title: t.title,
              estimatedTimeMinutes: t.estimatedTimeMinutes,
              status: existing?.status || 'Completed',
              completionPercentage: existing
                ? existing.completionPercentage
                : 100,
              actualTimeSpentMinutes: existing
                ? existing.actualTimeSpentMinutes
                : t.estimatedTimeMinutes,
              remarks: existing?.remarks || ''
            };
          }),
          remarks: r.evening?.remarks || ''
        });
      } else {
        reset({
          entries: [],
          remarks: ''
        });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Failed to load tasks for this date.';

      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadDay(date);
  }, [date, loadDay]);

  const entries = watch('entries') || [];

  const noMorningPlan =
    !loadError &&
    (!report || !report.morning || report.morning.tasks.length === 0);

  const isApproved = report?.status === 'approved';
  const isSubmitted = report?.status === 'evening_submitted';

  const showSuccessSummary =
    (isSubmitted || isApproved) && !editTasks;

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
          remarks: e.remarks
        })),
        remarks: values.remarks,
        submit
      });

      setReport(res.data.report);

      if (submit) {
        setEditTasks(false);
        toast.success("Today's evening task submitted successfully!");
      } else {
        toast.success('Draft saved.');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Could not save evening update.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mmt-page">
      <style>{`
        .mmt-page {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
          padding: 4px 0 30px;
          color: #172b4d;
          animation: mmtFadeIn .45s ease both;
        }

        @keyframes mmtFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mmt-hero {
          position: relative;
          overflow: hidden;
          padding: 27px 28px;
          border-radius: 18px;
          background:
            radial-gradient(circle at 90% 10%, rgba(56,189,248,.24), transparent 30%),
            radial-gradient(circle at 5% 100%, rgba(99,102,241,.22), transparent 35%),
            linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
          color: white;
          box-shadow: 0 12px 28px rgba(15,27,51,.14);
        }

        .mmt-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .mmt-hero-title {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 0;
          font-size: 23px;
          font-weight: 750;
          letter-spacing: -.5px;
        }

        .mmt-hero-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 47px;
          height: 47px;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 14px;
          background: rgba(255,255,255,.12);
          font-size: 23px;
        }

        .mmt-hero-description {
          margin: 9px 0 0 60px;
          color: #dbeafe;
          font-size: 13px;
          line-height: 1.6;
        }

        .mmt-date-box {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 13px;
          border: 1px solid rgba(255,255,255,.22);
          border-radius: 12px;
          background: rgba(255,255,255,.1);
        }

        .mmt-date-box label {
          color: #dbeafe;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .mmt-date-input {
          width: 145px;
          padding: 8px 10px;
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 8px;
          outline: none;
          background: rgba(255,255,255,.96);
          color: #172b4d;
          font-size: 13px;
        }

        .mmt-card {
          margin-top: 19px;
          padding: 21px;
          border: 1px solid #e6ecf5;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(15,27,51,.045);
          transition: box-shadow .2s ease, transform .2s ease;
        }

        .mmt-card:hover {
          box-shadow: 0 9px 24px rgba(15,27,51,.075);
        }

        .mmt-section-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 17px;
        }

        .mmt-section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 37px;
          height: 37px;
          border-radius: 11px;
          background: #eff8ff;
          color: #0284c7;
          font-size: 17px;
        }

        .mmt-section-heading h3 {
          margin: 0;
          color: #172b4d;
          font-size: 16px;
          font-weight: 700;
        }

        .mmt-section-heading p {
          margin: 3px 0 0;
          color: #8493a8;
          font-size: 12px;
        }

        .mmt-task-card {
          padding: 18px;
          margin-bottom: 13px;
          border: 1px solid #e6ecf5;
          border-radius: 13px;
          background: linear-gradient(145deg,#fff 0%,#f9fbff 100%);
          transition: border-color .2s ease, box-shadow .2s ease;
        }

        .mmt-task-card:hover {
          border-color: #bfdbfe;
          box-shadow: 0 5px 15px rgba(14,165,233,.06);
        }

        .mmt-task-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 17px;
        }

        .mmt-task-title {
          margin: 0;
          color: #172b4d;
          font-size: 15px;
          font-weight: 700;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .mmt-planned-time {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 5px;
          color: #718096;
          font-size: 12px;
        }

        .mmt-task-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          padding: 0 8px;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
        }

        .mmt-field-grid {
          display: grid;
          grid-template-columns: 1.3fr .8fr .8fr 1.2fr;
          gap: 12px;
        }

        .mmt-field {
          min-width: 0;
        }

        .mmt-field label {
          display: block;
          margin-bottom: 7px;
          color: #52647d;
          font-size: 12px;
          font-weight: 650;
        }

        .mmt-input {
          width: 100%;
          min-width: 0;
          padding: 10px 11px;
          border: 1px solid #dce5f0;
          border-radius: 9px;
          outline: none;
          background: #f8fafc;
          color: #243650;
          font-size: 13px;
          transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
        }

        .mmt-input:focus {
          border-color: #38bdf8;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(14,165,233,.12);
        }

        .mmt-input::placeholder {
          color: #a0aec0;
        }

        .mmt-field-hint {
          margin: 5px 0 0;
          color: #8a9ab0;
          font-size: 11px;
          text-align: center;
        }

        .mmt-remarks-card {
          margin-top: 17px;
          padding: 17px;
          border: 1px solid #e6ecf5;
          border-radius: 12px;
          background: #fbfdff;
        }

        .mmt-remarks-card label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
          color: #334b68;
          font-size: 13px;
          font-weight: 700;
        }

        .mmt-textarea {
          width: 100%;
          min-height: 85px;
          resize: vertical;
          padding: 11px 12px;
          border: 1px solid #dce5f0;
          border-radius: 10px;
          outline: none;
          background: #f8fafc;
          color: #243650;
          font-size: 13px;
          transition: border-color .2s ease, box-shadow .2s ease;
        }

        .mmt-textarea:focus {
          border-color: #38bdf8;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(14,165,233,.12);
        }

        .mmt-actions {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 11px;
          margin-top: 18px;
        }

        .mmt-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 10px 17px;
          border: 0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
        }

        .mmt-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .mmt-btn:disabled {
          cursor: not-allowed;
          opacity: .6;
        }

        .mmt-btn-primary {
          background: linear-gradient(120deg,#0ea5e9,#4f46e5);
          color: #fff;
          box-shadow: 0 5px 13px rgba(59,130,246,.2);
        }

        .mmt-btn-primary:hover:not(:disabled) {
          box-shadow: 0 8px 17px rgba(59,130,246,.28);
        }

        .mmt-btn-secondary {
          border: 1px solid #dce5f0;
          background: #fff;
          color: #334b68;
        }

        .mmt-btn-secondary:hover:not(:disabled) {
          border-color: #93c5fd;
          background: #f8fbff;
        }

        .mmt-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px 15px;
          margin-top: 17px;
          border-radius: 11px;
          font-size: 13px;
          line-height: 1.55;
        }

        .mmt-notice svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .mmt-notice-success {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #15803d;
        }

        .mmt-notice-warning {
          border: 1px solid #fde68a;
          background: #fffbeb;
          color: #a16207;
        }

        .mmt-notice-info {
          border: 1px solid #dbeafe;
          background: linear-gradient(110deg,#eff8ff,#f0f5ff);
          color: #315b91;
        }

        .mmt-success-card {
          padding: 38px 24px;
          text-align: center;
        }

        .mmt-success-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 76px;
          height: 76px;
          margin: 0 auto 19px;
          border-radius: 50%;
          background: #dcfce7;
          color: #16a34a;
          font-size: 39px;
          box-shadow: 0 0 0 9px #f0fdf4;
        }

        .mmt-success-card h2 {
          margin: 0 0 10px;
          color: #172b4d;
          font-size: 23px;
          font-weight: 750;
        }

        .mmt-success-card > p {
          margin: 0 0 8px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        .mmt-success-date {
          color: #94a3b8 !important;
          font-size: 12px !important;
        }

        .mmt-success-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
          margin: 22px 0 15px;
        }

        .mmt-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 13px;
          border: 1px solid #bbf7d0;
          border-radius: 9px;
          background: #f0fdf4;
          color: #15803d;
          font-size: 12px;
          font-weight: 700;
        }

        .mmt-success-note {
          margin-top: 19px !important;
          color: #8493a8 !important;
          font-size: 12px !important;
        }

        .mmt-success-note a,
        .mmt-inline-link {
          color: #2563eb;
          font-weight: 650;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .mmt-loading {
          padding: 35px 0;
        }

        @media (max-width: 760px) {
          .mmt-hero {
            padding: 22px 19px;
          }

          .mmt-hero-title {
            font-size: 20px;
          }

          .mmt-hero-description {
            margin-left: 0;
          }

          .mmt-date-box {
            width: 100%;
            justify-content: space-between;
          }

          .mmt-date-input {
            flex: 1;
            max-width: 180px;
          }

          .mmt-card {
            padding: 16px;
          }

          .mmt-field-grid {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }
        }

        @media (max-width: 480px) {
          .mmt-page {
            padding-bottom: 20px;
          }

          .mmt-hero {
            padding: 19px 15px;
            border-radius: 14px;
          }

          .mmt-hero-title {
            font-size: 18px;
          }

          .mmt-hero-icon {
            width: 41px;
            height: 41px;
          }

          .mmt-date-box {
            padding: 9px;
          }

          .mmt-date-box label {
            font-size: 11px;
          }

          .mmt-date-input {
            width: 125px;
            font-size: 12px;
          }

          .mmt-task-card {
            padding: 14px;
          }

          .mmt-field-grid {
            grid-template-columns: 1fr;
            gap: 13px;
          }

          .mmt-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .mmt-btn {
            width: 100%;
          }

          .mmt-success-card {
            padding: 30px 15px;
          }

          .mmt-success-card h2 {
            font-size: 20px;
          }

          .mmt-success-actions {
            flex-direction: column;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mmt-page {
            animation: none;
          }

          .mmt-card,
          .mmt-task-card,
          .mmt-btn {
            transition: none;
          }
        }
      `}</style>

      {/* Hero */}
      <div className="mmt-hero">
        <div className="mmt-hero-content">
          <div>
            <h2 className="mmt-hero-title">
              <span className="mmt-hero-icon">
                <FiSunrise />
              </span>
              My Evening Task
            </h2>

            <p className="mmt-hero-description">
              Track your daily progress and update the completion
              status of your planned tasks.
            </p>
          </div>

          <div className="mmt-date-box">
            <label htmlFor="evening-task-date">
              <FiCalendar style={{ display: 'inline', marginRight: 5 }} />
              Select Date
            </label>

            <input
              id="evening-task-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="mmt-date-input"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="mmt-card mmt-loading">
          <LoadingSpinner label="Loading evening tasks..." />
        </div>
      ) : loadError ? (
        <div className="mmt-card">
          <ErrorState
            message={loadError}
            onRetry={() => loadDay(date)}
          />
        </div>
      ) : noMorningPlan ? (
        <div className="mmt-card">
          <EmptyState
            icon={FiSunrise}
            title="No morning plan found for this date"
            description="Submit your morning update first — evening completion is always linked to that day's planned tasks."
            action={
              <Link
                to="/team-lead/my-morning-task"
                className="mmt-btn mmt-btn-primary"
              >
                Go to My Morning Task
                <FiArrowRight />
              </Link>
            }
          />
        </div>
      ) : showSuccessSummary ? (
        /* Success Summary */
        <div className="mmt-card mmt-success-card">
          <div className="mmt-success-icon">
            <FiCheckCircle />
          </div>

          <h2>
            {isApproved
              ? 'Evening Update Approved'
              : 'Evening Task Submitted'}
          </h2>

          <p>
            {isApproved
              ? "Today's evening update has been reviewed and approved."
              : "Today's evening task has been submitted successfully."}
          </p>

          <p className="mmt-success-date">
            Date: {date}
          </p>

          <div className="mmt-success-actions">
            <span className="mmt-status-pill">
              <FiCheckCircle />
              {isApproved ? 'Approved' : 'Evening update submitted'}
            </span>

            <button
              onClick={() => setEditTasks(true)}
              className="mmt-btn mmt-btn-secondary"
            >
              <FiEdit2 />
              Edit / Add More Tasks
            </button>
          </div>

          {isApproved && (
            <div className="mmt-notice mmt-notice-warning" style={{ maxWidth: 510, margin: '15px auto' }}>
              <FiCheckCircle />
              <span>
                Editing an approved update sends it back for review.
              </span>
            </div>
          )}

          <p className="mmt-success-note">
            Forgot to plan something?{' '}
            <Link to="/team-lead/my-morning-task">
              Add it to My Morning Task
            </Link>
            {' '}first, then it'll appear here.
          </p>
        </div>
      ) : (
        /* Evening Update Form */
        <form className="space-y-0">
          {isSubmitted && (
            <div className="mmt-notice mmt-notice-success">
              <FiCheckCircle />
              <span>
                Already submitted — you're editing your submission.
                Save to update it.
              </span>
            </div>
          )}

          {isApproved && (
            <div className="mmt-notice mmt-notice-warning">
              <FiCheckCircle />
              <span>
                This was already approved. Editing and resubmitting
                sends it back for review.
              </span>
            </div>
          )}

          <div className="mmt-card">
            <div className="mmt-section-heading">
              <span className="mmt-section-icon">
                <FiClipboard />
              </span>

              <div>
                <h3>Today's Planned Tasks</h3>
                <p>
                  Update the completion status and time spent on each task.
                </p>
              </div>
            </div>

            {entries.map((entry, idx) => (
              <div className="mmt-task-card" key={entry.taskRef}>
                <div className="mmt-task-top">
                  <div style={{ minWidth: 0 }}>
                    <h4
                      className="mmt-task-title"
                      title={entry.title}
                    >
                      {entry.title}
                    </h4>

                    <span className="mmt-planned-time">
                      <FiClock />
                      Planned: {minutesToHours(entry.estimatedTimeMinutes)}
                    </span>
                  </div>

                  <span className="mmt-task-number">
                    Task {idx + 1}
                  </span>
                </div>

                <div className="mmt-field-grid">
                  <div className="mmt-field">
                    <label>Completion Status</label>

                    <select
                      className="mmt-input"
                      {...register(`entries.${idx}.status`)}
                      onChange={(e) => {
                        setValue(`entries.${idx}.status`, e.target.value);
                        setValue(
                          `entries.${idx}.completionPercentage`,
                          defaultPercentForStatus(e.target.value)
                        );
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mmt-field">
                    <label>Completion %</label>

                    <input
                      type="number"
                      min={0}
                      max={100}
                      title="Completion %"
                      className="mmt-input"
                      placeholder="%"
                      {...register(`entries.${idx}.completionPercentage`, {
                        min: 0,
                        max: 100
                      })}
                    />
                  </div>

                  <div className="mmt-field">
                    <label>Actual Time (Minutes)</label>

                    <input
                      type="number"
                      min={0}
                      title="Actual minutes spent"
                      className="mmt-input"
                      placeholder={`${entry.estimatedTimeMinutes} min plan`}
                      {...register(`entries.${idx}.actualTimeSpentMinutes`, {
                        min: 0
                      })}
                    />

                    <p className="mmt-field-hint">
                      {minutesToHours(entries[idx]?.actualTimeSpentMinutes)}
                    </p>
                  </div>

                  <div className="mmt-field">
                    <label>Task Remarks</label>

                    <input
                      className="mmt-input"
                      placeholder="Remarks (optional)"
                      {...register(`entries.${idx}.remarks`)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="mmt-remarks-card">
              <label>
                <FiFileText />
                Overall Remarks
              </label>

              <textarea
                rows={3}
                className="mmt-textarea"
                placeholder="Add your overall remarks for today (optional)..."
                {...register('remarks')}
              />
            </div>

            <div className="mmt-notice mmt-notice-info">
              <FiCheckCircle />
              <span>
                Review your task completion details before submitting
                your evening update.
              </span>
            </div>

            <div className="mmt-actions">
              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit((v) => onSave(v, false))}
                className="mmt-btn mmt-btn-secondary"
              >
                <FiSave />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit((v) => onSave(v, true))}
                className="mmt-btn mmt-btn-primary"
              >
                <FiSend />
                {saving
                  ? 'Submitting...'
                  : (report?.status
                    ? 'Update Submission'
                    : 'Submit Evening Update')}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
