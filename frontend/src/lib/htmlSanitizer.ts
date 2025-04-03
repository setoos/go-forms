import DOMPurify from 'dompurify';

/**
 * Configuration for HTML sanitization
 */
const sanitizerConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'em', 'strong', 'i', 'b', 'u', 's', 'strike', 'span',
    'a', 'img', 'figure', 'figcaption',
    'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'section', 'article', 'header', 'footer'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title',
    'style', 'class', 'id', 'name', 'width', 'height',
    'align', 'valign', 'colspan', 'rowspan'
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'canvas', 'input', 'form', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  FORCE_HTTPS: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  WHOLE_DOCUMENT: false,
  SANITIZE_DOM: true
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, sanitizerConfig);
}

/**
 * Validates HTML structure
 * @returns Object with isValid flag and any error messages
 */
export function validateHtml(html: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Check for parsing errors
    const parserErrors = doc.querySelectorAll('parsererror');
    if (parserErrors.length > 0) {
      errors.push('HTML parsing error: ' + parserErrors[0].textContent);
      return { isValid: false, errors };
    }
    
    // Check for unclosed tags
    const htmlContent = doc.documentElement.outerHTML;
    if (htmlContent.includes('</parsererror>')) {
      errors.push('HTML contains unclosed tags');
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  } catch (error) {
    errors.push('HTML validation error: ' + (error instanceof Error ? error.message : String(error)));
    return { isValid: false, errors };
  }
}

/**
 * Processes HTML content for template variables
 */
export function processTemplateVariables(html: string, variables: Record<string, string>): string {
  if (!html) return '';
  
  let processedHtml = html;
  
  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    processedHtml = processedHtml.replace(regex, value);
  });
  
  return processedHtml;
}