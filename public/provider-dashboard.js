// Global variables
let currentProvider = null;
let allFacilities = [];
let providerFacilities = [];

// DOM elements
const dashboardSection = document.getElementById('dashboard-section');
const facilitiesSection = document.getElementById('facilities-section');
const associationSection = document.getElementById('association-section');
const profileSection = document.getElementById('profile-section');
const navLinks = document.querySelectorAll('.nav-menu a');
const logoutBtn = document.getElementById('logout-btn');
const sidebarProviderName = document.getElementById('sidebar-provider-name');
const sidebarProviderAgency = document.getElementById('sidebar-provider-agency');
const facilitiesCount = document.getElementById('facilities-count');
const availableCount = document.getElementById('available-count');
const lastUpdated = document.getElementById('last-updated');
const dashboardFacilities = document.getElementById('dashboard-facilities');
const facilitiesList = document.getElementById('facilities-list');
const facilitySearchInput = document.getElementById('facility-search');
const searchBtn = document.getElementById('search-btn');
const clearSearchBtn = document.getElementById('clear-search-btn');
const searchResults = document.getElementById('search-results');
const searchType = document.getElementById('search-type');
const locationFilter = document.getElementById('location-filter');
const treatmentFilter = document.getElementById('treatment-filter');
const facilityTypeFilter = document.getElementById('facility-type-filter');
const searchInfo = document.getElementById('search-info');
const profileForm = document.getElementById('profile-form');
const profileFirstName = document.getElementById('profile-first-name');
const profileLastName = document.getElementById('profile-last-name');
const profileEmail = document.getElementById('profile-email');
const profileAgency = document.getElementById('profile-agency');
const profileJobTitle = document.getElementById('profile-job-title');
const profilePhone = document.getElementById('profile-phone');
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
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            // Get Firebase ID token for API authentication
            const idToken = await user.getIdToken();
            // Store token for API requests
            window.authToken = idToken;

            currentProvider = await window.firebaseAuth.loadUserProfile(user.uid);
            if (currentProvider) {
                await loadFacilitiesData();
                setupEventListeners();
                updateProviderInfo();
                showSection('dashboard-section');
            } else {
                // Handle case where user is authenticated but profile doesn't exist
                window.location.href = 'provider-signin.html';
            }
        } else {
            // No user is signed in.
            window.location.href = 'provider-signin.html';
        }
    });
}

// Load facilities data from the backend API
async function loadFacilitiesData() {
    try {
        // First, get the user's token
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('No authenticated user found');
        }

        const idToken = await user.getIdToken();

        const response = await fetch('/api/facilities', {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        allFacilities = await response.json();
        allFacilities = allFacilities.facilities || [];
        loadProviderFacilities();
    } catch (error) {
        console.error("Error loading facilities from API: ", error);
        // Fallback to static data if API fails
        if (typeof window.STATIC_FACILITIES_DATA !== 'undefined') {
            allFacilities = window.STATIC_FACILITIES_DATA;
            loadProviderFacilities();
        }
    }
}

// Load provider's associated facilities
function loadProviderFacilities() {
    if (!currentProvider || !currentProvider.facilities || currentProvider.facilities.length === 0) {
        providerFacilities = [];
    } else {
        providerFacilities = allFacilities.filter(facility =>
            currentProvider.facilities.includes(facility.id)
        );
    }

    updateDashboardStats();
    renderDashboardFacilities();
    renderFacilitiesList();
}

// Set up event listeners
function setupEventListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            showSection(sectionId);
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    logoutBtn.addEventListener('click', handleLogout);
    profileForm.addEventListener('submit', handleProfileUpdate);
    searchBtn.addEventListener('click', handleFacilitySearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    facilitySearchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleFacilitySearch();
    });
    facilitySearchInput.addEventListener('input', handleRealTimeSearch);
    searchType.addEventListener('change', handleFacilitySearch);
    locationFilter.addEventListener('change', handleFacilitySearch);
    if (facilityTypeFilter) {
        facilityTypeFilter.addEventListener('change', handleFacilitySearch);
    }

    document.querySelectorAll('.close, .close-modal').forEach(button => {
        button.addEventListener('click', () => {
            statusModal.style.display = 'none';
            editFacilityModal.style.display = 'none';
            associationModal.style.display = 'none';
        });
    });

    saveStatusBtn.addEventListener('click', handleStatusUpdate);
    saveFacilityBtn.addEventListener('click', handleFacilityUpdate);
    submitAssociationBtn.addEventListener('click', handleAssociationRequest);

    window.addEventListener('click', (e) => {
        if (e.target === statusModal) statusModal.style.display = 'none';
        if (e.target === editFacilityModal) editFacilityModal.style.display = 'none';
        if (e.target === associationModal) associationModal.style.display = 'none';
    });
}

