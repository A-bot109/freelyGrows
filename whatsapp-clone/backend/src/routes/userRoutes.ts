import express from 'express';
import { getAllUsers, getUserById, updateProfile, searchUsers } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getAllUsers);
router.get('/search', authenticate, searchUsers);
router.get('/:id', authenticate, getUserById);
router.put('/profile', authenticate, updateProfile);

export default router;
