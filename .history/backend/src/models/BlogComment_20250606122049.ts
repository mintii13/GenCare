import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogComment extends Document {
    blog_id: mongoose.Types.ObjectId;
    customer_id?: mongoose.Types.ObjectId;
    content: string;
    comment_date: Date;
    parent_comment_id?: mongoose.Types.ObjectId;
    status: boolean; // true = active, false = deleted (soft delete)
    is_anonymous: boolean;
}

const blogCommentSchema = new Schema<IBlogComment>({
    blog_id: { type: Schema.Types.ObjectId, required: true, ref: 'Blog' },
    customer_id: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    comment_date: { type: Date, default: Date.now },
    parent_comment_id: { type: Schema.Types.ObjectId, ref: 'BlogComment' },
    status: {
        type: Boolean,
        default: true
    },
    is_anonymous: { type: Boolean, default: false }
});

export const BlogComment = mongoose.model<IBlogComment>('BlogComment', blogCommentSchema);