// Update provider information in the UI
function updateProviderInfo() {
    if (!currentProvider) return;
    sidebarProviderName.textContent = `${currentProvider.firstName} ${currentProvider.lastName}`;
    sidebarProviderAgency.textContent = currentProvider.agencyName || 'No Agency';
    profileFirstName.value = currentProvider.firstName || '';
    profileLastName.value = currentProvider.lastName || '';
    profileEmail.value = currentProvider.email || '';
    profileAgency.value = currentProvider.agencyName || '';
    profileJobTitle.value = currentProvider.jobTitle || '';
    profilePhone.value = currentProvider.workPhone || '';
}

// Update dashboard statistics
function updateDashboardStats() {
    facilitiesCount.textContent = providerFacilities.length;
    const availableFacilities = providerFacilities.filter(f => f.availability_status === 'Beds Available');
    availableCount.textContent = availableFacilities.length;

    let mostRecentUpdate = 0;
    if (providerFacilities.length > 0) {
        const updateDates = providerFacilities.map(f => new Date(f.status_last_updated).getTime()).filter(t => !isNaN(t));
        if(updateDates.length > 0) {
            mostRecentUpdate = Math.max(...updateDates);
        }
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
    dashboardFacilities.innerHTML = '';
    if (providerFacilities.length === 0) {
        dashboardFacilities.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-building"></i></div>
                <div class="empty-state-title">No Facilities Found</div>
                <div class="empty-state-message">You haven't been associated with any facilities yet.</div>
                <button class="btn-action btn-primary associate-facility-btn">Associate with a Facility</button>
            </div>`;
        const associateBtn = dashboardFacilities.querySelector('.associate-facility-btn');
        if (associateBtn) {
            associateBtn.addEventListener('click', () => showSection('association-section'));
        }
        return;
    }

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
    facilitiesList.innerHTML = '';
    if (providerFacilities.length === 0) {
        facilitiesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-building"></i></div>
                <div class="empty-state-title">No Facilities Found</div>
                <div class="empty-state-message">You haven't been associated with any facilities yet.</div>
                <button class="btn-action btn-primary associate-facility-btn">Associate with a Facility</button>
            </div>`;
        const associateBtn = facilitiesList.querySelector('.associate-facility-btn');
        if (associateBtn) {
            associateBtn.addEventListener('click', () => showSection('association-section'));
        }
        return;
    }

    providerFacilities.forEach(facility => {
        const card = createFacilityCard(facility, false);
        facilitiesList.appendChild(card);
    });
}

// Create a facility card
function createFacilityCard(facility, isCompact) {
    const safeFacility = window.FacilityUtils ? window.FacilityUtils.sanitizeFacilityForRender(facility) : facility;
    const card = document.createElement('div');
    card.className = 'facility-card';
    card.dataset.id = facility.id;

    const effectiveStatus = safeFacility.availability_status || safeFacility.status || 'Status Not Updated';
    let statusClass = 'status-not-updated';
    if (effectiveStatus === 'Beds Available') statusClass = 'status-available';
    else if (effectiveStatus === 'No Beds') statusClass = 'status-unavailable';
    else if (effectiveStatus.includes('Week')) statusClass = 'status-waitlist';

    const lastUpdatedRaw = safeFacility.status_last_updated || safeFacility.lastUpdated;
    const formattedDate = lastUpdatedRaw ? new Date(lastUpdatedRaw).toLocaleDateString() : 'N/A';
    const phoneDigits = (safeFacility.phone || '').replace(/\D/g, '');

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
        </div>`;

    card.querySelector('.update-status').addEventListener('click', () => openStatusModal(facility));
    if (!isCompact) {
        card.querySelector('.edit-facility').addEventListener('click', () => openEditFacilityModal(facility));
    }
    return card;
}


// Show a specific section
function showSection(sectionId) {
    dashboardSection.style.display = 'none';
    facilitiesSection.style.display = 'none';
    associationSection.style.display = 'none';
    profileSection.style.display = 'none';
    document.getElementById(sectionId).style.display = 'block';
    if (sectionId === 'association-section') {
        clearSearch();
        populateLocationFilter();
    }
}

// Populate location filter with unique cities from facilities
function populateLocationFilter() {
    const cities = new Set();
    allFacilities.forEach(facility => {
        const address = facility.address || '';
        const parts = address.split(',');
        let city = '';
        if (parts.length >= 3) city = parts[1].trim();
        else if (parts.length === 2) city = parts[0].trim();
        if (city) cities.add(city);
    });

    const sortedCities = Array.from(cities).sort();
    while (locationFilter.options.length > 1) locationFilter.remove(1);
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
        await firebase.auth().signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    const updates = {
        firstName: profileFirstName.value,
        lastName: profileLastName.value,
        agencyName: profileAgency.value,
        jobTitle: profileJobTitle.value,
        workPhone: profilePhone.value
    };

    try {
        await db.collection('providers').doc(currentProvider.uid).update(updates);
        Object.assign(currentProvider, updates);
        updateProviderInfo();
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Profile update error:', error);
        alert('Failed to update profile. Please try again.');
    }
}

// Handle facility search
function handleFacilitySearch() {
    const searchTerm = (facilitySearchInput.value || '').toLowerCase();
    const selectedSearchType = searchType.value;
    const selectedLocation = (locationFilter.value || '').toLowerCase();
    const selectedTreatment = treatmentFilter.value;
    const selectedFacilityTypeRaw = facilityTypeFilter ? facilityTypeFilter.value : '';
    const selectedFacilityType = selectedFacilityTypeRaw === 'Detox Center' ? 'Detox' : selectedFacilityTypeRaw;

    let filteredFacilities = allFacilities.filter(f => {
        if (selectedFacilityType && (f.type || '').toLowerCase() !== selectedFacilityType.toLowerCase()) return false;
        if (selectedTreatment) {
            const treatments = Array.isArray(f.treatmentTypes) ? f.treatmentTypes : [f.treatmentType || f.treatment_type || ''];
            if (!treatments.some(t => (t || '').toLowerCase() === selectedTreatment.toLowerCase() || (selectedTreatment.toLowerCase() === 'both' && (t || '').toLowerCase() === 'both'))) return false;
        }
        if (selectedLocation && !(f.address || '').toLowerCase().includes(selectedLocation)) return false;

        if (searchTerm) {
            const name = (f.name || '').toLowerCase();
            const address = (f.address || '').toLowerCase();
            const phone = (f.phone || '').replace(/\D/g, '');
            const searchPhone = searchTerm.replace(/\D/g, '');
            const treatmentTypes = Array.isArray(f.treatmentTypes) ? f.treatmentTypes.join(' ').toLowerCase() : (f.treatmentType || f.treatment_type || '').toLowerCase();

            switch (selectedSearchType) {
                case 'name': return name.includes(searchTerm);
                case 'location': return address.includes(searchTerm);
                case 'address': return address.includes(searchTerm);
                case 'phone': return phone.includes(searchPhone);
                case 'treatment': return treatmentTypes.includes(searchTerm);
                default: return name.includes(searchTerm) || address.includes(searchTerm) || phone.includes(searchPhone) || treatmentTypes.includes(searchTerm);
            }
        }
        return true;
    });

    const availableFacilities = filteredFacilities.filter(f => !currentProvider.facilities || !currentProvider.facilities.includes(f.id));
    searchInfo.textContent = `Found ${availableFacilities.length} facilities available for association`;
    searchResults.innerHTML = '';
    if (availableFacilities.length === 0) {
        searchResults.innerHTML = '<div class="empty-state"><p>No facilities found matching your search criteria.</p></div>';
        return;
    }

    availableFacilities.forEach(f => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-item';
        resultItem.dataset.id = f.id;
        const safeFacility = window.FacilityUtils ? window.FacilityUtils.sanitizeFacilityForRender(f) : f;
        resultItem.innerHTML = `
            <div class="search-item-name">${safeFacility.name}</div>
            <div class="search-item-address">${safeFacility.address}</div>
            <div class="search-item-details"><span>${safeFacility.phone}</span> | <span>${safeFacility.type}</span></div>`;
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

function handleRealTimeSearch() {
    if (facilitySearchInput.value.length >= 3 || facilitySearchInput.value.length === 0) {
        handleFacilitySearch();
    }
}

// Modal related functions
function openStatusModal(facility) {
    statusFacilityId.value = facility.id;
    availabilityStatus.value = facility.availability_status || 'Status Not Updated';
    statusNotes.value = facility.status_notes || '';
    statusModal.style.display = 'block';
}

function openEditFacilityModal(facility) {
    editFacilityId.value = facility.id;
    facilityName.value = facility.name;
    admissionsPhone.value = facility.admissions_contact_phone || facility.phone || '';
    admissionsEmail.value = facility.admissions_contact_email || '';
    facilityWebsite.value = facility.website || '';
    facilityDescription.value = facility.description || '';
    editFacilityModal.style.display = 'block';
}

function openAssociationModal(facility) {
    associationFacilityId.value = facility.id;
    const safeFacility = window.FacilityUtils ? window.FacilityUtils.sanitizeFacilityForRender(facility) : facility;
    associationFacilityInfo.innerHTML = `
        <p><strong>${safeFacility.name}</strong></p>
        <p>${safeFacility.address}</p>
        <p>Phone: ${safeFacility.phone}</p>`;
    associationForm.reset();
    associationModal.style.display = 'block';
}

// Handle status update
async function handleStatusUpdate() {
    const facilityId = statusFacilityId.value;
    const newStatus = availabilityStatus.value;
    const notes = statusNotes.value;

    try {
        // Get current user's token
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('No authenticated user found');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`/api/facilities/${facilityId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                notes: notes
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update status');
        }

        await loadFacilitiesData();
        statusModal.style.display = 'none';
        alert('Status updated successfully!');
    } catch (error) {
        console.error("Error updating status: ", error);
        alert('Failed to update status: ' + error.message);
    }
}

