import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
    author_id: mongoose.Types.ObjectId;
    title: string;
    content: string;
    publish_date: Date;
    updated_date: Date;
    status: boolean; // true = published, false = deleted (soft delete)
}

const blogSchema = new Schema<IBlog>({
    author_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    publish_date: { type: Date, default: Date.now },
    updated_date: { type: Date, default: Date.now },
    status: {
        type: Boolean,
        default: true // true = published, false = soft deleted
    }
});

export const Blog = mongoose.model<IBlog>('Blog', blogSchema);