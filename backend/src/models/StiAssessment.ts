import mongoose, { Schema, Document } from 'mongoose';

export interface IStiAssessment extends Document {
    customer_id: mongoose.Types.ObjectId;
    assessment_data: {
        // Thông tin cá nhân
        age: number;
        gender: 'male' | 'female' | 'transgender' | 'other';
        is_pregnant: boolean;
        pregnancy_trimester?: 'first' | 'second' | 'third';

        // Thông tin tình dục
        sexually_active: 'not_active' | 'active_single' | 'active_multiple';
        sexual_orientation: 'heterosexual' | 'homosexual' | 'msm' | 'bisexual' | 'other';
        number_of_partners: 'none' | 'one' | 'multiple';
        new_partner_recently: boolean;
        partner_has_sti: boolean;
        condom_use: 'always' | 'sometimes' | 'rarely' | 'never';

        // Tiền sử y tế
        previous_sti_history: string[];
        hiv_status: 'unknown' | 'negative' | 'positive';
        last_sti_test: 'never' | 'within_3months' | '3_6months' | '6_12months' | 'over_1year';
        has_symptoms: boolean;
        symptoms: string[];

        // Yếu tố nguy cơ
        risk_factors: string[];
        living_area: string;

    };
    recommendation: {
        recommended_package: string;
        risk_level: 'Thấp' | 'Trung bình' | 'Cao';
        reasoning: string[];
    };
    created_at: Date;
    updated_at: Date;
}

const stiAssessmentSchema = new Schema<IStiAssessment>({
    customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    assessment_data: {
        age: { type: Number, required: true },
        gender: { type: String, enum: ['male', 'female', 'transgender', 'other'], required: true },
        is_pregnant: { type: Boolean, default: false },
        pregnancy_trimester: { type: String, enum: ['first', 'second', 'third'] },

        sexually_active: { type: String, enum: ['not_active', 'active_single', 'active_multiple'], required: true },
        sexual_orientation: { type: String, enum: ['heterosexual', 'homosexual', 'msm', 'bisexual', 'other'] },
        number_of_partners: { type: String, enum: ['none', 'one', 'multiple'] },
        new_partner_recently: { type: Boolean, default: false },
        partner_has_sti: { type: Boolean, default: false },
        condom_use: { type: String, enum: ['always', 'sometimes', 'rarely', 'never'] },

        previous_sti_history: [{ type: String }],
        hiv_status: { type: String, enum: ['unknown', 'negative', 'positive'], required: true },
        last_sti_test: { type: String, enum: ['never', 'within_3months', '3_6months', '6_12months', 'over_1year'] },
        has_symptoms: { type: Boolean, default: false },
        symptoms: [{ type: String }],

        risk_factors: [{ type: String }],
        living_area: { type: String },

    },
    recommendation: {
        recommended_package: { type: String, required: true },
        risk_level: { type: String, enum: ['Thấp', 'Trung bình', 'Cao'], required: true },
        reasoning: [{ type: String }],
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const StiAssessment = mongoose.model<IStiAssessment>('StiAssessment', stiAssessmentSchema);
