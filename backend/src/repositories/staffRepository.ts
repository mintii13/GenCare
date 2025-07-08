import { Staff, IStaff } from '../models/Staff';

export class StaffRepository {
    public static async create(staffData: Partial<IStaff>): Promise<IStaff> {
        try {
            const staff = new Staff(staffData);
            return await staff.save();
        } catch (error) {
            console.error('Error creating staff:', error);
            throw error;
        }
    }

    public static async findByUserId(userId: string): Promise<IStaff | null> {
        try {
            return await Staff.findOne({ user_id: userId });
        } catch (error) {
            console.error('Error finding staff by user ID:', error);
            throw error;
        }
    }

    public static async findById(staffId: string): Promise<IStaff | null> {
        try {
            return await Staff.findById(staffId);
        } catch (error) {
            console.error('Error finding staff by ID:', error);
            throw error;
        }
    }

    public static async updateByUserId(userId: string, updateData: Partial<IStaff>): Promise<IStaff | null> {
        try {
            return await Staff.findOneAndUpdate(
                { user_id: userId },
                updateData,
                { new: true, runValidators: true }
            );
        } catch (error) {
            console.error('Error updating staff:', error);
            throw error;
        }
    }

    public static async deleteByUserId(userId: string): Promise<boolean> {
        try {
            const result = await Staff.findOneAndDelete({ user_id: userId });
            return !!result;
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    }
}
