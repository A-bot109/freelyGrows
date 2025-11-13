import express from 'express';
import { getMessages, sendMessage, updateMessageStatus } from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/:conversationId', authenticate, getMessages);
router.post('/', authenticate, sendMessage);
router.put('/:messageId/status', authenticate, updateMessageStatus);

export default router;
