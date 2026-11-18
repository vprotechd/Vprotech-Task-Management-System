
const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

const leaveController = require('../controllers/leaveController');

// All leave routes require authentication
router.use(protect);

// Employee: Apply for leave
router.post(
  '/apply',
  authorize('employee'),
  leaveController.applyForLeave
);

// Employee: View own leave applications
router.get(
  '/my',
  authorize('employee'),
  leaveController.listMyLeaves
);

// Admin: View all leave applications
router.get(
  '/',
  authorize('admin'),
  leaveController.listAllLeaves
);

// Admin: Approve or reject leave
router.patch(
  '/:id/review',
  authorize('admin'),
  leaveController.reviewLeave
);

module.exports = router;
