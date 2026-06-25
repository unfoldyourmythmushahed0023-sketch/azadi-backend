const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  scheduleInterview,
  getUserInterviews,
  cancelInterview
} = require('../controllers/interviewController');

router.post('/schedule', protect, scheduleInterview);
router.get('/', protect, getUserInterviews);
router.put('/:id/cancel', protect, cancelInterview);

module.exports = router;
