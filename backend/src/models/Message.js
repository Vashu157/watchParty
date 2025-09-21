import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    room: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Room", 
      required: true 
    },
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    receiver: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    content: { 
      type: String, 
      required: true 
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Add indexes for better performance
MessageSchema.index({ room: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

export default mongoose.model('Message', MessageSchema);
