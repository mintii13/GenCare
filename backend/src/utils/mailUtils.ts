import nodemailer from 'nodemailer';
import { RandomUtils } from './randomUtils';
export class MailUtils{
    public static async sendPasswordForGoogle(emailSendTo: string, password: string) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY ?? '',
                pass: process.env.EMAIL_APP_PASSWORD ?? ''
            },
            tls:{
                rejectUnauthorized: false
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
            },
            tls:{
                rejectUnauthorized: false
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

    public static async sendStiOrderConfirmation(customerName: string, orderDate: string, total_amount: number, emailSendTo: string, packageName: string, testNames: string[]) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY ?? '',
                pass: process.env.EMAIL_APP_PASSWORD ?? ''
            },
            tls:{
                rejectUnauthorized: false
            }
        })
        const hasPackage = !!packageName;
        const hasTests = testNames.length > 0;
        let selectedOptionsHTML = '';
        if (hasPackage && hasTests) {
            selectedOptionsHTML = `
                <p><strong>Gói combo bạn đã chọn:</strong> ${packageName}</p>
                <p><strong>Các xét nghiệm lẻ bạn đã chọn:</strong></p>
                <ul>${testNames.map(t => `<li>${t}</li>`).join('')}</ul>
            `;
        } else if (hasPackage) {
            selectedOptionsHTML = `<p><strong>Bạn đã chọn gói combo:</strong> ${packageName}</p>`;
        } else if (hasTests) {
            selectedOptionsHTML = `
                <p><strong>Các xét nghiệm bạn đã chọn:</strong></p>
                <ul>${testNames.map(t => `<li>${t}</li>`).join('')}</ul>
            `;
        } else {
            selectedOptionsHTML = `<p><em>Không có gói hoặc xét nghiệm nào được chọn.</em></p>`;
        }
        const mailContent = {
            from: `"Đăng ký xét nghiệm thành công" <${process.env.EMAIL_FOR_VERIFY ?? null}>`,
            to: emailSendTo,
            subject: "Mã xác thực OTP của bạn là: ",
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <h2>Xin chào ${customerName},</h2>
                    <p>Bạn đã đăng ký xét nghiệm STI thành công. Dưới đây là thông tin chi tiết:</p>
                    ${selectedOptionsHTML}
                    <p><strong>Ngày đặt lịch:</strong> ${orderDate}</p>
                    <p><strong>Tổng chi phí:</strong> ${total_amount.toLocaleString('vi-VN')} VND</p>
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

    public static async sendStiResultNotification(
        customerName: string,
        birthYear: number,
        gender: string,
        diagnosis: string,
        resultValue: string,
        notes: string,
        isCritical: boolean,
        consultantName: string,
        staffName: string,
        sample: {
            timeReceived?: Date,
            timeTesting?: Date,
            sampleQualities?: Record<string, boolean | null>
        },
        testNames: string[],
        resultDate?: Date,
        emailSendTo?: string
    ) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY ?? '',
                pass: process.env.EMAIL_APP_PASSWORD ?? ''
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const formattedResultDate = resultDate ? new Date(resultDate).toLocaleDateString('vi-VN') : null;
        const receivedDate = sample?.timeReceived ? new Date(sample.timeReceived).toLocaleDateString('vi-VN') : null;
        const testingDate = sample?.timeTesting ? new Date(sample.timeTesting).toLocaleDateString('vi-VN') : null;

        let sampleQualityInfo = '';
        if (sample?.sampleQualities) {
            const qualities = Object.entries(sample.sampleQualities)
                .map(([test, quality]) => {
                    const status = quality === true ? 'Đạt' :
                        quality === false ? 'Không đạt' : 'Chưa có kết quả';
                    return `<li><strong>${test}:</strong> ${status}</li>`;
                })
                .join('');
            sampleQualityInfo = qualities ? `<ul>${qualities}</ul>` : '';
        }

        const mailContent = {
            from: `"Kết quả xét nghiệm STI" <${process.env.EMAIL_FOR_VERIFY ?? null}>`,
            to: emailSendTo,
            subject: "Kết quả xét nghiệm STI của bạn đã có",
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                        <h2>Xin chào ${customerName},</h2>
                        <p>Kết quả xét nghiệm STI của bạn đã có. Dưới đây là thông tin chi tiết:</p>

                        ${isCritical ? `<p style="color: red; font-weight: bold;">⚠️ Kết quả này cần được chú ý đặc biệt</p>` : ''}

                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Năm sinh:</strong> ${birthYear}</p>
                            <p><strong>Giới tính:</strong> ${gender}</p>
                            ${testNames.length > 0 ? `<p><strong>Các xét nghiệm:</strong> ${testNames.join(', ')}</p>` : ''}
                            ${formattedResultDate ? `<p><strong>Ngày có kết quả:</strong> ${formattedResultDate}</p>` : ''}
                            ${resultValue ? `<p><strong>Giá trị kết quả:</strong> ${resultValue}</p>` : ''}
                            ${diagnosis ? `<p><strong>Chẩn đoán:</strong> ${diagnosis}</p>` : ''}
                            ${notes ? `<p><strong>Ghi chú:</strong> ${notes}</p>` : ''}
                        </div>

                        ${sampleQualityInfo ? `
                            <div style="background-color: #e9f7ef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <h4>Chất lượng mẫu xét nghiệm:</h4>
                                ${sampleQualityInfo}
                            </div>
                        ` : ''}

                        ${receivedDate || testingDate ? `
                            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <h4>Thông tin mẫu xét nghiệm:</h4>
                                ${receivedDate ? `<p><strong>Ngày nhận mẫu:</strong> ${receivedDate}</p>` : ''}
                                ${testingDate ? `<p><strong>Ngày xét nghiệm:</strong> ${testingDate}</p>` : ''}
                            </div>
                        ` : ''}

                        <p><strong>Bác sĩ tư vấn:</strong> ${consultantName}</p>
                        <p><strong>Nhân viên lấy mẫu:</strong> ${staffName}</p>

                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            Để xem chi tiết kết quả và tư vấn thêm, vui lòng truy cập hệ thống tại:
                            <a href="${process.env.APP_URL ?? 'http://localhost:5173'}" style="color: #007bff;">
                                GenCare
                            </a>
                        </p>

                        <p style="color: #666; font-size: 14px;">
                            Nếu bạn có bất kỳ câu hỏi nào về kết quả xét nghiệm, vui lòng liên hệ với chúng tôi.
                        </p>

                        <p>Trân trọng,</p>
                        <h4>${process.env.APP_NAME ?? 'GenCare'}</h4>
                    </div>
                </body>`
        };

        if (!emailSendTo) {
            return {
                success: false,
                message: "Email is not found"
            };
        }

        try {
            await transporter.sendMail(mailContent);
            return {
                success: true,
                message: "Send result successfully",
                customerName,
                birthYear,
                gender,
                diagnosis,
                resultValue,
                notes,
                isCritical,
                consultantName,
                staffName,
                sample: {
                    timeReceived: sample?.timeReceived ?? null,
                    timeTesting: sample?.timeTesting ?? null,
                    sampleQualities: sample?.sampleQualities ?? null
                },
                testNames,
                resultDate: resultDate ?? null,
                emailSendTo
            };
        } catch (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                message: "Lỗi khi gửi email"
            };
        }
    }
    // public static async sendStiResultNotification(
    //     customerName: string,
    //     birthYear: number,
    //     gender: string,
    //     diagnosis: string,
    //     resultValue: string,
    //     notes: string,
    //     isCritical: boolean,
    //     consultantName: string,
    //     staffName: string,
    //     sample: {
    //         timeReceived?: Date,
    //         timeTesting?: Date,
    //         sampleQualities?: Record<string, boolean | null>
    //     },
    //     testNames: string[],
    //     resultDate?: Date,
    //     emailSendTo?: string
    // ) {
    //     const formattedResultDate = resultDate?.toLocaleDateString('vi-VN') ?? '';
    //     const receivedDate = sample?.timeReceived?.toLocaleDateString('vi-VN') ?? '';
    //     const testingDate = sample?.timeTesting?.toLocaleDateString('vi-VN') ?? '';

    //     let sampleQualityInfo = '';
    //     if (sample?.sampleQualities) {
    //         const qualities = Object.entries(sample.sampleQualities)
    //             .map(([test, quality]) => {
    //                 const status = quality === true ? 'Đạt' :
    //                     quality === false ? 'Không đạt' : 'Chưa có kết quả';
    //                 return `<li><strong>${test}:</strong> ${status}</li>`;
    //             })
    //             .join('');
    //         sampleQualityInfo = qualities ? `<ul>${qualities}</ul>` : '';
    //     }

    //     const htmlContent = `
    //     <html>
    //     <head><meta charset="utf-8"><title>Kết quả STI</title></head>
    //     <body style="font-family: Arial; padding: 20px;">
    //         <h2>KẾT QUẢ XÉT NGHIỆM STI</h2>
    //         <p><strong>Họ tên:</strong> ${customerName}</p>
    //         <p><strong>Năm sinh:</strong> ${birthYear}</p>
    //         <p><strong>Giới tính:</strong> ${gender}</p>
    //         <p><strong>Các xét nghiệm:</strong> ${testNames.join(', ')}</p>
    //         <p><strong>Ngày có kết quả:</strong> ${formattedResultDate}</p>
    //         <p><strong>Giá trị kết quả:</strong> ${resultValue}</p>
    //         <p><strong>Chẩn đoán:</strong> ${diagnosis}</p>
    //         <p><strong>Ghi chú:</strong> ${notes}</p>
    //         <p><strong>Trạng thái:</strong> ${isCritical ? '<span style="color:red">⚠️ Cần lưu ý đặc biệt</span>' : 'Bình thường'}</p>
    //         <h4>Thông tin mẫu:</h4>
    //         <p><strong>Ngày nhận mẫu:</strong> ${receivedDate}</p>
    //         <p><strong>Ngày xét nghiệm:</strong> ${testingDate}</p>
    //         ${sampleQualityInfo}
    //         <p><strong>Bác sĩ tư vấn:</strong> ${consultantName}</p>
    //         <p><strong>Nhân viên lấy mẫu:</strong> ${staffName}</p>
    //     </body>
    //     </html>
    //     `;

    //     // Tạo PDF bằng puppeteer
    //     const browser = await puppeteer.launch();
    //     const page = await browser.newPage();
    //     await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    //     const pdfBuffer = await page.pdf({ format: 'A4' });
    //     await browser.close();

    //     const transporter = nodemailer.createTransport({
    //         service: 'gmail',
    //         auth: {
    //             user: process.env.EMAIL_FOR_VERIFY ?? '',
    //             pass: process.env.EMAIL_APP_PASSWORD ?? ''
    //         },
    //         tls: {
    //             rejectUnauthorized: false
    //         }
    //     });

    //     const mailOptions = {
    //         from: `"Kết quả xét nghiệm STI" <${process.env.EMAIL_FOR_VERIFY}>`,
    //         to: emailSendTo,
    //         subject: "Kết quả xét nghiệm STI (PDF đính kèm)",
    //         text: `Chào ${customerName},\nKết quả xét nghiệm STI của bạn đã có. Vui lòng xem file PDF đính kèm.`,
    //         attachments: [
    //             {
    //                 filename: `STI_Result_${customerName.replace(/\s/g, '_')}.pdf`,
    //                 content: pdfBuffer
    //             }
    //         ]
    //     };

    //     try {
    //         await transporter.sendMail(mailOptions);
    //         return {
    //             success: true,
    //             message: "Đã gửi email kèm file PDF thành công"
    //         };
    //     } catch (error) {
    //         console.error('Error sending PDF email:', error);
    //         return {
    //             success: false,
    //             message: "Lỗi khi gửi email có file PDF"
    //         };
    //     }
    // }
}
