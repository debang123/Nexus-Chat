const Chat = require('../models/Chat');
const User = require('../models/User');

// @desc    Access or Create 1-on-1 Chat
// @route   POST /api/chats
// @access  Private
const accessChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'UserId param not sent with request' });
    }

    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');

    isChat = await User.populate(isChat, {
      path: 'latestMessage.sender',
      select: 'name avatar email',
    });

    if (isChat.length > 0) {
      return res.json({ success: true, data: isChat[0] });
    } else {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Target user not found' });
      }

      const chatData = {
        name: targetUser.name,
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        'users',
        '-password'
      );
      return res.status(201).json({ success: true, data: fullChat });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Fetch all chats for logged in user
// @route   GET /api/chats
// @access  Private
const fetchChats = async (req, res, next) => {
  try {
    let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'name avatar email',
    });

    res.json({ success: true, data: chats });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Group Chat
// @route   POST /api/chats/group
// @access  Private
const createGroupChat = async (req, res, next) => {
  try {
    const { name, users: rawUsers, description } = req.body;

    if (!name || !rawUsers) {
      return res.status(400).json({ success: false, message: 'Group name and users are required' });
    }

    let users = typeof rawUsers === 'string' ? JSON.parse(rawUsers) : rawUsers;

    if (users.length < 1) {
      return res.status(400).json({ success: false, message: 'At least 1 member is required to create a group' });
    }

    users.push(req.user._id);

    const groupChat = await Chat.create({
      name,
      description: description || '',
      isGroupChat: true,
      users,
      groupAdmin: [req.user._id],
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=300',
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(201).json({ success: true, data: fullGroupChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Rename Group or Update Info
// @route   PUT /api/chats/group/:chatId
// @access  Private
const updateGroupInfo = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { name, description } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({ success: false, message: 'Group chat not found' });
    }

    if (name) chat.name = name;
    if (description !== undefined) chat.description = description;

    const updatedChat = await chat.save();
    const fullChat = await Chat.findById(updatedChat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json({ success: true, data: fullChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to group
// @route   PUT /api/chats/group/add
// @access  Private
const addToGroup = async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!updatedChat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    res.json({ success: true, data: updatedChat });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from group or leave group
// @route   PUT /api/chats/group/remove
// @access  Private
const removeFromGroup = async (req, res, next) => {
  try {
    const { chatId, userId } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!updatedChat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    res.json({ success: true, data: updatedChat });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  updateGroupInfo,
  addToGroup,
  removeFromGroup,
};
