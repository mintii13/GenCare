import mongoose, { Schema, Document } from 'mongoose';

export interface IOverridedSchedule extends Document {
    consultant_id: mongoose.Types.ObjectId;
    override_date: Date;
    start_time?: string;
    end_time?: string;
    break_start?: string;
    break_end?: string;
    reason: string;
    created_by: {
        user_id: mongoose.Types.ObjectId;
        role: string;
        name: string;
    };
    created_date: Date;
    updated_date: Date;
}

const overridedScheduleSchema = new Schema<IOverridedSchedule>({
    consultant_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Consultant'
    },
    override_date: {
        type: Date,
        required: true
    },
    start_time: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Start time must be in HH:mm format'
        }
    },
    end_time: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'End time must be in HH:mm format'
        }
    },
    break_start: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Break start time must be in HH:mm format'
        }
    },
    break_end: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Break end time must be in HH:mm format'
        }
    },
    reason: {
        type: String,
        required: true
    },
    created_by: {
        user_id: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        role: {
            type: String,
            required: true,
            enum: ['consultant', 'staff', 'admin']
        },
        name: {
            type: String,
            required: true
        }
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

// Validate time constraints
overridedScheduleSchema.pre('save', function (next) {
    // Nếu có start_time thì phải có end_time
    if ((this.start_time && !this.end_time) || (!this.start_time && this.end_time)) {
        next(new Error('Both start time and end time are required if working hours are specified'));
        return;
    }

    // Validate working hours
    if (this.start_time && this.end_time) {
        const startTime = this.start_time.split(':').map(Number);
        const endTime = this.end_time.split(':').map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            next(new Error('Start time must be before end time'));
            return;
        }

        // Validate break time
        if (this.break_start && this.break_end) {
            const breakStartTime = this.break_start.split(':').map(Number);
            const breakEndTime = this.break_end.split(':').map(Number);

            const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
            const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

            if (breakStartMinutes >= breakEndMinutes) {
                next(new Error('Break start time must be before break end time'));
                return;
            }

            if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                next(new Error('Break time must be within working hours'));
                return;
            }
        } else if ((this.break_start && !this.break_end) || (!this.break_start && this.break_end)) {
            next(new Error('Both break start and end time are required if break is specified'));
            return;
        }
    }

    // Update updated_date on save
    this.updated_date = new Date();
    next();
});

// Compound index để đảm bảo một consultant không có 2 override trùng ngày
overridedScheduleSchema.index({ consultant_id: 1, override_date: 1 }, { unique: true });

// Index cho queries
overridedScheduleSchema.index({ consultant_id: 1 });
overridedScheduleSchema.index({ override_date: 1 });
overridedScheduleSchema.index({ 'created_by.user_id': 1 });

export const OverridedSchedule = mongoose.model<IOverridedSchedule>('OverridedSchedule', overridedScheduleSchema);