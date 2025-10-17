# Nebraska Treatment Connect - YOUWARE Project Guidelines

## Project Overview
This is a treatment facility locator web application for Nebraska. It helps users find residential treatment centers, halfway houses, outpatient services, and detox centers across the state.

## Architecture
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Data**: Mock data stored in JavaScript arrays (no backend database)
- **Maps Integration**: Google Maps API for geocoding and directions
- **Location Services**: Browser geolocation API for proximity-based searches

## Key Features
- Facility search with multiple filters (age group, gender, treatment type, facility type)
- Location-based search with distance calculation and sorting
- Geographic accessibility - users can search by city/ZIP to find nearby facilities
- Responsive design for mobile and desktop use
- Provider portal system (separate pages for provider authentication)

## File Structure
- `index.html` - Main entry point with search interface
- `scripts.js` - All application logic and mock data
- `styles.css` - Complete styling
- `provider-*` files - Provider portal pages
- `halfway-houses.html`, `outpatient.html`, `detox.html` - Specialized pages for different facility types

## Geographic Features
The application includes:
- Automatic location detection for better directions
- "Use my current location" button for instant proximity search
- City/ZIP code search with geocoding via Google Maps API
- Distance calculation and sorting when searching by location
- Smart detection of location-based searches vs name-based searches
- Adjustable radius filtering (25, 50, 75, 100, 150 miles, or all distances)
- Reverse geocoding to convert coordinates to addresses
- Interactive Google Maps view with facility markers
- Toggle between list and map views
- Color-coded markers based on availability status
- Info windows with facility details and quick actions
- User location marker and radius visualization
- Responsive map design for mobile and desktop

## Google Maps Integration
- API Key: Configured via environment variable (see `.env.example`)
- Used for geocoding search terms and facility addresses
- Provides directions from user's location or searched location
- Calculates distances using Haversine formula
- **Security**: API key should never be committed to version control

## Data Structure
Facilities contain:
- Basic info (name, address, phone, website)
- Classification (age_group, gender_served, treatment_type, facility_type)
- Status tracking (availability_status, status_last_updated)
- Optional coordinates (latitude, longitude) for distance calculations

## Development Notes
- No build process required - static files only
- All facility data is hardcoded in `scripts.js`
- Provider authentication uses localStorage (mock system)
- Cross-browser geolocation support with fallbacks
- Mobile-responsive with touch-friendly interface

## Important Conventions
- Facility data is spread across multiple arrays in scripts.js
- Status updates are handled client-side only (no persistence)
- Geographic searches trigger automatic geocoding
- Distance calculations are shown in miles
- All external links open in new tabs