import { VNPayment, IVNPayment } from '../models/vnPayment';
import mongoose from 'mongoose';

export interface CreateVNPaymentData {
    order_id: string | mongoose.Types.ObjectId;
    vnp_txn_ref: string;
    amount: number;
    vnp_order_info?: string;
    ip_address?: string;
}

export interface UpdateVNPaymentData {
    payment_status?: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
    vnp_response_code?: string;
    vnp_transaction_no?: string;
    vnp_bank_code?: string;
    vnp_pay_date?: Date;
}

class VNPaymentRepository {

    /**
     * Tạo mới payment record
     */
    async create(paymentData: CreateVNPaymentData): Promise<IVNPayment> {
        try {
            const payment = new VNPayment({
                order_id: new mongoose.Types.ObjectId(paymentData.order_id.toString()),
                vnp_txn_ref: paymentData.vnp_txn_ref,
                amount: paymentData.amount,
                vnp_order_info: paymentData.vnp_order_info,
                ip_address: paymentData.ip_address,
                payment_status: 'Pending'
            });

            return await payment.save();
        } catch (error) {
            console.error('Error creating VNPayment:', error);
            throw new Error('Failed to create payment record');
        }
    }

    /**
     * Tìm payment theo order ID
     */
    async findByOrderId(orderId: string): Promise<IVNPayment | null> {
        try {
            return await VNPayment.findOne({
                order_id: new mongoose.Types.ObjectId(orderId)
            }).populate('order_id');
        } catch (error) {
            console.error('Error finding payment by order ID:', error);
            return null;
        }
    }

    /**
     * Tìm payment theo transaction reference
     */
    async findByTxnRef(txnRef: string): Promise<IVNPayment | null> {
        try {
            return await VNPayment.findOne({ vnp_txn_ref: txnRef }).populate('order_id');
        } catch (error) {
            console.error('Error finding payment by txn ref:', error);
            return null;
        }
    }

    /**
     * Cập nhật trạng thái payment
     */
    async updateByTxnRef(txnRef: string, updateData: UpdateVNPaymentData): Promise<IVNPayment | null> {
        try {
            return await VNPayment.findOneAndUpdate(
                { vnp_txn_ref: txnRef },
                {
                    ...updateData,
                    updated_at: new Date()
                },
                { new: true, runValidators: true }
            ).populate('order_id');
        } catch (error) {
            console.error('Error updating payment:', error);
            throw new Error('Failed to update payment record');
        }
    }

    /**
     * Lấy danh sách payments theo customer ID
     */
    async findByCustomerId(customerId: string, page: number = 1, limit: number = 10): Promise<{
        payments: IVNPayment[];
        total: number;
        totalPages: number;
    }> {
        try {
            const skip = (page - 1) * limit;

            const [payments, total] = await Promise.all([
                VNPayment.find()
                    .populate({
                        path: 'order_id',
                        match: { customer_id: new mongoose.Types.ObjectId(customerId) }
                    })
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                VNPayment.countDocuments()
            ]);

            // Filter out payments where order_id is null (didn't match customer)
            const filteredPayments = payments.filter(payment => payment.order_id !== null);

            return {
                payments: filteredPayments,
                total,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('Error finding payments by customer ID:', error);
            throw new Error('Failed to fetch customer payments');
        }
    }

    /**
     * Lấy thống kê payments
     */
    async getPaymentStats(startDate?: Date, endDate?: Date): Promise<{
        totalAmount: number;
        successfulPayments: number;
        failedPayments: number;
        pendingPayments: number;
    }> {
        try {
            const matchCondition: any = {};

            if (startDate && endDate) {
                matchCondition.created_at = {
                    $gte: startDate,
                    $lte: endDate
                };
            }

            const stats = await VNPayment.aggregate([
                { $match: matchCondition },
                {
                    $group: {
                        _id: null,
                        totalAmount: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'Success'] }, '$amount', 0]
                            }
                        },
                        successfulPayments: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'Success'] }, 1, 0]
                            }
                        },
                        failedPayments: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'Failed'] }, 1, 0]
                            }
                        },
                        pendingPayments: {
                            $sum: {
                                $cond: [{ $eq: ['$payment_status', 'Pending'] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            return stats[0] || {
                totalAmount: 0,
                successfulPayments: 0,
                failedPayments: 0,
                pendingPayments: 0
            };
        } catch (error) {
            console.error('Error getting payment stats:', error);
            throw new Error('Failed to get payment statistics');
        }
    }

    /**
     * Xóa payment record (chỉ admin)
     */
    async deleteById(paymentId: string): Promise<boolean> {
        try {
            const result = await VNPayment.findByIdAndDelete(paymentId);
            return !!result;
        } catch (error) {
            console.error('Error deleting payment:', error);
            return false;
        }
    }
}

export default new VNPaymentRepository();