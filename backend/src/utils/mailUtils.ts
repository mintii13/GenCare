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

        // Helper functions for formatting
        const formatTestName = (key: string): string => {
            const names: Record<string, string> = {
                // Blood tests
                'platelets': 'Tiểu cầu',
                'red_blood_cells': 'Hồng cầu', 
                'white_blood_cells': 'Bạch cầu',
                'hemo_level': 'Hemoglobin',
                'anti_HBs': 'Anti-HBs (Kháng thể bề mặt Hepatitis B)',
                'anti_HBc': 'Anti-HBc (Kháng thể lõi Hepatitis B)',
                'hiv': 'HIV',
                'anti_HCV': 'Anti-HCV (Kháng thể Hepatitis C)',
                'HCV_RNA': 'HCV RNA',
                'TPHA_syphilis': 'TPHA (Giang mai)',
                'RPR_syphilis': 'RPR (Giang mai)',
                'treponema_pallidum_IgM': 'Treponema pallidum IgM',
                'treponema_pallidum_IgG': 'Treponema pallidum IgG',
                // Urine tests
                'color': 'Màu sắc',
                'clarity': 'Độ trong',
                'URO': 'Urobilinogen',
                'GLU': 'Glucose',
                'KET': 'Ketone',
                'BIL': 'Bilirubin',
                'PRO': 'Protein',
                'NIT': 'Nitrite',
                'pH': 'pH',
                'blood': 'Máu ẩn',
                'specific_gravity': 'Tỷ trọng',
                'LEU': 'Leukocyte',
                // Swab tests
                'PCR_HSV': 'PCR HSV',
                'HPV': 'HPV',
                'NAAT_Trichomonas': 'NAAT Trichomonas',
                'rapidAntigen_Trichomonas': 'Rapid Antigen Trichomonas',
                'culture_Trichomonas': 'Culture Trichomonas',
                'bacteria': 'Vi khuẩn',
                'virus': 'Virus',
                'parasites': 'Ký sinh trùng'
            };
            return names[key] || key;
        };

        const formatValue = (key: string, value: any): string => {
            if (value === null || value === undefined) return 'Chưa có kết quả';
            if (typeof value === 'boolean') return value ? 'Dương tính' : 'Âm tính';
            
            // Special formatting for urine tests
            if (key === 'color') {
                const colorNames: Record<string, string> = {
                    'light yellow': 'Vàng nhạt',
                    'clear': 'Trong suốt',
                    'dark yellow to orange': 'Vàng đậm đến cam',
                    'dark brown': 'Nâu đậm',
                    'pink or red': 'Hồng hoặc đỏ',
                    'blue or green': 'Xanh lam hoặc xanh lá',
                    'black': 'Đen'
                };
                return colorNames[value] || value;
            }
            
            if (key === 'clarity') {
                const clarityNames: Record<string, string> = {
                    'clearly': 'Trong',
                    'cloudy': 'Đục'
                };
                return clarityNames[value] || value;
            }
            
            if (typeof value === 'number') {
                const units: Record<string, string> = {
                    'platelets': '×10³/μL',
                    'red_blood_cells': '×10⁶/μL',
                    'white_blood_cells': '×10³/μL',
                    'hemo_level': 'g/dL',
                    'URO': 'mg/dL',
                    'GLU': 'mg/dL',
                    'KET': 'mg/dL',
                    'BIL': 'mg/dL',
                    'PRO': 'mg/dL',
                    'NIT': 'mg/dL',
                    'LEU': 'mg/dL',
                    'specific_gravity': ''
                };
                
                // For urine tests, show "Âm tính" for 0 values in certain tests
                if (['GLU', 'KET', 'BIL', 'NIT', 'LEU'].includes(key) && value === 0) {
                    return 'Âm tính';
                }
                if (key === 'blood' && value === 0) {
                    return 'Âm tính';
                }
                if (key === 'PRO' && value === 0) {
                    return 'Âm tính';
                }
                
                return `${value} ${units[key] || ''}`;
            }
            
            // Handle arrays (for swab tests)
            if (Array.isArray(value)) {
                return value.length > 0 ? value.join(', ') : 'Không phát hiện';
            }
            
            return value.toString();
        };

        const getResultStatus = (value: any): { text: string; style: string } => {
            if (value === null || value === undefined) {
                return { text: 'Chưa có kết quả', style: 'color: #666;' };
            }
            if (value === true) {
                return { text: 'Dương tính', style: 'color: #ff4d4f; font-weight: bold;' };
            }
            if (value === false) {
                return { text: 'Âm tính', style: 'color: #52c41a; font-weight: bold;' };
            }
            return { text: value.toString(), style: 'color: #1890ff;' };
        };

        const createTestSection = (testData: any, title: string, testCode?: string): string => {
            if (!testData || Object.keys(testData).length === 0) return '';
            
            let section = `
                <div style="margin-bottom: 24px; border: 1px solid #e8e8e8; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #f0f6ff; padding: 16px; border-bottom: 1px solid #e8e8e8;">
                        <h3 style="margin: 0; color: #1890ff; font-size: 16px;">
                            📋 ${title}
                            ${testCode ? `<span style="font-size: 12px; color: #666; margin-left: 8px;">(${testCode})</span>` : ''}
                        </h3>
                    </div>
                    <div style="padding: 16px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background-color: #fafafa;">
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e8e8e8; font-weight: bold;">Xét nghiệm</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e8e8e8; font-weight: bold;">Kết quả</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            Object.keys(testData).forEach(key => {
                if (testData[key] !== undefined && testData[key] !== null) {
                    const value = testData[key];
                    const formattedValue = formatValue(key, value);
                    const status = getResultStatus(value);
                    
                    section += `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">${formatTestName(key)}</td>
                            <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; ${status.style}">${formattedValue}</td>
                        </tr>
                    `;
                }
            });

            section += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            return section;
        };

        // Generate detailed result content
        const summaryHtml = stiResult.sti_result_items.map((item, idx) => {
            const result = item.result;
            const testInfo = item.sti_test_id;
            const testCode = (testInfo as any)?.sti_test_code || '';
            const testName = (testInfo as any)?.sti_test_name || 'Xét nghiệm STI';
            
            let itemHtml = `
                <div style="margin-bottom: 32px; padding: 20px; border: 2px solid #e6f7ff; border-radius: 12px; background-color: #fafffe;">
                    <div style="margin-bottom: 16px; padding: 16px; background-color: #e6f7ff; border-radius: 8px;">
                        <h2 style="margin: 0 0 12px 0; color: #1890ff; font-size: 18px;">🔬 ${testName}</h2>
                        <div><strong>Mã xét nghiệm:</strong> <code style="background-color: #f5f5f5; padding: 2px 6px; border-radius: 4px;">${testCode}</code></div><br>
                        <div><strong>Loại mẫu:</strong> 
                            <span style="background-color: #1890ff; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                                ${result?.sample_type === 'blood' ? 'Máu' : result?.sample_type === 'urine' ? 'Nước tiểu' : 'Swab'}
                            </span>
                        </div><br>
                        <div><strong>Thời gian hoàn thành:</strong> ${result?.time_completed ? new Date(result.time_completed).toLocaleString('vi-VN') : 'N/A'}</div>
                    </div>
            `;

            // Add test results
            if (result?.blood && Object.keys(result.blood).some(key => result.blood[key] !== null && result.blood[key] !== undefined)) {
                itemHtml += createTestSection(result.blood, 'Xét nghiệm máu', testCode);
            }

            if (result?.urine && Object.keys(result.urine).some(key => result.urine[key] !== null && result.urine[key] !== undefined)) {
                itemHtml += createTestSection(result.urine, 'Xét nghiệm nước tiểu', testCode);
            }

            if (result?.swab && Object.keys(result.swab).some(key => 
                result.swab[key] !== null && result.swab[key] !== undefined && 
                (typeof result.swab[key] !== 'object' || (Array.isArray(result.swab[key]) && result.swab[key].length > 0))
            )) {
                itemHtml += createTestSection(result.swab, 'Xét nghiệm swab', testCode);
            }

            // Add test description if available
            if ((testInfo as any)?.description) {
                itemHtml += `
                    <div style="margin-top: 16px; padding: 12px; background-color: #fafafa; border-radius: 6px; border-left: 4px solid #1890ff;">
                        <strong>📝 Mô tả xét nghiệm:</strong><br>
                        <span style="color: #666;">${(testInfo as any).description}</span>
                    </div>
                `;
            }

            itemHtml += '</div>';
            return itemHtml;
        }).join('');

        // Create comprehensive email content
        const htmlString = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Kết quả xét nghiệm STI</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 32px; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🏥 KẾT QUẢ XÉT NGHIỆM STI</h1>
                    <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Phòng khám STI - Chăm sóc sức khỏe chuyên nghiệp</p>
                </div>

                <!-- Patient Information -->
                <div style="margin-bottom: 24px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h2 style="margin: 0 0 16px 0; color: #28a745; font-size: 18px;">👤 Thông tin bệnh nhân</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div><strong>Họ và tên:</strong> ${user.full_name}</div>
                        <div><strong>Email:</strong> ${emailSendTo}</div>
                        <div><strong>Mã kết quả:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 4px;">${stiResult._id || 'N/A'}</code></div>
                        <div><strong>Ngày tạo:</strong> ${new Date(stiResult.createdAt || Date.now()).toLocaleString('vi-VN')}</div>
                    </div>
                </div>

                <!-- Test Results -->
                <div style="margin-bottom: 32px;">
                    <h2 style="color: #1890ff; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #1890ff; padding-bottom: 8px;">📊 Kết quả chi tiết</h2>
                    ${summaryHtml}
                </div>

                <!-- Diagnosis and Medical Notes -->
                ${(stiResult.diagnosis || stiResult.medical_notes) ? `
                    <div style="margin-bottom: 32px; padding: 20px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                        <h2 style="margin: 0 0 16px 0; color: #856404; font-size: 18px;">⚕️ Chẩn đoán và Ghi chú y khoa</h2>
                        ${stiResult.diagnosis ? `
                            <div style="margin-bottom: 12px;">
                                <strong style="color: #856404;">Chẩn đoán:</strong><br>
                                <div style="margin-top: 8px; padding: 12px; background-color: white; border-radius: 4px;">${stiResult.diagnosis}</div>
                            </div>
                        ` : ''}
                        ${stiResult.medical_notes ? `
                            <div>
                                <strong style="color: #856404;">Ghi chú y khoa:</strong><br>
                                <div style="margin-top: 8px; padding: 12px; background-color: white; border-radius: 4px;">${stiResult.medical_notes}</div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Important Notes -->
                <div style="margin-bottom: 32px; padding: 16px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                    <h3 style="margin: 0 0 12px 0; color: #721c24;">⚠️ Lưu ý quan trọng</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #721c24;">
                        <li>Kết quả này chỉ có giá trị khi được bác sĩ xác nhận và giải thích</li>
                        <li>Vui lòng liên hệ với phòng khám để được tư vấn chi tiết về kết quả</li>
                        <li>Không tự ý điều trị mà chưa có chỉ định của bác sĩ</li>
                        <li>Bảo mật thông tin y tế và không chia sẻ kết quả với người không có thẩm quyền</li>
                    </ul>
                </div>

                <!-- Contact Information -->
                <div style="margin-bottom: 32px; padding: 20px; background-color: #e3f2fd; border-radius: 8px;">
                    <h3 style="margin: 0 0 16px 0; color: #1565c0;">📞 Thông tin liên hệ</h3>
                    <div style="color: #1565c0;">
                        <p style="margin: 8px 0;"><strong>Phòng khám GenCare</strong></p>
                        <p style="margin: 8px 0;">📧 Email: GenCare@gmail.com</p>
                        <p style="margin: 8px 0;">📧 Website: ${process.env.FRONTEND_URL}</p>
                        <p style="margin: 8px 0;">🕒 Giờ làm việc: 8:00 - 17:00 (Thứ 2 - Thứ 6)</p>
                        <p style="margin: 8px 0;">⏰ Hotline 24/7 cho trường hợp khẩn cấp</p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; padding: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px;">
                    <p style="margin: 0;">Email này được gửi tự động từ hệ thống phòng khám GenCare</p>
                    <p style="margin: 8px 0 0 0;">© 2024 STI Clinic. Tất cả quyền được bảo lưu.</p>
                </div>
            </body>
            </html>
        `;

        // Generate PDF buffer
        const pdfBuffer = await PdfUtils.generatePdfBuffer(htmlString);
        
        // Prepare email content
        const mailContent = {
            from: `"STI Clinic - Phòng khám STI" <${process.env.EMAIL_FOR_VERIFY}>`,
            to: emailSendTo,
            subject: `🔬 Kết quả xét nghiệm STI - ${user.full_name}`,
            html: htmlString,
            attachments: [
                {
                    filename: `ket-qua-xet-nghiem-STI-${user.full_name.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        try {
            const result = await transporter.sendMail(mailContent);
            console.log('✅ Gửi email kết quả STI thành công:', {
                messageId: result.messageId,
                recipient: emailSendTo,
                subject: mailContent.subject
            });
            return result;
        } catch (error) {
            console.error('❌ Lỗi gửi email kết quả STI:', error);
            throw error;
        }
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