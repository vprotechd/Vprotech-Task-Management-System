
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  FiUserPlus,
  FiUserX,
  FiUsers,
  FiSearch,
  FiFilter,
  FiUserCheck,
  FiUserMinus,
  FiMail,
  FiX,
  FiCheck,
  FiShield,
  FiBriefcase
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function MyEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const limit = 10;
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);

    try {
      const { data: res } = await axiosClient.get('/users', {
        params: {
          role: 'employee',
          page,
          limit,
          search: search || undefined,
          status: status || undefined
        }
      });

      setEmployees(res.data.users);
      setTotal(res.meta.total);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to load employees.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm();

  const onAddEmployee = async (values) => {
    try {
      await axiosClient.post('/users', {
        ...values,
        role: 'employee'
      });

      toast.success('Employee added.');
      setAddOpen(false);
      reset();
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Could not add employee.'
      );
    }
  };

  const doDeactivate = async () => {
    if (!confirmTarget) return;

    try {
      await axiosClient.patch(
        `/users/${confirmTarget.id}/deactivate`
      );

      toast.success('Employee deactivated.');
      setConfirmTarget(null);
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Action failed.'
      );
    }
  };

  const activeCount = employees.filter(
    (employee) => employee.status === 'active'
  ).length;

  const inactiveCount = employees.filter(
    (employee) => employee.status !== 'active'
  ).length;

  const columns = [
    {
      key: 'employeeCode',
      label: 'ID',
      render: (r) => (
        <span className="me-id">{r.employeeCode || '-'}</span>
      )
    },
    {
      key: 'fullName',
      label: 'Name',
      render: (r) => (
        <div className="me-name-cell">
          <div className="me-avatar">
            {r.fullName?.charAt(0)?.toUpperCase() || 'E'}
          </div>
          <span className="me-name">{r.fullName}</span>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (r) => (
        <span className="me-email">
          <FiMail />
          {r.email}
        </span>
      )
    },
    {
      key: 'designation',
      label: 'Designation',
      render: (r) => r.designation || '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'active' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmTarget({ id: r._id });
            }}
            className="me-deactivate-btn"
          >
            <FiUserX />
            Deactivate
          </button>
        ) : (
          <span className="me-admin-note">
            Contact admin to reactivate
          </span>
        )
    }
  ];

  return (
    <div className="me-page">
      <style>{`
        .me-page {
          width: 100%;
          padding-bottom: 30px;
          color: #172b4d;
          animation: meFadeIn .45s ease both;
        }

        @keyframes meFadeIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .me-hero {
          position: relative;
          overflow: hidden;
          padding: 27px 28px;
          border-radius: 18px;
          color: white;
          background:
            radial-gradient(circle at 90% 10%, rgba(56,189,248,.24), transparent 30%),
            radial-gradient(circle at 5% 100%, rgba(99,102,241,.22), transparent 35%),
            linear-gradient(135deg,#0f1b33 0%,#16305c 55%,#1d4a8a 100%);
          box-shadow: 0 12px 28px rgba(15,27,51,.14);
        }

        .me-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 18px;
        }

        .me-hero-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin: 0;
          font-size: 23px;
          font-weight: 750;
          letter-spacing: -.5px;
        }

        .me-hero-icon {
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

        .me-hero-description {
          margin: 9px 0 0 60px;
          color: #dbeafe;
          font-size: 13px;
          line-height: 1.6;
        }

        .me-hero-count {
          padding: 10px 15px;
          border: 1px solid rgba(255,255,255,.2);
          border-radius: 11px;
          background: rgba(255,255,255,.1);
          color: #e0f2fe;
          font-size: 13px;
          font-weight: 600;
        }

        .me-hero-count strong {
          color: #fff;
          font-size: 19px;
          margin-right: 5px;
        }

        .me-stats {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 15px;
          margin-top: 19px;
        }

        .me-stat-card {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px;
          border: 1px solid #e6ecf5;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(15,27,51,.04);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .me-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 9px 22px rgba(15,27,51,.07);
        }

        .me-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          border-radius: 12px;
          font-size: 19px;
        }

        .me-stat-icon.blue {
          background: #eff6ff;
          color: #2563eb;
        }

        .me-stat-icon.green {
          background: #ecfdf5;
          color: #059669;
        }

        .me-stat-icon.orange {
          background: #fff7ed;
          color: #ea580c;
        }

        .me-stat-label {
          margin: 0 0 4px;
          color: #8493a8;
          font-size: 12px;
          font-weight: 600;
        }

        .me-stat-value {
          margin: 0;
          color: #172b4d;
          font-size: 22px;
          font-weight: 750;
        }

        .me-card {
          margin-top: 19px;
          padding: 20px;
          border: 1px solid #e6ecf5;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 5px 18px rgba(15,27,51,.045);
        }

        .me-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .me-toolbar-left {
          display: flex;
          align-items: center;
          flex: 1;
          flex-wrap: wrap;
          gap: 11px;
          min-width: 0;
        }

        .me-search {
          width: min(100%,320px);
        }

        .me-search > * {
          width: 100%;
        }

        .me-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          padding: 0 11px;
          border: 1px solid #dce5f0;
          border-radius: 10px;
          background: #f8fafc;
          color: #718096;
        }

        .me-filter select {
          min-width: 105px;
          border: none;
          outline: none;
          background: transparent;
          color: #334b68;
          font-size: 13px;
          cursor: pointer;
        }

        .me-add-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 10px 17px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(120deg,#0ea5e9,#4f46e5);
          color: white;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 5px 13px rgba(59,130,246,.2);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .me-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 17px rgba(59,130,246,.28);
        }

        .me-table-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 17px;
        }

        .me-table-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0;
          color: #172b4d;
          font-size: 16px;
          font-weight: 700;
        }

        .me-table-title-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #eff8ff;
          color: #0284c7;
        }

        .me-results {
          color: #8493a8;
          font-size: 12px;
        }

        .me-name-cell {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .me-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border-radius: 10px;
          background: linear-gradient(135deg,#e0f2fe,#e0e7ff);
          color: #2563eb;
          font-size: 13px;
          font-weight: 750;
        }

        .me-name {
          color: #243650;
          font-weight: 650;
        }

        .me-id {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          color: #475569;
          font-size: 12px;
          font-weight: 650;
        }

        .me-email {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 12px;
        }

        .me-email svg {
          flex-shrink: 0;
          color: #94a3b8;
        }

        .me-deactivate-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border: 1px solid #fee2e2;
          border-radius: 7px;
          background: #fff7f7;
          color: #dc2626;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          transition: background .2s ease;
        }

        .me-deactivate-btn:hover {
          background: #fee2e2;
        }

        .me-admin-note {
          color: #94a3b8;
          font-size: 11px;
        }

        .me-pagination {
          margin-top: 16px;
        }

        .me-modal-form {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 15px;
        }

        .me-modal-field {
          min-width: 0;
        }

        .me-modal-field.full {
          grid-column: 1 / -1;
        }

        .me-modal-field label {
          display: block;
          margin-bottom: 7px;
          color: #52647d;
          font-size: 12px;
          font-weight: 650;
        }

        .me-modal-input {
          width: 100%;
          padding: 10px 11px;
          border: 1px solid #dce5f0;
          border-radius: 9px;
          outline: none;
          background: #f8fafc;
          color: #243650;
          font-size: 13px;
          transition: border-color .2s ease, box-shadow .2s ease;
        }

        .me-modal-input:focus {
          border-color: #38bdf8;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(14,165,233,.12);
        }

        .me-modal-input::placeholder {
          color: #a0aec0;
        }

        .me-modal-hint {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .me-modal-footer {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
        }

        .me-modal-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 39px;
          padding: 9px 15px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          transition: transform .2s ease;
        }

        .me-modal-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .me-modal-btn:disabled {
          cursor: not-allowed;
          opacity: .6;
        }

        .me-modal-cancel {
          border: 1px solid #dce5f0;
          background: #fff;
          color: #475569;
        }

        .me-modal-submit {
          border: none;
          background: linear-gradient(120deg,#0ea5e9,#4f46e5);
          color: #fff;
        }

        @media (max-width: 760px) {
          .me-hero {
            padding: 22px 19px;
          }

          .me-hero-heading {
            font-size: 20px;
          }

          .me-hero-description {
            margin-left: 0;
          }

          .me-stats {
            gap: 10px;
          }

          .me-stat-card {
            padding: 13px;
          }

          .me-toolbar {
            align-items: stretch;
          }

          .me-toolbar-left {
            width: 100%;
          }

          .me-search {
            flex: 1;
            min-width: 200px;
          }

          .me-add-btn {
            width: 100%;
          }

          .me-card {
            padding: 15px;
          }
        }

        @media (max-width: 520px) {
          .me-hero {
            padding: 19px 15px;
            border-radius: 14px;
          }

          .me-hero-heading {
            font-size: 18px;
          }

          .me-hero-icon {
            width: 41px;
            height: 41px;
          }

          .me-hero-count {
            width: 100%;
          }

          .me-stats {
            grid-template-columns: 1fr;
          }

          .me-stat-card {
            padding: 12px 14px;
          }

          .me-stat-value {
            font-size: 19px;
          }

          .me-toolbar-left {
            display: grid;
            grid-template-columns: 1fr;
          }

          .me-search {
            width: 100%;
            min-width: 0;
          }

          .me-filter {
            width: 100%;
            justify-content: space-between;
          }

          .me-filter select {
            flex: 1;
          }

          .me-modal-form {
            grid-template-columns: 1fr;
          }

          .me-modal-field.full {
            grid-column: auto;
          }

          .me-modal-footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .me-page {
            animation: none;
          }

          .me-stat-card,
          .me-add-btn,
          .me-deactivate-btn,
          .me-modal-btn {
            transition: none;
          }
        }
      `}</style>

      {/* Hero */}
      <div className="me-hero">
        <div className="me-hero-content">
          <div>
            <h2 className="me-hero-heading">
              <span className="me-hero-icon">
                <FiUsers />
              </span>
              My Employees
            </h2>

            <p className="me-hero-description">
              Manage your team members, employee details and account status.
            </p>
          </div>

          <div className="me-hero-count">
            <strong>{total}</strong>
            Total Employees
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="me-stats">
        <div className="me-stat-card">
          <div className="me-stat-icon blue">
            <FiUsers />
          </div>
          <div>
            <p className="me-stat-label">Total Employees</p>
            <p className="me-stat-value">{total}</p>
          </div>
        </div>

        <div className="me-stat-card">
          <div className="me-stat-icon green">
            <FiUserCheck />
          </div>
          <div>
            <p className="me-stat-label">Active on This Page</p>
            <p className="me-stat-value">{activeCount}</p>
          </div>
        </div>

        <div className="me-stat-card">
          <div className="me-stat-icon orange">
            <FiUserMinus />
          </div>
          <div>
            <p className="me-stat-label">Inactive on This Page</p>
            <p className="me-stat-value">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="me-card">
        <div className="me-toolbar">
          <div className="me-toolbar-left">
            <div className="me-search">
              <SearchBar
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Search by name, ID, or email"
              />
            </div>

            <div className="me-filter">
              <FiFilter />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter employees by status"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className="me-add-btn"
          >
            <FiUserPlus />
            Add Employee
          </button>
        </div>
      </div>

      {/* Employee Table */}
      <div className="me-card">
        <div className="me-table-heading">
          <h3 className="me-table-title">
            <span className="me-table-title-icon">
              <FiBriefcase />
            </span>
            Employee Directory
          </h3>

          <span className="me-results">
            {total} employee{total !== 1 ? 's' : ''} found
          </span>
        </div>

        <DataTable
          columns={columns}
          rows={employees}
          loading={loading}
          onRowClick={(r) =>
            navigate(`/team-lead/employees/${r._id}`)
          }
          emptyTitle="No employees found"
        />

        <div className="me-pagination">
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Employee"
        footer={
          <div className="me-modal-footer">
            <button
              type="button"
              className="me-modal-btn me-modal-cancel"
              onClick={() => setAddOpen(false)}
            >
              <FiX />
              Cancel
            </button>

            <button
              type="button"
              className="me-modal-btn me-modal-submit"
              onClick={handleSubmit(onAddEmployee)}
              disabled={isSubmitting}
            >
              <FiCheck />
              {isSubmitting ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        }
      >
        <form
          className="me-modal-form"
          onSubmit={handleSubmit(onAddEmployee)}
        >
          <div className="me-modal-field">
            <label>Employee ID *</label>
            <input
              className="me-modal-input"
              placeholder="Enter employee ID"
              {...register('employeeCode', { required: true })}
            />
          </div>

          <div className="me-modal-field">
            <label>Full Name *</label>
            <input
              className="me-modal-input"
              placeholder="Enter full name"
              {...register('fullName', { required: true })}
            />
          </div>

          <div className="me-modal-field">
            <label>Email *</label>
            <input
              type="email"
              className="me-modal-input"
              placeholder="Enter email address"
              {...register('email', { required: true })}
            />
          </div>

          <div className="me-modal-field">
            <label>Phone</label>
            <input
              className="me-modal-input"
              placeholder="Enter phone number"
              {...register('phone')}
            />
          </div>

          <div className="me-modal-field full">
            <label>Designation</label>
            <input
              className="me-modal-input"
              placeholder="Enter employee designation"
              {...register('designation')}
            />
          </div>

          <div className="me-modal-field full">
            <label>Temporary Password *</label>
            <input
              type="text"
              className="me-modal-input"
              placeholder="At least 8 characters"
              {...register('password', {
                required: true,
                minLength: 8
              })}
            />
            <p className="me-modal-hint">
              The employee can use this password for their initial login.
            </p>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={doDeactivate}
        danger
        title="Deactivate employee?"
        message="They will no longer be able to log in."
        confirmLabel="Deactivate"
      />
    </div>
  );
}
