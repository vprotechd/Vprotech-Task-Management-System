
import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiSend,
  FiCheckCircle,
  FiSunrise,
  FiCalendar,
  FiClock,
  FiClipboard,
  FiFileText,
  FiAlertCircle,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import { todayISO } from '../../utils/format';

const styles = `
  .mmt-page {
    animation: mmtRise .45s ease both;
  }

  @keyframes mmtRise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .mmt-hero {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
    border-radius: 1rem;
    box-shadow: 0 12px 30px rgba(15,27,51,.16);
  }

  .mmt-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(circle at 85% 15%,rgba(56,189,248,.25),transparent 32%),
      radial-gradient(circle at 10% 100%,rgba(99,102,241,.2),transparent 35%);
  }

  .mmt-card {
    background: #fff;
    border: 1px solid #e6ecf5;
    border-radius: 1rem;
    box-shadow: 0 5px 18px rgba(15,27,51,.045);
    transition: box-shadow .2s ease, transform .2s ease;
  }

  .mmt-card:hover {
    box-shadow: 0 10px 26px rgba(15,27,51,.075);
  }

  .mmt-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 13px;
    background: linear-gradient(135deg,#e0f2fe,#eef2ff);
    color: #2563eb;
  }

  .mmt-input {
    width: 100%;
    min-width: 0;
    padding: .7rem .85rem;
    border: 1px solid #dbe5f1;
    border-radius: .7rem;
    background: #f8fafc;
    color: #172554;
    font-size: .875rem;
    outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }

  .mmt-input:focus {
    border-color: #38bdf8;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(14,165,233,.13);
  }

  .mmt-input::placeholder {
    color: #94a3b8;
  }

  .mmt-task {
    border: 1px solid #e2eaf4;
    border-radius: .9rem;
    background: linear-gradient(135deg,#fff 0%,#fbfdff 100%);
    transition: border-color .2s, box-shadow .2s, transform .2s;
  }

  .mmt-task:hover {
    border-color: #bfdbfe;
    box-shadow: 0 7px 20px rgba(15,27,51,.055);
    transform: translateY(-1px);
  }

  .mmt-task-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 9px;
    color: #1d4ed8;
    background: linear-gradient(135deg,#dbeafe,#e0f2fe);
    font-size: .75rem;
    font-weight: 700;
  }

  .mmt-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    padding: .75rem 1.15rem;
    border-radius: .75rem;
    color: #fff;
    font-size: .875rem;
    font-weight: 600;
    background: linear-gradient(110deg,#0ea5e9,#4f46e5);
    box-shadow: 0 5px 12px rgba(37,99,235,.2);
    transition: transform .2s, box-shadow .2s, opacity .2s;
  }

  .mmt-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(37,99,235,.27);
  }

  .mmt-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    padding: .75rem 1.15rem;
    border: 1px solid #dbe5f1;
    border-radius: .75rem;
    color: #334155;
    background: #fff;
    font-size: .875rem;
    font-weight: 600;
    transition: background .2s, border-color .2s, transform .2s;
  }

  .mmt-secondary:hover:not(:disabled) {
    background: #f0f9ff;
    border-color: #bae6fd;
    transform: translateY(-1px);
  }

  .mmt-primary:disabled,
  .mmt-secondary:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .mmt-delete {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: .65rem;
    color: #dc2626;
    background: #fef2f2;
    transition: background .2s, transform .2s;
  }

  .mmt-delete:hover {
    background: #fee2e2;
    transform: scale(1.05);
  }

  .mmt-info {
    border-radius: .85rem;
    padding: .9rem 1rem;
    display: flex;
    align-items: flex-start;
    gap: .65rem;
    font-size: .8rem;
    line-height: 1.55;
  }

  .mmt-info-success {
    color: #166534;
    background: linear-gradient(110deg,#f0fdf4,#ecfdf5);
    border: 1px solid #bbf7d0;
  }

  .mmt-info-warning {
    color: #92400e;
    background: linear-gradient(110deg,#fffbeb,#fff7ed);
    border: 1px solid #fde68a;
  }

  .mmt-info-blue {
    color: #1e40af;
    background: linear-gradient(110deg,#eff8ff,#f0f5ff);
    border: 1px solid #dbeafe;
  }

  .mmt-date-input {
    width: 100%;
    border: 1px solid #dbe5f1;
    background: #f8fafc;
    color: #172554;
    border-radius: .75rem;
    padding: .7rem .85rem;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
  }

  .mmt-date-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(14,165,233,.13);
  }

  @media (max-width: 767px) {
    .mmt-task-row {
      flex-wrap: wrap;
    }

    .mmt-task-row > input:first-of-type {
      flex: 1 1 100%;
    }

    .mmt-task-details {
      padding-left: 0 !important;
      flex-direction: column;
      align-items: stretch;
    }

    .mmt-task-details > input {
      width: 100%;
    }
  }

  @media (max-width: 640px) {
    .mmt-hero {
      border-radius: .85rem;
    }

    .mmt-card,
    .mmt-task {
      border-radius: .85rem;
    }

    .mmt-actions {
      flex-direction: column-reverse;
    }

    .mmt-actions button {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .mmt-page, .mmt-card, .mmt-task,
    .mmt-primary, .mmt-secondary {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const emptyTask = () => ({
  _id: '',
  title: '',
  description: '',
  priority: 'Medium',
  expectedCompletion: '',
  estimatedTimeMinutes: 60,
  remarks: '',
});

function minutesToHoursHint(mins) {
  const n = Number(mins);
  if (!n || n <= 0) return null;

  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);

  return `≈ ${h}h ${m}m`;
}

export default function MyMorningTask() {
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, control, handleSubmit, reset, watch } = useForm({
    defaultValues: { tasks: [emptyTask()], remarks: '' },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tasks',
  });

  const watchedTasks = watch('tasks');

  const loadDay = useCallback(async (d) => {
    setLoading(true);
    setLoadError(null);

    try {
      const { data: res } = await axiosClient.get('/tasks/day', {
        params: { date: d },
      });

      const report = res.data.report;

      setExistingReport(report);

      if (report && report.morning.tasks.length > 0) {
        reset({
          tasks: report.morning.tasks.map((t) => ({
            _id: t._id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            expectedCompletion: t.expectedCompletion,
            estimatedTimeMinutes: t.estimatedTimeMinutes,
            remarks: t.remarks,
          })),
          remarks: report.morning.remarks || '',
        });
      } else {
        reset({ tasks: [emptyTask()], remarks: '' });
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

  // Editable at every status.
  const submittedButEditable =
    existingReport?.status === 'morning_submitted';

  const approvedButEditable =
    existingReport?.status === 'approved';

  const reopenedForEdit =
    existingReport?.status === 'evening_submitted';

  const onSave = async (values, submit) => {
    setSaving(true);

    try {
      const { data: res } = await axiosClient.post('/tasks/morning', {
        date,
        tasks: values.tasks.map((t) => ({
          ...t,
          estimatedTimeMinutes: Number(t.estimatedTimeMinutes),
        })),
        remarks: values.remarks,
        submit,
      });

      setExistingReport(res.data.report);

      reset({
        tasks: res.data.report.morning.tasks.map((t) => ({
          _id: t._id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          expectedCompletion: t.expectedCompletion,
          estimatedTimeMinutes: t.estimatedTimeMinutes,
          remarks: t.remarks,
        })),
        remarks: res.data.report.morning.remarks || '',
      });

      toast.success(
        submit ? 'Morning tasks submitted!' : 'Draft saved.'
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not save morning tasks.'
      );
    } finally {
      setSaving(false);
    }
  };

  const totalTasks = watchedTasks?.length || 0;

  const totalMinutes = (watchedTasks || []).reduce(
    (total, task) =>
      total + (Number(task?.estimatedTimeMinutes) || 0),
    0
  );

  return (
    <>
      <style>{styles}</style>

      <div className="mmt-page max-w-4xl mx-auto space-y-6">

        {/* Hero Section */}
        <section className="mmt-hero p-6 sm:p-8 text-white">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-200 mb-4">
                <FiSunrise />
                Team Lead Workspace
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                My Morning Task
              </h1>

              <p className="text-sm sm:text-base text-blue-100/80 mt-2 max-w-2xl">
                Plan your daily tasks, estimate the time required,
                and submit your morning work plan for review.
              </p>
            </div>

            <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl border border-white/15 bg-white/10">
              <FiSunrise className="text-4xl text-sky-200" />
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-5 border-t border-white/15 flex flex-wrap gap-4 text-sm text-blue-100/85">
            <span className="flex items-center gap-2">
              <FiCalendar className="text-sky-300" />
              {date}
            </span>

            <span className="flex items-center gap-2">
              <FiClipboard className="text-sky-300" />
              {totalTasks} planned tasks
            </span>

            <span className="flex items-center gap-2">
              <FiClock className="text-sky-300" />
              {minutesToHoursHint(totalMinutes) || '0h 0m'} estimated
            </span>
          </div>
        </section>

        {/* Date Selection */}
        <section className="mmt-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="mmt-icon">
                <FiCalendar size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Select Task Date
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select the day for which you want to plan tasks.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto sm:min-w-[230px]">
              <label
                htmlFor="morning-task-date"
                className="block text-xs font-semibold text-slate-600 mb-2"
              >
                Date
              </label>

              <input
                id="morning-task-date"
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="mmt-date-input"
              />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mmt-card p-8">
            <LoadingSpinner label="Loading your morning tasks..." />
          </div>
        ) : loadError ? (
          <div className="mmt-card p-5 sm:p-6">
            <ErrorState
              message={loadError}
              onRetry={() => loadDay(date)}
            />
          </div>
        ) : (
          <form className="space-y-5">

            {/* Submission Status Messages */}
            {submittedButEditable && (
              <div className="mmt-info mmt-info-success">
                <FiCheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    Submitted for review
                  </p>
                  <p className="mt-1">
                    You can still edit tasks or add more until
                    the submission is reviewed.
                  </p>
                </div>
              </div>
            )}

            {(approvedButEditable || reopenedForEdit) && (
              <div className="mmt-info mmt-info-warning">
                <FiAlertCircle className="h-5 w-5 shrink-0 mt-0.5" />

                <div>
                  <p className="font-semibold">
                    {approvedButEditable
                      ? 'Previously approved submission'
                      : 'Evening update already submitted'}
                  </p>

                  <p className="mt-1">
                    {approvedButEditable
                      ? 'This was already approved. Editing and resubmitting sends it back for review.'
                      : 'Evening tasks were already submitted for this day. Editing the plan sends it back for review.'}
                  </p>
                </div>
              </div>
            )}

            {/* Task Form Header */}
            <section className="mmt-card p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="mmt-icon">
                    <FiClipboard size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-800">
                      Planned Tasks
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Add the tasks you intend to complete today.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => append(emptyTask())}
                  className="mmt-primary"
                >
                  <FiPlus className="h-4 w-4" />
                  Add Task
                </button>
              </div>

              <div className="mmt-info mmt-info-blue mt-5">
                <FiCheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Provide a clear task title, priority, and estimated
                  time. You can add a description and remarks if needed.
                </p>
              </div>

              {/* Task Cards */}
              <div className="space-y-4 mt-5">
                {fields.map((field, idx) => (
                  <div key={field.id} className="mmt-task p-4 sm:p-5">

                    <input
                      type="hidden"
                      {...register(`tasks.${idx}._id`)}
                    />

                    {/* Task Heading */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="mmt-task-number">
                          {idx + 1}
                        </span>

                        <h3 className="font-bold text-slate-800 text-sm">
                          Task {idx + 1}
                        </h3>
                      </div>

                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="mmt-delete"
                          aria-label="Remove task"
                          title="Remove task"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Main Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Task Title *
                        </label>

                        <input
                          className="mmt-input"
                          placeholder="e.g. Review team's weekly plan"
                          {...register(`tasks.${idx}.title`, {
                            required: true,
                          })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Priority
                        </label>

                        <select
                          className="mmt-input"
                          {...register(`tasks.${idx}.priority`)}
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                          <option>Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Estimated Time (Minutes) *
                        </label>

                        <input
                          type="number"
                          min={0}
                          title="Estimated minutes"
                          className="mmt-input"
                          placeholder="e.g. 60"
                          {...register(
                            `tasks.${idx}.estimatedTimeMinutes`,
                            {
                              required: true,
                              min: 0,
                            }
                          )}
                        />

                        {minutesToHoursHint(
                          watchedTasks?.[idx]?.estimatedTimeMinutes
                        ) && (
                          <p className="text-[11px] text-blue-600 mt-1">
                            {minutesToHoursHint(
                              watchedTasks[idx].estimatedTimeMinutes
                            )}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Description
                        </label>

                        <input
                          className="mmt-input"
                          placeholder="Add a short task description (optional)"
                          {...register(`tasks.${idx}.description`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Expected Completion
                        </label>

                        <input
                          className="mmt-input"
                          placeholder="e.g. 4:00 PM"
                          {...register(`tasks.${idx}.expectedCompletion`)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Task Remarks
                        </label>

                        <input
                          className="mmt-input"
                          placeholder="Remarks (optional)"
                          {...register(`tasks.${idx}.remarks`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Tasks */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-blue-950">
                    Total Planned Tasks
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Estimated time for all planned tasks
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-blue-900">
                    {totalTasks}
                  </p>
                  <p className="text-xs text-blue-700">
                    {minutesToHoursHint(totalMinutes) || '0h 0m'}
                  </p>
                </div>
              </div>
            </section>

            {/* Overall Remarks */}
            <section className="mmt-card p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="mmt-icon">
                  <FiFileText size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    Overall Remarks
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Add any additional notes about today's plan.
                  </p>
                </div>
              </div>

              <textarea
                rows={3}
                className="mmt-input resize-y"
                placeholder="Overall remarks for today's plan (optional)"
                {...register('remarks')}
              />
            </section>

            {/* Action Buttons */}
            <section className="flex flex-wrap gap-3 justify-end mmt-actions">
              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit((v) => onSave(v, false))}
                className="mmt-secondary"
              >
                <FiSave className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit((v) => onSave(v, true))}
                className="mmt-primary"
              >
                <FiSend className="h-4 w-4" />
                {saving
                  ? 'Submitting...'
                  : existingReport
                    ? 'Update Submission'
                    : 'Submit Morning Update'}
              </button>
            </section>

          </form>
        )}
      </div>
    </>
  );
}
