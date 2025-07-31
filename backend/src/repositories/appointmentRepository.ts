import { Appointment, IAppointment } from '../models/Appointment';
import mongoose from 'mongoose';

export class AppointmentRepository {
    /**
     * Tạo appointment mới
     */
    public static async create(appointmentData: Partial<IAppointment>): Promise<IAppointment> {
        try {
            const appointment = new Appointment(appointmentData);
            return await appointment.save();
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    }

    /**
     * Tìm appointment theo ID
     */
    public static async findById(appointmentId: string): Promise<IAppointment | null> {
        try {
            return await Appointment.findById(appointmentId)
                .populate('customer_id', 'full_name email phone')
                .populate('consultant_id', 'user_id specialization')
                .lean();
        } catch (error) {
            console.error('Error finding appointment by ID:', error);
            throw error;
        }
    }

    /**
     * Tìm appointments theo customer ID
     */
    public static async findByCustomerId(
        customerId: string,
        status?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<IAppointment[]> {
        try {
            const query: any = { customer_id: customerId };

            if (status) {
                query.status = status;
            }

            if (startDate || endDate) {
                const dateQuery: any = {};
                if (startDate) dateQuery.$gte = startDate;
                if (endDate) dateQuery.$lte = endDate;
                query.appointment_date = dateQuery;
            }

            return await Appointment.find(query)
                .populate({
                    path: 'consultant_id',
                    select: 'user_id specialization qualifications',
                    populate: {
                        path: 'user_id',
                        select: 'full_name'
                    }
                })
                .sort({ appointment_date: 1, start_time: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding appointments by customer ID:', error);
            throw error;
        }
    }

    /**
     * NEW: Kiểm tra customer có pending appointment không
     */
    public static async hasPendingAppointment(customerId: string): Promise<boolean> {
        try {
            const pendingCount = await Appointment.countDocuments({
                customer_id: customerId,
                status: 'pending'
            });
            return pendingCount > 0;
        } catch (error) {
            console.error('Error checking pending appointments:', error);
            throw error;
        }
    }

    /**
     * NEW: Đếm số pending appointments của customer
     */
    public static async countPendingAppointments(customerId: string): Promise<number> {
        try {
            return await Appointment.countDocuments({
                customer_id: customerId,
                status: 'pending'
            });
        } catch (error) {
            console.error('Error counting pending appointments:', error);
            throw error;
        }
    }

    /**
     * Tìm appointments theo consultant ID
     */
    public static async findByConsultantId(
        consultantId: string,
        status?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<IAppointment[]> {
        try {
            const query: any = { consultant_id: consultantId };

            if (status) {
                query.status = status;
            }

            if (startDate || endDate) {
                const dateQuery: any = {};
                if (startDate) dateQuery.$gte = startDate;
                if (endDate) dateQuery.$lte = endDate;
                query.appointment_date = dateQuery;
            }

            return await Appointment.find(query)
                .populate('customer_id', 'full_name email phone')
                .sort({ appointment_date: 1, start_time: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding appointments by consultant ID:', error);
            throw error;
        }
    }

    /**
     * UPDATED: Tìm appointments trong một ngày cụ thể cho consultant với exclude statuses
     */
    public static async findByConsultantAndDate(
        consultantId: string,
        date: Date,
        excludeStatuses: string[] = ['cancelled']
    ): Promise<IAppointment[]> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const query: any = {
                consultant_id: consultantId,
                appointment_date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                status: { $nin: excludeStatuses }
            };

            return await Appointment.find(query)
                .populate('customer_id', 'full_name email phone')
                .sort({ start_time: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding appointments by consultant and date:', error);
            throw error;
        }
    }

    /**
     * Kiểm tra xung đột thời gian appointment
     */
    public static async checkTimeConflict(
        consultantId: string,
        date: Date,
        startTime: string,
        endTime: string,
        excludeAppointmentId?: string
    ): Promise<boolean> {
        try {
            console.log('🔍 [DEBUG] checkTimeConflict called with:', {
                consultantId,
                consultantIdType: typeof consultantId,
                date,
                startTime,
                endTime,
                excludeAppointmentId
            });

            // Ensure consultantId is a valid string and not an object
            if (!consultantId || typeof consultantId !== 'string') {
                console.error(' Invalid consultantId:', consultantId);
                throw new Error('Invalid consultant ID provided');
            }

            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const query: any = {
                consultant_id: consultantId,
                appointment_date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                status: { $nin: ['cancelled'] },
                $or: [
                    // New appointment starts during existing appointment
                    {
                        start_time: { $lte: startTime },
                        end_time: { $gt: startTime }
                    },
                    // New appointment ends during existing appointment
                    {
                        start_time: { $lt: endTime },
                        end_time: { $gte: endTime }
                    },
                    // New appointment completely contains existing appointment
                    {
                        start_time: { $gte: startTime },
                        end_time: { $lte: endTime }
                    }
                ]
            };

            if (excludeAppointmentId) {
                query._id = { $ne: excludeAppointmentId };
            }

            console.log('🔍 [DEBUG] Conflict check query:', JSON.stringify(query, null, 2));

            const conflictingAppointment = await Appointment.findOne(query);
            const hasConflict = !!conflictingAppointment;
            
            console.log('🔍 [DEBUG] Conflict check result:', hasConflict);
            if (conflictingAppointment) {
                console.log('🔍 [DEBUG] Conflicting appointment:', conflictingAppointment);
            }

            return hasConflict;
        } catch (error) {
            console.error('Error checking appointment time conflict:', error);
            throw error;
        }
    }

    /**
     * Update appointment
     */
    public static async updateById(
        appointmentId: string,
        updateData: Partial<IAppointment>
    ): Promise<IAppointment | null> {
        try {
            return await Appointment.findByIdAndUpdate(
                appointmentId,
                {
                    ...updateData,
                    updated_date: new Date()
                },
                {
                    new: true,
                    runValidators: true
                }
            ).lean();
        } catch (error) {
            console.error('Error updating appointment:', error);
            throw error;
        }
    }

    /**
     * Cancel appointment
     */
    public static async cancelById(appointmentId: string): Promise<IAppointment | null> {
        try {
            return await Appointment.findByIdAndUpdate(
                appointmentId,
                {
                    status: 'cancelled',
                    updated_date: new Date()
                },
                {
                    new: true,
                    runValidators: true
                }
            ).lean();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            throw error;
        }
    }

    /**
     * Confirm appointment
     */
    public static async confirmById(appointmentId: string): Promise<IAppointment | null> {
        try {
            return await Appointment.findByIdAndUpdate(
                appointmentId,
                {
                    status: 'confirmed',
                    updated_date: new Date()
                },
                {
                    new: true,
                    runValidators: true
                }
            ).lean();
        } catch (error) {
            console.error('Error confirming appointment:', error);
            throw error;
        }
    }

    /**
     * Complete appointment
     */
    public static async completeById(
        appointmentId: string,
        consultantNotes?: string
    ): Promise<IAppointment | null> {
        try {
            const updateData: any = {
                status: 'completed',
                updated_date: new Date()
            };

            if (consultantNotes) {
                updateData.consultant_notes = consultantNotes;
            }

            return await Appointment.findByIdAndUpdate(
                appointmentId,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            ).lean();
        } catch (error) {
            console.error('Error completing appointment:', error);
            throw error;
        }
    }

    /**
     * Tìm tất cả appointments (for admin/staff)
     */
    public static async findAll(
        status?: string,
        startDate?: Date,
        endDate?: Date,
        consultantId?: string,
        customerId?: string
    ): Promise<IAppointment[]> {
        try {
            const query: any = {};

            if (typeof status === 'string' && status.trim() !== '') {
                query.status = status;
            }
            if (consultantId) query.consultant_id = consultantId;
            if (customerId) query.customer_id = customerId;

            if (startDate || endDate) {
                const dateQuery: any = {};
                if (startDate) dateQuery.$gte = startDate;
                if (endDate) dateQuery.$lte = endDate;
                query.appointment_date = dateQuery;
            }

            return await Appointment.find(query)
                .populate('customer_id', 'full_name email phone')
                .populate({
                    path: 'consultant_id',
                    select: 'user_id specialization qualifications',
                    populate: {
                        path: 'user_id',
                        select: 'full_name'
                    }
                })
                .sort({ appointment_date: 1, start_time: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding all appointments:', error);
            throw error;
        }
    }

    /**
     * Đếm số appointments theo status
     */
    public static async countByStatus(
        consultantId?: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<{ [key: string]: number }> {
        try {
            const matchQuery: any = {};

            if (consultantId) matchQuery.consultant_id = new mongoose.Types.ObjectId(consultantId);

            if (startDate || endDate) {
                const dateQuery: any = {};
                if (startDate) dateQuery.$gte = startDate;
                if (endDate) dateQuery.$lte = endDate;
                matchQuery.appointment_date = dateQuery;
            }

            const result = await Appointment.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            const statusCounts: { [key: string]: number } = {};
            result.forEach(item => {
                statusCounts[item._id] = item.count;
            });

            return statusCounts;
        } catch (error) {
            console.error('Error counting appointments by status:', error);
            throw error;
        }
    }
    /**
 * Find appointments with feedback for consultant
 */
    public static async findAppointmentsWithFeedback(
        consultantId: string,
        limit?: number
    ): Promise<IAppointment[]> {
        try {
            const query = Appointment.find({
                consultant_id: consultantId,
                status: 'completed',
                feedback: { $exists: true, $ne: null }
            })
                .populate('customer_id', 'full_name email')
                .sort({ 'feedback.feedback_date': -1 });

            if (limit) {
                query.limit(limit);
            }

            return await query.lean();
        } catch (error) {
            console.error('Error finding appointments with feedback:', error);
            throw error;
        }
    }

    /**
 * Get consultant feedback statistics
 */
    public static async getConsultantFeedbackStats(
        consultantId: string
    ): Promise<{
        totalFeedbacks: number;
        averageRating: number;
        ratingDistribution: { [key: number]: number };
    }> {
        try {
            const result = await Appointment.aggregate([
                {
                    $match: {
                        consultant_id: new mongoose.Types.ObjectId(consultantId),
                        status: 'completed',
                        feedback: { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalFeedbacks: { $sum: 1 },
                        averageRating: { $avg: '$feedback.rating' },
                        ratings: { $push: '$feedback.rating' }
                    }
                }
            ]);

            if (!result || result.length === 0) {
                return {
                    totalFeedbacks: 0,
                    averageRating: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                };
            }

            const data = result[0];
            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            // Count rating distribution
            data.ratings.forEach((rating: number) => {
                if (rating >= 1 && rating <= 5) {
                    ratingDistribution[rating as keyof typeof ratingDistribution]++;
                }
            });

            return {
                totalFeedbacks: data.totalFeedbacks,
                averageRating: Math.round(data.averageRating * 10) / 10,
                ratingDistribution
            };
        } catch (error) {
            console.error('Error getting consultant feedback stats:', error);
            return {
                totalFeedbacks: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }
    }

    /**
     * Find all appointments with feedback (for admin queries)
     */
    public static async findAllAppointmentsWithFeedback(
        filters: {
            consultantId?: string;
            minRating?: number;
            maxRating?: number;
            startDate?: Date;
            endDate?: Date;
        } = {},
        page: number = 1,
        limit: number = 20
    ): Promise<{
        appointments: IAppointment[];
        total: number;
    }> {
        try {
            const query: any = {
                status: 'completed',
                feedback: { $exists: true }
            };

            // Apply filters
            if (filters.consultantId) {
                query.consultant_id = filters.consultantId;
            }

            if (filters.minRating !== undefined || filters.maxRating !== undefined) {
                query['feedback.rating'] = {};
                if (filters.minRating !== undefined) {
                    query['feedback.rating'].$gte = filters.minRating;
                }
                if (filters.maxRating !== undefined) {
                    query['feedback.rating'].$lte = filters.maxRating;
                }
            }

            if (filters.startDate || filters.endDate) {
                query['feedback.feedback_date'] = {};
                if (filters.startDate) {
                    query['feedback.feedback_date'].$gte = filters.startDate;
                }
                if (filters.endDate) {
                    query['feedback.feedback_date'].$lte = filters.endDate;
                }
            }

            // Get total count
            const total = await Appointment.countDocuments(query);

            // Get paginated results
            const appointments = await Appointment.find(query)
                .populate('customer_id', 'full_name email')
                .populate({
                    path: 'consultant_id',
                    select: 'user_id specialization',
                    populate: {
                        path: 'user_id',
                        select: 'full_name email'
                    }
                })
                .sort({ 'feedback.feedback_date': -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            return { appointments, total };
        } catch (error) {
            console.error('Error finding all appointments with feedback:', error);
            throw error;
        }
    }

    /**
 * Update feedback for appointment
 */
    public static async updateFeedback(
        appointmentId: string,
        feedbackData: {
            rating: number;
            comment?: string;
        }
    ): Promise<IAppointment | null> {
        try {
            return await Appointment.findByIdAndUpdate(
                appointmentId,
                {
                    'feedback.rating': feedbackData.rating,
                    'feedback.comment': feedbackData.comment,
                    updated_date: new Date()
                },
                {
                    new: true,
                    runValidators: true
                }
            ).lean();
        } catch (error) {
            console.error('Error updating feedback:', error);
            throw error;
        }
    }

    /**
     * Remove feedback from appointment
     */
    public static async removeFeedback(appointmentId: string): Promise<IAppointment | null> {
        try {
            return await Appointment.findByIdAndUpdate(
                appointmentId,
                {
                    $unset: { feedback: "" },
                    updated_date: new Date()
                },
                {
                    new: true,
                    runValidators: true
                }
            ).lean();
        } catch (error) {
            console.error('Error removing feedback:', error);
            throw error;
        }
    }

    /**
     * Count appointments by feedback rating for a consultant
     */
    public static async countByFeedbackRating(
        consultantId: string
    ): Promise<{ [key: number]: number }> {
        try {
            const result = await Appointment.aggregate([
                {
                    $match: {
                        consultant_id: new mongoose.Types.ObjectId(consultantId),
                        status: 'completed',
                        feedback: { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$feedback.rating',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const ratingCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            result.forEach(item => {
                ratingCounts[item._id] = item.count;
            });

            return ratingCounts;
        } catch (error) {
            console.error('Error counting by feedback rating:', error);
            throw error;
        }
    }

    /**
     * Find appointments that can receive feedback (completed but no feedback yet)
     */
    public static async findAppointmentsEligibleForFeedback(
        customerId: string
    ): Promise<IAppointment[]> {
        try {
            return await Appointment.find({
                customer_id: customerId,
                status: 'completed',
                feedback: { $exists: false }
            })
                .populate({
                    path: 'consultant_id',
                    select: 'user_id specialization',
                    populate: {
                        path: 'user_id',
                        select: 'full_name'
                    }
                })
                .sort({ appointment_date: -1 })
                .lean();
        } catch (error) {
            console.error('Error finding appointments eligible for feedback:', error);
            throw error;
        }
    }

    /**
     * Find completed appointments without feedback within time range for reminder
     */
    public static async findCompletedWithoutFeedback(
        startTime: Date,
        endTime: Date
    ): Promise<IAppointment[]> {
        try {
            return await Appointment.find({
                status: 'completed',
                feedback: { $exists: false },
                updatedAt: { $gte: startTime, $lte: endTime }, // completed within time range
                feedback_reminder_sent: { $ne: true } // haven't sent reminder yet
            })
                .populate('customer_id', 'full_name email')
                .populate({
                    path: 'consultant_id',
                    select: 'user_id',
                    populate: {
                        path: 'user_id',
                        select: 'full_name'
                    }
                })
                .sort({ updatedAt: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding completed appointments without feedback:', error);
            throw error;
        }
    }

    /**
     * Mark feedback reminder as sent
     */
    public static async markFeedbackReminderSent(appointmentId: string): Promise<boolean> {
        try {
            const result = await Appointment.updateOne(
                { _id: appointmentId },
                { 
                    $set: { 
                        feedback_reminder_sent: true,
                        feedback_reminder_sent_at: new Date()
                    }
                }
            );
            return result.modifiedCount > 0;
        } catch (error) {
            console.error('Error marking feedback reminder as sent:', error);
            throw error;
        }
    }

    /**
     * Get average rating for all consultants
     */
    public static async getAverageRatingByConsultant(): Promise<Array<{
        consultant_id: string;
        averageRating: number;
        totalFeedbacks: number;
    }>> {
        try {
            const result = await Appointment.aggregate([
                {
                    $match: {
                        status: 'completed',
                        feedback: { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$consultant_id',
                        averageRating: { $avg: '$feedback.rating' },
                        totalFeedbacks: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'consultants',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'consultant'
                    }
                },
                {
                    $unwind: '$consultant'
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'consultant.user_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $project: {
                        consultant_id: '$_id',
                        averageRating: { $round: ['$averageRating', 1] },
                        totalFeedbacks: 1,
                        consultantName: '$user.full_name',
                        specialization: '$consultant.specialization'
                    }
                },
                {
                    $sort: { averageRating: -1 }
                }
            ]);

            return result;
        } catch (error) {
            console.error('Error getting average rating by consultant:', error);
            throw error;
        }
    }
    /**
 * Get feedback history for a customer
 */
    public static async getCustomerFeedbackHistory(
        customerId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{
        feedbacks: IAppointment[];
        total: number;
        totalPages: number;
    }> {
        try {
            const skip = (page - 1) * limit;

            const feedbacks = await Appointment.find({
                customer_id: customerId,
                status: 'completed',
                feedback: { $exists: true, $ne: null }
            })
                .populate({
                    path: 'consultant_id',
                    select: 'user_id specialization',
                    populate: {
                        path: 'user_id',
                        select: 'full_name'
                    }
                })
                .sort({ 'feedback.feedback_date': -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await Appointment.countDocuments({
                customer_id: customerId,
                status: 'completed',
                feedback: { $exists: true, $ne: null }
            });

            const totalPages = Math.ceil(total / limit);

            return {
                feedbacks,
                total,
                totalPages
            };
        } catch (error) {
            console.error('Error getting customer feedback history:', error);
            throw error;
        }
    }

    /**
 * Find appointments với pagination và filtering
 */
    public static async findWithPagination(
        filters: any,
        page: number,
        limit: number,
        sortBy: string = 'appointment_date',
        sortOrder: 1 | -1 = -1
    ): Promise<{
        appointments: any[];
        total: number;
    }> {
        try {
            // Build sort object
            const sortObj: any = {};
            sortObj[sortBy] = sortOrder;

            // Get total count với cùng filter
            const total = await Appointment.countDocuments(filters);

            // Get paginated appointments với populate
            const appointments = await Appointment.find(filters)
                .populate('customer_id', 'full_name email phone')
                .populate({
                    path: 'consultant_id',
                    populate: {
                        path: 'user_id',
                        select: 'full_name email phone'
                    }
                })
                .sort(sortObj)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            return { appointments, total };
        } catch (error) {
            console.error('Error finding appointments with pagination:', error);
            throw error;
        }
    }

    /**
     * Get appointments stats by status
     */
    public static async getAppointmentStats(filters: any = {}): Promise<any> {
        try {
            const stats = await Appointment.aggregate([
                { $match: filters },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const result = {
                total: 0,
                pending: 0,
                confirmed: 0,
                in_progress: 0,
                completed: 0,
                cancelled: 0
            };

            stats.forEach(stat => {
                result[stat._id as keyof typeof result] = stat.count;
                result.total += stat.count;
            });

            return result;
        } catch (error) {
            console.error('Error getting appointment stats:', error);
            throw error;
        }
    }
}