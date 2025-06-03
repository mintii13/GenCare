import mongoose, { Document, Schema } from 'mongoose';

export interface IConsultant extends Document {
    consultant_id: string;
    user_id: mongoose.Types.ObjectId;
    specializations: string[];
    qualifications: string[];
    license_number?: string;
    experience_years: number;
    consultation_fee: number;
    available_hours?: any; // JSON object for availability schedule
    languages: string[];
    rating?: number;
    total_consultations: number;
    is_active: boolean;
    is_verified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ConsultantSchema: Schema = new Schema({
    consultant_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    specializations: [{
        type: String,
        enum: [
            'reproductive_health',
            'sti_prevention',
            'contraception',
            'pregnancy_care',
            'sexual_health',
            'mental_health',
            'gynecology',
            'urology'
        ]
    }],
    qualifications: [{
        type: String,
        trim: true
    }],
    license_number: {
        type: String,
        trim: true,
        sparse: true,
        unique: true
    },
    experience_years: {
        type: Number,
        required: true,
        min: 0
    },
    consultation_fee: {
        type: Number,
        required: true,
        min: 0
    },
    available_hours: {
        type: Schema.Types.Mixed,
        default: {}
    },
    languages: [{
        type: String,
        enum: ['vietnamese', 'english', 'french', 'chinese', 'japanese', 'korean']
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        set: (v: number) => Math.round(v * 100) / 100 // Round to 2 decimal places
    },
    total_consultations: {
        type: Number,
        default: 0,
        min: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'consultants'
});

// Indexes
ConsultantSchema.index({ consultant_id: 1 });
ConsultantSchema.index({ user_id: 1 });
ConsultantSchema.index({ specializations: 1 });
ConsultantSchema.index({ is_active: 1 });
ConsultantSchema.index({ is_verified: 1 });
ConsultantSchema.index({ rating: -1 });
ConsultantSchema.index({ consultation_fee: 1 });

// Virtual for populated user
ConsultantSchema.virtual('user', {
    ref: 'User',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true
});

// Virtual for experience level
ConsultantSchema.virtual('experience_level').get(function() {
    if (this.experience_years < 2) return 'junior';
    if (this.experience_years < 5) return 'mid-level';
    if (this.experience_years < 10) return 'senior';
    return 'expert';
});

// Static method to find active and verified consultants
ConsultantSchema.statics.findActiveVerified = function() {
    return this.find({ is_active: true, is_verified: true })
        .populate('user', 'full_name email phone')
        .sort({ rating: -1 });
};

// Static method to find by specialization
ConsultantSchema.statics.findBySpecialization = function(specialization: string) {
    return this.find({ 
        specializations: specialization,
        is_active: true, 
        is_verified: true 
    })
    .populate('user', 'full_name email phone')
    .sort({ rating: -1 });
};

// Static method to find by fee range
ConsultantSchema.statics.findByFeeRange = function(minFee: number, maxFee: number) {
    return this.find({
        consultation_fee: { $gte: minFee, $lte: maxFee },
        is_active: true,
        is_verified: true
    })
    .populate('user', 'full_name email phone')
    .sort({ consultation_fee: 1 });
};

// Static method to find by language
ConsultantSchema.statics.findByLanguage = function(language: string) {
    return this.find({
        languages: language,
        is_active: true,
        is_verified: true
    })
    .populate('user', 'full_name email phone')
    .sort({ rating: -1 });
};

// Method to check availability at specific time
ConsultantSchema.methods.isAvailableAt = function(date: Date) {
    if (!this.available_hours) return false;
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[date.getDay()];
    const daySchedule = this.available_hours[dayName];
    
    if (!daySchedule || !daySchedule.is_available) {
        return false;
    }
    
    const currentTime = date.getHours() * 100 + date.getMinutes();
    const startTime = parseInt(daySchedule.start_time.replace(':', ''));
    const endTime = parseInt(daySchedule.end_time.replace(':', ''));
    
    return currentTime >= startTime && currentTime <= endTime;
};

// Method to increment consultation count
ConsultantSchema.methods.incrementConsultationCount = function() {
    this.total_consultations += 1;
    return this.save();
};

// Method to update rating
ConsultantSchema.methods.updateRating = function(newRating: number) {
    // This is simplified - in real app you'd calculate based on all ratings
    this.rating = newRating;
    return this.save();
};

// Ensure virtual fields are serialized
ConsultantSchema.set('toJSON', { virtuals: true });
ConsultantSchema.set('toObject', { virtuals: true });

export default mongoose.model<IConsultant>('Consultant', ConsultantSchema);