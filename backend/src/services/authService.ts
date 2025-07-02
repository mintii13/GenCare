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
                    googleId: user.googleId || null
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
                    googleId: user.googleId || null
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


    public static async insertGoogle(profile: any): Promise<Partial<IUser>> {
        const email = profile.emails[0]?.value ?? null;
        const full_name = [profile.name.givenName, profile.name.familyName].filter(Boolean).join(" ");
        const registration_date = new Date();
        const updated_date = new Date();
        const status = true;
        const email_verified = true;
        const role = 'customer';
        const googleId = profile.id;
        const avatar = profile.photos?.[0]?.value || null; // Lấy avatar từ Google

        let user = await UserRepository.findByEmail(email);
        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.avatar && avatar) {
                    user.avatar = avatar; // Cập nhật avatar nếu chưa có
                }
                await UserRepository.saveUser(user);
            }
            return user;
        }
        const password = RandomUtils.generateRandomString(8, true);
        await MailUtils.sendPasswordForGoogle(email, password);
        
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

    // Đăng ký
    public static async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
        try {
            const {email, full_name, phone, date_of_birth, gender} = registerRequest;
            if (!email) return { success: false, message: 'Email is invalid' };      
            const existedUser = await UserRepository.findByEmail(email);
            if (existedUser) {
                if (existedUser.status === true)
                    return { success: false, message: 'Email is existed. Login please' };
                else return { success: false, message: 'This email is banned'};
            }
            await redisClient.setEx(`user:${email}`, 600, JSON.stringify(registerRequest));
            const otp = await MailUtils.sendOtpForRegister(email);
            await redisClient.setEx(`otp:${email}`, 300, otp);
            return{
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
    public static async verifyOTP(email: string, otp: string): Promise<VerificationResponse> {
        try {
            if (!email || !otp) 
                return { 
                    success: false, message: 'Email or otp is not found' 
                };
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
                last_login: null,
                status: true,
                email_verified: true,
                role: 'customer',
                googleId: null,
                avatar: null
            };

            const insertedUser = await UserRepository.insertUser(user);
            await redisClient.del(`user:${email}`);
            await redisClient.del(`otp:${email}`);
            return { 
                success: true, 
                message: 'Register successfully',
                user:{
                    id: insertedUser._id.toString(),
                    email: insertedUser.email,
                    full_name: insertedUser.full_name,
                    role: insertedUser.role,
                    status: insertedUser.status
                }
            };
        } catch (error) {
            return{
                success: false,
                message: 'Server error'
            };
        }
    }

    /**
     * Kiểm tra xem old_password có giống trong db không
     */
    public static async verifyOldPassword(userId: string, oldPassword: string): Promise<boolean> {
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
    public static async hashPassword(password: string): Promise<string> {
        try {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(password, salt);
        } catch (error) {
            throw new Error('Error hashing password');
        }
    }

    public static async updatePassword(userId: string, hashedPassword: string): Promise<void> {
        try {
            const _id = new mongoose.Types.ObjectId(userId);
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

    public static async changePasswordForUsers(
        userId: string,
        oldPassword: string,
        newPassword: string,
    ): Promise<ChangePasswordResponse> {
        try {
            if (!userId) {
                return {
                    success: false,
                    message: 'Unauthorized',
                };
            }

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
            newPassword = await this.hashPassword(newPassword);

            // 3. Update password in database
            await this.updatePassword(userId, newPassword);

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

}