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
        // Initialize Firebase
        await window.firebaseAuth.init();
        
        // Check if user is logged in
        currentProvider = JSON.parse(localStorage.getItem('currentProvider'));
        
        // If no localStorage session, check Firebase auth
        if (!currentProvider && !window.firebaseAuth.isAuthenticated()) {
            // Redirect to login page if not logged in
            window.location.href = 'provider-signin.html';
            return;
        }
        
        // If Firebase user exists but no localStorage session, load from Firebase
        if (!currentProvider && window.firebaseAuth.isAuthenticated()) {
            const firebaseUser = window.firebaseAuth.getCurrentUser();
            if (firebaseUser) {
                await window.firebaseAuth.loadUserProfile(firebaseUser.uid);
                currentProvider = JSON.parse(localStorage.getItem('currentProvider'));
            }
        }
        
        // Final check - if still no provider data, redirect to sign-in
        if (!currentProvider) {
            window.location.href = 'provider-signin.html';
            return;
        }
        
        // Load facilities data
        loadFacilitiesData();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update UI with provider information
        updateProviderInfo();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        // Fallback to localStorage-only mode
        currentProvider = JSON.parse(localStorage.getItem('currentProvider'));
        if (!currentProvider) {
            window.location.href = 'provider-signin.html';
            return;
        }
        
        // Continue with initialization
        loadFacilitiesData();
        setupEventListeners();
        updateProviderInfo();
    }
}

