const express = require('express');
const {
  getAdminStats,
  getAllUsersAdmin,
  toggleBanUser,
  getReports,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsersAdmin);
router.post('/ban/:userId', toggleBanUser);
router.get('/reports', getReports);

module.exports = router;
