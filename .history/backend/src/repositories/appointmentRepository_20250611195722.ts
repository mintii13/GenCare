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
                .populate('consultant_id', 'user_id specialization qualifications')
                .sort({ appointment_date: 1, start_time: 1 })
                .lean();
        } catch (error) {
            console.error('Error finding appointments by customer ID:', error);
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

            const conflictingAppointment = await Appointment.findOne(query);
            return !!conflictingAppointment;
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

            if (status) query.status = status;
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
                .populate('consultant_id', 'user_id specialization qualifications')
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
}