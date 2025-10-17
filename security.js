// Security utilities for Nebraska Treatment Connect
// Provides HTML sanitization and XSS prevention

// HTML sanitization utility
function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    
    // Create a temporary div element to leverage browser's HTML parsing
    const tempDiv = document.createElement('div');
    tempDiv.textContent = str; // This automatically escapes HTML entities
    return tempDiv.innerHTML;
}

// Sanitize attributes for use in HTML attributes
function sanitizeAttribute(str) {
    if (typeof str !== 'string') return '';
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Validate and sanitize phone numbers
function sanitizePhone(phone) {
    if (typeof phone !== 'string') return '';

    // Remove all non-digit characters except parentheses, spaces, hyphens, and plus signs
    const cleaned = phone.replace(/[^\d\(\)\-\s\+]/g, '');

    // Improved US phone number validation
    // Accepts formats like: (555) 123-4567, 555-123-4567, 5551234567, +1-555-123-4567
    const digitsOnly = cleaned.replace(/\D/g, '');

    // Check if we have 10 or 11 digits (with optional +1 country code)
    if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'))) {
        return cleaned.trim();
    }

    return '';
}

// Validate and sanitize URLs
function sanitizeURL(url) {
    if (typeof url !== 'string') return '';
    
    const trimmed = url.trim();
    if (!trimmed) return '';
    
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('tel:')) {
        const phone = trimmed.slice(4);
        return sanitizePhone(phone) ? `tel:${sanitizePhone(phone)}` : '';
    }
    if (lower.startsWith('mailto:')) {
        // Improved email validation for mailto: links
        const email = trimmed.slice(7);
        // RFC 5322 compliant basic email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email) ? `mailto:${email}` : '';
    }
    
    let normalized = trimmed;
    if (!/^[a-zA-Z][\w+.-]*:/.test(normalized)) {
        normalized = `https://${normalized}`;
    }
    
    // Enforce http(s) only
    const allowedProtocols = ['http:', 'https:'];
    
    try {
        const urlObj = new URL(normalized);
        if (allowedProtocols.includes(urlObj.protocol)) {
            return urlObj.toString();
        }
    } catch (e) {
        return '';
    }
    
    return '';
}

// Validate email addresses
function validateEmail(email) {
    if (typeof email !== 'string') return false;

    const trimmed = email.trim();
    if (!trimmed) return false;

    // RFC 5322 compliant basic email validation
    // This pattern matches most valid email addresses while rejecting obviously invalid ones
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Additional checks for common mistakes
    if (trimmed.length > 254) return false; // RFC 5321 max length
    if (trimmed.startsWith('.') || trimmed.endsWith('.')) return false;
    if (trimmed.includes('..')) return false; // No consecutive dots

    const parts = trimmed.split('@');
    if (parts.length !== 2) return false;
    if (parts[0].length > 64) return false; // RFC 5321 local part max length

    return emailRegex.test(trimmed);
}

// Create safe onclick handlers using event delegation instead of inline handlers
function createSafeEventHandler(type, data) {
    const handlers = {
        'directions': (address) => {
            const encodedAddress = encodeURIComponent(sanitizeAttribute(address));
            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        },
        'call': (phone) => {
            const cleanPhone = sanitizePhone(phone);
            if (cleanPhone) {
                window.location.href = `tel:${cleanPhone}`;
            }
        },
        'website': (website) => {
            const cleanURL = sanitizeURL(website);
            if (cleanURL && cleanURL !== 'http://') {
                window.open(cleanURL, '_blank', 'noopener,noreferrer');
            }
        }
    };
    
    return handlers[type] ? () => handlers[type](data) : () => {};
}

// Export functions for use in other scripts
window.SecurityUtils = {
    sanitizeHTML,
    sanitizeAttribute,
    sanitizePhone,
    sanitizeURL,
    validateEmail,
    createSafeEventHandler
};
