import Message from '../models/Message.js';
import Room from '../models/Room.js';

// Send a message to a room
const sendMessage = async (req, res) => {
  try {
    const { roomId, senderId, content, receiverId } = req.body;

    if (!roomId || !senderId || !content) {
      return res.status(400).json({ 
        error: "roomId, senderId, and content are required" 
      });
    }

    const room = await Room.findById(roomId);
    if (!room || !room.isActive) {
      return res.status(404).json({ error: "Room not found or inactive" });
    }

    // Verify sender is in the room
    if (!room.users.includes(senderId)) {
      return res.status(403).json({ error: "User is not in this room" });
    }

    // Create new message
    const newMessage = new Message({
      room: roomId,
      sender: senderId,
      receiver: receiverId || null,
      content: content.trim()
    });

    await newMessage.save();

    // Populate sender information
    await newMessage.populate('sender', 'name email avatarUrl');
    if (receiverId) {
      await newMessage.populate('receiver', 'name email avatarUrl');
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        id: newMessage._id,
        room: newMessage.room,
        sender: newMessage.sender,
        receiver: newMessage.receiver,
        content: newMessage.content,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get messages for a room
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name email avatarUrl')
      .populate('receiver', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments({ room: roomId });

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / parseInt(limit)),
        totalMessages,
        hasMore: skip + messages.length < totalMessages
      }
    });
  } catch (error) {
    console.error("Error getting room messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a message (only sender can delete)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!messageId || !userId) {
      return res.status(400).json({ error: "messageId and userId are required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can delete the message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export {
  sendMessage,
  getRoomMessages,
  deleteMessage
};
