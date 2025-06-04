import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultant extends Document {
    user_id: mongoose.Types.ObjectId;
    specialization: string;
    qualifications: string;
    experience_years: number;
    consultation_rating?: number;
    total_consultations: number;
}

const consultantSchema = new Schema<IConsultant>({
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    specialization: { type: String, required: true },
    qualifications: { type: String, required: true },
    experience_years: { type: Number, required: true },
    consultation_rating: { type: Number, min: 0, max: 5 },
    total_consultations: { type: Number, default: 0 }
});

export const Consultant = mongoose.model<IConsultant>('Consultant', consultantSchema);