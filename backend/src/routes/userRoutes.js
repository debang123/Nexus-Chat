const express = require('express');
const {
  searchUsers,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  toggleBlockUser,
  changePassword,
  deleteAccount,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', searchUsers);
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.post('/block', toggleBlockUser);
router.put('/change-password', changePassword);
router.delete('/account', deleteAccount);

module.exports = router;
