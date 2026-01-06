/**
 * Nebraska Treatment Connect - TypeScript Type Definitions
 */

// ============================================================================
// Facility Types
// ============================================================================

/**
 * Facility status values in priority order (lower = higher priority)
 */
export type FacilityStatus =
  | 'Emergency/Crisis Only'
  | 'Openings Available'
  | 'Accepting Assessments'
  | 'Waitlist'
  | 'No Openings'
  | 'Contact for Availability';

/**
 * Types of treatment facilities
 */
export type FacilityType =
  | 'Treatment Center'
  | 'Detox'
  | 'Halfway House'
  | 'Outpatient';

/**
 * Types of treatment offered
 */
export type TreatmentType =
  | 'Substance Abuse'
  | 'Mental Health'
  | 'Detox'
  | 'Both'
  | 'Unknown';

/**
 * Age groups served
 */
export type AgeGroup = 'Adult' | 'Juvenile' | 'Both';

/**
 * Genders served
 */
export type GenderServed = 'Male' | 'Female' | 'Co-ed';

/**
 * Geographic coordinates
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Raw facility record as stored in static data or database
 */
export interface FacilityRecord {
  id: number;
  name: string;
  type: FacilityType;
  address: string;
  phone: string;
  website?: string;
  ageGroup: AgeGroup;
  genderServed: GenderServed;
  treatmentType: TreatmentType;
  status: FacilityStatus;
  lastUpdated?: string;
  coordinates?: Coordinates;
}

/**
 * Normalized facility with merged data (after deduplication)
 */
export interface Facility extends Omit<FacilityRecord, 'type' | 'treatmentType'> {
  /** Primary facility type (first in array) */
  type: FacilityType;
  /** All facility types */
  facilityTypes: FacilityType[];
  /** Primary treatment type (first in array) */
  treatmentType: TreatmentType;
  /** All treatment types */
  treatmentTypes: TreatmentType[];
  /** Concatenated searchable text (lowercase) */
  searchIndex: string;
  /** Phone digits only for matching */
  phoneDigits: string;
  /** Unique key for deduplication */
  key: string;
  /** Original IDs that were merged */
  sourceIds: number[];
}

/**
 * Facility prepared for safe rendering (sanitized)
 */
export interface SafeFacility {
  id: number;
  name: string;
  type: string;
  facilityTypes: string[];
  treatmentTypes: string[];
  primaryTreatmentType: string;
  status: string;
  address: string;
  genderServed: string;
  ageGroup: string;
  phone: string;
  website: string;
  lastUpdated: string | null;
  dataAttributes: {
    address: string;
    phone: string;
    website: string;
  };
}

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Provider/user profile data
 */
export interface Provider {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  agencyName?: string;
  jobTitle?: string;
  workPhone?: string;
  facilities: number[];
  isVerifiedByAdmin: boolean;
  emailVerified: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

/**
 * Provider registration data
 */
export interface ProviderRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  agencyName?: string;
  jobTitle?: string;
  workPhone?: string;
}

/**
 * Provider sign-in credentials
 */
export interface ProviderCredentials {
  email: string;
  password: string;
}

// ============================================================================
// Search & Filter Types
// ============================================================================

/**
 * Search criteria for filtering facilities
 */
export interface SearchCriteria {
  searchTerm: string;
  radius: string;
  ageGroup: AgeGroup | '';
  genderServed: GenderServed | '';
  treatmentType: TreatmentType | '';
  facilityType: FacilityType | '';
}

/**
 * User location from geolocation API
 */
export interface UserLocation {
  lat: number;
  lng: number;
}

/**
 * Page type for routing/filtering
 */
export type PageType = 'Treatment Center' | 'Halfway House' | 'Outpatient' | 'Detox';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Firebase configuration
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * API configuration
 */
export interface APIConfig {
  BASE_URL: string;
  USE_STATIC_FALLBACK: boolean;
  REQUEST_TIMEOUT: number;
}

/**
 * Application configuration
 */
export interface AppConfig {
  SEARCH_DEBOUNCE_DELAY: number;
  DEFAULT_RADIUS: number;
  NEBRASKA_CENTER: Coordinates;
  DEFAULT_MAP_ZOOM: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Status priority mapping
 */
export type StatusPriority = {
  [K in FacilityStatus]: number;
};

/**
 * FacilityUtils module interface
 */
export interface FacilityUtilsModule {
  normalizeFacilityDataset: (facilities: FacilityRecord[]) => Facility[];
  filterFacilities: (
    facilities: Facility[],
    criteria: Partial<SearchCriteria>,
    userLocation?: UserLocation | null
  ) => Facility[];
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  sanitizeFacilityForRender: (facility: Facility) => SafeFacility | null;
  validateFacilityRecord: (record: unknown) => record is FacilityRecord;
}

/**
 * SecurityUtils module interface
 */
export interface SecurityUtilsModule {
  sanitizeHTML: (str: string) => string;
  sanitizeAttribute: (str: string) => string;
  sanitizePhone: (phone: string) => string;
  sanitizeURL: (url: string) => string;
  validateEmail: (email: string) => boolean;
  validateInput: (input: string, type?: string, maxLength?: number) => boolean;
  createSafeEventHandler: (type: string, data: unknown) => void;
  generateCSRFToken: () => string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * API response for facilities list
 */
export interface FacilitiesResponse {
  facilities: FacilityRecord[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * API error response
 */
export interface APIError {
  error: string;
  message?: string;
  code?: string;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Facility card click event data
 */
export interface FacilityClickEvent {
  facilityId: number;
  action: 'view' | 'directions' | 'call' | 'website';
}

/**
 * Status update event data
 */
export interface StatusUpdateEvent {
  facilityId: number;
  oldStatus: FacilityStatus;
  newStatus: FacilityStatus;
  timestamp: Date;
}

// ============================================================================
// Window Globals (for backward compatibility)
// ============================================================================

declare global {
  interface Window {
    // Configuration
    GOOGLE_MAPS_API_KEY?: string;
    FIREBASE_CONFIG?: FirebaseConfig;
    API_CONFIG?: APIConfig;
    APP_CONFIG?: AppConfig;
    USE_STATIC_DATA?: boolean;

    // Static data
    STATIC_FACILITIES_DATA?: FacilityRecord[];
    STATIC_HALFWAY_HOUSES_DATA?: FacilityRecord[];
    STATIC_OUTPATIENT_DATA?: FacilityRecord[];
    STATIC_DETOX_DATA?: FacilityRecord[];
    STATIC_PROVIDERS_DATA?: Provider[];
    STATIC_ALL_FACILITIES_DATA?: FacilityRecord[];
    ALL_FACILITIES_DATA?: FacilityRecord[];

    // Utility modules
    FacilityUtils?: FacilityUtilsModule;
    SecurityUtils?: SecurityUtilsModule;
    Logger?: unknown;
    logger?: unknown;

    // Firebase (loaded from CDN)
    firebase?: unknown;
    firebaseAuth?: unknown;

    // Google Maps (loaded from CDN) - types from @types/google.maps
    google?: typeof google;

    // Authentication token
    authToken?: string;
  }
}

// Google Maps types are provided by @types/google.maps

export {};
