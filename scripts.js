// Static version of scripts.js - works without Firebase
// Uses static data instead of real-time database

// Global variables
let allFacilities = [];
let filteredFacilities = [];
let map;
let markers = [];
let userLocation = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load all static data
    const allStaticFacilities = [
        ...(window.STATIC_FACILITIES_DATA || []),
        ...(window.STATIC_HALFWAY_HOUSES_DATA || []),
        ...(window.STATIC_OUTPATIENT_DATA || []),
        ...(window.STATIC_DETOX_DATA || [])
    ];
    
    // Filter facilities based on current page
    const pageType = getCurrentPageType();
    allFacilities = filterFacilitiesByPageType(allStaticFacilities, pageType);
    filteredFacilities = [...allFacilities];
    
    // Initialize UI
    initializeEventListeners();
    displayFacilities(filteredFacilities);
    updateResultsCount();
    
    // Ensure list view is active by default
    setTimeout(() => {
        switchView('list');
    }, 100);
    
    console.log('Loaded', allFacilities.length, 'facilities for page type:', pageType);
});

// Determine what type of facilities to show based on current page
function getCurrentPageType() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    if (filename.includes('halfway-houses')) {
        return 'halfway-houses';
    } else if (filename.includes('outpatient')) {
        return 'outpatient';
    } else if (filename.includes('detox')) {
        return 'detox-info'; // This page is informational only
    } else {
        return 'residential-detox'; // Home page shows residential and detox centers
    }
}

// Filter facilities based on page type
function filterFacilitiesByPageType(facilities, pageType) {
    switch (pageType) {
        case 'residential-detox':
            return facilities.filter(f => f.type === 'Treatment Center' || f.type === 'Detox');
        case 'halfway-houses':
            return facilities.filter(f => f.type === 'Halfway House');
        case 'outpatient':
            return facilities.filter(f => f.type === 'Outpatient');
        case 'detox-info':
            return facilities.filter(f => f.type === 'Detox'); // Show detox facilities on detox info page
        default:
            return facilities;
    }
}



function initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const useLocationBtn = document.getElementById('use-location-btn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', useCurrentLocation);
    }
    
    // Filter functionality
    const filters = ['search-radius', 'age-group', 'gender-served', 'treatment-type', 'facility-type'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', handleSearch);
        }
    });
    
    // View toggle functionality
    const listViewBtn = document.getElementById('list-view-btn');
    const mapViewBtn = document.getElementById('map-view-btn');
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('list');
        });
    }
    
    if (mapViewBtn) {
        mapViewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('map');
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleSearch() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const radius = parseInt(document.getElementById('search-radius')?.value) || 999;
    const ageGroup = document.getElementById('age-group')?.value || '';
    const genderServed = document.getElementById('gender-served')?.value || '';
    const treatmentType = document.getElementById('treatment-type')?.value || '';
    const facilityType = document.getElementById('facility-type')?.value || '';
    
    filteredFacilities = allFacilities.filter(facility => {
        // Text search
        const matchesSearch = !searchTerm || 
            facility.name.toLowerCase().includes(searchTerm) ||
            facility.address.toLowerCase().includes(searchTerm) ||
            facility.phone.includes(searchTerm);
        
        // Filter by age group
        const matchesAge = !ageGroup || 
            facility.ageGroup === ageGroup || 
            facility.ageGroup === 'Both';
        
        // Filter by gender
        const matchesGender = !genderServed || 
            facility.genderServed === genderServed || 
            facility.genderServed === 'Co-ed';
        
        // Filter by treatment type
        const matchesTreatment = !treatmentType || 
            facility.treatmentType === treatmentType || 
            facility.treatmentType === 'Both';
        
        // Filter by facility type
        const matchesFacilityType = !facilityType || 
            facility.type === facilityType;
        
        // Distance filter (if user location is available)
        let matchesDistance = true;
        if (userLocation && radius < 999 && facility.coordinates) {
            const distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                facility.coordinates.lat, facility.coordinates.lng
            );
            matchesDistance = distance <= radius;
        }
        
        return matchesSearch && matchesAge && matchesGender && 
               matchesTreatment && matchesFacilityType && matchesDistance;
    });
    
    displayFacilities(filteredFacilities);
    updateResultsCount();
    
    // Update map if it's visible
    if (map && document.getElementById('map-container').style.display !== 'none') {
        updateMapMarkers();
    }
}

