import { NextFunction } from 'express';
import mongoose, { Schema, Document } from 'mongoose';

export interface IStiOrder extends Document {
  customer_id: mongoose.Types.ObjectId;
  staff_id?: mongoose.Types.ObjectId;
  sti_package_item?: {
    sti_package_id: mongoose.Types.ObjectId;
    sti_test_ids: mongoose.Types.ObjectId[];
  };
  sti_test_items?: {
    sti_test_id: mongoose.Types.ObjectId;
  }[];
  order_date: Date;
  order_status: 'Pending' | 'Processing' | 'SpecimenCollected' | 'Testing' | 'Completed' | 'Canceled';
  total_amount: number;
  payment_status: 'Pending' | 'Paid' | 'Failed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const stiOrderSchema: Schema = new Schema<IStiOrder>(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: false },
    sti_package_item: {
      sti_package_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StiPackage',
        required: false,
      },
      sti_test_ids: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StiTest',
          required: false,
        }
      ]
    },
    sti_test_items: [
      {
        sti_test_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StiTest',
          required: false
        }
      }
    ],
    order_date: { type: Date, required: true },
    order_status: {type: String, enum: ['Pending', 'Processing', 'SpecimenCollected', 'Testing', 'Completed', 'Canceled'], default: 'Pending', required: true},
    total_amount: { type: Number, required: true, min: 0 },
    payment_status: {type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending', required: true},
    notes: { type: String, required: false },
  },
  {
    timestamps: true
  }
);

export const StiOrder = mongoose.model<IStiOrder>('StiOrder', stiOrderSchema);
