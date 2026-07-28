const express = require('express');
const {
  accessChat,
  fetchChats,
  createGroupChat,
  updateGroupInfo,
  addToGroup,
  removeFromGroup,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', accessChat);
router.get('/', fetchChats);
router.post('/group', createGroupChat);
router.put('/group/add', addToGroup);
router.put('/group/remove', removeFromGroup);
router.put('/group/:chatId', updateGroupInfo);

module.exports = router;
