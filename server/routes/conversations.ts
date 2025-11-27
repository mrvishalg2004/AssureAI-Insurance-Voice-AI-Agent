import express, { Router, Response } from 'express';
import Conversation from '../models/Conversation';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all conversations for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(50);

    res.json({
      conversations: conversations.map(conv => ({
        id: conv._id,
        userId: conv.userId,
        messages: conv.messages,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
  }
});

// Get a specific conversation
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const conversation = await Conversation.findOne({ _id: id, userId });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      conversation: {
        id: conversation._id,
        userId: conversation.userId,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation', details: error.message });
  }
});

// Create or update a conversation
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      userId,
      messages,
    });

    res.status(201).json({
      message: 'Conversation saved successfully',
      conversation: {
        id: conversation._id,
        userId: conversation.userId,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to save conversation', details: error.message });
  }
});

// Add message to existing conversation
router.post('/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'Role and content are required' });
    }

    if (role !== 'user' && role !== 'assistant') {
      return res.status(400).json({ error: 'Role must be either "user" or "assistant"' });
    }

    const conversation = await Conversation.findOne({ _id: id, userId });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    conversation.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    await conversation.save();

    res.json({
      message: 'Message added successfully',
      conversation: {
        id: conversation._id,
        userId: conversation.userId,
        messages: conversation.messages,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to add message', details: error.message });
  }
});

// Delete a conversation
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const conversation = await Conversation.findOneAndDelete({ _id: id, userId });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation', details: error.message });
  }
});

export default router;
