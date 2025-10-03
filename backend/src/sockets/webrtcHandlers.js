import Room from "../models/Room.js";

const handleWebRTCEvents = (io, socket) => {
  // Start video call request
  socket.on("start-video-call", async (data) => {
    try {
      const { roomLink } = data;
      const room = await Room.findOne({ roomLink, isActive: true });
      
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      // Check if room has exactly 2 users
      const roomSockets = await io.in(roomLink).fetchSockets();
      if (roomSockets.length !== 2) {
        socket.emit("error", { message: "Video call requires exactly 2 users" });
        return;
      }

      // Update room with video call status
      await Room.findOneAndUpdate(
        { roomLink },
        { 
          videoCallActive: true,
          videoCallParticipants: roomSockets.map(s => s.userId)
        }
      );

      // Notify all users in the room about video call start
      io.to(roomLink).emit("video-call-started", {
        initiator: socket.userId,
        participants: roomSockets.map(s => ({ userId: s.userId, userName: s.userName }))
      });

      console.log(`🎥 Video call started in room: ${roomLink}`);
    } catch (error) {
      console.error("Error starting video call:", error);
      socket.emit("error", { message: "Failed to start video call" });
    }
  });

  // End video call request
  socket.on("end-video-call", async (data) => {
    try {
      const { roomLink } = data;
      
      // Update room to end video call
      await Room.findOneAndUpdate(
        { roomLink },
        { 
          videoCallActive: false,
          videoCallParticipants: []
        }
      );

      // Notify all users in the room about video call end
      io.to(roomLink).emit("video-call-ended", {
        endedBy: socket.userId
      });

      console.log(`🛑 Video call ended in room: ${roomLink}`);
    } catch (error) {
      console.error("Error ending video call:", error);
      socket.emit("error", { message: "Failed to end video call" });
    }
  });

  // WebRTC Signaling Events
  socket.on("webrtc-offer", (data) => {
    const { roomLink, offer, targetUserId } = data;
    console.log(`📞 WebRTC offer from ${socket.userId} to ${targetUserId}`);
    
    // Forward offer to specific user
    socket.to(roomLink).emit("webrtc-offer-received", {
      offer,
      fromUserId: socket.userId,
      fromUserName: socket.userName
    });
  });

  socket.on("webrtc-answer", (data) => {
    const { roomLink, answer, targetUserId } = data;
    console.log(`✅ WebRTC answer from ${socket.userId} to ${targetUserId}`);
    
    // Forward answer to specific user
    socket.to(roomLink).emit("webrtc-answer-received", {
      answer,
      fromUserId: socket.userId,
      fromUserName: socket.userName
    });
  });

  socket.on("webrtc-ice-candidate", (data) => {
    const { roomLink, candidate, targetUserId } = data;
    console.log(`🧊 ICE candidate from ${socket.userId}`);
    
    // Forward ICE candidate to other users in room
    socket.to(roomLink).emit("webrtc-ice-candidate-received", {
      candidate,
      fromUserId: socket.userId
    });
  });

  // Handle user disconnect during video call
  socket.on("disconnect", async () => {
    if (socket.roomLink) {
      try {
        const room = await Room.findOne({ 
          roomLink: socket.roomLink, 
          isActive: true,
          videoCallActive: true
        });

        if (room && room.videoCallParticipants.includes(socket.userId)) {
          // End video call if participant disconnects
          await Room.findOneAndUpdate(
            { roomLink: socket.roomLink },
            { 
              videoCallActive: false,
              videoCallParticipants: []
            }
          );

          // Notify remaining users
          socket.to(socket.roomLink).emit("video-call-ended", {
            endedBy: socket.userId,
            reason: "User disconnected"
          });

          console.log(`🔌 Video call ended due to disconnect: ${socket.userId}`);
        }
      } catch (error) {
        console.error("Error handling disconnect during video call:", error);
      }
    }
  });
};

export default handleWebRTCEvents;
