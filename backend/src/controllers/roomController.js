import Room from "../models/Room.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";

// Create a new room
const createRoom = async (req, res) => {
  try {
    const { hostId, videoUrl } = req.body;
    // console.log("🔍 Extracted:", { hostId, videoUrl });

    // Generate unique room link
    const roomLink = uuidv4();
    console.log(roomLink);
    const newRoom = new Room({
      roomLink,
      host: hostId || `guest-${uuidv4()}`,
      users: [hostId || `guest-${uuidv4()}`],
      videoUrl: videoUrl || null,
      isActive: true,
    });

    await newRoom.save();

    res.status(201).json({
      success: true,
      message: videoUrl
        ? "Room created with video"
        : "Room created - add a video to start watching",
      room: {
        id: newRoom._id,
        roomLink: newRoom.roomLink,
        host: newRoom.host,
        users: newRoom.users,
        videoUrl: newRoom.videoUrl,
        isActive: newRoom.isActive,
        startTime: newRoom.startTime,
        createdAt: newRoom.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Join an existing room
const joinRoom = async (req, res) => {
  try {
    const { roomLink, userId } = req.body;

    if (!roomLink || !userId) {
      return res
        .status(400)
        .json({ error: "roomLink and userId are required" });
    }

    // Find room by roomLink
    const room = await Room.findOne({ roomLink, isActive: true });
    if (!room) {
      return res.status(404).json({ error: "Room not found or inactive" });
    }

    // Check if user is already in the room
    if (room.users.includes(userId)) {
      return res.status(200).json({
        success: true,
        message: "User already in room",
        room: {
          id: room._id,
          roomLink: room.roomLink,
          host: room.host,
          users: room.users,
          videoUrl: room.videoUrl,
          isActive: room.isActive,
          startTime: room.startTime,
        },
      });
    }

    // Add user to room
    room.users.push(userId);
    await room.save();

    res.status(200).json({
      success: true,
      message: "Successfully joined room",
      room: {
        id: room._id,
        roomLink: room.roomLink,
        host: room.host,
        users: room.users,
        videoUrl: room.videoUrl,
        isActive: room.isActive,
        startTime: room.startTime,
      },
    });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Leave a room
const leaveRoom = async (req, res) => {
  try {
    const { roomLink, userId } = req.body;

    if (!roomLink || !userId) {
      return res
        .status(400)
        .json({ error: "roomLink and userId are required" });
    }

    const room = await Room.findOne({ roomLink, isActive: true });
    if (!room) {
      return res.status(404).json({ error: "Room not found or inactive" });
    }

    if (!room.users.some((user) => user.toString() === userId)) {
      return res.status(400).json({ error: "User is not in this room" });
    }

    // Remove user from room
    room.users = room.users.filter((user) => user.toString() !== userId);

    // Handle host leaving and room management
    if (room.users.length === 0) {
      // No users left - deactivate room
      room.isActive = false;
      room.host = null;
    } else if (room.host.toString() === userId) {
      // Host is leaving but there are other users - assign new host
      room.host = room.users[0];
    }

    await room.save();

    let message = "Successfully left room";
    if (!room.isActive) {
      message = "Room closed - last user left";
    } else if (
      room.host &&
      room.host.toString() === room.users[0].toString() &&
      room.host.toString() !== userId
    ) {
      message = "Successfully left room - host transferred";
    }

    res.status(200).json({
      success: true,
      message,
      room: {
        id: room._id,
        roomLink: room.roomLink,
        isActive: room.isActive,
        host: room.host,
        users: room.users,
      },
    });
  } catch (error) {
    console.error("Error leaving room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get room details
const getRoomDetails = async (req, res) => {
  try {
    const { roomLink } = req.params;

    if (!roomLink) {
      return res.status(400).json({ error: "roomLink is required" });
    }

    const room = await Room.findOne({ roomLink })
      .populate("host", "name email avatarUrl")
      .populate("users", "name email avatarUrl");

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.status(200).json({
      success: true,
      room: {
        id: room._id,
        roomLink: room.roomLink,
        host: room.host,
        users: room.users,
        videoUrl: room.videoUrl,
        isActive: room.isActive,
        startTime: room.startTime,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting room details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update video URL
const updateVideoUrl = async (req, res) => {
  try {
    const { roomLink, videoUrl, userId } = req.body;

    if (!roomLink || !videoUrl || !userId) {
      return res
        .status(400)
        .json({ error: "roomLink, videoUrl, and userId are required" });
    }

    const room = await Room.findOne({ roomLink, isActive: true });
    if (!room) {
      return res.status(404).json({ error: "Room not found or inactive" });
    }

    // Only host can update video URL
    if (room.host.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only the host can update the video URL" });
    }

    const previousVideo = room.videoUrl;
    room.videoUrl = videoUrl;

    // Reset start time when video changes
    room.startTime = new Date();

    await room.save();

    res.status(200).json({
      success: true,
      message: previousVideo
        ? "Video changed successfully"
        : "Video added to room successfully",
      room: {
        id: room._id,
        roomLink: room.roomLink,
        videoUrl: room.videoUrl,
        startTime: room.startTime,
      },
    });
  } catch (error) {
    console.error("Error updating video URL:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all active rooms
const getAllActiveRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate("host", "name email")
      .select("roomLink host users videoUrl startTime createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      rooms: rooms.map((room) => ({
        id: room._id,
        roomLink: room.roomLink,
        host: room.host,
        userCount: room.users.length,
        hasVideo: !!room.videoUrl,
        videoUrl: room.videoUrl,
        startTime: room.startTime,
        createdAt: room.createdAt,
        status: room.videoUrl ? "watching" : "waiting_for_video",
      })),
    });
  } catch (error) {
    console.error("Error getting active rooms:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// backend/src/controllers/roomController.js
import chatManager from "../utils/chatManager.js";

// End/Delete a room (Host only)
const endRoom = async (req, res) => {
  try {
    const { roomLink, userId } = req.body;

    if (!roomLink || !userId) {
      return res.status(400).json({
        success: false,
        error: "roomLink and userId are required",
      });
    }

    // Find the room
    const room = await Room.findOne({ roomLink, isActive: true });
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found or already inactive",
      });
    }

    // Check if user is the host
    if (room.host !== userId) {
      return res.status(403).json({
        success: false,
        error: "Only the host can end the room",
      });
    }

    // Mark room as inactive in database
    room.isActive = false;
    room.endedAt = new Date();
    await Room.deleteOne({roomLink});

    // Clean up chat messages from memory
    chatManager.deleteRoomChat(roomLink);

    // Log room stats before cleanup
    const stats = chatManager.getRoomStats();
    console.log(`🏁 Room ended: ${roomLink}`);
    console.log(`📊 Remaining active rooms: ${stats.activeRooms}`);

    res.status(200).json({
      success: true,
      message: "Room ended successfully",
      room: {
        roomLink: room.roomLink,
        endedAt: room.endedAt,
        wasActive: true,
      },
    });
  } catch (error) {
    console.error("Error ending room:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

// Auto-end inactive rooms (optional utility function)
const autoEndInactiveRooms = async () => {
  try {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const inactiveRooms = await Room.find({
      isActive: true,
      updatedAt: { $lt: cutoffTime },
    });

    for (const room of inactiveRooms) {
      room.isActive = false;
      room.endedAt = new Date();
      await room.save();

      // Clean up chat messages
      chatManager.deleteRoomChat(room.roomLink);

      console.log(`🕒 Auto-ended inactive room: ${room.roomLink}`);
    }

    if (inactiveRooms.length > 0) {
      console.log(`🧹 Auto-ended ${inactiveRooms.length} inactive rooms`);
    }
  } catch (error) {
    console.error("Error auto-ending inactive rooms:", error);
  }
};

// Run cleanup every 6 hours
setInterval(autoEndInactiveRooms, 6 * 60 * 60 * 1000);

export {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomDetails,
  updateVideoUrl,
  getAllActiveRooms,
  endRoom,
};