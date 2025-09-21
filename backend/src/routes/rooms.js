import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomDetails,
  updateVideoUrl,
  getAllActiveRooms,
  endRoom
} from '../controllers/roomController.js';

const router = express.Router();
// Public routes (no authentication required)
router.post('/create', createRoom);
router.post('/join', joinRoom);
router.patch('/leave', leaveRoom);
router.patch('/update-video', updateVideoUrl);
router.get('/', getAllActiveRooms);
router.get('/:roomLink', getRoomDetails);
router.delete('/end', endRoom);
export default router;
