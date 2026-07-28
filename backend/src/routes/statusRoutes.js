const express = require('express');
const {
  createStatus,
  getStatuses,
  markStatusViewed,
} = require('../controllers/statusController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('media'), createStatus);
router.get('/', getStatuses);
router.post('/:statusId/view', markStatusViewed);

module.exports = router;
