import { Response } from 'express';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import { AuthRequest } from '../middleware/auth';

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (!conversation.participants.some((p: any) => p.toString() === req.userId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', '-password')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId, content, type, fileUrl, fileName } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (!conversation.participants.some((p: any) => p.toString() === req.userId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const message = new Message({
      conversationId,
      senderId: req.userId,
      content,
      type: type || 'text',
      fileUrl,
      fileName,
      status: 'sent',
    });

    await message.save();
    await message.populate('senderId', '-password');

    conversation.lastMessage = message._id as any;
    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const updateMessageStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    message.status = status;
    await message.save();

    res.json({ message });
  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
};
