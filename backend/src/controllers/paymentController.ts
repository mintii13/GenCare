// src/controllers/paymentController.ts
import { Router, Request, Response } from 'express';
import { MoMoPaymentService, MoMoIPNRequest } from '../services/momoPaymentService';
import { PaymentRepository } from '../repositories/paymentRepository';
import { StiOrderRepository } from '../repositories/stiOrderRepository';
import { IPayment } from '../models/Payment';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { MongoUtils } from '../utils/mongoUtils';

const router = Router();
const momoService = new MoMoPaymentService();

// Helper function để update payment và order
async function updatePaymentAndOrder(payment: any, ipnData: MoMoIPNRequest) {
    try {
        console.log("Ipn data:", ipnData)
        if (ipnData.resultCode.toString() === '0') {
          // Thanh toán thành công
          const updateData = {
            status: 'Completed' as const,
            completedAt: new Date(),
            momoTransId: ipnData.transId?.toString(),
            momoMessage: ipnData.message,
            momoResultCode: Number(ipnData.resultCode)
          };
          await PaymentRepository.updateById(payment._id.toString(), updateData);
    
          // Cập nhật trạng thái order liên quan
          await StiOrderRepository.updateById(payment.orderId.toString(), {
            is_paid: true,
            order_status: 'Processing',
          });
    
        } else {
          // Thanh toán thất bại
          const updateData = {
            status: 'Failed' as const,
            failedAt: new Date(),
            errorMessage: ipnData.message,
            momoResultCode: ipnData.resultCode
          };
          await PaymentRepository.updateById(payment._id.toString(), updateData);
    
          console.warn(` Payment ${payment._id} failed:`, ipnData.message);
        }
      } catch (error) {
        console.error(' updatePaymentAndOrder error:', error);
        throw error;
      }
}

interface CreatePaymentRequest {
    paymentMethod: 'MoMo' | 'Cash';
    // Bỏ amount - sẽ lấy từ order
}

// Helper functions to reduce complexity
async function validatePaymentRequest(orderId: string, paymentMethod: string) {
    if (!orderId || !paymentMethod) {
        return { success: false, message: 'Thiếu thông tin bắt buộc: orderId, paymentMethod' };
    }

    if (!['MoMo', 'Cash'].includes(paymentMethod)) {
        return { success: false, message: 'Phương thức thanh toán không hợp lệ' };
    }

    return { success: true };
}

async function validateOrder(orderId: string) {
    const stiOrder = await StiOrderRepository.findOrderById(orderId);
    if (!stiOrder) {
        return { success: false, message: 'STI Order không tìm thấy' };
    }

    if (stiOrder.is_paid) {
        return { success: false, message: 'Order này đã được thanh toán rồi' };
    }

    if (stiOrder.total_amount <= 0) {
        return { success: false, message: 'Số tiền thanh toán phải lớn hơn 0' };
    }

    const existingPayment = await PaymentRepository.findByOrderId(orderId);
    if (existingPayment && existingPayment.status === 'Completed') {
        return { success: false, message: 'Order này đã được thanh toán rồi' };
    }

    return { success: true, stiOrder };
}

async function processCashPayment(payment: IPayment, orderId: string, staffUserId: string) {
    await StiOrderRepository.updateById(orderId, {
        is_paid: true,
        order_status: 'Processing'
    });

    return {
        success: true,
        message: 'Tạo payment thành công',
        data: {
            paymentId: payment._id,
            orderId: payment.orderId,
            customerId: payment.customerId,
            amount: payment.amount,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            paymentType: payment.paymentType,
            createdBy: staffUserId
        }
    };
}

async function processMoMoPayment(payment: IPayment, amount: number, staffUserId: string) {
    const momoResponse = await momoService.createPayment({
        orderId: payment._id.toString(),
        amount
    });

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
    if (!updatedPayment) {
        throw new Error('Lỗi cập nhật payment');
    }

    return {
        success: true,
        message: 'Tạo payment thành công',
        data: {
            paymentId: updatedPayment._id,
            orderId: updatedPayment.orderId,
            customerId: updatedPayment.customerId,
            amount: updatedPayment.amount,
            status: updatedPayment.status,
            paymentMethod: updatedPayment.paymentMethod,
            paymentType: updatedPayment.paymentType,
            paymentUrl: updatedPayment.paymentUrl,
            qrCodeUrl: momoResponse.qrCodeUrl,
            deeplink: momoResponse.deeplink,
            createdBy: staffUserId
        }
    };
}

/**
 * Tạo payment request mới - Chỉ staff mới được tạo payment
 * POST /api/payment/create
 */
