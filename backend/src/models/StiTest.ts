import mongoose, { Schema, Document } from 'mongoose';

//'máu': blood, 'nước tiểu': urine, 'dịch tiết': swab
export type TestTypes = 'blood' | 'urine' | 'swab';

export interface IStiTest extends Document {
    sti_test_name: string;
    sti_test_code: string;
    description: string;
    price: number;
    is_active: boolean;
    // vi khuẩn, vi-rút, kí sinh trùng
    category: 'bacterial' | 'viral' | 'parasitic';
    sti_test_type: TestTypes;
    created_by: mongoose.Types.ObjectId;
}

const stiTestSchema = new Schema<IStiTest>({
    sti_test_name: { type: String, required: true },
    sti_test_code: {
        type: String, required: true, unique: true,
        validate: {
            validator: function (v: string) {
                return /^STI-(VIR|BAC|PAR)-(BLD|URN|SWB)-[A-Z0-9]+$/.test(v);
            },
            message: 'Sti_test_code must be in format: "STI-{category}-{type}-{code}", for example, STI-VIR-BLD-HIV'
        }
    },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    is_active: { type: Boolean, default: true },
    category: { type: String, enum: ['bacterial', 'viral', 'parasitic'], required: true },
    sti_test_type: {type: String, enum: ['blood', 'urine', 'swab'], required: true},
    created_by: { type: Schema.Types.ObjectId, ref: 'Customer', required: true }
}, { timestamps: true }
);

export const StiTest = mongoose.model<IStiTest>('StiTest', stiTestSchema);