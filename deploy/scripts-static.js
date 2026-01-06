// Static version of scripts.js - works without Firebase
// Uses static data instead of real-time database

// Global variables
let allFacilities = [];
let filteredFacilities = [];
let map;
let markers = [];
let userLocation = null;
const mapsDisabledAttr = typeof document !== 'undefined' && document.body?.dataset?.mapsDisabled === 'true';
const mapsConfigured = !mapsDisabledAttr && Boolean(window.GOOGLE_MAPS_API_KEY && window.GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE');
let mapsLoadPromise = null;
let statewideFacilities = [];
const locationCache = new Map();
let cityCoordinateIndex = new Map();
let zipCoordinateIndex = new Map();
let locationSource = null;
let currentLocationQuery = null;
let locationLookupToken = 0;
let miniMap;
let miniMapMarker;
const RECENT_SEARCHES_KEY = 'ntc_recent_searches';
let recentSearches = [];
const MAX_RECENT_SEARCHES = 5;
let lastMiniMapFacilityKey = null;
const NEBRASKA_CITY_HINTS = new Set([
    'alliance',
    'aurora',
    'beatrice',
    'blair',
    'broken bow',
    'chadron',
    'columbus',
    'cozad',
    'fairbury',
    'fremont',
    'gering',
    'gretna',
    'grand island',
    'hastings',
    'holdrege',
    'kearney',
    'la vista',
    'lexington',
    'lincoln',
    'mccook',
    'neb city',
    'nebraska city',
    'norfolk',
    'north platte',
    'ogallala',
    'o neill',
    'omaha',
    'papillion',
    'plattsmouth',
    'ralston',
    'schuyler',
    'scottsbluff',
    'seward',
    'sidney',
    'south sioux city',
    'valentine',
    'wahoo',
    'wayne',
    'york'
]);

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    const pageType = getCurrentPageType();

    // Start with the dataset that best matches the current page
    const primaryDataset = getDatasetForPage(pageType);
    const normalizedPrimary = normalizeIfNeeded(primaryDataset);

    allFacilities = normalizedPrimary;

    // Fallback: if the primary dataset was empty, derive it from the master list
    if (!allFacilities.length) {
        const fallbackCombined = normalizeIfNeeded([
            ...(window.STATIC_FACILITIES_DATA || []),
            ...(window.STATIC_HALFWAY_HOUSES_DATA || []),
            ...(window.STATIC_OUTPATIENT_DATA || []),
            ...(window.STATIC_DETOX_DATA || [])
        ]);
        allFacilities = filterFacilitiesByPageType(fallbackCombined, pageType);
    }

    filteredFacilities = [...allFacilities];
    statewideFacilities = Array.isArray(window.STATIC_ALL_FACILITIES_DATA) && window.STATIC_ALL_FACILITIES_DATA.length
        ? window.STATIC_ALL_FACILITIES_DATA
        : normalizeIfNeeded([
            ...(window.STATIC_FACILITIES_DATA || []),
            ...(window.STATIC_HALFWAY_HOUSES_DATA || []),
            ...(window.STATIC_OUTPATIENT_DATA || []),
            ...(window.STATIC_DETOX_DATA || [])
        ]);
    buildLocationLookups(statewideFacilities);
    if (!mapsConfigured) {
        const miniPreview = document.getElementById('mini-map-preview');
        if (miniPreview) {
            miniPreview.style.display = 'none';
        }
    }
    recentSearches = loadRecentSearches();
    renderRecentSearches();
    setupCategoryChips();
    setupFilterSummaryBar();
    setupClearFiltersButton();
    setupDrawerCloseButton();
    if (window.APP_CONFIG?.SHOW_DEMO_MESSAGE) {
        const demoNotice = document.getElementById('demo-notice');
        if (demoNotice) {
            demoNotice.style.display = 'block';
        }
    }
    
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

function getDatasetForPage(pageType) {
    switch (pageType) {
        case 'halfway-houses':
            return window.STATIC_HALFWAY_HOUSES_DATA || [];
        case 'outpatient':
            return window.STATIC_OUTPATIENT_DATA || [];
        case 'detox-info':
            // Detox page shows detox facilities plus residential options if available
            return [
                ...(window.STATIC_DETOX_DATA || []),
                ...(window.STATIC_FACILITIES_DATA || [])
            ];
        case 'residential-detox':
        default:
            return [
                ...(window.STATIC_FACILITIES_DATA || []),
                ...(window.STATIC_DETOX_DATA || [])
            ];
    }
}

function normalizeIfNeeded(dataset) {
    if (!dataset) return [];
    const array = Array.isArray(dataset) ? dataset : [dataset];
    if (!array.length) return [];
    const alreadyNormalized = array[0] && typeof array[0].searchIndex === 'string';
    console.log('normalizeIfNeeded:', {
        datasetLength: array.length,
        alreadyNormalized,
        hasFacilityUtils: !!window.FacilityUtils
    });
    if (alreadyNormalized) {
        return array.slice();
    }
    return window.FacilityUtils
        ? window.FacilityUtils.normalizeFacilityDataset(array)
        : array;
}

function ensureGoogleMapsLoaded() {
    if (!mapsConfigured) {
        return Promise.reject(new Error('Google Maps API key is not configured'));
    }

    if (window.google && window.google.maps && window.google.maps.Geocoder) {
        return Promise.resolve();
    }

    if (mapsLoadPromise) {
        return mapsLoadPromise;
    }

    mapsLoadPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector('script[data-google-maps-loader]');
        if (existingScript) {
            existingScript.addEventListener('load', () => {
                if (window.google && window.google.maps) {
                    resolve();
                } else {
                    reject(new Error('Google Maps script loaded but API is unavailable'));
                }
            });
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(window.GOOGLE_MAPS_API_KEY)}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-google-maps-loader', 'true');
        script.onload = () => {
            if (window.google && window.google.maps) {
                resolve();
            } else {
                reject(new Error('Google Maps API failed to initialize'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
    });

    return mapsLoadPromise;
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
    
    const recentSearchesContainer = document.getElementById('recent-searches');
    if (recentSearchesContainer) {
        recentSearchesContainer.addEventListener('click', handleRecentSearchClick);
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
        if (!mapsConfigured) {
            mapViewBtn.setAttribute('disabled', 'true');
            mapViewBtn.title = 'Map view disabled: Google Maps API key not configured.';
        } else {
            mapViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                switchView('map');
            });
        }
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

function handleSearch(eventOrOptions) {
    if (eventOrOptions && typeof eventOrOptions.preventDefault === 'function') {
        eventOrOptions.preventDefault();
    }

    const options = eventOrOptions && typeof eventOrOptions.preventDefault === 'function'
        ? {}
        : (eventOrOptions || {});

    const criteria = getSearchCriteria();

    const searchTerm = criteria.searchTerm.trim();
    const wantsLocationLookup = !options.skipLocationLookup && shouldAttemptLocationLookup(searchTerm);

    if (locationSource === 'search' && !wantsLocationLookup && !searchTerm && !options.preserveLocationFromButton) {
        if (locationSource === 'search' && !searchTerm && !options.preserveLocationFromButton) {
            locationLookupToken += 1;
            setLocationLoadingState(false);
        }
        userLocation = null;
        locationSource = null;
        currentLocationQuery = null;
    }

    if (wantsLocationLookup) {
        performSearchWithLocationLookup(searchTerm);
        return;
    }

    executeFiltering(criteria, { useStatewideDataset: Boolean(options.useStatewideDataset) });
}

function executeFiltering(criteria, { useStatewideDataset = false } = {}) {
    const unlimitedRadiusValue = String(window.APP_CONFIG?.UNLIMITED_RADIUS || 999);
    const statewideAvailable = Array.isArray(statewideFacilities) && statewideFacilities.length > 0;

    const needsStatewideDataset = useStatewideDataset ||
        Boolean(userLocation) ||
        (criteria.radius && criteria.radius !== unlimitedRadiusValue) ||
        criteria.facilityType === 'Outpatient' ||
        criteria.facilityType === 'Halfway House';

    let sourceFacilities = allFacilities;
    if (needsStatewideDataset && statewideAvailable) {
        sourceFacilities = statewideFacilities;
    } else if (needsStatewideDataset) {
        const combined = normalizeIfNeeded([
            ...(window.STATIC_FACILITIES_DATA || []),
            ...(window.STATIC_HALFWAY_HOUSES_DATA || []),
            ...(window.STATIC_OUTPATIENT_DATA || []),
            ...(window.STATIC_DETOX_DATA || [])
        ]);
        sourceFacilities = combined.length ? combined : allFacilities;
    }

    filteredFacilities = window.FacilityUtils
        ? window.FacilityUtils.filterFacilities(sourceFacilities, criteria, userLocation)
        : sourceFacilities.slice();

    if (filteredFacilities.length === 0 && criteria.radius !== unlimitedRadiusValue && userLocation) {
        const broadened = { ...criteria, radius: unlimitedRadiusValue };
        filteredFacilities = window.FacilityUtils
            ? window.FacilityUtils.filterFacilities(sourceFacilities, broadened, userLocation)
            : sourceFacilities.slice();
        const radiusEl = document.getElementById('search-radius');
        if (radiusEl) radiusEl.value = unlimitedRadiusValue;
        criteria.radius = unlimitedRadiusValue;
    }

    displayFacilities(filteredFacilities);
    updateResultsCount();
    updateFilterSummary(criteria);
    const trimmedSearch = (criteria.searchTerm || '').trim();
    if (trimmedSearch) {
        rememberRecentSearch(trimmedSearch);
    }
    
    if (map && document.getElementById('map-container').style.display !== 'none') {
        updateMapMarkers();
    }
}

function performSearchWithLocationLookup(searchTerm) {
    const normalizedQuery = normalizeSearchLocationTerm(searchTerm);
    if (!normalizedQuery) {
        executeFiltering(getSearchCriteria(), { useStatewideDataset: true });
        return;
    }

    const cachedLocation = locationCache.get(normalizedQuery);
    if (cachedLocation) {
        userLocation = cachedLocation;
        locationSource = 'search';
        currentLocationQuery = searchTerm.trim();
        ensureRadiusForLocationSearch();
        executeFiltering(getSearchCriteria(), { useStatewideDataset: true });
        return;
    }

    const lookupId = ++locationLookupToken;
    setLocationLoadingState(true);

    resolveLocationForQuery(searchTerm)
        .then(location => {
            if (lookupId !== locationLookupToken) {
                return;
            }
            if (location) {
                userLocation = location;
                locationSource = 'search';
                currentLocationQuery = searchTerm.trim();
                locationCache.set(normalizedQuery, location);
                ensureRadiusForLocationSearch();
            } else if (locationSource === 'search') {
                userLocation = null;
                currentLocationQuery = null;
            }
        })
        .catch(error => {
            if (lookupId !== locationLookupToken) {
                return;
            }
            console.warn('Location lookup failed:', error);
            showLocationError('Unable to determine that location. Showing statewide results instead.');
            if (locationSource === 'search') {
                userLocation = null;
                currentLocationQuery = null;
            }
        })
        .finally(() => {
            if (lookupId !== locationLookupToken) {
                return;
            }
            setLocationLoadingState(false);
            executeFiltering(getSearchCriteria(), { useStatewideDataset: true });
        });
}

function ensureRadiusForLocationSearch() {
    const radiusEl = document.getElementById('search-radius');
    if (!radiusEl) return;

    const unlimitedValue = String(window.APP_CONFIG?.UNLIMITED_RADIUS || 999);
    if (radiusEl.value === unlimitedValue) {
        const defaultRadius = String(window.APP_CONFIG?.DEFAULT_SEARCH_RADIUS || 75);
        radiusEl.value = defaultRadius;
    }
}

function setLocationLoadingState(isLoading) {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    if (isLoading) {
        searchInput.setAttribute('aria-busy', 'true');
        searchInput.classList.add('location-loading');
    } else {
        searchInput.removeAttribute('aria-busy');
        searchInput.classList.remove('location-loading');
    }
}

function shouldAttemptLocationLookup(searchTerm = '') {
    const trimmed = searchTerm.trim();
    if (!trimmed) return false;

    if (/^\d{5}$/.test(trimmed)) {
        return true;
    }

    const lowered = trimmed.toLowerCase();
    for (const city of NEBRASKA_CITY_HINTS) {
        if (lowered.includes(city)) {
            return true;
        }
    }

    if (trimmed.includes(',')) {
        return true;
    }

    if (/\bne\b/i.test(trimmed) || /\bnebraska\b/i.test(trimmed)) {
        return true;
    }

    const normalized = normalizeSearchLocationTerm(trimmed);
    if (!normalized) return false;

    if (cityCoordinateIndex.has(normalized)) {
        return true;
    }

    const zipInText = extractZipFromText(trimmed);
    if (zipInText) {
        return true;
    }

    return false;
}

function normalizeLocationKey(value) {
    const baseValue = typeof value === 'string' && value.normalize ? value.normalize('NFKD') : (value || '');
    return baseValue
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function normalizeSearchLocationTerm(value) {
    const normalized = normalizeLocationKey(value);
    if (!normalized) return '';
    const withoutState = normalized.replace(/\bne(braska)?\b/g, '').trim();
    return withoutState || normalized;
}

function resolveLocationForQuery(searchTerm) {
    const trimmed = searchTerm.trim();
    return new Promise((resolve, reject) => {
        if (!trimmed) {
            reject(new Error('Empty search term'));
            return;
        }

        const zipOnly = /^\d{5}$/.test(trimmed) ? trimmed : extractZipFromText(trimmed);
        if (zipOnly && zipCoordinateIndex.has(zipOnly)) {
            resolve(getAverageCoordinate(zipCoordinateIndex.get(zipOnly)));
            return;
        }

        const normalized = normalizeSearchLocationTerm(trimmed);
        if (normalized && cityCoordinateIndex.has(normalized)) {
            resolve(getAverageCoordinate(cityCoordinateIndex.get(normalized)));
            return;
        }

        if (!mapsConfigured) {
            reject(new Error('Google Maps API key is not configured for geocoding.'));
            return;
        }

        ensureGoogleMapsLoaded()
            .then(() => {
                const geocoder = new google.maps.Geocoder();
                const request = {
                    address: /\bne(braska)?\b/i.test(trimmed) ? trimmed : `${trimmed}, Nebraska`,
                    componentRestrictions: { country: 'US' }
                };

                geocoder.geocode(request, (results, status) => {
                    if (status === 'OK' && Array.isArray(results) && results.length > 0) {
                        const nebraskaResult = results.find(result =>
                            result.address_components.some(component =>
                                component.types.includes('administrative_area_level_1') &&
                                component.short_name === 'NE'
                            )
                        ) || results[0];

                        if (nebraskaResult?.geometry?.location) {
                            resolve({
                                lat: nebraskaResult.geometry.location.lat(),
                                lng: nebraskaResult.geometry.location.lng()
                            });
                        } else {
                            reject(new Error('Geocoder returned no usable Nebraska result.'));
                        }
                    } else {
                        reject(new Error(`Geocoding failed: ${status}`));
                    }
                });
            })
            .catch(reject);
    }).then(location => {
        if (location) {
            const normalized = normalizeSearchLocationTerm(searchTerm);
            if (normalized) {
                locationCache.set(normalized, location);
            }
        }
        return location;
    });
}

function buildLocationLookups(dataset) {
    cityCoordinateIndex = new Map();
    zipCoordinateIndex = new Map();

    if (!Array.isArray(dataset)) return;

    dataset.forEach(facility => {
        if (!facility || !facility.address || !facility.coordinates) return;
        const city = extractCityFromAddress(facility.address);
        const zip = extractZipFromAddress(facility.address);
        if (city) {
            const key = normalizeSearchLocationTerm(city);
            accumulateCoordinate(cityCoordinateIndex, key, facility.coordinates);
        }
        if (zip) {
            accumulateCoordinate(zipCoordinateIndex, zip, facility.coordinates);
        }
    });
}

function accumulateCoordinate(index, key, coordinates) {
    if (!key || !coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
        return;
    }
    const existing = index.get(key) || { lat: 0, lng: 0, count: 0 };
    existing.lat += coordinates.lat;
    existing.lng += coordinates.lng;
    existing.count += 1;
    index.set(key, existing);
}

function getAverageCoordinate(entry) {
    if (!entry || !entry.count) return null;
    return {
        lat: entry.lat / entry.count,
        lng: entry.lng / entry.count
    };
}

function extractCityFromAddress(address) {
    const match = (address || '').match(/,\s*([^,]+),\s*NE\b/i);
    return match ? match[1].trim() : '';
}

function extractZipFromAddress(address) {
    const match = (address || '').match(/\b(\d{5})\b/);
    return match ? match[1] : '';
}

function extractZipFromText(text) {
    const trimmed = (text || '').trim();
    if (/^\d{5}$/.test(trimmed)) {
        return trimmed;
    }
    const match = (text || '').match(/\b(\d{5})\b/);
    return match ? match[1] : '';
}

function setupCategoryChips() {
    const chips = document.querySelectorAll('.category-chip');
    if (!chips.length) return;
    const path = window.location.pathname.split('/').pop() || 'index.html';
    chips.forEach(chip => {
        const link = chip.getAttribute('data-link');
        if (link && link === path) {
            chip.classList.add('active');
        }
        chip.addEventListener('click', () => {
            if (link && link !== path) {
                window.location.href = link;
            }
        });
    });
}

function loadRecentSearches() {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Unable to load recent searches:', error);
        return [];
    }
}

function saveRecentSearches() {
    try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    } catch (error) {
        console.warn('Unable to save recent searches:', error);
    }
}

function renderRecentSearches() {
    const container = document.getElementById('recent-searches');
    if (!container) return;
    if (!recentSearches.length) {
        container.innerHTML = '';
        container.setAttribute('hidden', 'hidden');
        return;
    }

    const chipsHtml = recentSearches
        .map(item => `<button class="recent-search-chip" type="button" data-recent-search="${item.label}">${item.label}</button>`)
        .join('');
    const clearBtn = `<button class="recent-clear-btn" type="button" data-clear-searches="true" aria-label="Clear recent searches"><i class="fas fa-times"></i></button>`;
    container.innerHTML = `<span class="recent-searches-label">Recent:</span> ${chipsHtml} ${clearBtn}`;
    container.removeAttribute('hidden');
}

function handleRecentSearchClick(event) {
    const clearBtn = event.target.closest('[data-clear-searches]');
    if (clearBtn) {
        event.preventDefault();
        clearRecentSearches();
        return;
    }

    const button = event.target.closest('button[data-recent-search]');
    if (!button) return;
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    searchInput.value = button.getAttribute('data-recent-search') || '';
    handleSearch();
}

function rememberRecentSearch(term) {
    const trimmed = (term || '').trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    recentSearches = recentSearches.filter(item => item.normalized !== normalized);
    recentSearches.unshift({ label: trimmed, normalized });
    if (recentSearches.length > MAX_RECENT_SEARCHES) {
        recentSearches = recentSearches.slice(0, MAX_RECENT_SEARCHES);
    }
    saveRecentSearches();
    renderRecentSearches();
}

function clearRecentSearches() {
    recentSearches = [];
    saveRecentSearches();
    renderRecentSearches();
}

function setupFilterSummaryBar() {
    const bar = document.getElementById('filter-summary-bar');
    if (bar) {
        bar.classList.add('hidden');
    }
}

function setupClearFiltersButton() {
    const button = document.getElementById('clear-filters-btn');
    if (button) {
        button.addEventListener('click', clearAllFilters);
    }
}

function clearAllFilters() {
    const searchInput = document.getElementById('search-input');
    const radiusEl = document.getElementById('search-radius');
    const ageEl = document.getElementById('age-group');
    const genderEl = document.getElementById('gender-served');
    const treatmentEl = document.getElementById('treatment-type');
    const facilityEl = document.getElementById('facility-type');

    if (searchInput) searchInput.value = '';
    const unlimitedValue = String(window.APP_CONFIG?.UNLIMITED_RADIUS || 999);
    if (radiusEl) radiusEl.value = unlimitedValue;
    if (ageEl) ageEl.value = '';
    if (genderEl) genderEl.value = '';
    if (treatmentEl) treatmentEl.value = '';
    if (facilityEl) facilityEl.value = '';

    userLocation = null;
    locationSource = null;
    currentLocationQuery = null;
    locationLookupToken += 1;

    handleSearch({ skipLocationLookup: true, useStatewideDataset: true });
}

function updateFilterSummary(criteria) {
    const bar = document.getElementById('filter-summary-bar');
    if (!bar) return;
    const summaryText = bar.querySelector('.summary-text');
    if (!summaryText) return;

    const unlimitedValue = String(window.APP_CONFIG?.UNLIMITED_RADIUS || 999);
    const parts = [];
    const trimmed = (criteria.searchTerm || '').trim();
    if (trimmed) {
        parts.push(`Search: "${trimmed}"`);
    }
    if (userLocation) {
        if (locationSource === 'geolocation') {
            parts.push('Using current location');
        } else if (currentLocationQuery) {
            parts.push(`Near ${currentLocationQuery}`);
        }
    }
    if (criteria.radius && criteria.radius !== unlimitedValue) {
        parts.push(`${criteria.radius} mi radius`);
    }
    if (criteria.ageGroup) {
        parts.push(`Age: ${criteria.ageGroup}`);
    }
    if (criteria.genderServed) {
        parts.push(`Gender: ${criteria.genderServed}`);
    }
    if (criteria.treatmentType) {
        parts.push(`Treatment: ${criteria.treatmentType}`);
    }
    if (criteria.facilityType) {
        parts.push(`Facility: ${criteria.facilityType}`);
    }

    if (!parts.length) {
        bar.classList.add('hidden');
        return;
    }

    summaryText.textContent = parts.join(' • ');
    bar.classList.remove('hidden');
}

function setupDrawerCloseButton() {
    const closeBtn = document.getElementById('drawer-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFacilityDetailDrawer);
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeFacilityDetailDrawer();
        }
    });
}

