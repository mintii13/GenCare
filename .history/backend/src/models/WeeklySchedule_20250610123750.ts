import mongoose, { Schema, Document } from 'mongoose';

interface WorkingDay {
    start_time: string;
    end_time: string;
    break_start?: string;
    break_end?: string;
    is_available: boolean;
}

export interface IWeeklySchedule extends Document {
    consultant_id: mongoose.Types.ObjectId;
    week_start_date: Date; // Ngày bắt đầu tuần (thứ 2)
    week_end_date: Date;   // Ngày kết thúc tuần (chủ nhật)
    working_days: {
        monday?: WorkingDay;
        tuesday?: WorkingDay;
        wednesday?: WorkingDay;
        thursday?: WorkingDay;
        friday?: WorkingDay;
        saturday?: WorkingDay;
        sunday?: WorkingDay;
    };
    default_slot_duration: number;
    notes?: string; // Ghi chú cho tuần này
    created_by: {
        user_id: mongoose.Types.ObjectId;
        role: string;
        name: string;
    };
    created_date: Date;
    updated_date: Date;
}

const workingDaySchema = new Schema<WorkingDay>({
    start_time: {
        type: String,
        required: true,
        default: "08:00",
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
        default: "17:00",
        validate: {
            validator: function (v: string) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'End time must be in HH:mm format'
        }
    },
    break_start: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true; // Optional field
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Break start time must be in HH:mm format'
        }
    },
    break_end: {
        type: String,
        validate: {
            validator: function (v: string) {
                if (!v) return true; // Optional field
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: 'Break end time must be in HH:mm format'
        }
    },
    is_available: {
        type: Boolean,
        default: false
    }
});

const weeklyScheduleSchema = new Schema<IWeeklySchedule>({
    consultant_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Consultant'
    },
    week_start_date: {
        type: Date,
        required: true
    },
    week_end_date: {
        type: Date,
        required: true
    },
    working_days: {
        monday: workingDaySchema,
        tuesday: workingDaySchema,
        wednesday: workingDaySchema,
        thursday: workingDaySchema,
        friday: workingDaySchema,
        saturday: workingDaySchema,
        sunday: workingDaySchema
    },
    default_slot_duration: {
        type: Number,
        required: true,
        default: 30 // 30 minutes
    },
    notes: {
        type: String
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

// Validate working hours and breaks
weeklyScheduleSchema.pre('save', function (next) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of days) {
        const workingDay = this.working_days[day];
        if (!workingDay) continue;

        const startTime = workingDay.start_time.split(':').map(Number);
        const endTime = workingDay.end_time.split(':').map(Number);

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        if (startMinutes >= endMinutes) {
            next(new Error(`${day}: Start time must be before end time`));
            return;
        }

        // Validate break time
        if (workingDay.break_start && workingDay.break_end) {
            const breakStartTime = workingDay.break_start.split(':').map(Number);
            const breakEndTime = workingDay.break_end.split(':').map(Number);

            const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
            const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];

            if (breakStartMinutes >= breakEndMinutes) {
                next(new Error(`${day}: Break start time must be before break end time`));
                return;
            }

            if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
                next(new Error(`${day}: Break time must be within working hours`));
                return;
            }
        } else if ((workingDay.break_start && !workingDay.break_end) || (!workingDay.break_start && workingDay.break_end)) {
            next(new Error(`${day}: Both break start and end time are required if break is specified`));
            return;
        }
    }

    // Update updated_date on save
    this.updated_date = new Date();
    next();
});

// Compound index để đảm bảo một consultant không có 2 schedule trùng tuần
weeklyScheduleSchema.index({ consultant_id: 1, week_start_date: 1 }, { unique: true });

// Index cho queries
weeklyScheduleSchema.index({ consultant_id: 1 });
weeklyScheduleSchema.index({ week_start_date: 1, week_end_date: 1 });
weeklyScheduleSchema.index({ 'created_by.user_id': 1 });

export const WeeklySchedule = mongoose.model<IWeeklySchedule>('WeeklySchedule', weeklyScheduleSchema);