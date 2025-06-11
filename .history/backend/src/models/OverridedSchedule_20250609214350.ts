import mongoose, { Schema, Document } from 'mongoose';

export interface IOverridedSchedule extends Document {
    schedule_id: mongoose.Types.ObjectId;
    consultant_id: mongoose.Types.ObjectId;
    date: Date;
    start_time?: string;
    end_time?: string;
    break_start?: string;
    break_end?: string;
    is_available: boolean;
    created_date: Date;
    updated_date: Date;
}

const overridedScheduleSchema = new Schema<IOverridedSchedule>({
    schedule_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'WeeklySchedule'
    },
    consultant_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Consultant'
    },
    date: {
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
    is_available: {
        type: Boolean,
        default: true
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
    if (this.start_time && this.end_time) {
        const startTime = this.start_time.split(':').map(Number);
        const endTime = this.end_time.split(':').map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            next(new Error('Start time must be before end time'));
            return;
        }
    }

    if ((this.break_start && !this.break_end) || (!this.break_start && this.break_end)) {
        next(new Error('Both break start and end time are required if break is specified'));
        return;
    }

    if (this.break_start && this.break_end) {
        const breakStartTime = this.break_start.split(':').map(Number);
        const breakEndTime = this.break_end.split(':').map(Number);

        const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
        const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

        if (breakStartMinutes >= breakEndMinutes) {
            next(new Error('Break start time must be before break end time'));
            return;
        }

        if (this.start_time && this.end_time) {
            const startTime = this.start_time.split(':').map(Number);
            const endTime = this.end_time.split(':').map(Number);

            const startMinutes = startTime[0] * 60 + startTime[1];
            const endMinutes = endTime[0] * 60 + endTime[1];

            if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                next(new Error('Break time must be within working hours'));
                return;
            }
        }
    }

    next();
});

// Compound index để đảm bảo một consultant không có 2 override trùng ngày
overridedScheduleSchema.index({ consultant_id: 1, date: 1 }, { unique: true });

export const OverridedSchedule = mongoose.model<IOverridedSchedule>('OverridedSchedule', overridedScheduleSchema); 