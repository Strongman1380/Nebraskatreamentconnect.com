// Global variables
let allFacilities = [];
let filteredFacilities = [];
let map;
let markers = [];
let userLocation = null;
let mapsLoadPromise = null;

function shouldUseStaticData() {
    if (window.USE_STATIC_DATA === true) return true;
    if (window.USE_STATIC_DATA === false) return false;

    const fallbackEnabled = window.API_CONFIG?.USE_STATIC_FALLBACK === true;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    return fallbackEnabled && isLocalhost;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    const pageType = getCurrentPageType();
    const useStaticData = shouldUseStaticData();

    try {
        // Load facilities from the backend API unless static mode is enabled
        allFacilities = useStaticData
            ? getStaticFacilitiesForPage(pageType)
            : await loadFacilitiesFromAPI(pageType);
        allFacilities = normalizeFacilities(allFacilities);
        filteredFacilities = [...allFacilities];

        initializeEventListeners();
        displayFacilities(filteredFacilities);
        updateResultsCount();
        switchView('list');
        console.log('Loaded', allFacilities.length, 'facilities for page type:', pageType);

    } catch (error) {
        console.error("Error loading facilities from API: ", error);
        // Fallback to static data if API fails
        allFacilities = normalizeFacilities(getStaticFacilitiesForPage(pageType));
        filteredFacilities = [...allFacilities];
        displayFacilities(filteredFacilities);
        updateResultsCount();
    }
});

// Load facilities from the backend API
async function loadFacilitiesFromAPI(pageType) {
    try {
        const baseUrl = window.API_CONFIG?.BASE_URL || '/api';
        let url = `${baseUrl}/facilities`;
        const params = new URLSearchParams();

        // Add page type filter
        if (pageType === 'Treatment Center') {
            params.append('type', 'Treatment Center,Detox');
        } else {
            params.append('type', pageType);
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.facilities || [];
    } catch (error) {
        console.error('Error loading facilities from API:', error);
        throw error;
    }
}

// Get static facilities as fallback
function getStaticFacilitiesForPage(pageType) {
    const combined = window.STATIC_ALL_FACILITIES_DATA || window.ALL_FACILITIES_DATA || [
        ...(window.STATIC_FACILITIES_DATA || []),
        ...(window.STATIC_HALFWAY_HOUSES_DATA || []),
        ...(window.STATIC_OUTPATIENT_DATA || []),
        ...(window.STATIC_DETOX_DATA || [])
    ];

    return filterFacilitiesByPageType(combined, pageType);
}

// Determine what type of facilities to show based on current page
function getCurrentPageType() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    if (filename.includes('halfway-houses')) {
        return 'Halfway House';
    } else if (filename.includes('outpatient')) {
        return 'Outpatient';
    } else if (filename.includes('detox')) {
        return 'Detox';
    } else {
        return 'Treatment Center'; // Home page shows residential and detox centers
    }
}

// Filter facilities based on page type
function filterFacilitiesByPageType(facilities, pageType) {
    if (!Array.isArray(facilities)) return [];

    const matchesFacilityType = (facility, value) => {
        if (!facility) return false;
        if (Array.isArray(facility.facilityTypes)) {
            return facility.facilityTypes.includes(value);
        }
        return facility.type === value;
    };

    switch (pageType) {
        case 'Treatment Center':
            return facilities.filter(f =>
                matchesFacilityType(f, 'Treatment Center') || matchesFacilityType(f, 'Detox')
            );
        case 'Halfway House':
            return facilities.filter(f => matchesFacilityType(f, 'Halfway House'));
        case 'Outpatient':
            return facilities.filter(f => matchesFacilityType(f, 'Outpatient'));
        case 'Detox':
            return facilities.filter(f => matchesFacilityType(f, 'Detox'));
        default:
            return facilities;
    }
}

