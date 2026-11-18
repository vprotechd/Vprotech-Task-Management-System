
const mongoose = require('mongoose');

const Leave = require('../models/Leave');
const User = require('../models/User');

const { notify } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');


/* ============================================================
   APPLY FOR LEAVE - EMPLOYEE
============================================================ */

exports.applyForLeave = asyncHandler(async (req, res) => {

  const {
    leaveType,
    startDate,
    endDate,
    reason,
  } = req.body;

  // Only employees can apply
  if (req.user.role !== 'employee') {
    throw new ApiError(
      403,
      'Only employees can apply for leave.'
    );
  }

  // Required fields
  if (!leaveType || !startDate || !endDate || !reason?.trim()) {
    throw new ApiError(
      400,
      'Please provide all required leave details.'
    );
  }

  // Validate leave type
  const allowedTypes = [
    'casual',
    'sick',
    'emergency',
    'unpaid',
  ];

  if (!allowedTypes.includes(leaveType)) {
    throw new ApiError(
      400,
      'Invalid leave type.'
    );
  }

  // Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new ApiError(400, 'Invalid leave dates.');
  }

  // Normalize calendar dates to avoid time-of-day errors
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const leaveStart = new Date(start);
  leaveStart.setHours(0, 0, 0, 0);

  const leaveEnd = new Date(end);
  leaveEnd.setHours(0, 0, 0, 0);

  // Leave must be in future
  if (leaveStart <= today) {
    throw new ApiError(
      400,
      'Leave start date must be in the future.'
    );
  }

  // End date must not be before start date
  if (leaveEnd < leaveStart) {
    throw new ApiError(
      400,
      'Leave end date cannot be before start date.'
    );
  }

  // 10-day advance notice rule
  const minimumNoticeDate = new Date(today);
  minimumNoticeDate.setDate(
    minimumNoticeDate.getDate() + 10
  );

  if (leaveStart < minimumNoticeDate) {
    throw new ApiError(
      400,
      'Leave must be applied at least 10 days in advance.'
    );
  }

  // Check if employee already has a pending or approved
  // leave application for overlapping dates.
  const existingLeave = await Leave.findOne({
    employee: req.user._id,
    status: { $in: ['pending', 'approved'] },
    startDate: { $lte: leaveEnd },
    endDate: { $gte: leaveStart },
  });

  if (existingLeave) {
    throw new ApiError(
      409,
      'You already have a pending or approved leave for these dates.'
    );
  }

  // Create leave application
  const leave = await Leave.create({
    employee: req.user._id,
    leaveType,
    startDate: leaveStart,
    endDate: leaveEnd,
    reason: reason.trim(),
    status: 'pending',
  });

  // Notify admin users
  const admins = await User.find({
    role: 'admin',
    status: 'active',
  }).select('_id');

  await Promise.all(
    admins.map((admin) =>
      notify({
        recipient: admin._id,
        message: `${req.user.fullName} has applied for leave.`,
        type: 'leave_applied',
        relatedRecord: leave._id,
        relatedModel: 'Leave',
      })
    )
  );

  return sendSuccess(
    res,
    201,
    'Leave application submitted successfully.',
    leave
  );

});


/* ============================================================
   MY LEAVES - EMPLOYEE
============================================================ */

exports.listMyLeaves = asyncHandler(async (req, res) => {

  if (req.user.role !== 'employee') {
    throw new ApiError(
      403,
      'Only employees can access this route.'
    );
  }

  const leaves = await Leave.find({
    employee: req.user._id,
  })
    .sort({ createdAt: -1 })
    .populate('reviewedBy', 'fullName email');

  return sendSuccess(
    res,
    200,
    'Your leave applications fetched successfully.',
    leaves
  );

});


/* ============================================================
   ALL LEAVES - ADMIN
============================================================ */

exports.listAllLeaves = asyncHandler(async (req, res) => {

  const { status } = req.query;

  const filter = {};

  if (status) {
    const allowedStatuses = [
      'pending',
      'approved',
      'rejected',
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        400,
        'Invalid leave status.'
      );
    }

    filter.status = status;
  }

  const leaves = await Leave.find(filter)
    .populate(
      'employee',
      'fullName employeeCode email department designation'
    )
    .populate(
      'reviewedBy',
      'fullName'
    )
    .sort({ createdAt: -1 });

  return sendSuccess(
    res,
    200,
    'Leave applications fetched successfully.',
    leaves
  );

});


/* ============================================================
   APPROVE / REJECT LEAVE - ADMIN
============================================================ */

exports.reviewLeave = asyncHandler(async (req, res) => {

  const { id } = req.params;
  const { status, adminRemarks = '' } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid leave ID.');
  }

  if (!['approved', 'rejected'].includes(status)) {
    throw new ApiError(
      400,
      'Status must be approved or rejected.'
    );
  }

  const leave = await Leave.findById(id);

  if (!leave) {
    throw new ApiError(
      404,
      'Leave application not found.'
    );
  }

  if (leave.status !== 'pending') {
    throw new ApiError(
      400,
      'This leave application has already been reviewed.'
    );
  }

  leave.status = status;
  leave.adminRemarks = adminRemarks.trim();
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();

  await leave.save();

  // Notify employee
  await notify({
    recipient: leave.employee,
    message: `Your leave application has been ${status}.`,
    type: `leave_${status}`,
    relatedRecord: leave._id,
    relatedModel: 'Leave',
  });

  return sendSuccess(
    res,
    200,
    `Leave ${status} successfully.`,
    leave
  );


});
