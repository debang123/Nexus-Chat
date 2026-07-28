const express = require('express');
const {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), sendMessage);
router.get('/:chatId', getMessages);
router.put('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);
router.post('/:messageId/react', reactToMessage);

module.exports = router;
