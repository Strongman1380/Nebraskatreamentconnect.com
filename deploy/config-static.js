// Static deployment configuration
// This version works without Firebase - perfect for static hosting

// SECURITY: API key should be injected at build time or from environment
// Never commit actual API keys to version control
window.GOOGLE_MAPS_API_KEY = window.ENV_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE";

// Disable Firebase for static deployment
window.FIREBASE_CONFIG = null;
window.USE_STATIC_DATA = true;

// Other configuration settings
window.APP_CONFIG = {
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

    // Special value for unlimited radius search
    UNLIMITED_RADIUS: 999,

    // Read tool character limit per line
    MAX_LINE_LENGTH: 2000,

    // Default limit for search results display
    DEFAULT_RESULT_LIMIT: 100,

    // Static deployment settings
    ENABLE_PROVIDER_PORTAL: false, // Disable provider features for static deployment
    ENABLE_STATUS_UPDATES: false,  // Disable real-time updates
    SHOW_DEMO_MESSAGE: true,       // Show message about static demo

    // Development helpers (disabled in static build)
    ALLOW_DEV_MOCK_AUTH: false,

    // Logging configuration
    LOG_LEVEL: 'error' // Options: 'debug', 'info', 'warn', 'error', 'none'
};
