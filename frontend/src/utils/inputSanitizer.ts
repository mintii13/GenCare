/**
 * Input sanitization utilities to prevent XSS and other injection attacks
 */

export interface SanitizeOptions {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  allowedTags?: string[];
  removeEmptyLines?: boolean;
}

/**
 * Escape HTML entities to prevent XSS attacks
 */
export const escapeHtml = (text: string): string => {
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
export const sanitizeHtml = (html: string, allowedTags: string[] = []): string => {
  if (!html) return '';
  
  // Basic allowed tags for rich text
  const defaultAllowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const tagsToAllow = allowedTags.length > 0 ? allowedTags : defaultAllowedTags;
  
  // Remove script tags completely
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
  sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: protocols
  sanitized = sanitized.replace(/data:/gi, ''); // Remove data: URLs
  
  // Only allow specified tags
  const tagRegex = new RegExp(`<(?!\/?(?:${tagsToAllow.join('|')})\s*\/?>)[^>]+>`, 'gi');
  sanitized = sanitized.replace(tagRegex, '');
  
  return sanitized;
};

/**
 * Sanitize general text input
 */
export const sanitizeText = (input: string, options: SanitizeOptions = {}): string => {
  if (!input || typeof input !== 'string') return '';
  
  const {
    allowHtml = false,
    maxLength,
    trimWhitespace = true,
    allowedTags = [],
    removeEmptyLines = false
  } = options;
  
  let sanitized = input;
  
  // Trim whitespace if required
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }
  
  // Remove empty lines if required
  if (removeEmptyLines) {
    sanitized = sanitized.replace(/^\s*[\r\n]/gm, '');
  }
  
  // Handle HTML content
  if (allowHtml) {
    sanitized = sanitizeHtml(sanitized, allowedTags);
  } else {
    sanitized = escapeHtml(sanitized);
  }
  
  // Truncate if too long and maxLength is specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();
  
  // Remove any HTML tags
  sanitized = escapeHtml(sanitized);
  
  // Basic email pattern validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
};

/**
 * Sanitize phone number input
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters except + at the beginning
  let sanitized = phone.replace(/[^\d+]/g, '');
  
  // Ensure + is only at the beginning
  if (sanitized.includes('+')) {
    const parts = sanitized.split('+');
    sanitized = '+' + parts.join('');
  }
  
  // Remove leading + if followed by non-digits
  if (sanitized.startsWith('+') && sanitized.length === 1) {
    sanitized = '';
  }
  
  return sanitized;
};

/**
 * Sanitize URL input
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  let sanitized = url.trim();
  
  // Remove dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  for (const protocol of dangerousProtocols) {
    if (sanitized.toLowerCase().startsWith(protocol)) {
      throw new Error('Invalid URL protocol');
    }
  }
  
  // Ensure HTTP/HTTPS protocol
  if (!sanitized.match(/^https?:\/\//i)) {
    sanitized = 'https://' + sanitized;
  }
  
  try {
    new URL(sanitized); // Validate URL format
    return sanitized;
  } catch {
    throw new Error('Invalid URL format');
  }
};

/**
 * Sanitize form data object
 */
export const sanitizeFormData = <T extends Record<string, any>>(
  data: T,
  fieldConfigs: Record<keyof T, SanitizeOptions> = {} as Record<keyof T, SanitizeOptions>
): T => {
  const sanitized = { ...data };
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      const config = fieldConfigs[key as keyof T] || {};
      
      // Special handling for specific field types
      if (key.toLowerCase().includes('email')) {
        try {
          sanitized[key as keyof T] = sanitizeEmail(value) as T[keyof T];
        } catch (error) {
          sanitized[key as keyof T] = '' as T[keyof T]; // Clear invalid email
        }
      } else if (key.toLowerCase().includes('phone')) {
        sanitized[key as keyof T] = sanitizePhone(value) as T[keyof T];
      } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
        try {
          sanitized[key as keyof T] = sanitizeUrl(value) as T[keyof T];
        } catch (error) {
          sanitized[key as keyof T] = '' as T[keyof T]; // Clear invalid URL
        }
      } else {
        sanitized[key as keyof T] = sanitizeText(value, config) as T[keyof T];
      }
    } else if (Array.isArray(value)) {
      // Sanitize array of strings
      sanitized[key as keyof T] = value.map((item: any) => 
        typeof item === 'string' ? sanitizeText(item, fieldConfigs[key as keyof T] || {}) : item
      ) as T[keyof T];
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize file names
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';
  
  // Remove path separators and dangerous characters
  let sanitized = fileName.replace(/[\/\\:*?"<>|]/g, '');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 255 - (ext?.length || 0) - 1);
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  // Ensure not empty
  if (!sanitized) {
    sanitized = 'file';
  }
  
  return sanitized;
};

/**
 * Create a debounced sanitizer function
 */
export const createDebouncedSanitizer = (
  sanitizerFn: (input: string) => string,
  delay: number = 300
) => {
  let timeoutId: NodeJS.Timeout;
  
  return (input: string, callback: (sanitized: string) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        const sanitized = sanitizerFn(input);
        callback(sanitized);
      } catch (error) {
        console.error('Sanitization error:', error);
        callback(''); // Return empty string on error
      }
    }, delay);
  };
};

/**
 * SQL injection prevention for search queries
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';
  
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