function openFacilityDetailDrawer(facility) {
    const drawer = document.getElementById('facility-detail-drawer');
    if (!drawer || !facility) return;
    const safeFacility = window.FacilityUtils
        ? window.FacilityUtils.sanitizeFacilityForRender(facility)
        : facility;
    if (!safeFacility) return;

    const nameEl = document.getElementById('drawer-facility-name');
    const typeEl = document.getElementById('drawer-facility-type');
    const statusEl = document.getElementById('drawer-status');
    const detailsEl = document.getElementById('drawer-details');
    const actionsEl = document.getElementById('drawer-actions');

    if (nameEl) nameEl.textContent = safeFacility.name || '';
    if (typeEl) typeEl.textContent = safeFacility.type || '';

    if (statusEl) {
        statusEl.className = `drawer-status facility-status ${getStatusClass(facility.status)}`;
        statusEl.textContent = safeFacility.status || '';
    }

    if (detailsEl) {
        detailsEl.innerHTML = `
            <p><i class="fas fa-map-marker-alt"></i> ${safeFacility.address || 'Address unavailable'}</p>
            <p><i class="fas fa-phone"></i> ${safeFacility.phone || 'Phone unavailable'}</p>
            <p><i class="fas fa-users"></i> ${safeFacility.genderServed || 'Unknown'} • ${safeFacility.ageGroup || 'Unknown'}</p>
            ${safeFacility.website ? `<p><i class="fas fa-globe"></i> ${safeFacility.website}</p>` : ''}
            ${safeFacility.lastUpdated ? `<p><i class="fas fa-clock"></i> Updated: ${formatDate(safeFacility.lastUpdated)}</p>` : ''}
        `;
    }

    if (actionsEl) {
        actionsEl.innerHTML = '';
        const actions = [
            { action: 'directions', label: 'Directions', icon: 'fa-directions', value: safeFacility.dataAttributes?.address },
            { action: 'call', label: 'Call', icon: 'fa-phone', value: safeFacility.dataAttributes?.phone },
            { action: 'website', label: 'Website', icon: 'fa-globe', value: safeFacility.dataAttributes?.website }
        ];

        actions.forEach(({ action, label, icon, value }) => {
            if (!value) return;
            const button = document.createElement('button');
            button.className = 'action-btn';
            button.setAttribute('data-action', action);
            if (action === 'directions') {
                button.setAttribute('data-address', value);
            } else if (action === 'call') {
                button.setAttribute('data-phone', value);
            } else if (action === 'website') {
                button.setAttribute('data-website', value);
            }
            button.innerHTML = `<i class="fas ${icon}"></i> ${label}`;
            button.addEventListener('click', (event) => {
                event.preventDefault();
                handleFacilityAction(button);
            });
            actionsEl.appendChild(button);
        });
    }

    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
}

