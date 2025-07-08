// src/repositories/userRepository.ts
import { ObjectId } from 'mongoose';
import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

export class UserRepository {
    public static async findById(user_id: string): Promise<IUser | null> {
        try {
            const userId = new mongoose.Types.ObjectId(user_id);
            return await User.findById(userId);
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    public static async findByIdWithDetails(user_id: string): Promise<any> {
        try {
            const userId = new mongoose.Types.ObjectId(user_id);
            const user = await User.findById(userId).select('-password').lean();

            if (!user) return null;

            return {
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
        } catch (error) {
            console.error('Error finding user with details:', error);
            throw error;
        }
    }

    public static async findByEmail(email: string): Promise<IUser | null> {
        try {
            return await User.findOne({ email });
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    public static async getUserRoleById(userId: string): Promise<string | null> {
        try {
            const user = await User.findById(new mongoose.Types.ObjectId(userId));
            return user ? user.role : null;
        } catch (error) {
            console.log('Error getting role by id:', error);
            throw error;
        }
    }

    public static async findByIdAndUpdate(userId: ObjectId, updateData: Partial<IUser>): Promise<IUser | null> {
        try {
            return await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            ).select('-password');
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    public static async updateLastLogin(userId: string): Promise<void> {
        try {
            await User.updateOne(
                { _id: userId },
                { last_login: new Date() }
            );
        } catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    }

    public static async create(userData: Partial<IUser>): Promise<IUser> {
        try {
            const user = new User(userData);
            return await user.save();
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    public static async saveUser(user: Partial<IUser>) {
        try {
            return await user.save();
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }

    /**
     * Find users with pagination và filtering
     */
    public static async findWithPagination(
        filters: any,
        page: number,
        limit: number,
        sortBy: string = 'registration_date',
        sortOrder: 1 | -1 = -1
    ): Promise<{ users: any[], total: number }> {
        try {
            const skip = (page - 1) * limit;

            // Build sort object
            const sort: any = {};
            sort[sortBy] = sortOrder;

            // Get total count
            const total = await User.countDocuments(filters);

            // Get users with pagination
            const users = await User.find(filters)
                .select('-password')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean();

            // Transform users for response
            const transformedUsers = users.map(user => ({
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
            }));

            return {
                users: transformedUsers,
                total
            };
        } catch (error) {
            console.error('Error finding users with pagination:', error);
            throw error;
        }
    }

    /**
     * Get user statistics
     */
    public static async getStatistics(): Promise<any> {
        try {
            const pipeline = [
                {
                    $group: {
                        _id: null,
                        total_users: { $sum: 1 },
                        active_users: {
                            $sum: { $cond: [{ $eq: ["$status", true] }, 1, 0] }
                        },
                        inactive_users: {
                            $sum: { $cond: [{ $eq: ["$status", false] }, 1, 0] }
                        },
                        verified_users: {
                            $sum: { $cond: [{ $eq: ["$email_verified", true] }, 1, 0] }
                        },
                        unverified_users: {
                            $sum: { $cond: [{ $eq: ["$email_verified", false] }, 1, 0] }
                        }
                    }
                }
            ];

            const result = await User.aggregate(pipeline);
            const stats = result[0] || {
                total_users: 0,
                active_users: 0,
                inactive_users: 0,
                verified_users: 0,
                unverified_users: 0
            };

            // Get role statistics
            const roleStats = await User.aggregate([
                {
                    $group: {
                        _id: "$role",
                        count: { $sum: 1 }
                    }
                }
            ]);

            const roleStatistics = {
                customer: 0,
                consultant: 0,
                staff: 0,
                admin: 0
            };

            roleStats.forEach(role => {
                if (role._id && roleStatistics.hasOwnProperty(role._id)) {
                    roleStatistics[role._id as keyof typeof roleStatistics] = role.count;
                }
            });

            // Get registration statistics for last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentRegistrations = await User.countDocuments({
                registration_date: { $gte: sevenDaysAgo }
            });

            return {
                overview: {
                    total_users: stats.total_users,
                    active_users: stats.active_users,
                    inactive_users: stats.inactive_users,
                    verified_users: stats.verified_users,
                    unverified_users: stats.unverified_users
                },
                by_role: roleStatistics,
                recent_registrations: recentRegistrations
            };
        } catch (error) {
            console.error('Error getting user statistics:', error);
            throw error;
        }
    }
}