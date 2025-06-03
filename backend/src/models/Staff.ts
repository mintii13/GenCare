import mongoose, { Document, Schema } from 'mongoose';

export interface IStaff extends Document {
    staff_id: string;
    user_id: mongoose.Types.ObjectId;
    department: string;
    position: string;
    facility_id?: mongoose.Types.ObjectId;
    schedule?: any; // JSON object for work schedule
    permissions: string[];
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const StaffSchema: Schema = new Schema({
    staff_id: {
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
    department: {
        type: String,
        required: true,
        enum: [
            'medical',
            'laboratory',
            'customer_service',
            'administration',
            'it_support',
            'management'
        ]
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    facility_id: {
        type: Schema.Types.ObjectId,
        ref: 'MedicalFacility'
    },
    schedule: {
        type: Schema.Types.Mixed,
        default: {}
    },
    permissions: [{
        type: String,
        enum: [
            'view_bookings',
            'manage_bookings',
            'view_test_results',
            'manage_test_results',
            'view_customers',
            'manage_customers',
            'view_reports',
            'sample_collection',
            'result_verification'
        ]
    }],
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'staff'
});

// Indexes
StaffSchema.index({ staff_id: 1 });
StaffSchema.index({ user_id: 1 });
StaffSchema.index({ department: 1 });
StaffSchema.index({ facility_id: 1 });
StaffSchema.index({ is_active: 1 });

// Virtual for populated user
StaffSchema.virtual('user', {
    ref: 'User',
    localField: 'user_id',
    foreignField: '_id',
    justOne: true
});

// Virtual for populated facility
StaffSchema.virtual('facility', {
    ref: 'MedicalFacility',
    localField: 'facility_id',
    foreignField: '_id',
    justOne: true
});

// Static method to find active staff
StaffSchema.statics.findActive = function() {
    return this.find({ is_active: true })
        .populate('user', 'full_name email phone')
        .populate('facility', 'name city')
        .sort({ 'user.full_name': 1 });
};

// Static method to find by department
StaffSchema.statics.findByDepartment = function(department: string) {
    return this.find({ department, is_active: true })
        .populate('user', 'full_name email phone')
        .populate('facility', 'name city')
        .sort({ 'user.full_name': 1 });
};

// Static method to find by facility
StaffSchema.statics.findByFacility = function(facilityId: string) {
    return this.find({ facility_id: facilityId, is_active: true })
        .populate('user', 'full_name email phone')
        .sort({ department: 1, 'user.full_name': 1 });
};

// Method to check if staff has permission
StaffSchema.methods.hasPermission = function(permission: string) {
    return this.permissions.includes(permission);
};

// Ensure virtual fields are serialized
StaffSchema.set('toJSON', { virtuals: true });
StaffSchema.set('toObject', { virtuals: true });

export default mongoose.model<IStaff>('Staff', StaffSchema);