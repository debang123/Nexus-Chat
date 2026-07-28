const Status = require('../models/Status');

// @desc    Create new Status / Story
// @route   POST /api/status
// @access  Private
const createStatus = async (req, res, next) => {
  try {
    const { caption, bgColor, mediaType } = req.body;
    let mediaUrl = req.body.mediaUrl;

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    }

    if (!mediaUrl && !caption) {
      return res.status(400).json({ success: false, message: 'Status requires media or caption text' });
    }

    const status = await Status.create({
      user: req.user._id,
      mediaUrl: mediaUrl || '',
      mediaType: mediaType || (req.file ? 'image' : 'text'),
      caption: caption || '',
      bgColor: bgColor || '#00a884',
      viewers: [req.user._id],
    });

    const fullStatus = await Status.findById(status._id).populate('user', 'name avatar email');
    res.status(201).json({ success: true, data: fullStatus });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active status updates
// @route   GET /api/status
// @access  Private
const getStatuses = async (req, res, next) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
    })
      .populate('user', 'name avatar email')
      .populate('viewers', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: statuses });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark status as viewed
// @route   POST /api/status/:statusId/view
// @access  Private
const markStatusViewed = async (req, res, next) => {
  try {
    const { statusId } = req.params;
    const status = await Status.findByIdAndUpdate(
      statusId,
      { $addToSet: { viewers: req.user._id } },
      { new: true }
    ).populate('user', 'name avatar');

    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStatus,
  getStatuses,
  markStatusViewed,
};
