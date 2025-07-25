// src/controllers/paymentController.ts
import { Router, Request, Response } from 'express';
import { MoMoPaymentService, MoMoIPNRequest } from '../services/momoPaymentService';
import { PaymentRepository } from '../repositories/paymentRepository';
import { IPayment, Payment } from '../models/Payment';
import { StiOrder } from '../models/StiOrder';
import { authenticateToken } from '../middlewares/jwtMiddleware';
import mongoose from 'mongoose';

const router = Router();
const momoService = new MoMoPaymentService();

// Helper function để update payment và order
async function updatePaymentAndOrder(payment: any, ipnData: MoMoIPNRequest) {
    if (ipnData.resultCode === 0) {
        // Thanh toán thành công
        payment.status = 'Completed';
        payment.completedAt = new Date();
        payment.momoTransId = ipnData.transId.toString();
        payment.momoMessage = ipnData.message;
        payment.momoResultCode = ipnData.resultCode;
        await payment.save();

        // Cập nhật trạng thái order liên quan
        if (payment.paymentType === 'STI_Test') {
            await StiOrder.findByIdAndUpdate(
                payment.orderId,
                {
                    is_paid: true,
                    order_status: 'Accepted'
                }
            );
        }

        console.log(`Payment ${payment._id} completed successfully`);
    } else {
        // Thanh toán thất bại
        payment.status = 'Failed';
        payment.failedAt = new Date();
        payment.errorMessage = ipnData.message;
        payment.momoResultCode = ipnData.resultCode;
        await payment.save();

        console.log(`Payment ${payment._id} failed:`, ipnData.message);
    }
}

interface CreatePaymentRequest {
    orderId: string; // ID của order được thanh toán (STI Order, Appointment...)
    paymentType: 'STI_Test' | 'Consultation' | 'Package' | 'Other';
    paymentMethod: 'MoMo' | 'Cash';
    // Bỏ amount - sẽ lấy từ order
}

/**
 * Tạo payment request mới
 * POST /api/payment/create
 */
