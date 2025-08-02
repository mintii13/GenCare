import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
import { RandomUtils } from './randomUtils';
import { IUser } from '../models/User';
import { IStiResult } from '../models/StiResult';
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

    public static async sendStiOrderConfirmation(
        customerName: string, 
        orderDate: string, 
        // total_amount: number, 
        emailSendTo: string, 
        // packageName: string, 
        // testNames: string[]
    ) {
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
        // const hasPackage = !!packageName;
        // const hasTests = testNames.length > 0;
        // let selectedOptionsHTML = '';
        // if (hasPackage && hasTests) {
        //     selectedOptionsHTML = `
        //         <p><strong>Gói combo bạn đã chọn:</strong> ${packageName}</p>
        //         <p><strong>Các xét nghiệm lẻ bạn đã chọn:</strong></p>
        //         <ul>${testNames.map(t => `<li>${t}</li>`).join('')}</ul>
        //     `;
        // } else if (hasPackage) {
        //     selectedOptionsHTML = `<p><strong>Bạn đã chọn gói combo:</strong> ${packageName}</p>`;
        // } else if (hasTests) {
        //     selectedOptionsHTML = `
        //         <p><strong>Các xét nghiệm bạn đã chọn:</strong></p>
        //         <ul>${testNames.map(t => `<li>${t}</li>`).join('')}</ul>
        //     `;
        // } else {
        //     selectedOptionsHTML = `<p><em>Không có gói hoặc xét nghiệm nào được chọn.</em></p>`;
        // }
        const mailContent = {
            from: `"Đăng ký xét nghiệm thành công" <${process.env.EMAIL_FOR_VERIFY ?? null}>`,
            to: emailSendTo,
            subject: "Thông tin đăng ký xét nghiệm thành công: ",
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <h2>Xin chào ${customerName},</h2>
                    <p>Bạn đã đăng ký xét nghiệm STI thành công. Dưới đây là thông tin chi tiết:</p>
                    <p><strong>Ngày đặt lịch:</strong> ${orderDate}</p>
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

    public static async sendStiResultEmail(emailSendTo: string, user: IUser, stiResult: IStiResult) {
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

        if (!emailSendTo) {
            console.error("Không có email người nhận!");
            return;
        }
        
        const summaryHtml = stiResult.sti_result_items.map((item, idx) => {
            const { sample_type, urine, blood, swab, time_completed } = item.result;

            let section = `<h3>Kết quả mẫu ${idx + 1} (${sample_type.toUpperCase()})</h3>`;
            section += `<p>Thời gian hoàn thành: ${new Date(time_completed).toLocaleString()}</p>`;

            if (sample_type === 'urine' && urine) {
                section += `
                    <ul>
                        <li>Màu sắc: ${urine.color}</li>
                        <li>Độ trong: ${urine.clarity}</li>
                        <li>URO: ${urine.URO}, GLU: ${urine.GLU}, KET: ${urine.KET}, BIL: ${urine.BIL}</li>
                        <li>PRO: ${urine.PRO}, NIT: ${urine.NIT}, pH: ${urine.pH}</li>
                        <li>Blood: ${urine.blood ? 'Có' : 'Không'}, LEU: ${urine.LEU}, SG: ${urine.specific_gravity}</li>
                    </ul>`;
            }

            if (sample_type === 'blood' && blood) {
                section += `
                    <ul>
                        <li>Tiểu cầu: ${blood.platelets}, Hồng cầu: ${blood.red_blood_cells}, Bạch cầu: ${blood.white_blood_cells}</li>
                        <li>Hemoglobin: ${blood.hemo_level}</li>
                        ${blood.hiv !== null ? `<li>HIV: ${blood.hiv ? 'Dương tính' : 'Âm tính'}</li>` : ''}
                        ${blood.anti_HCV !== null ? `<li>anti-HCV: ${blood.anti_HCV ? 'Dương tính' : 'Âm tính'}</li>` : ''}
                        ${blood.TPHA_syphilis !== null ? `<li>TPHA: ${blood.TPHA_syphilis ? 'Dương tính' : 'Âm tính'}</li>` : ''}
                        ...
                    </ul>`;
            }

            if (sample_type === 'swab' && swab) {
                section += `
                    <ul>
                        <li>Vi khuẩn: ${swab.bacteria?.join(', ') || 'Không phát hiện'}</li>
                        <li>Virus: ${swab.virus?.join(', ') || 'Không phát hiện'}</li>
                        <li>Ký sinh trùng: ${swab.parasites?.join(', ') || 'Không phát hiện'}</li>
                        ${swab.HPV !== null ? `<li>HPV: ${swab.HPV ? 'Dương tính' : 'Âm tính'}</li>` : ''}
                    </ul>`;
            }

            return section;
        }).join('');

        const htmlString = `
            <p>Xin chào ${user.full_name},</p>
            <p>Chúng tôi gửi đến bạn kết quả xét nghiệm STI như sau:</p>
            ${summaryHtml}
            <p><strong>Chẩn đoán:</strong> ${stiResult.diagnosis || 'Chưa có'}</p>
            <p><strong>Ghi chú tư vấn:</strong> ${stiResult.medical_notes || 'Không có'}</p>
            <p>Trân trọng,<br>Đội ngũ phòng khám STI</p>
        `;
        const pdfBuffer = await PdfUtils.generatePdfBuffer(htmlString);
        const mailContent = {
            from: `"STI Clinic" <${process.env.EMAIL_FOR_VERIFY}>`,
            to: emailSendTo,
            subject: "Kết quả xét nghiệm STI của bạn",
            html: `
                <p>Xin chào ${user.full_name},</p>
                <p>Chúng tôi gửi đến bạn kết quả xét nghiệm STI như sau:</p>
                ${summaryHtml}
                <p><strong>Chẩn đoán:</strong> ${stiResult.diagnosis || 'Chưa có'}</p>
                <p><strong>Ghi chú tư vấn:</strong> ${stiResult.medical_notes || 'Không có'}</p>
                <p>Nếu bạn có bất kỳ câu hỏi nào, xin vui lòng liên hệ với chúng tôi.</p>
                <p>Trân trọng,<br>Đội ngũ phòng khám STI</p>
            `,
            attachments: [
                {
                    filename: 'sti-result.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };
        console.log('Gửi mail thành công', mailContent);
        return transporter.sendMail(mailContent);
    }
}

export class PdfUtils{
    public static async generatePdfBuffer(html: string): Promise<Buffer> {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfUint8Array = await page.pdf({ format: 'A4' });
        await browser.close();
        return Buffer.from(pdfUint8Array);
    }
}