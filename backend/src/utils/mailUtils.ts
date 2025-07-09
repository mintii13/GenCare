import nodemailer from 'nodemailer';
import { RandomUtils } from './randomUtils';
export class MailUtils{
    public static async sendPasswordForGoogle(emailSendTo: string, password: string) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY ?? '',
                pass: process.env.EMAIL_APP_PASSWORD ?? ''
            }
        })

        const mailContent = {
            from: `"Mật khẩu đăng nhập GenCare" <${process.env.EMAIL_FOR_VERIFY ?? null}>`,
            to: emailSendTo,
            subject: `Mật khẩu hiện tại của email ${emailSendTo} là:`,
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                        <div style="max-width: 500px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <h2>Mật khẩu của bạn là: <strong style="color:#2a9d8f;">${password}</strong></h2>
                            <p>Mật khẩu này sẽ được sử dụng để đăng nhập trong hệ thống GenCare của chúng tôi</p>
                            <p>Đường dẫn đến trang web là: ${process.env.APP_URL ?? 'http://localhost:5173'}</p>
                            <p>Trân trọng,</p>
                            <h4>${process.env.APP_NAME ?? 'GenCare'}</h4>
                        </div>
                    </body>`
        }
        if (!emailSendTo) {
            return {
                success: false,
                message: "Mail does not exist"
            }
        }
        await transporter.sendMail(mailContent);            //gửi mail với content đã thiết lập
        return {
            success: true,
            message: "Send mail successfully"
        }
    }
    
    public static async sendOtpForRegister(emailSendTo: string) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY ?? '',
                pass: process.env.EMAIL_APP_PASSWORD ?? ''
            }
        })

        const otpGenerator = RandomUtils.generateRandomOTP(100000,999999);

        const mailContent = {
            from: `"Xác thực OTP" <${process.env.EMAIL_FOR_VERIFY ?? null}>`,
            to: emailSendTo,
            subject: "Mã xác thực OTP của bạn là: ",
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                        <div style="max-width: 500px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <h2>Mã OTP của bạn là: <strong style="color:#2a9d8f;">${otpGenerator}</strong></h2>
                            <p>OTP sẽ hết hạn trong 5 phút.</p>
                            <p>Trân trọng,</p>
                            <h4>${process.env.APP_NAME ?? 'GenCare'}</h4>
                        </div>
                    </body>`
        }
        if (!emailSendTo) {
            console.error("Không có email người nhận!");
        }
        await transporter.sendMail(mailContent);            //gửi mail với content đã thiết lập
        return otpGenerator;
    }

    public static async sendStiOrderConfirmation(customerName: string, orderDate: string, totalAmount: number, emailSendTo: string, packageName?: string, testNames?: string[]) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY ?? '',
                pass: process.env.EMAIL_APP_PASSWORD ?? ''
            }
        })
        const hasPackage = !!packageName;
        const hasTests = testNames.length > 0;
        const mailContent = {
            from: `"Đăng ký xét nghiệm thành công" <${process.env.EMAIL_FOR_VERIFY ?? null}>`,
            to: emailSendTo,
            subject: "Mã xác thực OTP của bạn là: ",
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <h2>Xin chào ${customerName},</h2>
                    <p>Bạn đã đăng ký xét nghiệm STI thành công. Dưới đây là thông tin chi tiết:</p>

                    ${hasPackage ? `<p><strong>Gói xét nghiệm:</strong> ${packageName}</p>` : ''}
                    ${hasTests ? `
                        <p><strong>Các xét nghiệm:</strong></p>
                        <ul style="padding-left: 20px;">
                        ${testNames.map(test => `<li>${test}</li>`).join('')}
                        </ul>` : ''
                    }

                    <p><strong>Ngày đặt lịch:</strong> ${orderDate}</p>
                    <p><strong>Tổng chi phí:</strong> ${totalAmount.toLocaleString()} VND</p>

                    <p>Bạn có thể truy cập hệ thống tại: ${process.env.APP_URL ?? 'http://localhost:5173'}</p>
                    <p>Trân trọng,</p>
                    <h4>${process.env.APP_NAME ?? 'GenCare'}</h4>
                    </div>
                </body>`
        }
        if (!emailSendTo) {
            return {
                success: false,
                message: "Mail does not exist"
            }
        }
        await transporter.sendMail(mailContent);            //gửi mail với content đã thiết lập
        return {
            success: true,
            message: "Send mail successfully"
        }
    }

    public static async sendReminderEmail(emailSendTo: string, pillNumber: number, pillType: string, time: string) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY ?? '',
                pass: process.env.EMAIL_APP_PASSWORD ?? ''
            },
            tls:{
                rejectUnauthorized: false
            }
        });

        const mailContent = {
            from: `"Nhắc uống thuốc" <${process.env.EMAIL_FOR_VERIFY ?? ''}>`,
            to: emailSendTo,
            subject: "Nhắc nhở uống thuốc",
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 500px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h2>Đến giờ uống thuốc số: <strong style="color:#2a9d8f;">${pillNumber}</strong> (${pillType})</h2>
                        <p>Thời gian nhắc: ${time}</p>
                        <p>Vui lòng uống thuốc đúng giờ để đảm bảo hiệu quả.</p>
                        <p>Bạn có thể truy cập hệ thống tại: ${process.env.APP_URL ?? 'http://localhost:5173'}</p>
                        <p>Trân trọng,</p>
                        <h4>${process.env.APP_NAME ?? 'GenCare'}</h4>
                    </div>
                </body>`
        };

        if (!emailSendTo) {
            console.error("Không có email người nhận!");
            return;
        }

        await transporter.sendMail(mailContent);
    }

}
