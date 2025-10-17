// DOM elements
const signinForm = document.getElementById('signin-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
let mockProviders = [];

// Initialize the page
async function init() {
    try {
        // Set up event listeners
        signinForm.addEventListener('submit', handleSignin);
        
        // Setup forgot password link
        const forgotLink = document.querySelector('.forgot-password a');
        if (forgotLink) {
            forgotLink.addEventListener('click', handleForgotPassword);
        }
        
        // Check if user is already logged in
        const currentProvider = localStorage.getItem('currentProvider');
        if (currentProvider) {
            try {
                const parsedProvider = JSON.parse(currentProvider);
                // Validate stored provider data
                if (parsedProvider && parsedProvider.email && parsedProvider.id) {
                    // Auto-redirect to dashboard if already logged in
                    window.location.href = 'provider-dashboard.html';
                    return;
                } else {
                    // Invalid session data, clear it
                    localStorage.removeItem('currentProvider');
                }
            } catch (error) {
                localStorage.removeItem('currentProvider');
            }
        }
        
        // Initialize mock data for development
        initializeMockData();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize authentication system. Please refresh the page.');
    }
}

function mockAuthEnabled() {
    return !!(window.APP_CONFIG && window.APP_CONFIG.ALLOW_DEV_MOCK_AUTH);
}

// Initialize mock data for development - Only in development environment
function initializeMockData() {
    if (!mockAuthEnabled()) {
        return;
    }

    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' || 
                         window.location.hostname.includes('.local');
    
    if (!isDevelopment) {
        return; // Skip mock data if not in development
    }
    
    // Show development warning
    showDevelopmentWarning();
    showDevelopmentNotice();

    // Clean and load any existing demo providers
    loadMockProviders().catch((error) => {
        console.warn('Unable to load legacy mock providers:', error);
    });
}

// Show development warning
function showDevelopmentWarning() {
    const warningBanner = document.createElement('div');
    warningBanner.style.cssText = `
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 4px;
        padding: 15px;
        margin: 20px 0;
        text-align: center;
    `;
    warningBanner.innerHTML = `
        <p><strong>⚠️ Development Mode</strong></p>
        <p>This is a development environment. Provider portal functionality is limited.</p>
        <button class="dismiss-banner" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Dismiss</button>
    `;

    // Add event listener for dismiss button
    const dismissBtn = warningBanner.querySelector('.dismiss-banner');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => warningBanner.remove());
    }

    const container = document.querySelector('.signin-container');
    const form = document.querySelector('.signin-form');
    if (container && form) {
        container.insertBefore(warningBanner, form);
    }
}

// Show development instructions - only in development
function showDevelopmentNotice() {
    const credentialsBanner = document.createElement('div');
    credentialsBanner.style.cssText = `
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 15px;
        margin: 20px 0;
        text-align: center;
    `;
    credentialsBanner.innerHTML = `
        <p><strong>Local Mock Auth Enabled</strong></p>
        <p>Create demo providers via the <em>Provider Sign Up</em> page. Accounts stay on this browser only.</p>
        <button class="dismiss-banner" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Dismiss</button>
    `;

    // Add event listener for dismiss button
    const dismissBtn = credentialsBanner.querySelector('.dismiss-banner');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => credentialsBanner.remove());
    }

    const container = document.querySelector('.signin-container');
    const form = document.querySelector('.signin-form');
    if (container && form) {
        container.insertBefore(credentialsBanner, form);
    }
}

async function loadMockProviders() {
    const stored = JSON.parse(localStorage.getItem('mockProviders')) || [];
    let updated = false;
    const sanitized = [];

    for (const provider of stored) {
        const entry = { ...provider };

        // Migrate plain passwords to hashed passwords
        if (entry.password && !entry.passwordHash) {
            entry.passwordHash = await getPasswordHash(entry.password);
            delete entry.password;
            updated = true;
        }
        sanitized.push(entry);
    }

    if (updated) {
        localStorage.setItem('mockProviders', JSON.stringify(sanitized));
    }

    mockProviders = sanitized;
    return sanitized;
}

