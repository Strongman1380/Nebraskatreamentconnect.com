// Global variables
let currentProvider = null;
let allFacilities = [];
let providerFacilities = [];

// DOM elements - Main sections
const dashboardSection = document.getElementById('dashboard-section');
const facilitiesSection = document.getElementById('facilities-section');
const associationSection = document.getElementById('association-section');
const profileSection = document.getElementById('profile-section');

// DOM elements - Navigation
const navLinks = document.querySelectorAll('.nav-menu a');
const logoutBtn = document.getElementById('logout-btn');

// DOM elements - Dashboard
const sidebarProviderName = document.getElementById('sidebar-provider-name');
const sidebarProviderAgency = document.getElementById('sidebar-provider-agency');
const facilitiesCount = document.getElementById('facilities-count');
const availableCount = document.getElementById('available-count');
const lastUpdated = document.getElementById('last-updated');
const dashboardFacilities = document.getElementById('dashboard-facilities');

// DOM elements - Facilities
const facilitiesList = document.getElementById('facilities-list');

// DOM elements - Association
const facilitySearchInput = document.getElementById('facility-search');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const searchResults = document.getElementById('search-results');
const searchType = document.getElementById('search-type');
const locationFilter = document.getElementById('location-filter');
const treatmentFilter = document.getElementById('treatment-filter');
const facilityTypeFilter = document.getElementById('facility-type-filter');
const searchInfo = document.getElementById('search-info');

// DOM elements - Profile
const profileForm = document.getElementById('profile-form');
const profileFirstName = document.getElementById('profile-first-name');
const profileLastName = document.getElementById('profile-last-name');
const profileEmail = document.getElementById('profile-email');
const profileAgency = document.getElementById('profile-agency');
const profileJobTitle = document.getElementById('profile-job-title');
const profilePhone = document.getElementById('profile-phone');

// DOM elements - Modals
const statusModal = document.getElementById('status-modal');
const statusForm = document.getElementById('status-form');
const statusFacilityId = document.getElementById('status-facility-id');
const availabilityStatus = document.getElementById('availability-status');
const statusNotes = document.getElementById('status-notes');
const saveStatusBtn = document.getElementById('save-status-btn');

const editFacilityModal = document.getElementById('edit-facility-modal');
const editFacilityForm = document.getElementById('edit-facility-form');
const editFacilityId = document.getElementById('edit-facility-id');
const facilityName = document.getElementById('facility-name');
const admissionsPhone = document.getElementById('admissions-phone');
const admissionsEmail = document.getElementById('admissions-email');
const facilityWebsite = document.getElementById('facility-website');
const facilityDescription = document.getElementById('facility-description');
const saveFacilityBtn = document.getElementById('save-facility-btn');

const associationModal = document.getElementById('association-modal');
const associationForm = document.getElementById('association-form');
const associationFacilityId = document.getElementById('association-facility-id');
const associationFacilityInfo = document.getElementById('association-facility-info');
const associationRole = document.getElementById('association-role');
const associationNotes = document.getElementById('association-notes');
const submitAssociationBtn = document.getElementById('submit-association-btn');

// Initialize the dashboard
async function init() {
    try {
        // DEMO: Skip Firebase initialization
        currentProvider = JSON.parse(localStorage.getItem('currentProvider'));
        if (!currentProvider) {
            // Create a default demo provider if none exists
            currentProvider = {
                id: 0,
                firstName: 'Demo',
                lastName: 'Provider',
                email: 'demo@demo.com',
                facilities: [],
            };
            localStorage.setItem('currentProvider', JSON.stringify(currentProvider));
        }
        // Ensure facilities array exists
        if (!Array.isArray(currentProvider.facilities)) {
            currentProvider.facilities = [];
            localStorage.setItem('currentProvider', JSON.stringify(currentProvider));
        }
        // Load facilities data
        loadFacilitiesData();
        // Set up event listeners
        setupEventListeners();
        // Update UI with provider information
        updateProviderInfo();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        // DEMO: Continue with dashboard access even if no provider
        loadFacilitiesData();
        setupEventListeners();
        updateProviderInfo();
    }
}