router.post('/create/:orderId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId
        const { paymentType, paymentMethod }: CreatePaymentRequest = req.body;
        const customerId = req.jwtUser?.userId;

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Validation
        if (!orderId || !paymentType || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        if (!['MoMo', 'Cash'].includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Phương thức thanh toán không hợp lệ'
            });
        }

        // Convert orderId to ObjectId
        const orderObjectId = new mongoose.Types.ObjectId(orderId);

        // Lấy thông tin order và amount dựa trên paymentType
        let orderData: any = null;
        let amount: number = 0;

        switch (paymentType) {
            case 'STI_Test':
                orderData = await StiOrder.findById(orderObjectId);
                if (!orderData) {
                    return res.status(404).json({
                        success: false,
                        message: 'STI Order không tìm thấy'
                    });
                }
                // Kiểm tra customer có quyền thanh toán order này không
                if (orderData.customer_id.toString() !== customerId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bạn không có quyền thanh toán order này'
                    });
                }
                // Kiểm tra order đã thanh toán chưa
                if (orderData.is_paid) {
                    return res.status(400).json({
                        success: false,
                        message: 'Order này đã được thanh toán rồi'
                    });
                }
                amount = orderData.total_amount;
                break;

            case 'Consultation':
                // TODO: Implement Appointment logic
                return res.status(400).json({
                    success: false,
                    message: 'Consultation payment chưa được implement'
                });

            case 'Package':
                // TODO: Implement Package logic
                return res.status(400).json({
                    success: false,
                    message: 'Package payment chưa được implement'
                });

            case 'Other':
                // Cho phép amount = 0 cho Other type (testing)
                amount = 10000; // Default amount cho testing
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Payment type không hợp lệ'
                });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số tiền thanh toán phải lớn hơn 0'
            });
        }

        // Kiểm tra xem đã có payment nào cho order này với status Completed chưa
        const existingPayment = await PaymentRepository.findByOrderId(orderObjectId);
        if (existingPayment && existingPayment.status === 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Order này đã được thanh toán rồi'
            });
        }

        // Tạo payment record
        const paymentData: Partial<IPayment> = {
            orderId: orderObjectId,
            customerId: new mongoose.Types.ObjectId(customerId),
            paymentType,
            paymentMethod,
            amount, // Amount được lấy từ order
            currency: 'VND',
            status: paymentMethod === 'Cash' ? 'Completed' : 'Pending',
            initiatedAt: new Date(),
            ...(paymentMethod === 'Cash' && { completedAt: new Date() })
        };

        const payment = await PaymentRepository.create(paymentData);

        // Nếu là Cash payment, cập nhật order luôn
        if (paymentMethod === 'Cash') {
            if (paymentType === 'STI_Test') {
                await StiOrder.findByIdAndUpdate(
                    orderObjectId,
                    {
                        is_paid: true,
                        order_status: 'Accepted'
                    }
                );
            }

            return res.json({
                success: true,
                data: {
                    paymentId: payment._id,
                    orderId: payment.orderId,
                    amount: payment.amount,
                    status: payment.status,
                    paymentMethod: payment.paymentMethod
                }
            });
        }

        // Nếu là MoMo payment, tạo payment request
        const momoResponse = await momoService.createPayment({
            orderId: payment._id.toString(), // Sử dụng paymentId cho MoMo
            amount
        });

        // Cập nhật payment với thông tin từ MoMo
        const updateData: Partial<IPayment> = {
            paymentUrl: momoResponse.payUrl,
            momoRequestId: momoResponse.requestId,
            momoPartnerCode: momoResponse.partnerCode,
            momoResponseTime: momoResponse.responseTime,
            momoMessage: momoResponse.message,
            momoResultCode: momoResponse.resultCode,
            status: momoResponse.resultCode === 0 ? 'Processing' : 'Failed',
            ...(momoResponse.resultCode !== 0 && {
                failedAt: new Date(),
                errorMessage: momoResponse.message
            })
        };

        const updatedPayment = await PaymentRepository.updateById(payment._id.toString(), updateData);

        res.json({
            success: true,
            data: {
                paymentId: updatedPayment!._id,
                orderId: updatedPayment!.orderId,
                amount: updatedPayment!.amount,
                status: updatedPayment!.status,
                paymentMethod: updatedPayment!.paymentMethod,
                paymentUrl: updatedPayment!.paymentUrl,
                qrCodeUrl: momoResponse.qrCodeUrl,
                deeplink: momoResponse.deeplink
            }
        });

    } catch (error: any) {
        console.error('Payment creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Xử lý IPN (Instant Payment Notification) từ MoMo
 * POST /api/payment/momo/ipn
 */
router.post('/momo/ipn', async (req: Request, res: Response) => {
    try {
        const ipnData: MoMoIPNRequest = req.body;

        console.log('🔔 Received MoMo IPN:', JSON.stringify(ipnData, null, 2));

        // Xác thực chữ ký
        const isValidSignature = momoService.verifyIPNSignature(ipnData);
        if (!isValidSignature) {
            return res.status(400).json({
                success: false,
                message: 'Invalid signature'
            });
        }


        // Tìm payment record - prioritize momoRequestId
        let payment = await Payment.findOne({
            momoRequestId: ipnData.requestId
        });

        if (!payment) {
            console.log('🔍 Payment not found by requestId, trying orderId as Payment._id');
            try {
                // MoMo orderId chính là Payment._id
                if (mongoose.Types.ObjectId.isValid(ipnData.orderId)) {
                    payment = await Payment.findById(ipnData.orderId);
                }
            } catch (e) {
                console.error('Error finding payment by _id:', e);
            }
        }

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }


        // Check if already processed
        if (payment.status === 'Completed') {
            return res.status(200).json({
                success: true,
                message: 'Payment already processed'
            });
        }

        await updatePaymentAndOrder(payment, ipnData);

        // Phản hồi cho MoMo
        res.status(200).json({
            success: true,
            message: 'IPN processed successfully'
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * Xử lý callback từ MoMo sau khi user thanh toán
 * GET /api/payment/momo/callback
 */
router.get('/momo/callback', async (req: Request, res: Response) => {
    try {
        const { orderId, resultCode, message } = req.query;

        const payment = await PaymentRepository.findByOrderId(orderId as string);
        if (!payment) {
            return res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=Payment not found`);
        }

        if (resultCode === '0') {
            // Thanh toán thành công - redirect đến trang success
            res.redirect(`${process.env.FRONTEND_URL}/payment/success?orderId=${orderId}&amount=${payment.amount}`);
        } else {
            // Thanh toán thất bại - redirect đến trang error
            res.redirect(`${process.env.FRONTEND_URL}/payment/error?orderId=${orderId}&message=${message}`);
        }

    } catch (error: any) {
        console.error('MoMo callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/payment/error?message=System error`);
    }
});

/**
 * Lấy thông tin payment theo orderId
 * GET /api/payment/:orderId
 */
router.get('/:orderId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const customerId = req.jwtUser?.userId;

        const payment = await PaymentRepository.findByOrderIdAndCustomerId(orderId, customerId!);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment không tìm thấy'
            });
        }

        res.json({
            success: true,
            data: {
                orderId: payment.orderId,
                amount: payment.amount,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                createdAt: payment.createdAt,
                completedAt: payment.completedAt,
                failedAt: payment.failedAt,
                errorMessage: payment.errorMessage
            }
        });

    } catch (error: any) {
        console.error('Get payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin payment'
        });
    }
});

