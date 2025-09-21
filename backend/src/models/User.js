import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    dob: { 
      type: Date 
    },
    avatarUrl: { 
      type: String 
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better performance
UserSchema.index({ email: 1 });

export default mongoose.model('User', UserSchema);
