const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { Report } = require('../models/Report');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isOnline: true });
    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalChats,
        totalMessages,
        pendingReports,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get List of Users for Admin
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsersAdmin = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban or Unban User
// @route   POST /api/admin/ban/:userId
// @access  Private/Admin
const toggleBanUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({
      success: true,
      message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all user reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email avatar')
      .populate('reportedUser', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllUsersAdmin,
  toggleBanUser,
  getReports,
};