function displayFacilities(facilities) {
    const facilitiesList = document.getElementById('facilities-list');
    if (!facilitiesList) return;
    
    if (facilities.length === 0) {
        facilitiesList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No facilities found</h3>
                <p>Try adjusting your search criteria or expanding your search radius.</p>
            </div>
        `;
        return;
    }
    
    facilitiesList.innerHTML = facilities.map((facility, index) => createFacilityCard(facility, index)).join('');
    
    // Add staggered animation delays
    setTimeout(() => {
        const cards = facilitiesList.querySelectorAll('.facility-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }, 10);
}

function createFacilityCard(facility, index = 0) {
    const statusClass = getStatusClass(facility.status);
    
    return `
        <div class="facility-card">
            <div class="facility-name">
                ${facility.name}
                <span class="facility-type-badge">${facility.type}</span>
            </div>
            
            <div class="facility-category">${facility.treatmentType}</div>
            
            <div class="facility-status ${statusClass}">
                ${facility.status}
            </div>
            
            <div class="facility-info">
                <p><i class="fas fa-map-marker-alt"></i> ${facility.address}</p>
                <p><i class="fas fa-phone"></i> ${facility.phone}</p>
                <p><i class="fas fa-users"></i> ${facility.genderServed} • ${facility.ageGroup}</p>
                ${facility.lastUpdated ? `<p><i class="fas fa-clock"></i> Updated: ${formatDate(facility.lastUpdated)}</p>` : ''}
            </div>
            
            <div class="facility-actions">
                <button onclick="getDirections('${facility.address.replace(/'/g, "\\\'")}')" class="action-btn btn-directions">
                    <i class="fas fa-directions"></i> Directions
                </button>
                <button onclick="callFacility('${facility.phone}')" class="action-btn btn-call">
                    <i class="fas fa-phone"></i> Call
                </button>
                ${facility.website && facility.website !== 'http://' ? `<button onclick="visitWebsite('${facility.website}')" class="action-btn btn-website">
                    <i class="fas fa-globe"></i> Website
                </button>` : ''}
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    switch (status) {
        case 'Openings Available': return 'status-available';
        case 'No Openings': return 'status-unavailable';
        case 'Waitlist': return 'status-waitlist';
        case 'Accepting Assessments': return 'status-available';
        case 'Emergency/Crisis Only': return 'status-available';
        case 'Contact for Availability': return 'status-not-updated';
        default: return 'status-not-updated';
    }
}

function getStatusIcon(status) {
    switch (status) {
        case 'Openings Available': return 'fas fa-check-circle';
        case 'No Openings': return 'fas fa-times-circle';
        case 'Waitlist': return 'fas fa-clock';
        case 'Accepting Assessments': return 'fas fa-clipboard-check';
        case 'Emergency/Crisis Only': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-question-circle';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function updateResultsCount() {
    const totalResults = document.getElementById('total-results');
    if (totalResults) {
        totalResults.textContent = filteredFacilities.length;
    }
}

// Action functions
function getDirections(address) {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(url, '_blank');
}

function callFacility(phone) {
    window.location.href = `tel:${phone}`;
}

function visitWebsite(website) {
    window.open(website, '_blank');
}

// Location functionality
function useCurrentLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser.');
        return;
    }
    
    const button = document.getElementById('use-location-btn');
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Update search input with location
            reverseGeocode(userLocation.lat, userLocation.lng);
            
            // Trigger search with new location
            handleSearch();
            
            button.innerHTML = originalHTML;
            button.disabled = false;
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('Unable to get your location. Please enter your city or ZIP code manually.');
            button.innerHTML = originalHTML;
            button.disabled = false;
        },
        {
            timeout: window.APP_CONFIG?.GEOLOCATION_TIMEOUT || 15000,
            maximumAge: window.APP_CONFIG?.LOCATION_MAX_AGE || 300000
        }
    );
}

