
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCalendar, FiSend, FiInfo } from 'react-icons/fi';

import axiosClient from '../../api/axiosClient';

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
    <div className="space-y-6">

      {/* Page Heading */}
      <div>
        <h2 className="text-2xl font-bold text-navy-900">
          Apply for Leave
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Submit your leave request for admin approval.
        </p>
      </div>

      {/* 10 Day Policy Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <FiInfo className="text-blue-600 text-xl shrink-0 mt-1" />

        <div>
          <h3 className="font-semibold text-blue-900">
            10-Day Advance Notice Policy
          </h3>

          <p className="text-sm text-blue-800 mt-1">
            Leave applications must be submitted at least
            10 calendar days before the leave start date.
          </p>

          <p className="text-sm font-semibold text-blue-900 mt-2">
            Earliest allowed leave date: {minimumDate}
          </p>
        </div>
      </div>

      {/* Leave Application Form */}
      <div className="card p-6 max-w-3xl">

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Leave Type */}
          <div>
            <label className="label">
              Leave Type *
            </label>

            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className="input-field"
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
              <label className="label">
                Start Date *
              </label>

              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 text-gray-400" />

                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={minimumDate}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">
                End Date *
              </label>

              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 text-gray-400" />

                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || minimumDate}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

          </div>

          {/* Reason */}
          <div>
            <label className="label">
              Reason for Leave *
            </label>

            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="4"
              maxLength="1000"
              placeholder="Explain why you need leave..."
              className="input-field resize-none"
              required
            />

            <p className="text-xs text-gray-400 text-right mt-1">
              {formData.reason.length}/1000 characters
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <FiSend />

              {loading
                ? 'Submitting...'
                : 'Submit Leave Application'
              }
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
