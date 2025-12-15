// Location Management Functionality - Database Version

// Store all locations for filtering
let allLocations = [];
let currentLocationFilter = 'all';
let currentLocationView = 'grid';

// Load locations from API
async function loadLocations() {
    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_LOCATIONS_STATS);
        
        if (!result.success) {
            console.error('Failed to load locations:', result);
            return;
        }

        allLocations = result.locations;
        const locationsGrid = document.getElementById('locationsGrid');

        if (!locationsGrid) return;

        // Update stats bar
        updateLocationsStats(allLocations);

        // Render locations
        await renderLocations(allLocations);

    } catch (error) {
        console.error('Failed to load locations:', error);
        showNotification('Failed to load locations', 'error');
    }
}

// Update stats bar
function updateLocationsStats(locations) {
    const totalLocations = locations.length;
    
    // Get total users, records, and sensors
    let totalUsers = 0;
    let totalRecords = 0;
    let totalSensors = 0;
    locations.forEach(location => {
        const stats = location.stats || {};
        totalUsers += stats.users || 0;
        totalRecords += stats.records || 0;
        totalSensors += stats.sensors || 0;
    });

    const totalLocationsEl = document.getElementById('totalLocationsCount');
    const totalUsersEl = document.getElementById('totalUsersCount');
    const totalRecordsEl = document.getElementById('totalRecordsCount');
    const totalSensorsEl = document.getElementById('totalSensorsCount');

    if (totalLocationsEl) totalLocationsEl.textContent = totalLocations;
    if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    if (totalRecordsEl) totalRecordsEl.textContent = totalRecords;
    if (totalSensorsEl) totalSensorsEl.textContent = totalSensors;
}

