// DOM elements
const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');

// Mock database for providers (in a real app, this would be server-side)
let mockProviders = [];

function mockAuthEnabled() {
    return !!(window.APP_CONFIG && window.APP_CONFIG.ALLOW_DEV_MOCK_AUTH);
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

function saveMockProviders(providers) {
    mockProviders = providers.slice();
    localStorage.setItem('mockProviders', JSON.stringify(mockProviders));
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

// Initialize the page
async function init() {
    let firebaseReady = false;

    if (window.FIREBASE_CONFIG && window.firebaseAuth?.init) {
        try {
            await window.firebaseAuth.init();
            firebaseReady = true;
        } catch (error) {
            console.warn('Firebase initialization failed, falling back to local demo mode:', error);
        }
    }

    // Set up event listeners regardless of Firebase availability
    signupForm.addEventListener('submit', handleSignup);
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);

    if (mockAuthEnabled()) {
        await loadMockProviders();
    }
    
    if (firebaseReady && window.firebaseAuth.isAuthenticated()) {
        window.location.href = 'provider-dashboard.html';
    }
}

// Handle form submission
async function handleSignup(e) {
    e.preventDefault();
    
    // Reset messages
    hideMessages();
    
    // Get form data
    const formData = new FormData(signupForm);
    const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email').toLowerCase().trim(),
        agencyName: formData.get('agencyName'),
        jobTitle: formData.get('jobTitle') || null,
        workPhone: formData.get('workPhone') || null
    };
    const password = formData.get('password');
    
    // Validate form data
    if (!validateForm({ ...userData, password })) {
        return;
    }
    
    // Disable form during signup
    const submitButton = signupForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Creating Account...';
    
    try {
        let result = { success: false };
        
        if (window.FIREBASE_CONFIG && window.firebaseAuth?.signUp) {
            result = await window.firebaseAuth.signUp(userData.email, password, userData);
        }
        
        if (result.success) {
            showSuccess(result.message);
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = 'provider-signin.html';
            }, 3000);
        } else {
            // If Firebase fails, try fallback to localStorage (for development)
            if (!mockAuthEnabled()) {
                showError('Provider signup is currently unavailable. Please try again later.');
            } else {
                const fallbackResult = await tryLocalStorageFallback(userData, password);
                if (fallbackResult.success) {
                    showSuccess(fallbackResult.message);
                    setTimeout(() => {
                        window.location.href = 'provider-signin.html';
                    }, 2000);
                } else {
                    showError(fallbackResult.error);
                }
            }
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError('An unexpected error occurred. Please try again.');
    } finally {
        // Re-enable form
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Fallback to localStorage signup (for development)
async function tryLocalStorageFallback(userData, password) {
    if (!mockAuthEnabled()) {
        return {
            success: false,
            error: 'Local signup fallback is disabled in this environment.'
        };
    }

    try {
        const providers = await loadMockProviders();
        const normalizedEmail = userData.email;

        if (providers.some(p => p.email === normalizedEmail)) {
            return {
                success: false,
                error: 'An account with this email already exists. Please use a different email or sign in.'
            };
        }

        const passwordHash = await getPasswordHash(password);
        const provider = {
            id: Date.now(),
            ...userData,
            isVerifiedByAdmin: true, // Auto-approve for demo purposes
            emailVerifiedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            facilities: [],
            passwordHash
        };

        const updatedProviders = [...providers, provider];
        saveMockProviders(updatedProviders);
        
        return {
            success: true,
            message: 'Account created successfully! (Using fallback storage) You will be redirected to sign in...'
        };
    } catch (error) {
        console.error('Fallback signup error:', error);
        return {
            success: false,
            error: 'Failed to create account. Please try again.'
        };
    }
}

// Validate form data
function validateForm(provider) {
    // Check required fields
    if (!provider.firstName || !provider.lastName || !provider.email || !provider.agencyName || !provider.password) {
        showError('Please fill in all required fields.');
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(provider.email)) {
        showError('Please enter a valid email address.');
        return false;
    }
    
    // Validate password
    if (!validatePassword()) {
        return false;
    }
    
    // Validate password match
    if (!validatePasswordMatch()) {
        return false;
    }
    
    // All validations passed
    return true;
}

// Validate password complexity
function validatePassword() {
    const password = passwordInput.value;
    
    // Check password length and complexity
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (password && !(hasMinLength && hasUpperCase && hasLowerCase && hasNumber)) {
        passwordInput.setCustomValidity('Password must be at least 8 characters with uppercase, lowercase, and number');
        return false;
    }
    
    passwordInput.setCustomValidity('');
    return true;
}

// Validate password match
function validatePasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordInput.setCustomValidity('Passwords do not match');
        return false;
    }
    
    confirmPasswordInput.setCustomValidity('');
    return true;
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
