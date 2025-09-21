class VideoManager {
  constructor() {
    this.roomVideo = new Map(); 
    this.roomExpiry = new Map();

    setInterval(() => this.cleanupExpiredRooms(), 60 * 60 * 1000);
  }

  updateVideoState(roomLink, newState) {
    this.ensureRoomExists(roomLink);
    const room = this.roomVideo.get(roomLink);

    room.videoState = {
      ...room.videoState,
      ...newState,
      lastUpdatedAt: new Date(),
    };

    this.roomVideo.set(roomLink, room); 
  }

  getVideoState(roomLink) {
    return this.roomVideo.get(roomLink)?.videoState || null;
  }

  ensureRoomExists(roomLink) {
    if (!this.roomVideo.has(roomLink)) {
      this.roomVideo.set(roomLink, {
        videoState: {
          videoUrl: null,
          isPlaying: false,
          lastKnownTimestamp: 0,
          lastUpdatedAt: new Date(),
        },
      });
      this.roomExpiry.set(roomLink, Date.now() + 24 * 60 * 60 * 1000); // expire in 24h
    }
  }

  deleteRoom(roomLink) {
    this.roomVideo.delete(roomLink);
    this.roomExpiry.delete(roomLink);
  }

  cleanupExpiredRooms() {
    const now = Date.now();
    for (const [roomLink, expiryTime] of this.roomExpiry.entries()) {
      if (now > expiryTime) {
        console.log(`🧹 Cleaning up expired video state: ${roomLink}`);
        this.deleteRoom(roomLink);
      }
    }
  }

  getRoomStats() {
    return {
      activeRooms: this.roomVideo.size,
    };
  }
}

const videoManager = new VideoManager();
export default videoManager;
