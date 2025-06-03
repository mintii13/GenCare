import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    date_of_birth?: Date;
    gender?: 'male' | 'female' | 'other';
    registration_date: Date;
    updated_date: Date;
    last_login?: Date;
    status: boolean;
    email_verified: boolean;
    role: 'guest' | 'customer' | 'consultant' | 'staff' | 'manager' | 'admin';
    googleId?: string;
}

const UserSchema: Schema = new Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    full_name: { 
        type: String, 
        required: true,
        trim: true
    },
    phone: { 
        type: String, 
        unique: true, 
        sparse: true,
        trim: true
    },
    date_of_birth: { 
        type: Date 
    },
    gender: { 
        type: String, 
        enum: ['male', 'female', 'other'] 
    },
    registration_date: { 
        type: Date, 
        default: Date.now 
    },
    updated_date: { 
        type: Date, 
        default: Date.now 
    },
    last_login: { 
        type: Date 
    },
    status: { 
        type: Boolean, 
        default: true 
    },
    email_verified: { 
        type: Boolean, 
        default: false 
    },
    role: { 
        type: String, 
        enum: ['guest', 'customer', 'consultant', 'staff', 'manager', 'admin'],
        default: 'customer'
    },
    googleId: { 
        type: String, 
        sparse: true 
    }
}, {
    timestamps: false, // We handle timestamps manually
    collection: 'users'
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });

// Update the updated_date before saving
UserSchema.pre('save', function(next) {
    this.updated_date = new Date();
    next();
});

export default mongoose.model<IUser>('User', UserSchema);