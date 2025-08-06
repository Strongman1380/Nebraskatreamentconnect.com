// DOM elements
const signinForm = document.getElementById('signin-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

// Initialize the page
async function init() {
    try {
        // Initialize Firebase
        await window.firebaseAuth.init();
        
        // Set up event listeners
        signinForm.addEventListener('submit', handleSignin);
        
        // Setup forgot password link
        document.querySelector('.forgot-password a').addEventListener('click', handleForgotPassword);
        
        // Check if user is already logged in
        if (window.firebaseAuth.isAuthenticated()) {
            // Auto-redirect to dashboard if already logged in
            window.location.href = 'provider-dashboard.html';
            return;
        }
        
        // For development: Initialize mock data and offer migration
        await initializeMockDataAndMigration();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize authentication system. Please refresh the page.');
    }
}

// Initialize mock data and offer migration to Firebase
async function initializeMockDataAndMigration() {
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
                email: 'john@example.com',
                password: 'Password123',
                agencyName: 'Example Treatment Center',
                jobTitle: 'Director',
                workPhone: '(402) 555-1234',
                isVerifiedByAdmin: true,
                emailVerifiedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                facilities: [35, 36] // IDs of managed facilities
            },
            {
                id: 2,
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                password: 'Password123',
                agencyName: 'Community Health Services',
                jobTitle: 'Administrator',
                workPhone: '(402) 555-5678',
                isVerifiedByAdmin: true,
                emailVerifiedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                facilities: [18, 19] // IDs of managed facilities
            }
        ];
        
        // Save to localStorage
        localStorage.setItem('mockProviders', JSON.stringify(sampleProviders));
        
        // Show migration option
        showMigrationOption();
    } else if (mockProviders.length > 0) {
        // Show migration option for existing users
        showMigrationOption();
    }
}

// Show migration option to users
function showMigrationOption() {
    const migrationBanner = document.createElement('div');
    migrationBanner.style.cssText = `
        background-color: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 4px;
        padding: 15px;
        margin: 20px 0;
        text-align: center;
    `;
    migrationBanner.innerHTML = `
        <p><strong>Development Mode:</strong> Migrate existing test accounts to Firebase?</p>
        <button onclick="migrateUsers()" style="background: #2196f3; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer;">Migrate Users</button>
        <button onclick="this.parentElement.remove()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Skip</button>
    `;
    
    document.querySelector('.signin-container').insertBefore(migrationBanner, document.querySelector('.signin-form'));
}

// Migrate users to Firebase
async function migrateUsers() {
    try {
        showSuccess('Migrating users to Firebase...');
        await window.firebaseAuth.migrateLocalStorageUsers();
        showSuccess('Migration completed! You can now use Firebase authentication.');
        
        // Remove migration banner
        const banner = document.querySelector('.signin-container > div');
        if (banner) banner.remove();
    } catch (error) {
        console.error('Migration error:', error);
        showError('Migration failed. Please try again or contact support.');
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
    const rememberMe = document.getElementById('remember-me').checked;
    
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
        // Try Firebase authentication first
        const result = await window.firebaseAuth.signIn(email, password);
        
        if (result.success) {
            showSuccess(result.message);
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'provider-dashboard.html';
            }, 1000);
        } else {
            // If Firebase fails, try fallback to localStorage (for development)
            const fallbackResult = await tryLocalStorageFallback(email, password);
            
            if (fallbackResult.success) {
                showSuccess(fallbackResult.message);
                setTimeout(() => {
                    window.location.href = 'provider-dashboard.html';
                }, 1000);
            } else {
                showError(result.error || fallbackResult.error);
            }
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

// Fallback to localStorage authentication (for development)
async function tryLocalStorageFallback(email, password) {
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
    
    const email = prompt('Please enter your email address to reset your password:');
    
    if (!email) {
        return; // User cancelled
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        return;
    }
    
    try {
        // Use Firebase password reset
        const result = await window.firebaseAuth.resetPassword(email);
        
        if (result.success) {
            showSuccess(result.message);
        } else {
            showError(result.error);
        }
    } catch (error) {
        console.error('Password reset error:', error);
        showError('Failed to send password reset email. Please try again.');
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