import mongoose, { Document, Schema } from "mongoose";
import { TestTypes } from './StiTest';

// Dạng object map giữa loại mẫu và chất lượng
export type Sample = {
  sampleQualities?: Partial<Record<TestTypes, boolean | null>>; // true: đạt, false: không đạt
  timeReceived?: Date;
  timeTesting?: Date;
};

const sampleSchema = new Schema({
  sampleQualities: {
    type: Map,
    of: Schema.Types.Mixed
  },
  timeReceived: { type: Date },
  timeTesting: { type: Date }
}, { _id: false });

export interface IStiResult extends Document {
  sti_order_id: mongoose.Types.ObjectId;
  sample?: Sample;
  time_result?: Date;
  result_value?: string;
  diagnosis?: string;
  is_confirmed: boolean;
  is_critical?: boolean;
  is_notified: boolean;
  notes?: string;
  is_active: boolean;
}

const stiResultSchema = new Schema<IStiResult>({
  sti_order_id: { type: Schema.Types.ObjectId, ref: 'StiOrder', required: true },
  sample: { type: sampleSchema },
  time_result: { type: Date },
  result_value: { type: String },
  diagnosis: { type: String },
  is_confirmed: { type: Boolean, default: false },
  is_critical: { type: Boolean, default: false },
  is_notified: { type: Boolean, default: false },
  notes: { type: String },
  is_active: { type: Boolean, default: true }
});

export const StiResult = mongoose.model<IStiResult>('StiResult', stiResultSchema);
