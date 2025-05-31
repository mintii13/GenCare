import bcrypt from 'bcryptjs';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { LoginResponse } from '../dto/responses/LoginResponse';
import { UserRepository } from '../repositories/userRepository';
import { RegisterRequest, ProfileRequest } from '../dto/requests/RegisterRequest';
import { RegisterResponse, ProfileResponse } from '../dto/responses/RegisterResponse';

export class AuthService {
    public static async login(loginRequest: LoginRequest): Promise<LoginResponse> {
        try {
            const { email, password } = loginRequest;

            // Find user by email
            const user = await UserRepository.findByEmail(email);

            if (!user) {
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                };
            }

            // Check if user is active
            if (!user.status) {
                return {
                    success: false,
                    message: 'Tài khoản đã bị vô hiệu hóa'
                };
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Email hoặc mật khẩu không đúng'
                };
            }

            // Update last login
            await UserRepository.updateLastLogin(user._id);

            return {
                success: true,
                message: 'Đăng nhập thành công',
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    status: user.status
                }
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống'
            };
        }
    }

    public static async register(registerRequest: RegisterRequest): Promise<RegisterResponse & { hashedPassword?: string }> {
        try {
            const { email, password} = registerRequest;

          //check duplicate email
            const existedUser = await UserRepository.findByEmail(email);

            if (existedUser) {
                return {
                    success: false,
                    message: 'Email này đã tồn tại. Hãy đăng nhập'
                };
            }

         //thêm 1 thằng check password có trùng khớp với verified_password
            const hashedPassword = await bcrypt.hash(password, 10);

            return {
                success: true,
                message: 'Đăng ký thành công',
                user: {
                    email: email,
                    password: hashedPassword
                },
                hashedPassword,
            };

        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống'
            };
        }
    }

    public static async inputProfile(email: string, hashedPassword: string, profileRequest: ProfileRequest): Promise<ProfileResponse> {
        const { full_name, phone, date_of_birth, gender} = profileRequest;
        const profile = {}
        const user = await UserRepository.insertMyApp({
            email: email,
            password: hashedPassword,
            full_name: full_name.trim(),
            phone: phone?.trim() || null,
            date_of_birth: date_of_birth || null,
            gender: gender || null,
            registration_date: new Date(),
            updated_date: new Date(),
            last_login: null,
            status: true,
            email_verified: false,
            role: 'customer',
            googleId: null
        });

        return {
            success: true,
            message: 'Đăng ký hoàn tất',
            user: {
                email: user.email,
                password: hashedPassword,
                full_name: full_name.trim(),
                phone: phone?.trim() || null,
                date_of_birth: date_of_birth || null,
                gender: gender || null,
                registration_date: new Date(),
                updated_date: new Date(),
                last_login: null,
                status: 'active',
                email_verified: false
            }
        };
    }
}