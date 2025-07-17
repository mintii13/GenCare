import { Consultant, SpecializationType } from '../models/Consultant';

interface IServiceResponse {
    success: boolean;
    data?: any;
    message?: string;
}

// Add these methods to your existing ConsultantService class
// services/consultantService.ts (Additional methods)

import { AppointmentRepository } from '../repositories/appointmentRepository';
import { ConsultantRepository } from '../repositories/consultantRepository';

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

    /**
     * Lấy thông tin chi tiết của một chuyên gia theo ID
     * @param {string} consultantId - ID của chuyên gia
     * @returns {Promise<IServiceResponse>}
     */
    /**
     * Updated getConsultantById with feedback rating
     */
    public static async getConsultantById(consultantId: string): Promise<IServiceResponse> {
        try {
            console.log(`[DEBUG] ConsultantService: Starting getConsultantById with id=${consultantId}`);

            // Lấy consultant và populate thông tin user liên quan
            const consultant = await Consultant.findById(consultantId)
                .populate({
                    path: 'user_id',
                    select: '_id full_name email avatar phone'
                });

            if (!consultant) {
                console.log(`[DEBUG] ConsultantService: Consultant not found with id=${consultantId}`);
                return {
                    success: false,
                    message: "Consultant not found."
                };
            }

            // Get feedback stats for this consultant
            const feedbackStats = await AppointmentRepository.getConsultantFeedbackStats(consultantId);

            // Chuyển đổi cấu trúc dữ liệu
            const user = consultant.user_id as any;
            const formattedConsultant = {
                consultant_id: consultant._id,
                user_id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                specialization: consultant.specialization,
                qualifications: consultant.qualifications,
                experience_years: consultant.experience_years,
                consultation_rating: feedbackStats.averageRating, // Real feedback rating
                total_consultations: feedbackStats.totalFeedbacks // Real feedback count
            };

            console.log(`[DEBUG] ConsultantService: Successfully formatted consultant ${consultant._id}`);

            return {
                success: true,
                data: {
                    consultant: formattedConsultant
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

    /**
     * Get feedback statistics for multiple consultants
     */
    private static async getBulkFeedbackStats(consultantIds: string[]): Promise<{
        [consultantId: string]: {
            averageRating: number;
            totalFeedbacks: number;
        }
    }> {
        try {
            const stats: { [key: string]: { averageRating: number; totalFeedbacks: number } } = {};

            // Initialize all consultants with 0 ratings
            consultantIds.forEach(id => {
                stats[id] = { averageRating: 0, totalFeedbacks: 0 };
            });

            // Get actual ratings from appointments
            const ratingsData = await AppointmentRepository.getAverageRatingByConsultant();

            ratingsData.forEach(data => {
                const consultantIdStr = data.consultant_id.toString();
                if (stats[consultantIdStr]) {
                    stats[consultantIdStr] = {
                        averageRating: data.averageRating,
                        totalFeedbacks: data.totalFeedbacks
                    };
                }
            });

            return stats;
        } catch (error) {
            console.error('Error getting bulk feedback stats:', error);
            // Return empty stats if error
            const emptyStats: { [key: string]: { averageRating: number; totalFeedbacks: number } } = {};
            consultantIds.forEach(id => {
                emptyStats[id] = { averageRating: 0, totalFeedbacks: 0 };
            });
            return emptyStats;
        }
    }

    /**
     * Get top rated consultants
     */
    public static async getTopRatedConsultants(limit: number = 5): Promise<IServiceResponse> {
        try {
            const topRated = await AppointmentRepository.getAverageRatingByConsultant();

            // Take only the top rated ones
            const topConsultants = topRated
                .filter(consultant => consultant.totalFeedbacks >= 3) // Minimum 3 feedbacks
                .slice(0, limit);

            return {
                success: true,
                data: {
                    consultants: topConsultants,
                    total: topConsultants.length
                },
                message: 'Top rated consultants retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error getting top rated consultants:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Get consultant performance summary including feedback stats
     */
    public static async getConsultantPerformanceSummary(consultantId: string): Promise<IServiceResponse> {
        try {
            // Get consultant info
            const consultant = await Consultant.findById(consultantId).populate('user_id', 'full_name');
            if (!consultant) {
                return {
                    success: false,
                    message: 'Consultant not found'
                };
            }

            // Get feedback statistics
            const feedbackStats = await AppointmentRepository.getConsultantFeedbackStats(consultantId);

            // Get appointment counts
            const appointmentCounts = await AppointmentRepository.countByStatus(consultantId);
            const totalBooked = Object.values(appointmentCounts).reduce((sum, count) => sum + count, 0);
            const totalCompleted = appointmentCounts['completed'] || 0;
            const totalCancelled = appointmentCounts['cancelled'] || 0;

            // Calculate completion rate
            const completionRate = totalBooked > 0 ?
                Math.round((totalCompleted / totalBooked) * 100) : 0;

            // Get recent feedback
            const recentFeedback = await AppointmentRepository.findAppointmentsWithFeedback(consultantId, 5);

            const performanceSummary = {
                consultant_info: {
                    consultant_id: consultantId,
                    name: (consultant.user_id as any).full_name,
                    specialization: consultant.specialization,
                    experience_years: consultant.experience_years
                },
                feedback_stats: {
                    total_feedbacks: feedbackStats.totalFeedbacks,
                    average_rating: feedbackStats.averageRating,
                    rating_distribution: feedbackStats.ratingDistribution
                },
                appointment_stats: {
                    total_appointments: totalBooked,
                    completed_appointments: totalCompleted,
                    cancelled_appointments: totalCancelled,
                    completion_rate: completionRate
                },
                recent_feedback: recentFeedback.map(apt => ({
                    appointment_id: apt._id,
                    rating: apt.feedback!.rating,
                    comment: apt.feedback!.comment,
                    feedback_date: apt.feedback!.feedback_date,
                    customer_name: (apt.customer_id as any)?.full_name || 'Unknown'
                }))
            };

            return {
                success: true,
                data: performanceSummary,
                message: 'Consultant performance summary retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error getting consultant performance summary:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Get list of consultants with their average rating & total feedbacks (for booking page)
     */
    public static async getConsultantsWithRatings(): Promise<IServiceResponse> {
        try {
            // Get aggregated rating data
            const ratingData = await AppointmentRepository.getAverageRatingByConsultant();
            return {
                success: true,
                data: ratingData,
                message: 'Consultants with ratings retrieved successfully'
            };
        } catch (error: any) {
            console.error('Error getting consultants with ratings:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    public static async getConsultantsBySpecialization(specialization: SpecializationType) {
        try {
            // Validate specialization
            if (!Object.values(SpecializationType).includes(specialization)) {
                return {
                    success: false,
                    message: 'Invalid specialization'
                };
            }

            // Get consultants by specialization
            const consultants = await ConsultantRepository.getBySpecialization(specialization);
            if (!consultants || consultants.length === 0) {
                return {
                    success: false,
                    message: 'No consultants found for this specialization'
                };
            }
            return {
                success: true,
                message: 'Consultants retrieved successfully',
                data: consultants
            };
        } catch (error: any) {
            console.error(`[DEBUG] ConsultantService: Error occurred while getting consultants by specialization ${specialization}:`, error);
            return {
                success: false,
                message: error.message
            };
        }
    }
}