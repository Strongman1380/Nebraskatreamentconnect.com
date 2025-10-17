# Security Setup Instructions

## Google Maps API Key Configuration

**IMPORTANT**: The Google Maps API key has been removed from version control for security reasons.

### For Local Development

1. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

2. Get your Google Maps API key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Geocoding API
   - Create an API key under "Credentials"

3. Add your API key to `.env`:
   ```
   GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

4. **NEVER commit the `.env` file to version control**

### For Production Deployment

#### Option 1: Environment Variables (Recommended)
Configure your hosting platform to inject the API key:

**Netlify:**
```bash
# In Netlify dashboard: Site settings > Build & deploy > Environment
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**GitHub Pages / Static Hosting:**
Use GitHub Secrets and Actions to inject at build time.

#### Option 2: Build-Time Injection
Create a build script that replaces the placeholder:

```javascript
// build.js
const fs = require('fs');
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

const config = fs.readFileSync('config-static.js', 'utf8');
const updated = config.replace('YOUR_API_KEY_HERE', apiKey);
fs.writeFileSync('dist/config-static.js', updated);
```

### Secure Your API Key

After creating your API key, restrict it in Google Cloud Console:

1. **Application restrictions**:
   - HTTP referrers (websites)
   - Add your domains: `nebraskatreatmentconnect.com/*`, `localhost/*`

2. **API restrictions**:
   - Restrict key to only:
     - Maps JavaScript API
     - Geocoding API

3. **Set up billing alerts** to detect abuse

4. **Monitor usage** regularly in Google Cloud Console

### Legacy Warning

The previous API key (`AIzaSyDUDTg2qpuIh3Yf0b80T0aViBmP2Dv1x7s`) was exposed in version control and should be:
1. **Rotated immediately** in Google Cloud Console
2. **Deleted** to prevent abuse
3. **Replaced** with a new, restricted key

## Other Security Configurations

### Logging
A new logger utility (`logger.js`) has been created to replace console.log statements:
- Automatically disabled in production (except errors)
- Controlled via `APP_CONFIG.LOG_LEVEL` setting
- Supports debug, info, warn, error levels
- Includes timestamps and context

To use in new code:
```javascript
// Create a logger with context
const log = new Logger('MyModule');
log.debug('Debug message');
log.info('Info message');
log.warn('Warning message');
log.error('Error message');
```

### Developer Credentials
- All hardcoded developer emails have been removed
- Demo/bypass authentication code has been removed
- Use proper environment flags for development features

### Password Security
- Passwords should NEVER be hashed on the frontend
- Implement server-side authentication for production
- Current localStorage-based auth is for demo purposes only

### Next Steps
1. Set up proper backend authentication (Firebase, Auth0, or custom)
2. Implement CSRF protection
3. Add rate limiting
4. Enable Content Security Policy (CSP)
5. Add security headers to hosting configuration
