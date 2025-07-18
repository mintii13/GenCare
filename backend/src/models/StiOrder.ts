import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 'Booked' | 'Accepted' | 'Processing' | 'SpecimenCollected' | 'Testing' | 'Completed' | 'Canceled';

export interface IStiOrder extends Document {
    customer_id: mongoose.Types.ObjectId;
    consultant_id?: mongoose.Types.ObjectId;
    staff_id?: mongoose.Types.ObjectId;
    sti_package_item?: {
      sti_package_id: mongoose.Types.ObjectId;
      sti_test_ids: mongoose.Types.ObjectId[];
    };
    sti_test_items?: mongoose.Types.ObjectId[];
    sti_schedule_id: mongoose.Types.ObjectId;
    order_date: Date;
    order_status: OrderStatus;
    total_amount: number;
    is_paid: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const stiOrderSchema: Schema = new Schema<IStiOrder>({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    consultant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultant', required: false },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: false },
    sti_package_item: {
      type: new mongoose.Schema({
        sti_package_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StiPackage'
        },
        sti_test_ids: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StiTest'
          }
        ]
      }, { _id: false }),
      required: false
    },
    sti_test_items: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StiTest',
          required: false
      }
    ],
    sti_schedule_id: {type: mongoose.Schema.Types.ObjectId, required: true},
    order_date: { type: Date, required: true },
    order_status: {type: String, enum: ['Booked', 'Accepted', 'Processing', 'SpecimenCollected', 'Testing', 'Completed', 'Canceled'], default: 'Booked', required: true},
    total_amount: { type: Number, min: 0, default: 0},
    is_paid: {type: Boolean, default: false},
    notes: { type: String, required: false },
  },
  {
    timestamps: true
  }
);

export const StiOrder = mongoose.model<IStiOrder>('StiOrder', stiOrderSchema);