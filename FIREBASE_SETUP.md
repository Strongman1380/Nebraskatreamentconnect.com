# Firebase Authentication Setup Guide

This guide will walk you through setting up Firebase Authentication for the Nebraska Treatment Connect application.

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Create a project"
   - Enter project name: `nebraska-treatment-connect` (or your preferred name)
   - Choose whether to enable Google Analytics (optional)
   - Click "Create project"

## Step 2: Set Up Authentication

1. **Enable Authentication**
   - In your Firebase project dashboard, click "Authentication" in the left sidebar
   - Click "Get started"

2. **Configure Sign-in Methods**
   - Go to the "Sign-in method" tab
   - Enable "Email/Password" provider:
     - Click on "Email/Password"
     - Toggle "Enable" to ON
     - Click "Save"

3. **Configure Authorized Domains**
   - In the "Sign-in method" tab, scroll down to "Authorized domains"
   - Add your domain(s):
     - `localhost` (for development)
     - Your production domain (e.g., `nebraska-treatment-connect.com`)

## Step 3: Set Up Firestore Database

1. **Create Firestore Database**
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location (choose closest to your users, e.g., `us-central`)
   - Click "Done"

2. **Set Up Security Rules** (Important!)
   - Go to the "Rules" tab in Firestore
   - Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Providers can only read/write their own data
    match /providers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin-only collections (add admin check later)
    match /facilities/{document=**} {
      allow read: if true; // Public read for facility data
      allow write: if false; // Disable writes for now
    }
  }
}
```

## Step 4: Get Firebase Configuration

1. **Add Web App**
   - In your Firebase project dashboard, click the gear icon (⚙️) next to "Project Overview"
   - Click "Project settings"
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Enter app nickname: `Nebraska Treatment Connect Web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration**
   - You'll see a configuration object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

3. **Update Your Config File**
   - Open `config.js` in your project
   - Replace the placeholder values in `window.FIREBASE_CONFIG` with your actual values:

```javascript
window.FIREBASE_CONFIG = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

## Step 5: Test the Setup

1. **Open the Application**
   - Open `provider-signin.html` in your browser
   - You should see a migration banner if you have existing test data

2. **Test Migration** (if you have existing data)
   - Click "Migrate Users" to move test accounts to Firebase
   - Check the browser console for migration status

3. **Test New Account Creation**
   - Go to `provider-signup.html`
   - Create a new account
   - Check your email for verification link
   - Verify your email and try signing in

4. **Test Sign-in**
   - Use the credentials you created
   - You should be redirected to the dashboard

## Step 6: Production Considerations

### Security Rules (Update for Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Providers can only access their own data
    match /providers/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && request.auth.token.email_verified == true;
    }
    
    // Facility data - read-only for authenticated users
    match /facilities/{facilityId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.auth.uid in resource.data.authorizedProviders;
    }
  }
}
```

### Environment Variables
For production, consider using environment variables instead of hardcoding config:

```javascript
// In production, load from environment
window.FIREBASE_CONFIG = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};
```

## Troubleshooting

### Common Issues

1. **"Firebase not initialized" Error**
   - Check that your config.js file has the correct Firebase configuration
   - Ensure Firebase scripts are loaded before your application scripts

2. **"Auth domain not authorized" Error**
   - Add your domain to the Authorized domains list in Firebase Console
   - For local development, make sure `localhost` is in the list

3. **Email Verification Not Working**
   - Check your spam folder
   - Verify that email/password authentication is enabled
   - Check Firebase Console > Authentication > Templates for email settings

4. **Firestore Permission Denied**
   - Check your Firestore security rules
   - Ensure the user is authenticated and email is verified

### Testing Credentials

For development/testing, you can use these sample accounts after migration:
- Email: `john@example.com`
- Password: `Password123`

- Email: `jane@example.com`
- Password: `Password123`

## Next Steps

1. **Set up Admin Panel** - Create admin interface for approving providers
2. **Email Templates** - Customize Firebase email templates
3. **Advanced Security** - Implement role-based access control
4. **Monitoring** - Set up Firebase Analytics and Performance Monitoring
5. **Backup Strategy** - Configure Firestore backups

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Review Firebase Console logs
3. Verify your configuration matches this guide
4. Test with a fresh browser session (clear cache/cookies)

---

**Important Security Note**: Never commit your actual Firebase configuration to version control. Use environment variables or a secure configuration management system in production.