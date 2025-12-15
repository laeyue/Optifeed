// User Management Functionality

// Function to generate a unique 5-digit ID number
function generateIdNumber() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Initialize users from localStorage or default users
function getUsers() {
    const storedUsers = localStorage.getItem('allUsers');
    if (storedUsers) {
        const users = JSON.parse(storedUsers);
        // Ensure all users have ID numbers
        let updated = false;
        users.forEach(user => {
            if (!user.idNumber) {
                user.idNumber = generateIdNumber();
                updated = true;
            }
        });
        if (updated) {
            localStorage.setItem('allUsers', JSON.stringify(users));
        }
        return users;
    }
    
    // Default users from auth.js
    const defaultUsers = {
        admin: {
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'Administrator',
            email: 'admin@optifeed.com',
            phone: '',
            location: 'Main Office',
            idNumber: generateIdNumber()
        },
        user: {
            username: 'user',
            password: 'user123',
            role: 'user',
            name: 'Factory Operator',
            email: 'operator@optifeed.com',
            phone: '',
            location: 'Factory Floor A, Station 1',
            idNumber: generateIdNumber()
        },
        operator1: {
            username: 'operator1',
            password: 'op123',
            role: 'user',
            name: 'Operator 1',
            email: 'operator1@optifeed.com',
            phone: '',
            location: 'Factory Floor B, Station 2',
            idNumber: generateIdNumber()
        }
    };
    
    // Convert to array format
    const usersArray = Object.keys(defaultUsers).map(key => ({
        id: key,
        ...defaultUsers[key]
    }));
    
    localStorage.setItem('allUsers', JSON.stringify(usersArray));
    return usersArray;
}

function saveUsers(users) {
    localStorage.setItem('allUsers', JSON.stringify(users));
}

