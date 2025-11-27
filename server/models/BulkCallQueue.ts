import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBulkCallQueue extends Document {
  _id: Types.ObjectId;
  userId: string;
  name: string;
  phone: string;
  city?: string;
  email?: string;
  notes?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bolnaCallId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  callAttempts: number;
  lastAttemptAt?: Date;
  // New fields for call interaction data
  conversationTime?: number;
  transcript?: string;
  recordingUrl?: string;
  callStatus?: string;
  hangupBy?: string;
  extractedData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BulkCallQueueSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
    },
    city: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    bolnaCallId: {
      type: String,
      sparse: true,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    callAttempts: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
    },
    conversationTime: {
      type: Number,
    },
    transcript: {
      type: String,
    },
    recordingUrl: {
      type: String,
    },
    callStatus: {
      type: String,
    },
    hangupBy: {
      type: String,
    },
    extractedData: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
BulkCallQueueSchema.index({ userId: 1, status: 1, createdAt: -1 });
BulkCallQueueSchema.index({ userId: 1, phone: 1 });
BulkCallQueueSchema.index({ createdAt: -1 });

export default mongoose.models.BulkCallQueue || mongoose.model<IBulkCallQueue>('BulkCallQueue', BulkCallQueueSchema);
