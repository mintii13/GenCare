import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointmentHistory extends Document {
    appointment_id: mongoose.Types.ObjectId;
    action: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated' | 'started';
    performed_by_user_id: mongoose.Types.ObjectId;
    performed_by_role: 'customer' | 'consultant' | 'staff' | 'admin';
    old_data?: any; // JSON object - trạng thái cũ
    new_data: any;  // JSON object - trạng thái mới
    timestamp: Date;
}

const appointmentHistorySchema = new Schema<IAppointmentHistory>({
    appointment_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Appointment'
    },
    action: {
        type: String,
        enum: ['created', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'updated', 'started'],
        required: true
    },
    performed_by_user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    performed_by_role: {
        type: String,
        enum: ['customer', 'consultant', 'staff', 'admin'],
        required: true
    },
    old_data: {
        type: Schema.Types.Mixed, // JSON object
        default: null
    },
    new_data: {
        type: Schema.Types.Mixed, // JSON object
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
appointmentHistorySchema.index({ appointment_id: 1 });
appointmentHistorySchema.index({ performed_by_user_id: 1 });
appointmentHistorySchema.index({ timestamp: -1 });
appointmentHistorySchema.index({ action: 1 });

export const AppointmentHistory = mongoose.model<IAppointmentHistory>('AppointmentHistory', appointmentHistorySchema, 'appointmenthistory');