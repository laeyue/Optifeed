// User Management Functionality - Database Version

let allUsers = [];
let currentFilter = 'all';

// Load users from API
async function loadUsers() {
    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USERS_STATS);
        
        if (!result.success) {
            console.error('Failed to load users:', result);
            return;
        }

        allUsers = result.users;
        updateStats();
        renderUsers();

    } catch (error) {
        console.error('Failed to load users:', error);
        showNotification('Failed to load users', 'error');
    }
}

// Update stats bar
function updateStats() {
    const admins = allUsers.filter(u => u.role === 'admin');
    const operators = allUsers.filter(u => u.role === 'user');
    const totalSessions = allUsers.reduce((sum, u) => sum + (u.stats?.totalSessions || 0), 0);

    const totalEl = document.getElementById('totalUsersCount');
    const adminsEl = document.getElementById('adminsCount');
    const operatorsEl = document.getElementById('operatorsCount');
    const sessionsEl = document.getElementById('totalSessionsCount');

    if (totalEl) totalEl.textContent = allUsers.length;
    if (adminsEl) adminsEl.textContent = admins.length;
    if (operatorsEl) operatorsEl.textContent = operators.length;
    if (sessionsEl) sessionsEl.textContent = totalSessions.toLocaleString();
}

// Filter users
function filterUsers() {
    renderUsers();
}

// Set filter
function setUserFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    renderUsers();
}

