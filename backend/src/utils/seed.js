const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Status = require('../models/Status');
const { connectDB, disconnectDB } = require('../config/db');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log('[Seed] Clearing existing database collections...');
    await User.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await Status.deleteMany({});

    console.log('[Seed] Creating demo users...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@whatsapp.com',
      password: 'password123',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      about: 'System Administrator & Overseer 🛡️',
      isOnline: true,
    });

    const alice = await User.create({
      name: 'Alice Johnson',
      email: 'alice@whatsapp.com',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
      about: 'Design Lead | Coffee Enthusiast ☕',
      isOnline: true,
    });

    const bob = await User.create({
      name: 'Bob Smith',
      email: 'bob@whatsapp.com',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      about: 'Full Stack Engineer 🚀',
      isOnline: false,
    });

    const charlie = await User.create({
      name: 'Charlie Davis',
      email: 'charlie@whatsapp.com',
      password: 'password123',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      about: 'Product Manager 📊',
      isOnline: true,
    });

    console.log('[Seed] Creating sample 1-on-1 Chat...');
    const directChat = await Chat.create({
      name: 'Direct Chat',
      isGroupChat: false,
      users: [alice._id, bob._id],
    });

    console.log('[Seed] Creating sample Group Chat...');
    const groupChat = await Chat.create({
      name: 'Product & Engineering 🚀',
      description: 'Official group chat for design & release coordination.',
      isGroupChat: true,
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=300',
      users: [admin._id, alice._id, bob._id, charlie._id],
      groupAdmin: [admin._id, alice._id],
    });

    console.log('[Seed] Creating sample Messages...');
    const m1 = await Message.create({
      sender: bob._id,
      chat: directChat._id,
      content: 'Hey Alice! Have you checked the latest WhatsApp design mockups?',
      readBy: [bob._id, alice._id],
      deliveredTo: [bob._id, alice._id],
    });

    const m2 = await Message.create({
      sender: alice._id,
      chat: directChat._id,
      content: 'Yes Bob! I love the sleek dark mode and green accents. We are ready for production!',
      replyTo: m1._id,
      reactions: [{ user: bob._id, emoji: '❤️' }],
      readBy: [bob._id, alice._id],
      deliveredTo: [bob._id, alice._id],
    });

    directChat.latestMessage = m2._id;
    await directChat.save();

    const gm1 = await Message.create({
      sender: admin._id,
      chat: groupChat._id,
      content: 'Welcome everyone to the official Product & Engineering channel!',
      readBy: [admin._id, alice._id, bob._id, charlie._id],
      deliveredTo: [admin._id, alice._id, bob._id, charlie._id],
    });

    const gm2 = await Message.create({
      sender: charlie._id,
      chat: groupChat._id,
      content: 'Great to be here! Real-time messaging performance feels lightning fast ⚡',
      reactions: [{ user: alice._id, emoji: '🔥' }],
      readBy: [admin._id, alice._id, charlie._id],
      deliveredTo: [admin._id, alice._id, bob._id, charlie._id],
    });

    groupChat.latestMessage = gm2._id;
    await groupChat.save();

    console.log('[Seed] Creating sample Status Updates (24h stories)...');
    await Status.create({
      user: alice._id,
      mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
      mediaType: 'image',
      caption: 'Working on beautiful web animations today! ✨',
      viewers: [admin._id, bob._id],
    });

    console.log('====================================================');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('----------------------------------------------------');
    console.log('Demo Credentials:');
    console.log(' 👑 Admin:   admin@whatsapp.com   / password123');
    console.log(' 👩 Alice:   alice@whatsapp.com   / password123');
    console.log(' 👨 Bob:     bob@whatsapp.com     / password123');
    console.log(' 👨 Charlie: charlie@whatsapp.com / password123');
    console.log('====================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
