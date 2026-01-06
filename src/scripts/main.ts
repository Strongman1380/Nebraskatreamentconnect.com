/**
 * Nebraska Treatment Connect - Main Entry Point
 *
 * This is the main entry point for public pages (index, detox, halfway-houses, outpatient).
 * It handles facility search, filtering, and display.
 */

// Import styles (processed by Vite/PostCSS/Tailwind)
import '../styles/main.css';

// Import types
import type {
  Facility,
  FacilityRecord,
  SearchCriteria,
  UserLocation,
  PageType,
} from '../types';

// ============================================================================
// Global State
// ============================================================================

let allFacilities: Facility[] = [];
let filteredFacilities: Facility[] = [];
let map: google.maps.Map | null = null;
let markers: google.maps.Marker[] = [];
let userLocation: UserLocation | null = null;
let mapsLoadPromise: Promise<void> | null = null;

// ============================================================================
// Configuration
// ============================================================================

function shouldUseStaticData(): boolean {
  if (window.USE_STATIC_DATA === true) return true;
  if (window.USE_STATIC_DATA === false) return false;

  const fallbackEnabled = window.API_CONFIG?.USE_STATIC_FALLBACK === true;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  return fallbackEnabled && isLocalhost;
}

// ============================================================================
// Page Type Detection
// ============================================================================

