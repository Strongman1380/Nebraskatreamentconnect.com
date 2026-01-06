// Security utilities for Nebraska Treatment Connect
// Provides HTML sanitization and XSS prevention

// HTML sanitization utility using DOMPurify-like approach
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
        .replace(/>/g, '&gt;')
        .replace(/\(/g, '&#40;')
        .replace(/\)/g, '&#41;')
        .replace(/javascript:/gi, 'javascript_unsafe:')
        .replace(/vbscript:/gi, 'vbscript_unsafe:')
        .replace(/data:/gi, 'data_unsafe:');
}

// Validate and sanitize phone numbers
function sanitizePhone(phone) {
    if (typeof phone !== 'string') return '';

    const trimmed = phone.trim();
    if (!trimmed) return '';

    // Strip common extension formats before validation
    const withoutExtension = trimmed.replace(/\s*(?:ext\.?|x)\s*\d+/gi, '').trim();

    // Remove all non-digit characters except parentheses, spaces, hyphens, and plus signs
    const cleaned = withoutExtension.replace(/[^\d\(\)\-\s\+]/g, '');

    // Improved US phone number validation
    // Accepts formats like: (555) 123-4567, 555-123-4567, 5551234567, +1-555-123-4567
    const digitsOnly = cleaned.replace(/\D/g, '');

    // Check if we have 10 or 11 digits (with optional +1 country code)
    if (digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'))) {
        return cleaned.trim();
    }

    return '';
}

// Validate and sanitize URLs with more comprehensive checks
function sanitizeURL(url) {
    if (typeof url !== 'string') return '';

    const trimmed = url.trim();
    if (!trimmed) return '';

    // Check for potentially dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:', 'ftp:'];
    const lower = trimmed.toLowerCase();

    for (const protocol of dangerousProtocols) {
        if (lower.startsWith(protocol)) {
            console.warn('Blocked potentially dangerous URL protocol:', url);
            return '';
        }
    }

    if (lower.startsWith('tel:')) {
        const phone = trimmed.slice(4);
        return sanitizePhone(phone) ? `tel:${sanitizePhone(phone)}` : '';
    }
    if (lower.startsWith('mailto:')) {
        // Improved email validation for mailto: links
        const email = trimmed.slice(7);
        if (validateEmail(email)) {
            return `mailto:${email}`;
        }
        return '';
    }

    // For regular URLs, ensure they start with http or https
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
        normalized = `https://${normalized}`;
    }

    if (/^https?:\/\/$/i.test(normalized)) {
        return '';
    }

    try {
        const urlObj = new URL(normalized);
        // Only allow http and https protocols
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
            return urlObj.toString();
        }
    } catch (e) {
        console.warn('Invalid URL format:', url, e);
        return '';
    }

    return '';
}

// Validate email addresses with improved validation
function validateEmail(email) {
    if (typeof email !== 'string') return false;

    const trimmed = email.trim();
    if (!trimmed) return false;

    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Additional checks for common mistakes
    if (trimmed.length > 254) return false; // RFC 5321 max length
    if (trimmed.startsWith('.') || trimmed.endsWith('.')) return false;
    if (trimmed.includes('..')) return false; // No consecutive dots

    const parts = trimmed.split('@');
    if (parts.length !== 2) return false;
    if (parts[0].length > 64) return false; // RFC 5321 local part max length

    // Additional validation for domain part
    const domain = parts[1];
    if (domain.length > 253) return false; // RFC 1035 max domain length
    if (domain.startsWith('-') || domain.endsWith('-')) return false; // Domain can't start/end with hyphen

    return emailRegex.test(trimmed);
}

// Input validation utility
function validateInput(input, type = 'text', maxLength = 1000) {
    if (typeof input !== 'string') return false;

    // Check length
    if (input.length > maxLength) return false;

    switch (type) {
        case 'email':
            return validateEmail(input);
        case 'phone':
            return sanitizePhone(input) !== '';
        case 'url':
            return sanitizeURL(input) !== '';
        case 'text':
        default:
            // Basic text validation - check for dangerous patterns
            const dangerousPatterns = [
                /<script/i,
                /javascript:/i,
                /vbscript:/i,
                /on\w+\s*=/i  // Event handlers like onclick, onload, etc.
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(input)) {
                    return false;
                }
            }
            return true;
    }
}

// Create safe onclick handlers using event delegation instead of inline handlers
function createSafeEventHandler(type, data) {
    const handlers = {
        'directions': (address) => {
            if (!validateInput(address, 'text', 500)) {
                console.error('Invalid address for directions:', address);
                return;
            }
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
            if (cleanURL && cleanURL !== 'https://' && !cleanURL.includes('https://undefined')) {
                window.open(cleanURL, '_blank', 'noopener,noreferrer');
            }
        }
    };

    return handlers[type] ? () => handlers[type](data) : () => {};
}

// CSRF token generation (for additional security)
function generateCSRFToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// Export functions for use in other scripts
window.SecurityUtils = {
    sanitizeHTML,
    sanitizeAttribute,
    sanitizePhone,
    sanitizeURL,
    validateEmail,
    validateInput,
    createSafeEventHandler,
    generateCSRFToken
};
