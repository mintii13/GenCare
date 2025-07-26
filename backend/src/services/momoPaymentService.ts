// src/services/momoPaymentService.ts
import crypto from 'crypto';
import axios from 'axios';

export interface MoMoPaymentRequest {
    orderId: string;
    amount: number;
    extraData?: string;
    requestType?: string;
    redirectUrl?: string;
    ipnUrl?: string;
    lang?: string;
}

export interface MoMoPaymentResponse {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    responseTime: number;
    message: string;
    resultCode: number;
    payUrl?: string;
    deeplink?: string;
    qrCodeUrl?: string;
}

export interface MoMoIPNRequest {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    orderInfo: string;
    orderType: string;
    transId: number;
    resultCode: number;
    message: string;
    payType: string;
    responseTime: number;
    extraData: string;
    signature: string;
}

export class MoMoPaymentService {
    private readonly partnerCode: string;
    private readonly accessKey: string;
    private readonly secretKey: string;
    private readonly endpoint: string;

    constructor() {
        this.partnerCode = process.env.MOMO_PARTNER_CODE || '';
        this.accessKey = process.env.MOMO_ACCESS_KEY || '';
        this.secretKey = process.env.MOMO_SECRET_KEY || '';
        this.endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';

        if (!this.partnerCode || !this.accessKey || !this.secretKey) {
            throw new Error('MoMo payment configuration is missing');
        }
    }

    /**
     * Tạo chữ ký HMAC SHA256 cho MoMo
     */
    private createSignature(rawData: string): string {
        return crypto
            .createHmac('sha256', this.secretKey)
            .update(rawData)
            .digest('hex');
    }

    /**
     * Tạo request ID duy nhất
     */
    private generateRequestId(): string {
        return this.partnerCode + new Date().getTime();
    }

    /**
     * Tạo payment request đến MoMo
     */
    async createPayment(paymentData: MoMoPaymentRequest): Promise<MoMoPaymentResponse> {
        try {
            const {
                orderId,
                amount,
                extraData = '',
                requestType = 'payWithMethod',
                redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:5173/payment/success',
                ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:3000/api/payment/momo/ipn',
                lang = 'vi'
            } = paymentData;

            // Tự động tạo orderInfo
            const orderInfo = `Thanh toan GenCare - ${orderId}`;

            const requestId = this.generateRequestId();

            // Tạo raw signature string theo đúng thứ tự alphabet của MoMo
            // Không được có khoảng trắng và phải theo đúng format
            const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

            console.log('Raw signature string:', rawSignature);

            const signature = this.createSignature(rawSignature);
            console.log('Generated signature:', signature);

            const requestBody = {
                partnerCode: this.partnerCode,
                partnerName: "GenCare Health",
                storeId: "MomoTestStore",
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                lang,
                extraData,
                requestType,
                signature
            };

            console.log('MoMo Payment Request:', JSON.stringify(requestBody, null, 2));

            const response = await axios.post(this.endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            console.log('MoMo Response:', JSON.stringify(response.data, null, 2));
            return response.data as MoMoPaymentResponse;

        } catch (error: any) {
            console.error('MoMo Payment Error:', error.response?.data || error.message);

            // Log chi tiết để debug
            if (error.response?.data) {
                console.error('MoMo Error Details:', JSON.stringify(error.response.data, null, 2));
            }

            throw new Error(`MoMo payment creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Xác thực chữ ký IPN từ MoMo
     */
    verifyIPNSignature(ipnData: MoMoIPNRequest): boolean {
        try {
            const {
                partnerCode,
                orderId,
                requestId,
                amount,
                orderInfo,
                orderType,
                transId,
                resultCode,
                message,
                payType,
                responseTime,
                extraData
            } = ipnData;

            // Tạo raw signature string theo thứ tự alphabet cho IPN
            const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

            const expectedSignature = this.createSignature(rawSignature);

            console.log('IPN Raw signature string:', rawSignature);
            console.log('Expected signature:', expectedSignature);
            console.log('Received signature:', ipnData.signature);

            return expectedSignature === ipnData.signature;

        } catch (error) {
            console.error('Error verifying MoMo IPN signature:', error);
            return false;
        }
    }

    /**
     * Kiểm tra trạng thái giao dịch
     */
    async queryTransaction(orderId: string): Promise<any> {
        try {
            const requestId = this.generateRequestId();

            // Raw signature cho query request
            const rawSignature = `accessKey=${this.accessKey}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}`;
            const signature = this.createSignature(rawSignature);

            const requestBody = {
                partnerCode: this.partnerCode,
                requestId,
                orderId,
                signature,
                lang: 'vi'
            };

            const response = await axios.post(
                'https://test-payment.momo.vn/v2/gateway/api/query',
                requestBody,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            return response.data;

        } catch (error: any) {
            console.error('MoMo Query Error:', error.response?.data || error.message);
            throw new Error(`MoMo transaction query failed: ${error.message}`);
        }
    }

    /**
     * Test connection với MoMo (không tạo signature phức tạp)
     */
    async testConnection(): Promise<{ success: boolean; message: string; config?: any }> {
        try {
            // Test với dữ liệu đơn giản
            const testOrderId = `TESTCONN_${Date.now()}`;
            const testAmount = 1000;
            const requestId = this.generateRequestId();

            // Sử dụng extraData trống để tránh lỗi signature
            const extraData = '';
            const orderInfo = 'Test connection';
            const redirectUrl = 'http://localhost:3000/test';
            const ipnUrl = 'http://localhost:3000/test-ipn';
            const requestType = 'payWithMethod';

            const rawSignature = `accessKey=${this.accessKey}&amount=${testAmount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${testOrderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

            const signature = this.createSignature(rawSignature);

            const requestBody = {
                partnerCode: this.partnerCode,
                partnerName: "GenCare Health",
                storeId: "MomoTestStore",
                requestId,
                amount: testAmount,
                orderId: testOrderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                lang: 'vi',
                extraData,
                requestType,
                signature
            };

            console.log('Test connection request:', JSON.stringify(requestBody, null, 2));
            console.log('Test raw signature:', rawSignature);

            const response = await axios.post(this.endpoint, requestBody, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            return {
                success: response.data.resultCode === 0,
                message: response.data.message,
                config: {
                    partnerCode: this.partnerCode,
                    endpoint: this.endpoint,
                    accessKey: this.accessKey ? '***SET***' : 'NOT_SET',
                    secretKey: this.secretKey ? '***SET***' : 'NOT_SET'
                }
            };

        } catch (error: any) {
            console.error('MoMo test connection error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                config: {
                    partnerCode: this.partnerCode,
                    endpoint: this.endpoint,
                    accessKey: this.accessKey ? '***SET***' : 'NOT_SET',
                    secretKey: this.secretKey ? '***SET***' : 'NOT_SET'
                }
            };
        }
    }
}