function closeFacilityDetailDrawer() {
    const drawer = document.getElementById('facility-detail-drawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
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
    facilitiesList.removeEventListener('click', handleFacilitiesListClick);
    facilitiesList.addEventListener('click', handleFacilitiesListClick);
    facilitiesList.removeEventListener('mouseover', handleFacilityHover);
    facilitiesList.addEventListener('mouseover', handleFacilityHover);
    
    // Add staggered animation delays
    setTimeout(() => {
        const cards = facilitiesList.querySelectorAll('.facility-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }, 10);
}

function handleFacilitiesListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (button) {
        event.preventDefault();
        handleFacilityAction(button);
        event.stopPropagation();
        return;
    }

    const card = event.target.closest('.facility-card');
    if (card) {
        const facility = getFacilityFromCard(card);
        openFacilityDetailDrawer(facility);
    }
}

function handleFacilityAction(button) {
    if (!button) return;
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

function getFacilityFromCard(card) {
    if (!card) return null;
    const index = Number(card.getAttribute('data-facility-index'));
    if (Number.isNaN(index)) return null;
    return filteredFacilities[index];
}

function handleFacilityHover(event) {
    const card = event.target.closest('.facility-card');
    if (!card) return;
    const facility = getFacilityFromCard(card);
    if (facility && facility.coordinates) {
        const key = facility.key || facility.id || facility.name;
        if (key && key === lastMiniMapFacilityKey) {
            return;
        }
        lastMiniMapFacilityKey = key;
        updateMiniMapPreview(facility);
    }
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
        showLocationError('Geolocation is not supported by this browser. Please enter your city or ZIP code manually.');
        return;
    }

    const button = document.getElementById('use-location-btn');
    if (!button) {
        console.error('Location button not found');
        return;
    }

    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;

    const resetButton = () => {
        button.innerHTML = originalHTML;
        button.disabled = false;
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            try {
                if (!position || !position.coords) {
                    throw new Error('Invalid position data received');
                }

                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Validate coordinates
                if (isNaN(userLocation.lat) || isNaN(userLocation.lng)) {
                    throw new Error('Invalid coordinates received');
                }

                locationSource = 'geolocation';
                currentLocationQuery = null;
                ensureRadiusForLocationSearch();

                // Update search input with location
                reverseGeocode(userLocation.lat, userLocation.lng)
                    .catch(error => {
                        console.error('Reverse geocoding failed:', error);
                        showLocationError('We could not look up your city automatically, but we filtered providers near your coordinates.');
                        handleSearch({ skipLocationLookup: true, preserveLocationFromButton: true });
                    });

                resetButton();
            } catch (error) {
                console.error('Error processing location:', error);
                showLocationError('Error processing your location. Please try again or enter your location manually.');
                resetButton();
            }
        },
        (error) => {
            let errorMessage = 'Unable to get your location. ';

            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Location permission was denied. Please enable location access in your browser settings.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information is unavailable. Please check your device settings.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out. Please try again or enter your location manually.';
                    break;
                default:
                    errorMessage += 'An unknown error occurred. Please enter your city or ZIP code manually.';
            }

            console.error('Geolocation error:', error.code, error.message);
            showLocationError(errorMessage);
            resetButton();
        },
        {
            timeout: window.APP_CONFIG?.GEOLOCATION_TIMEOUT || 15000,
            maximumAge: window.APP_CONFIG?.LOCATION_MAX_AGE || 300000,
            enableHighAccuracy: false // Use faster, less accurate location for better UX
        }
    );
}

// Show location error to user
function showLocationError(message) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'location-error';
        errorDiv.style.cssText = 'color: #d32f2f; padding: 8px; margin-top: 4px; font-size: 14px;';
        errorDiv.textContent = message;

        const parent = searchInput.parentElement;
        if (parent) {
            // Remove any existing error messages
            const existingError = parent.querySelector('.location-error');
            if (existingError) {
                existingError.remove();
            }

            parent.appendChild(errorDiv);

            // Auto-remove after 5 seconds
            setTimeout(() => errorDiv.remove(), 5000);
        }
    } else {
        // Fallback to alert if can't show inline error
        alert(message);
    }
}

