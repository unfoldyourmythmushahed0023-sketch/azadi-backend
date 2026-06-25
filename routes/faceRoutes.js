const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerFace,
  verifyFace,
  getFaceStatus
} = require('../controllers/faceController');

router.post('/register', protect, registerFace);
router.post('/verify', protect, verifyFace);
router.get('/status', protect, getFaceStatus);
router.get('/status/:userId', protect, getFaceStatus);

module.exports = router;
