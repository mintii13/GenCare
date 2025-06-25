import mongoose, { Document } from 'mongoose';

export interface IMoodData extends Document {
    user_id: mongoose.Types.ObjectId;
    cycle_id: mongoose.Types.ObjectId;
    date: Date;
    mood: string;
    energy: string;
    symptoms: string[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const moodDataSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cycle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenstrualCycle', required: true },
    date: { type: Date, required: true },
    mood: { 
        type: String, 
        required: true,
        enum: ['happy', 'excited', 'calm', 'neutral', 'tired', 'sad', 'angry']
    },
    energy: { 
        type: String, 
        required: true,
        enum: ['high', 'medium', 'low']
    },
    symptoms: [{ 
        type: String,
        enum: [
            'Đau bụng dưới', 'Đau lưng', 'Đau đầu', 'Buồn nôn',
            'Căng thẳng', 'Mụn trứng cá', 'Khó ngủ', 'Thèm ăn',
            'Tâm trạng thay đổi', 'Chóng mặt', 'Mệt mỏi', 'Ợ chua'
        ]
    }],
    notes: { type: String, maxlength: 500 }
}, {
    timestamps: true
});

// Index để tìm kiếm nhanh
moodDataSchema.index({ user_id: 1, date: 1 });
moodDataSchema.index({ cycle_id: 1 });

export const MoodData = mongoose.model<IMoodData>('MoodData', moodDataSchema); 