function reverseGeocode(lat, lng) {
    return new Promise((resolve, reject) => {
        try {
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                reject(new Error('Invalid coordinates provided'));
                return;
            }

            ensureGoogleMapsLoaded()
                .then(() => {
                    const geocoder = new google.maps.Geocoder();
                    const latlng = { lat: lat, lng: lng };

                    geocoder.geocode({ location: latlng }, (results, status) => {
                        try {
                            if (status === 'OK' && results && results[0]) {
                                const searchInput = document.getElementById('search-input');
                                if (searchInput) {
                                    const addressComponents = results[0].address_components;
                                    const city = addressComponents.find(component =>
                                        component.types.includes('locality')
                                    )?.long_name;

                                    if (city) {
                                        searchInput.value = `${city}, NE`;
                                        handleSearch({ skipLocationLookup: true, preserveLocationFromButton: true });
                                    }
                                }
                                resolve(results[0]);
                            } else {
                                reject(new Error(`Geocoding failed with status: ${status}`));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    });
                })
                .catch(reject);
        } catch (error) {
            reject(error);
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
        if (!mapsConfigured) {
            showLocationError('Map view is unavailable because the Google Maps API key is not configured.');
            listBtn.classList.add('active');
            mapContainer.style.display = 'none';
            listView.style.display = 'grid';
            return;
        }
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
    if (!mapElement || !mapsConfigured) {
        return;
    }

    ensureGoogleMapsLoaded()
        .then(() => {
            if (map) {
                updateMapMarkers();
                return;
            }

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
        })
        .catch(error => {
            console.warn('Map initialization skipped:', error);
        });
}

function updateMapMarkers() {
    if (!map || !window.google || !window.google.maps) return;
    
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
            
            marker.addListener('click', () => {
                openFacilityDetailDrawer(facility);
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

function updateMiniMapPreview(facility) {
    const preview = document.getElementById('mini-map-preview');
    const miniMapElement = document.getElementById('mini-map');
    if (!preview || !miniMapElement || !facility?.coordinates || !mapsConfigured) {
        return;
    }

    ensureGoogleMapsLoaded()
        .then(() => {
            if (!miniMap) {
                miniMap = new google.maps.Map(miniMapElement, {
                    center: facility.coordinates,
                    zoom: 11,
                    disableDefaultUI: true,
                    gestureHandling: 'none'
                });
                miniMapMarker = new google.maps.Marker({
                    position: facility.coordinates,
                    map: miniMap,
                    icon: getMarkerIcon(facility.status)
                });
                const placeholder = preview.querySelector('.mini-map-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                miniMapElement.style.display = 'block';
            } else {
                miniMap.setCenter(facility.coordinates);
                miniMap.setZoom(11);
                if (miniMapMarker) {
                    miniMapMarker.setPosition(facility.coordinates);
                    miniMapMarker.setIcon(getMarkerIcon(facility.status));
                }
            }
        })
        .catch(error => {
            console.warn('Mini map preview unavailable:', error);
        });
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
