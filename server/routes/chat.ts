import express, { Router, Response } from 'express';
import Conversation from '../models/Conversation';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Chat endpoint - send message and get AI response
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if Google API key is configured
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') {
      console.error('Google API key not configured!');
      return res.status(503).json({
        error: 'AI service is temporarily unavailable',
        response: "⚠️ The AI service is currently not configured. Please contact the administrator to set up the Google AI API key."
      });
    }

    let conversation;

    // Find or create conversation
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      // Create new conversation
      conversation = new Conversation({
        userId,
        messages: [],
      });
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Generate AI response using Google Gemini API directly
    let aiResponse: string;
    
    try {
      const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
      
      if (!GOOGLE_API_KEY) {
        throw new Error('Google API key not configured');
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `You are AssureAI, a professional and helpful insurance assistant. Your role is to answer questions about insurance policies, coverage, claims, and provide insurance-related advice.

Be friendly, informative, and accurate. If you're not sure about something, be honest and suggest consulting with an insurance professional.

User Question: ${message}

Assistant Response:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponse = response.data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Google AI');
      }

    } catch (aiError: any) {
      console.error('AI generation error:', aiError.response?.data || aiError.message);
      
      // Fallback responses for common questions
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('claim') || lowerMessage.includes('file')) {
        aiResponse = "To file a claim, you typically need to: 1) Contact your insurance company immediately, 2) Gather all relevant documentation (receipts, photos, police reports if applicable), 3) Fill out the claim form provided by your insurer, and 4) Follow up regularly on your claim status. For specific guidance, please contact your insurance provider directly.";
      } else if (lowerMessage.includes('coverage') || lowerMessage.includes('policy')) {
        aiResponse = "Insurance coverage varies by policy type and provider. Common types include auto, home, health, and life insurance. Each policy has specific terms, deductibles, and coverage limits. I recommend reviewing your policy documents or contacting your insurance agent for detailed information about your specific coverage.";
      } else {
        aiResponse = "I apologize, but I'm having trouble generating a response right now. This might be due to high demand or a temporary service issue. Please try asking your question again in a moment, or contact your insurance provider directly for immediate assistance.";
      }
    }

    // Add AI response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    });

    await conversation.save();

    res.json({
      response: aiResponse,
      conversationId: conversation._id,
      timestamp: new Date(),
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message', 
      details: error.message,
      response: "I apologize, but I encountered an error processing your request. Please try again."
    });
  }
});

// Get conversation history
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Get the most recent conversation
    const conversation = await Conversation.findOne({ userId })
      .sort({ updatedAt: -1 });

    if (!conversation) {
      return res.json({ conversation: null });
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
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history', details: error.message });
  }
});

// Delete conversation
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const result = await Conversation.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation', details: error.message });
  }
});

export default router;
