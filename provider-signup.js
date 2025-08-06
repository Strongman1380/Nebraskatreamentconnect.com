// DOM elements
const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');

// Mock database for providers (in a real app, this would be server-side)
let mockProviders = JSON.parse(localStorage.getItem('mockProviders')) || [];

// Initialize the page
async function init() {
    try {
        // Initialize Firebase
        await window.firebaseAuth.init();
        
        // Set up event listeners
        signupForm.addEventListener('submit', handleSignup);
        passwordInput.addEventListener('input', validatePassword);
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        
        // Check if user is already logged in
        if (window.firebaseAuth.isAuthenticated()) {
            // Auto-redirect to dashboard if already logged in
            window.location.href = 'provider-dashboard.html';
            return;
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize authentication system. Please refresh the page.');
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
        // Try Firebase signup
        const result = await window.firebaseAuth.signUp(userData.email, password, userData);
        
        if (result.success) {
            showSuccess(result.message);
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = 'provider-signin.html';
            }, 3000);
        } else {
            // If Firebase fails, try fallback to localStorage (for development)
            const fallbackResult = await tryLocalStorageFallback(userData, password);
            
            if (fallbackResult.success) {
                showSuccess(fallbackResult.message);
                setTimeout(() => {
                    window.location.href = 'provider-signin.html';
                }, 2000);
            } else {
                showError(result.error || fallbackResult.error);
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
    try {
        const provider = {
            id: Date.now(),
            ...userData,
            password: password, // In a real app, this would be hashed
            isVerifiedByAdmin: true, // Auto-approve for demo purposes
            emailVerifiedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            facilities: []
        };
        
        // Check if email already exists
        if (mockProviders.some(p => p.email === provider.email)) {
            return {
                success: false,
                error: 'An account with this email already exists. Please use a different email or sign in.'
            };
        }
        
        // Save provider to mock database
        mockProviders.push(provider);
        localStorage.setItem('mockProviders', JSON.stringify(mockProviders));
        
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