
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiSend,
  FiRefreshCw,
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiUsers,
  FiClipboard,
  FiClock,
  FiCheckCircle,
  FiUserCheck,
  FiAlertCircle,
  FiTarget,
  FiX,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import { hoursToMinutes, todayISO } from '../../utils/format';

const emptyTask = () => ({
  title: '',
  description: '',
  priority: 'Medium',
  expectedCompletion: '',
  estimatedTimeHours: '',
  remarks: '',
});

const styles = `
.at-page {
  animation: atFadeIn .45s ease both;
}

@keyframes atFadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.at-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
  border-radius: 18px;
  color: white;
  box-shadow: 0 12px 30px rgba(15,35,70,.13);
}

.at-hero::before {
  content: "";
  position: absolute;
  width: 280px;
  height: 280px;
  right: -70px;
  top: -160px;
  border-radius: 50%;
  background: rgba(56,189,248,.19);
  filter: blur(2px);
}

.at-hero::after {
  content: "";
  position: absolute;
  width: 220px;
  height: 220px;
  right: 150px;
  bottom: -180px;
  border-radius: 50%;
  background: rgba(99,102,241,.22);
}

.at-hero-content {
  position: relative;
  z-index: 1;
}

.at-card {
  background: #fff;
  border: 1px solid #e6ecf5;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(15,35,70,.045);
  transition: box-shadow .2s ease, transform .2s ease;
}

.at-card:hover {
  box-shadow: 0 9px 24px rgba(15,35,70,.075);
}

.at-section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #0284c7;
  background: #eaf6ff;
  flex-shrink: 0;
}

.at-label {
  display: block;
  color: #334155;
  font-size: 13px;
  font-weight: 650;
  margin-bottom: 7px;
}

.at-input {
  width: 100%;
  border: 1px solid #dce5f0;
  background: #f8fafc;
  color: #1e293b;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}

.at-input:focus {
  border-color: #38bdf8;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(14,165,233,.12);
}

.at-input::placeholder {
  color: #94a3b8;
}

.at-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 19px;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 650;
  background: linear-gradient(135deg,#0ea5e9,#4f46e5);
  box-shadow: 0 4px 12px rgba(14,165,233,.2);
  transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
}

.at-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 7px 17px rgba(14,165,233,.28);
}

.at-primary:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.at-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #dce5f0;
  color: #475569;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  transition: background .2s ease;
}

.at-secondary:hover:not(:disabled) {
  background: #f1f5f9;
}

.at-secondary:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.at-task-card {
  border: 1px solid #e2eaf4;
  border-radius: 14px;
  padding: 18px;
  background: linear-gradient(145deg,#ffffff,#fbfdff);
  transition: border-color .2s ease, box-shadow .2s ease;
}

.at-task-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 5px 16px rgba(30,64,175,.055);
}

.at-employee-list {
  border: 1px solid #dce5f0;
  background: #f8fafc;
  border-radius: 11px;
  padding: 9px;
  max-height: 190px;
  overflow-y: auto;
}

.at-employee-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s ease;
}

.at-employee-item:hover {
  background: #eff6ff;
}

.at-employee-item input {
  width: 16px;
  height: 16px;
  accent-color: #0284c7;
  cursor: pointer;
  flex-shrink: 0;
}

.at-info {
  background: linear-gradient(110deg,#eff8ff,#f0f5ff);
  border: 1px solid #dbeafe;
  border-radius: 12px;
}

.at-priority {
  border-radius: 20px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
}

.at-priority-low { color: #047857; background: #d1fae5; }
.at-priority-medium { color: #0369a1; background: #e0f2fe; }
.at-priority-high { color: #b45309; background: #fef3c7; }
.at-priority-urgent { color: #b91c1c; background: #fee2e2; }

.at-add-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #bae6fd;
  background: #f0f9ff;
  color: #0369a1;
  border-radius: 9px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 650;
  transition: background .2s ease;
}

.at-add-button:hover {
  background: #e0f2fe;
}

.at-remove-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  color: #dc2626;
  background: #fff1f2;
  transition: background .2s ease;
}

.at-remove-button:hover {
  background: #ffe4e6;
}

@media (max-width: 640px) {
  .at-hero {
    border-radius: 14px;
  }
  .at-task-card {
    padding: 13px;
  }
  .at-actions {
    flex-direction: column-reverse;
  }
  .at-actions button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .at-page, .at-card, .at-primary, .at-input,
  .at-task-card, .at-employee-item {
    animation: none !important;
    transition: none !important;
  }
}
`;

