const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  detectLocation,
  saveUserLocation,
  getUserLocation
} = require('../controllers/locationController');

router.post('/detect', detectLocation);
router.post('/save', protect, saveUserLocation);
router.get('/me', protect, getUserLocation);

module.exports = router;
