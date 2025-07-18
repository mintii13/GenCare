import dotenv from 'dotenv';

dotenv.config();

export const vnpayConfig = {
    vnp_TmnCode: process.env.VNP_TMN_CODE!,
    vnp_HashSecret: process.env.VNP_HASH_SECRET!,
    vnp_Url: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_Api: process.env.VNP_API || "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
    vnp_ReturnUrl: process.env.VNP_RETURN_URL || "http://localhost:3000/api/vnpayment/return",
    vnp_IpnUrl: process.env.VNP_IPN_URL || "http://localhost:3000/api/vnpayment/ipn"
};

// Validate required environment variables
export const validateVNPayConfig = () => {
    const requiredFields = ['vnp_TmnCode', 'vnp_HashSecret'];

    for (const field of requiredFields) {
        if (!vnpayConfig[field as keyof typeof vnpayConfig]) {
            throw new Error(`Missing required VNPay configuration: ${field}`);
        }
    }

    console.log('✅ VNPay configuration validated successfully');
};

// VNPay response codes and their meanings
export const vnpayResponseCodes = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
    '99': 'Các lỗi khác (lỗi không xác định)'
};

export const getVNPayResponseMessage = (code: string): string => {
    return vnpayResponseCodes[code as keyof typeof vnpayResponseCodes] || 'Lỗi không xác định';
};