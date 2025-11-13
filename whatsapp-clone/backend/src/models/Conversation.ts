import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  type: 'direct' | 'group';
  groupName?: string;
  groupIcon?: string;
  groupDescription?: string;
  admins?: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct',
    },
    groupName: {
      type: String,
    },
    groupIcon: {
      type: String,
    },
    groupDescription: {
      type: String,
    },
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IConversation>('Conversation', conversationSchema);
