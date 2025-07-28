import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

/**
 * Input sanitization middleware for backend API endpoints
 */

interface SanitizeOptions {
  allowHtml?: boolean;
  maxLength?: number;
  fields?: string[];
  skipSanitization?: string[];
}

/**
 * Escape HTML entities to prevent XSS attacks
 */
const escapeHtml = (text: string): string => {
  if (typeof text !== 'string') return text;
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=\/]/g, (match) => htmlEscapes[match]);
};

/**
 * Remove potentially dangerous HTML tags and attributes
 */
const sanitizeHtml = (html: string, allowedTags: string[] = []): string => {
  if (!html || typeof html !== 'string') return html;
  
  // Basic allowed tags for rich text
  const defaultAllowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'];
  const tagsToAllow = allowedTags.length > 0 ? allowedTags : defaultAllowedTags;
  
  // Remove script tags completely
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
  sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: protocols
  sanitized = sanitized.replace(/data:/gi, ''); // Remove data: URLs
  sanitized = sanitized.replace(/vbscript:/gi, ''); // Remove vbscript: protocols
  
  // Only allow specified tags
  const tagRegex = new RegExp(`<(?!\/?(?:${tagsToAllow.join('|')})\s*\/?>)[^>]+>`, 'gi');
  sanitized = sanitized.replace(tagRegex, '');
  
  return sanitized;
};

/**
 * Sanitize text input
 */
const sanitizeText = (input: string, options: { allowHtml?: boolean; maxLength?: number } = {}): string => {
  if (!input || typeof input !== 'string') return input;
  
  const { allowHtml = false, maxLength = 10000 } = options;
  
  let sanitized = input.trim();
  
  // Handle HTML content
  if (allowHtml) {
    sanitized = sanitizeHtml(sanitized);
  } else {
    sanitized = escapeHtml(sanitized);
  }
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Sanitize email input
 */
const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return email;
  
  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();
  
  // Remove any HTML tags
  sanitized = escapeHtml(sanitized);
  
  // Use validator.js for email normalization
  if (validator.isEmail(sanitized)) {
    return validator.normalizeEmail(sanitized) || sanitized;
  }
  
  return sanitized;
};

/**
 * Sanitize phone number input
 */
const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return phone;
  
  // Remove all non-digit characters except + at the beginning
  let sanitized = phone.replace(/[^\d+]/g, '');
  
  // Ensure + is only at the beginning
  if (sanitized.includes('+')) {
    const parts = sanitized.split('+');
    sanitized = '+' + parts.join('');
  }
  
  return sanitized;
};

/**
 * SQL injection prevention for search queries
 */
const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== 'string') return query;
  
  // Remove SQL keywords and dangerous characters
  const dangerousPatterns = [
    /[';]/g,                    // Remove semicolons and single quotes
    /--/g,                      // Remove SQL comments
    /\/\*/g,                    // Remove SQL block comments
    /\*\//g,                    // Remove SQL block comments
    /\bor\b/gi,                 // Remove OR keyword
    /\band\b/gi,                // Remove AND keyword
    /\bunion\b/gi,              // Remove UNION keyword
    /\bselect\b/gi,             // Remove SELECT keyword
    /\binsert\b/gi,             // Remove INSERT keyword
    /\bupdate\b/gi,             // Remove UPDATE keyword
    /\bdelete\b/gi,             // Remove DELETE keyword
    /\bdrop\b/gi,               // Remove DROP keyword
    /\bexec\b/gi,               // Remove EXEC keyword
    /\bexecute\b/gi,            // Remove EXECUTE keyword
  ];
  
  let sanitized = query.trim();
  
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Limit length
  sanitized = sanitized.substring(0, 200);
  
  return sanitized;
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj: any, options: SanitizeOptions = {}): any => {
  if (obj === null || obj === undefined) return obj;
  
  const { allowHtml = false, maxLength = 10000, fields = [], skipSanitization = [] } = options;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip sanitization for specific fields
      if (skipSanitization.includes(key)) {
        sanitized[key] = value;
        continue;
      }
      
      // If fields array is specified, only sanitize those fields
      if (fields.length > 0 && !fields.includes(key)) {
        sanitized[key] = value;
        continue;
      }
      
      if (typeof value === 'string') {
        // Special handling for specific field types
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = sanitizeEmail(value);
        } else if (key.toLowerCase().includes('phone')) {
          sanitized[key] = sanitizePhone(value);
        } else if (key.toLowerCase().includes('search') || key.toLowerCase().includes('query')) {
          sanitized[key] = sanitizeSearchQuery(value);
        } else if (key.toLowerCase().includes('content') || key.toLowerCase().includes('description')) {
          sanitized[key] = sanitizeText(value, { allowHtml: true, maxLength });
        } else {
          sanitized[key] = sanitizeText(value, { allowHtml, maxLength });
        }
      } else {
        sanitized[key] = sanitizeObject(value, options);
      }
    }
    
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (options: SanitizeOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, options);
      }
      next();
    } catch (error) {
      console.error('Input sanitization error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid input data',
        type: 'VALIDATION_ERROR',
        details: 'Request contains invalid or malicious content',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQuery = (options: SanitizeOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, options);
      }
      next();
    } catch (error) {
      console.error('Query sanitization error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        type: 'VALIDATION_ERROR',
        details: 'Query contains invalid or malicious content',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware to sanitize request parameters
 */
export const sanitizeParams = (options: SanitizeOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, options);
      }
      next();
    } catch (error) {
      console.error('Params sanitization error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        type: 'VALIDATION_ERROR',
        details: 'Parameters contain invalid or malicious content',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Comprehensive sanitization middleware
 */
export const sanitizeRequest = (options: SanitizeOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[sanitizeRequest] Original body:', req.body);
      
      // Sanitize body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, options);
        console.log('[sanitizeRequest] Sanitized body:', req.body);
      }
      
      // Sanitize query
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, options);
      }
      
      // Sanitize params
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, options);
      }
      
      next();
    } catch (error) {
      console.error('Request sanitization error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        type: 'VALIDATION_ERROR',
        details: 'Request contains invalid or malicious content',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware specifically for blog content
 */
export const sanitizeBlogContent = sanitizeBody({
  allowHtml: true,
  maxLength: 50000,
  fields: ['title', 'content', 'summary'],
  skipSanitization: ['blog_id', 'author_id', 'publish_date']
});

/**
 * Middleware for user registration/profile data
 */
export const sanitizeUserData = sanitizeBody({
  allowHtml: false,
  maxLength: 1000,
  fields: ['full_name', 'email', 'phone', 'bio', 'address'],
  skipSanitization: ['password', 'date_of_birth', 'role']
});

/**
 * Middleware for search queries
 */
export const sanitizeSearchData = sanitizeQuery({
  allowHtml: false,
  maxLength: 200,
  fields: ['search', 'query', 'term', 'keyword']
});

/**
 * Middleware for STI assessment data
 */
export const sanitizeStiAssessmentData = sanitizeBody({
  allowHtml: false,
  maxLength: 1000,
  fields: ['notes', 'symptoms', 'risk_factors', 'previous_sti_history'],
  skipSanitization: ['age', 'gender', 'sexually_active', 'sexual_orientation', 'is_pregnant']
});

/**
 * Export individual sanitizer functions for custom use
 */
export const sanitizers = {
  escapeHtml,
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeSearchQuery,
  sanitizeObject
}; 