router.post('/create/:orderId', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response) => {
    try {
        const orderId = req.params.orderId;
        const { paymentMethod }: CreatePaymentRequest = req.body;
        const staffUserId = req.jwtUser?.userId;

        if (!staffUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Validate request
        const validation = await validatePaymentRequest(orderId, paymentMethod);
        if (!validation.success) {
            return res.status(400).json(validation);
        }

        // Validate order
        const orderValidation = await validateOrder(orderId);
        if (!orderValidation.success) {
            return res.status(400).json(orderValidation);
        }

        const { stiOrder } = orderValidation;
        if (!stiOrder) {
            return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin order' });
        }

        const amount = stiOrder.total_amount;
        const customerId = stiOrder.customer_id.toString();

        // Create payment record
        const paymentData: Partial<IPayment> = {
            orderId: MongoUtils.toObjectId(orderId),
            customerId: MongoUtils.toObjectId(customerId),
            paymentType: 'STI_Test',
            paymentMethod,
            amount,
            currency: 'VND',
            status: paymentMethod === 'Cash' ? 'Completed' : 'Pending',
            initiatedAt: new Date(),
            ...(paymentMethod === 'Cash' && { completedAt: new Date() })
        };

        const payment = await PaymentRepository.create(paymentData);

        // Process based on payment method
        if (paymentMethod === 'Cash') {
            const result = await processCashPayment(payment, orderId, staffUserId);
            return res.json(result);
        } else {
            const result = await processMoMoPayment(payment, amount, staffUserId);
            return res.json(result);
        }

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
        let payment = await PaymentRepository.findByMomoRequestId(ipnData.requestId);

        if (!payment) {
            console.log('🔍 Payment not found by requestId, trying orderId as Payment._id');
            try {
                // MoMo orderId chính là Payment._id
                if (MongoUtils.isValidObjectId(ipnData.orderId)) {
                    payment = await PaymentRepository.findById(ipnData.orderId);
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
        await updatePaymentAndOrder(payment, ipnData);

        // Check if already processed
        if (payment.status === 'Completed') {
            return res.status(200).json({
                success: true,
                message: 'Payment already processed'
            });
        }

        // Phản hồi cho MoMo
        res.status(200).json({
            success: true,
            message: 'IPN processed successfully'
        });

    } catch (error: any) {
        console.error('MoMo IPN error:', error);
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
            res.redirect(`${process.env.MOMO_REDIRECT_URL}?orderId=${orderId}&amount=${payment.amount}`);
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
router.get('/:orderId', authenticateToken, authorizeRoles('staff', 'admin', 'customer'), async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const userId = req.jwtUser?.userId;
        const userRole = req.jwtUser?.role;

        // Tìm payment
        const payment = await PaymentRepository.findByOrderId(orderId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment không tìm thấy'
            });
        }

        // Kiểm tra quyền truy cập
        if (userRole === 'customer') {
            // Customer chỉ được xem payment của mình
            if (payment.customerId.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền truy cập payment này'
                });
            }
        }
        // Staff và Admin có thể xem tất cả

        res.json({
            success: true,
            data: {
                paymentId: payment._id,
                orderId: payment.orderId,
                customerId: payment.customerId,
                amount: payment.amount,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                paymentType: payment.paymentType,
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
 * Lấy danh sách payments - Staff và Admin có thể xem tất cả, Customer chỉ xem của mình
 * GET /api/payment/
 */
router.get('/', authenticateToken, authorizeRoles('staff', 'admin', 'customer'), async (req: Request, res: Response) => {
    try {
        const userId = req.jwtUser?.userId;
        const userRole = req.jwtUser?.role;
        const { status, page = 1, limit = 10, customerId } = req.query;

        let targetCustomerId = userId; // Mặc định là user hiện tại

        if (userRole === 'staff' || userRole === 'admin') {
            // Staff/Admin có thể xem payment của customer khác
            if (customerId && typeof customerId === 'string') {
                targetCustomerId = customerId;
            } else {
                // Nếu không chỉ định customerId, staff/admin sẽ xem tất cả
                // Cần implement method getAllPayments trong PaymentRepository
                // Tạm thời để trống để xem tất cả
                targetCustomerId = undefined;
            }
        }

        let result;
        if (targetCustomerId) {
            result = await PaymentRepository.findByCustomerId(
                targetCustomerId,
                status as any,
                Number(page),
                Number(limit)
            );
        } else {
            // Staff/Admin xem tất cả payments
            result = await PaymentRepository.getAllPayments(
                status as any,
                Number(page),
                Number(limit)
            );
        }

        res.json({
            success: true,
            data: {
                payments: result.payments.map(p => ({
                    paymentId: p._id,
                    orderId: p.orderId,
                    customerId: p.customerId,
                    amount: p.amount,
                    status: p.status,
                    paymentMethod: p.paymentMethod,
                    paymentType: p.paymentType,
                    createdAt: p.createdAt,
                    completedAt: p.completedAt
                })),
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: result.total,
                    totalPages: Math.ceil(result.total / Number(limit))
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
 * Test endpoint để kiểm tra MoMo integration - Chỉ staff/admin mới test được
 * GET /api/payment/test/momo
 */
router.get('/test/momo', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response) => {
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
 * Test tạo payment đơn giản - Chỉ staff/admin mới test được
 * GET /api/payment/test/simple
 */
router.get('/test/simple', authenticateToken, authorizeRoles('staff', 'admin'), async (req: Request, res: Response) => {
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