// Load facilities data
function loadFacilitiesData() {
    // In a real app, this would be an API call
    // For our prototype, load from localStorage or use mock data
    // DEMO: Ensure some facilities exist for search
    let demoFacilities = [
        {
            id: 101,
            name: 'Nebraska Recovery Center',
            type: 'Residential',
            address: '123 Main St, Lincoln, NE',
            phone: '402-555-1234',
            description: 'A leading residential treatment center.'
        },
        {
            id: 102,
            name: 'Omaha Outpatient Clinic',
            type: 'Outpatient',
            address: '456 Elm St, Omaha, NE',
            phone: '402-555-5678',
            description: 'Outpatient services for substance use.'
        },
        {
            id: 103,
            name: 'Halfway House North',
            type: 'Halfway House',
            address: '789 Oak St, Grand Island, NE',
            phone: '308-555-9012',
            description: 'Supportive halfway house for recovery.'
        }
    ];
    let storedFacilities = JSON.parse(localStorage.getItem('allFacilities')) || [];

    if (storedFacilities.length > 0) {
        allFacilities = window.FacilityUtils
            ? window.FacilityUtils.normalizeFacilityDataset(storedFacilities)
            : storedFacilities;
    } else if (typeof window !== 'undefined' && (
        Array.isArray(window.STATIC_FACILITIES_DATA) ||
        Array.isArray(window.STATIC_HALFWAY_HOUSES_DATA) ||
        Array.isArray(window.STATIC_OUTPATIENT_DATA) ||
        Array.isArray(window.STATIC_DETOX_DATA)
    )) {
        const combined = [
            ...(window.STATIC_FACILITIES_DATA || []),
            ...(window.STATIC_HALFWAY_HOUSES_DATA || []),
            ...(window.STATIC_OUTPATIENT_DATA || []),
            ...(window.STATIC_DETOX_DATA || []),
        ];
        allFacilities = window.FacilityUtils
            ? window.FacilityUtils.normalizeFacilityDataset(combined)
            : combined;
        localStorage.setItem('allFacilities', JSON.stringify(allFacilities));
    } else {
        allFacilities = window.FacilityUtils
            ? window.FacilityUtils.normalizeFacilityDataset(demoFacilities)
            : demoFacilities;
        localStorage.setItem('allFacilities', JSON.stringify(allFacilities));
    }

    if (window.FacilityUtils) {
        localStorage.setItem('allFacilities', JSON.stringify(allFacilities));
    }

    // Load provider's associated facilities
    loadProviderFacilities();
}

// Load provider's associated facilities
function loadProviderFacilities() {
    // In a real app, this would be filtered by the server
    // For our prototype, filter the allFacilities list
    
    // Check if provider has any associated facilities
    if (!currentProvider.facilities || currentProvider.facilities.length === 0) {
        providerFacilities = [];
        updateDashboardStats();
        renderDashboardFacilities();
        renderFacilitiesList();
        return;
    }
    
    // Filter facilities to only include those associated with the provider
    providerFacilities = allFacilities.filter(facility => 
        currentProvider.facilities.includes(facility.id)
    );
    
    // Update UI
    updateDashboardStats();
    renderDashboardFacilities();
    renderFacilitiesList();
}

// Set up event listeners
function setupEventListeners() {
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
            
            // Update active link
            navLinks.forEach(link => link.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Profile form
    profileForm.addEventListener('submit', handleProfileUpdate);
    
    // Facility search
    searchBtn.addEventListener('click', handleFacilitySearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    facilitySearchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleFacilitySearch();
    });
    facilitySearchInput.addEventListener('input', handleRealTimeSearch);
    searchType.addEventListener('change', handleFacilitySearch);
    locationFilter.addEventListener('change', handleFacilitySearch);
    treatmentFilter.addEventListener('change', handleFacilitySearch);
    if (facilityTypeFilter) {
        facilityTypeFilter.addEventListener('change', handleFacilitySearch);
    }
    
    // Modal close buttons
    document.querySelectorAll('.close, .close-modal').forEach(button => {
        button.addEventListener('click', () => {
            statusModal.style.display = 'none';
            editFacilityModal.style.display = 'none';
            associationModal.style.display = 'none';
        });
    });
    
    // Modal form submissions
    saveStatusBtn.addEventListener('click', handleStatusUpdate);
    saveFacilityBtn.addEventListener('click', handleFacilityUpdate);
    submitAssociationBtn.addEventListener('click', handleAssociationRequest);
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === statusModal) statusModal.style.display = 'none';
        if (e.target === editFacilityModal) editFacilityModal.style.display = 'none';
        if (e.target === associationModal) associationModal.style.display = 'none';
    });
}

