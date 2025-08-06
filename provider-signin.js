// DOM elements
const signinForm = document.getElementById('signin-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

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
            // Auto-redirect to dashboard if already logged in
            window.location.href = 'provider-dashboard.html';
            return;
        }
        
        // Initialize mock data for development
        initializeMockData();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize authentication system. Please refresh the page.');
    }
}

// Initialize mock data for development
function initializeMockData() {
    // Check if mock providers exist
    const mockProviders = JSON.parse(localStorage.getItem('mockProviders')) || [];
    
    // If no providers exist, create some sample data for development
    if (mockProviders.length === 0) {
        // Create sample providers
        const sampleProviders = [
            {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'admin@test.com',
                password: 'password123',
                agencyName: 'Example Treatment Center',
                jobTitle: 'Director',
                workPhone: '(402) 555-1234',
                isVerifiedByAdmin: true,
                emailVerifiedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                facilities: [1, 2] // IDs of managed facilities
            },
            {
                id: 2,
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'provider@test.com',
                password: 'password123',
                agencyName: 'Community Health Services',
                jobTitle: 'Administrator',
                workPhone: '(402) 555-5678',
                isVerifiedByAdmin: true,
                emailVerifiedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                facilities: [3, 4] // IDs of managed facilities
            }
        ];
        
        // Save to localStorage
        localStorage.setItem('mockProviders', JSON.stringify(sampleProviders));
        
        // Show test credentials
        showTestCredentials();
    }
}

// Show test credentials to users
function showTestCredentials() {
    const credentialsBanner = document.createElement('div');
    credentialsBanner.style.cssText = `
        background-color: #e8f5e8;
        border: 1px solid #4caf50;
        border-radius: 4px;
        padding: 15px;
        margin: 20px 0;
        text-align: center;
    `;
    credentialsBanner.innerHTML = `
        <p><strong>Test Credentials:</strong></p>
        <p>Email: <code>admin@test.com</code> | Password: <code>password123</code></p>
        <p>Email: <code>provider@test.com</code> | Password: <code>password123</code></p>
        <button onclick="this.parentElement.remove()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Hide</button>
    `;
    
    const container = document.querySelector('.signin-container');
    const form = document.querySelector('.signin-form');
    if (container && form) {
        container.insertBefore(credentialsBanner, form);
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
    try {
        // Get providers from local storage
        const mockProviders = JSON.parse(localStorage.getItem('mockProviders')) || [];
        
        // Find provider with matching credentials
        const provider = mockProviders.find(p => p.email === email && p.password === password);
        
        if (!provider) {
            return {
                success: false,
                error: 'Invalid email or password. Please try again.'
            };
        }
        
        // Check if provider is verified
        if (!provider.isVerifiedByAdmin) {
            return {
                success: false,
                error: 'Your account is pending approval. Please contact the administrator.'
            };
        }
        
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
    
    const email = prompt('Please enter your email address:');
    
    if (!email) {
        return; // User cancelled
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        return;
    }
    
    // For demo purposes, show test credentials
    if (email === 'admin@test.com' || email === 'provider@test.com') {
        showSuccess('Password reset: Your password is "password123"');
    } else {
        showError('Email not found. Use admin@test.com or provider@test.com for testing.');
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