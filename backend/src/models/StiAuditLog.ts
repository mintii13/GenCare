// models/AuditLog.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IStiAuditLog extends Document {
  user_id: mongoose.Types.ObjectId;
  action: string;
  order_id: mongoose.Types.ObjectId;
  before?: any;
  after?: any;
  timestamp: Date;
  notes?: string;
}

const stiAuditLogSchema = new Schema<IStiAuditLog>({
  user_id: { type: Schema.Types.ObjectId, required: true},
  action: { type: String, required: true },
  order_id: { type: Schema.Types.ObjectId, ref: 'StiOrder', required: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String },
});

export const StiAuditLog = mongoose.model<IStiAuditLog>('AuditLog', stiAuditLogSchema);
