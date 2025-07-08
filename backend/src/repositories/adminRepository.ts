import { Admin, IAdmin } from '../models/Admin';

export class AdminRepository {
    public static async create(adminData: Partial<IAdmin>): Promise<IAdmin> {
        try {
            const admin = new Admin(adminData);
            return await admin.save();
        } catch (error) {
            console.error('Error creating admin:', error);
            throw error;
        }
    }

    public static async findByUserId(userId: string): Promise<IAdmin | null> {
        try {
            return await Admin.findOne({ user_id: userId });
        } catch (error) {
            console.error('Error finding admin by user ID:', error);
            throw error;
        }
    }

    public static async findById(adminId: string): Promise<IAdmin | null> {
        try {
            return await Admin.findById(adminId);
        } catch (error) {
            console.error('Error finding admin by ID:', error);
            throw error;
        }
    }

    public static async updateByUserId(userId: string, updateData: Partial<IAdmin>): Promise<IAdmin | null> {
        try {
            return await Admin.findOneAndUpdate(
                { user_id: userId },
                updateData,
                { new: true, runValidators: true }
            );
        } catch (error) {
            console.error('Error updating admin:', error);
            throw error;
        }
    }

    public static async deleteByUserId(userId: string): Promise<boolean> {
        try {
            const result = await Admin.findOneAndDelete({ user_id: userId });
            return !!result;
        } catch (error) {
            console.error('Error deleting admin:', error);
            throw error;
        }
    }
}