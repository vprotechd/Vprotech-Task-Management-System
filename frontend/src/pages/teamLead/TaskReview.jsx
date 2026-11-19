
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  FiUsers,
  FiSearch,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiEye,
  FiRefreshCw,
  FiUser,
  FiCheckCircle,
  FiArrowUpRight,
  FiBriefcase,
  FiUserCheck,
  FiUsers as FiTeam,
  FiX,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import DataTable from '../../components/DataTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import StatusBadge from '../../components/StatusBadge';
import { resolveAssetUrl } from '../../utils/format';

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? {};
}

function getUsers(response) {
  const payload = unwrapResponse(response);

  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload)) return payload;

  return [];
}

function getEmployeeId(employee) {
  return employee?._id || employee?.id || null;
}

const styles = `
.me-page {
  animation: meFadeIn .45s ease both;
}

@keyframes meFadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.me-hero {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  color: white;
  background: linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
  box-shadow: 0 12px 30px rgba(15,35,70,.13);
}

.me-hero::before {
  content: "";
  position: absolute;
  width: 270px;
  height: 270px;
  right: -65px;
  top: -155px;
  border-radius: 50%;
  background: rgba(56,189,248,.19);
}

.me-hero::after {
  content: "";
  position: absolute;
  width: 200px;
  height: 200px;
  right: 180px;
  bottom: -160px;
  border-radius: 50%;
  background: rgba(99,102,241,.2);
}

.me-hero-content {
  position: relative;
  z-index: 1;
}

.me-card {
  background: white;
  border: 1px solid #e6ecf5;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(15,35,70,.045);
  transition: transform .2s ease, box-shadow .2s ease;
}

.me-stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(15,35,70,.075);
}

.me-icon-box {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: #eaf6ff;
  color: #0284c7;
}

.me-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.28);
  background: rgba(255,255,255,.1);
  color: white;
  font-size: 13px;
  font-weight: 600;
  transition: background .2s ease;
}

.me-refresh:hover:not(:disabled) {
  background: rgba(255,255,255,.2);
}

.me-refresh:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.me-search-wrap {
  position: relative;
}

.me-search {
  width: 100%;
  padding: 12px 42px;
  border: 1px solid #dce5f0;
  border-radius: 11px;
  background: #f8fafc;
  color: #1e293b;
  font-size: 13px;
  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}

.me-search:focus {
  border-color: #38bdf8;
  background: white;
  box-shadow: 0 0 0 3px rgba(14,165,233,.12);
}

.me-search::placeholder {
  color: #94a3b8;
}

.me-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.me-clear {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  border-radius: 7px;
  color: #64748b;
}

.me-clear:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.me-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 17px;
}

.me-avatar {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg,#e0f2fe,#e0e7ff);
  color: #1d4ed8;
  font-size: 15px;
  font-weight: 750;
  border: 1px solid #dbeafe;
}

.me-view-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border: 1px solid #dbeafe;
  border-radius: 9px;
  color: #0369a1;
  background: #f0f9ff;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
  transition: all .2s ease;
}

.me-view-btn:hover {
  border-color: #7dd3fc;
  background: #e0f2fe;
  color: #1d4ed8;
}

.me-info {
  background: linear-gradient(110deg,#eff8ff,#f0f5ff);
  border: 1px solid #dbeafe;
  border-radius: 12px;
}

@media (max-width: 640px) {
  .me-hero {
    border-radius: 14px;
  }

  .me-table-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .me-page, .me-card, .me-stat-card, .me-refresh,
  .me-search, .me-view-btn {
    animation: none !important;
    transition: none !important;
  }
}
`;

