const Interview = require('../models/Interview');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

// ========== SCHEDULE INTERVIEW ==========
const scheduleInterview = async (req, res) => {
  try {
    const { startTime, duration, type, notes, timezone } = req.body;
    const userId = req.user.id;

    if (!startTime) {
      return res.status(400).json({ message: 'Start time is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a pending interview
    const existing = await Interview.findOne({
      userId,
      status: { $in: ['scheduled', 'rescheduled'] }
    });

    if (existing) {
      return res.status(400).json({
        message: 'You already have a pending interview. Please cancel or complete it first.'
      });
    }

    // Create interview
    const interview = await Interview.create({
      userId,
      startTime: new Date(startTime),
      duration: duration || 30,
      type: type || 'video',
      notes: notes || '',
      timezone: timezone || 'AFT',
      status: 'scheduled'
    });

    // In production, you would create a Zoom meeting here
    // For now, generate a mock Zoom link
    const mockZoomLink = `https://zoom.us/j/${Math.random().toString(36).substring(2, 10)}`;

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Interview Scheduled - Azadi Global',
        html: `
          <h1>Interview Scheduled</h1>
          <p>Dear ${user.fullName},</p>
          <p>Your ${type} interview has been scheduled for:</p>
          <p><strong>Date:</strong> ${new Date(startTime).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(startTime).toLocaleTimeString()}</p>
          <p><strong>Duration:</strong> ${duration} minutes</p>
          <p><strong>Zoom Link:</strong> <a href="${mockZoomLink}">${mockZoomLink}</a></p>
          <p>Please join 5 minutes before your scheduled time.</p>
          <p>Best regards,<br>Azadi Global Team</p>
        `
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      interview: {
        id: interview._id,
        startTime: interview.startTime,
        duration: interview.duration,
        type: interview.type,
        status: interview.status,
        zoomLink: mockZoomLink
      }
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== GET USER INTERVIEWS ==========
const getUserInterviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const interviews = await Interview.find({ userId })
      .sort({ startTime: -1 });

    res.json({
      success: true,
      count: interviews.length,
      interviews
    });
  } catch (error) {
    console.error('Get interviews error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== CANCEL INTERVIEW ==========
const cancelInterview = async (req, res) => {
  try {
    const interviewId = req.params.id;
    const userId = req.user.id;

    const interview = await Interview.findOne({ _id: interviewId, userId });
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status === 'completed' || interview.status === 'cancelled') {
      return res.status(400).json({ message: 'Interview cannot be cancelled' });
    }

    interview.status = 'cancelled';
    await interview.save();

    res.json({
      success: true,
      message: 'Interview cancelled successfully',
      interview
    });
  } catch (error) {
    console.error('Cancel interview error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  scheduleInterview,
  getUserInterviews,
  cancelInterview
};