export default function AssignTask() {
  const [date, setDate] = useState(todayISO());
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employeeIds, setEmployeeIds] = useState([]);
  const [tasks, setTasks] = useState([emptyTask()]);

  const loadEmployees = async () => {
    setLoadingEmployees(true);

    try {
      const response = await axiosClient.get('/users', {
        params: {
          role: 'employee',
          status: 'active',
          limit: 100,
        },
      });

      const data = response?.data?.data ?? response?.data ?? {};

      const list =
        data?.users ||
        data?.employees ||
        data?.results ||
        [];

      setEmployees(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Load employees error:', err);

      toast.error(
        err?.response?.data?.message ||
          'Failed to load employees.'
      );

      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const toggleEmployee = (id) => {
    setEmployeeIds((previous) =>
      previous.includes(id)
        ? previous.filter((existing) => existing !== id)
        : [...previous, id]
    );
  };

  const toggleSelectAllEmployees = () => {
    setEmployeeIds((previous) =>
      previous.length === employees.length
        ? []
        : employees.map((e) => e._id || e.id)
    );
  };

  const updateTask = (index, field, value) => {
    setTasks((previous) =>
      previous.map((task, i) =>
        i === index ? { ...task, [field]: value } : task
      )
    );
  };

  const addTaskRow = () => {
    setTasks((previous) => [...previous, emptyTask()]);
  };

  const removeTaskRow = (index) => {
    setTasks((previous) =>
      previous.length > 1
        ? previous.filter((_, i) => i !== index)
        : previous
    );
  };

  const resetForm = () => {
    setEmployeeIds([]);
    setTasks([emptyTask()]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (employeeIds.length === 0) {
      toast.error('Please select at least one employee.');
      return;
    }

    const cleanedTasks = tasks
      .map((t) => ({ ...t, title: t.title.trim() }))
      .filter((t) => t.title);

    if (cleanedTasks.length === 0) {
      toast.error('Please enter at least one task with a title.');
      return;
    }

    for (const t of cleanedTasks) {
      const hours = Number(t.estimatedTimeHours);
      if (!Number.isFinite(hours) || hours < 0.01 || hours > 24) {
        toast.error(
          `Enter an estimated time between 0.01 and 24 hours for "${t.title}".`
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const assignAllTasksForEmployee = async (employeeId) => {
        const outcomes = [];

        for (const t of cleanedTasks) {
          try {
            await axiosClient.post('/tasks/assign', {
              date,
              employeeId,
              title: t.title,
              description: t.description.trim(),
              priority: t.priority,
              expectedCompletion: t.expectedCompletion.trim(),
              estimatedTimeMinutes: hoursToMinutes(t.estimatedTimeHours),
              remarks: t.remarks.trim(),
            });

            outcomes.push({ status: 'fulfilled' });
          } catch (error) {
            outcomes.push({ status: 'rejected', reason: error });
          }
        }

        return outcomes;
      };

      const perEmployeeResults = await Promise.all(
        employeeIds.map(assignAllTasksForEmployee)
      );

      const results = perEmployeeResults.flat();

      const failed = results.filter((r) => r.status === 'rejected');
      const succeeded = results.length - failed.length;

      if (failed.length === 0) {
        toast.success(
          `${succeeded} task${succeeded === 1 ? '' : 's'} assigned successfully.`
        );
        resetForm();
      } else if (succeeded === 0) {
        const firstError =
          failed[0]?.reason?.response?.data?.message ||
          'Failed to assign tasks.';

        toast.error(firstError);
      } else {
        toast.warning(
          `${succeeded} of ${results.length} task assignments succeeded. ${failed.length} failed - check the affected employees and try again.`
        );
      }
    } catch (err) {
      console.error('Assign task error:', err);

      toast.error(
        err?.response?.data?.message ||
          'Failed to assign tasks.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = employeeIds.length;

  return (
    <div className="at-page space-y-5">
      <style>{styles}</style>

      {/* Hero */}
      <div className="at-hero p-5 sm:p-7">
        <div className="at-hero-content flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15">
                <FiClipboard className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold tracking-widest uppercase text-sky-200">
                Task Management
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Assign Tasks
            </h1>

            <p className="text-sm text-blue-100/80 mt-2 leading-relaxed">
              Create and distribute daily tasks to your team.
              Select multiple employees and assign multiple tasks in one go.
            </p>
          </div>

          <button
            type="button"
            onClick={loadEmployees}
            disabled={loadingEmployees}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-medium hover:bg-white/20 disabled:opacity-50 transition"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loadingEmployees ? 'animate-spin' : ''}`}
            />
            Refresh Employees
          </button>
        </div>
      </div>

      {/* Quick information */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="at-card p-4 flex items-center gap-3">
          <div className="at-section-icon">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Selected Employees</p>
            <p className="text-xl font-bold text-slate-800">
              {selectedCount}
            </p>
          </div>
        </div>

        <div className="at-card p-4 flex items-center gap-3">
          <div className="at-section-icon">
            <FiClipboard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Task Entries</p>
            <p className="text-xl font-bold text-slate-800">
              {tasks.length}
            </p>
          </div>
        </div>

        <div className="at-card p-4 flex items-center gap-3">
          <div className="at-section-icon">
            <FiCalendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Assignment Date</p>
            <p className="text-sm font-bold text-slate-800 mt-1">
              {date || 'Not selected'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Assignment details */}
        <section className="at-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="at-section-icon">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Assignment Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the working date and team members
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date */}
            <div>
              <label className="at-label">
                Task Date <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  max={todayISO()}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="at-input pl-10"
                  required
                />
              </div>

              <p className="text-xs text-slate-400 mt-1.5">
                Select the date for which tasks should be assigned.
              </p>
            </div>

            {/* Employee selection */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="at-label mb-0">
                  Select Employees <span className="text-red-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={toggleSelectAllEmployees}
                  disabled={loadingEmployees || employees.length === 0}
                  className="text-xs font-semibold text-sky-700 hover:text-indigo-700 disabled:opacity-40"
                >
                  {selectedCount === employees.length && employees.length > 0
                    ? 'Clear all'
                    : 'Select all'}
                </button>
              </div>

              <div className="at-employee-list">
                {loadingEmployees ? (
                  <div className="flex items-center gap-2 py-3 px-2 text-sm text-slate-500">
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    Loading employees...
                  </div>
                ) : employees.length === 0 ? (
                  <div className="flex items-center gap-2 py-3 px-2 text-sm text-slate-500">
                    <FiAlertCircle className="w-4 h-4" />
                    No active employees found.
                  </div>
                ) : (
                  employees.map((employee) => {
                    const id = employee._id || employee.id;

                    return (
                      <label key={id} className="at-employee-item">
                        <input
                          type="checkbox"
                          checked={employeeIds.includes(id)}
                          onChange={() => toggleEmployee(id)}
                        />

                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-sky-700 flex-shrink-0">
                          <FiUserCheck className="w-4 h-4" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-700 truncate">
                            {employee.fullName || employee.name || 'Unknown Employee'}
                          </span>

                          {employee.employeeCode && (
                            <span className="block text-xs text-slate-400 mt-0.5">
                              ID: {employee.employeeCode}
                            </span>
                          )}
                        </span>

                        {employeeIds.includes(id) && (
                          <FiCheckCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
                        )}
                      </label>
                    );
                  })
                )}
              </div>

              {selectedCount > 0 && (
                <div className="flex items-center gap-2 mt-2 text-xs font-medium text-sky-700">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  {selectedCount} employee{selectedCount === 1 ? '' : 's'} selected
                </div>
              )}
            </div>
          </div>

          <div className="at-info p-3 flex items-start gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-sky-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Every task added below will be assigned to each selected employee.
              Please review the employee selection before submitting.
            </p>
          </div>
        </section>

        {/* Tasks section */}
        <section className="at-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="at-section-icon">
                <FiClipboard className="w-5 h-5" />
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Task Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add the tasks you want to assign
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addTaskRow}
              className="at-add-button"
            >
              <FiPlus className="w-4 h-4" />
              Add Another Task
            </button>
          </div>

          <div className="space-y-4">
            {tasks.map((task, idx) => (
              <div key={idx} className="at-task-card space-y-4">
                {/* Task heading */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-100 text-sky-700 text-sm font-bold">
                      {idx + 1}
                    </span>

                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Task #{idx + 1}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Task information and requirements
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`at-priority at-priority-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>

                    {tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTaskRow(idx)}
                        className="at-remove-button"
                        aria-label={`Remove task ${idx + 1}`}
                        title="Remove task"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="at-label">
                      Task Title <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) =>
                        updateTask(idx, 'title', e.target.value)
                      }
                      className="at-input"
                      placeholder="Enter task title"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="at-label">
                      Description
                    </label>

                    <textarea
                      value={task.description}
                      onChange={(e) =>
                        updateTask(idx, 'description', e.target.value)
                      }
                      className="at-input min-h-[95px] resize-y"
                      placeholder="Describe the task and expected work..."
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="at-label">
                      Priority
                    </label>

                    <select
                      value={task.priority}
                      onChange={(e) =>
                        updateTask(idx, 'priority', e.target.value)
                      }
                      className="at-input"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Estimated time */}
                  <div>
                    <label className="at-label">
                      Estimated Time (hours) <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <FiClock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="number"
                        min="0.01"
                        max="24"
                        step="0.01"
                        value={task.estimatedTimeHours}
                        onChange={(e) =>
                          updateTask(idx, 'estimatedTimeHours', e.target.value)
                        }
                        className="at-input pl-10"
                        placeholder="e.g. 1.5"
                      />
                    </div>
                  </div>

                  {/* Expected completion */}
                  <div>
                    <label className="at-label">
                      Expected Completion
                    </label>

                    <div className="relative">
                      <FiTarget className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={task.expectedCompletion}
                        onChange={(e) =>
                          updateTask(idx, 'expectedCompletion', e.target.value)
                        }
                        className="at-input pl-10"
                        placeholder="e.g. By 4 PM / EOD"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="at-label">
                      Remarks
                    </label>

                    <input
                      type="text"
                      value={task.remarks}
                      onChange={(e) =>
                        updateTask(idx, 'remarks', e.target.value)
                      }
                      className="at-input"
                      placeholder="Optional remarks"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="at-info p-3 flex items-start gap-2.5">
            <FiAlertCircle className="w-4 h-4 text-sky-700 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter each task’s estimated time in hours (0.01 to 24). Decimal
              values such as 1.5 hours are supported.
            </p>
          </div>
        </section>

        {/* Assignment summary */}
        <section className="at-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="at-section-icon">
              <FiCheckCircle className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">
                Assignment Summary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review before assigning tasks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Selected Employees</p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {selectedCount}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Task Entries</p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                {tasks.length}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Total Assignments</p>
              <p className="text-lg font-bold text-sky-700 mt-1">
                {selectedCount * tasks.filter((t) => t.title.trim()).length}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            Total assignments are calculated from selected employees and tasks with titles.
          </p>
        </section>

        {/* Actions */}
        <div className="at-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 at-actions">
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting}
            className="at-secondary"
          >
            <FiX className="w-4 h-4" />
            Clear Form
          </button>

          <button
            type="submit"
            disabled={submitting || loadingEmployees}
            className="at-primary"
          >
            {submitting ? (
              <>
                <FiRefreshCw className="w-4 h-4 animate-spin" />
                Assigning Tasks...
              </>
            ) : (
              <>
                <FiSend className="w-4 h-4" />
                Assign Tasks
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