export default function MyEmployees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const loadEmployees = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await axiosClient.get('/users', {
        params: {
          role: 'employee',
          status: 'active',
          page: 1,
          limit: 100,
        },
      });

      const users = getUsers(response);

      const employeeUsers = users.filter(
        (user) => !user?.role || user.role === 'employee'
      );

      setEmployees(employeeUsers);
    } catch (err) {
      console.error('My Employees Error:', err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        err?.message ||
        'Failed to load employees.';

      setError(message);
      setEmployees([]);

      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const searchText = search.trim().toLowerCase();

  const filteredEmployees = useMemo(() => {
    if (!searchText) {
      return employees;
    }

    return employees.filter((employee) => {
      const fullName = employee?.fullName?.toLowerCase() || '';
      const employeeCode = employee?.employeeCode?.toLowerCase() || '';
      const email = employee?.email?.toLowerCase() || '';
      const phone = employee?.phone?.toLowerCase() || '';
      const designation = employee?.designation?.toLowerCase() || '';
      const department = employee?.department?.name?.toLowerCase() || '';
      const departmentCode = employee?.department?.code?.toLowerCase() || '';

      return (
        fullName.includes(searchText) ||
        employeeCode.includes(searchText) ||
        email.includes(searchText) ||
        phone.includes(searchText) ||
        designation.includes(searchText) ||
        department.includes(searchText) ||
        departmentCode.includes(searchText)
      );
    });
  }, [employees, searchText]);

  const handleViewEmployee = useCallback(
    (employee) => {
      const id = getEmployeeId(employee);

      if (!id) {
        toast.error(
          'Employee ID is missing. Please refresh the employee list.'
        );
        return;
      }

      navigate(`/team-lead/employees/${id}`);
    },
    [navigate]
  );

  const columns = useMemo(
    () => [
      {
        key: 'employee',
        label: 'Employee',
        render: (row) => {
          const imageUrl = row?.profileImage
            ? resolveAssetUrl(row.profileImage)
            : null;

          return (
            <div className="flex items-center gap-3 min-w-[220px]">
              <div className="relative flex-shrink-0">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={row?.fullName || 'Employee'}
                    className="me-avatar object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                      event.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                )}

                <div
                  className={`me-avatar ${
                    imageUrl ? 'hidden' : ''
                  }`}
                >
                  {row?.fullName?.charAt(0)?.toUpperCase() || 'E'}
                </div>
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">
                  {row?.fullName || 'Unknown Employee'}
                </p>

                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {row?.employeeCode || 'No employee code'}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: 'email',
        label: 'Email',
        render: (row) => (
          <div className="flex items-center gap-2 min-w-[220px]">
            <FiMail className="h-4 w-4 text-slate-400 shrink-0" />
            <span
              className="text-sm text-slate-600 truncate"
              title={row?.email || ''}
            >
              {row?.email || '-'}
            </span>
          </div>
        ),
      },
      {
        key: 'phone',
        label: 'Phone',
        render: (row) => (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <FiPhone className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-600">
              {row?.phone || '-'}
            </span>
          </div>
        ),
      },
      {
        key: 'designation',
        label: 'Designation',
        render: (row) => (
          <div className="flex items-center gap-2 min-w-[150px]">
            <FiBriefcase className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-600">
              {row?.designation || 'Employee'}
            </span>
          </div>
        ),
      },
      {
        key: 'department',
        label: 'Department',
        render: (row) => (
          <div className="flex items-center gap-2">
            <FiBriefcase className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-600">
              {row?.department?.name ||
                row?.department?.code ||
                '-'}
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => (
          <StatusBadge status={row?.status || 'active'} />
        ),
      },
      {
        key: 'actions',
        label: 'Action',
        render: (row) => (
          <button
            type="button"
            className="me-view-btn"
            onClick={(event) => {
              event.stopPropagation();
              handleViewEmployee(row);
            }}
          >
            <FiEye className="h-4 w-4" />
            View
            <FiArrowUpRight className="h-3.5 w-3.5" />
          </button>
        ),
      },
    ],
    [handleViewEmployee]
  );

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee?.status === 'active'
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee?.status !== 'active'
  ).length;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <LoadingSpinner full label="Loading employees..." />
      </>
    );
  }

  if (error) {
    return (
      <div className="me-page max-w-7xl mx-auto space-y-5">
        <style>{styles}</style>

        <div className="me-hero p-6 sm:p-7">
          <div className="me-hero-content">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
                <FiUsers className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase text-sky-200">
                Team Management
              </span>
            </div>

            <h1 className="text-2xl font-bold">My Employees</h1>
            <p className="text-sm text-blue-100/80 mt-1">
              View and manage employees assigned to your team.
            </p>
          </div>
        </div>

        <div className="me-card p-6">
          <ErrorState
            message={error}
            onRetry={() => loadEmployees()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="me-page max-w-7xl mx-auto space-y-5">
      <style>{styles}</style>

      {/* Hero */}
      <div className="me-hero p-5 sm:p-7">
        <div className="me-hero-content flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15">
                <FiUsers className="w-5 h-5" />
              </span>

              <span className="text-xs font-semibold tracking-widest uppercase text-sky-200">
                Team Management
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              My Employees
            </h1>

            <p className="text-sm text-blue-100/80 mt-2 max-w-xl">
              View your team members, check their contact information,
              and access individual employee details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadEmployees(true)}
            disabled={refreshing}
            className="me-refresh"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Refreshing...' : 'Refresh Employees'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="me-card me-stat-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Total Employees
              </p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {totalEmployees}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Employees in your team
              </p>
            </div>

            <div className="me-icon-box">
              <FiUsers className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="me-card me-stat-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Active Employees
              </p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {activeEmployees}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Currently active
              </p>
            </div>

            <div className="h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="me-card me-stat-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Inactive Employees
              </p>
              <p className="text-3xl font-bold text-slate-600 mt-2">
                {inactiveEmployees}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Not currently active
              </p>
            </div>

            <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <FiUser className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <section className="me-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="me-icon-box !w-9 !h-9 !rounded-lg">
            <FiSearch className="w-4 h-4" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Find an Employee
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Search by employee details
            </p>
          </div>
        </div>

        <div className="me-search-wrap">
          <FiSearch className="me-search-icon w-4 h-4" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, ID, email, phone, designation or department..."
            className="me-search"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="me-clear"
              aria-label="Clear search"
              title="Clear search"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

      {/* Employee table */}
      <section className="me-card p-4 sm:p-5">
        <div className="me-table-header">
          <div className="flex items-center gap-3">
            <div className="me-icon-box">
              <FiTeam className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800">
                Team Employees
              </h2>

              <p className="text-xs text-slate-400 mt-0.5">
                {search
                  ? `${filteredEmployees.length} employee(s) found`
                  : `${employees.length} employee(s)`}
              </p>
            </div>
          </div>

          {search && (
            <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-100 rounded-full px-3 py-1.5">
              Search active
            </span>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={filteredEmployees}
          loading={false}
          error={null}
          onRetry={() => loadEmployees()}
          onRowClick={handleViewEmployee}
          emptyTitle={
            search
              ? 'No employees found'
              : 'No employees assigned'
          }
          emptyDescription={
            search
              ? 'Try a different name, employee ID, email or designation.'
              : 'Employees assigned to your team will appear here.'
          }
        />
      </section>

      {/* Information */}
      <div className="me-info p-4 flex items-start gap-3">
        <FiCheckCircle className="w-5 h-5 text-sky-700 mt-0.5 shrink-0" />

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Employee information
          </p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Select an employee or use the View button to open their
            detailed profile and task information.
          </p>
        </div>
      </div>
    </div>
  );
}