function getCurrentPageType(): PageType {
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

// ============================================================================
// Data Loading
// ============================================================================

async function loadFacilitiesFromAPI(pageType: PageType): Promise<FacilityRecord[]> {
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

function getStaticFacilitiesForPage(pageType: PageType): FacilityRecord[] {
  const combined: FacilityRecord[] = window.STATIC_ALL_FACILITIES_DATA ||
    window.ALL_FACILITIES_DATA || [
      ...(window.STATIC_FACILITIES_DATA || []),
      ...(window.STATIC_HALFWAY_HOUSES_DATA || []),
      ...(window.STATIC_OUTPATIENT_DATA || []),
      ...(window.STATIC_DETOX_DATA || []),
    ];

  return filterFacilitiesByPageType(combined, pageType);
}

function filterFacilitiesByPageType(
  facilities: FacilityRecord[],
  pageType: PageType
): FacilityRecord[] {
  if (!Array.isArray(facilities)) return [];

  const matchesFacilityType = (
    facility: FacilityRecord,
    value: string
  ): boolean => {
    if (!facility) return false;
    const facilityWithTypes = facility as unknown as { facilityTypes?: string[] };
    if (Array.isArray(facilityWithTypes.facilityTypes)) {
      return facilityWithTypes.facilityTypes.includes(value);
    }
    return facility.type === value;
  };

  switch (pageType) {
    case 'Treatment Center':
      return facilities.filter(
        (f) =>
          matchesFacilityType(f, 'Treatment Center') ||
          matchesFacilityType(f, 'Detox')
      );
    case 'Halfway House':
      return facilities.filter((f) => matchesFacilityType(f, 'Halfway House'));
    case 'Outpatient':
      return facilities.filter((f) => matchesFacilityType(f, 'Outpatient'));
    case 'Detox':
      return facilities.filter((f) => matchesFacilityType(f, 'Detox'));
    default:
      return facilities;
  }
}

// ============================================================================
// Normalization
// ============================================================================

function normalizeFacilities(facilities: FacilityRecord[]): Facility[] {
  if (!Array.isArray(facilities)) return [];
  if (!facilities.length) return [];

  const firstFacility = facilities[0] as unknown as { searchIndex?: string };
  const alreadyNormalized =
    firstFacility && typeof firstFacility.searchIndex === 'string';

  if (alreadyNormalized) {
    return facilities.slice() as unknown as Facility[];
  }

  return window.FacilityUtils?.normalizeFacilityDataset
    ? window.FacilityUtils.normalizeFacilityDataset(facilities)
    : (facilities.slice() as unknown as Facility[]);
}

// ============================================================================
// Search & Filtering
// ============================================================================

function getSearchCriteria(): SearchCriteria {
  return {
    searchTerm:
      (document.getElementById('search-input') as HTMLInputElement)?.value || '',
    radius:
      (document.getElementById('search-radius') as HTMLSelectElement)?.value ||
      '999',
    ageGroup:
      ((document.getElementById('age-group') as HTMLSelectElement)?.value as SearchCriteria['ageGroup']) ||
      '',
    genderServed:
      ((document.getElementById('gender-served') as HTMLSelectElement)?.value as SearchCriteria['genderServed']) ||
      '',
    treatmentType:
      ((document.getElementById('treatment-type') as HTMLSelectElement)?.value as SearchCriteria['treatmentType']) ||
      '',
    facilityType:
      ((document.getElementById('facility-type') as HTMLSelectElement)?.value as SearchCriteria['facilityType']) ||
      '',
  };
}

async function handleSearch(): Promise<void> {
  const criteria = getSearchCriteria();
  const useStaticData = shouldUseStaticData();

  if (useStaticData) {
    applyClientFilters(criteria);
    return;
  }

  try {
    const baseUrl = window.API_CONFIG?.BASE_URL || '/api';
    let url = `${baseUrl}/facilities`;
    const params = new URLSearchParams();

    const pageType = getCurrentPageType();
    if (pageType === 'Treatment Center') {
      params.append('type', 'Treatment Center,Detox');
    } else {
      params.append('type', pageType);
    }

    if (criteria.searchTerm) params.append('search', criteria.searchTerm);
    if (criteria.ageGroup) params.append('ageGroup', criteria.ageGroup);
    if (criteria.genderServed) params.append('genderServed', criteria.genderServed);
    if (criteria.treatmentType) params.append('treatmentType', criteria.treatmentType);
    if (criteria.facilityType) params.append('facilityType', criteria.facilityType);
    if (criteria.radius && criteria.radius !== '999') params.append('radius', criteria.radius);
    if (userLocation && criteria.radius && criteria.radius !== '999') {
      params.append('lat', String(userLocation.lat));
      params.append('lng', String(userLocation.lng));
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

    const mapContainer = document.getElementById('map-container');
    if (map && mapContainer && mapContainer.style.display !== 'none') {
      updateMapMarkers();
    }
  } catch (error) {
    console.error('Error filtering facilities:', error);
    applyClientFilters(criteria);
  }
}

function applyClientFilters(criteria: SearchCriteria): void {
  if (window.FacilityUtils?.filterFacilities) {
    filteredFacilities = window.FacilityUtils.filterFacilities(
      allFacilities,
      criteria,
      userLocation
    );
  } else {
    const searchTerm = (criteria.searchTerm || '').toLowerCase();
    filteredFacilities = allFacilities.filter((facility) => {
      const searchTermMatch =
        !searchTerm ||
        facility.name?.toLowerCase().includes(searchTerm) ||
        facility.address?.toLowerCase().includes(searchTerm);

      const ageGroupMatch =
        !criteria.ageGroup ||
        facility.ageGroup === criteria.ageGroup ||
        facility.ageGroup === 'Both';
      const genderServedMatch =
        !criteria.genderServed ||
        facility.genderServed === criteria.genderServed ||
        facility.genderServed === 'Co-ed';
      const treatmentTypeMatch =
        !criteria.treatmentType ||
        facility.treatmentType === criteria.treatmentType ||
        facility.treatmentType === 'Both' ||
        facility.treatmentTypes?.includes(criteria.treatmentType);
      const facilityTypeMatch =
        !criteria.facilityType ||
        facility.type === criteria.facilityType ||
        facility.facilityTypes?.includes(criteria.facilityType);

      return (
        searchTermMatch &&
        ageGroupMatch &&
        genderServedMatch &&
        treatmentTypeMatch &&
        facilityTypeMatch
      );
    });
  }

  displayFacilities(filteredFacilities);
  updateResultsCount();

  const mapContainer = document.getElementById('map-container');
  if (map && mapContainer && mapContainer.style.display !== 'none') {
    updateMapMarkers();
  }
}

// ============================================================================
// Display
// ============================================================================

function displayFacilities(facilities: Facility[]): void {
  const facilitiesList = document.getElementById('facilities-list');
  if (!facilitiesList) return;

  if (facilities.length === 0) {
    facilitiesList.innerHTML = `
      <div class="no-results">
        <h3>No facilities found</h3>
        <p>Try adjusting your search criteria.</p>
      </div>
    `;
    return;
  }

  facilitiesList.innerHTML = facilities.map((facility) => createFacilityCard(facility)).join('');
}

function createFacilityCard(facility: Facility): string {
  const safeFacility = window.FacilityUtils
    ? window.FacilityUtils.sanitizeFacilityForRender(facility)
    : facility;

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
        ${
          safeFacility.lastUpdated
            ? `<p><i class="fas fa-clock"></i> Updated: ${formatDate(safeFacility.lastUpdated)}</p>`
            : ''
        }
      </div>
      <div class="facility-actions">
        <button onclick="getDirections('${safeFacility.address}')" class="action-btn">
          <i class="fas fa-directions"></i> Directions
        </button>
        <button onclick="callFacility('${safeFacility.phone}')" class="action-btn">
          <i class="fas fa-phone"></i> Call
        </button>
        ${
          safeFacility.website
            ? `<button onclick="visitWebsite('${safeFacility.website}')" class="action-btn">
                <i class="fas fa-globe"></i> Website
               </button>`
            : ''
        }
      </div>
    </div>
  `;
}

function getStatusClass(status: string): string {
  if (!status) return 'status-not-updated';
  const s = status.toLowerCase();

  if (s === 'beds available' || s === 'available') return 'status-available';
  if (s === 'no beds available' || s === 'no beds' || s.includes('no opening'))
    return 'status-unavailable';
  if (s === 'call for availability' || s.includes('contact')) return 'status-call';
  if (s.includes('available') && !s.includes('no') && !s.includes('call'))
    return 'status-available';
  if (s.includes('week')) return 'status-waitlist';

  return 'status-not-updated';
}

function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function updateResultsCount(): void {
  const totalResults = document.getElementById('total-results');
  if (totalResults) {
    totalResults.textContent = String(filteredFacilities.length);
  }
}

// ============================================================================
// Actions (exposed globally for onclick handlers)
// ============================================================================

function getDirections(address: string): void {
  const encodedAddress = encodeURIComponent(address);
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
    '_blank'
  );
}

function callFacility(phone: string): void {
  window.location.href = `tel:${phone.replace(/\D/g, '')}`;
}

function visitWebsite(website: string): void {
  let url = website;
  if (url && !url.startsWith('http')) {
    url = 'http://' + url;
  }
  window.open(url, '_blank');
}

// Expose to window for onclick handlers
(window as unknown as { getDirections: typeof getDirections }).getDirections = getDirections;
(window as unknown as { callFacility: typeof callFacility }).callFacility = callFacility;
(window as unknown as { visitWebsite: typeof visitWebsite }).visitWebsite = visitWebsite;

// ============================================================================
// Location
// ============================================================================

function useCurrentLocation(): void {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        handleSearch();
      },
      () => {
        alert('Unable to retrieve your location.');
      }
    );
  } else {
    alert('Geolocation is not supported by your browser.');
  }
}

// ============================================================================
// Map
// ============================================================================

function ensureGoogleMapsLoaded(): Promise<void> {
  if (window.google?.maps) {
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
    const existingScript = document.querySelector(
      'script[data-google-maps-loader]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () =>
        reject(new Error('Failed to load Google Maps script'))
      );
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps-loader', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

function initializeMap(): void {
  if (map) {
    updateMapMarkers();
    return;
  }

  if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
    console.error('Google Maps API not loaded.');
    return;
  }

  const mapElement = document.getElementById('google-map');
  if (!mapElement) return;

  const nebraskaCenter = window.APP_CONFIG?.NEBRASKA_CENTER || { lat: 41.4925, lng: -99.9018 };
  const defaultZoom = window.APP_CONFIG?.DEFAULT_MAP_ZOOM || 7;

  map = new google.maps.Map(mapElement, {
    center: nebraskaCenter,
    zoom: defaultZoom,
  });

  updateMapMarkers();
}

function updateMapMarkers(): void {
  if (!map) return;

  // Clear existing markers
  markers.forEach((marker) => marker.setMap(null));
  markers = [];

  const bounds = new google.maps.LatLngBounds();

  filteredFacilities.forEach((facility) => {
    if (facility.coordinates?.lat && facility.coordinates?.lng) {
      const marker = new google.maps.Marker({
        position: facility.coordinates,
        map: map!,
        title: facility.name,
      });

      const infowindow = new google.maps.InfoWindow({
        content: `<b>${facility.name}</b><br>${facility.address}`,
      });

      marker.addListener('click', () => {
        infowindow.open(map!, marker);
      });

      markers.push(marker);
      bounds.extend(marker.getPosition()!);
    }
  });

  if (markers.length > 0) {
    map.fitBounds(bounds);
  }
}

function switchView(view: 'list' | 'map'): void {
  const listView = document.getElementById('facilities-list');
  const mapContainer = document.getElementById('map-container');
  const listBtn = document.getElementById('list-view-btn');
  const mapBtn = document.getElementById('map-view-btn');

  if (view === 'list') {
    if (listView) listView.style.display = 'grid';
    if (mapContainer) mapContainer.style.display = 'none';
    listBtn?.classList.add('active');
    mapBtn?.classList.remove('active');
  } else {
    if (listView) listView.style.display = 'none';
    if (mapContainer) mapContainer.style.display = 'block';
    listBtn?.classList.remove('active');
    mapBtn?.classList.add('active');
    ensureGoogleMapsLoaded()
      .then(() => initializeMap())
      .catch((error) => console.error(error.message));
  }
}

// ============================================================================
// Utilities
// ============================================================================

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================================================
// Event Listeners
// ============================================================================

function initializeEventListeners(): void {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const useLocationBtn = document.getElementById('use-location-btn');

  const debounceDelay = window.APP_CONFIG?.SEARCH_DEBOUNCE_DELAY || 300;
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, debounceDelay));
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', useCurrentLocation);
  }

  const filters = [
    'search-radius',
    'age-group',
    'gender-served',
    'treatment-type',
    'facility-type',
  ];
  filters.forEach((filterId) => {
    const element = document.getElementById(filterId);
    if (element) {
      element.addEventListener('change', handleSearch);
    }
  });

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

// ============================================================================
// Initialization
// ============================================================================

async function init(): Promise<void> {
  const pageType = getCurrentPageType();
  const useStaticData = shouldUseStaticData();

  try {
    const rawFacilities = useStaticData
      ? getStaticFacilitiesForPage(pageType)
      : await loadFacilitiesFromAPI(pageType);

    allFacilities = normalizeFacilities(rawFacilities);
    filteredFacilities = [...allFacilities];

    initializeEventListeners();
    displayFacilities(filteredFacilities);
    updateResultsCount();
    switchView('list');

    console.log('Loaded', allFacilities.length, 'facilities for page type:', pageType);
  } catch (error) {
    console.error('Error loading facilities from API:', error);
    // Fallback to static data
    const rawFacilities = getStaticFacilitiesForPage(pageType);
    allFacilities = normalizeFacilities(rawFacilities);
    filteredFacilities = [...allFacilities];
    displayFacilities(filteredFacilities);
    updateResultsCount();
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ============================================================================
// Hot Module Replacement (Vite Development)
// ============================================================================

if (import.meta.hot) {
  import.meta.hot.accept();
}
