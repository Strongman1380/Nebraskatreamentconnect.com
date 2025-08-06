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
    // Load static data
    allFacilities = window.ALL_FACILITIES_DATA || [];
    filteredFacilities = [...allFacilities];
    
    // Initialize UI
    initializeEventListeners();
    displayFacilities(filteredFacilities);
    updateResultsCount();
    
    // Show demo notice if configured
    if (window.APP_CONFIG && window.APP_CONFIG.SHOW_DEMO_MESSAGE) {
        showDemoNotice();
    }
    
    console.log('Static version loaded with', allFacilities.length, 'facilities');
});

function showDemoNotice() {
    const notice = document.getElementById('demo-notice');
    if (notice) {
        notice.style.display = 'block';
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
        listViewBtn.addEventListener('click', () => switchView('list'));
    }
    
    if (mapViewBtn) {
        mapViewBtn.addEventListener('click', () => switchView('map'));
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
    
    facilitiesList.innerHTML = facilities.map(facility => createFacilityCard(facility)).join('');
}

function createFacilityCard(facility) {
    const statusClass = getStatusClass(facility.status);
    const statusIcon = getStatusIcon(facility.status);
    
    return `
        <div class="facility-card">
            <div class="facility-header">
                <h3>${facility.name}</h3>
                <div class="status-indicator ${statusClass}">
                    <i class="${statusIcon}"></i>
                    <span>${facility.status}</span>
                </div>
            </div>
            <div class="facility-details">
                <p><strong>Type:</strong> ${facility.type}</p>
                <p><strong>Address:</strong> ${facility.address}</p>
                <p><strong>Phone:</strong> ${facility.phone}</p>
                <p><strong>Age Group:</strong> ${facility.ageGroup}</p>
                <p><strong>Gender Served:</strong> ${facility.genderServed}</p>
                <p><strong>Treatment Type:</strong> ${facility.treatmentType}</p>
                ${facility.lastUpdated ? `<p class="last-updated">Status updated: ${formatDate(facility.lastUpdated)}</p>` : ''}
            </div>
            <div class="facility-actions">
                <button onclick="getDirections('${facility.address}')" class="action-btn directions-btn">
                    <i class="fas fa-directions"></i> Directions
                </button>
                <button onclick="callFacility('${facility.phone}')" class="action-btn call-btn">
                    <i class="fas fa-phone"></i> Call
                </button>
                ${facility.website ? `<button onclick="visitWebsite('${facility.website}')" class="action-btn website-btn">
                    <i class="fas fa-globe"></i> Website
                </button>` : ''}
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    switch (status) {
        case 'Openings Available': return 'status-available';
        case 'No Openings': return 'status-full';
        case 'Waitlist': return 'status-waitlist';
        case 'Accepting Assessments': return 'status-assessment';
        case 'Emergency/Crisis Only': return 'status-emergency';
        default: return 'status-unknown';
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
    
    if (view === 'list') {
        listView.style.display = 'block';
        mapContainer.style.display = 'none';
        listBtn.classList.add('active');
        mapBtn.classList.remove('active');
    } else {
        listView.style.display = 'none';
        mapContainer.style.display = 'block';
        listBtn.classList.remove('active');
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