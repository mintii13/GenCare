// src/models/Payment.ts
import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled' | 'Refunded';
export type PaymentMethod = 'MoMo' | 'Cash';
export type PaymentType = 'STI_Test' | 'Consultation' | 'Package' | 'Other';

export interface IPayment extends Document {
    // Payment sẽ có _id tự động (đây là paymentId)
    orderId: mongoose.Types.ObjectId; // ID của order được thanh toán (STI Order, Appointment...)
    customerId: mongoose.Types.ObjectId;
    paymentType: PaymentType;
    paymentMethod: PaymentMethod;
    amount: number;
    currency: string;
    status: PaymentStatus;

    // MoMo specific fields
    momoTransId?: string;
    momoRequestId?: string;
    momoPartnerCode?: string;
    momoSignature?: string;
    momoResponseTime?: number;
    momoMessage?: string;
    momoResultCode?: number;

    // Payment details
    extraData?: string;
    paymentUrl?: string;

    // Timestamps
    initiatedAt: Date;
    completedAt?: Date;
    failedAt?: Date;

    // Error handling
    errorMessage?: string;

    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema: Schema = new Schema<IPayment>({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true // Có thể có nhiều payments cho 1 order (retry, refund...)
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    paymentType: {
        type: String,
        enum: ['STI_Test', 'Consultation', 'Package', 'Other'],
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['MoMo', 'Cash'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'VND',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Cancelled', 'Refunded'],
        default: 'Pending',
        required: true,
        index: true
    },

    // MoMo specific fields
    momoTransId: { type: String },
    momoRequestId: { type: String },
    momoPartnerCode: { type: String },
    momoSignature: { type: String },
    momoResponseTime: { type: Number },
    momoMessage: { type: String },
    momoResultCode: { type: Number },

    // Payment details
    extraData: { type: String },
    paymentUrl: { type: String },

    // Timestamps
    initiatedAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    completedAt: { type: Date },
    failedAt: { type: Date },

    // Error handling
    errorMessage: { type: String }
}, {
    timestamps: true,
    collection: 'payments'
});

// Indexes for better query performance
paymentSchema.index({ customerId: 1, status: 1 });
paymentSchema.index({ orderId: 1, paymentMethod: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ momoTransId: 1 }, { sparse: true });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function (this: IPayment) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: this.currency
    }).format(this.amount);
});

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);