// Render users
function renderUsers() {
    const usersGrid = document.getElementById('usersGrid');
    if (!usersGrid) return;

    const searchTerm = (document.getElementById('userSearchInput')?.value || '').toLowerCase();
    
    let filteredUsers = allUsers.filter(user => {
        const matchesFilter = currentFilter === 'all' || user.role === currentFilter;
        const matchesSearch = !searchTerm || 
            user.name.toLowerCase().includes(searchTerm) ||
            user.username.toLowerCase().includes(searchTerm) ||
            (user.email && user.email.toLowerCase().includes(searchTerm));
        return matchesFilter && matchesSearch;
    });

    if (filteredUsers.length === 0) {
        usersGrid.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; color: #64748b;">
                <svg style="width: 48px; height: 48px; margin: 0 auto 1rem; opacity: 0.5;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p style="margin: 0; font-size: 1rem;">No users found</p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; opacity: 0.7;">Try adjusting your search or filter</p>
            </div>
        `;
        return;
    }

    const admins = filteredUsers.filter(u => u.role === 'admin');
    const operators = filteredUsers.filter(u => u.role === 'user');

    function renderUserCard(user) {
        const stats = user.stats || {};
        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
        
        return `
            <div class="user-card-enhanced" data-user-id="${user.id}" data-role="${user.role}">
                <div class="user-card-header-enhanced">
                    <div class="user-avatar-enhanced ${user.role}">${initials}</div>
                    <div class="user-info-enhanced">
                        <h4>${user.name || 'Unnamed User'}</h4>
                        <div class="username">@${user.username}</div>
                    </div>
                    <span class="user-role-badge ${user.role}">${user.role === 'admin' ? 'Admin' : 'Operator'}</span>
                </div>
                <div class="user-card-body-enhanced">
                    <div class="user-contact-row">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 8L10.89 13.26C11.54 13.67 12.46 13.67 13.11 13.26L21 8M5 19H19C20.1 19 21 18.1 21 17V7C21 5.9 20.1 5 19 5H5C3.9 5 3 5.9 3 7V17C3 18.1 3.9 19 5 19Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>${user.email || 'No email provided'}</span>
                    </div>
                    ${user.location ? `
                    <div class="user-contact-row">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>${user.location}</span>
                    </div>
                    ` : ''}
                    ${user.idNumber ? `
                    <div class="user-contact-row">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M7 8h4M7 12h10M7 16h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>ID: ${user.idNumber}</span>
                    </div>
                    ` : ''}
                    <div class="user-stats-row">
                        <div class="user-stat-item">
                            <div class="value">${stats.totalSessions || 0}</div>
                            <div class="label">Sessions</div>
                        </div>
                        <div class="user-stat-item">
                            <div class="value">${stats.completedSessions || 0}</div>
                            <div class="label">Completed</div>
                        </div>
                        <div class="user-stat-item">
                            <div class="value">${stats.totalRecords || 0}</div>
                            <div class="label">Records</div>
                        </div>
                        <div class="user-stat-item">
                            <div class="value">${formatNumber(stats.totalPellets || 0)}</div>
                            <div class="label">Pellets</div>
                        </div>
                    </div>
                </div>
                <div class="user-card-footer-enhanced">
                    <button class="btn-view" onclick="viewUserDetails(${user.id})">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        View
                    </button>
                    <button class="btn-edit-user" onclick="editUser(${user.id})">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Edit
                    </button>
                    ${user.role !== 'admin' || allUsers.filter(u => u.role === 'admin').length > 1 ? `
                    <button class="btn-delete-user" onclick="deleteUser(${user.id})">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Delete
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    let html = '';

    // Administrators Section
    if (admins.length > 0 && (currentFilter === 'all' || currentFilter === 'admin')) {
        html += `
            <div class="users-section-enhanced">
                <div class="section-header-enhanced" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="display: flex; align-items: center; gap: 0.75rem; font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0;">
                        <svg style="width: 28px; height: 28px; color: #8b5cf6;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15C15.866 15 19 16.343 19 18V19H5V18C5 16.343 8.134 15 12 15Z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
                            <path d="M18 8L20 6M20 6L22 8M20 6V10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Administrators
                    </h3>
                    <span class="badge" style="background: #f3e8ff; color: #8b5cf6; padding: 0.5rem 1rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 600;">${admins.length} user${admins.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="users-grid-enhanced">
                    ${admins.map(renderUserCard).join('')}
                </div>
            </div>
        `;
    }

    // Operators Section
    if (operators.length > 0 && (currentFilter === 'all' || currentFilter === 'user')) {
        html += `
            <div class="users-section-enhanced">
                <div class="section-header-enhanced" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid #f1f5f9;">
                    <h3 style="display: flex; align-items: center; gap: 0.75rem; font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0;">
                        <svg style="width: 28px; height: 28px; color: #2FA76E;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Factory Operators
                    </h3>
                    <span class="badge" style="background: #ecfdf5; color: #2FA76E; padding: 0.5rem 1rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 600;">${operators.length} user${operators.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="users-grid-enhanced">
                    ${operators.map(renderUserCard).join('')}
                </div>
            </div>
        `;
    }

    usersGrid.innerHTML = html;
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Edit user
async function editUser(userId) {
    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USERS_STATS);
        const user = result.users.find(u => u.id === userId);
        
        if (!user) {
            showNotification('User not found', 'error');
            return;
        }
        
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('userModalTitle');
        
        if (!modal || !form || !title) return;
        
        // Load locations from database first
        await loadLocationsForUserModal();
        
        title.textContent = 'Edit User';
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userUsername').value = user.username || '';
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = false;
        document.getElementById('userRole').value = user.role || 'user';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userLocation').value = user.location || '';
        document.getElementById('userIdNumber').value = user.idNumber || '';
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Failed to load user for editing:', error);
        showNotification('Failed to load user', 'error');
    }
}

// View user details
async function viewUserDetails(userId) {
    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USERS_STATS);
        const user = result.users.find(u => u.id === userId);
        
        if (!user) {
            showNotification('User not found', 'error');
            return;
        }
        
        // Use the showUserDetails function from admin-records-db.js if available
        if (typeof showUserDetails === 'function') {
            showUserDetails(user.username);
        } else {
            // Fallback to alert if function not available
            const stats = user.stats || {};
            const details = `
User Details:
Name: ${user.name}
Username: ${user.username}
Email: ${user.email || 'N/A'}
Phone: ${user.phone || 'N/A'}
Location: ${user.location || 'N/A'}
Role: ${user.role}
ID Number: ${user.idNumber || 'N/A'}

Statistics:
Total Sessions: ${stats.totalSessions || 0}
Completed Sessions: ${stats.completedSessions || 0}
Total Records: ${stats.totalRecords || 0}
Total Pellets: ${stats.totalPellets || 0}

Created: ${new Date(user.createdAt).toLocaleString()}
Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
            `;
            alert(details);
        }
    } catch (error) {
        console.error('Failed to load user details:', error);
        showNotification('Failed to load user details', 'error');
    }
}

// Save user (create or update)
async function saveUser(userId) {
    try {
        const form = document.getElementById('userForm');
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            phone: document.getElementById('userPhone').value,
            location: document.getElementById('userLocation').value,
            role: document.getElementById('userRole').value
        };
        
        const password = document.getElementById('userPassword').value;
        if (password) {
            userData.password = password;
        }
        
        let result;
        if (userId) {
            // Update existing user
            result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USER_UPDATE(userId), {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        } else {
            // Create new user
            userData.username = document.getElementById('userUsername').value;
            if (!userData.username || !userData.name) {
                showNotification('Username and name are required', 'error');
                return;
            }
            result = await apiRequest(API_CONFIG.ENDPOINTS.SIGNUP, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }
        
        if (result.success || result.user) {
            showNotification(userId ? 'User updated successfully' : 'User created successfully', 'success');
            closeUserModal();
            loadUsers();
        } else {
            showNotification(result.error || 'Failed to save user', 'error');
        }
    } catch (error) {
        console.error('Failed to save user:', error);
        showNotification(error.message || 'Failed to save user', 'error');
    }
}

// Load locations from database for user modal
async function loadLocationsForUserModal() {
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_LOCATIONS_STATS);
        const userLocation = document.getElementById('userLocation');
        
        if (userLocation && response.success && response.locations) {
            // Store current value before clearing
            const currentValue = userLocation.value;
            
            // Clear existing options
            userLocation.innerHTML = '<option value="">Select a location</option>';
            
            // Add locations from database
            response.locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location.name;
                option.textContent = location.name;
                userLocation.appendChild(option);
            });
            
            // Restore previous value if it exists
            if (currentValue) {
                userLocation.value = currentValue;
            }
        }
    } catch (error) {
        console.error('Failed to load locations:', error);
        // Keep default hardcoded locations as fallback
    }
}

// Open add user modal
async function openAddUserModal() {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');
    
    if (!modal || !form || !title) return;
    
    title.textContent = 'Add New User';
    form.reset();
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').required = true;
    
    // Load locations from database
    await loadLocationsForUserModal();
    
    modal.style.display = 'block';
}

// Close user modal
function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This will permanently delete their account and all associated data.')) return;

    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USER_DELETE(userId), {
            method: 'DELETE'
        });

        if (result.success) {
            showNotification('User and all associated data deleted successfully', 'success');
            
            // Reload users list
            await loadUsers();
            
            // Refresh all charts that might display user data
            if (typeof window.updateAdminCharts === 'function') {
                await window.updateAdminCharts();
            }
            
            // Refresh admin dashboard if on that page
            if (typeof loadDashboardStats === 'function') {
                await loadDashboardStats();
            }
            
            // Refresh admin records page if on that page
            if (typeof loadAllUsersDataSummary === 'function') {
                await loadAllUsersDataSummary();
            }
            
            // Refresh admin monitoring page if on that page
            if (typeof loadMonitoringData === 'function') {
                await loadMonitoringData();
            }
            
        } else {
            showNotification(result.message || 'Failed to delete user', 'error');
        }

    } catch (error) {
        console.error('Failed to delete user:', error);
        showNotification(error.message || 'Failed to delete user', 'error');
    }
}

// Initialize users page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-users.html')) {
        loadUsers();
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
window.loadUsers = loadUsers;
window.editUser = editUser;
window.viewUserDetails = viewUserDetails;
window.deleteUser = deleteUser;
window.openAddUserModal = openAddUserModal;
window.closeUserModal = closeUserModal;
window.saveUser = saveUser;
window.filterUsers = filterUsers;
window.setUserFilter = setUserFilter;
