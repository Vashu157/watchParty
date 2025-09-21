import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import {
  sendMessage,
  getRoomMessages,
  deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

// Message routes
router.post('/send', sendMessage);
router.get('/room/:roomId', getRoomMessages);
router.delete('/:messageId', deleteMessage);

export default router;
