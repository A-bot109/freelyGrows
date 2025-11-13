import { Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { AuthRequest } from '../middleware/auth';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .populate('participants', '-password')
      .populate('lastMessage')
      .populate('admins', '-password')
      .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { participantId, type, groupName, groupDescription } = req.body;

    if (type === 'direct') {
      const existingConversation = await Conversation.findOne({
        type: 'direct',
        participants: { $all: [req.userId, participantId], $size: 2 },
      });

      if (existingConversation) {
        res.json({ conversation: existingConversation });
        return;
      }

      const conversation = new Conversation({
        participants: [req.userId, participantId],
        type: 'direct',
      });

      await conversation.save();
      await conversation.populate('participants', '-password');

      res.status(201).json({ conversation });
    } else if (type === 'group') {
      const { participants } = req.body;

      if (!participants || participants.length < 2) {
        res.status(400).json({ error: 'Group must have at least 2 participants' });
        return;
      }

      const allParticipants = [req.userId, ...participants];

      const conversation = new Conversation({
        participants: allParticipants,
        type: 'group',
        groupName,
        groupDescription,
        admins: [req.userId],
        createdBy: req.userId,
      });

      await conversation.save();
      await conversation.populate('participants', '-password');
      await conversation.populate('admins', '-password');

      res.status(201).json({ conversation });
    }
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const getConversationById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', '-password')
      .populate('admins', '-password');

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (!conversation.participants.some((p: any) => p._id.toString() === req.userId)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { groupName, groupDescription, groupIcon } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    if (conversation.type !== 'group') {
      res.status(400).json({ error: 'Not a group conversation' });
      return;
    }

    const isAdmin = conversation.admins?.some((admin: any) => admin.toString() === req.userId);
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admins can update group' });
      return;
    }

    if (groupName) conversation.groupName = groupName;
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription;
    if (groupIcon !== undefined) conversation.groupIcon = groupIcon;

    await conversation.save();
    await conversation.populate('participants', '-password');
    await conversation.populate('admins', '-password');

    res.json({ conversation });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
};

export const addGroupMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    if (conversation.type !== 'group') {
      res.status(400).json({ error: 'Not a group conversation' });
      return;
    }

    const isAdmin = conversation.admins?.some((admin: any) => admin.toString() === req.userId);
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admins can add members' });
      return;
    }

    if (conversation.participants.some((p: any) => p.toString() === userId)) {
      res.status(400).json({ error: 'User already in group' });
      return;
    }

    conversation.participants.push(userId as any);
    await conversation.save();
    await conversation.populate('participants', '-password');
    await conversation.populate('admins', '-password');

    res.json({ conversation });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

export const removeGroupMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    if (conversation.type !== 'group') {
      res.status(400).json({ error: 'Not a group conversation' });
      return;
    }

    const isAdmin = conversation.admins?.some((admin: any) => admin.toString() === req.userId);
    if (!isAdmin && req.userId !== userId) {
      res.status(403).json({ error: 'Only admins can remove members' });
      return;
    }

    conversation.participants = conversation.participants.filter(
      (p: any) => p.toString() !== userId
    );

    if (conversation.admins) {
      conversation.admins = conversation.admins.filter((a: any) => a.toString() !== userId);
    }

    await conversation.save();
    await conversation.populate('participants', '-password');
    await conversation.populate('admins', '-password');

    res.json({ conversation });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
