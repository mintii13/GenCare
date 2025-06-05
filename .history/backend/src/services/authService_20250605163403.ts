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

export class AuthService {
    public static async login(loginRequest: LoginRequest): Promise<LoginResponse> {
        try {
            const { email, password } = loginRequest;

            const user = await UserRepository.findByEmail(email);

            if (!user) {
                return {
                    success: false,
                    message: 'Incorrect email or password'
                };
            }

            if (!user.status) {
                return {
                    success: false,
                    message: 'Account has been disabled'
                };
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Incorrect email or password'
                };
            }

            await UserRepository.updateLastLogin(user._id);

            const accessToken = JWTUtils.generateAccessToken({
                userId: user._id.toString(),
                role: user.role
            });

            return {
                success: true,
                message: 'Login successful',
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
                message: 'System error'
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
                message: 'Login successful',
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
                message: 'System error'
            };
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

        user = await UserRepository.insertUser({
            email,
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
            password: '',
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
                    message: 'This email already exists. Please login',
                };
            }
            await redisClient.setEx(`user:${email}`, 300, JSON.stringify(user));
            return {
                success: true,
                message: 'Registration successful',
                user_email: email
            };

        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: 'System error'
            };
        }
    }

    public static async sendOTP(emailSendTo) {
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FOR_VERIFY || '',
                pass: process.env.EMAIL_APP_PASSWORD || ''
            }
        })

        const otpGenerator = crypto.randomInt(100000, 999999).toString();

        const mailContent = {
            from: `"OTP Verification" <${process.env.EMAIL_FOR_VERIFY || null}>`,
            to: emailSendTo,
            subject: "Your OTP verification code is: ",
            html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
                        <div style="max-width: 500px; margin: auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <h2>Your OTP code is: <strong style="color:#2a9d8f;">${otpGenerator}</strong></h2>
                            <p>OTP will expire in 5 minutes.</p>
                            <p>Best regards,</p>
                            <h4>${process.env.APP_NAME || 'GenCare'}</h4>
                        </div>
                    </body>`
        }
        if (!emailSendTo) {
            console.error("No recipient email!");
        }
        await transporter.sendMail(mailContent);            //gửi mail với content đã thiết lập
        return otpGenerator;

    }

    public static async insertByMyApp(user: string): Promise<void> {
        await UserRepository.insertUser(JSON.parse(user));
    }
}