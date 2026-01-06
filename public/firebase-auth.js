// Firebase Authentication Service
// This file handles all Firebase authentication operations

class FirebaseAuthService {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.initialized = false;
    }

    // Initialize Firebase
    async init() {
        try {
            // Check if Firebase config is available
            if (!window.FIREBASE_CONFIG) {
                throw new Error('Firebase configuration not found. Please check config.js');
            }

            // Initialize Firebase
            firebase.initializeApp(window.FIREBASE_CONFIG);
            this.auth = firebase.auth();
            this.db = firebase.firestore();

            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.handleAuthStateChange(user);
            });

            this.initialized = true;
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw error;
        }
    }

    // Handle authentication state changes
    handleAuthStateChange(user) {
        if (user) {
            // User is signed in
            console.log('User signed in:', user.email);
            this.loadUserProfile(user.uid);
        } else {
            // User is signed out
            console.log('User signed out');
            this.currentUser = null;
            
            // Redirect to sign-in page if on protected pages
            const protectedPages = ['provider-dashboard.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'provider-signin.html';
            }
        }
    }

    // Sign up new user
    async signUp(email, password, userData) {
        try {
            if (!this.initialized) {
                throw new Error('Firebase not initialized');
            }

            // Create user account
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Send email verification
            await user.sendEmailVerification();

            // Save additional user data to Firestore
            await this.db.collection('providers').doc(user.uid).set({
                ...userData,
                email: email,
                uid: user.uid,
                isVerifiedByAdmin: false, // Requires admin approval
                emailVerified: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                facilities: [] // No facilities assigned initially
            });

            return {
                success: true,
                user: user,
                message: 'Account created successfully! Please check your email to verify your account.'
            };
        } catch (error) {
            console.error('Sign up error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Sign in user
    async signIn(email, password) {
        try {
            if (!this.initialized) {
                throw new Error('Firebase not initialized');
            }

            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                await this.signOut();
                return {
                    success: false,
                    error: 'Please verify your email address before signing in. Check your inbox for a verification link.'
                };
            }

            // Load user profile from Firestore
            const userProfile = await this.loadUserProfile(user.uid);
            
            // Check if user is approved by admin
            if (!userProfile.isVerifiedByAdmin) {
                await this.signOut();
                return {
                    success: false,
                    error: 'Your account is pending approval. Please contact the administrator.'
                };
            }

            return {
                success: true,
                user: user,
                profile: userProfile,
                message: 'Sign-in successful!'
            };
        } catch (error) {
            console.error('Sign in error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Sign out user
    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Load user profile from Firestore
    async loadUserProfile(uid) {
        try {
            const doc = await this.db.collection('providers').doc(uid).get();
            if (doc.exists) {
                const profile = doc.data();
                // Store in localStorage for quick access (without sensitive data)
                const sessionData = {
                    uid: uid,
                    email: profile.email,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    agencyName: profile.agencyName,
                    jobTitle: profile.jobTitle,
                    workPhone: profile.workPhone,
                    facilities: profile.facilities || [],
                    isVerifiedByAdmin: profile.isVerifiedByAdmin,
                    emailVerified: this.currentUser?.emailVerified || false
                };
                localStorage.setItem('currentProvider', JSON.stringify(sessionData));
                return profile;
            } else {
                throw new Error('User profile not found');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(uid, updates) {
        try {
            await this.db.collection('providers').doc(uid).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update localStorage
            const currentSession = JSON.parse(localStorage.getItem('currentProvider') || '{}');
            const updatedSession = { ...currentSession, ...updates };
            localStorage.setItem('currentProvider', JSON.stringify(updatedSession));

            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: error.message };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            return {
                success: true,
                message: 'Password reset email sent. Please check your inbox.'
            };
        } catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get user-friendly error messages
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/requires-recent-login': 'Please sign in again to complete this action.'
        };

        return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
    }

    // Migrate existing localStorage users to Firebase (one-time operation)
    async migrateLocalStorageUsers() {
        try {
            const mockProviders = JSON.parse(localStorage.getItem('mockProviders') || '[]');
            
            if (mockProviders.length === 0) {
                console.log('No local users to migrate');
                return;
            }

            console.log(`Migrating ${mockProviders.length} users to Firebase...`);
            
            for (const provider of mockProviders) {
                try {
                    // Create Firebase user
                    const userCredential = await this.auth.createUserWithEmailAndPassword(
                        provider.email, 
                        provider.password
                    );
                    
                    // Save profile to Firestore
                    await this.db.collection('providers').doc(userCredential.user.uid).set({
                        firstName: provider.firstName,
                        lastName: provider.lastName,
                        email: provider.email,
                        agencyName: provider.agencyName,
                        jobTitle: provider.jobTitle,
                        workPhone: provider.workPhone,
                        isVerifiedByAdmin: provider.isVerifiedByAdmin,
                        facilities: provider.facilities || [],
                        migratedFromLocalStorage: true,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    console.log(`Migrated user: ${provider.email}`);
                } catch (error) {
                    console.error(`Failed to migrate user ${provider.email}:`, error);
                }
            }
            
            // Clear localStorage after successful migration
            localStorage.removeItem('mockProviders');
            console.log('Migration completed');
        } catch (error) {
            console.error('Migration error:', error);
        }
    }
}

// Create global instance
window.firebaseAuth = new FirebaseAuthService();