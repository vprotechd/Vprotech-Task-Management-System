
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCalendar,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
} from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_ICONS = {
  pending: FiClock,
  approved: FiCheckCircle,
  rejected: FiXCircle,
};

function formatDate(date) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const Icon = STATUS_ICONS[status] || FiClock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      <Icon />
      {status}
    </span>
  );
}

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLeaves = async () => {
    try {
      setLoading(true);

      const { data: res } = await axiosClient.get('/leaves/my');

      setLeaves(res.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to load leave applications.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const filteredLeaves =
    filter === 'all'
      ? leaves
      : leaves.filter((leave) => leave.status === filter);

  const pendingCount = leaves.filter(
    (leave) => leave.status === 'pending'
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status === 'approved'
  ).length;

  const rejectedCount = leaves.filter(
    (leave) => leave.status === 'rejected'
  ).length;

  return (
    <div className="space-y-6">

      {/* Heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        <div>
          <h2 className="text-2xl font-bold text-navy-900">
            My Leave Applications
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Track your leave requests and approval status.
          </p>
        </div>

        <button
          onClick={fetchLeaves}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>

      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Pending
            </p>
            <FiClock className="text-amber-500 text-xl" />
          </div>

          <h3 className="text-3xl font-bold mt-2 text-navy-900">
            {pendingCount}
          </h3>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Approved
            </p>
            <FiCheckCircle className="text-green-500 text-xl" />
          </div>

          <h3 className="text-3xl font-bold mt-2 text-navy-900">
            {approvedCount}
          </h3>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Rejected
            </p>
            <FiXCircle className="text-red-500 text-xl" />
          </div>

          <h3 className="text-3xl font-bold mt-2 text-navy-900">
            {rejectedCount}
          </h3>
        </div>

      </div>

      {/* Filter */}
      <div className="card p-4 flex flex-wrap items-center gap-3">

        <FiFileText className="text-gray-500" />

        <label className="text-sm font-medium text-gray-700">
          Filter Applications:
        </label>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="all">All Applications</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

      </div>

      {/* Leave Applications */}
      <div className="space-y-4">

        {loading ? (

          <div className="card p-10 text-center text-gray-500">
            Loading leave applications...
          </div>

        ) : filteredLeaves.length === 0 ? (

          <div className="card p-10 text-center">

            <FiCalendar className="mx-auto text-4xl text-gray-300 mb-3" />

            <h3 className="font-semibold text-gray-700">
              No leave applications found
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Your leave applications will appear here.
            </p>

          </div>

        ) : (

          filteredLeaves.map((leave) => (

            <div
              key={leave._id}
              className="card p-5 space-y-4"
            >

              {/* Application Header */}
              <div className="flex flex-wrap justify-between items-center gap-3">

                <div>
                  <h3 className="font-semibold text-navy-900 capitalize">
                    {leave.leaveType} Leave
                  </h3>

                  <p className="text-xs text-gray-500 mt-1">
                    Applied on {formatDate(leave.appliedAt || leave.createdAt)}
                  </p>
                </div>

                <StatusBadge status={leave.status} />

              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">
                    Start Date
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    {formatDate(leave.startDate)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">
                    End Date
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    {formatDate(leave.endDate)}
                  </p>
                </div>

              </div>

              {/* Reason */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  Reason
                </p>

                <p className="text-sm text-gray-700">
                  {leave.reason}
                </p>
              </div>

              {/* Admin Remarks */}
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

              {/* Reviewer */}
              {leave.reviewedBy && (
                <p className="text-xs text-gray-500">
                  Reviewed by: {leave.reviewedBy.fullName}
                </p>
              )}

            </div>

          ))

        )}

      </div>

    </div>
  );
}
