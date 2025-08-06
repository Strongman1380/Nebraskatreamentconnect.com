// Static deployment configuration
// This version works without Firebase - perfect for static hosting

window.GOOGLE_MAPS_API_KEY = "AIzaSyDUDTg2qpuIh3Yf0b80T0aViBmP2Dv1x7s"; // Your existing API key

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
    
    // Static deployment settings
    ENABLE_PROVIDER_PORTAL: false, // Disable provider features for static deployment
    ENABLE_STATUS_UPDATES: false,  // Disable real-time updates
    SHOW_DEMO_MESSAGE: true        // Show message about static demo
};