class ChatManager {
  constructor() {
    this.roomChats = new Map();
    this.roomExpiry = new Map();

    setInterval(() => this.cleanupExpiredRooms(), 60 * 60 * 1000);
  }
  addMessage(roomLink, message) {
    if (!this.roomChats.has(roomLink)) {
      this.roomChats.set(roomLink, []);
      this.roomExpiry.set(roomLink, Date.now() + 24 * 60 * 60 * 1000);
    }

    const messages = this.roomChats.get(roomLink);
    const messageWithId = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...message,
      timestamp: new Date(),
    };
    messages.push(messageWithId);
    if (messages.length > 100) {
      messages.shift();
    }
    this.roomChats.set(roomLink, messages);
    return messageWithId;
  }
  getMessages(roomLink) {
    return this.roomChats.get(roomLink) || []; 
  }
  deleteRoomChat(roomLink) {
    this.roomChats.delete(roomLink);
    this.roomExpiry.delete(roomLink);
  }

  cleanupExpiredRooms() {
    const now = Date.now();
    for (const [roomLink, expiryTime] of this.roomExpiry.entries()) {
      if (now > expiryTime) {
        console.log(`🧹 Cleaning up expired room chat: ${roomLink}`);
        this.deleteRoomChat(roomLink);
      }
    }
  }

  getRoomStats() {
    return {
      activeRooms: this.roomChats.size,
      totalMessages: Array.from(this.roomChats.values()).reduce(
        (sum, msgs) => sum + msgs.length,
        0
      ),
    };
  }
}

const chatManager = new ChatManager();
export default chatManager;
