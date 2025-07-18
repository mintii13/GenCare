import { Request, Response, Router } from 'express';
import VNPaymentService from '../services/vnPaymentService';
import { StiOrderRepository } from '../repositories/stiOrderRepository';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import {
    validateCreatePayment,
    validatePaymentStatus,
    validatePagination,
    validateStatistics,
    validateVNPayCallback,
    vnpayRequestLogger
} from '../middlewares/vnPaymentValidation';

const router = Router();

// Apply request logger cho tất cả VNPay routes
router.use(vnpayRequestLogger);

/**
 * POST /api/vnpayment/create
 * Tạo URL thanh toán VNPay
 */
router.post('/create',
    authenticateToken,
    authorizeRoles('customer'),
    validateCreatePayment,
    async (req: Request, res: Response) => {
        try {
            const { order_id, bank_code, locale } = req.body;
            const userId = (req as any).jwtUser?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User authentication required'
                });
            }

            // Kiểm tra đơn hàng tồn tại và thuộc về user
            const order = await StiOrderRepository.findOrderById(order_id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Đơn hàng không tồn tại'
                });
            }

            // Kiểm tra quyền sở hữu đơn hàng
            if (order.customer_id.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền thanh toán đơn hàng này'
                });
            }

            // Lấy IP address
            const ipAddr = VNPaymentService.getClientIpAddress(req);

            // Tạo URL thanh toán
            const paymentResult = await VNPaymentService.createPaymentUrl({
                orderId: order_id,
                amount: order.total_amount,
                orderInfo: `Thanh toan don hang STI ${order_id}`,
                ipAddr: ipAddr,
                bankCode: bank_code,
                locale: locale
            });

            if (!paymentResult.success) {
                return res.status(500).json(paymentResult);
            }

            res.json({
                success: true,
                data: {
                    payment_url: paymentResult.paymentUrl,
                    txn_ref: paymentResult.txnRef,
                    order_id: order_id,
                    amount: order.total_amount
                },
                message: 'Tạo URL thanh toán thành công'
            });

        } catch (error) {
            console.error('Payment creation error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống khi tạo thanh toán'
            });
        }
    }
);

/**
 * GET /api/vnpayment/return
 * Xử lý callback return từ VNPay
 */
router.get('/return', validateVNPayCallback, async (req: Request, res: Response) => {
    try {
        const vnp_Params = req.query;

        console.log('VNPay Return Callback:', vnp_Params);

        // Verify chữ ký
        const verifyResult = VNPaymentService.verifyReturnUrl(vnp_Params);

        if (!verifyResult.isValid) {
            console.error('Invalid VNPay signature');
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=invalid_signature`);
        }

        const { orderId: txnRef, responseCode } = verifyResult;

        if (!txnRef) {
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=missing_txn_ref`);
        }

        // Xử lý kết quả thanh toán
        const processResult = await VNPaymentService.processPaymentResult(
            txnRef,
            responseCode!,
            vnp_Params
        );

        if (!processResult.success) {
            console.error('Failed to process payment result:', processResult.message);
            return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=process_failed`);
        }

        // Redirect về frontend với kết quả
        const redirectParams = new URLSearchParams({
            txn_ref: txnRef,
            response_code: responseCode!,
            order_id: processResult.order?._id?.toString() || '',
            status: responseCode === '00' ? 'success' : 'failed'
        });

        if (responseCode === '00') {
            res.redirect(`${process.env.FRONTEND_URL}/payment/success?${redirectParams}`);
        } else {
            res.redirect(`${process.env.FRONTEND_URL}/payment/failed?${redirectParams}`);
        }

    } catch (error) {
        console.error('VNPay return error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=system_error`);
    }
});

/**
 * GET /api/vnpayment/ipn
 * Xử lý IPN từ VNPay
 */
