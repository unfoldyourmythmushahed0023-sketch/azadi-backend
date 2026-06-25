const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder routes
router.get('/', protect, (req, res) => {
  res.json({ message: 'Applications route - coming soon' });
});

router.post('/', protect, (req, res) => {
  res.json({ message: 'Create application - coming soon' });
});

module.exports = router;
