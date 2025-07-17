import { Staff, IStaff } from '../models/Staff';

interface StaffDropdownItem {
    staff_id: string;
    full_name: string;
    department: string;
    hire_date: Date;
    permissions: string[];
}

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

    public static async getDropdown(): Promise<StaffDropdownItem[]> {
        const staffs = await Staff.find()
            .populate('user_id', 'full_name')
            .select('_id user_id department')
            .lean();

        return staffs.map(s => {
            const user = s.user_id as unknown as { _id: string; full_name: string };

            return {
                staff_id: s._id.toString(),
                full_name: user.full_name,
                department: s.department,
                hire_date: s.hire_date,
                permissions: s.permissions || []
            };
        });
    }
}
