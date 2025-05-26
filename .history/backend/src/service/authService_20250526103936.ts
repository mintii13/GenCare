import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Customer } from '../models/Customer';
import { Consultant } from '../models/Consultant';
import { Staff } from '../models/Staff';
import { Admin } from '../models/Admin';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    user?: {
        user_id: string;
        user_name: string;
        email: string;
        full_name: string;
        role: string;
        status: boolean;
    };
    token?: string;
}

export class AuthService {
    private static jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    private static jwtExpiry = process.env.JWT_EXPIRY || '24h';

    public static async login(credentials: LoginCredentials): Promise<LoginResponse> {
        try {
            const { email, password } = credentials;

            // Find user by email
            const user = await User.model.findOne({ email }).lean<IUser>();

            if (!user) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }

            // Check if user is active
            if (!user.status) {
                return {
                    success: false,
                    message: 'Account is deactivated'
                };
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Invalid email or password'
                };
            }

            // Update last login
            await User.model.updateOne(
                { _id: user._id },
                { last_login: new Date() }
            );

            // Generate JWT token
            const token = jwt.sign(
                {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role
                },
                this.jwtSecret,
                { expiresIn: this.jwtExpiry }
            );

            return {
                success: true,
                message: 'Login successful',
                user: {
                    user_id: user.user_id,
                    user_name: user.user_name,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    status: user.status
                },
                token
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Internal server error'
            };
        }
    }

    public static async getUserProfile(userId: string): Promise<any> {
        try {
            const user = await User.model.findOne({ user_id: userId }).lean();

            if (!user) {
                return null;
            }

            let profileData: any = { ...user };

            // Get role-specific data
            switch (user.role) {
                case 'customer':
                    const customer = await Customer.model.findOne({ user_id: userId }).lean();
                    profileData.profile = customer;
                    break;
                case 'consultant':
                    const consultant = await Consultant.model.findOne({ user_id: userId }).lean();
                    profileData.profile = consultant;
                    break;
                case 'staff':
                    const staff = await Staff.model.findOne({ user_id: userId }).lean();
                    profileData.profile = staff;
                    break;
                case 'admin':
                    const admin = await Admin.model.findOne({ user_id: userId }).lean();
                    profileData.profile = admin;
                    break;
            }

            // Remove sensitive data
            delete profileData.password;

            return profileData;
        } catch (error) {
            console.error('Get user profile error:', error);
            return null;
        }
    }

    public static verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            return null;
        }
    }
}