// Update provider information in the UI
function updateProviderInfo() {
    // Update sidebar
    sidebarProviderName.textContent = `${currentProvider.firstName} ${currentProvider.lastName}`;
    sidebarProviderAgency.textContent = currentProvider.agencyName || 'No Agency';
    
    // Update profile form
    profileFirstName.value = currentProvider.firstName || '';
    profileLastName.value = currentProvider.lastName || '';
    profileEmail.value = currentProvider.email || '';
    profileAgency.value = currentProvider.agencyName || '';
    profileJobTitle.value = currentProvider.jobTitle || '';
    profilePhone.value = currentProvider.workPhone || '';
}

// Update dashboard statistics
function updateDashboardStats() {
    // Update facility count
    facilitiesCount.textContent = providerFacilities.length;
    
    // Count facilities with openings
    const availableFacilities = providerFacilities.filter(
        facility => facility.availability_status === 'Openings Available'
    );
    availableCount.textContent = availableFacilities.length;
    
    // Calculate days since last update
    let mostRecentUpdate = 0;
    if (providerFacilities.length > 0) {
        const updateDates = providerFacilities.map(facility => new Date(facility.status_last_updated).getTime());
        mostRecentUpdate = Math.max(...updateDates);
    }
    
    if (mostRecentUpdate > 0) {
        const daysSinceUpdate = Math.floor((Date.now() - mostRecentUpdate) / (1000 * 60 * 60 * 24));
        lastUpdated.textContent = daysSinceUpdate;
    } else {
        lastUpdated.textContent = 'N/A';
    }
}

// Render facilities in the dashboard
function renderDashboardFacilities() {
    // Clear existing content
    dashboardFacilities.innerHTML = '';
    
    if (providerFacilities.length === 0) {
        // Show empty state
        dashboardFacilities.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-building"></i></div>
                <div class="empty-state-title">No Facilities Found</div>
                <div class="empty-state-message">You haven't been associated with any facilities yet.</div>
                <button class="btn-action btn-primary associate-facility-btn">Associate with a Facility</button>
            </div>
        `;
        // Add event listener for the button
        const associateBtn = dashboardFacilities.querySelector('.associate-facility-btn');
        if (associateBtn) {
            associateBtn.addEventListener('click', () => showSection('association-section'));
        }
        return;
    }
    
    // Create facility cards for the dashboard (simplified view)
    const facilityCards = document.createElement('div');
    facilityCards.className = 'facility-list';
    
    providerFacilities.forEach(facility => {
        const card = createFacilityCard(facility, true);
        facilityCards.appendChild(card);
    });
    
    dashboardFacilities.appendChild(facilityCards);
}

// Render facilities in the facilities list
function renderFacilitiesList() {
    // Clear existing content
    facilitiesList.innerHTML = '';
    
    if (providerFacilities.length === 0) {
        // Show empty state
        facilitiesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-building"></i></div>
                <div class="empty-state-title">No Facilities Found</div>
                <div class="empty-state-message">You haven't been associated with any facilities yet.</div>
                <button class="btn-action btn-primary associate-facility-btn">Associate with a Facility</button>
            </div>
        `;
        // Add event listener for the button
        const associateBtn = facilitiesList.querySelector('.associate-facility-btn');
        if (associateBtn) {
            associateBtn.addEventListener('click', () => showSection('association-section'));
        }
        return;
    }
    
    // Create facility cards for the full list
    providerFacilities.forEach(facility => {
        const card = createFacilityCard(facility, false);
        facilitiesList.appendChild(card);
    });
}

