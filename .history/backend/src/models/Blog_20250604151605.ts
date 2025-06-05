import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
    blog_id: number;
    author_id: number;
    title: string;
    content: string;
    publish_date: Date;
    updated_date: Date;
    status: 'draft' | 'published' | 'archived';
}

const blogSchema = new Schema<IBlog>({
    blog_id: { type: Number, required: true, unique: true },
    author_id: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    publish_date: { type: Date, default: Date.now },
    updated_date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    }
});

export const Blog = mongoose.model<IBlog>('Blog', blogSchema);