async function getPasswordHash(password) {
    const value = password || '';
    if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback for browsers without crypto.subtle (should be rare)
    // NOTE: This is NOT secure - only use for development/demo
    try {
        // Modern replacement for deprecated unescape()
        return window.btoa(encodeURIComponent(value).replace(/%([0-9A-F]{2})/g,
            (match, p1) => String.fromCharCode(parseInt(p1, 16))
        ));
    } catch (error) {
        console.error('Password hashing failed:', error);
        return value;
    }
}

// Handle form submission
async function handleSignin(e) {
    e.preventDefault();
    
    // Reset messages
    hideMessages();
    
    // Get form data
    const email = document.getElementById('email').value.toLowerCase().trim();
    const password = document.getElementById('password').value;
    
    // Validate required fields
    if (!email || !password) {
        showError('Please enter both email and password.');
        return;
    }
    
    // Disable form during sign-in
    const submitButton = signinForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';
    
    try {
        // Use localStorage authentication
        const result = await tryLocalStorageAuth(email, password);
        
        if (result.success) {
            showSuccess(result.message);
            setTimeout(() => {
                window.location.href = 'provider-dashboard.html';
            }, 1000);
        } else {
            showError(result.error);
        }
    } catch (error) {
        console.error('Sign-in error:', error);
        showError('An unexpected error occurred. Please try again.');
    } finally {
        // Re-enable form
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// localStorage authentication
async function tryLocalStorageAuth(email, password) {
    if (!mockAuthEnabled()) {
        return {
            success: false,
            error: 'Provider sign-in is currently disabled. Please try again later.'
        };
    }

    try {
        const providers = await loadMockProviders();
        const passwordHash = await getPasswordHash(password);
        
        const provider = providers.find(p => p.email === email && p.passwordHash === passwordHash);
        
        if (!provider) {
            return {
                success: false,
                error: 'Invalid email or password. Please try again.'
            };
        }

        // NOTE: In production, implement proper admin verification
        // For now, mock auth allows sign-in without server-side verification

        // Create a session (store provider info without sensitive data)
        const providerSession = {
            id: provider.id,
            firstName: provider.firstName,
            lastName: provider.lastName,
            email: provider.email,
            agencyName: provider.agencyName,
            jobTitle: provider.jobTitle,
            workPhone: provider.workPhone,
            facilities: provider.facilities,
            isVerifiedByAdmin: provider.isVerifiedByAdmin,
            emailVerifiedAt: provider.emailVerifiedAt,
            fallbackAuth: true // Mark as fallback authentication
        };
        
        // Store in localStorage
        localStorage.setItem('currentProvider', JSON.stringify(providerSession));
        
        return {
            success: true,
            message: 'Sign-in successful! (Using fallback authentication)'
        };
    } catch (error) {
        console.error('Fallback authentication error:', error);
        return {
            success: false,
            error: 'Authentication failed. Please try again.'
        };
    }
}

// Handle forgot password functionality
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const emailInput = prompt('Please enter your email address:');
    
    if (!emailInput) {
        return; // User cancelled
    }

    // Validate email format using improved validation
    if (!window.SecurityUtils || !window.SecurityUtils.validateEmail(emailInput)) {
        showError('Please enter a valid email address.');
        return;
    }

    if (!mockAuthEnabled()) {
        showSuccess('If an account exists, you will receive password reset instructions shortly.');
        return;
    }

    try {
        const providers = await loadMockProviders();
        const normalizedEmail = emailInput.trim().toLowerCase();
        const exists = providers.some(provider => provider.email === normalizedEmail);

        if (!exists) {
            console.info('Password reset requested for non-existent account:', normalizedEmail);
        }

        showSuccess('If an account exists, you will receive password reset instructions shortly.');
    } catch (error) {
        console.error('Password reset lookup failed:', error);
        showError('Unable to process password reset at this time. Please try again later.');
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Hide messages
function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
