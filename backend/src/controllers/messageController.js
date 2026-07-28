const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

// @desc    Send New Message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, replyTo } = req.body;

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'chatId is required' });
    }

    let mediaData = { url: '', type: 'none', name: '', size: 0 };

    if (req.file) {
      const mime = req.file.mimetype;
      let mediaType = 'document';
      if (mime.startsWith('image/')) mediaType = 'image';
      else if (mime.startsWith('video/')) mediaType = 'video';
      else if (mime.startsWith('audio/')) mediaType = 'audio';

      mediaData = {
        url: `/uploads/${req.file.filename}`,
        type: mediaType,
        name: req.file.originalname,
        size: req.file.size,
      };
    }

    if (!content && mediaData.type === 'none') {
      return res.status(400).json({ success: false, message: 'Message content or media attachment is required' });
    }

    const newMessage = {
      sender: req.user._id,
      content: content || '',
      chat: chatId,
      media: mediaData,
      replyTo: replyTo || null,
      readBy: [req.user._id],
      deliveredTo: [req.user._id],
    };

    let message = await Message.create(newMessage);

    message = await message.populate('sender', 'name avatar email');
    message = await message.populate('chat');
    message = await message.populate('replyTo');
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'name avatar email isOnline lastSeen',
    });

    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Get All Messages for a Chat
// @route   GET /api/messages/:chatId
// @access  Private
const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      chat: chatId,
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name avatar email')
      .populate('replyTo')
      .populate('reactions.user', 'name avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit Message
// @route   PUT /api/messages/:messageId
// @access  Private
const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this message' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name avatar email')
      .populate('replyTo');

    res.json({ success: true, data: updatedMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Message (Delete for me / Delete for everyone)
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (deleteForEveryone) {
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Only message sender can delete for everyone' });
      }
      message.isDeletedForEveryone = true;
      message.content = 'This message was deleted';
      message.media = { url: '', type: 'none', name: '', size: 0 };
      await message.save();
    } else {
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
    }

    res.json({ success: true, message: 'Message deleted successfully', data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Add / Toggle Emoji Reaction
// @route   POST /api/messages/:messageId/react
// @access  Private
const reactToMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReactionIndex > -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1); // remove reaction
      } else {
        message.reactions[existingReactionIndex].emoji = emoji; // change reaction
      }
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();
    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'name avatar email')
      .populate('reactions.user', 'name avatar');

    res.json({ success: true, data: updatedMessage });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
};
