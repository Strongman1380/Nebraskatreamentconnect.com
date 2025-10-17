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
    
    const normalizedFacilities = window.FacilityUtils
        ? window.FacilityUtils.normalizeFacilityDataset(allStaticFacilities)
        : allStaticFacilities;
    
    // Filter facilities based on current page
    const pageType = getCurrentPageType();
    allFacilities = filterFacilitiesByPageType(normalizedFacilities, pageType);
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
            return facilities.filter(f => 
                f.facilityTypes?.includes('Treatment Center') || 
                f.facilityTypes?.includes('Detox')
            );
        case 'halfway-houses':
            return facilities.filter(f => f.facilityTypes?.includes('Halfway House'));
        case 'outpatient':
            return facilities.filter(f => f.facilityTypes?.includes('Outpatient'));
        case 'detox-info':
            return facilities.filter(f => f.facilityTypes?.includes('Detox'));
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
    const criteria = {
        searchTerm: document.getElementById('search-input')?.value || '',
        radius: document.getElementById('search-radius')?.value || '999',
        ageGroup: document.getElementById('age-group')?.value || '',
        genderServed: document.getElementById('gender-served')?.value || '',
        treatmentType: document.getElementById('treatment-type')?.value || '',
        facilityType: document.getElementById('facility-type')?.value || ''
    };

    filteredFacilities = window.FacilityUtils
        ? window.FacilityUtils.filterFacilities(allFacilities, criteria, userLocation)
        : allFacilities.slice();

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
    
    // Add event delegation for secure button handling
    facilitiesList.removeEventListener('click', handleFacilityActions);
    facilitiesList.addEventListener('click', handleFacilityActions);
    
    // Add staggered animation delays
    setTimeout(() => {
        const cards = facilitiesList.querySelectorAll('.facility-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }, 10);
}

// Secure event handler using event delegation
function handleFacilityActions(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    event.preventDefault();
    
    const action = button.getAttribute('data-action');
    const address = button.getAttribute('data-address');
    const phone = button.getAttribute('data-phone');
    const website = button.getAttribute('data-website');
    
    switch (action) {
        case 'directions':
            if (address) {
                const encodedAddress = encodeURIComponent(address);
                const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            break;
        case 'call':
            if (phone) {
                const cleanPhone = window.SecurityUtils ? window.SecurityUtils.sanitizePhone(phone) : phone;
                if (cleanPhone) {
                    window.location.href = `tel:${cleanPhone}`;
                }
            }
            break;
        case 'website':
            if (website) {
                const cleanURL = window.SecurityUtils ? window.SecurityUtils.sanitizeURL(website) : website;
                if (cleanURL && cleanURL !== 'http://' && cleanURL !== '') {
                    window.open(cleanURL, '_blank', 'noopener,noreferrer');
                }
            }
            break;
    }
}

function createFacilityCard(facility, index = 0) {
    const safeFacility = window.FacilityUtils
        ? window.FacilityUtils.sanitizeFacilityForRender(facility)
        : facility;
    if (!safeFacility) return '';

    const statusClass = getStatusClass(facility.status);
    const treatmentLabel = safeFacility.treatmentTypes && safeFacility.treatmentTypes.length > 1
        ? safeFacility.treatmentTypes.join(', ')
        : safeFacility.primaryTreatmentType;
    
    return `
        <div class="facility-card" data-facility-index="${index}">
            <div class="facility-name">
                ${safeFacility.name}
                <span class="facility-type-badge">${safeFacility.type}</span>
            </div>
            
            <div class="facility-category">${treatmentLabel}</div>
            
            <div class="facility-status ${statusClass}">
                ${safeFacility.status}
            </div>
            
            <div class="facility-info">
                <p><i class="fas fa-map-marker-alt"></i> ${safeFacility.address}</p>
                <p><i class="fas fa-phone"></i> ${safeFacility.phone}</p>
                <p><i class="fas fa-users"></i> ${safeFacility.genderServed} • ${safeFacility.ageGroup}</p>
                ${safeFacility.lastUpdated ? `<p><i class="fas fa-clock"></i> Updated: ${formatDate(safeFacility.lastUpdated)}</p>` : ''}
            </div>
            
            <div class="facility-actions">
                <button data-action="directions" data-address="${safeFacility.dataAttributes?.address || ''}" class="action-btn btn-directions" aria-label="Get directions to ${safeFacility.name}">
                    <i class="fas fa-directions"></i> Directions
                </button>
                <button data-action="call" data-phone="${safeFacility.dataAttributes?.phone || ''}" class="action-btn btn-call" aria-label="Call ${safeFacility.name}">
                    <i class="fas fa-phone"></i> Call
                </button>
                ${safeFacility.website ? `<button data-action="website" data-website="${safeFacility.dataAttributes?.website || ''}" class="action-btn btn-website" aria-label="Visit ${safeFacility.name} website">
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

// Legacy action functions - kept for backwards compatibility but use secure handlers
function getDirections(address) {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

function callFacility(phone) {
    const cleanPhone = window.SecurityUtils ? window.SecurityUtils.sanitizePhone(phone) : phone;
    if (cleanPhone) {
        window.location.href = `tel:${cleanPhone}`;
    }
}

function visitWebsite(website) {
    const cleanURL = window.SecurityUtils ? window.SecurityUtils.sanitizeURL(website) : website;
    if (cleanURL && cleanURL !== 'http://' && cleanURL !== '') {
        window.open(cleanURL, '_blank', 'noopener,noreferrer');
    }
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
    let color = 'gray';
    
    switch (status) {
        case 'Openings Available':
            color = 'green';
            break;
        case 'No Openings':
            color = 'red';
            break;
        case 'Waitlist':
            color = 'orange';
            break;
        case 'Accepting Assessments':
            color = 'blue';
            break;
        case 'Emergency/Crisis Only':
            color = 'purple';
            break;
        default:
            color = 'gray';
            break;
    }
    
    return `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
}

function createInfoWindowContent(facility) {
    const safeFacility = window.FacilityUtils
        ? window.FacilityUtils.sanitizeFacilityForRender(facility)
        : null;
    if (!safeFacility) {
        const fallback = document.createElement('div');
        fallback.textContent = 'Facility details unavailable.';
        return fallback;
    }

    const statusClass = getStatusClass(facility.status);

    const container = document.createElement('div');
    container.className = 'info-window';

    const title = document.createElement('h4');
    title.textContent = safeFacility.name;
    container.appendChild(title);

    const statusRow = document.createElement('p');
    const statusLabel = document.createElement('strong');
    statusLabel.textContent = 'Status:';
    statusRow.appendChild(statusLabel);
    statusRow.append(document.createTextNode(' '));
    const statusValue = document.createElement('span');
    statusValue.className = statusClass;
    statusValue.textContent = safeFacility.status;
    statusRow.appendChild(statusValue);
    container.appendChild(statusRow);

    const addressRow = document.createElement('p');
    const addressLabel = document.createElement('strong');
    addressLabel.textContent = 'Address:';
    addressRow.appendChild(addressLabel);
    addressRow.append(document.createTextNode(` ${safeFacility.address}`));
    container.appendChild(addressRow);

    const phoneRow = document.createElement('p');
    const phoneLabel = document.createElement('strong');
    phoneLabel.textContent = 'Phone:';
    phoneRow.appendChild(phoneLabel);
    phoneRow.append(document.createTextNode(` ${safeFacility.phone}`));
    container.appendChild(phoneRow);

    const typeRow = document.createElement('p');
    const typeLabel = document.createElement('strong');
    typeLabel.textContent = 'Type:';
    typeRow.appendChild(typeLabel);
    const typeLabelValue = safeFacility.facilityTypes && safeFacility.facilityTypes.length > 1
        ? safeFacility.facilityTypes.join(', ')
        : safeFacility.type;
    typeRow.append(document.createTextNode(` ${typeLabelValue}`));
    container.appendChild(typeRow);

    const actions = document.createElement('div');
    actions.className = 'info-actions';

    if (safeFacility.phone) {
        const callBtn = document.createElement('button');
        callBtn.className = 'info-btn';
        callBtn.textContent = 'Call';
        callBtn.addEventListener('click', () => callFacility(safeFacility.phone));
        actions.appendChild(callBtn);
    }

    if (safeFacility.website) {
        const websiteBtn = document.createElement('button');
        websiteBtn.className = 'info-btn';
        websiteBtn.textContent = 'Website';
        websiteBtn.addEventListener('click', () => visitWebsite(safeFacility.website));
        actions.appendChild(websiteBtn);
    }

    container.appendChild(actions);

    return container;
}
