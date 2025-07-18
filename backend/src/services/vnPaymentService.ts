import crypto from 'crypto';
import moment from 'moment';
import qs from 'qs';
import { vnpayConfig, getVNPayResponseMessage } from '../configs/vnpay';
import VNPaymentRepository from '../repositories/vnPaymentRepository';
import { StiOrderRepository } from '../repositories/stiOrderRepository';

export interface CreatePaymentParams {
    orderId: string;
    amount: number;
    orderInfo: string;
    ipAddr: string;
    locale?: string;
    bankCode?: string;
}

export interface PaymentResult {
    success: boolean;
    paymentUrl?: string;
    txnRef?: string;
    message?: string;
}

export interface VerifyResult {
    isValid: boolean;
    responseCode?: string;
    orderId?: string;
    amount?: number;
    message?: string;
}

class VNPaymentService {

    /**
     * Tạo URL thanh toán VNPay
     */
    async createPaymentUrl(params: CreatePaymentParams): Promise<PaymentResult> {
        try {
            const {
                orderId,
                amount,
                orderInfo,
                ipAddr,
                locale = 'vn',
                bankCode
            } = params;

            // Kiểm tra đơn hàng tồn tại
            const order = await StiOrderRepository.findOrderById(orderId);
            if (!order) {
                return {
                    success: false,
                    message: 'Đơn hàng không tồn tại'
                };
            }

            // Kiểm tra trạng thái thanh toán
            if (order.payment_status === 'Paid') {
                return {
                    success: false,
                    message: 'Đơn hàng đã được thanh toán'
                };
            }

            // Tạo mã giao dịch unique
            const txnRef = `${orderId}_${Date.now()}`;

            // Thiết lập timezone
            process.env.TZ = 'Asia/Ho_Chi_Minh';
            const date = new Date();
            const createDate = moment(date).format('YYYYMMDDHHmmss');

            let vnp_Params: any = {};
            vnp_Params['vnp_Version'] = '2.1.0';
            vnp_Params['vnp_Command'] = 'pay';
            vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
            vnp_Params['vnp_Locale'] = locale;
            vnp_Params['vnp_CurrCode'] = 'VND';
            vnp_Params['vnp_TxnRef'] = txnRef;
            vnp_Params['vnp_OrderInfo'] = orderInfo;
            vnp_Params['vnp_OrderType'] = 'other';
            vnp_Params['vnp_Amount'] = amount * 100; // VNPay yêu cầu nhân với 100
            vnp_Params['vnp_ReturnUrl'] = vnpayConfig.vnp_ReturnUrl;
            vnp_Params['vnp_IpAddr'] = ipAddr;
            vnp_Params['vnp_CreateDate'] = createDate;

            if (bankCode) {
                vnp_Params['vnp_BankCode'] = bankCode;
            }

            // Sắp xếp params
            vnp_Params = this.sortObject(vnp_Params);

            // Tạo chữ ký
            const signData = qs.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
            vnp_Params['vnp_SecureHash'] = signed;

            // Tạo URL
            const paymentUrl = vnpayConfig.vnp_Url + '?' + qs.stringify(vnp_Params, { encode: false });

            // Lưu payment record vào database
            await VNPaymentRepository.create({
                order_id: orderId,
                vnp_txn_ref: txnRef,
                amount: amount,
                vnp_order_info: orderInfo,
                ip_address: ipAddr
            });

            return {
                success: true,
                paymentUrl,
                txnRef
            };
        } catch (error) {
            console.error('Error creating payment URL:', error);
            return {
                success: false,
                message: 'Lỗi tạo URL thanh toán: ' + (error as Error).message
            };
        }
    }

