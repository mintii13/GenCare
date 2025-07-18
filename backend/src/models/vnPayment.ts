import mongoose, { Document, Schema } from 'mongoose';

export interface IVNPayment extends Document {
    _id: mongoose.Types.ObjectId;
    order_id: mongoose.Types.ObjectId;
    vnp_txn_ref: string;
    amount: number;
    currency: string;
    payment_method: string;
    payment_status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
    vnp_response_code?: string;
    vnp_transaction_no?: string;
    vnp_bank_code?: string;
    vnp_pay_date?: Date;
    vnp_order_info?: string;
    ip_address?: string;
    created_at: Date;
    updated_at: Date;
}

const vnPaymentSchema = new Schema<IVNPayment>({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'StiOrder'
    },
    vnp_txn_ref: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'VND',
        enum: ['VND']
    },
    payment_method: {
        type: String,
        enum: ['VNPay'],
        default: 'VNPay'
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Success', 'Failed', 'Cancelled'],
        default: 'Pending',
        index: true
    },
    vnp_response_code: {
        type: String,
        sparse: true
    },
    vnp_transaction_no: {
        type: String,
        sparse: true
    },
    vnp_bank_code: {
        type: String,
        sparse: true
    },
    vnp_pay_date: {
        type: Date,
        sparse: true
    },
    vnp_order_info: {
        type: String,
        maxlength: 255
    },
    ip_address: {
        type: String,
        sparse: true
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'vnpayments'
});

// Indexes for better performance
vnPaymentSchema.index({ order_id: 1, payment_status: 1 });
vnPaymentSchema.index({ vnp_txn_ref: 1 }, { unique: true });
vnPaymentSchema.index({ created_at: -1 });

// Pre-save middleware
vnPaymentSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

export const VNPayment = mongoose.model<IVNPayment>('VNPayment', vnPaymentSchema);