// Load and display users organized by roles
function loadUsers() {
    const users = getUsers();
    const usersGrid = document.getElementById('usersGrid');
    
    if (!usersGrid) return;
    
    if (users.length === 0) {
        usersGrid.innerHTML = '<div class="no-data-container"><p class="no-data">No users found. Add your first user!</p></div>';
        return;
    }
    
    // Separate users by role
    const admins = users.filter(u => u.role === 'admin');
    const operators = users.filter(u => u.role === 'user');
    
    // Get user statistics
    const allRecords = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    
    function getUserStats(userId, username) {
        const userRecords = allRecords.filter(r => r.operator === username);
        const userSessions = allSessions.filter(s => s.operator === username);
        const completedSessions = userSessions.filter(s => s.endTime);
        const totalPellets = userRecords.reduce((sum, r) => sum + (parseInt(r.totalPellets) || 0), 0);
        
        return {
            records: userRecords.length,
            sessions: completedSessions.length,
            pellets: totalPellets
        };
    }
    
    function renderUserCard(user) {
        const stats = getUserStats(user.id, user.username);
        
        return `
            <div class="user-card" style="animation: fadeInUp 0.5s ease both;">
                <div class="user-card-header">
                    <div class="user-avatar-wrapper">
                        <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                        ${user.role === 'admin' ? `
                            <div class="user-status-badge admin-status">
                                <svg style="width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                                </svg>
                            </div>
                        ` : `
                            <div class="user-status-badge operator-status">
                                <svg style="width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="currentColor"/>
                                </svg>
                            </div>
                        `}
                    </div>
                    <div class="user-info">
                        <h3>${user.name}</h3>
                        <p class="user-username">@${user.username}</p>
                        ${user.idNumber ? `<p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">ID Number: ${user.idNumber}</p>` : ''}
                    </div>
                    <span class="user-role-badge role-${user.role}">${user.role === 'admin' ? 'Admin' : 'Operator'}</span>
                </div>
                <div class="user-card-body">
                    ${user.role !== 'admin' ? `
                    <div class="user-stats-row">
                        <div class="user-stat-item">
                            <div class="stat-value">${stats.records}</div>
                            <div class="stat-label">Records</div>
                        </div>
                        <div class="user-stat-item">
                            <div class="stat-value">${stats.sessions}</div>
                            <div class="stat-label">Sessions</div>
                        </div>
                        <div class="user-stat-item">
                            <div class="stat-value">${stats.pellets.toLocaleString()}</div>
                            <div class="stat-label">Pellets</div>
                        </div>
                    </div>
                    ` : ''}
                    <div class="user-details-list">
                        <div class="user-detail">
                            <svg class="detail-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2"/>
                                <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            <span>${user.email || 'No email provided'}</span>
                        </div>
                        ${user.phone ? `
                        <div class="user-detail">
                            <svg class="detail-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7292C21.7209 20.9841 21.5573 21.2126 21.3528 21.3992C21.1482 21.5857 20.9071 21.7261 20.6446 21.8112C20.3821 21.8962 20.104 21.924 19.83 21.892C16.7428 21.5856 13.787 20.5341 11.19 18.82C8.77382 17.3148 6.72533 15.2663 5.22001 12.85C3.50386 10.2412 2.45168 7.27099 2.14801 4.17C2.11599 3.89604 2.14381 3.61792 2.22884 3.35542C2.31387 3.09293 2.45424 2.85188 2.64076 2.64734C2.82729 2.44281 3.05575 2.2792 3.31072 2.16759C3.56569 2.05598 3.84139 1.99906 4.12001 2H7.12001C7.59769 1.99522 8.06806 2.16708 8.43396 2.48353C8.79986 2.79999 9.03841 3.23945 9.10001 3.72C9.22031 4.68007 9.45811 5.62273 9.81001 6.53C9.94478 6.88792 9.97348 7.27689 9.89256 7.64682C9.81164 8.01675 9.62496 8.35116 9.36001 8.61L8.09001 9.88C9.51355 12.4121 11.5879 14.4864 14.12 15.91L15.39 14.64C15.6488 14.375 15.9832 14.1884 16.3532 14.1075C16.7231 14.0265 17.1121 14.0552 17.47 14.19C18.3773 14.5419 19.3199 14.7797 20.28 14.9C20.7656 14.9626 21.2094 15.2055 21.5265 15.5777C21.8436 15.9499 22.0121 16.4264 22.01 16.92H22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <span>${user.phone}</span>
                        </div>
                        ` : ''}
                        <div class="user-detail">
                            <svg class="detail-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2"/>
                                <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            <span>${user.location || 'No location assigned'}</span>
                        </div>
                    </div>
                </div>
                <div class="user-card-actions">
                    <button class="btn-edit-enhanced" onclick="editUser('${user.id}')" title="Edit User">
                        <svg style="width: 20px; height: 20px; margin-right: 6px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Edit User
                    </button>
                    <button class="btn-danger" onclick="deleteUser('${user.id}')" ${user.role === 'admin' && getUsers().filter(u => u.role === 'admin').length === 1 ? 'disabled' : ''} title="Delete User">
                        <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }
    
    let html = '';
    
    // Administrators Section
    if (admins.length > 0) {
        html += `
            <div class="user-role-section">
                <div class="role-section-header">
                    <div class="role-header-content">
                        <svg class="role-section-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <div>
                            <h2 class="role-section-title">Administrators</h2>
                            <p class="role-section-subtitle">${admins.length} administrator${admins.length !== 1 ? 's' : ''} with full system access</p>
                        </div>
                    </div>
                    <div class="role-section-count">${admins.length}</div>
                </div>
                <div class="users-grid-by-role">
                    ${admins.map(user => renderUserCard(user)).join('')}
                </div>
            </div>
        `;
    }
    
    // Operators Section
    if (operators.length > 0) {
        html += `
            <div class="user-role-section">
                <div class="role-section-header">
                    <div class="role-header-content">
                        <svg class="role-section-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <div>
                            <h2 class="role-section-title">Factory Operators</h2>
                            <p class="role-section-subtitle">${operators.length} operator${operators.length !== 1 ? 's' : ''} managing pellet measurements</p>
                        </div>
                    </div>
                    <div class="role-section-count">${operators.length}</div>
                </div>
                <div class="users-grid-by-role">
                    ${operators.map(user => renderUserCard(user)).join('')}
                </div>
            </div>
        `;
    }
    
    usersGrid.innerHTML = html;
}

function openAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add New User';
    const userIdNumber = document.getElementById('userIdNumber');
    if (userIdNumber) {
        userIdNumber.value = '';
    }
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('userModal').style.display = 'block';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function editUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').required = false;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userLocation').value = user.location || '';
    const userIdNumber = document.getElementById('userIdNumber');
    if (userIdNumber) {
        userIdNumber.value = user.idNumber || 'Not assigned';
    }
    document.getElementById('userModal').style.display = 'block';
}

function deleteUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        console.warn('User not found:', userId);
        return;
    }
    
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
        alert('Cannot delete the last administrator! At least one admin account must remain.');
        return;
    }
    
    // Check if trying to delete current user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        alert('You cannot delete your own account while logged in. Please use another admin account.');
        return;
    }
    
    // Enhanced confirmation dialog
    const confirmed = confirm(`Are you sure you want to delete user "${user.name}"?\n\nThis action cannot be undone.`);
    
    if (confirmed) {
        const updatedUsers = users.filter(u => u.id !== userId);
        saveUsers(updatedUsers);
        loadUsers();
        
        // Show success message
        const message = document.createElement('div');
        message.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 1rem 1.5rem; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; animation: slideIn 0.3s ease;';
        message.textContent = `User "${user.name}" has been deleted successfully.`;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userId = document.getElementById('userId').value;
            const users = getUsers();
            
            const userData = {
                name: document.getElementById('userName').value,
                username: document.getElementById('userUsername').value,
                role: document.getElementById('userRole').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value,
                location: document.getElementById('userLocation').value
            };
            
            const password = document.getElementById('userPassword').value;
            if (password) {
                userData.password = password;
            }
            
            let oldUsername = null;
            if (userId) {
                // Edit existing user
                const index = users.findIndex(u => u.id === userId);
                if (index !== -1) {
                    oldUsername = users[index].username; // Store old username
                    const existingIdNumber = users[index].idNumber; // Preserve ID number
                    users[index] = { ...users[index], ...userData };
                    users[index].idNumber = existingIdNumber; // Ensure ID number is not changed
                    if (!password) {
                        // Keep existing password if not changed
                        delete users[index].password;
                    }
                }
            } else {
                // Add new user
                if (!password) {
                    alert('Password is required for new users');
                    return;
                }
                const newId = 'user_' + Date.now();
                users.push({ 
                    id: newId, 
                    ...userData,
                    idNumber: generateIdNumber() // Generate ID number for new user
                });
            }
            
            saveUsers(users);
            
            // Update all sessions if username changed
            if (oldUsername && oldUsername !== userData.username && typeof updateSessionOperators === 'function') {
                updateSessionOperators(oldUsername, userData.username);
            }
            
            // If the edited user is the currently logged-in user, update their session data
            const currentUser = getCurrentUser();
            if (currentUser && (userId === currentUser.id || userData.username === currentUser.username || oldUsername === currentUser.username)) {
                // Update current user data in localStorage with all fields
                const updatedUser = users.find(u => (u.id === userId || u.username === userData.username));
                if (updatedUser) {
                    // Preserve authToken but update all user data
                    const updatedUserData = {
                        username: updatedUser.username,
                        role: updatedUser.role,
                        name: updatedUser.name,
                        email: updatedUser.email || '',
                        phone: updatedUser.phone || '',
                        location: updatedUser.location || '',
                        idNumber: updatedUser.idNumber || ''
                    };
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
                    
                    // Update sidebar if function exists
                    if (typeof updateSidebarAccount === 'function') {
                        updateSidebarAccount();
                    }
                }
            }
            
            // Also update userData for any user that might be logged in with the old username
            if (oldUsername && oldUsername !== userData.username && currentUser && currentUser.username === oldUsername) {
                const updatedUser = users.find(u => u.username === userData.username);
                if (updatedUser) {
                    const updatedUserData = {
                        username: updatedUser.username,
                        role: updatedUser.role,
                        name: updatedUser.name,
                        email: updatedUser.email || '',
                        phone: updatedUser.phone || '',
                        location: updatedUser.location || '',
                        idNumber: updatedUser.idNumber || ''
                    };
                    localStorage.setItem('userData', JSON.stringify(updatedUserData));
                    if (typeof updateSidebarAccount === 'function') {
                        updateSidebarAccount();
                    }
                }
            }
            
            closeUserModal();
            loadUsers();
        });
    }
    
    // Load users on page load
    if (window.location.pathname.includes('admin-users.html')) {
        loadUsers();
    }
    
    // Close modal on outside click
    window.onclick = function(event) {
        const modal = document.getElementById('userModal');
        if (event.target === modal) {
            closeUserModal();
        }
    };
});

