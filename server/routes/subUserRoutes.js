const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createSubUser,
  getSubUsers,
  updateSubUser,
  deleteSubUser
} = require('../controllers/SubUserController');

// Only admins can manage sub-users
router.use(protect, authorize('admin', 'superadmin'));

router.post('/', createSubUser);
router.get('/', getSubUsers);
router.put('/:id', updateSubUser);
router.delete('/:id', deleteSubUser);

module.exports = router;
