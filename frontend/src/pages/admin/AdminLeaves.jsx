
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCalendar,
  FiCheck,
  FiX,
  FiClock,
  FiRefreshCw,
  FiUser,
  FiMessageSquare,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

function formatDate(date) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch all leave applications
  const loadLeaves = useCallback(async () => {
    setLoading(true);

    try {
      const { data: res } = await axiosClient.get('/leaves');

      setLeaves(Array.isArray(res.data) ? res.data : []);

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to load leave applications.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  // Filter applications
  const filteredLeaves =
    filter === 'all'
      ? leaves
      : leaves.filter((leave) => leave.status === filter);

  // Summary counts
  const pendingCount = leaves.filter(
    (leave) => leave.status === 'pending'
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status === 'approved'
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.status === 'rejected'
  ).length;

  // Open review dialog
  const openReview = (leave, status) => {
    setSelectedLeave(leave);
    setReviewStatus(status);
    setRemarks('');
  };

  // Close review dialog
  const closeReview = () => {
    setSelectedLeave(null);
    setReviewStatus('');
    setRemarks('');
  };

  // Approve or reject leave
  const handleReview = async (e) => {
    e.preventDefault();

    if (!selectedLeave) return;

    try {
      setSubmitting(true);

      const { data: res } = await axiosClient.patch(
        `/leaves/${selectedLeave._id}/review`,
        {
          status: reviewStatus,
          adminRemarks: remarks.trim(),
        }
      );

      toast.success(
        res.message ||
        `Leave ${reviewStatus} successfully.`
      );

      closeReview();
      await loadLeaves();

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to review leave application.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            Leave Management
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage and review employee leave applications.
          </p>
        </div>

        <button
          onClick={loadLeaves}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <FiRefreshCw
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>

      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="card p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Pending Applications
            </p>
            <FiClock className="text-amber-500 text-xl" />
          </div>

          <h3 className="text-3xl font-bold text-navy-900 mt-2">
            {pendingCount}
          </h3>
        </div>

        <div className="card p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Approved Applications
            </p>
            <FiCheck className="text-green-500 text-xl" />
          </div>

          <h3 className="text-3xl font-bold text-navy-900 mt-2">
            {approvedCount}
          </h3>
        </div>

        <div className="card p-5">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Rejected Applications
            </p>
            <FiX className="text-red-500 text-xl" />
          </div>

          <h3 className="text-3xl font-bold text-navy-900 mt-2">
            {rejectedCount}
          </h3>
        </div>

      </div>

      {/* FILTER BUTTONS */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">

          {[
            { value: 'all', label: 'All Applications' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ].map((item) => (

            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === item.value
                  ? 'bg-navy-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>

          ))}

        </div>
      </div>

      {/* APPLICATION LIST */}
      {loading ? (

        <LoadingSpinner label="Loading leave applications..." />

      ) : filteredLeaves.length === 0 ? (

        <div className="card">
          <EmptyState
            icon={FiCalendar}
            title="No leave applications found"
            description="Employee leave applications will appear here."
          />
        </div>

      ) : (

        <div className="space-y-4">

          {filteredLeaves.map((leave) => {

            const employee = leave.employee || {};

            return (

              <div
                key={leave._id}
                className="card p-5 space-y-4"
              >

                {/* EMPLOYEE DETAILS */}
                <div className="flex flex-wrap justify-between items-start gap-3">

                  <div className="flex items-center gap-3">

                    <div className="h-11 w-11 rounded-full bg-navy-100 flex items-center justify-center">
                      <FiUser className="text-navy-600 text-xl" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-navy-900">
                        {employee.fullName || 'Unknown Employee'}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1">
                        ID: {employee.employeeCode || '-'}
                        {' · '}
                        {employee.department?.name || '-'}
                      </p>

                      <p className="text-xs text-gray-500">
                        {employee.email || ''}
                      </p>
                    </div>

                  </div>

                  <StatusBadge status={leave.status} />

                </div>

                {/* LEAVE DETAILS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      Leave Type
                    </p>

                    <p className="font-semibold capitalize mt-1 text-gray-800">
                      {leave.leaveType} Leave
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      Start Date
                    </p>

                    <p className="font-semibold mt-1 text-gray-800">
                      {formatDate(leave.startDate)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">
                      End Date
                    </p>

                    <p className="font-semibold mt-1 text-gray-800">
                      {formatDate(leave.endDate)}
                    </p>
                  </div>

                </div>

                {/* REASON */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Reason for Leave
                  </p>

                  <p className="text-sm text-gray-700">
                    {leave.reason}
                  </p>
                </div>

                {/* APPLICATION DATE */}
                <p className="text-xs text-gray-400">
                  Applied on: {formatDate(leave.appliedAt || leave.createdAt)}
                </p>

                {/* ADMIN REMARKS */}
                {leave.adminRemarks && (

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">

                    <p className="text-xs font-semibold text-blue-800">
                      Admin Remarks
                    </p>

                    <p className="text-sm text-blue-700 mt-1">
                      {leave.adminRemarks}
                    </p>

                  </div>

                )}

                {/* REVIEWED BY */}
                {leave.reviewedBy && (
                  <p className="text-xs text-gray-500">
                    Reviewed by: {leave.reviewedBy.fullName}
                  </p>
                )}

                {/* ACTION BUTTONS */}
                {leave.status === 'pending' && (

                  <div className="flex flex-wrap justify-end gap-3 pt-3 border-t">

                    <button
                      onClick={() => openReview(leave, 'rejected')}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm font-medium"
                    >
                      <FiX />
                      Reject
                    </button>

                    <button
                      onClick={() => openReview(leave, 'approved')}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FiCheck />
                      Approve
                    </button>

                  </div>

                )}

              </div>

            );
          })}

        </div>

      )}

      {/* REVIEW MODAL */}
      {selectedLeave && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

            <div className="flex justify-between items-center mb-5">

              <h3 className="text-lg font-bold text-navy-900">
                {reviewStatus === 'approved'
                  ? 'Approve Leave'
                  : 'Reject Leave'}
              </h3>

              <button
                onClick={closeReview}
                disabled={submitting}
                className="text-gray-500 hover:text-gray-800"
              >
                <FiX size={22} />
              </button>

            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">

              <p className="font-semibold text-gray-800">
                {selectedLeave.employee?.fullName}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                {formatDate(selectedLeave.startDate)}
                {' - '}
                {formatDate(selectedLeave.endDate)}
              </p>

            </div>

            <form onSubmit={handleReview} className="space-y-4">

              <div>
                <label className="label">
                  Admin Remarks
                </label>

                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="3"
                  maxLength="1000"
                  className="input-field resize-none"
                  placeholder="Enter remarks (optional)..."
                />
              </div>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeReview}
                  disabled={submitting}
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 ${
                    reviewStatus === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting
                    ? 'Processing...'
                    : reviewStatus === 'approved'
                      ? 'Confirm Approval'
                      : 'Confirm Rejection'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
