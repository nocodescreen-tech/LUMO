const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createSubUser,
  getSubUsers,
  updateSubUser,
  deleteSubUser,
  getSubUserActivity, catalog, getHistory
} = require('../controllers/subUserController');

// Admins + gérants peuvent gérer les sous-utilisateurs
router.use(protect, authorize('admin'));

router.post('/', createSubUser);
router.get('/', getSubUsers);
router.get('/permissions', catalog);
router.get('/:id/access-history', getHistory);
router.get('/:id/activity', getSubUserActivity);
router.put('/:id', updateSubUser);
router.delete('/:id', deleteSubUser);

module.exports = router;
