import { StaffRepository } from "../repositories/staffRepository";

export class StaffService {
    public static async getDropdownStaffs(){
        try {
            const staffs = await StaffRepository.getDropdown();
            if (!staffs || staffs.length === 0) {
                return { 
                    success: false, 
                    message: 'No staff found' 
                };
            }
            return { 
                success: true, 
                message: 'Staff dropdown fetched successfully',
                data: staffs 
            };
        } catch (error) {
            console.error('Error fetching dropdown staff:', error);
            return { 
                success: false, 
                message: 'Internal server error to fetch staff dropdown' 
            };
        }
    }
}
