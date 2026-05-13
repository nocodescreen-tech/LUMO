const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createFeedback, getFeedbacks } = require('../controllers/feedbackController');

router.post('/', protect, createFeedback);
router.get('/', protect, getFeedbacks);

module.exports = router;
