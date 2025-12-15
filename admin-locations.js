// Location Tracking Functionality

function loadLocations() {
    // Get all users with their locations
    const allUsers = localStorage.getItem('allUsers');
    const users = allUsers ? JSON.parse(allUsers) : [];
    
    // Also get default users from auth.js structure
    const defaultUsers = [
        { id: 'user', name: 'Factory Operator', location: 'Factory Floor A, Station 1', role: 'user' },
        { id: 'operator1', name: 'Operator 1', location: 'Factory Floor B, Station 2', role: 'user' },
        { id: 'admin', name: 'Administrator', location: 'Main Office', role: 'admin' }
    ];
    
    // Merge users, prioritizing stored users
    const allUsersList = [...users];
    defaultUsers.forEach(defaultUser => {
        if (!allUsersList.find(u => u.id === defaultUser.id)) {
            allUsersList.push(defaultUser);
        }
    });
    
    const locationsGrid = document.getElementById('locationsGrid');
    if (!locationsGrid) return;
    
    if (allUsersList.length === 0) {
        locationsGrid.innerHTML = '<p class="no-data">No locations found</p>';
        return;
    }
    
    // Group by location or show individual
    const locationMap = new Map();
    allUsersList.forEach(user => {
        const loc = user.location || 'No location set';
        if (!locationMap.has(loc)) {
            locationMap.set(loc, []);
        }
        locationMap.get(loc).push(user);
    });
    
    // Get additional stats for each location
    const allRecords = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    
    function getLocationStats(locationName, locationUsers) {
        const userUsernames = locationUsers.map(u => u.username || u.id || u.name);
        const locationRecords = allRecords.filter(r => userUsernames.includes(r.operator));
        const locationSessions = allSessions.filter(s => userUsernames.includes(s.operator));
        const completedSessions = locationSessions.filter(s => s.endTime);
        const totalPellets = locationRecords.reduce((sum, r) => sum + (parseInt(r.totalPellets) || 0), 0);
        
        return {
            records: locationRecords.length,
            sessions: completedSessions.length,
            pellets: totalPellets,
            operators: locationUsers.filter(u => u.role !== 'admin').length,
            admins: locationUsers.filter(u => u.role === 'admin').length
        };
    }
    
    locationsGrid.innerHTML = Array.from(locationMap.entries()).map(([location, users]) => {
        const stats = getLocationStats(location, users);
        const isActive = users.length > 0;
        
        return `
        <div class="location-card-enhanced">
            <div class="location-card-header-enhanced">
                <div class="location-header-main">
                    <div class="location-icon-enhanced">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="location-info-enhanced">
                        <h3 class="location-name">${location}</h3>
                        <div class="location-meta">
                            <span class="location-type-badge">${location.includes('Factory') ? 'Factory Floor' : location.includes('Office') ? 'Office' : location.includes('Lab') ? 'Laboratory' : 'Location'}</span>
                        </div>
                    </div>
                </div>
                <div class="location-status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="6" fill="currentColor"/>
                    </svg>
                    <span>${isActive ? 'Active' : 'Inactive'}</span>
                </div>
            </div>
            
            <div class="location-stats-section">
                <div class="location-stat-item">
                    <div class="stat-icon-wrapper stat-users">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${users.length}</div>
                        <div class="stat-label">User${users.length !== 1 ? 's' : ''}</div>
                        <div class="stat-breakdown">${stats.operators} Operator${stats.operators !== 1 ? 's' : ''}, ${stats.admins} Admin${stats.admins !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div class="location-stat-item">
                    <div class="stat-icon-wrapper stat-records">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 2V8H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.records}</div>
                        <div class="stat-label">Records</div>
                    </div>
                </div>
                <div class="location-stat-item">
                    <div class="stat-icon-wrapper stat-sessions">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.sessions}</div>
                        <div class="stat-label">Sessions</div>
                    </div>
                </div>
                <div class="location-stat-item">
                    <div class="stat-icon-wrapper stat-pellets">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${stats.pellets.toLocaleString()}</div>
                        <div class="stat-label">Pellets</div>
                    </div>
                </div>
            </div>
            
            <div class="location-users-section">
                <div class="section-divider">
                    <span class="divider-text">Assigned Users</span>
                </div>
                <div class="location-users-list">
                    ${users.map(user => {
                        const userRecords = allRecords.filter(r => (r.operator === user.username || r.operator === user.id || r.operator === user.name)).length;
                        const userSessions = allSessions.filter(s => (s.operator === user.username || s.operator === user.id || s.operator === user.name)).length;
                        const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                        const roleColor = user.role === 'admin' ? '#ef4444' : '#00AFE0';
                        
                        return `
                        <div class="location-user-item-enhanced">
                            <div class="user-avatar-enhanced" style="background: linear-gradient(135deg, ${roleColor}, ${roleColor}dd);">
                                ${initials}
                            </div>
                            <div class="user-details-enhanced">
                                <div class="user-name-row">
                                    <span class="user-name-enhanced">${user.name}</span>
                                    <span class="user-role-badge ${user.role === 'admin' ? 'role-admin' : 'role-operator'}">${user.role === 'admin' ? 'Admin' : 'Operator'}</span>
                                </div>
                                ${user.idNumber ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">ID Number: ${user.idNumber}</div>` : ''}
                                <div class="user-stats-row">
                                    <span class="user-stat-mini">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8L14 2Z" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                        ${userRecords} records
                                    </span>
                                    <span class="user-stat-mini">
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2"/>
                                        </svg>
                                        ${userSessions} sessions
                                    </span>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    }).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-locations.html')) {
        // Update sidebar account info
        if (typeof updateSidebarAccount === 'function') {
            updateSidebarAccount();
        }
        loadLocations();
        // Refresh every 5 seconds
        setInterval(loadLocations, 5000);
    }
});



