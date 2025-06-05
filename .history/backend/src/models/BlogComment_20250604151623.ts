import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogComment extends Document {
    comment_id: number;
    blog_id: number;
    customer_id?: number;
    content: string;
    comment_date: Date;
    parent_comment_id?: number;
    status: 'pending' | 'approved' | 'rejected';
    is_anonymous: boolean;
}

const blogCommentSchema = new Schema<IBlogComment>({
    comment_id: { type: Number, required: true, unique: true },
    blog_id: { type: Number, required: true },
    customer_id: { type: Number },
    content: { type: String, required: true },
    comment_date: { type: Date, default: Date.now },
    parent_comment_id: { type: Number },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },
    is_anonymous: { type: Boolean, default: false }
});

export const BlogComment = mongoose.model<IBlogComment>('BlogComment', blogCommentSchema);