router.get('/ipn', async (req: Request, res: Response) => {
    try {
        const vnp_Params = req.query;

        console.log('VNPay IPN Callback:', vnp_Params);

        // Verify IPN
        const verifyResult = VNPaymentService.verifyIPN(vnp_Params);

        if (!verifyResult.isValid) {
            console.error('Invalid VNPay IPN signature');
            return res.status(200).json({
                RspCode: '97',
                Message: 'Checksum failed'
            });
        }

        const { orderId: txnRef, responseCode, amount } = verifyResult;

        if (!txnRef) {
            return res.status(200).json({
                RspCode: '01',
                Message: 'Order not found'
            });
        }

        // Xử lý kết quả thanh toán
        const processResult = await VNPaymentService.processPaymentResult(
            txnRef,
            responseCode!,
            vnp_Params
        );

        if (!processResult.success) {
            console.error('Failed to process IPN payment result:', processResult.message);
            return res.status(200).json({
                RspCode: '99',
                Message: 'Unknown error'
            });
        }

        res.status(200).json({
            RspCode: '00',
            Message: 'Success'
        });

    } catch (error) {
        console.error('VNPay IPN error:', error);
        res.status(200).json({
            RspCode: '99',
            Message: 'Unknown error'
        });
    }
});

/**
 * GET /api/vnpayment/status/:order_id
 * Lấy trạng thái thanh toán theo order ID
 */
router.get('/status/:order_id',
    authenticateToken,
    validatePaymentStatus,
    async (req: Request, res: Response) => {
        try {
            const { order_id } = req.params;
            const userId = (req as any).jwtUser?.userId;
            const userRole = (req as any).jwtUser?.role;

            // Kiểm tra quyền truy cập
            if (userRole !== 'admin' && userRole !== 'staff') {
                const order = await StiOrderRepository.findOrderById(order_id);
                if (!order) {
                    return res.status(404).json({
                        success: false,
                        message: 'Đơn hàng không tồn tại'
                    });
                }

                if (order.customer_id.toString() !== userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Không có quyền truy cập'
                    });
                }
            }

            const result = await VNPaymentService.getPaymentStatus(order_id);

            if (result.success) {
                res.json(result);
            } else {
                res.status(404).json(result);
            }

        } catch (error) {
            console.error('Get payment status error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * GET /api/vnpayment/history
 * Lấy lịch sử thanh toán của customer
 */
router.get('/history',
    authenticateToken,
    authorizeRoles('customer'),
    validatePagination,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).jwtUser?.userId;
            const { page, limit } = req.query;

            const result = await VNPaymentService.getCustomerPaymentHistory(
                userId,
                parseInt(page as string),
                parseInt(limit as string)
            );

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }

        } catch (error) {
            console.error('Get payment history error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * GET /api/vnpayment/statistics
 * Lấy thống kê thanh toán (Admin/Staff only)
 */
router.get('/statistics',
    authenticateToken,
    authorizeRoles('admin', 'staff'),
    validateStatistics,
    async (req: Request, res: Response) => {
        try {
            const { start_date, end_date } = req.query;

            const startDate = start_date ? new Date(start_date as string) : undefined;
            const endDate = end_date ? new Date(end_date as string) : undefined;

            const result = await VNPaymentService.getPaymentStatistics(startDate, endDate);

            if (result.success) {
                res.json(result);
            } else {
                res.status(500).json(result);
            }

        } catch (error) {
            console.error('Get payment statistics error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống'
            });
        }
    }
);

/**
 * GET /api/vnpayment/test
 * Test endpoint để kiểm tra VNPay integration
 */
router.get('/test', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'VNPay endpoint is working',
        timestamp: new Date().toISOString(),
        server: 'GenCare Backend',
        vnpay_config: {
            tmn_code: process.env.VNP_TMN_CODE ? '***' + process.env.VNP_TMN_CODE.slice(-4) : 'Not configured',
            return_url: process.env.VNP_RETURN_URL,
            ipn_url: process.env.VNP_IPN_URL,
            environment: process.env.NODE_ENV
        }
    });
});

export default router;