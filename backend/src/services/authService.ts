import bcrypt from 'bcryptjs';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { LoginResponse } from '../dto/responses/LoginResponse';
import { UserRepository } from '../repositories/userRepository';
import { RegisterRequest } from '../dto/requests/RegisterRequest';
import { RegisterResponse } from '../dto/responses/RegisterResponse';
import { JWTUtils } from '../utils/jwtUtils';
import { User, IUser } from '../models/User';
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import redisClient from '../configs/redis';
import { ChangePasswordResponse } from '../dto/responses/ChangePasswordResponse';
import { ObjectId } from 'mongoose';
import { RandomUtils } from '../utils/randomUtils';
export class AuthService {
    public static async login(loginRequest: LoginRequest): Promise<LoginResponse> {
        try {
            const { email, password } = loginRequest;

            const user = await UserRepository.findByEmail(email);

            if (!user) {
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                };
            }

            if (!user.status) {
                return {
                    success: false,
                    message: 'Tài khoản đã bị vô hiệu hóa'
                };
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                };
            }

            await UserRepository.updateLastLogin(user._id);

            const accessToken = JWTUtils.generateAccessToken({
                userId: user._id.toString(),
                role: user.role
            });

            return {
                success: true,
                message: 'Đăng nhập thành công',
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    status: user.status,
                    avatar: user.avatar // Thêm avatar
                },
                accessToken: accessToken
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống'
            };
        }
    }

    public static async loginGoogle(user: Partial<IUser>): Promise<LoginResponse> {
        try {
            // Update last login
            await UserRepository.updateLastLogin(user._id);
            console.log(user);

            // Generate JWT access token
            const accessToken = JWTUtils.generateAccessToken({
                userId: user._id.toString(),
                role: user.role
            });

            return {
                success: true,
                message: 'Đăng nhập thành công',
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    status: user.status,
                    avatar: user.avatar // Thêm avatar
                },
                accessToken: accessToken
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống'
            };
        }
    }

    public static async sendPassword(emailSendTo: string, password: string) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY || '',
                pass: process.env.EMAIL_APP_PASSWORD || ''
            }
        })

        const mailContent = {
            from: `"Mật khẩu đăng nhập GenCare" <${process.env.EMAIL_FOR_VERIFY || null}>`,
            to: emailSendTo,
            subject: `Mật khẩu hiện tại của email ${emailSendTo} là:`,
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                        <div style="max-width: 500px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <h2>Mật khẩu của bạn là: <strong style="color:#2a9d8f;">${password}</strong></h2>
                            <p>Mật khẩu này sẽ được sử dụng để đăng nhập trong hệ thống GenCare của chúng tôi</p>
                            <p>Đường dẫn đến trang web là: http://localhost:5173</p>
                            <p>Trân trọng,</p>
                            <h4>${process.env.APP_NAME || 'GenCare'}</h4>
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

    public static async insertGoogle(profile: any): Promise<Partial<IUser>> {
        const email = profile.emails[0]?.value || null;
        const full_name = [profile.name.givenName, profile.name.familyName].filter(Boolean).join(" ");
        const registration_date = new Date();
        const updated_date = new Date();
        const status = true;
        const email_verified = true;
        const role = 'customer';
        const googleId = profile.id;
        const avatar = profile.photos?.[0]?.value || null; // Lấy avatar từ Google

        let user = await User.findOne({ email });
        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.avatar && avatar) {
                    user.avatar = avatar; // Cập nhật avatar nếu chưa có
                }
                await user.save();
            }
            return user;
        }
        const password = RandomUtils.generateRandomPassword();
        this.sendPassword(email, password);
        console.log(password);
        user = await UserRepository.insertUser({
            email,
            password: await bcrypt.hash(password, 10),
            full_name,
            registration_date,
            updated_date,
            status,
            email_verified,
            role,
            googleId,
            phone: null,
            date_of_birth: null,
            last_login: null,
            avatar: avatar // Thêm avatar từ Google
        });
        return user;
    }

    public static async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
        try {
            const { email, password, full_name, phone, date_of_birth, gender } = registerRequest;

            await redisClient.setEx(`pass:${email}`, 300, password);

            const existedUser = await UserRepository.findByEmail(email);

            const user = {
                email: email,
                password: await bcrypt.hash(password, 10),
                full_name: full_name.trim(),
                phone: phone?.trim() || null,
                date_of_birth: date_of_birth || null,
                gender: gender || null,
                registration_date: new Date(),
                updated_date: new Date(),
                last_login: null,
                status: true,
                email_verified: true,
                role: 'customer',
                googleId: null,
                avatar: null // Mặc định null, user có thể upload sau
            };

            if (existedUser) {
                return {
                    success: false,
                    message: 'Email này đã tồn tại. Hãy đăng nhập',
                };
            }
            await redisClient.setEx(`user:${email}`, 300, JSON.stringify(user));
            return {
                success: true,
                message: 'Đăng ký thành công',
                user_email: email
            };

        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống'
            };
        }
    }

    public static async sendOTP(emailSendTo) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY || '',
                pass: process.env.EMAIL_APP_PASSWORD || ''
            }
        })

        const otpGenerator = RandomUtils.generateRandomOTP(100000, 999999);     //6-number OTP

        const mailContent = {
            from: `"Xác thực OTP" <${process.env.EMAIL_FOR_VERIFY || null}>`,
            to: emailSendTo,
            subject: "Mã xác thực OTP của bạn là: ",
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                        <div style="max-width: 500px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <h2>Mã OTP của bạn là: <strong style="color:#2a9d8f;">${otpGenerator}</strong></h2>
                            <p>OTP sẽ hết hạn trong 5 phút.</p>
                            <p>Trân trọng,</p>
                            <h4>${process.env.APP_NAME || 'GenCare'}</h4>
                        </div>
                    </body>`
        }
        if (!emailSendTo) {
            console.error("Không có email người nhận!");
        }
        await transporter.sendMail(mailContent);            //gửi mail với content đã thiết lập
        return otpGenerator;

    }

    public static async insertByMyApp(user: string): Promise<void> {
        await UserRepository.insertUser(JSON.parse(user));
    }

    /**
     * Kiểm tra xem old_password có giống trong db không
     */
    public static async verifyOldPassword(id: ObjectId, oldPassword: string): Promise<boolean> {
        try {
            const user = await UserRepository.findById(id);
            if (!user) {
                throw new Error('User not found');
            }
            return await bcrypt.compare(oldPassword, user.password);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Hash new password
     */
    public static async hashPassword(password: string): Promise<string> {
        try {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            throw new Error('Error hashing password');
        }
    }

    public static async updatePassword(_id: ObjectId, hashedPassword: string): Promise<void> {
        try {
            const result = await User.findOneAndUpdate(
                { _id },
                { password: hashedPassword },
                { new: true }
            );

            if (!result) {
                throw new Error('User not found');
            }
        } catch (error) {
            throw error;
        }
    }

    public static async changePassword(
        id: ObjectId,
        oldPassword: string,
        newPassword: string,
    ): Promise<string> {
        try {
            // 1. Verify old password
            const isOldPasswordValid = await this.verifyOldPassword(id, oldPassword);
            if (!isOldPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            // 2. Hash new password
            newPassword = await this.hashPassword(newPassword);

            // 3. Update password in database
            await this.updatePassword(id, newPassword);

            return 'Password changed successfully';
        } catch (error) {
            throw error;
        }
    }

    public static async changePasswordForUsers(
        id: ObjectId,
        oldPassword: string,
        newPassword: string,
    ): Promise<ChangePasswordResponse> {
        try {
            if (!id) {
                return {
                    success: false,
                    message: 'Unauthorized',
                };
            }

            const user = await UserRepository.findById(id);
            
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                };
            }

            //change password
            await this.changePassword(id, oldPassword, newPassword);

            return {
                success: true,
                message: 'Change password successfully',
                email: user.email
            }

        } catch (error) {
            return {
                    success: false,
                    message: 'System error',
            };
        }
    }

}