function initializeEventListeners() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const useLocationBtn = document.getElementById('use-location-btn');
    
    const debounceDelay = window.APP_CONFIG?.SEARCH_DEBOUNCE_DELAY || 300;
    if (searchInput) searchInput.addEventListener('input', debounce(handleSearch, debounceDelay));
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (useLocationBtn) useLocationBtn.addEventListener('click', useCurrentLocation);
    
    const filters = ['search-radius', 'age-group', 'gender-served', 'treatment-type', 'facility-type'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) element.addEventListener('change', handleSearch);
    });
    
    const listViewBtn = document.getElementById('list-view-btn');
    const mapViewBtn = document.getElementById('map-view-btn');

    if (listViewBtn) listViewBtn.addEventListener('click', (e) => { e.preventDefault(); switchView('list'); });
    if (mapViewBtn) mapViewBtn.addEventListener('click', (e) => { e.preventDefault(); switchView('map'); });

    // Facility type tabs - navigate to different pages
    const facilityTabs = document.querySelectorAll('.facility-tab');
    facilityTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const link = tab.getAttribute('data-link');
            if (link) {
                window.location.href = link;
            }
        });
    });

    // Advanced filters toggle
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const advancedFilters = document.getElementById('advanced-filters');
    if (toggleFiltersBtn && advancedFilters) {
        toggleFiltersBtn.addEventListener('click', () => {
            const isHidden = advancedFilters.style.display === 'none';
            advancedFilters.style.display = isHidden ? 'block' : 'none';
            const icon = toggleFiltersBtn.querySelector('.fa-chevron-down');
            if (icon) {
                icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            }
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

function ensureGoogleMapsLoaded() {
    if (window.google && window.google.maps) {
        return Promise.resolve();
    }

    if (mapsLoadPromise) {
        return mapsLoadPromise;
    }

    const apiKey = window.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
        return Promise.reject(new Error('Google Maps API key is not configured'));
    }

    mapsLoadPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[data-google-maps-loader]');
        if (existingScript) {
            existingScript.addEventListener('load', resolve);
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-google-maps-loader', 'true');
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
    });

    return mapsLoadPromise;
}

function normalizeFacilities(facilities) {
    if (!Array.isArray(facilities)) return [];
    if (!facilities.length) return [];
    const alreadyNormalized = facilities[0] && typeof facilities[0].searchIndex === 'string';
    if (alreadyNormalized) {
        return facilities.slice();
    }
    return window.FacilityUtils?.normalizeFacilityDataset
        ? window.FacilityUtils.normalizeFacilityDataset(facilities)
        : facilities.slice();
}

function getSearchCriteria() {
    return {
        searchTerm: document.getElementById('search-input')?.value || '',
        radius: document.getElementById('search-radius')?.value || '999',
        ageGroup: document.getElementById('age-group')?.value || '',
        genderServed: document.getElementById('gender-served')?.value || '',
        treatmentType: document.getElementById('treatment-type')?.value || '',
        facilityType: document.getElementById('facility-type')?.value || ''
    };
}

async function handleSearch() {
    const criteria = getSearchCriteria();
    const useStaticData = shouldUseStaticData();

    if (useStaticData) {
        applyClientFilters(criteria);
        return;
    }

    try {
        // Use API for filtering to handle large datasets efficiently
        const baseUrl = window.API_CONFIG?.BASE_URL || '/api';
        let url = `${baseUrl}/facilities`;
        const params = new URLSearchParams();

        // Add page type filter
        const pageType = getCurrentPageType();
        if (pageType === 'Treatment Center') {
            // For home page, include both Treatment Center and Detox
            params.append('type', 'Treatment Center,Detox');
        } else {
            params.append('type', pageType);
        }

        // Add other filters
        if (criteria.searchTerm) params.append('search', criteria.searchTerm);
        if (criteria.ageGroup) params.append('ageGroup', criteria.ageGroup);
        if (criteria.genderServed) params.append('genderServed', criteria.genderServed);
        if (criteria.treatmentType) params.append('treatmentType', criteria.treatmentType);
        if (criteria.facilityType) params.append('facilityType', criteria.facilityType);
        if (criteria.radius && criteria.radius !== '999') params.append('radius', criteria.radius);
        if (userLocation && criteria.radius && criteria.radius !== '999') {
            params.append('lat', userLocation.lat);
            params.append('lng', userLocation.lng);
        }

        url += '?' + params.toString();

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        filteredFacilities = data.facilities || [];

        displayFacilities(filteredFacilities);
        updateResultsCount();

        if (map && document.getElementById('map-container').style.display !== 'none') {
            updateMapMarkers();
        }
    } catch (error) {
        console.error('Error filtering facilities:', error);
        applyClientFilters(criteria);
    }
}

function applyClientFilters(criteria) {
    if (window.FacilityUtils?.filterFacilities) {
        filteredFacilities = window.FacilityUtils.filterFacilities(
            allFacilities,
            criteria,
            userLocation
        );
    } else {
        const searchTerm = (criteria.searchTerm || '').toLowerCase();
        filteredFacilities = allFacilities.filter(facility => {
            const searchTermMatch = !searchTerm ||
                (facility.name && facility.name.toLowerCase().includes(searchTerm)) ||
                (facility.address && facility.address.toLowerCase().includes(searchTerm)) ||
                (facility.description && facility.description.toLowerCase().includes(searchTerm)) ||
                (facility.type && facility.type.toLowerCase().includes(searchTerm));

            const ageGroupMatch = !criteria.ageGroup ||
                facility.ageGroup === criteria.ageGroup ||
                facility.ageGroup === 'Both';
            const genderServedMatch = !criteria.genderServed ||
                facility.genderServed === criteria.genderServed ||
                facility.genderServed === 'Co-ed';
            const treatmentTypeMatch = !criteria.treatmentType ||
                facility.treatmentType === criteria.treatmentType ||
                facility.treatmentType === 'Both' ||
                (Array.isArray(facility.treatmentTypes) && facility.treatmentTypes.includes(criteria.treatmentType));
            const facilityTypeMatch = !criteria.facilityType ||
                facility.type === criteria.facilityType ||
                (Array.isArray(facility.facilityTypes) && facility.facilityTypes.includes(criteria.facilityType));

            return searchTermMatch && ageGroupMatch && genderServedMatch && treatmentTypeMatch && facilityTypeMatch;
        });
    }

    displayFacilities(filteredFacilities);
    updateResultsCount();

    if (map && document.getElementById('map-container').style.display !== 'none') {
        updateMapMarkers();
    }
}

function displayFacilities(facilities) {
    const facilitiesList = document.getElementById('facilities-list');
    if (!facilitiesList) return;
    
    if (facilities.length === 0) {
        facilitiesList.innerHTML = `<div class="no-results"><h3>No facilities found</h3><p>Try adjusting your search criteria.</p></div>`;
        return;
    }
    
    facilitiesList.innerHTML = facilities.map(facility => createFacilityCard(facility)).join('');
}

function createFacilityCard(facility) {
    const safeFacility = window.FacilityUtils ? window.FacilityUtils.sanitizeFacilityForRender(facility) : facility;
    if (!safeFacility) return '';

    const statusClass = getStatusClass(safeFacility.status);
    
    return `
        <div class="facility-card" data-facility-id="${safeFacility.id}">
            <div class="facility-name">${safeFacility.name}</div>
            <div class="facility-status ${statusClass}">${safeFacility.status}</div>
            <div class="facility-info">
                <p><i class="fas fa-map-marker-alt"></i> ${safeFacility.address}</p>
                <p><i class="fas fa-phone"></i> ${safeFacility.phone}</p>
                <p><i class="fas fa-users"></i> ${safeFacility.genderServed} • ${safeFacility.ageGroup}</p>
                ${safeFacility.lastUpdated ? `<p><i class="fas fa-clock"></i> Updated: ${formatDate(safeFacility.lastUpdated)}</p>` : ''}
            </div>
            <div class="facility-actions">
                <button onclick="getDirections('${safeFacility.address}')" class="action-btn"><i class="fas fa-directions"></i> Directions</button>
                <button onclick="callFacility('${safeFacility.phone}')" class="action-btn"><i class="fas fa-phone"></i> Call</button>
                ${safeFacility.website ? `<button onclick="visitWebsite('${safeFacility.website}')" class="action-btn"><i class="fas fa-globe"></i> Website</button>` : ''}
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    if (!status) return 'status-not-updated';
    const s = status.toLowerCase();
    
    // Check for specific statuses first
    if (s === 'beds available' || s === 'available') return 'status-available';
    if (s === 'no beds available' || s === 'no beds' || s.includes('no opening')) return 'status-unavailable';
    if (s === 'call for availability' || s.includes('contact')) return 'status-call';
    
    // Fallback logic
    if (s.includes('available') && !s.includes('no') && !s.includes('call')) return 'status-available';
    if (s.includes('week')) return 'status-waitlist';
    
    return 'status-not-updated';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function updateResultsCount() {
    const totalResults = document.getElementById('total-results');
    if (totalResults) {
        totalResults.textContent = filteredFacilities.length;
    }
}

// Mock action functions - replace with secure handlers if needed
function getDirections(address) {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
}

function callFacility(phone) {
    window.location.href = `tel:${phone.replace(/\D/g, '')}`;
}

function visitWebsite(website) {
    if (website && !website.startsWith('http')) {
        website = 'http://' + website;
    }
    window.open(website, '_blank');
}

function useCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            // With userLocation set, re-run the search.
            handleSearch();
        }, () => {
            alert('Unable to retrieve your location.');
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

function switchView(view) {
    const listView = document.getElementById('facilities-list');
    const mapContainer = document.getElementById('map-container');
    const listBtn = document.getElementById('list-view-btn');
    const mapBtn = document.getElementById('map-view-btn');

    if (view === 'list') {
        listView.style.display = 'grid';
        mapContainer.style.display = 'none';
        listBtn.classList.add('active');
        mapBtn.classList.remove('active');
    } else { // map view
        listView.style.display = 'none';
        mapContainer.style.display = 'block';
        listBtn.classList.remove('active');
        mapBtn.classList.add('active');
        ensureGoogleMapsLoaded()
            .then(() => initializeMap())
            .catch((error) => console.error(error.message));
    }
}

function initializeMap() {
    if (map) { // If map already initialized, just update markers
        updateMapMarkers();
        return;
    }

    // Check if Google Maps script is loaded
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.error('Google Maps API not loaded.');
        return;
    }

    const mapElement = document.getElementById('google-map');
    const nebraskaCenter = window.APP_CONFIG?.NEBRASKA_CENTER || { lat: 41.4925, lng: -99.9018 };
    const defaultZoom = window.APP_CONFIG?.DEFAULT_MAP_ZOOM || 7;

    map = new google.maps.Map(mapElement, {
        center: nebraskaCenter,
        zoom: defaultZoom
    });

    updateMapMarkers();
}

function updateMapMarkers() {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    const bounds = new google.maps.LatLngBounds();

    filteredFacilities.forEach(facility => {
        if (facility.coordinates && facility.coordinates.lat && facility.coordinates.lng) {
            const marker = new google.maps.Marker({
                position: facility.coordinates,
                map: map,
                title: facility.name
            });

            const infowindow = new google.maps.InfoWindow({
                content: `<b>${facility.name}</b><br>${facility.address}`
            });

            marker.addListener('click', () => {
                infowindow.open(map, marker);
            });

            markers.push(marker);
            bounds.extend(marker.getPosition());
        }
    });

    if (markers.length > 0) {
        map.fitBounds(bounds);
    }
}