/**
 * Lấy danh sách payments của user
 * GET /api/payment/
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const customerId = req.jwtUser?.userId;
        const { status, page = 1, limit = 10 } = req.query;

        const { payments, total } = await PaymentRepository.findByCustomerId(
            customerId!,
            status as any,
            Number(page),
            Number(limit)
        );

        res.json({
            success: true,
            data: {
                payments: payments.map(p => ({
                    orderId: p.orderId,
                    amount: p.amount,
                    status: p.status,
                    paymentMethod: p.paymentMethod,
                    createdAt: p.createdAt,
                    completedAt: p.completedAt
                })),
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });

    } catch (error: any) {
        console.error('Get payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy lịch sử payment'
        });
    }
});

/**
 * Test endpoint để kiểm tra MoMo integration
 * GET /api/payment/test/momo
 */
router.get('/test/momo', async (req: Request, res: Response) => {
    try {
        const testResult = await momoService.testConnection();

        res.json({
            success: testResult.success,
            message: testResult.message,
            config: testResult.config
        });

    } catch (error: any) {
        console.error('MoMo test error:', error);
        res.status(500).json({
            success: false,
            message: 'MoMo test failed',
            error: error.message
        });
    }
});

/**
 * Test tạo payment đơn giản
 * GET /api/payment/test/simple
 */
router.get('/test/simple', async (req: Request, res: Response) => {
    try {
        const testOrderId = `SIMPLE_${Date.now()}`;
        const testAmount = 10000;

        const momoResponse = await momoService.createPayment({
            orderId: testOrderId,
            amount: testAmount
        });

        res.json({
            success: momoResponse.resultCode === 0,
            data: {
                orderId: testOrderId,
                amount: testAmount,
                resultCode: momoResponse.resultCode,
                message: momoResponse.message,
                payUrl: momoResponse.payUrl,
                qrCodeUrl: momoResponse.qrCodeUrl
            }
        });

    } catch (error: any) {
        console.error('Simple test error:', error);
        res.status(500).json({
            success: false,
            message: 'Simple test failed',
            error: error.message
        });
    }
});


export default router;