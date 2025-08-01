import bcrypt from 'bcryptjs';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { LoginResponse } from '../dto/responses/LoginResponse';
import { UserRepository } from '../repositories/userRepository';
import { RegisterRequest } from '../dto/requests/RegisterRequest';
import { RegisterResponse, VerificationResponse } from '../dto/responses/RegisterResponse';
import { JWTUtils } from '../utils/jwtUtils';
import { User, IUser } from '../models/User';
import nodemailer from 'nodemailer'
import redisClient from '../configs/redis';
import { ChangePasswordResponse } from '../dto/responses/ChangePasswordResponse';
import mongoose, { ObjectId } from 'mongoose';
import { RandomUtils } from '../utils/randomUtils';
import { MailUtils } from '../utils/mailUtils';

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

            if (!user.email_verified) {
                return {
                    success: false,
                    message: 'Tài khoản chưa được xác thực email. Vui lòng xác thực OTP trước khi đăng nhập.'
                };
            }

            if (!user.password) {
                return {
                    success: false,
                    message: 'Tài khoản này được tạo bằng Google. Vui lòng đăng nhập bằng Google.'
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
                    avatar: user.avatar, // Thêm avatar
                    phone: user.phone || null,
                    date_of_birth: user.date_of_birth || null,
                    gender: user.gender || null,
                    registration_date: user.registration_date,
                    updated_date: user.updated_date,
                    last_login: user.last_login || null,
                    email_verified: user.email_verified,
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
                    avatar: user.avatar,
                    phone: user.phone || null,
                    date_of_birth: user.date_of_birth || null,
                    gender: user.gender || null,
                    registration_date: user.registration_date,
                    updated_date: user.updated_date,
                    last_login: user.last_login || null,
                    email_verified: user.email_verified,
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


    public static async insertGoogle(profile: any): Promise<IUser> {
        try {
            console.log('Processing Google profile:', profile.emails[0]?.value);

            const email = profile.emails[0]?.value ?? null;
            const full_name = [profile.name.givenName, profile.name.familyName].filter(Boolean).join(" ");
            const avatar = profile.photos?.[0]?.value || null;

            // Tìm user bằng email - SỬA: Không dùng lean() để có full mongoose document
            let user = await User.findOne({ email });

            if (user) {
                console.log('Existing user found:', user.email);
                // User đã tồn tại - cập nhật avatar nếu chưa có
                let needUpdate = false;
                const updateData: any = {
                    updated_date: new Date(),
                    last_login: new Date()
                };

                if (!user.avatar && avatar) {
                    updateData.avatar = avatar;
                    needUpdate = true;
                }

                if (needUpdate) {
                    await User.findByIdAndUpdate(user._id, updateData);
                    // Refresh user object
                    user = await User.findById(user._id);
                } else {
                    // Chỉ cập nhật last_login
                    await User.findByIdAndUpdate(user._id, { last_login: new Date() });
                }

                return user!;
            }

            // User chưa tồn tại - tạo mới
            console.log('Creating new user for:', email);
            const password = RandomUtils.generateRandomString(8, true);

            // Gửi password qua email (non-blocking)
            await MailUtils.sendPasswordForGoogle(email, password).catch(error => {
                console.error('Error sending password email:', error);
            });

            const newUserData = {
                email,
                password: await bcrypt.hash(password, 10),
                full_name,
                registration_date: new Date(),
                updated_date: new Date(),
                status: true,
                email_verified: true,
                role: 'customer' as const,
                phone: null,
                date_of_birth: null,
                last_login: new Date(),
                avatar: avatar
            };

            const newUser = new User(newUserData);
            const savedUser = await newUser.save();

            console.log('New user created successfully:', savedUser.email);
            return savedUser;

        } catch (error) {
            console.error('insertGoogle error:', error);
            throw error;
        }
    }

    // Đăng ký
    public static async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
        try {
            const { email, full_name, phone, date_of_birth, gender } = registerRequest;
            if (!email) return { success: false, message: 'Email is invalid' };
            const existedUser = await UserRepository.findByEmail(email);
            if (existedUser) {
                if (existedUser.status === true)
                    return { 
                        success: false, 
                        message: 'Email is existed. Login please' 
                    };
                else return { 
                    success: false, 
                    message: 'This email is banned' 
                };
            }
            await redisClient.setEx(`user:${email}`, 600, JSON.stringify(registerRequest));
            const otp = await MailUtils.sendOtpForRegister(email);
            await redisClient.setEx(`otp:${email}`, 300, otp);
            return {
                success: true,
                message: 'Send OTP successfully',
                user_email: email
            }
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: 'Server error'
            };
        }
    }

    // Kiểm tra OTP
    public static async verifyOTPForRegister(email: string, otp: string): Promise<VerificationResponse> {
        try {
            const storedOtp = await redisClient.get(`otp:${email}`);
            if (!storedOtp || storedOtp !== otp)
                return {
                    success: false,
                    message: 'OTP is invalid or expired'
                };
            const tempUser = await redisClient.get(`user:${email}`);
            if (!tempUser) {
                return {
                    success: false,
                    message: 'Cannot find registered data'
                };
            }

            const { password, full_name, phone, date_of_birth, gender } = JSON.parse(tempUser.toString());
            const user: Partial<IUser> = {
                email,
                password: await bcrypt.hash(password, 10),
                full_name: full_name.trim(),
                phone: phone?.trim() || null,
                date_of_birth: date_of_birth || null,
                gender: gender || null,
                registration_date: new Date(),
                updated_date: new Date(),
                last_login: new Date(), // Set last_login ngay lập tức
                status: true,
                email_verified: true,
                role: 'customer',
                avatar: null
            };

            // const insertedUser = await UserRepository.insertUser(user);
            const insertedUser = await UserRepository.saveUser(user);
            await redisClient.del(`user:${email}`);
            await redisClient.del(`otp:${email}`);


            // Tạo access token luôn để tự động đăng nhập
            const accessToken = JWTUtils.generateAccessToken({
                userId: insertedUser._id.toString(),
                role: insertedUser.role
            });

            return {
                success: true,
                message: 'Register successfully',
                user: {
                    id: insertedUser._id.toString(),
                    email: insertedUser.email,
                    full_name: insertedUser.full_name,
                    role: insertedUser.role,
                    status: insertedUser.status,
                    avatar: insertedUser.avatar,
                    phone: insertedUser.phone,
                    date_of_birth: insertedUser.date_of_birth,
                    gender: insertedUser.gender,
                    registration_date: insertedUser.registration_date,
                    updated_date: insertedUser.updated_date,
                    last_login: insertedUser.last_login,
                    email_verified: insertedUser.email_verified,
                },
                accessToken: accessToken // Thêm access token
            };
        } catch (error) {

            return {

                success: false,
                message: 'Server error'
            };
        }
    }

    /**
     * Kiểm tra xem old_password có giống trong db không
     */
    private static async verifyOldPassword(userId: string, oldPassword: string): Promise<boolean> {
        try {
            const user = await UserRepository.findById(userId);
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
    private static async hashPassword(password: string): Promise<string> {
        try {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            throw new Error('Error hashing password');
        }
    }

    private static async updatePassword(userId: string, hashedPassword: string): Promise<void> {
        const updatedUser = await UserRepository.findByIdAndUpdate(userId, { password: hashedPassword });
        if (!updatedUser) {
            throw new Error('User not found');
        }
    }

    public static async changePasswordForUsers(
        userId: string,
        oldPassword: string,
        newPassword: string,
    ): Promise<ChangePasswordResponse> {
        try {
            const user = await UserRepository.findById(userId);

            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                };
            }

            // 1. Verify old password
            const isOldPasswordValid = await this.verifyOldPassword(userId, oldPassword);
            if (!isOldPasswordValid) {
                return {
                    success: false,
                    message: 'Old password is incorrect',
                };
            }
            // 2. Hash new password
            const hashedNewPassword = await this.hashPassword(newPassword);

            // 3. Update password in database
            await this.updatePassword(userId, hashedNewPassword);

            return {
                success: true,
                message: 'Change password successfully',
                email: user.email
            }

        } catch (error) {
            console.error('changePasswordForUsers error:', error);
            return {
                success: false,
                message: 'System error',
            };
        }
    }

    public static async forgotPasswordAndSendOTP(email: string): Promise<ChangePasswordResponse> {
        try {
            const user = await UserRepository.findByEmail(email);
            if (!user){
                return{
                    success: false,
                    message: 'Email is not found. Please input again'
                };
            }
            const sendOtp = await MailUtils.sendOtpForRegister(email);
            await redisClient.setEx(`otp:${email}`, 300, sendOtp);
            return{
                success: true,
                message: 'Send OTP successfully'
            }
        } catch (error) {
            console.error('ForgotPassword error:', error);
            return {
                success: false,
                message: 'System error',
            };
        }
    }

    // Kiểm tra OTP
    public static async verifyOTPForForgotPassword(email: string, otp: string): Promise<VerificationResponse> {
        try {
            const storedOtp = await redisClient.get(`otp:${email}`);
            if (!storedOtp || storedOtp !== otp)
                return {
                    success: false,
                    message: 'OTP is invalid or expired'
                };
            //ensure user verifieds
            await redisClient.setEx(`otp-verified:${email}`, 300, 'true');
            await redisClient.del(`otp:${email}`);
            return {
                success: true,
                message: 'OTP verified successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Internal Server error'
            };
        }
    }

    public static async resetPasswordAfterOTP(email: string, newPassword: string): Promise<ChangePasswordResponse> {
        try {
            const isVerified = await redisClient.get(`otp-verified:${email}`);
            if (isVerified !== 'true') {
                return { 
                    success: false, 
                    message: 'OTP not verified or expired' 
                };
            }

            const user = await UserRepository.findByEmail(email);
            if (!user) {
                return { 
                    success: false, 
                    message: 'User not found' 
                };
            }

            const hashedPassword = await this.hashPassword(newPassword);
            await UserRepository.updatePasswordByEmail(email, hashedPassword);

            await redisClient.del(`otp-verified:${email}`);

            return { 
                success: true, 
                message: 'Password reset successfully' 
            };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, message: 'Server error' };
        }
    }
}