    /**
     * Xác thực callback từ VNPay (Return URL)
     */
    verifyReturnUrl(vnp_Params: any): VerifyResult {
        try {
            const secureHash = vnp_Params['vnp_SecureHash'];
            const orderId = vnp_Params['vnp_TxnRef'];
            const responseCode = vnp_Params['vnp_ResponseCode'];
            const amount = parseInt(vnp_Params['vnp_Amount']) / 100;

            // Xóa hash và hashType để verify
            const paramsToVerify = { ...vnp_Params };
            delete paramsToVerify['vnp_SecureHash'];
            delete paramsToVerify['vnp_SecureHashType'];

            // Sắp xếp params
            const sortedParams = this.sortObject(paramsToVerify);

            // Tạo chữ ký để so sánh
            const signData = qs.stringify(sortedParams, { encode: false });
            const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            const isValid = secureHash === signed;

            return {
                isValid,
                responseCode,
                orderId,
                amount,
                message: isValid ? getVNPayResponseMessage(responseCode) : 'Chữ ký không hợp lệ'
            };
        } catch (error) {
            console.error('Error verifying return URL:', error);
            return {
                isValid: false,
                message: 'Lỗi xác thực: ' + (error as Error).message
            };
        }
    }

    /**
     * Xử lý IPN (Instant Payment Notification)
     */
    verifyIPN(vnp_Params: any): VerifyResult {
        try {
            const secureHash = vnp_Params['vnp_SecureHash'];
            const orderId = vnp_Params['vnp_TxnRef'];
            const responseCode = vnp_Params['vnp_ResponseCode'];
            const amount = parseInt(vnp_Params['vnp_Amount']) / 100;

            // Xóa hash để verify
            const paramsToVerify = { ...vnp_Params };
            delete paramsToVerify['vnp_SecureHash'];
            delete paramsToVerify['vnp_SecureHashType'];

            // Sắp xếp và verify
            const sortedParams = this.sortObject(paramsToVerify);
            const signData = qs.stringify(sortedParams, { encode: false });
            const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
            const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

            const isValid = secureHash === signed;

            return {
                isValid,
                responseCode,
                orderId,
                amount,
                message: isValid ? getVNPayResponseMessage(responseCode) : 'Chữ ký không hợp lệ'
            };
        } catch (error) {
            console.error('Error verifying IPN:', error);
            return {
                isValid: false,
                message: 'Lỗi xác thực IPN: ' + (error as Error).message
            };
        }
    }

    /**
     * Xử lý kết quả thanh toán và cập nhật database
     */
    async processPaymentResult(
        txnRef: string,
        responseCode: string,
        vnpParams: any
    ): Promise<{ success: boolean; message: string; order?: any }> {
        try {
            // Tìm payment record
            const payment = await VNPaymentRepository.findByTxnRef(txnRef);
            if (!payment) {
                return {
                    success: false,
                    message: 'Không tìm thấy thông tin thanh toán'
                };
            }

            // Kiểm tra trạng thái hiện tại
            if (payment.payment_status !== 'Pending') {
                return {
                    success: true,
                    message: 'Giao dịch đã được xử lý trước đó',
                    order: payment.order_id
                };
            }

            // Cập nhật trạng thái payment
            let paymentStatus: 'Success' | 'Failed' = 'Failed';
            if (responseCode === '00') {
                paymentStatus = 'Success';
            }

            const updateData = {
                payment_status: paymentStatus,
                vnp_response_code: responseCode,
                vnp_transaction_no: vnpParams.vnp_TransactionNo,
                vnp_bank_code: vnpParams.vnp_BankCode,
                vnp_pay_date: vnpParams.vnp_PayDate ?
                    moment(vnpParams.vnp_PayDate, 'YYYYMMDDHHmmss').toDate() :
                    new Date()
            };

            const updatedPayment = await VNPaymentRepository.updateByTxnRef(txnRef, updateData);

            // Cập nhật trạng thái đơn hàng nếu thanh toán thành công
            if (paymentStatus === 'Success' && updatedPayment) {
                await StiOrderRepository.updatePaymentStatus(payment.order_id.toString(), 'Paid');
            }

            return {
                success: true,
                message: getVNPayResponseMessage(responseCode),
                order: updatedPayment?.order_id
            };
        } catch (error) {
            console.error('Error processing payment result:', error);
            return {
                success: false,
                message: 'Lỗi xử lý kết quả thanh toán'
            };
        }
    }

