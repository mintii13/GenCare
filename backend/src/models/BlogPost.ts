import mongoose, { Document, Schema } from 'mongoose';

export interface IBlogPost extends Document {
  slug: string;
  title: string;
  title_vi: string;
  excerpt?: string;
  content: string;
  
  // Meta
  author_id?: mongoose.Types.ObjectId;
  category: 'sti_prevention' | 'reproductive_health' | 'contraception' | 'pregnancy' | 'general';
  tags?: string[]; // JSON array
  
  // SEO
  meta_description?: string;
  featured_image?: string;
  
  // Status
  status: 'draft' | 'published' | 'archived';
  published_at?: Date;
  view_count: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema = new Schema({
  slug: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  title_vi: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  
  // Meta
  author_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    enum: ['sti_prevention', 'reproductive_health', 'contraception', 'pregnancy', 'general'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // SEO
  meta_description: {
    type: String,
    trim: true,
    maxlength: 160
  },
  featured_image: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  published_at: {
    type: Date
  },
  view_count: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'blog_posts'
});

// Indexes
BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ status: 1 });
BlogPostSchema.index({ category: 1 });
BlogPostSchema.index({ published_at: -1 });
BlogPostSchema.index({ view_count: -1 });
BlogPostSchema.index({ title: 'text', title_vi: 'text', content: 'text' }); // Text search
BlogPostSchema.index({ tags: 1 });

// Virtual for populated author
BlogPostSchema.virtual('author', {
  ref: 'User',
  localField: 'author_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for reading time estimation (words per minute)
BlogPostSchema.virtual('reading_time').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Virtual for formatted published date
BlogPostSchema.virtual('published_date_formatted').get(function() {
  return this.published_at ? this.published_at.toLocaleDateString() : null;
});

// Static method to find published posts
BlogPostSchema.statics.findPublished = function() {
  return this.find({ status: 'published' })
    .populate('author', 'full_name')
    .sort({ published_at: -1 });
};

// Static method to find by category
BlogPostSchema.statics.findByCategory = function(category: string) {
  return this.find({ status: 'published', category })
    .populate('author', 'full_name')
    .sort({ published_at: -1 });
};

// Static method to find by tag
BlogPostSchema.statics.findByTag = function(tag: string) {
  return this.find({ status: 'published', tags: tag })
    .populate('author', 'full_name')
    .sort({ published_at: -1 });
};

// Static method to find popular posts
BlogPostSchema.statics.findPopular = function(limit: number = 10) {
  return this.find({ status: 'published' })
    .populate('author', 'full_name')
    .sort({ view_count: -1 })
    .limit(limit);
};

// Static method to find recent posts
BlogPostSchema.statics.findRecent = function(limit: number = 10) {
  return this.find({ status: 'published' })
    .populate('author', 'full_name')
    .sort({ published_at: -1 })
    .limit(limit);
};

// Static method to search posts
BlogPostSchema.statics.searchPosts = function(query: string) {
  return this.find({
    status: 'published',
    $text: { $search: query }
  }, {
    score: { $meta: 'textScore' }
  })
  .populate('author', 'full_name')
  .sort({ score: { $meta: 'textScore' } });
};

// Method to increment view count
BlogPostSchema.methods.incrementViewCount = function() {
  this.view_count += 1;
  return this.save();
};

// Method to publish post
BlogPostSchema.methods.publish = function() {
  this.status = 'published';
  this.published_at = new Date();
  return this.save();
};

// Method to archive post
BlogPostSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Pre-save middleware to auto-generate slug if not provided
BlogPostSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Ensure virtual fields are serialized
BlogPostSchema.set('toJSON', { virtuals: true });
BlogPostSchema.set('toObject', { virtuals: true });

export default mongoose.model<IBlogPost>('BlogPost', BlogPostSchema); 