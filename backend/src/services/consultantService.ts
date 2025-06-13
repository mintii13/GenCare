import { Consultant } from '../models/Consultant';

interface IServiceResponse {
    success: boolean;
    data?: any;
    message?: string;
}

export class ConsultantService {
    /**
     * Lấy danh sách tất cả các chuyên gia và thông tin user liên quan, có hỗ trợ phân trang.
     * @param {number} page - Trang hiện tại
     * @param {number} limit - Số lượng kết quả mỗi trang
     * @returns {Promise<IServiceResponse>}
     */
    public static async getAllConsultants(page: number = 1, limit: number = 1000): Promise<IServiceResponse> {
        try {
            const skip = (page - 1) * limit;

            console.log(`[DEBUG] ConsultantService: Starting getAllConsultants with page=${page}, limit=${limit}, skip=${skip}`);

            // Lấy tất cả consultant và populate thông tin user liên quan
            const consultants = await Consultant.find({})
                .populate({
                    path: 'user_id',
                    select: '_id full_name email avatar' // Lấy các trường cần thiết
                })
                .select('_id specialization qualifications experience_years') // Lấy các trường cần thiết từ Consultant model
                .skip(skip)
                .limit(limit);

            console.log(`[DEBUG] ConsultantService: fetched ${consultants.length} consultants from DB`);

            const totalConsultants = await Consultant.countDocuments({});
            console.log(`[DEBUG] ConsultantService: total consultants in DB: ${totalConsultants}`);

            if (!consultants || consultants.length === 0) {
                console.log(`[DEBUG] ConsultantService: No consultants found, returning empty array`);
                return {
                    success: true,
                    data: {
                        consultants: [],
                        total: 0,
                        page,
                        limit,
                    },
                    message: "No consultants found."
                };
            }

            // Chuyển đổi cấu trúc dữ liệu để dễ sử dụng hơn ở frontend
            const formattedConsultants = consultants.map(consultant => {
                const user = consultant.user_id as any; // Type assertion
                console.log(`[DEBUG] ConsultantService: Processing consultant ${consultant._id}, user: ${user?.full_name || 'NO_USER'}`);
                return {
                    consultant_id: consultant._id,
                    user_id: user._id,
                    full_name: user.full_name,
                    email: user.email,
                    avatar: user.avatar,
                    specialization: consultant.specialization,
                    qualifications: consultant.qualifications,
                    experience_years: consultant.experience_years
                };
            });

            console.log(`[DEBUG] ConsultantService: Successfully formatted ${formattedConsultants.length} consultants`);

            return {
                success: true,
                data: {
                    consultants: formattedConsultants,
                    total: totalConsultants,
                    page,
                    limit,
                }
            };
        } catch (error: any) {
            console.error(`[DEBUG] ConsultantService: Error occurred: ${error.message}`);
            return {
                success: false,
                message: error.message
            };
        }
    }
} 