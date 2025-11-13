import express from 'express';
import {
  getConversations,
  createConversation,
  getConversationById,
  updateGroup,
  addGroupMember,
  removeGroupMember,
} from '../controllers/conversationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getConversations);
router.post('/', authenticate, createConversation);
router.get('/:id', authenticate, getConversationById);
router.put('/:id', authenticate, updateGroup);
router.post('/:id/members', authenticate, addGroupMember);
router.delete('/:id/members/:userId', authenticate, removeGroupMember);

export default router;