// Handle facility update
async function handleFacilityUpdate() {
    const facilityId = editFacilityId.value;
    const updates = {
        admissions_contact_phone: admissionsPhone.value,
        admissions_contact_email: admissionsEmail.value,
        website: facilityWebsite.value,
        description: facilityDescription.value
    };

    try {
        // Get current user's token
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('No authenticated user found');
        }

        const idToken = await user.getIdToken();

        const response = await fetch(`/api/facilities/${facilityId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update facility');
        }

        await loadFacilitiesData();
        editFacilityModal.style.display = 'none';
        alert('Facility information updated successfully!');
    } catch (error) {
        console.error("Error updating facility: ", error);
        alert('Failed to update facility information: ' + error.message);
    }
}

// Handle association request
async function handleAssociationRequest() {
    const facilityId = associationFacilityId.value;
    const role = associationRole.value;
    if (!role) {
        alert('Please select your role at this facility.');
        return;
    }

    try {
        const providerRef = db.collection('providers').doc(currentProvider.uid);
        await db.runTransaction(async (transaction) => {
            const providerDoc = await transaction.get(providerRef);
            if (!providerDoc.exists) {
                throw "Provider does not exist!";
            }
            const newFacilities = providerDoc.data().facilities || [];
            if (!newFacilities.includes(facilityId)) {
                newFacilities.push(facilityId);
            }
            transaction.update(providerRef, { facilities: newFacilities });
        });

        // Also add a request to the facility for approval in a real scenario
        // For now, we auto-approve
        currentProvider.facilities.push(facilityId);
        await loadFacilitiesData();
        associationModal.style.display = 'none';
        alert('Successfully associated with facility!');
        showSection('facilities-section');

    } catch (error) {
        console.error("Error associating facility: ", error);
        alert('Failed to associate with facility.');
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);