// Render locations
async function renderLocations(locations) {
    const locationsGrid = document.getElementById('locationsGrid');

    if (!locationsGrid) return;

    if (locations.length === 0) {
        locationsGrid.innerHTML = `
            <div class="no-data-container">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p class="no-data">No locations found. Add your first location!</p>
            </div>
        `;
        return;
    }

    // Get all users to populate location user lists
    let allUsers = [];
    try {
        const usersResult = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USERS_STATS);
        allUsers = usersResult.users || [];
    } catch (error) {
        console.error('Failed to load users for locations:', error);
    }
    
    let html = '';
    locations.forEach(location => {
            const stats = location.stats || {};
            const locationUsers = allUsers.filter(u => u.location === location.name);
            
        const locationId = location.id || 'new';
        const isFromTable = location.isFromTable !== false; // Default to true if not specified
        const locationBadge = !isFromTable ? '<span style="display: inline-block; margin-left: 0.5rem; padding: 0.25rem 0.5rem; background: #fef3c7; color: #d97706; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600;">User-Assigned</span>' : '';
        
        html += `
            <div class="location-card-enhanced" data-location-id="${locationId}" data-location-name="${location.name.toLowerCase()}" data-location-status="${stats.users > 0 ? 'active' : 'inactive'}" data-is-from-table="${isFromTable}">
                <div class="location-card-header-enhanced">
                    <div class="location-icon-enhanced">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="location-info-enhanced">
                        <h4>${location.name}${locationBadge}</h4>
                        <div class="location-type">${location.address || (isFromTable ? 'Setup Location' : 'User-assigned location')}</div>
                    </div>
                    <span class="location-status-badge ${stats.users > 0 ? 'active' : 'inactive'}">
                        ${stats.users > 0 ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="location-card-body-enhanced">
                    ${location.description ? `
                    <div class="location-description">
                        <svg style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; margin-right: 0.5rem; color: #64748b;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
                        </svg>
                        ${location.description}
                    </div>
                    ` : ''}
                    ${location.createdAt ? `
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.75rem; padding: 0 0.75rem;">
                        <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Created ${new Date(location.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    ` : ''}
                    <div class="location-stats-section">
                        <div class="location-stat-item">
                            <div class="value">${stats.users || 0}</div>
                            <div class="label">Users</div>
                        </div>
                        <div class="location-stat-item">
                            <div class="value">${stats.sessions || locationUsers.reduce((sum, u) => sum + ((u.stats || {}).completedSessions || 0), 0)}</div>
                            <div class="label">Sessions</div>
                        </div>
                        <div class="location-stat-item">
                            <div class="value">${stats.records || locationUsers.reduce((sum, u) => sum + ((u.stats || {}).totalRecords || 0), 0)}</div>
                            <div class="label">Records</div>
                        </div>
                        <div class="location-stat-item">
                            <div class="value">${stats.sensors || 0}</div>
                            <div class="label">Sensors</div>
                        </div>
                    </div>
                    ${locationUsers.length > 0 ? `
                    <div class="location-users-section">
                        <div class="section-divider">
                            <span class="divider-text">Users at this Location</span>
                        </div>
                        <div class="location-users-list">
                            ${locationUsers.slice(0, 5).map(user => {
                                const userStats = user.stats || {};
                                return `
                                    <div class="location-user-item-enhanced">
                                        <div class="user-avatar-enhanced" style="background: linear-gradient(135deg, #2FA76E, #4ECDC4);">
                                            ${(user.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div class="user-details-enhanced">
                                            <div class="user-name-row">
                                                <span class="user-name-enhanced">${user.name}</span>
                                                <span class="user-role-badge role-${user.role}">${user.role === 'admin' ? 'Admin' : 'Operator'}</span>
                                            </div>
                                            <div class="user-stats-row">
                                                <span class="user-stat-mini">
                                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8L14 2Z" stroke="currentColor" stroke-width="2"/>
                                                    </svg>
                                                    ${userStats.totalRecords || 0} Records
                                                </span>
                                                <span class="user-stat-mini">
                                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2"/>
                                                    </svg>
                                                    ${userStats.completedSessions || 0} Sessions
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                            ${locationUsers.length > 5 ? `<p style="text-align: center; padding: 1rem; color: var(--text-secondary); font-size: 0.875rem;">+${locationUsers.length - 5} more users</p>` : ''}
                        </div>
                    </div>
                    ` : ''}
                    <div class="location-card-footer-enhanced">
                        <button class="btn-view-location" onclick="viewLocationDetails(${location.id ? location.id : 'null'}, '${location.name}')">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            View
                        </button>
                        ${isFromTable ? `
                        <button class="btn-edit-location" onclick="editLocation(${location.id})">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2"/>
                                <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Edit
                        </button>
                        <button class="btn-delete-location" onclick="deleteLocation(${location.id})">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Delete
                        </button>
                        ` : `
                        <button class="btn-edit-location" onclick="createLocationFromUser('${location.name}')" style="flex: 1;">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            Create Location
                        </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    });

    locationsGrid.innerHTML = html;
    
    // Apply current view
    applyLocationView();
}

// Apply location view (grid/list)
function applyLocationView() {
    const locationsGrid = document.getElementById('locationsGrid');
    if (!locationsGrid) return;
    
    locationsGrid.classList.remove('list-view');
    if (currentLocationView === 'list') {
        locationsGrid.classList.add('list-view');
    }
}

// Set location view
function setLocationView(view) {
    currentLocationView = view;
    
    // Update view toggle buttons
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('active');
        }
    });
    
    applyLocationView();
}

// Open add location modal
function openAddLocationModal() {
    const modal = document.getElementById('locationModal');
    if (!modal) return;

    // Reset form
    document.getElementById('locationId').value = '';
    document.getElementById('locationName').value = '';
    document.getElementById('locationDescription').value = '';
    document.getElementById('locationAddress').value = '';
    document.getElementById('locationModalTitle').textContent = 'Add New Location';
    
    modal.style.display = 'block';
}

// Close location modal
function closeLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save location (create or update)
async function saveLocation() {
    try {
        const locationId = document.getElementById('locationId').value;
        const name = document.getElementById('locationName').value.trim();
        const description = document.getElementById('locationDescription').value.trim();
        const address = document.getElementById('locationAddress').value.trim();

        if (!name) {
            showNotification('Location name is required', 'error');
            return;
        }

        // Check if API_CONFIG is available
        if (typeof API_CONFIG === 'undefined' || !API_CONFIG.ENDPOINTS) {
            console.error('API_CONFIG is not defined');
            showNotification('Configuration error: API endpoints not available', 'error');
            return;
        }

        // Verify endpoints exist
        if (!API_CONFIG.ENDPOINTS.ADMIN_LOCATION_CREATE) {
            console.error('ADMIN_LOCATION_CREATE endpoint not found');
            showNotification('Error: Create location endpoint not configured', 'error');
            return;
        }

        if (locationId && !API_CONFIG.ENDPOINTS.ADMIN_LOCATION_UPDATE) {
            console.error('ADMIN_LOCATION_UPDATE endpoint not found');
            showNotification('Error: Update location endpoint not configured', 'error');
            return;
        }

        let endpoint;
        let method;
        const bodyData = { name, description, address };

        if (locationId) {
            // Update existing location
            if (typeof API_CONFIG.ENDPOINTS.ADMIN_LOCATION_UPDATE === 'function') {
                endpoint = API_CONFIG.ENDPOINTS.ADMIN_LOCATION_UPDATE(locationId);
            } else if (API_CONFIG.ENDPOINTS.ADMIN_LOCATION_UPDATE) {
                endpoint = API_CONFIG.ENDPOINTS.ADMIN_LOCATION_UPDATE.replace(':id', locationId);
            } else {
                endpoint = `/admin/locations/${locationId}`;
            }
            method = 'PUT';
        } else {
            // Create new location
            if (API_CONFIG.ENDPOINTS.ADMIN_LOCATION_CREATE) {
                endpoint = API_CONFIG.ENDPOINTS.ADMIN_LOCATION_CREATE;
            } else {
                endpoint = '/admin/locations';
            }
            method = 'POST';
        }

        if (!endpoint) {
            console.error('Endpoint is undefined', { 
                locationId, 
                endpoint, 
                endpoints: API_CONFIG.ENDPOINTS,
                hasCreate: !!API_CONFIG.ENDPOINTS.ADMIN_LOCATION_CREATE,
                hasUpdate: !!API_CONFIG.ENDPOINTS.ADMIN_LOCATION_UPDATE
            });
            showNotification('Error: API endpoint not found. Please refresh the page.', 'error');
            return;
        }

        const fullUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
        console.log('Saving location:', { endpoint, method, bodyData, fullUrl });

        const result = await apiRequest(endpoint, {
            method: method,
            body: JSON.stringify(bodyData)
        });

        if (result.success) {
            showNotification(
                locationId ? 'Location updated successfully' : 'Location created successfully',
                'success'
            );
            closeLocationModal();
            // Reload locations
            await loadLocations();
        } else {
            showNotification(result.error || 'Failed to save location', 'error');
        }
    } catch (error) {
        console.error('Save location error:', error);
        showNotification(error.message || 'Failed to save location', 'error');
    }
}

// Filter locations by search query
async function filterLocations() {
    const searchInput = document.getElementById('locationSearchInput');
    if (!searchInput) return;

    const searchQuery = searchInput.value.toLowerCase().trim();
    let filtered = allLocations;

    // Apply search filter
    if (searchQuery) {
        filtered = filtered.filter(location => 
            location.name.toLowerCase().includes(searchQuery) ||
            (location.description && location.description.toLowerCase().includes(searchQuery))
        );
    }

    // Apply status filter
    if (currentLocationFilter !== 'all') {
        filtered = filtered.filter(location => {
            const stats = location.stats || {};
            const isActive = stats.users > 0;
            return currentLocationFilter === 'active' ? isActive : !isActive;
        });
    }

    await renderLocations(filtered);
    updateLocationsStats(filtered);
}

// Set location filter
async function setLocationFilter(filter) {
    currentLocationFilter = filter;
    
    // Update filter tab active states
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-filter') === filter) {
            tab.classList.add('active');
        }
    });

    await filterLocations();
}

// Edit location
async function editLocation(locationId) {
    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_LOCATIONS_STATS);
        const location = result.locations.find(l => l.id === locationId);
        
        if (!location) {
            showNotification('Location not found', 'error');
            return;
        }
        
        // Open modal with location data
        const modal = document.getElementById('locationModal');
        if (!modal) {
            showNotification('Location modal not found', 'error');
            return;
        }

        document.getElementById('locationId').value = location.id;
        document.getElementById('locationName').value = location.name || '';
        document.getElementById('locationDescription').value = location.description || '';
        document.getElementById('locationAddress').value = location.address || '';
        document.getElementById('locationModalTitle').textContent = 'Edit Location';
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Failed to load location:', error);
        showNotification('Failed to load location', 'error');
    }
}

// Create location from user-assigned location
async function createLocationFromUser(locationName) {
    try {
        // Pre-fill the modal with the location name
        const modal = document.getElementById('locationModal');
        if (!modal) {
            showNotification('Location modal not found', 'error');
            return;
        }

        document.getElementById('locationId').value = '';
        document.getElementById('locationName').value = locationName;
        document.getElementById('locationDescription').value = '';
        document.getElementById('locationAddress').value = '';
        document.getElementById('locationModalTitle').textContent = 'Create Location';
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error opening create location modal:', error);
        showNotification('Failed to open create location form', 'error');
    }
}

// View location details with users - data from database
async function viewLocationDetails(locationId, locationName) {
    try {
        const locationsResult = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_LOCATIONS_STATS);
        let location;
        
        if (locationId === null || locationId === 'null' || locationId === undefined) {
            // This is a user-assigned location, find it by name
            location = locationsResult.locations.find(l => l.name === locationName && (l.id === null || !l.id));
        } else {
            // This is a location from the locations table
            location = locationsResult.locations.find(l => l.id === parseInt(locationId));
        }
        
        if (!location) {
            showNotification('Location not found', 'error');
            return;
        }
        
        // Get all users to find users at this location from database
        const usersResult = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USERS_STATS);
        const locationUsers = (usersResult.users || []).filter(u => u.location === location.name);
        
        // Get sessions and records for this location's users from database
        let sessionsResult, recordsResult;
        try {
            sessionsResult = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS);
            recordsResult = await apiRequest(API_CONFIG.ENDPOINTS.RECORDS);
        } catch (error) {
            console.error('Failed to load sessions/records:', error);
            sessionsResult = { sessions: [] };
            recordsResult = { records: [] };
        }
        
        const locationUserIds = locationUsers.map(u => u.id);
        const locationSessions = (sessionsResult.sessions || []).filter(s => locationUserIds.includes(s.user_id));
        const locationRecords = (recordsResult.records || []).filter(r => locationUserIds.includes(r.user_id));
        
        // Calculate location statistics from database
        const totalSessions = locationSessions.length;
        const completedSessions = locationSessions.filter(s => s.status === 'completed').length;
        const totalRecords = locationRecords.length;
        const totalPellets = locationRecords.reduce((sum, r) => sum + (parseInt(r.total_pellets) || 0), 0);
        
        const stats = location.stats || {};
        
        // Remove existing modal if present
        const existingModal = document.getElementById('locationDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'locationDetailsModal';
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2 style="display: flex; align-items: center; gap: 0.75rem;">
                        <svg style="width: 24px; height: 24px; color: var(--primary-color, #2FA76E);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        ${location.name} - Details
                    </h2>
                    <span class="close" onclick="closeLocationDetailsModal()">&times;</span>
                </div>
                <div style="padding: 2rem;">
                    <div style="margin-bottom: 2rem;">
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem;">
                            <svg style="width: 20px; height: 20px; color: var(--primary-color, #2FA76E);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            Location Information
                        </h3>
                        <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                <div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Name</div>
                                    <div style="font-size: 1rem; font-weight: 600; color: #1e293b;">${location.name}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Created</div>
                                    <div style="font-size: 1rem; font-weight: 600; color: #1e293b;">${new Date(location.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                </div>
                                ${location.description ? `
                                <div style="grid-column: 1 / -1;">
                                    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Description</div>
                                    <div style="font-size: 1rem; font-weight: 600; color: #1e293b;">${location.description}</div>
                                </div>
                                ` : ''}
                                ${location.address ? `
                                <div style="grid-column: 1 / -1;">
                                    <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Address</div>
                                    <div style="font-size: 1rem; font-weight: 600; color: #1e293b;">${location.address}</div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Statistics Grid from Database -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
                        <div style="background: white; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: 700; color: #2FA76E; margin-bottom: 0.25rem;">${stats.users || 0}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px;">Users</div>
                            <div style="font-size: 0.6875rem; color: #94a3b8; margin-top: 0.25rem;">${stats.operators || 0} Operators, ${stats.admins || 0} Admins</div>
                        </div>
                        <div style="background: white; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: 700; color: #4ECDC4; margin-bottom: 0.25rem;">${totalSessions}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px;">Sessions</div>
                            <div style="font-size: 0.6875rem; color: #94a3b8; margin-top: 0.25rem;">${completedSessions} completed</div>
                        </div>
                        <div style="background: white; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: 700; color: #FF6B6B; margin-bottom: 0.25rem;">${totalRecords.toLocaleString()}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px;">Records</div>
                        </div>
                        <div style="background: white; padding: 1.25rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: 700; color: #8b5cf6; margin-bottom: 0.25rem;">${totalPellets.toLocaleString()}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px;">Pellets</div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem;">
                            <svg style="width: 20px; height: 20px; color: var(--primary-color, #2FA76E);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21V19C17 16.791 15.209 15 13 15H5C2.791 15 1 16.791 1 19V21"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21V19C23 17.139 21.807 15.52 20.169 15"/>
                                <path d="M17 1C18.648 1.629 19.84 3.246 19.84 5.115C19.84 6.984 18.648 8.601 17 9.23"/>
                            </svg>
                            Users at this Location (${locationUsers.length})
                        </h3>
                        ${locationUsers.length === 0 ? '<p style="text-align: center; padding: 2rem; color: #64748b; background: #f8fafc; border-radius: 0.75rem; border: 1px solid #e2e8f0;">No users assigned to this location</p>' : ''}
                        <div style="max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem;">
                            ${locationUsers.map(user => {
                                const userStats = user.stats || {};
                                return `
                                    <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem; display: flex; align-items: center; gap: 1rem; transition: background 0.15s ease;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f8fafc'">
                                        <div style="width: 48px; height: 48px; border-radius: 10px; background: linear-gradient(135deg, #2FA76E, #4ECDC4); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1rem; flex-shrink: 0;">${(user.name || 'U').charAt(0).toUpperCase()}</div>
                                        <div style="flex: 1; min-width: 0;">
                                            <div style="font-size: 0.9375rem; font-weight: 600; color: #1e293b; margin-bottom: 0.125rem;">${user.name}</div>
                                            <div style="font-size: 0.8125rem; color: #64748b;">@${user.username} • <span style="display: inline-block; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; background: ${user.role === 'admin' ? '#fef2f2' : '#ecfdf5'}; color: ${user.role === 'admin' ? '#dc2626' : '#059669'};">${user.role === 'admin' ? 'Admin' : 'Operator'}</span></div>
                                        </div>
                                        <div style="display: flex; gap: 1.5rem; text-align: center;">
                                            <div>
                                                <div style="font-size: 1rem; font-weight: 700; color: #1e293b;">${userStats.totalRecords || 0}</div>
                                                <div style="font-size: 0.6875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Records</div>
                                            </div>
                                            <div>
                                                <div style="font-size: 1rem; font-weight: 700; color: #1e293b;">${userStats.completedSessions || 0}</div>
                                                <div style="font-size: 0.6875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Sessions</div>
                                            </div>
                                            <div>
                                                <div style="font-size: 1rem; font-weight: 700; color: #1e293b;">${(userStats.totalPellets || 0).toLocaleString()}</div>
                                                <div style="font-size: 0.6875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Pellets</div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                        <button class="btn-secondary" onclick="closeLocationDetailsModal()" style="padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600;">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.onclick = function(event) {
            if (event.target === modal) {
                closeLocationDetailsModal();
            }
        };
    } catch (error) {
        console.error('Failed to load location details:', error);
        showNotification('Failed to load location details', 'error');
    }
}

// Close location details modal
function closeLocationDetailsModal() {
    const modal = document.getElementById('locationDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Delete location
async function deleteLocation(locationId) {
    try {
        // Get location name for confirmation
        const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_LOCATIONS_STATS);
        const location = result.locations.find(l => l.id === locationId);
        
        if (!location) {
            showNotification('Location not found', 'error');
            return;
        }

        // Confirm deletion
        const confirmed = confirm(
            `Are you sure you want to delete "${location.name}"?\n\n` +
            `This action cannot be undone. Make sure no users or sensors are assigned to this location.`
        );

        if (!confirmed) {
            return;
        }

        // Delete location
        const deleteResult = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_LOCATION_DELETE(locationId), {
            method: 'DELETE'
        });

        if (deleteResult.success) {
            showNotification('Location deleted successfully', 'success');
            // Reload locations
            await loadLocations();
        } else {
            showNotification(deleteResult.error || 'Failed to delete location', 'error');
        }
    } catch (error) {
        console.error('Delete location error:', error);
        showNotification(error.message || 'Failed to delete location', 'error');
    }
}

// Initialize locations page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-locations.html')) {
        loadLocations();
        
        // Setup modal close on backdrop click
        const locationModal = document.getElementById('locationModal');
        if (locationModal) {
            locationModal.onclick = function(event) {
                if (event.target === locationModal) {
                    closeLocationModal();
                }
            };
        }
    }
});

// Show notification helper
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Make functions globally available
window.loadLocations = loadLocations;
window.editLocation = editLocation;
window.viewLocationDetails = viewLocationDetails;
window.deleteLocation = deleteLocation;
window.closeLocationDetailsModal = closeLocationDetailsModal;
window.filterLocations = filterLocations;
window.setLocationFilter = setLocationFilter;
window.setLocationView = setLocationView;
window.openAddLocationModal = openAddLocationModal;
window.closeLocationModal = closeLocationModal;
window.saveLocation = saveLocation;
window.createLocationFromUser = createLocationFromUser;

