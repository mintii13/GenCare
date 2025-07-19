// src/repositories/paymentRepository.ts
import { Payment, IPayment, PaymentStatus } from '../models/Payment';
import mongoose from 'mongoose';

export class PaymentRepository {
    /**
     * Tạo payment mới
     */
    static async create(paymentData: Partial<IPayment>): Promise<IPayment> {
        const payment = new Payment(paymentData);
        return await payment.save();
    }

    /**
     * Tìm payment theo orderId (ObjectId)
     */
    static async findByOrderId(orderId: string | mongoose.Types.ObjectId): Promise<IPayment | null> {
        const orderObjectId = typeof orderId === 'string' ? new mongoose.Types.ObjectId(orderId) : orderId;
        return await Payment.findOne({ orderId: orderObjectId });
    }

    /**
     * Tìm payment theo ID
     */
    static async findById(paymentId: string): Promise<IPayment | null> {
        return await Payment.findById(paymentId);
    }

    /**
     * Tìm payment theo customerId
     */
    static async findByCustomerId(
        customerId: string,
        status?: PaymentStatus,
        page: number = 1,
        limit: number = 10
    ): Promise<{ payments: IPayment[], total: number }> {
        const query: any = { customerId: new mongoose.Types.ObjectId(customerId) };
        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
            Payment.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Payment.countDocuments(query)
        ]);

        return { payments, total };
    }

    /**
     * Tìm payment theo orderId và customerId
     */
    static async findByOrderIdAndCustomerId(orderId: string | mongoose.Types.ObjectId, customerId: string): Promise<IPayment | null> {
        const orderObjectId = typeof orderId === 'string' ? new mongoose.Types.ObjectId(orderId) : orderId;
        return await Payment.findOne({
            orderId: orderObjectId,
            customerId: new mongoose.Types.ObjectId(customerId)
        });
    }

    /**
     * Cập nhật payment
     */
    static async updateById(paymentId: string, updateData: Partial<IPayment>): Promise<IPayment | null> {
        return await Payment.findByIdAndUpdate(
            paymentId,
            updateData,
            { new: true }
        );
    }

    /**
     * Cập nhật payment theo orderId
     */
    static async updateByOrderId(orderId: string | mongoose.Types.ObjectId, updateData: Partial<IPayment>): Promise<IPayment | null> {
        const orderObjectId = typeof orderId === 'string' ? new mongoose.Types.ObjectId(orderId) : orderId;
        return await Payment.findOneAndUpdate(
            { orderId: orderObjectId },
            updateData,
            { new: true }
        );
    }

    /**
     * Đánh dấu payment hoàn thành
     */
    static async markAsCompleted(
        orderId: string | mongoose.Types.ObjectId,
        transactionData: {
            momoTransId?: string;
            momoMessage?: string;
            momoResultCode?: number;
        }
    ): Promise<IPayment | null> {
        const orderObjectId = typeof orderId === 'string' ? new mongoose.Types.ObjectId(orderId) : orderId;
        const updateData: Partial<IPayment> = {
            status: 'Completed',
            completedAt: new Date(),
            ...transactionData
        };

        return await Payment.findOneAndUpdate(
            { orderId: orderObjectId },
            updateData,
            { new: true }
        );
    }

    /**
     * Đánh dấu payment thất bại
     */
    static async markAsFailed(
        orderId: string | mongoose.Types.ObjectId,
        errorMessage: string,
        resultCode?: number
    ): Promise<IPayment | null> {
        const orderObjectId = typeof orderId === 'string' ? new mongoose.Types.ObjectId(orderId) : orderId;
        const updateData: Partial<IPayment> = {
            status: 'Failed',
            failedAt: new Date(),
            errorMessage,
            ...(resultCode && { momoResultCode: resultCode })
        };

        return await Payment.findOneAndUpdate(
            { orderId: orderObjectId },
            updateData,
            { new: true }
        );
    }

    /**
     * Tìm payment theo MoMo transaction ID
     */
    static async findByMomoTransId(transId: string): Promise<IPayment | null> {
        return await Payment.findOne({ momoTransId: transId });
    }

    /**
     * Lấy thống kê payment theo khoảng thời gian
     */
    static async getPaymentStats(startDate: Date, endDate: Date): Promise<any[]> {
        return await Payment.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        status: '$status',
                        method: '$paymentMethod'
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $sort: { '_id.status': 1, '_id.method': 1 }
            }
        ]);
    }

    /**
     * Lấy tổng doanh thu theo phương thức thanh toán
     */
    static async getRevenueByMethod(startDate: Date, endDate: Date): Promise<any[]> {
        return await Payment.aggregate([
            {
                $match: {
                    status: 'Completed',
                    completedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    totalRevenue: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);
    }

    /**
     * Lấy payment đang pending quá lâu (có thể cần xử lý)
     */
    static async getPendingPayments(minutesOld: number = 30): Promise<IPayment[]> {
        const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000);

        return await Payment.find({
            status: { $in: ['Pending', 'Processing'] },
            createdAt: { $lt: cutoffTime }
        }).sort({ createdAt: 1 });
    }

    /**
     * Xóa payment (soft delete bằng cách đánh dấu cancelled)
     */
    static async cancelPayment(orderId: string | mongoose.Types.ObjectId, reason?: string): Promise<IPayment | null> {
        const orderObjectId = typeof orderId === 'string' ? new mongoose.Types.ObjectId(orderId) : orderId;
        return await Payment.findOneAndUpdate(
            { orderId: orderObjectId },
            {
                status: 'Cancelled',
                errorMessage: reason || 'Payment cancelled by user',
                failedAt: new Date()
            },
            { new: true }
        );
    }
}