function reverseGeocode(lat, lng) {
    // Simple reverse geocoding using Google Maps API
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat: lat, lng: lng };
    
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                // Extract city from the result
                const addressComponents = results[0].address_components;
                const city = addressComponents.find(component => 
                    component.types.includes('locality')
                )?.long_name;
                
                if (city) {
                    searchInput.value = city + ', NE';
                }
            }
        }
    });
}

// Distance calculation
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// View switching
function switchView(view) {
    const listView = document.getElementById('facilities-list');
    const mapContainer = document.getElementById('map-container');
    const listBtn = document.getElementById('list-view-btn');
    const mapBtn = document.getElementById('map-view-btn');
    
    if (!listView || !mapContainer || !listBtn || !mapBtn) {
        return;
    }
    
    // Remove active class from both buttons first
    listBtn.classList.remove('active');
    mapBtn.classList.remove('active');
    
    if (view === 'list') {
        // Show list view, hide map
        listView.style.display = 'grid';
        mapContainer.style.display = 'none';
        listBtn.classList.add('active');
    } else if (view === 'map') {
        // Show map view, hide list
        listView.style.display = 'none';
        mapContainer.style.display = 'block';
        mapBtn.classList.add('active');
        
        // Initialize map if not already done
        if (!map) {
            initializeMap();
        } else {
            updateMapMarkers();
        }
    }
}

// Map functionality
function initializeMap() {
    const mapElement = document.getElementById('google-map');
    if (!mapElement) return;
    
    const center = userLocation || window.APP_CONFIG?.NEBRASKA_CENTER || { lat: 41.5, lng: -99.5 };
    const zoom = userLocation ? 10 : (window.APP_CONFIG?.DEFAULT_MAP_ZOOM || 7);
    
    map = new google.maps.Map(mapElement, {
        center: center,
        zoom: zoom,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    updateMapMarkers();
}

function updateMapMarkers() {
    if (!map) return;
    
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    // Add markers for filtered facilities
    filteredFacilities.forEach(facility => {
        if (facility.coordinates) {
            const marker = new google.maps.Marker({
                position: facility.coordinates,
                map: map,
                title: facility.name,
                icon: getMarkerIcon(facility.status)
            });
            
            const infoWindow = new google.maps.InfoWindow({
                content: createInfoWindowContent(facility)
            });
            
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
            
            markers.push(marker);
        }
    });
    
    // Adjust map bounds to show all markers
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);
        
        // Don't zoom in too much for single markers
        google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
            if (map.getZoom() > 15) {
                map.setZoom(15);
            }
        });
    }
}

function getMarkerIcon(status) {
    const color = getStatusClass(status).includes('available') ? 'green' :
                  getStatusClass(status).includes('full') ? 'red' :
                  getStatusClass(status).includes('waitlist') ? 'orange' :
                  getStatusClass(status).includes('assessment') ? 'blue' :
                  getStatusClass(status).includes('emergency') ? 'purple' : 'gray';
    
    return `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
}

function createInfoWindowContent(facility) {
    return `
        <div class="info-window">
            <h4>${facility.name}</h4>
            <p><strong>Status:</strong> <span class="${getStatusClass(facility.status)}">${facility.status}</span></p>
            <p><strong>Address:</strong> ${facility.address}</p>
            <p><strong>Phone:</strong> ${facility.phone}</p>
            <p><strong>Type:</strong> ${facility.type}</p>
            <div class="info-actions">
                <button onclick="callFacility('${facility.phone}')" class="info-btn">Call</button>
                ${facility.website ? `<button onclick="visitWebsite('${facility.website}')" class="info-btn">Website</button>` : ''}
            </div>
        </div>
    `;
}