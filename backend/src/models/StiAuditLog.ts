// models/AuditLog.ts
import mongoose, { Schema, Document } from 'mongoose';
import { StiOrder } from '../models/StiOrder';
import { StiPackage } from '../models/StiPackage';
import { StiTest } from '../models/StiTest';

export type TargetType = 'StiOrder' | 'StiPackage' | 'StiTest';

export interface IStiAuditLog extends Document {
    target_type: TargetType;                            
    target_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    action: string;
    before?: any;
    after?: any;
    timestamp: Date;
    notes?: string;
}

const stiAuditLogSchema = new Schema<IStiAuditLog>({
    target_type: {type: String, enum: ['StiOrder', 'StiPackage', 'StiTest'], required: true},
    target_id: {type: Schema.Types.ObjectId, required: true},
    user_id: { type: Schema.Types.ObjectId, required: true},
    action: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String },
});

export const StiAuditLog = mongoose.model<IStiAuditLog>('AuditLog', stiAuditLogSchema);

export const modelMap: Record<TargetType, mongoose.Model<any>> = {
  StiOrder: StiOrder,
  StiPackage: StiPackage,
  StiTest: StiTest
};
