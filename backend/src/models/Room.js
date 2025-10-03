import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema(
  {
    roomLink: { 
      type: String, 
      required: true, 
      unique: true 
    },
    users: [{ 
      type: String, 
    }],
    host: { 
      type: String,  
      required: true 
    },
    startTime: { 
      type: Date, 
      default: Date.now 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    videoUrl: { 
      type: String 
    },
    videoCallActive: {
      type: Boolean,
      default: false
    },
    videoCallParticipants: [{
      type: String
    }]
  },
  {
    timestamps: true
  }
);

// Add indexes for better performance
RoomSchema.index({ roomLink: 1 });
RoomSchema.index({ isActive: 1 });
RoomSchema.index({ host: 1 });

export default mongoose.model('Room', RoomSchema);
