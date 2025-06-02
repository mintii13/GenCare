import bcrypt from 'bcryptjs';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { LoginResponse } from '../dto/responses/LoginResponse';
import { UserRepository } from '../repositories/userRepository';
import { JWTUtils } from '../utils/jwtUtils';

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

            // Generate JWT access token
            const accessToken = JWTUtils.generateAccessToken({
                userId: user._id.toString(),
                email: user.email,
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
                    status: user.status
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

    public static async register(registerRequest: RegisterRequest): Promise<RegisterResponse> {
        try {
            const { email, password } = registerRequest;

            //check duplicate email
            const existedUser = await UserRepository.findByEmail(email);

            if (existedUser) {
                return {
                    success: false,
                    message: 'Email này đã tồn tại. Hãy đăng nhập'
                };
            }

            //thêm 1 thằng check password có trùng khớp với verified_password

            return {
                success: true,
                message: 'Đăng ký thành công',
                user: {
                    email: email,
                    password: await bcrypt.hash(password, 10)
                },
            };

        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống'
            };
        }
    }


}
