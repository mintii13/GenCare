import mongoose, { Schema, Document } from 'mongoose';

export type TestTypes = 'máu' | 'nước tiểu' | 'dịch ngoáy';

export interface IStiTest extends Document {
    sti_test_name: string;
    sti_test_code: string;
    description: string;
    price: number;
    is_active: boolean;
    category: 'bacterial' | 'viral' | 'parasitic';
    sti_test_type: TestTypes;
    createdBy: mongoose.Types.ObjectId;
}

const stiTestSchema = new Schema<IStiTest>({
    sti_test_name: { type: String, required: true },
    sti_test_code: {type: String, required: true, unique: true,
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
    sti_test_type: {type: String, enum: ['máu', 'nước tiểu', 'dịch ngoáy'], required: true},
    createdBy: { type: Schema.Types.ObjectId, ref: 'Customer', required: true }
}, { timestamps: true }
);

export const StiTest = mongoose.model<IStiTest>('StiTest', stiTestSchema);