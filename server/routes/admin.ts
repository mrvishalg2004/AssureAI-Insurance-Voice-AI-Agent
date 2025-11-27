import express, { Router, Response } from 'express';
import User from '../models/User';
import Conversation from '../models/Conversation';
import { authenticateToken, authorizeAdmin, AuthRequest } from '../middleware/auth';

const router: Router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken, authorizeAdmin);

// Get dashboard statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const totalConversations = await Conversation.countDocuments();

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminUsers,
        totalConversations,
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

// Get all users with pagination
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// Get a specific user
router.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's conversation count
    const conversationCount = await Conversation.countDocuments({ userId: id });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        conversationCount,
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});

// Activate a user
router.patch('/users/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User activated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: 'Failed to activate user', details: error.message });
  }
});

// Deactivate a user
router.patch('/users/:id/deactivate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    // Prevent admin from deactivating themselves
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deactivated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error: any) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user', details: error.message });
  }
});

// Change user role
router.patch('/users/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUserId = req.user?.userId;

    if (!role || (role !== 'user' && role !== 'admin')) {
      return res.status(400).json({ error: 'Valid role (user or admin) is required' });
    }

    // Prevent admin from changing their own role
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User role changed to ${role} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Change role error:', error);
    res.status(500).json({ error: 'Failed to change user role', details: error.message });
  }
});

// Delete a user
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    // Prevent admin from deleting themselves
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's conversations
    await Conversation.deleteMany({ userId: id });

    res.json({ 
      message: 'User and all associated data deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

export default router;
