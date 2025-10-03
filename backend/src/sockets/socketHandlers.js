import Room from "../models/Room.js";
import Message from "../models/Message.js";
import chatManager from "../utils/chatManager.js";
import videoManager from "../utils/videoManager.js";
import handleWebRTCEvents from "./webrtcHandlers.js";

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Join a room
    socket.on("join-room", async (data) => {
      try {
        const { roomLink, userId, userName } = data;
        const room = await Room.findOne({ roomLink, isActive: true });
        if (!room) {
          socket.emit("error", { message: "Room not found or inactive" });
          return;
        }
        socket.join(roomLink);
        socket.roomLink = roomLink;
        socket.userId = userId;
        socket.userName = userName;

        console.log(`👥 ${userName} joined room: ${roomLink}`);

        const messageHistory = chatManager.getMessages(roomLink);
        socket.emit("chat-history", { messages: messageHistory });
        socket.to(roomLink).emit("user-joined", {
          userId,
          userName,
          message: `${userName} joined the room`,
        });

        // Send room info to the user
        socket.emit("room-joined", {
          roomLink,
          userCount: room.users.length,
          videoUrl: room.videoUrl,
        });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("leave-room", (data) => {
      const { roomLink, userName } = data;

      socket.leave(roomLink);
      console.log(`👋 ${userName} left room: ${roomLink}`);

      // Notify others in the room
      socket.to(roomLink).emit("user-left", {
        userId: socket.userId,
        userName,
        message: `${userName} left the room`,
      });
    });

    // Handle chat messages
    socket.on("send-message", async (data) => {
      try {
        const { roomLink, userId, userName, message } = data;
        console.log("📥 Received message:", data);

        if (!message || !message.trim()) {
          return;
        }

        // Add message to chat manager
        const messageData = chatManager.addMessage(roomLink, {
          userId,
          userName,
          message: message.trim(),
        });

        console.log("📤 Broadcasting message:", messageData);
        io.to(roomLink).emit("new-message", messageData);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });
    socket.on("end-room", async (data) => {
      try {
        const { roomLink, userId, userName } = data;

        // Verify room exists and user is host
        const room = await Room.findOne({ roomLink, isActive: true });
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.host !== userId) {
          socket.emit("error", { message: "Only host can end the room" });
          return;
        }
        room.isActive = false;
        room.endedAt = new Date();
        await room.save();

        // Add system message before cleanup
        const endMessage = chatManager.addMessage(roomLink, {
          userId: "system",
          userName: "System",
          message: `Room ended by ${userName}. Thanks for watching together!`,
          type: "system",
        });

        // Notify all users in room
        io.to(roomLink).emit("new-message", endMessage);
        io.to(roomLink).emit("room-ended", {
          message: "This room has been ended by the host",
          endedBy: userName,
          endedAt: new Date(),
        });

        // Clean up chat after a small delay to let users see the message
        setTimeout(() => {
          chatManager.deleteRoomChat(roomLink);
        }, 5000);

        console.log(`🏁 Room ${roomLink} ended by ${userName}`);
      } catch (error) {
        console.error("Error ending room:", error);
        socket.emit("error", { message: "Failed to end room" });
      }
    });
    socket.on("room-update", (data) => {
      const { roomLink, updateType, videoUrl } = data;

      if (socket.roomLink !== roomLink) {
        socket.emit("error", { message: "You are not in this room" });
        return;
      }
      socket.to(roomLink).emit("room-updated", {
        updateType,
        videoUrl,
        updatedBy: socket.userName,
      });
    });

    // Handle typing indicators
    socket.on("typing-start", (data) => {
      const { roomLink, userName } = data;
      socket.to(roomLink).emit("user-typing", { userName, isTyping: true });
    });

    socket.on("typing-stop", (data) => {
      const { roomLink, userName } = data;
      socket.to(roomLink).emit("user-typing", { userName, isTyping: false });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${socket.id}`);

      if (socket.roomLink && socket.userName) {
        socket.to(socket.roomLink).emit("user-left", {
          userId: socket.userId,
          userName: socket.userName,
          message: `${socket.userName} disconnected`,
        });
      }
    });
    socket.on("play", async ({ roomLink, time, userId }) => {
      console.log(
        `🎥 Play video in room ${roomLink} at time ${time} by user ${userId}`
      );
      const room = await Room.findOne({ roomLink });
      if (!room) return;

      videoManager.updateVideoState(roomLink, {
        isPlaying: true,
        lastKnownTimestamp: time,
      });

      socket.to(roomLink).emit("play", { time });
    });

    socket.on("pause", async ({ roomLink, time, userId }) => {
      console.log(
        `⏸️ Pause video in room ${roomLink} at time ${time} by user ${userId}`
      );
      const room = await Room.findOne({ roomLink });
      if (!room ) return;

      videoManager.updateVideoState(roomLink, {
        isPlaying: false,
        lastKnownTimestamp: time,
      });

      socket.to(roomLink).emit("pause", { time });
    });

    socket.on("seek", async ({ roomLink, time, userId }) => {
      console.log(
        `⏭️ Seek video in room ${roomLink} to time ${time} by user ${userId}`
      );
      const room = await Room.findOne({ roomLink });
      if (!room ) return;

      videoManager.updateVideoState(roomLink, {
        lastKnownTimestamp: time,
        // isPlaying unchanged
      });

      socket.to(roomLink).emit("seek", { time });
    });
    // WebRTC handlers
    handleWebRTCEvents(io, socket);

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
};

export default handleSocketConnection;