// Load facilities data
function loadFacilitiesData() {
    // In a real app, this would be an API call
    // For our prototype, load from localStorage or use mock data
    allFacilities = JSON.parse(localStorage.getItem('allFacilities')) || [];
    
    // If no facilities in localStorage, use the ones from scripts.js
    if (allFacilities.length === 0) {
        const scriptTag = document.createElement('script');
        scriptTag.src = 'scripts.js';
        scriptTag.onload = function() {
            // Once scripts.js is loaded, the mockFacilities and mockFacilitiesPart2 variables should be available
            if (typeof mockFacilities !== 'undefined' && typeof mockFacilitiesPart2 !== 'undefined') {
                allFacilities = [...mockFacilities, ...mockFacilitiesPart2];
                localStorage.setItem('allFacilities', JSON.stringify(allFacilities));
                
                // Now load provider's associated facilities
                loadProviderFacilities();
            }
        };
        document.head.appendChild(scriptTag);
    } else {
        // Load provider's associated facilities
        loadProviderFacilities();
    }
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
                <button class="btn-action btn-primary" onclick="showSection('association-section')">Associate with a Facility</button>
            </div>
        `;
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
                <button class="btn-action btn-primary" onclick="showSection('association-section')">Associate with a Facility</button>
            </div>
        `;
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
    const card = document.createElement('div');
    card.className = 'facility-card';
    card.dataset.id = facility.id;
    
    // Determine status class
    let statusClass = 'status-not-updated';
    if (facility.availability_status === 'Openings Available') {
        statusClass = 'status-available';
    } else if (facility.availability_status === 'No Openings') {
        statusClass = 'status-unavailable';
    } else if (facility.availability_status === 'Waitlist' || facility.availability_status === 'Accepting Assessments') {
        statusClass = 'status-waitlist';
    }
    
    // Format last updated date
    const lastUpdated = new Date(facility.status_last_updated);
    const formattedDate = lastUpdated.toLocaleDateString();
    
    // Create card content
    card.innerHTML = `
        <div class="facility-header">
            <h3 class="facility-name">${facility.name}</h3>
            <span class="facility-status ${statusClass}">${facility.availability_status}</span>
        </div>
        <div class="facility-info">
            <p><strong>Address:</strong> ${facility.address}</p>
            <p><strong>Phone:</strong> <a href="tel:${facility.phone.replace(/\D/g, '')}" style="color: inherit;">${facility.phone}</a></p>
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
        const addressParts = facility.address.split(',');
        if (addressParts.length > 1) {
            const city = addressParts[1].trim();
            cities.add(city);
        }
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
    const mockProviders = JSON.parse(localStorage.getItem('mockProviders')) || [];
    const providerIndex = mockProviders.findIndex(p => p.id === currentProvider.id);
    if (providerIndex !== -1) {
        Object.assign(mockProviders[providerIndex], updates);
        localStorage.setItem('mockProviders', JSON.stringify(mockProviders));
    }
    
    alert('Profile updated successfully! (Using fallback storage)');
}

// Handle facility search
function handleFacilitySearch() {
    const searchTerm = facilitySearchInput.value.toLowerCase();
    const selectedSearchType = searchType.value;
    const selectedLocation = locationFilter.value.toLowerCase();
    const selectedTreatment = treatmentFilter.value;
    
    let filteredFacilities = [...allFacilities];
    
    // Apply treatment type filter if selected
    if (selectedTreatment) {
        filteredFacilities = filteredFacilities.filter(facility => {
            if (selectedTreatment === 'Both') {
                return facility.treatment_type === 'Both';
            } else {
                return facility.treatment_type === selectedTreatment || facility.treatment_type === 'Both';
            }
        });
    }
    
    // Apply location filter if selected
    if (selectedLocation) {
        filteredFacilities = filteredFacilities.filter(facility => 
            facility.address.toLowerCase().includes(selectedLocation)
        );
    }
    
    // Apply search term filter if provided
    if (searchTerm) {
        // Filter based on selected search type
        switch (selectedSearchType) {
            case 'name':
                filteredFacilities = filteredFacilities.filter(facility => 
                    facility.name.toLowerCase().includes(searchTerm)
                );
                break;
            case 'location':
                filteredFacilities = filteredFacilities.filter(facility => {
                    // Extract city from address (assumes format like "Address, City, NE Zip")
                    const addressParts = facility.address.split(',');
                    if (addressParts.length > 1) {
                        const city = addressParts[1].trim().toLowerCase();
                        return city.includes(searchTerm);
                    }
                    return false;
                });
                break;
            case 'address':
                filteredFacilities = filteredFacilities.filter(facility => 
                    facility.address.toLowerCase().includes(searchTerm)
                );
                break;
            case 'phone':
                filteredFacilities = filteredFacilities.filter(facility => 
                    facility.phone.toLowerCase().replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))
                );
                break;
            case 'treatment':
                filteredFacilities = filteredFacilities.filter(facility => 
                    facility.treatment_type.toLowerCase().includes(searchTerm) ||
                    facility.description.toLowerCase().includes(searchTerm)
                );
                break;
            case 'all':
            default:
                filteredFacilities = filteredFacilities.filter(facility => 
                    facility.name.toLowerCase().includes(searchTerm) || 
                    facility.address.toLowerCase().includes(searchTerm) ||
                    facility.phone.toLowerCase().includes(searchTerm) ||
                    (facility.description && facility.description.toLowerCase().includes(searchTerm))
                );
                break;
        }
    }
    
    // Remove facilities already associated with the provider
    const availableFacilities = filteredFacilities.filter(facility => 
        !currentProvider.facilities || !currentProvider.facilities.includes(facility.id)
    );
    
    // Display search info
    searchInfo.textContent = `Found ${availableFacilities.length} facilities available for association`;
    
    // Display results
    if (availableFacilities.length === 0) {
        searchResults.innerHTML = '<div class="empty-state"><p>No facilities found matching your search criteria.</p></div>';
        return;
    }
    
    searchResults.innerHTML = '';
    availableFacilities.forEach(facility => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-item';
        resultItem.dataset.id = facility.id;
        
        // Determine treatment type display
        let treatmentDisplay = facility.treatment_type;
        if (facility.treatment_type === 'Both') {
            treatmentDisplay = 'Substance Abuse & Mental Health';
        }
        
        resultItem.innerHTML = `
            <div class="search-item-name">${facility.name}</div>
            <div class="search-item-address">${facility.address}</div>
            <div class="search-item-details">
                <span class="search-item-phone">${facility.phone}</span> | 
                <span class="search-item-type">${facility.age_group} ${facility.gender_served} - ${treatmentDisplay}</span>
            </div>
        `;
        
        resultItem.addEventListener('click', () => openAssociationModal(facility));
        searchResults.appendChild(resultItem);
    });
}

// Clear search form and results
function clearSearch() {
    facilitySearchInput.value = '';
    searchType.value = 'all';
    locationFilter.value = '';
    treatmentFilter.value = '';
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
    associationFacilityInfo.innerHTML = `
        <p><strong>${facility.name}</strong></p>
        <p>${facility.address}</p>
        <p>Phone: ${facility.phone}</p>
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