    /**
     * Lấy trạng thái thanh toán theo order ID
     */
    async getPaymentStatus(orderId: string): Promise<{
        success: boolean;
        data?: any;
        message?: string;
    }> {
        try {
            const payment = await VNPaymentRepository.findByOrderId(orderId);

            if (!payment) {
                return {
                    success: false,
                    message: 'Không tìm thấy thông tin thanh toán'
                };
            }

            return {
                success: true,
                data: {
                    payment_status: payment.payment_status,
                    amount: payment.amount,
                    vnp_txn_ref: payment.vnp_txn_ref,
                    vnp_response_code: payment.vnp_response_code,
                    vnp_transaction_no: payment.vnp_transaction_no,
                    vnp_bank_code: payment.vnp_bank_code,
                    vnp_pay_date: payment.vnp_pay_date,
                    created_at: payment.created_at,
                    response_message: payment.vnp_response_code ?
                        getVNPayResponseMessage(payment.vnp_response_code) : null
                }
            };
        } catch (error) {
            console.error('Error getting payment status:', error);
            return {
                success: false,
                message: 'Lỗi lấy trạng thái thanh toán'
            };
        }
    }

    /**
     * Lấy lịch sử thanh toán của customer
     */
    async getCustomerPaymentHistory(
        customerId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        success: boolean;
        data?: any;
        message?: string;
    }> {
        try {
            const result = await VNPaymentRepository.findByCustomerId(customerId, page, limit);

            const formattedPayments = result.payments.map(payment => ({
                _id: payment._id,
                order_id: payment.order_id,
                amount: payment.amount,
                payment_status: payment.payment_status,
                vnp_txn_ref: payment.vnp_txn_ref,
                vnp_bank_code: payment.vnp_bank_code,
                vnp_pay_date: payment.vnp_pay_date,
                created_at: payment.created_at,
                response_message: payment.vnp_response_code ?
                    getVNPayResponseMessage(payment.vnp_response_code) : null
            }));

            return {
                success: true,
                data: {
                    payments: formattedPayments,
                    pagination: {
                        current_page: page,
                        total_pages: result.totalPages,
                        total_records: result.total,
                        limit
                    }
                }
            };
        } catch (error) {
            console.error('Error getting customer payment history:', error);
            return {
                success: false,
                message: 'Lỗi lấy lịch sử thanh toán'
            };
        }
    }

    /**
     * Lấy thống kê thanh toán (Admin only)
     */
    async getPaymentStatistics(startDate?: Date, endDate?: Date): Promise<{
        success: boolean;
        data?: any;
        message?: string;
    }> {
        try {
            const stats = await VNPaymentRepository.getPaymentStats(startDate, endDate);

            return {
                success: true,
                data: {
                    total_amount: stats.totalAmount,
                    successful_payments: stats.successfulPayments,
                    failed_payments: stats.failedPayments,
                    pending_payments: stats.pendingPayments,
                    success_rate: stats.successfulPayments > 0 ?
                        ((stats.successfulPayments / (stats.successfulPayments + stats.failedPayments)) * 100).toFixed(2) + '%' :
                        '0%',
                    period: {
                        start_date: startDate,
                        end_date: endDate
                    }
                }
            };
        } catch (error) {
            console.error('Error getting payment statistics:', error);
            return {
                success: false,
                message: 'Lỗi lấy thống kê thanh toán'
            };
        }
    }

    /**
     * Sắp xếp object theo key (cần thiết cho VNPay)
     */
    private sortObject(obj: any): any {
        const sorted: any = {};
        const str = [];

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key));
            }
        }

        str.sort();
        for (let i = 0; i < str.length; i++) {
            sorted[str[i]] = encodeURIComponent(obj[str[i]]).replace(/%20/g, "+");
        }

        return sorted;
    }

    /**
     * Lấy client IP address
     */
    getClientIpAddress(req: any): string {
        return req.ip ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.connection?.socket?.remoteAddress ||
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            '127.0.0.1';
    }
}

export default new VNPaymentService();