// Static deployment configuration
// This version works without Firebase - perfect for static hosting

// Google Maps API Key - Use environment variable or server-side injection in production
window.GOOGLE_MAPS_API_KEY = window.ENV_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE"; 

// For production: Implement domain restrictions on the API key
// and use server-side proxy or environment variable injection

// Disable Firebase for static deployment
window.FIREBASE_CONFIG = null;
window.USE_STATIC_DATA = true;

// Environment detection
const isProduction = window.location.hostname === 'nebraskatreatmentconnect.com' ||
                    window.location.hostname.includes('netlify.app') ||
                    window.location.hostname.includes('github.io') ||
                    window.location.hostname.includes('vercel.app');

// Other configuration settings
window.APP_CONFIG = {
    // Environment configuration
    ENVIRONMENT: isProduction ? 'production' : 'development',
    
    // Default search radius in miles
    DEFAULT_SEARCH_RADIUS: 75,
    
    // Maximum number of facilities to show on map
    MAX_MAP_MARKERS: 100,
    
    // Debounce delay for search input (milliseconds)
    SEARCH_DEBOUNCE_DELAY: 300,
    
    // Geolocation timeout (milliseconds)
    GEOLOCATION_TIMEOUT: 15000,
    
    // Maximum age for cached location (milliseconds)
    LOCATION_MAX_AGE: 300000, // 5 minutes
    
    // Nebraska center coordinates for map initialization
    NEBRASKA_CENTER: {
        lat: 41.5,
        lng: -99.5
    },
    
    // Default map zoom level
    DEFAULT_MAP_ZOOM: 7,
    
    // Static deployment settings
    ENABLE_PROVIDER_PORTAL: false, // Disable provider features for static deployment
    ENABLE_STATUS_UPDATES: false,  // Disable real-time updates
    SHOW_DEMO_MESSAGE: !isProduction,       // Show message about static demo only in development

    // Development helpers (never enabled in production)
    ALLOW_DEV_MOCK_AUTH: !isProduction
};
