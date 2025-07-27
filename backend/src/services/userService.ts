// src/services/userService.ts
import { UserRepository } from '../repositories/userRepository';
import { CreateUserRequest, UpdateUserRequest, UserQuery } from '../dto/requests/UserRequest';
import { UserResponse, UsersResponse, UserStatisticsResponse } from '../dto/responses/UserResponse';
import { PaginationUtils } from '../utils/paginationUtils';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Customer } from '../models/Customer';
import { Consultant } from '../models/Consultant';
import { Staff } from '../models/Staff';
import { Admin } from '../models/Admin';
import mongoose from 'mongoose';

export class UserService {

    /**
     * Create role-specific entity based on user role
     */
    private static async createRoleEntity(userId: string, role: string, roleData?: any): Promise<void> {
        try {
            console.log(`🎯 createRoleEntity called with userId: ${userId}, role: ${role}, roleData:`, roleData);
            const userObjectId = new mongoose.Types.ObjectId(userId);

            switch (role) {
                case 'customer':
                    const customer = new Customer({
                        user_id: userObjectId,
                        medical_history: '',
                        last_updated: new Date()
                    });
                    await customer.save();
                    console.log(`Created Customer entity for user ${userId}`);
                    break;

                case 'consultant':
                    const consultant = new Consultant({
                        user_id: userObjectId,
                        specialization: roleData?.specialization || '',
                        qualifications: roleData?.qualifications || '',
                        experience_years: roleData?.experience_years || 0,
                        consultation_rating: 0,
                        total_consultations: 0
                    });
                    await consultant.save();
                    console.log(`Created Consultant entity for user ${userId} with specialization: ${roleData?.specialization}`);
                    break;

                case 'staff':
                    const staff = new Staff({
                        staff_id: `STAFF_${Date.now()}`,
                        user_id: userId,
                        department: roleData?.department || '',
                        hire_date: roleData?.hire_date ? new Date(roleData.hire_date) : new Date(),
                        permissions: roleData?.permissions || []
                    });
                    await staff.save();
                    console.log(`Created Staff entity for user ${userId} with department: ${roleData?.department}`);
                    break;

                case 'admin':
                    const admin = new Admin({
                        admin_id: `ADMIN_${Date.now()}`,
                        user_id: userId,
                        system_permissions: []
                    });
                    await admin.save();
                    console.log(`Created Admin entity for user ${userId}`);
                    break;

                default:
                    console.log(`No role entity needed for role: ${role}`);
            }
        } catch (error) {
            console.error(`Error creating role entity for ${role}:`, error);
            throw error;
        }
    }

    /**
     * Delete role-specific entity when user is deleted
     */
    private static async deleteRoleEntity(userId: string, role: string): Promise<void> {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);

