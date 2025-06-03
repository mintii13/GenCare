import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    customer_id: string;
    user_id: mongoose.Types.ObjectId;
    
    // Medical Information
    blood_type?: string;
    allergies?: string[]; // JSON array of allergies
    chronic_conditions?: string[]; // JSON array
    current_medications?: string[]; // JSON array
    height?: number;
    weight?: number;
    
    // Reproductive Health
    last_menstrual_date?: Date;
    cycle_length?: number;
    contraceptive_method?: string;
    pregnancy_history?: any[]; // JSON array of pregnancy records
    
    // Emergency Contact
    emergency_name?: string;
    emergency_relationship?: string;
    emergency_phone?: string;
    
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema: Schema = new Schema({
    customer_id: {
        type: String,
        unique: true,
        required: true
        // Auto-generated: CUST2025000001
    },
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true
    },
    
    // Medical Information
    blood_type: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    allergies: [{
        type: String,
        trim: true
    }],
    chronic_conditions: [{
        type: String,
        trim: true
    }],
    current_medications: [{
        type: String,
        trim: true
    }],
    height: {
        type: Number,
        min: 50,
        max: 300 // cm
    },
    weight: {
        type: Number,
        min: 10,
        max: 500 // kg
    },
    
    // Reproductive Health
    last_menstrual_date: {
        type: Date
    },
    cycle_length: {
        type: Number,
        min: 20,
        max: 45 // days
    },
    contraceptive_method: {
        type: String,
        trim: true
    },
    pregnancy_history: [{
        pregnancy_number: Number,
        year: Number,
        outcome: String, // live_birth, miscarriage, abortion, etc.
        complications: String,
        notes: String
    }],
    
    // Emergency Contact
    emergency_name: {
        type: String,
        trim: true
    },
    emergency_relationship: {
        type: String,
        trim: true
    },
    emergency_phone: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    collection: 'customers'
});

// Indexes
CustomerSchema.index({ customer_id: 1 });
CustomerSchema.index({ user_id: 1 });

// Auto-generate customer_id before saving
CustomerSchema.pre('save', async function(next) {
    if (!this.customer_id) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Customer').countDocuments();
        this.customer_id = `CUST${year}${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

export default mongoose.model<ICustomer>('Customer', CustomerSchema);