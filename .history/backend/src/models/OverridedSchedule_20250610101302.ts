import mongoose, { Schema, Document } from 'mongoose';

export interface IOverridedSchedule extends Document {
    consultant_id: mongoose.Types.ObjectId;
    override_date: Date;
    override_type: 'unavailable' | 'custom_hours' | 'extended_break';
    custom_start_time?: string;
    custom_end_time?: string;
    custom_break_start?: string;
    custom_break_end?: string;
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
    override_type: {
        type: String,
        enum: ['unavailable', 'custom_hours', 'extended_break'],
        required: true
    },
    custom_start_time: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Custom start time must be in HH:mm format'
        }
    },
    custom_end_time: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Custom end time must be in HH:mm format'
        }
    },
    custom_break_start: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Custom break start time must be in HH:mm format'
        }
    },
    custom_break_end: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Custom break end time must be in HH:mm format'
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
    // Validate custom working hours
    if (this.override_type === 'custom_hours') {
        if (!this.custom_start_time || !this.custom_end_time) {
            next(new Error('Custom start time and end time are required for custom_hours override'));
            return;
        }

        const startTime = this.custom_start_time.split(':').map(Number);
        const endTime = this.custom_end_time.split(':').map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            next(new Error('Custom start time must be before custom end time'));
            return;
        }

        // Validate custom break time
        if (this.custom_break_start && this.custom_break_end) {
            const breakStartTime = this.custom_break_start.split(':').map(Number);
            const breakEndTime = this.custom_break_end.split(':').map(Number);

            const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
            const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

            if (breakStartMinutes >= breakEndMinutes) {
                next(new Error('Custom break start time must be before custom break end time'));
                return;
            }

            if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                next(new Error('Custom break time must be within custom working hours'));
                return;
            }
        } else if ((this.custom_break_start && !this.custom_break_end) || (!this.custom_break_start && this.custom_break_end)) {
            next(new Error('Both custom break start and end time are required if custom break is specified'));
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