            switch (role) {
                case 'customer':
                    await Customer.findOneAndDelete({ user_id: userObjectId });
                    console.log(`Deleted Customer entity for user ${userId}`);
                    break;

                case 'consultant':
                    await Consultant.findOneAndDelete({ user_id: userObjectId });
                    console.log(`Deleted Consultant entity for user ${userId}`);
                    break;

                case 'staff':
                    await Staff.findOneAndDelete({ user_id: userId });
                    console.log(`Deleted Staff entity for user ${userId}`);
                    break;

                case 'admin':
                    await Admin.findOneAndDelete({ user_id: userId });
                    console.log(`Deleted Admin entity for user ${userId}`);
                    break;

                default:
                    console.log(`No role entity to delete for role: ${role}`);
            }
        } catch (error) {
            console.error(`Error deleting role entity for ${role}:`, error);
            throw error;
        }
    }

    /**
     * Get users with pagination, search và filtering
     */
    public static async getUsersWithPagination(query: UserQuery): Promise<UsersResponse> {
        try {
            // Validate pagination parameters
            const { page, limit, sort_by, sort_order } = PaginationUtils.validatePagination(query);

            // Build filter query
            const filters = PaginationUtils.buildUserFilter(query);

            // Sanitize search
            if (query.search) {
                query.search = PaginationUtils.sanitizeSearch(query.search);
            }

            // Get data từ repository - with user-specific default
            const final_sort_by = sort_by === '_id' ? 'registration_date' : sort_by;
            const result = await UserRepository.findWithPagination(
                filters,
                page,
                limit,
                final_sort_by,
                sort_order
            );

            // Calculate pagination info
            const pagination = PaginationUtils.calculatePagination(
                result.total,
                page,
                limit
            );

            // Build filters_applied object
            const filters_applied: any = {};
            if (query.search) filters_applied.search = query.search;
            if (query.role) filters_applied.role = query.role;
            if (query.status !== undefined) filters_applied.status = query.status;
            if (query.email_verified !== undefined) filters_applied.email_verified = query.email_verified;
            if (query.date_from) filters_applied.date_from = query.date_from;
            if (query.date_to) filters_applied.date_to = query.date_to;
            if (query.sort_by) filters_applied.sort_by = query.sort_by;
            if (query.sort_order) filters_applied.sort_order = query.sort_order;

            return {
                success: true,
                message: result.users.length > 0
                    ? `Lấy danh sách ${result.users.length} người dùng thành công`
                    : 'Không tìm thấy người dùng nào',
                data: {
                    users: result.users,
                    pagination,
                    filters_applied
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('User service pagination error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi lấy danh sách người dùng'
            };
        }
    }

    /**
     * Get user by ID
     */
    public static async getUserById(userId: string): Promise<UserResponse> {
        try {
            const user = await UserRepository.findByIdWithDetails(userId);

            if (!user) {
                return {
                    success: false,
                    message: 'Không tìm thấy người dùng'
                };
            }

            return {
                success: true,
                message: 'Lấy thông tin người dùng thành công',
                data: {
                    user
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get user by ID error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi lấy thông tin người dùng'
            };
        }
    }

    public static async getAllUsersByRole(role: string) {
        try {
            const users = await UserRepository.getAllUsersByRole(role);
            if (!users || users.length === 0) {
                return {
                    success: false,
                    message: `Không tìm thấy người dùng với vai trò ${role}`,
                };
            }
            return {
                success: true,
                message: `Lấy danh sách người dùng với vai trò ${role} thành công`,
                data: users
            };
        } catch (error) {
            console.error('Service getAllStaffs error:', error);
            return {
            success: false,
            message: 'Không thể lấy danh sách nhân viên'
            };
        }
    }

    /**
     * Create new user
     */
    /**
 * Create new user
 */
    public static async createUser(userData: CreateUserRequest): Promise<UserResponse> {
        try {
            console.log('🎯 Backend createUser - received role:', userData.role);
            console.log('📝 Backend createUser - full userData:', JSON.stringify(userData, null, 2));
            
            // Check if email already exists
            const existingUser = await UserRepository.findByEmail(userData.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'Email đã được sử dụng'
                };
            }

            // Hash password if provided
            let hashedPassword;
            if (userData.password) {
                hashedPassword = await bcrypt.hash(userData.password, 10);
            }

            // Create user data
            const newUserData = {
                email: userData.email,
                password: hashedPassword,
                full_name: userData.full_name,
                phone: userData.phone,
                date_of_birth: userData.date_of_birth ? new Date(userData.date_of_birth) : undefined,
                gender: userData.gender,
                role: userData.role,
                status: userData.status !== undefined ? userData.status : true,
                email_verified: userData.email_verified !== undefined ? userData.email_verified : true, // Admin tạo user → mặc định đã xác thực
                avatar: userData.avatar,
                registration_date: new Date(),
                updated_date: new Date()
            };

            // Create user first
            const newUser = await UserRepository.create(newUserData);

            // Try to create role-specific entity
            try {
                // Extract role-specific data
                const roleData = {
                    // Staff fields
                    department: userData.department,
                    hire_date: userData.hire_date,
                    permissions: userData.permissions,
                    // Consultant fields
                    specialization: userData.specialization,
                    qualifications: userData.qualifications,
                    experience_years: userData.experience_years
                };
                
                console.log(`🔍 Creating ${userData.role} entity with roleData:`, roleData);
                console.log(`🎯 About to call createRoleEntity with userId: ${newUser._id.toString()}, role: ${userData.role}`);
                await this.createRoleEntity(newUser._id.toString(), userData.role, roleData);
            } catch (roleError) {
                // If role entity creation fails, delete the user
                console.error('Role entity creation failed, rolling back user creation:', roleError);
                await User.findByIdAndDelete(newUser._id);
                throw roleError;
            }

            return {
                success: true,
                message: 'Tạo người dùng thành công',
                data: {
                    user: {
                        id: newUser._id.toString(),
                        email: newUser.email,
                        full_name: newUser.full_name,
                        phone: newUser.phone,
                        date_of_birth: newUser.date_of_birth,
                        gender: newUser.gender,
                        role: newUser.role,
                        status: newUser.status,
                        email_verified: newUser.email_verified,
                        avatar: newUser.avatar,
                        registration_date: newUser.registration_date,
                        updated_date: newUser.updated_date,
                        last_login: newUser.last_login
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Create user error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi tạo người dùng'
            };
        }
    }
    /**
     * Update user
     */
    public static async updateUser(userId: string, updateData: UpdateUserRequest): Promise<UserResponse> {
        try {
            const existingUser = await UserRepository.findById(userId);
            if (!existingUser) {
                return {
                    success: false,
                    message: 'Không tìm thấy người dùng'
                };
            }

            // Check email uniqueness if email is being updated
            if (updateData.email && updateData.email !== existingUser.email) {
                const emailExists = await UserRepository.findByEmail(updateData.email);
                if (emailExists) {
                    return {
                        success: false,
                        message: 'Email đã được sử dụng bởi người dùng khác'
                    };
                }
            }

            // Hash password if provided
            if (updateData.password) {
                updateData.password = await bcrypt.hash(updateData.password, 10);
            }

            // Prepare update data with date conversion
            const updateFields: any = {
                ...updateData,
                updated_date: new Date()
            };

            // Convert date strings to Date objects if provided
            if (updateData.date_of_birth) {
                updateFields.date_of_birth = new Date(updateData.date_of_birth);
            }

            // Remove undefined fields
            Object.keys(updateFields).forEach(key => {
                if (updateFields[key] === undefined) {
                    delete updateFields[key];
                }
            });

            const updatedUser = await UserRepository.findByIdAndUpdate(
                userId as any,
                updateFields
            );

            if (!updatedUser) {
                return {
                    success: false,
                    message: 'Cập nhật người dùng thất bại'
                };
            }

            return {
                success: true,
                message: 'Cập nhật người dùng thành công',
                data: {
                    user: {
                        id: updatedUser._id.toString(),
                        email: updatedUser.email,
                        full_name: updatedUser.full_name,
                        phone: updatedUser.phone,
                        date_of_birth: updatedUser.date_of_birth,
                        gender: updatedUser.gender,
                        role: updatedUser.role,
                        status: updatedUser.status,
                        email_verified: updatedUser.email_verified,
                        avatar: updatedUser.avatar,
                        registration_date: updatedUser.registration_date,
                        updated_date: updatedUser.updated_date,
                        last_login: updatedUser.last_login
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Update user error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi cập nhật người dùng'
            };
        }
    }

    /**
     * Update user status
     */
    public static async updateUserStatus(userId: string, status: boolean): Promise<UserResponse> {
        try {
            const updatedUser = await UserRepository.findByIdAndUpdate(
                userId as any,
                { status, updated_date: new Date() }
            );

            if (!updatedUser) {
                return {
                    success: false,
                    message: 'Không tìm thấy người dùng'
                };
            }

            return {
                success: true,
                message: status ? 'Kích hoạt tài khoản thành công' : 'Vô hiệu hóa tài khoản thành công',
                data: {
                    user: {
                        id: updatedUser._id.toString(),
                        email: updatedUser.email,
                        full_name: updatedUser.full_name,
                        phone: updatedUser.phone,
                        date_of_birth: updatedUser.date_of_birth,
                        gender: updatedUser.gender,
                        role: updatedUser.role,
                        status: updatedUser.status,
                        email_verified: updatedUser.email_verified,
                        avatar: updatedUser.avatar,
                        registration_date: updatedUser.registration_date,
                        updated_date: updatedUser.updated_date,
                        last_login: updatedUser.last_login
                    }
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Update user status error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi cập nhật trạng thái người dùng'
            };
        }
    }

    /**
 * Hard delete user và role entity
 */
    public static async deleteUser(userId: string): Promise<UserResponse> {
        try {
            // Find user first to get role
            const user = await UserRepository.findById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'Không tìm thấy người dùng'
                };
            }

            // Store user data for response
            const userData = {
                id: user._id.toString(),
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                date_of_birth: user.date_of_birth,
                gender: user.gender,
                role: user.role,
                status: user.status,
                email_verified: user.email_verified,
                avatar: user.avatar,
                registration_date: user.registration_date,
                updated_date: user.updated_date,
                last_login: user.last_login
            };

            // Delete role-specific entity first
            await this.deleteRoleEntity(userId, user.role);

            // Hard delete user
            await User.findByIdAndDelete(userId);

            return {
                success: true,
                message: 'Xóa người dùng thành công',
                data: {
                    user: userData
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Delete user error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi xóa người dùng'
            };
        }
    }

    /**
     * Get user statistics
     */
    public static async getUserStatistics(): Promise<UserStatisticsResponse> {
        try {
            const stats = await UserRepository.getStatistics();

            return {
                success: true,
                message: 'Lấy thống kê người dùng thành công',
                data: {
                    statistics: stats
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Get user statistics error:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi lấy thống kê người dùng'
            };
        }
    }
}