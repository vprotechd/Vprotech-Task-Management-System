
import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiArrowLeft,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowUpRight,
  FiClipboard
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { formatDateLabel, resolveAssetUrl } from '../../utils/format';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadEmployee = async () => {
      setLoading(true);

      try {
        const [employeeResponse, reportsResponse] =
          await Promise.all([
            axiosClient.get(`/users/${id}`),
            axiosClient.get('/tasks', {
              params: {
                employeeId: id,
                limit: 100,
              },
            }),
          ]);

        if (!mounted) return;

        const employeeData =
          employeeResponse?.data?.user ||
          employeeResponse?.data?.data?.user ||
          null;

        const reportData =
          reportsResponse?.data?.reports ||
          reportsResponse?.data?.data?.reports ||
          [];

        setEmployee(employeeData);
        setReports(Array.isArray(reportData) ? reportData : []);
      } catch (err) {
        if (!mounted) return;

        console.error('Employee Detail Error:', err);

        const message =
          err?.response?.data?.message ||
          err?.response?.data?.data?.message ||
          'Failed to load employee details.';

        toast.error(message);

        setEmployee(null);
        setReports([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadEmployee();
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  // Flatten all morning tasks from all daily reports
  const tasks = useMemo(() => {
    const result = [];

    reports.forEach((report) => {
      const morningTasks = Array.isArray(report?.morning?.tasks)
        ? report.morning.tasks
        : [];

      const eveningTasks = Array.isArray(report?.evening?.tasks)
        ? report.evening.tasks
        : [];

      const eveningMap = new Map(
        eveningTasks.map((task) => [
          String(task?.taskRef || task?._id || ''),
          task,
        ])
      );

      morningTasks.forEach((task, index) => {
        const taskId =
          task?._id ||
          task?.id ||
          `${report?._id}-${index}`;

        const completion =
          eveningMap.get(String(task?._id || ''));

        result.push({
          ...task,
          frontendId: `${report?._id}-${taskId}`,
          reportId: report?._id,
          employee: report?.employee,
          taskDate: report?.taskDate,
          reportStatus: report?.status,
          completion: completion || null,
          completionStatus:
            completion?.status || 'Pending',
          completionPercentage:
            completion?.completionPercentage ?? 0,
          actualTimeSpentMinutes:
            completion?.actualTimeSpentMinutes ?? 0,
          completionRemarks:
            completion?.remarks || '',
        });
      });
    });

    return result.sort(
      (a, b) =>
        new Date(b.taskDate || 0) -
        new Date(a.taskDate || 0)
    );
  }, [reports]);

  // Statistics
  const statistics = useMemo(() => {
    const total = tasks.length;

    const completed = tasks.filter(
      (task) =>
        task.completionStatus === 'Completed'
    ).length;

    const partial = tasks.filter(
      (task) =>
        task.completionStatus === 'Partially Completed'
    ).length;

    const notCompleted = tasks.filter(
      (task) =>
        task.completionStatus === 'Not Completed'
    ).length;

    const pending = tasks.filter(
      (task) =>
        !task.completion ||
        task.completionStatus === 'Pending'
    ).length;

    return {
      total,
      completed,
      partial,
      notCompleted,
      pending,
    };
  }, [tasks]);

  // Loading
  if (loading) {
    return (
      <div className="ed-loading">
        <LoadingSpinner full label="Loading employee..." />
      </div>
    );
  }

  // Not found
  if (!employee) {
    return (
      <div className="ed-page">
        <style>{`
          .ed-page {
            max-width: 1100px;
            margin: 0 auto;
            padding-bottom: 30px;
          }

          .ed-not-found {
            padding: 35px;
            border: 1px solid #e6ecf5;
            border-radius: 16px;
            background: white;
            box-shadow: 0 5px 18px rgba(15,27,51,.045);
          }

          .ed-back-link {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            color: #2563eb;
            font-size: 13px;
            font-weight: 650;
            text-decoration: none;
          }
        `}</style>

        <div className="ed-not-found">
          <p className="text-navy-500">
            Employee details could not be loaded.
          </p>

          <Link
            to="/team-lead/employees"
            className="ed-back-link mt-4"
          >
            <FiArrowLeft />
            Back to My Employees
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-page">
      <style>{`
        .ed-page {
          width: 100%;
          max-width: 1150px;
          margin: 0 auto;
          padding-bottom: 30px;
          color: #172b4d;
          animation: edFadeIn .45s ease both;
        }

        @keyframes edFadeIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ed-hero {
          position: relative;
          overflow: hidden;
          padding: 25px 27px;
          border-radius: 18px;
          color: white;
          background:
            radial-gradient(circle at 90% 10%, rgba(56,189,248,.24), transparent 30%),
            radial-gradient(circle at 5% 100%, rgba(99,102,241,.22), transparent 35%),
            linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
          box-shadow: 0 12px 28px rgba(15,27,51,.14);
        }

        .ed-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
        }

        .ed-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 17px;
          color: #dbeafe;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: color .2s ease;
        }

        .ed-back:hover {
          color: white;
        }

        .ed-hero-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 0;
          font-size: 23px;
          font-weight: 750;
          letter-spacing: -.5px;
        }

        .ed-hero-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 14px;
          background: rgba(255,255,255,.12);
          font-size: 22px;
        }

        .ed-hero-description {
          margin: 9px 0 0 59px;
          color: #dbeafe;
          font-size: 13px;
          line-height: 1.6;
        }

        .ed-hero-count {
          padding: 11px 15px;
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 11px;
          background: rgba(255,255,255,.1);
          color: #e0f2fe;
          font-size: 12px;
          font-weight: 600;
        }

        .ed-hero-count strong {
          color: white;
          font-size: 19px;
          margin-right: 5px;
        }

        .ed-profile {
          display: flex;
          align-items: center;
          gap: 21px;
          padding: 23px;
          margin-top: 19px;
          border: 1px solid #e6ecf5;
          border-radius: 16px;
          background: white;
          box-shadow: 0 5px 18px rgba(15,27,51,.045);
        }

        .ed-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 92px;
          height: 92px;
          flex-shrink: 0;
          overflow: hidden;
          border: 4px solid #eff6ff;
          border-radius: 22px;
          background: linear-gradient(135deg,#e0f2fe,#e0e7ff);
          color: #2563eb;
          font-size: 35px;
        }

        .ed-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ed-profile-content {
          flex: 1;
          min-width: 0;
        }

        .ed-profile-name-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ed-profile-name {
          margin: 0;
          color: #172b4d;
          font-size: 21px;
          font-weight: 750;
          letter-spacing: -.3px;
        }

        .ed-profile-subtitle {
          margin-top: 5px;
          color: #8493a8;
          font-size: 13px;
        }

        .ed-profile-details {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 20px;
          margin-top: 14px;
        }

        .ed-detail-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #64748b;
          font-size: 12px;
        }

        .ed-detail-item svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .ed-department {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 650;
        }

        .ed-stats {
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          gap: 14px;
          margin-top: 19px;
        }

        .ed-stat {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 17px 15px;
          border: 1px solid #e6ecf5;
          border-radius: 14px;
          background: white;
          box-shadow: 0 5px 18px rgba(15,27,51,.04);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .ed-stat:hover {
          transform: translateY(-3px);
          box-shadow: 0 9px 22px rgba(15,27,51,.07);
        }

        .ed-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 12px;
          font-size: 19px;
        }

        .ed-stat-icon.blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .ed-stat-icon.green {
          background: #ecfdf5;
          color: #059669;
        }

        .ed-stat-icon.yellow {
          background: #fffbeb;
          color: #d97706;
        }

        .ed-stat-icon.purple {
          background: #f5f3ff;
          color: #7c3aed;
        }

        .ed-stat-label {
          margin: 0 0 4px;
          color: #8493a8;
          font-size: 11px;
          font-weight: 600;
        }

        .ed-stat-value {
          margin: 0;
          color: #172b4d;
          font-size: 22px;
          font-weight: 750;
        }

        .ed-stat-caption {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 10px;
        }

        .ed-task-section {
          margin-top: 19px;
          overflow: hidden;
          border: 1px solid #e6ecf5;
          border-radius: 16px;
          background: white;
          box-shadow: 0 5px 18px rgba(15,27,51,.045);
        }

        .ed-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 19px 21px;
          border-bottom: 1px solid #eaf0f7;
        }

        .ed-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          color: #172b4d;
          font-size: 16px;
          font-weight: 750;
        }

        .ed-section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #eff8ff;
          color: #0284c7;
          font-size: 17px;
        }

        .ed-section-subtitle {
          margin: 4px 0 0 46px;
          color: #94a3b8;
          font-size: 12px;
        }

        .ed-task-count {
          padding: 7px 11px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
        }

        .ed-task-list {
          display: flex;
          flex-direction: column;
        }

        .ed-task {
          padding: 19px 21px;
          border-bottom: 1px solid #edf2f7;
          transition: background .2s ease;
        }

        .ed-task:last-child {
          border-bottom: none;
        }

        .ed-task:hover {
          background: #fbfdff;
        }

        .ed-task-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ed-task-main {
          flex: 1;
          min-width: 200px;
        }

        .ed-task-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .ed-task-title {
          margin: 0;
          color: #243650;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .ed-task-description {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.65;
        }

        .ed-task-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 9px 18px;
          margin-top: 12px;
        }

        .ed-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #8493a8;
          font-size: 11px;
        }

        .ed-meta-item svg {
          color: #94a3b8;
        }

        .ed-task-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 7px;
        }

        .ed-completion-text {
          color: #8493a8;
          font-size: 11px;
          font-weight: 600;
        }

        .ed-progress-track {
          height: 6px;
          width: 120px;
          overflow: hidden;
          margin-top: 5px;
          border-radius: 20px;
          background: #e2e8f0;
        }

        .ed-progress-fill {
          height: 100%;
          border-radius: 20px;
          background: linear-gradient(90deg,#0ea5e9,#4f46e5);
        }

        .ed-completion-panel {
          padding: 14px;
          margin-top: 15px;
          border: 1px solid #e6ecf5;
          border-radius: 11px;
          background: linear-gradient(135deg,#f8fafc,#f4f8ff);
        }

        .ed-completion-grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 14px;
        }

        .ed-completion-label {
          margin: 0 0 5px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 650;
          text-transform: uppercase;
          letter-spacing: .4px;
        }

        .ed-completion-value {
          margin: 0;
          color: #334b68;
          font-size: 13px;
          font-weight: 700;
        }

        .ed-remarks {
          padding-top: 12px;
          margin-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .ed-remarks p:last-child {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
        }

        .ed-report-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          padding: 7px 10px;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          background: #eff6ff;
          color: #2563eb;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          transition: background .2s ease, transform .2s ease;
        }

        .ed-report-link:hover {
          transform: translateY(-1px);
          background: #dbeafe;
        }

        .ed-empty {
          padding: 48px 20px;
          text-align: center;
        }

        .ed-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 65px;
          height: 65px;
          margin: 0 auto 15px;
          border-radius: 18px;
          background: #eff6ff;
          color: #60a5fa;
          font-size: 28px;
        }

        .ed-empty h4 {
          margin: 0;
          color: #334b68;
          font-size: 15px;
          font-weight: 700;
        }

        .ed-empty p {
          margin: 7px 0 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .ed-stats {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }
        }

        @media (max-width: 600px) {
          .ed-hero {
            padding: 20px 16px;
            border-radius: 14px;
          }

          .ed-hero-heading {
            font-size: 19px;
          }

          .ed-hero-description {
            margin-left: 0;
          }

          .ed-hero-count {
            width: 100%;
          }

          .ed-profile {
            align-items: flex-start;
            flex-direction: column;
            padding: 18px;
          }

          .ed-avatar {
            width: 76px;
            height: 76px;
            border-radius: 18px;
          }

          .ed-profile-name {
            font-size: 19px;
          }

          .ed-profile-details {
            flex-direction: column;
            gap: 9px;
          }

          .ed-stats {
            gap: 10px;
          }

          .ed-stat {
            padding: 13px 11px;
            gap: 9px;
          }

          .ed-stat-icon {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }

          .ed-stat-value {
            font-size: 19px;
          }

          .ed-section-header {
            padding: 16px;
          }

          .ed-task {
            padding: 16px;
          }

          .ed-task-status {
            align-items: flex-start;
            width: 100%;
          }

          .ed-completion-grid {
            grid-template-columns: 1fr 1fr;
          }

          .ed-progress-track {
            width: 100%;
          }
        }

        @media (max-width: 380px) {
          .ed-stats {
            grid-template-columns: 1fr;
          }

          .ed-completion-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ed-page {
            animation: none;
          }

          .ed-stat,
          .ed-task,
          .ed-report-link {
            transition: none;
          }
        }
      `}</style>

      {/* Hero */}
      <div className="ed-hero">
        <Link
          to="/team-lead/employees"
          className="ed-back"
        >
          <FiArrowLeft />
          Back to My Employees
        </Link>

        <div className="ed-hero-content">
          <div>
            <h2 className="ed-hero-heading">
              <span className="ed-hero-icon">
                <FiUsers />
              </span>
              Employee Details
            </h2>

            <p className="ed-hero-description">
              View employee information, daily tasks and work progress.
            </p>
          </div>

          <div className="ed-hero-count">
            <strong>{statistics.total}</strong>
            Total Planned Tasks
          </div>
        </div>
      </div>

      {/* Employee Profile */}
      <div className="ed-profile">
        <div className="ed-avatar">
          {employee.profileImage ? (
            <img
              src={resolveAssetUrl(employee.profileImage)}
              alt={employee.fullName || 'Employee'}
            />
          ) : (
            <FiUser />
          )}
        </div>

        <div className="ed-profile-content">
          <div className="ed-profile-name-row">
            <h2 className="ed-profile-name">
              {employee.fullName}
            </h2>

            <StatusBadge
              status={employee.status || 'active'}
            />
          </div>

          <p className="ed-profile-subtitle">
            {employee.employeeCode || '-'}
            {' · '}
            {employee.designation || 'Employee'}
          </p>

          <div className="ed-profile-details">
            <span className="ed-detail-item">
              <FiMail />
              {employee.email || '-'}
            </span>

            {employee.phone && (
              <span className="ed-detail-item">
                <FiPhone />
                {employee.phone}
              </span>
            )}

            {employee.department?.name && (
              <span className="ed-department">
                <FiBriefcase />
                {employee.department.name}
              </span>
            )}

            {employee.joiningDate && (
              <span className="ed-detail-item">
                <FiCalendar />
                Joined: {formatDateLabel(employee.joiningDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="ed-stats">
        <div className="ed-stat">
          <div className="ed-stat-icon blue">
            <FiFileText />
          </div>

          <div>
            <p className="ed-stat-label">Total Tasks</p>
            <p className="ed-stat-value">
              {statistics.total}
            </p>
            <p className="ed-stat-caption">Planned tasks</p>
          </div>
        </div>

        <div className="ed-stat">
          <div className="ed-stat-icon green">
            <FiCheckCircle />
          </div>

          <div>
            <p className="ed-stat-label">Completed</p>
            <p className="ed-stat-value">
              {statistics.completed}
            </p>
            <p className="ed-stat-caption">Fully completed</p>
          </div>
        </div>

        <div className="ed-stat">
          <div className="ed-stat-icon yellow">
            <FiClock />
          </div>

          <div>
            <p className="ed-stat-label">Pending</p>
            <p className="ed-stat-value">
              {statistics.pending}
            </p>
            <p className="ed-stat-caption">Awaiting update</p>
          </div>
        </div>

        <div className="ed-stat">
          <div className="ed-stat-icon purple">
            <FiCalendar />
          </div>

          <div>
            <p className="ed-stat-label">Reports</p>
            <p className="ed-stat-value">
              {reports.length}
            </p>
            <p className="ed-stat-caption">Daily reports</p>
          </div>
        </div>
      </div>

      {/* Employee Tasks */}
      <div className="ed-task-section">
        <div className="ed-section-header">
          <div>
            <h3 className="ed-section-title">
              <span className="ed-section-icon">
                <FiClipboard />
              </span>
              Employee Tasks
            </h3>

            <p className="ed-section-subtitle">
              All planned tasks assigned to {employee.fullName}
            </p>
          </div>

          <span className="ed-task-count">
            {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="ed-empty">
            <div className="ed-empty-icon">
              <FiFileText />
            </div>

            <h4>No tasks found</h4>

            <p>
              This employee has no planned tasks in the available
              daily reports.
            </p>
          </div>
        ) : (
          <div className="ed-task-list">
            {tasks.map((task) => (
              <div
                key={task.frontendId}
                className="ed-task"
              >
                <div className="ed-task-top">
                  <div className="ed-task-main">
                    <div className="ed-task-title-row">
                      <h4 className="ed-task-title">
                        {task.title || 'Untitled Task'}
                      </h4>

                      {task.priority && (
                        <StatusBadge status={task.priority} />
                      )}
                    </div>

                    {task.description && (
                      <p className="ed-task-description">
                        {task.description}
                      </p>
                    )}

                    <div className="ed-task-meta">
                      <span className="ed-meta-item">
                        <FiCalendar />
                        {task.taskDate
                          ? formatDateLabel(task.taskDate)
                          : '-'}
                      </span>

                      {task.estimatedTimeMinutes !== undefined && (
                        <span className="ed-meta-item">
                          <FiClock />
                          Estimated: {task.estimatedTimeMinutes} min
                        </span>
                      )}

                      {task.expectedCompletion && (
                        <span className="ed-meta-item">
                          <FiCalendar />
                          Expected: {task.expectedCompletion}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ed-task-status">
                    <StatusBadge
                      status={task.completionStatus || 'Pending'}
                    />

                    {task.completion && (
                      <div>
                        <span className="ed-completion-text">
                          {task.completionPercentage}% complete
                        </span>

                        <div className="ed-progress-track">
                          <div
                            className="ed-progress-fill"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, Number(task.completionPercentage) || 0)
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion Information */}
                {task.completion && (
                  <div className="ed-completion-panel">
                    <div className="ed-completion-grid">
                      <div>
                        <p className="ed-completion-label">
                          Completion
                        </p>

                        <p className="ed-completion-value">
                          {task.completionPercentage}%
                        </p>
                      </div>

                      <div>
                        <p className="ed-completion-label">
                          Actual Time
                        </p>

                        <p className="ed-completion-value">
                          {task.actualTimeSpentMinutes} minutes
                        </p>
                      </div>

                      <div>
                        <p className="ed-completion-label">
                          Report Status
                        </p>

                        <StatusBadge
                          status={task.reportStatus || 'pending'}
                        />
                      </div>
                    </div>

                    {task.completionRemarks && (
                      <div className="ed-remarks">
                        <p className="ed-completion-label">
                          Employee Remarks
                        </p>

                        <p>
                          {task.completionRemarks}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Open Daily Report */}
                {task.reportId && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/team-lead/review/${task.reportId}`
                      )
                    }
                    className="ed-report-link"
                  >
                    View Full Daily Report
                    <FiArrowUpRight />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
