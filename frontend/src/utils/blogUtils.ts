/**
 * Extract the first image URL from HTML content
 * @param htmlContent - HTML string content
 * @returns First image URL or null if no image found
 */
export const extractFirstImageFromContent = (htmlContent: string): string | null => {
  try {
    // Create a temporary div to parse HTML safely
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find the first img tag
    const firstImg = tempDiv.querySelector('img');
    
    if (firstImg?.src) {
      // Validate if it's a valid URL
      try {
        new URL(firstImg.src);
        return firstImg.src;
      } catch {
        // If not a valid URL, might be a relative path
        return firstImg.src;
      }
    }
    
    return null;
  } catch (error) {

    return null;
  }
};

/**
 * Remove HTML tags from content and return clean text
 * @param htmlContent - HTML string content
 * @returns Clean text without HTML tags
 */
export const stripHtmlTags = (htmlContent: string): string => {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get text content and clean up
    let cleanText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up extra whitespace and line breaks
    cleanText = cleanText
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n+/g, ' ')  // Replace line breaks with space
      .trim();
    
    return cleanText;
  } catch (error) {
    // Fallback to regex if DOM parsing fails
    return htmlContent
      .replace(/<[^>]*>/g, '')  // Remove HTML tags
      .replace(/\s+/g, ' ')     // Clean up spaces
      .trim();
  }
};

/**
 * Create an excerpt from HTML content
 * @param htmlContent - HTML string content
 * @param maxLength - Maximum length of excerpt (default: 180)
 * @returns Truncated excerpt with consistent length
 */
export const createExcerpt = (htmlContent: string, maxLength: number = 180): string => {
  const cleanText = stripHtmlTags(htmlContent).trim();
  
  if (cleanText.length === 0) {
    return 'Nội dung blog đang được cập nhật...';
  }
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }
  
  // Find last complete sentence within limit
  const truncated = cleanText.substring(0, maxLength);
  
  // Try to find last sentence end
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > maxLength * 0.6) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // Fallback to word boundary
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

/**
 * Estimate reading time based on content length
 * @param htmlContent - HTML string content
 * @param wordsPerMinute - Reading speed (default: 200 words per minute)
 * @returns Estimated reading time in minutes
 */
export const estimateReadingTime = (htmlContent: string, wordsPerMinute: number = 200): string => {
  const cleanText = stripHtmlTags(htmlContent);
  const words = cleanText.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} phút đọc`;
};

/**
 * Format view count for display
 * @param views - Number of views
 * @returns Formatted view count string
 */
export const formatViewCount = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};