// Create a facility card
function createFacilityCard(facility, isCompact) {
    const safeFacility = window.FacilityUtils
        ? window.FacilityUtils.sanitizeFacilityForRender(facility)
        : null;
    if (!safeFacility) {
        return document.createElement('div');
    }

    const card = document.createElement('div');
    card.className = 'facility-card';
    card.dataset.id = facility.id;

    // Determine effective status and class
    const effectiveStatus = facility.availability_status || facility.status || 'Status Not Updated';
    let statusClass = 'status-not-updated';
    if (effectiveStatus === 'Openings Available') {
        statusClass = 'status-available';
    } else if (effectiveStatus === 'No Openings') {
        statusClass = 'status-unavailable';
    } else if (effectiveStatus === 'Waitlist' || effectiveStatus === 'Accepting Assessments' || effectiveStatus === 'Contact for Availability') {
        statusClass = 'status-waitlist';
    }
    
    // Format last updated date
    const lastUpdatedRaw = facility.status_last_updated || facility.lastUpdated || null;
    const formattedDate = lastUpdatedRaw ? new Date(lastUpdatedRaw).toLocaleDateString() : 'N/A';

    const phoneDigits = (safeFacility.phone || '').replace(/\D/g, '');

    // Create card content
    card.innerHTML = `
        <div class="facility-header">
            <h3 class="facility-name">${safeFacility.name}</h3>
            <span class="facility-status ${statusClass}">${effectiveStatus}</span>
        </div>
        <div class="facility-info">
            <p><strong>Address:</strong> ${safeFacility.address}</p>
            <p><strong>Phone:</strong> ${safeFacility.phone ? `<a href="tel:${phoneDigits}" style="color: inherit;">${safeFacility.phone}</a>` : 'N/A'}</p>
            <p><strong>Last Updated:</strong> ${formattedDate}</p>
        </div>
        <div class="facility-actions">
            <button class="btn-action btn-primary update-status" data-id="${facility.id}">Update Status</button>
            ${!isCompact ? `<button class="btn-action btn-secondary edit-facility" data-id="${facility.id}">Edit Details</button>` : ''}
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.update-status').addEventListener('click', () => openStatusModal(facility));
    if (!isCompact) {
        card.querySelector('.edit-facility').addEventListener('click', () => openEditFacilityModal(facility));
    }
    
    return card;
}

// Show a specific section
function showSection(sectionId) {
    // Hide all sections
    dashboardSection.style.display = 'none';
    facilitiesSection.style.display = 'none';
    associationSection.style.display = 'none';
    profileSection.style.display = 'none';
    
    // Show the requested section
    document.getElementById(sectionId).style.display = 'block';
    
    // If showing association section, reset search
    if (sectionId === 'association-section') {
        clearSearch();
        
        // Populate the location filter with unique cities from all facilities
        populateLocationFilter();
    }
}

// Populate location filter with unique cities from facilities
function populateLocationFilter() {
    const cities = new Set();
    
    // Extract city from each facility address
    allFacilities.forEach(facility => {
        const address = facility.address || '';
        const parts = address.split(',');
        let city = '';
        if (parts.length >= 3) {
            city = parts[1].trim();
        } else if (parts.length === 2) {
            city = parts[0].trim();
        }
        if (city) cities.add(city);
    });
    
    // Sort cities alphabetically
    const sortedCities = Array.from(cities).sort();
    
    // Clear existing options except the default
    while (locationFilter.options.length > 1) {
        locationFilter.remove(1);
    }
    
    // Add cities as options
    sortedCities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        locationFilter.appendChild(option);
    });
}

// Handle logout
async function handleLogout() {
    try {
        // Sign out from Firebase if available
        if (window.firebaseAuth && window.firebaseAuth.isAuthenticated()) {
            await window.firebaseAuth.signOut();
        }
        
        // Clear provider session
        localStorage.removeItem('currentProvider');
        
        // Redirect to home page
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        
        // Fallback: clear localStorage and redirect anyway
        localStorage.removeItem('currentProvider');
        window.location.href = 'index.html';
    }
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    // Get form data
    const firstName = profileFirstName.value;
    const lastName = profileLastName.value;
    const agencyName = profileAgency.value;
    const jobTitle = profileJobTitle.value;
    const workPhone = profilePhone.value;
    
    const updates = {
        firstName,
        lastName,
        agencyName,
        jobTitle,
        workPhone
    };
    
    try {
        // Update in Firebase if available
        if (window.firebaseAuth && window.firebaseAuth.isAuthenticated() && currentProvider.uid) {
            const result = await window.firebaseAuth.updateProfile(currentProvider.uid, updates);
            
            if (result.success) {
                // Update local provider data
                Object.assign(currentProvider, updates);
                
                // Update UI
                updateProviderInfo();
                
                alert('Profile updated successfully!');
            } else {
                throw new Error(result.error);
            }
        } else {
            // Fallback to localStorage update
            await updateProfileFallback(updates);
        }
    } catch (error) {
        console.error('Profile update error:', error);
        
        // Try fallback method
        try {
            await updateProfileFallback(updates);
        } catch (fallbackError) {
            console.error('Fallback profile update error:', fallbackError);
            alert('Failed to update profile. Please try again.');
        }
    }
}

// Fallback profile update using localStorage
async function updateProfileFallback(updates) {
    // Update provider data
    Object.assign(currentProvider, updates);
    
    // Save to localStorage
    localStorage.setItem('currentProvider', JSON.stringify(currentProvider));
    
    // Update UI
    updateProviderInfo();
    
    // Update provider in the providers list
    const providers = JSON.parse(localStorage.getItem('mockProviders')) || [];
    const providerIndex = providers.findIndex(p => p.id === currentProvider.id);
    if (providerIndex !== -1) {
        providers[providerIndex] = {
            ...providers[providerIndex],
            ...updates
        };
        localStorage.setItem('mockProviders', JSON.stringify(providers));
    }
    
    alert('Profile updated successfully! (Using fallback storage)');
}

// Handle facility search
function handleFacilitySearch() {
    const searchTerm = (facilitySearchInput.value || '').toLowerCase();
    const selectedSearchType = searchType.value;
    const selectedLocation = (locationFilter.value || '').toLowerCase();
    const selectedTreatment = treatmentFilter.value;
    const selectedFacilityTypeRaw = facilityTypeFilter ? facilityTypeFilter.value : '';

    // Map UI label to data (Detox Center -> Detox)
    const selectedFacilityType = selectedFacilityTypeRaw === 'Detox Center' ? 'Detox' : selectedFacilityTypeRaw;

    let filteredFacilities = [...allFacilities];

    // Apply facility type filter if selected
    if (selectedFacilityType) {
        const desiredType = selectedFacilityType.toLowerCase();
        filteredFacilities = filteredFacilities.filter(f => {
            const types = Array.isArray(f.facilityTypes) ? f.facilityTypes : [f.type];
            return types.some(type => (type || '').toLowerCase() === desiredType);
        });
    }

    // Apply treatment type filter if selected
    if (selectedTreatment) {
        const desiredTreatment = selectedTreatment.toLowerCase();
        filteredFacilities = filteredFacilities.filter(f => {
            const treatments = Array.isArray(f.treatmentTypes) && f.treatmentTypes.length > 0
                ? f.treatmentTypes
                : [f.treatmentType || f.treatment_type || ''];
            return treatments.some(t => {
                const normalized = (t || '').toLowerCase();
                if (desiredTreatment === 'both') {
                    return normalized === 'both';
                }
                return normalized === desiredTreatment || normalized === 'both';
            });
        });
    }

    // Apply location filter if selected
    if (selectedLocation) {
        filteredFacilities = filteredFacilities.filter(f => (f.address || '').toLowerCase().includes(selectedLocation));
    }

    // Apply search term filter if provided
    if (searchTerm) {
        switch (selectedSearchType) {
            case 'name':
                filteredFacilities = filteredFacilities.filter(f => (f.name || '').toLowerCase().includes(searchTerm));
                break;
            case 'location':
                filteredFacilities = filteredFacilities.filter(f => {
                    const address = f.address || '';
                    const parts = address.split(',');
                    let city = '';
                    if (parts.length >= 3) {
                        city = parts[1].trim().toLowerCase();
                    } else if (parts.length === 2) {
                        city = parts[0].trim().toLowerCase();
                    }
                    return city ? city.includes(searchTerm) : false;
                });
                break;
            case 'address':
                filteredFacilities = filteredFacilities.filter(f => (f.address || '').toLowerCase().includes(searchTerm));
                break;
            case 'phone': {
                const termDigits = searchTerm.replace(/\D/g, '');
                filteredFacilities = filteredFacilities.filter(f => {
                    const digits = f.phoneDigits || (f.phone || '').replace(/\D/g, '');
                    return digits.includes(termDigits);
                });
                break;
            }
            case 'treatment':
                filteredFacilities = filteredFacilities.filter(f => {
                    const treatments = Array.isArray(f.treatmentTypes) && f.treatmentTypes.length > 0
                        ? f.treatmentTypes
                        : [f.treatmentType || f.treatment_type || ''];
                    const desc = (f.description || '').toLowerCase();
                    return treatments.some(t => (t || '').toLowerCase().includes(searchTerm)) || desc.includes(searchTerm);
                });
                break;
            case 'all':
            default:
                filteredFacilities = filteredFacilities.filter(f => {
                    const combined = (f.searchIndex || '').toLowerCase();
                    const desc = (f.description || '').toLowerCase();
                    return combined.includes(searchTerm) || desc.includes(searchTerm);
                });
                break;
        }
    }

    // Remove facilities already associated with the provider
    const availableFacilities = filteredFacilities.filter(f => !currentProvider.facilities || !currentProvider.facilities.includes(f.id));

    // Display search info
    searchInfo.textContent = `Found ${availableFacilities.length} facilities available for association`;

    // Display results
    if (availableFacilities.length === 0) {
        searchResults.innerHTML = '<div class="empty-state"><p>No facilities found matching your search criteria.</p></div>';
        return;
    }

    searchResults.innerHTML = '';
    availableFacilities.forEach(f => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-item';
        resultItem.dataset.id = f.id;

        // Determine treatment type display
        const safeFacility = window.FacilityUtils
            ? window.FacilityUtils.sanitizeFacilityForRender(f)
            : null;

        const treatmentDisplay = safeFacility && safeFacility.treatmentTypes && safeFacility.treatmentTypes.length > 1
            ? safeFacility.treatmentTypes.join(', ')
            : safeFacility?.primaryTreatmentType || '';

        const age = safeFacility?.ageGroup || '';
        const gender = safeFacility?.genderServed || '';

        resultItem.innerHTML = `
            <div class="search-item-name">${safeFacility ? safeFacility.name : (f.name || '')}</div>
            <div class="search-item-address">${safeFacility ? safeFacility.address : (f.address || '')}</div>
            <div class="search-item-details">
                <span class="search-item-phone">${safeFacility ? safeFacility.phone : (f.phone || '')}</span> |
                <span class="search-item-type">${[age, gender].filter(Boolean).join(' ')}${treatmentDisplay ? ` - ${treatmentDisplay}` : ''}</span>
            </div>
        `;

        resultItem.addEventListener('click', () => openAssociationModal(f));
        searchResults.appendChild(resultItem);
    });
}

// Clear search form and results
function clearSearch() {
    facilitySearchInput.value = '';
    searchType.value = 'all';
    locationFilter.value = '';
    treatmentFilter.value = '';
    if (facilityTypeFilter) facilityTypeFilter.value = '';
    searchInfo.textContent = '';
    searchResults.innerHTML = '';
}

// Handle real-time search as user types
function handleRealTimeSearch() {
    // Only perform real-time search if the search term is at least 3 characters
    if (facilitySearchInput.value.length >= 3) {
        handleFacilitySearch();
    } else if (facilitySearchInput.value.length === 0) {
        // If search field is cleared, show all results based on filters
        handleFacilitySearch();
    }
}// Modal related functions
function openStatusModal(facility) {
    // Set the facility ID in the form
    statusFacilityId.value = facility.id;
    
    // Set the current status
    availabilityStatus.value = facility.availability_status || 'Status Not Updated';
    
    // Set the notes (if any)
    statusNotes.value = facility.status_notes || '';
    
    // Show the modal
    statusModal.style.display = 'block';
}

function openEditFacilityModal(facility) {
    // Set the facility ID in the form
    editFacilityId.value = facility.id;
    
    // Set the current values
    facilityName.value = facility.name;
    admissionsPhone.value = facility.admissions_contact_phone || facility.phone || '';
    admissionsEmail.value = facility.admissions_contact_email || '';
    facilityWebsite.value = facility.website || '';
    facilityDescription.value = facility.description || '';
    
    // Show the modal
    editFacilityModal.style.display = 'block';
}

function openAssociationModal(facility) {
    // Set the facility ID in the form
    associationFacilityId.value = facility.id;
    
    // Display facility info
    const safeFacility = window.FacilityUtils
        ? window.FacilityUtils.sanitizeFacilityForRender(facility)
        : null;
    associationFacilityInfo.innerHTML = `
        <p><strong>${safeFacility ? safeFacility.name : facility.name}</strong></p>
        <p>${safeFacility ? safeFacility.address : (facility.address || '')}</p>
        <p>Phone: ${safeFacility ? safeFacility.phone : (facility.phone || '')}</p>
    `;
    
    // Reset form
    associationForm.reset();
    
    // Show the modal
    associationModal.style.display = 'block';
}

// Handle status update
function handleStatusUpdate() {
    const facilityId = parseInt(statusFacilityId.value);
    const newStatus = availabilityStatus.value;
    const notes = statusNotes.value;
    
    // Find the facility
    const facilityIndex = allFacilities.findIndex(f => f.id === facilityId);
    if (facilityIndex === -1) {
        alert('Facility not found.');
        return;
    }
    
    // Update the facility status
    allFacilities[facilityIndex].availability_status = newStatus;
    allFacilities[facilityIndex].status_notes = notes;
    allFacilities[facilityIndex].status_last_updated = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem('allFacilities', JSON.stringify(allFacilities));
    
    // Update the provider's facilities list
    loadProviderFacilities();
    
    // Close the modal
    statusModal.style.display = 'none';
    
    // Show success message
    alert(`Status for ${allFacilities[facilityIndex].name} updated to "${newStatus}"`);
}

// Handle facility update
function handleFacilityUpdate() {
    const facilityId = parseInt(editFacilityId.value);
    const newAdmissionsPhone = admissionsPhone.value;
    const newAdmissionsEmail = admissionsEmail.value;
    const newWebsite = facilityWebsite.value;
    const newDescription = facilityDescription.value;
    
    // Find the facility
    const facilityIndex = allFacilities.findIndex(f => f.id === facilityId);
    if (facilityIndex === -1) {
        alert('Facility not found.');
        return;
    }
    
    // Update the facility
    allFacilities[facilityIndex].admissions_contact_phone = newAdmissionsPhone;
    allFacilities[facilityIndex].admissions_contact_email = newAdmissionsEmail;
    allFacilities[facilityIndex].website = newWebsite;
    allFacilities[facilityIndex].description = newDescription;
    
    // Save to localStorage
    localStorage.setItem('allFacilities', JSON.stringify(allFacilities));
    
    // Update the provider's facilities list
    loadProviderFacilities();
    
    // Close the modal
    editFacilityModal.style.display = 'none';
    
    // Show success message
    alert(`Information for ${allFacilities[facilityIndex].name} has been updated.`);
}

// Handle association request
function handleAssociationRequest() {
    const facilityId = parseInt(associationFacilityId.value);
    const role = associationRole.value;
    const notes = associationNotes.value;
    
    if (!role) {
        alert('Please select your role at this facility.');
        return;
    }
    
    // Find the facility
    const facility = allFacilities.find(f => f.id === facilityId);
    if (!facility) {
        alert('Facility not found.');
        return;
    }
    
    // In a real app, this would create a pending association request
    // For our prototype, we'll approve it immediately
    
    // Add the facility to the provider's list
    if (!currentProvider.facilities) {
        currentProvider.facilities = [];
    }
    currentProvider.facilities.push(facilityId);
    
    // Save to localStorage
    localStorage.setItem('currentProvider', JSON.stringify(currentProvider));
    
    // Update providers list
    const mockProviders = JSON.parse(localStorage.getItem('mockProviders')) || [];
    const providerIndex = mockProviders.findIndex(p => p.id === currentProvider.id);
    if (providerIndex !== -1) {
        mockProviders[providerIndex].facilities = currentProvider.facilities;
        localStorage.setItem('mockProviders', JSON.stringify(mockProviders));
    }
    
    // Update the provider's facilities list
    loadProviderFacilities();
    
    // Close the modal
    associationModal.style.display = 'none';
    
    // Show success message
    alert(`You have been successfully associated with ${facility.name}.`);
    
    // Clear search results
    facilitySearchInput.value = '';
    searchResults.innerHTML = '';
    
    // Navigate to facilities section
    showSection('facilities-section');
    
    // Update active link
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector('a[data-section="facilities-section"]').classList.add('active');
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
