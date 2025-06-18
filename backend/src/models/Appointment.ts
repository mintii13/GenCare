import mongoose, { Schema, Document } from 'mongoose';

interface MeetingInfo {
    meet_url: string;
    meeting_id: string;
    created_at: Date;
    reminder_sent: boolean;
    meeting_password?: string;
}

export interface IAppointment extends Document {
    customer_id: mongoose.Types.ObjectId;
    consultant_id: mongoose.Types.ObjectId;
    appointment_date: Date;
    start_time: string; // Format: "HH:mm"
    end_time: string;   // Format: "HH:mm"
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress';
    customer_notes?: string;
    consultant_notes?: string;
    meeting_info?: MeetingInfo;
    video_call_status?: 'not_started' | 'in_progress' | 'ended';
    created_date: Date;
    updated_date: Date;
}

const meetingInfoSchema = new Schema<MeetingInfo>({
    meet_url: {
        type: String,
        required: true
    },
    meeting_id: {
        type: String,
        required: true,
        unique: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    reminder_sent: {
        type: Boolean,
        default: false
    },
    meeting_password: {
        type: String
    }
});

const appointmentSchema = new Schema<IAppointment>({
    customer_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    consultant_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Consultant'
    },
    appointment_date: {
        type: Date,
        required: true
    },
    start_time: {
        type: String,
        required: true,
        validate: {
            validator: function (v: string) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Start time must be in HH:mm format'
        }
    },
    end_time: {
        type: String,
        required: true,
        validate: {
            validator: function (v: string) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'End time must be in HH:mm format'
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed', 'in_progress'],
        default: 'pending'
    },
    customer_notes: {
        type: String
    },
    consultant_notes: {
        type: String
    },
    meeting_info: meetingInfoSchema,
    video_call_status: {
        type: String,
        enum: ['not_started', 'in_progress', 'ended'],
        default: 'not_started'
    },
    created_date: {
        type: Date,
        default: Date.now
    },
    updated_date: {
        type: Date,
        default: Date.now
    }
});

// Validate appointment time
appointmentSchema.pre('save', function (next) {
    const startTime = this.start_time.split(':').map(Number);
    const endTime = this.end_time.split(':').map(Number);

    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    if (startMinutes >= endMinutes) {
        next(new Error('Start time must be before end time'));
        return;
    }

    // Update updated_date on save
    this.updated_date = new Date();
    next();
});

// Compound index để đảm bảo không có appointment trùng thời gian cho cùng consultant
appointmentSchema.index({
    consultant_id: 1,
    appointment_date: 1,
    start_time: 1
});

// Index cho queries
appointmentSchema.index({ customer_id: 1 });
appointmentSchema.index({ consultant_id: 1 });
appointmentSchema.index({ appointment_date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ 'meeting_info.meeting_id': 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);