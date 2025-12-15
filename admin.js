// Admin Dashboard Functionality

let records = [];

// Initialize records safely
try {
    if (typeof localStorage !== 'undefined') {
        records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
    }
} catch (e) {
    records = [];
}

// Sync all measurement sessions to pellet records
window.syncSessionsToRecords = function syncSessionsToRecords() {
    try {
        const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
        const existingRecords = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
        const syncedSessionIds = new Set(existingRecords.map(r => r.sessionId).filter(id => id !== null && id !== undefined));
        
        let newRecordsCount = 0;
        
        sessions.forEach(session => {
            // Skip if already synced
            if (syncedSessionIds.has(session.id)) return;
            
            // Only sync completed sessions with measurements
            if (!session.endTime || !session.measurements || session.measurements.length === 0) return;
            
            // Calculate session statistics
            const measurements = session.measurements;
            const sizes = measurements.map(m => {
                const size = parseFloat(m.avgSize || m.size || 0);
                return size > 0 ? size : null;
            }).filter(s => s !== null);
            
            if (sizes.length === 0) return;
            
            const avgSize = (sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(2);
            const minSize = Math.min(...sizes).toFixed(2);
            const maxSize = Math.max(...sizes).toFixed(2);
            const totalPellets = measurements.reduce((sum, m) => sum + (parseInt(m.count) || 0), 0);
            
            // Create record from session
            const newRecord = {
                id: existingRecords.length > 0 ? Math.max(...existingRecords.map(r => r.id)) + 1 + newRecordsCount : 1 + newRecordsCount,
                sessionId: session.id,
                timestamp: session.endTime || session.startTime,
                avgSize: parseFloat(avgSize),
                minSize: parseFloat(minSize),
                maxSize: parseFloat(maxSize),
                totalPellets: totalPellets,
                operator: session.operator || 'Unknown',
                notes: `Synced from session #${session.id}`,
                sessionStartTime: session.startTime,
                sessionEndTime: session.endTime
            };
            
            existingRecords.push(newRecord);
            newRecordsCount++;
        });
        
        if (newRecordsCount > 0) {
            localStorage.setItem('pelletRecords', JSON.stringify(existingRecords));
            records = existingRecords;
            
            // Show notification
            if (typeof showNotification === 'function') {
                showNotification(`Synced ${newRecordsCount} new session${newRecordsCount > 1 ? 's' : ''} to records`, 'success');
            }
            
            // Update dashboard if on dashboard page
            if (window.location.pathname.includes('admin-dashboard.html')) {
                setTimeout(() => {
                    loadDashboardStats();
                    loadRecentActivity();
                    // Trigger chart updates
                    if (typeof initAdminCharts === 'function') {
                        setTimeout(() => {
                            if (typeof window.updateAdminCharts === 'function') {
                                window.updateAdminCharts();
                            }
                        }, 100);
                    }
                }, 50);
            }
            
            // Update records page if on records page
            if (window.location.pathname.includes('admin-records.html')) {
                setTimeout(() => {
                    loadRecords();
                }, 50);
            }
        }
        
        return newRecordsCount;
    } catch (e) {
        return 0;
    }
};

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <svg style="width: 20px; height: 20px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            ${type === 'success' ? 
                '<path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' :
                '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
            }
        </svg>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for animations - moved to DOMContentLoaded
function addNotificationStyles() {
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
            .header-icon {
                width: 28px !important;
                height: 28px !important;
                margin-right: 0.75rem;
                stroke: var(--primary-color);
                flex-shrink: 0;
            }
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 2rem;
                width: 100%;
            }
            .header-title-section {
                flex: 1;
            }
            .header-title-section h1 {
                display: flex;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            .header-actions {
                display: flex;
                gap: 1rem;
                align-items: center;
                flex-shrink: 0;
            }
            .dashboard-header {
                margin-bottom: 2rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Add notification styles
    addNotificationStyles();
    
    // Ensure admin user has correct default data
    const allUsers = localStorage.getItem('allUsers');
    let users = allUsers ? JSON.parse(allUsers) : [];
    const adminUser = users.find(u => u.username === 'admin');
    
    if (adminUser) {
        // Update admin user with correct defaults if missing
        let updated = false;
        if (!adminUser.email || adminUser.email === 'admin@optifeed.com') {
            adminUser.email = 'admin@mail.com';
            updated = true;
        }
        if (!adminUser.idNumber) {
            adminUser.idNumber = '18020';
            updated = true;
        }
        if (updated) {
            const adminIndex = users.findIndex(u => u.username === 'admin');
            if (adminIndex !== -1) {
                users[adminIndex] = adminUser;
                localStorage.setItem('allUsers', JSON.stringify(users));
            }
        }
    } else {
        // Create admin user if it doesn't exist
        users.push({
            id: 'admin',
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            name: 'Administrator',
            email: 'admin@mail.com',
            phone: '',
            location: 'Main Office',
            idNumber: '18020'
        });
        localStorage.setItem('allUsers', JSON.stringify(users));
    }
    
    // Update current user data if logged in as admin
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.username === 'admin') {
        const updatedUserData = {
            username: 'admin',
            role: 'admin',
            name: 'Administrator',
            email: 'admin@mail.com',
            phone: currentUser.phone || '',
            location: currentUser.location || 'Main Office',
            idNumber: '18020'
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
    }
    
    // Update sidebar account info using the shared function if available
    if (typeof updateSidebarAccount === 'function') {
        updateSidebarAccount();
    } else {
        // Fallback for admin pages
        const user = getCurrentUser();
        if (user) {
            // Get the most up-to-date user data from allUsers
            const allUsers = localStorage.getItem('allUsers');
            const users = allUsers ? JSON.parse(allUsers) : [];
            const userData = users.find(u => u.username === user.username) || user;
            
            // Update sidebar account info
            const accountAvatar = document.getElementById('accountAvatar');
            const accountName = document.getElementById('accountName');
            const accountUsername = document.getElementById('accountUsername');
            const accountRole = document.getElementById('accountRole');
            const accountEmail = document.getElementById('accountEmail');
            
            if (accountAvatar) {
                accountAvatar.textContent = (userData.name || user.name || 'A').charAt(0).toUpperCase();
            }
            if (accountName) {
                accountName.textContent = userData.name || user.name || 'Administrator';
            }
            if (accountUsername) {
                accountUsername.textContent = '@' + (userData.username || user.username || 'username');
            }
            if (accountRole) {
                accountRole.textContent = 'Administrator';
            }
            if (accountEmail) {
                accountEmail.textContent = userData.email || user.email || 'No email';
            }
            const accountIdNumber = document.getElementById('accountIdNumber');
            if (accountIdNumber) {
                const idNumber = userData.idNumber || user.idNumber || '';
                accountIdNumber.textContent = idNumber ? `ID Number: ${idNumber}` : 'ID Number: —';
            }
        }
    }
    
    // Force update sidebar after a short delay to ensure DOM is ready
    setTimeout(function() {
        if (typeof updateSidebarAccount === 'function') {
            updateSidebarAccount();
        } else {
            const user = getCurrentUser();
            if (user) {
                const allUsers = localStorage.getItem('allUsers');
                const users = allUsers ? JSON.parse(allUsers) : [];
                const userData = users.find(u => u.username === user.username) || user;
                
                const accountAvatar = document.getElementById('accountAvatar');
                const accountName = document.getElementById('accountName');
                const accountUsername = document.getElementById('accountUsername');
                const accountRole = document.getElementById('accountRole');
                const accountEmail = document.getElementById('accountEmail');
                const accountIdNumber = document.getElementById('accountIdNumber');
                
                if (accountAvatar) accountAvatar.textContent = (userData.name || user.name || 'A').charAt(0).toUpperCase();
                if (accountName) accountName.textContent = userData.name || user.name || 'Administrator';
                if (accountUsername) accountUsername.textContent = '@' + (userData.username || user.username || 'username');
                if (accountRole) accountRole.textContent = 'Administrator';
                if (accountEmail) accountEmail.textContent = userData.email || user.email || 'No email';
                if (accountIdNumber) {
                    const idNumber = userData.idNumber || user.idNumber || '';
                    accountIdNumber.textContent = idNumber ? `ID Number: ${idNumber}` : 'ID Number: —';
                }
            }
        }
    }, 100);

    // Load dashboard data
    if (window.location.pathname.includes('admin-dashboard.html')) {
        // Sync sessions to records first, then load stats
        if (typeof window.syncSessionsToRecords === 'function') {
            window.syncSessionsToRecords();
        }
        
        // Refresh records after sync with a delay to ensure sync completes
        setTimeout(() => {
            records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
            loadDashboardStats();
            loadRecentActivity();
        }, 200);
        
        // Auto-sync every 5 seconds
        setInterval(() => {
            if (typeof window.syncSessionsToRecords === 'function') {
                window.syncSessionsToRecords();
            }
            setTimeout(() => {
                records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
                loadDashboardStats();
                loadRecentActivity();
            }, 200);
        }, 5000);
    }

    // Load records page
    if (window.location.pathname.includes('admin-records.html')) {
        // Sync sessions to records first
        if (typeof window.syncSessionsToRecords === 'function') {
            window.syncSessionsToRecords();
        }
        // Refresh records after sync
        records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
        loadUserProfiles();
        loadAllUsersDataSummary();
    }

    // Load monitoring page (only for old structure - new structure has its own implementation)
    if (window.location.pathname.includes('admin-monitoring.html')) {
        // Check if this is the new operator monitoring page (has operatorsListView)
        const operatorsListView = document.getElementById('operatorsListView');
        if (!operatorsListView) {
            // Old monitoring page structure - load monitoring data
            loadMonitoringData();
            setInterval(updateMonitoringData, 2000);
        }
        // New page structure has its own implementation in the inline script
        
        // Remove any location filter button if it exists
        removeLocationFilterButton();
    }
    
    // Sidebar mobile interactions
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) {
                    sidebar.classList.remove('open');
                }
            }
        });
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(event.target) && sidebarToggle && !sidebarToggle.contains(event.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
});

// Toggle sidebar on mobile
window.toggleSidebar = function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Dashboard Stats
function loadDashboardStats() {
    try {
        // Always get fresh records from localStorage
        records = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
    } catch (e) {
        records = [];
    }
    const totalRecords = records.length;
    
    // Calculate active sessions from measurementSessions
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const now = new Date();
    const activeSessions = allSessions.filter(s => {
        // Session is active if it has no endTime and started within the last hour
        if (s.endTime) return false;
        const sessionTime = new Date(s.startTime);
        return (now - sessionTime) < 3600000; // 1 hour in milliseconds
    }).length;
    const avgSize = records.length > 0 
        ? (records.reduce((sum, r) => sum + parseFloat(r.avgSize), 0) / records.length).toFixed(2)
        : '0.00';
    
    // Calculate today's records
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => {
        const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
        return recordDate === today;
    }).length;
    
    // Calculate size range
    let minSize = 0, maxSize = 0;
    if (records.length > 0) {
        const sizes = records.map(r => parseFloat(r.avgSize));
        minSize = Math.min(...sizes).toFixed(2);
        maxSize = Math.max(...sizes).toFixed(2);
    }
    
    // Get users data - try allUsers first, then users
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const users = allUsers.length > 0 ? allUsers : JSON.parse(localStorage.getItem('users') || '[]');
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const operatorCount = users.filter(u => u.role === 'user').length;
    
    // Get reports data
    const allReports = JSON.parse(localStorage.getItem('allReports') || '[]');
    const totalReports = allReports.length;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekReports = allReports.filter(r => new Date(r.generatedAt) >= weekAgo).length;
    
    // Get sessions data
    const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const totalSessions = sessions.length;
    const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime).toISOString().split('T')[0];
        return sessionDate === today;
    }).length;
    
    // Calculate total pellets
    const totalPellets = records.reduce((sum, r) => sum + (parseInt(r.totalPellets) || 0), 0);
    const todayPellets = todayRecords > 0 ? records.filter(r => {
        const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
        return recordDate === today;
    }).reduce((sum, r) => sum + (parseInt(r.totalPellets) || 0), 0) : 0;
    
    // System and sensor status
    const systemStatus = localStorage.getItem('systemStatus') !== 'false' ? 'Online' : 'Offline';
    const sensorsStatus = localStorage.getItem('sensorsStatus') !== 'false' ? 'Online' : 'Offline';
    
    // Update DOM elements
    if (document.getElementById('totalRecords')) {
        document.getElementById('totalRecords').textContent = totalRecords;
        document.getElementById('recordsChange').textContent = `+${todayRecords} today`;
    }
    if (document.getElementById('activeSessions')) {
        document.getElementById('activeSessions').textContent = activeSessions;
    }
    if (document.getElementById('avgPelletSize')) {
        document.getElementById('avgPelletSize').textContent = avgSize;
        document.getElementById('sizeRange').textContent = `Range: ${minSize} - ${maxSize}mm`;
    }
    if (document.getElementById('systemStatus')) {
        document.getElementById('systemStatus').textContent = systemStatus;
        document.getElementById('sensorStatus').textContent = `Sensors: ${sensorsStatus}`;
    }
    if (document.getElementById('totalUsers')) {
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('usersBreakdown').textContent = `${adminCount} Admins, ${operatorCount} Operators`;
    }
    if (document.getElementById('totalReports')) {
        document.getElementById('totalReports').textContent = totalReports;
        document.getElementById('reportsChange').textContent = `+${weekReports} this week`;
    }
    if (document.getElementById('totalSessions')) {
        document.getElementById('totalSessions').textContent = totalSessions;
        document.getElementById('sessionsChange').textContent = `+${todaySessions} today`;
    }
    if (document.getElementById('totalPellets')) {
        document.getElementById('totalPellets').textContent = totalPellets.toLocaleString();
        document.getElementById('pelletsChange').textContent = `+${todayPellets} today`;
    }
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    const activityCount = document.getElementById('activityCount');
    if (!activityList) return;

    const allRecords = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Get user info for avatars
    function getUserInfo(username) {
        const allUsersList = JSON.parse(localStorage.getItem('allUsers') || '[]');
        const user = allUsersList.find(u => u.username === username);
        if (user) {
            return {
                name: user.name || username,
                initials: (user.name || username).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || username[0].toUpperCase(),
                idNumber: user.idNumber || ''
            };
        }
        return {
            name: username,
            initials: username[0].toUpperCase(),
            idNumber: ''
        };
    }
    
    // Combine records and sessions for activity
    const activities = [];
    allRecords.forEach(r => {
        activities.push({
            type: 'record',
            id: r.id,
            operator: r.operator,
            timestamp: r.timestamp,
            data: r
        });
    });
    allSessions.forEach(s => {
        if (s.endTime) {
            activities.push({
                type: 'session',
                id: s.id,
                operator: s.operator,
                timestamp: s.endTime || s.startTime,
                data: s
            });
        }
    });
    
    // Update activity count
    if (activityCount) {
        activityCount.textContent = `${activities.length} total activities`;
    }
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="no-activity">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }

    const recent = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    
    function getTimeAgo(timestamp) {
        if (!timestamp) return 'Unknown';
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000);
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
        return time.toLocaleDateString();
    }
    
    activityList.innerHTML = recent.map((activity, index) => {
        const userInfo = getUserInfo(activity.operator);
        const timestamp = new Date(activity.timestamp);
        const timeAgo = getTimeAgo(activity.timestamp);
        const formattedTime = timestamp.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        let details = '';
        if (activity.type === 'record') {
            const record = activity.data;
            const pelletCount = record.totalPellets || 0;
            const avgSize = record.averageSize || 0;
            const location = record.location || 'Not specified';
            
            details = `
                <div class="activity-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span><strong>${pelletCount}</strong> pellets</span>
                </div>
                <div class="activity-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>${location}</span>
                </div>
                ${avgSize > 0 ? `
                <div class="activity-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Avg: <strong>${avgSize.toFixed(2)}mm</strong></span>
                </div>
                ` : ''}
            `;
        } else {
            const session = activity.data;
            const duration = session.endTime && session.startTime ? 
                Math.floor((new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60) : 0;
            const pelletCount = session.totalPellets || 0;
            const location = session.location || 'Not specified';
            
            details = `
                <div class="activity-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>Duration: <strong>${duration} min</strong></span>
                </div>
                <div class="activity-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span><strong>${pelletCount}</strong> pellets</span>
                </div>
                <div class="activity-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>${location}</span>
                </div>
            `;
        }
        
        return `
            <div class="activity-card ${activity.type}-type" style="animation: fadeInUp 0.3s ease ${index * 0.05}s both;">
                <div class="activity-icon-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        ${activity.type === 'record' ? 
                            '<path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' :
                            '<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                        }
                    </svg>
                </div>
                <div class="activity-main-content">
                    <div class="activity-header">
                        <div class="activity-user-avatar">${userInfo.initials}</div>
                        <div style="flex: 1;">
                        <h3 class="activity-title">
                            ${userInfo.name}
                            <span class="activity-type-badge ${activity.type}">${activity.type === 'record' ? 'Record' : 'Session'}</span>
                        </h3>
                            ${userInfo.idNumber ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; font-weight: 500;">ID Number: ${userInfo.idNumber}</div>` : ''}
                        </div>
                    </div>
                    <div class="activity-details">
                        ${details}
                    </div>
                </div>
                <div class="activity-time-section">
                    <div class="activity-time">${formattedTime}</div>
                    <div class="activity-time-ago">${timeAgo}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Load user profiles for supervision
function loadUserProfiles() {
    const profilesList = document.getElementById('userProfilesList');
    if (!profilesList) return;
    
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const allRecords = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    
    // Filter to only show operators (users with role 'user')
    const operators = allUsers.filter(u => u.role === 'user');
    
    if (operators.length === 0) {
        profilesList.innerHTML = '<p class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">No operators found</p>';
        return;
    }
    
    profilesList.innerHTML = operators.map(user => {
        const userRecords = allRecords.filter(r => r.operator === user.username);
        const userSessions = allSessions.filter(s => s.operator === user.username);
        const completedSessions = userSessions.filter(s => s.endTime);
        
        const totalPellets = userRecords.reduce((sum, r) => sum + (parseInt(r.totalPellets) || 0), 0);
        const avgSize = userRecords.length > 0 
            ? (userRecords.reduce((sum, r) => sum + parseFloat(r.avgSize || 0), 0) / userRecords.length).toFixed(2)
            : '0.00';
        
        return `
            <div class="user-profile-card" onclick="showUserDetails('${user.username}')" style="
                background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%);
                border: 2px solid rgba(47, 167, 110, 0.15);
                border-radius: 1.25rem;
                padding: 2rem;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 16px rgba(47, 167, 110, 0.1);
                position: relative;
                overflow: hidden;
            " onmouseover="this.style.transform='translateY(-6px) scale(1.02)'; this.style.boxShadow='0 12px 32px rgba(47, 167, 110, 0.2)'; this.style.borderColor='rgba(47, 167, 110, 0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 4px 16px rgba(47, 167, 110, 0.1)'; this.style.borderColor='rgba(47, 167, 110, 0.15)'">
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #2FA76E 0%, #4ECDC4 100%);"></div>
                <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;">
                    <div style="
                        width: 72px;
                        height: 72px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 2rem;
                        font-weight: 700;
                        box-shadow: 0 6px 20px rgba(47, 167, 110, 0.3);
                        border: 3px solid rgba(255, 255, 255, 0.3);
                        position: relative;
                    ">
                        ${(user.name || user.username || 'U').charAt(0).toUpperCase()}
                        <div style="position: absolute; bottom: 2px; right: 2px; width: 16px; height: 16px; background: #10b981; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <h3 style="margin: 0; font-size: 1.375rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">${user.name || user.username}</h3>
                        <p style="margin: 0.375rem 0 0 0; font-size: 0.9375rem; color: var(--text-secondary); font-weight: 500;">@${user.username}</p>
                        ${user.idNumber ? `<p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary); font-weight: 500;">ID Number: ${user.idNumber}</p>` : ''}
                        ${user.email ? `<p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
                            <svg style="width: 14px; height: 14px; stroke: currentColor;" viewBox="0 0 24 24" fill="none">
                                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2"/>
                                <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            ${user.email}
                        </p>` : ''}
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1.5rem;">
                    <div style="
                        background: linear-gradient(135deg, rgba(47, 167, 110, 0.12) 0%, rgba(47, 167, 110, 0.05) 100%);
                        padding: 1.25rem;
                        border-radius: 1rem;
                        border: 1.5px solid rgba(47, 167, 110, 0.15);
                        text-align: center;
                        transition: all 0.3s ease;
                    ">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color); line-height: 1.2; margin-bottom: 0.5rem;">${userRecords.length}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Records</div>
                    </div>
                    <div style="
                        background: linear-gradient(135deg, rgba(78, 205, 196, 0.12) 0%, rgba(78, 205, 196, 0.05) 100%);
                        padding: 1.25rem;
                        border-radius: 1rem;
                        border: 1.5px solid rgba(78, 205, 196, 0.15);
                        text-align: center;
                        transition: all 0.3s ease;
                    ">
                        <div style="font-size: 2rem; font-weight: 700; color: #4ECDC4; line-height: 1.2; margin-bottom: 0.5rem;">${completedSessions.length}</div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Sessions</div>
                    </div>
                </div>
                <div style="margin-top: 1.25rem; padding-top: 1.25rem; border-top: 2px solid rgba(47, 167, 110, 0.1); display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">${totalPellets.toLocaleString()}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Actual Total Pellet Count</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">${avgSize}mm</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Avg Size</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Show user details modal
function showUserDetails(username) {
    const modal = document.getElementById('userDetailsModal');
    const content = document.getElementById('userDetailsContent');
    const title = document.getElementById('userDetailsTitle');
    
    if (!modal || !content || !title) return;
    
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const allRecords = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    
    const user = allUsers.find(u => u.username === username);
    if (!user) {
        alert('User not found');
        return;
    }
    
    const userRecords = allRecords.filter(r => r.operator === username).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const userSessions = allSessions.filter(s => s.operator === username).sort((a, b) => new Date(b.startTime || b.id) - new Date(a.startTime || a.id));
    const completedSessions = userSessions.filter(s => s.endTime);
    
    // Calculate comprehensive statistics
    const totalPellets = userRecords.reduce((sum, r) => sum + (parseInt(r.totalPellets) || 0), 0);
    const totalMeasurements = userSessions.reduce((sum, s) => sum + (s.measurements?.length || 0), 0);
    const avgSize = userRecords.length > 0 
        ? (userRecords.reduce((sum, r) => sum + parseFloat(r.avgSize || 0), 0) / userRecords.length).toFixed(2)
        : '0.00';
    const allSizes = userRecords.map(r => parseFloat(r.avgSize || 0)).filter(s => s > 0);
    const minSize = allSizes.length > 0 ? Math.min(...allSizes).toFixed(2) : '0.00';
    const maxSize = allSizes.length > 0 ? Math.max(...allSizes).toFixed(2) : '0.00';
    
    // Calculate time statistics
    const totalSessionTime = completedSessions.reduce((sum, s) => {
        if (s.endTime && s.startTime) {
            return sum + (new Date(s.endTime) - new Date(s.startTime));
        }
        return sum;
    }, 0);
    const totalHours = Math.floor(totalSessionTime / 3600000);
    const totalMinutes = Math.floor((totalSessionTime % 3600000) / 60000);
    
    // Calculate today's activity
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = userRecords.filter(r => {
        const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
        return recordDate === today;
    }).length;
    const todaySessions = userSessions.filter(s => {
        const sessionDate = new Date(s.startTime || s.id).toISOString().split('T')[0];
        return sessionDate === today;
    }).length;
    
    // Calculate this week's activity
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekRecords = userRecords.filter(r => new Date(r.timestamp) >= weekAgo).length;
    const weekSessions = userSessions.filter(s => new Date(s.startTime || s.id) >= weekAgo).length;
    
    // Calculate average pellets per session
    const avgPelletsPerSession = completedSessions.length > 0
        ? (completedSessions.reduce((sum, s) => sum + (s.totalPellets || 0), 0) / completedSessions.length).toFixed(0)
        : '0';
    
    // Calculate average measurements per session
    const avgMeasurementsPerSession = completedSessions.length > 0
        ? (completedSessions.reduce((sum, s) => sum + (s.measurements?.length || 0), 0) / completedSessions.length).toFixed(1)
        : '0.0';
    
    title.textContent = `${user.name || user.username}'s Activity Summary`;
    
    content.innerHTML = `
        <div style="margin-bottom: 2.5rem;">
            <div style="display: flex; align-items: center; gap: 1.5rem; padding: 2rem; background: linear-gradient(135deg, rgba(47, 167, 110, 0.1) 0%, rgba(47, 167, 110, 0.05) 100%); border-radius: 1.25rem; border: 2px solid rgba(47, 167, 110, 0.15); box-shadow: 0 4px 16px rgba(47, 167, 110, 0.1);">
                <div style="
                    width: 96px;
                    height: 96px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 2.5rem;
                    font-weight: 700;
                    box-shadow: 0 8px 24px rgba(47, 167, 110, 0.3);
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    position: relative;
                ">
                    ${(user.name || user.username || 'U').charAt(0).toUpperCase()}
                    <div style="position: absolute; bottom: 4px; right: 4px; width: 20px; height: 20px; background: #10b981; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>
                </div>
                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: var(--text-primary);">${user.name || user.username}</h3>
                    <p style="margin: 0.5rem 0 0 0; font-size: 1.125rem; color: var(--text-secondary); font-weight: 500;">@${user.username}</p>
                    ${user.idNumber ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.9375rem; color: var(--text-secondary); font-weight: 500;">ID Number: ${user.idNumber}</p>` : ''}
                    ${user.email ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.9375rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
                        <svg style="width: 16px; height: 16px; stroke: currentColor;" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        ${user.email}
                    </p>` : ''}
                </div>
            </div>
        </div>
        
        <!-- Comprehensive Data Summary -->
        <div style="margin-bottom: 2.5rem;">
            <h3 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
                <svg style="width: 24px; height: 24px; stroke: var(--primary-color);" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Data Summary
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
                <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.12) 0%, rgba(47, 167, 110, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 2px solid rgba(47, 167, 110, 0.15); text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem; line-height: 1.2;">${userRecords.length}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Records</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">${todayRecords} today, ${weekRecords} this week</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(78, 205, 196, 0.12) 0%, rgba(78, 205, 196, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 2px solid rgba(78, 205, 196, 0.15); text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: #4ECDC4; margin-bottom: 0.5rem; line-height: 1.2;">${completedSessions.length}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Completed Sessions</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">${todaySessions} today, ${weekSessions} this week</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(255, 107, 107, 0.12) 0%, rgba(255, 107, 107, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 2px solid rgba(255, 107, 107, 0.15); text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: #FF6B6B; margin-bottom: 0.5rem; line-height: 1.2;">${totalPellets.toLocaleString()}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Actual Total Pellet Count</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">${avgPelletsPerSession} avg per session</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(255, 230, 109, 0.12) 0%, rgba(255, 230, 109, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 2px solid rgba(255, 230, 109, 0.15); text-align: center;">
                    <div style="font-size: 2.5rem; font-weight: 700; color: #FFE66D; margin-bottom: 0.5rem; line-height: 1.2;">${totalMeasurements}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Pellet Measurements</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">${avgMeasurementsPerSession} avg per session</div>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
                <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.12) 0%, rgba(47, 167, 110, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 2px solid rgba(47, 167, 110, 0.15); text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem;">${avgSize}mm</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Average Size</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">Range: ${minSize} - ${maxSize}mm</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 2px solid rgba(16, 185, 129, 0.15); text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem;">${totalHours}h ${totalMinutes}m</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Session Time</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">${completedSessions.length > 0 ? (Math.floor(totalSessionTime / completedSessions.length / 60000)).toFixed(0) : '0'} min avg</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 2px solid rgba(139, 92, 246, 0.15); text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #8b5cf6; margin-bottom: 0.5rem;">${completedSessions.length > 0 ? (totalPellets / (totalSessionTime / 3600000)).toFixed(0) : '0'}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Pellets Per Hour</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">Production rate</div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 2px solid rgba(236, 72, 153, 0.15); text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ec4899; margin-bottom: 0.5rem;">${userSessions.filter(s => !s.endTime).length}</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Active Sessions</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">Currently running</div>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width: 20px; height: 20px; stroke: var(--primary-color);" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Records (${userRecords.length})
            </h3>
            ${userRecords.length === 0 ? '<p class="no-data">No records found</p>' : `
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 0.75rem;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: var(--bg-tertiary); position: sticky; top: 0;">
                            <tr>
                                <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color);">ID</th>
                                <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color);">Date</th>
                                <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color);">Avg Size</th>
                                <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color);">Pellets</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userRecords.map(r => `
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 0.75rem; color: var(--text-primary);">#${r.id}</td>
                                    <td style="padding: 0.75rem; color: var(--text-primary);">${new Date(r.timestamp).toLocaleString()}</td>
                                    <td style="padding: 0.75rem; color: var(--text-primary);">${r.avgSize}mm</td>
                                    <td style="padding: 0.75rem; color: var(--text-primary);">${r.totalPellets}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
        
        <div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg style="width: 20px; height: 20px; stroke: var(--primary-color);" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Sessions (${userSessions.length})
            </h3>
            ${userSessions.length === 0 ? '<p class="no-data">No sessions found</p>' : `
                <div style="display: grid; gap: 1rem;">
                    ${userSessions.map(session => {
                        const duration = session.endTime ? Math.floor((new Date(session.endTime) - new Date(session.startTime || session.id)) / 1000) : 0;
                        const hours = Math.floor(duration / 3600);
                        const minutes = Math.floor((duration % 3600) / 60);
                        const seconds = duration % 60;
                        const durationText = duration > 0 ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : 'N/A';
                        
                        // Calculate session statistics
                        const measurements = session.measurements || [];
                        const sizes = measurements.map(m => parseFloat(m.avgSize || m.size || 0)).filter(s => s > 0);
                        const sessionAvgSize = sizes.length > 0 
                            ? (sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(2)
                            : '0.00';
                        const sessionMinSize = sizes.length > 0 ? Math.min(...sizes).toFixed(2) : '0.00';
                        const sessionMaxSize = sizes.length > 0 ? Math.max(...sizes).toFixed(2) : '0.00';
                        
                        // Calculate measurement rate
                        const measurementRate = duration > 0 && measurements.length > 0
                            ? (measurements.length / (duration / 60)).toFixed(1)
                            : '0.0';
                        
                        // Calculate pellets per minute
                        const pelletsPerMin = duration > 0 && session.totalPellets
                            ? (session.totalPellets / (duration / 60)).toFixed(1)
                            : '0.0';
                        
                        return `
                            <div onclick="showUserSessionDetails(${session.id})" style="
                                background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%);
                                border: 2px solid rgba(47, 167, 110, 0.15);
                                border-radius: 1.25rem;
                                padding: 2rem;
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                cursor: pointer;
                                position: relative;
                                overflow: hidden;
                            " onmouseover="this.style.borderColor='rgba(47, 167, 110, 0.3)'; this.style.transform='translateY(-4px) scale(1.01)'; this.style.boxShadow='0 8px 24px rgba(47, 167, 110, 0.15)'" onmouseout="this.style.borderColor='rgba(47, 167, 110, 0.15)'; this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='none'">
                                <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #2FA76E 0%, #4ECDC4 100%);"></div>
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                                    <div style="flex: 1;">
                                        <h4 style="margin: 0; font-size: 1.375rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 0.75rem;">
                                            <svg style="width: 20px; height: 20px; stroke: var(--primary-color);" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            Session #${session.id}
                                        </h4>
                                        <p style="margin: 0.75rem 0 0 0; font-size: 0.9375rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
                                            <svg style="width: 16px; height: 16px; stroke: currentColor;" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            </svg>
                                            ${new Date(session.startTime || session.id).toLocaleString()}
                                        </p>
                                        ${session.endTime ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.9375rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
                                            <svg style="width: 16px; height: 16px; stroke: currentColor;" viewBox="0 0 24 24" fill="none">
                                                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            ${new Date(session.endTime).toLocaleString()}
                                        </p>` : ''}
                                    </div>
                                    <span style="
                                        padding: 0.5rem 1rem;
                                        border-radius: 0.75rem;
                                        font-size: 0.875rem;
                                        font-weight: 700;
                                        background: ${session.endTime ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)' : 'linear-gradient(135deg, rgba(47, 167, 110, 0.15) 0%, rgba(47, 167, 110, 0.08) 100%)'};
                                        color: ${session.endTime ? '#10b981' : '#2FA76E'};
                                        border: 2px solid ${session.endTime ? 'rgba(16, 185, 129, 0.25)' : 'rgba(47, 167, 110, 0.25)'};
                                        box-shadow: 0 2px 8px ${session.endTime ? 'rgba(16, 185, 129, 0.2)' : 'rgba(47, 167, 110, 0.2)'};
                                    ">${session.endTime ? 'Completed' : 'Active'}</span>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
                                    <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.1) 0%, rgba(47, 167, 110, 0.05) 100%); padding: 1.25rem; border-radius: 1rem; border: 1.5px solid rgba(47, 167, 110, 0.15); text-align: center;">
                                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem;">${session.measurements?.length || 0}</div>
                                        <div style="font-size: 0.8125rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Pellet Measurements</div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${measurementRate} per min</div>
                                    </div>
                                    <div style="background: linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(78, 205, 196, 0.05) 100%); padding: 1.25rem; border-radius: 1rem; border: 1.5px solid rgba(78, 205, 196, 0.15); text-align: center;">
                                        <div style="font-size: 2rem; font-weight: 700; color: #4ECDC4; margin-bottom: 0.5rem;">${session.totalPellets || 0}</div>
                                        <div style="font-size: 0.8125rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Actual Total Pellet Count</div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${pelletsPerMin} per min</div>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
                                    <div style="background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%); padding: 1rem; border-radius: 0.75rem; border: 1.5px solid rgba(255, 107, 107, 0.15); text-align: center;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #FF6B6B; margin-bottom: 0.25rem;">${durationText}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Duration</div>
                                    </div>
                                    <div style="background: linear-gradient(135deg, rgba(255, 230, 109, 0.1) 0%, rgba(255, 230, 109, 0.05) 100%); padding: 1rem; border-radius: 0.75rem; border: 1.5px solid rgba(255, 230, 109, 0.15); text-align: center;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #FFE66D; margin-bottom: 0.25rem;">${sessionAvgSize}mm</div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Avg Size</div>
                                    </div>
                                    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%); padding: 1rem; border-radius: 0.75rem; border: 1.5px solid rgba(139, 92, 246, 0.15); text-align: center;">
                                        <div style="font-size: 1.25rem; font-weight: 700; color: #8b5cf6; margin-bottom: 0.25rem;">${sessionMinSize}-${sessionMaxSize}mm</div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Size Range</div>
                                    </div>
                                </div>
                                <div style="padding-top: 1rem; border-top: 2px solid rgba(47, 167, 110, 0.1); display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--primary-color); font-weight: 600; font-size: 0.875rem;">
                                    <svg style="width: 18px; height: 18px; stroke: currentColor;" viewBox="0 0 24 24" fill="none">
                                        <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" stroke-width="2"/>
                                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                    Click to view detailed session analysis
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeUserDetailsModal() {
    const modal = document.getElementById('userDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Show session details from user details modal (Admin version with full operator info)
function showUserSessionDetails(sessionId) {
        const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
        const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        alert('Session not found');
        return;
    }
    
    // Get operator details from allUsers
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const operatorUser = allUsers.find(u => u.username === session.operator) || null;
    
    const operatorName = operatorUser?.name || session.operator || 'Unknown';
    const operatorEmail = operatorUser?.email || 'N/A';
    const operatorPhone = operatorUser?.phone || 'N/A';
    const operatorLocation = operatorUser?.location || 'N/A';
    const operatorRole = operatorUser?.role === 'admin' ? 'Administrator' : (operatorUser?.role === 'user' ? 'Factory Operator' : 'N/A');
    const operatorIdNumber = operatorUser?.idNumber || 'N/A';
    
    const avgSize = session.measurements && session.measurements.length > 0
        ? (session.measurements.reduce((sum, m) => sum + parseFloat(m.avgSize || 0), 0) / session.measurements.length).toFixed(2)
        : '0.00';
    const minSize = session.measurements && session.measurements.length > 0
        ? Math.min(...session.measurements.map(m => parseFloat(m.minSize || 0))).toFixed(2)
        : '0.00';
    const maxSize = session.measurements && session.measurements.length > 0
        ? Math.max(...session.measurements.map(m => parseFloat(m.maxSize || 0))).toFixed(2)
        : '0.00';
    
    const startTime = session.startTimeFormatted || new Date(session.startTime || session.id).toLocaleString();
    const endTime = session.endTimeFormatted || (session.endTime ? new Date(session.endTime).toLocaleString() : 'In Progress');
    
    const duration = session.endTime 
        ? Math.floor((new Date(session.endTime) - new Date(session.startTime || session.id)) / 1000)
        : 0;
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    const durationText = duration > 0 
        ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : 'N/A';
    
    // Calculate additional stats
    const sizeRange = (parseFloat(maxSize) - parseFloat(minSize)).toFixed(2);
    const pelletsPerMin = duration > 0 && session.totalPellets 
        ? (session.totalPellets / (duration / 60)).toFixed(1)
        : '0.0';
    const measurementFrequency = duration > 0 && session.measurements?.length > 0
        ? (session.measurements.length / (duration / 60)).toFixed(2)
        : '0.00';
    const avgTimePerMeasurement = session.measurements && session.measurements.length > 0 && duration > 0
        ? Math.round((duration / session.measurements.length) * 10) / 10
        : 0;
    const efficiency = duration > 0 && session.totalPellets
        ? Math.round((session.totalPellets / (duration / 60)) * 10) / 10
        : 0;
    
    // Calculate quality score
    let qualityScore = 0;
    if (session.measurements && session.measurements.length > 0) {
        const measurements = session.measurements;
        const totalMeasurements = measurements.length;
        
        const compliantCount = measurements.filter(m => {
            const size = parseFloat(m.avgSize || 0);
            return size >= 8 && size <= 12;
        }).length;
        const sizeCompliance = (compliantCount / totalMeasurements) * 100;
        
        const sizes = measurements.map(m => parseFloat(m.avgSize || 0)).filter(s => s > 0);
        let consistencyScore = 100;
        if (sizes.length > 1) {
            const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
            const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
            const stdDev = Math.sqrt(variance);
            consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / 3) * 100));
        }
        
        let optimalSizeScore = 0;
        if (sizes.length > 0) {
            const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
            const targetSize = 10;
            const deviation = Math.abs(avgSize - targetSize);
            optimalSizeScore = Math.max(0, Math.min(100, 100 - (deviation / 5) * 100));
        }
        
        const completenessScore = Math.min(100, (totalMeasurements / 15) * 100);
        
        qualityScore = Math.round(
            (sizeCompliance * 0.40) + 
            (consistencyScore * 0.35) + 
            (optimalSizeScore * 0.15) +
            (completenessScore * 0.10)
        );
        qualityScore = Math.max(0, Math.min(100, qualityScore));
    }
    
    const isCompleted = session.endTime ? true : false;
    const statusText = isCompleted ? 'Completed' : 'In Progress';
    const statusClass = isCompleted ? 'status-completed' : 'status-active';
    
    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    
    const startDateTime = formatDateTime(session.startTime || session.id);
    const endDateTime = session.endTime ? formatDateTime(session.endTime) : 'In Progress';
    
    // Remove any existing modal first
    const existingModal = document.getElementById('sessionDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'sessionDetailsModal';
    modal.style.cssText = 'display: none; position: fixed; z-index: 2000; left: 0; top: 0; width: 100%; height: 100%; background: transparent;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1200px; margin: auto; position: relative; padding: 0;">
            <div class="modal-header" style="padding: 2rem 2.5rem 1.75rem !important; border-bottom: 2px solid rgba(47, 167, 110, 0.08) !important; display: flex !important; justify-content: space-between !important; align-items: center !important; background: linear-gradient(135deg, rgba(47, 167, 110, 0.06) 0%, rgba(47, 167, 110, 0.02) 100%) !important;">
                <div style="flex: 1; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25);">
                        <svg style="width: 28px; height: 28px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M8 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div>
                        <h2 style="font-size: 1.875rem !important; font-weight: 700 !important; color: var(--text-primary) !important; margin: 0 !important; display: flex; align-items: center; gap: 0.5rem;">
                            <span>Session Details</span>
                        </h2>
                        <p style="margin: 0.5rem 0 0 0 !important; color: var(--text-secondary) !important; font-size: 0.875rem !important; display: flex; align-items: center; gap: 0.375rem;">
                            <svg style="width: 14px; height: 14px; opacity: 0.7;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            Session ID: #${session.id}
                        </p>
                    </div>
                </div>
                <span class="close" onclick="closeAdminSessionDetailsModal()" style="color: var(--text-secondary) !important; font-size: 2rem !important; font-weight: 300 !important; line-height: 1 !important; cursor: pointer !important; transition: all 0.3s ease !important; flex-shrink: 0 !important; margin-left: 1rem !important; width: 36px !important; height: 36px !important; display: flex !important; align-items: center !important; justify-content: center !important; border-radius: 50% !important;" onmouseover="this.style.color='var(--primary-color)'; this.style.background='rgba(47, 167, 110, 0.1)'; this.style.transform='rotate(90deg)';" onmouseout="this.style.color='var(--text-secondary)'; this.style.background='transparent'; this.style.transform='rotate(0deg)';">&times;</span>
            </div>
            <div class="session-details-content" style="padding: 2.5rem; overflow-x: hidden;">
                <!-- Key Metrics Section -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2.5rem;">
                    <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(236, 72, 153, 0.03) 100%); border: 1.5px solid rgba(236, 72, 153, 0.15); border-radius: 1rem; padding: 1.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(236, 72, 153, 0.08); min-height: 120px; justify-content: space-between;">
                        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.25);">
                            <svg style="width: 28px; height: 28px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0; width: 100%;">
                            <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2; word-break: break-word;">Quality Score</p>
                            <h3 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1.2; word-break: break-word;">${qualityScore}%</h3>
                        </div>
                    </div>
                    <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.08) 0%, rgba(47, 167, 110, 0.03) 100%); border: 1.5px solid rgba(47, 167, 110, 0.15); border-radius: 1rem; padding: 1.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(47, 167, 110, 0.08); min-height: 120px; justify-content: space-between;">
                        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25);">
                            <svg style="width: 28px; height: 28px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0; width: 100%;">
                            <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2; word-break: break-word;">Duration</p>
                            <h3 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary); font-family: 'Courier New', monospace; line-height: 1.2; word-break: break-word;">${durationText}</h3>
                        </div>
                    </div>
                    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%); border: 1.5px solid rgba(16, 185, 129, 0.15); border-radius: 1rem; padding: 1.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08); min-height: 120px; justify-content: space-between;">
                        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
                            <svg style="width: 28px; height: 28px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0; width: 100%;">
                            <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2; word-break: break-word;">Pellet Measurements</p>
                            <h3 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1.2; word-break: break-word;">${session.measurements?.length || 0}</h3>
                        </div>
                    </div>
                    <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.03) 100%); border: 1.5px solid rgba(251, 191, 36, 0.15); border-radius: 1rem; padding: 1.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: 1rem; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(251, 191, 36, 0.08); min-height: 120px; justify-content: space-between;">
                        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.25);">
                            <svg style="width: 28px; height: 28px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0; width: 100%;">
                            <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2; word-break: break-word;">Actual Total Pellet Count</p>
                            <h3 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary); line-height: 1.2; word-break: break-word;">${session.totalPellets || 0}</h3>
                        </div>
                    </div>
                </div>
                
                <!-- Two Column Layout -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem; align-items: start;">
                    <!-- Left Column: Operator Information (ADMIN - ALL INFO) -->
                    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06); height: 100%; display: flex; flex-direction: column;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08); flex-shrink: 0;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25); flex-shrink: 0;">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">Operator Information</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.4;">Complete operator details</p>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 1.25rem; flex: 1;">
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(47, 167, 110, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Name</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 600; line-height: 1.4; word-break: break-word; overflow-wrap: break-word;">${operatorName}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(47, 167, 110, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10 13C10 13.5304 10.2107 14.0391 10.5858 14.4142C10.9609 14.7893 11.4696 15 12 15C12.5304 15 13.0391 14.7893 13.4142 14.4142C13.7893 14.0391 14 13.5304 14 13C14 12.4696 13.7893 11.9609 13.4142 11.5858C13.0391 11.2107 12.5304 11 12 11C11.4696 11 10.9609 11.2107 10.5858 11.5858C10.2107 11.9609 10 12.4696 10 13Z" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Username</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word;">@${session.operator || 'Unknown'}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(47, 167, 110, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                        <path d="M8 8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        <path d="M8 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">ID Number</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word;">${operatorIdNumber}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(47, 167, 110, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2"/>
                                        <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Email</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; word-break: break-word; overflow-wrap: break-word; line-height: 1.4;">${operatorEmail}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(47, 167, 110, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5 4H9L11 7L8.5 9.5C9.5 11.5 11.5 13.5 13.5 14.5L16 12L19 14L22 18V20C22 21.1046 21.1046 22 20 22C11.1634 22 4 14.8366 4 6C4 4.89543 4.89543 4 6 4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Phone</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word;">${operatorPhone}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(47, 167, 110, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2"/>
                                        <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Location</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; word-break: break-word; overflow-wrap: break-word; line-height: 1.4;">${operatorLocation}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(47, 167, 110, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Role</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 600; line-height: 1.4; word-break: break-word;">${operatorRole}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Column: Session Information -->
                    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06); height: 100%; display: flex; flex-direction: column;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08); flex-shrink: 0;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); flex-shrink: 0;">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">Session Information</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.4;">Timeline and details</p>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 1.25rem; flex: 1;">
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(16, 185, 129, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #10b981; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Start Time</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word; overflow-wrap: break-word;">${startDateTime}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(239, 68, 68, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #ef4444; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">End Time</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word; overflow-wrap: break-word;">${endDateTime}</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #8b5cf6; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Frequency</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word;">${measurementFrequency} per min</p>
                                </div>
                            </div>
                            ${efficiency > 0 ? `
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #8b5cf6; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Production Rate</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word;">${efficiency} pellets/min</p>
                                </div>
                            </div>
                            ` : ''}
                            ${avgTimePerMeasurement > 0 ? `
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: rgba(251, 191, 36, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: #fbbf24; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Avg Time Per Measurement</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word;">${avgTimePerMeasurement} seconds</p>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Session Timeline Section -->
                <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2.5rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                            <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Session Timeline</h3>
                            <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary);">Start, end, and performance metrics</p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem;">
                        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(16, 185, 129, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #10b981; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Started</p>
                                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-primary); font-weight: 500; word-break: break-word;">${startDateTime}</p>
                                </div>
                            </div>
                        </div>
                        ${session.endTime ? `
                        <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%); border: 1px solid rgba(239, 68, 68, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(239, 68, 68, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #ef4444; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Ended</p>
                                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-primary); font-weight: 500; word-break: break-word;">${endDateTime}</p>
                                </div>
                            </div>
                        </div>
                        ` : `
                        <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(251, 191, 36, 0.02) 100%); border: 1px solid rgba(251, 191, 36, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(251, 191, 36, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #fbbf24; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Status</p>
                                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">In Progress</p>
                                </div>
                            </div>
                        </div>
                        `}
                        ${avgTimePerMeasurement > 0 ? `
                        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%); border: 1px solid rgba(139, 92, 246, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(139, 92, 246, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #8b5cf6; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Avg Time/Measurement</p>
                                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${avgTimePerMeasurement}s</p>
                                </div>
                            </div>
                        </div>
                        ` : '<div></div>'}
                        ${measurementFrequency !== '0.00' ? `
                        <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.06) 0%, rgba(47, 167, 110, 0.02) 100%); border: 1px solid rgba(47, 167, 110, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(47, 167, 110, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Measurement Frequency</p>
                                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${measurementFrequency} per min</p>
                                </div>
                            </div>
                        </div>
                        ` : '<div></div>'}
                        ${sizeRange > 0 ? `
                        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(16, 185, 129, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #10b981; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Size Range</p>
                                    <p style="margin: 0; font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${sizeRange} mm</p>
                                </div>
                            </div>
                        </div>
                        ` : '<div></div>'}
                    </div>
                </div>
                
                <!-- Measurement Statistics -->
                <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2.5rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.25);">
                            <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Measurement Statistics</h3>
                            <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary);">Size analysis and metrics</p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem;">
                        <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.06) 0%, rgba(47, 167, 110, 0.02) 100%); border: 1px solid rgba(47, 167, 110, 0.12); border-radius: 1rem; padding: 1.5rem; text-align: center;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25);">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${avgSize} mm</h4>
                            <p style="margin: 0; font-size: 0.8125rem; color: var(--text-secondary); font-weight: 600;">Average Size</p>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.12); border-radius: 1rem; padding: 1.5rem; text-align: center;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${minSize} mm</h4>
                            <p style="margin: 0; font-size: 0.8125rem; color: var(--text-secondary); font-weight: 600;">Minimum Size</p>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%); border: 1px solid rgba(239, 68, 68, 0.12); border-radius: 1rem; padding: 1.5rem; text-align: center;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${maxSize} mm</h4>
                            <p style="margin: 0; font-size: 0.8125rem; color: var(--text-secondary); font-weight: 600;">Maximum Size</p>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%); border: 1px solid rgba(139, 92, 246, 0.12); border-radius: 1rem; padding: 1.5rem; text-align: center;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${sizeRange} mm</h4>
                            <p style="margin: 0; font-size: 0.8125rem; color: var(--text-secondary); font-weight: 600;">Size Range</p>
                        </div>
                    </div>
                </div>
                
                ${session.measurements && session.measurements.length > 0 ? `
                <!-- Charts Section -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
                    <!-- Distribution Chart -->
                    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 16px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, rgba(78, 205, 196, 0.1), rgba(78, 205, 196, 0.2)); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <svg style="width: 24px; height: 24px; stroke: #4ECDC4; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1f2937; line-height: 1.3;">Diameter Distribution</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #6b7280; line-height: 1.4;">Size distribution analysis</p>
                            </div>
                        </div>
                        <div style="width: 100%; height: 350px;">
                            <div id="adminSessionDistributionChart-${session.id}" style="width: 100%; height: 100%;"></div>
                        </div>
                    </div>
                    
                    <!-- Trends Chart -->
                    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 16px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, rgba(47, 167, 110, 0.1), rgba(47, 167, 110, 0.2)); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <svg style="width: 24px; height: 24px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 3L12 8L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M3 21L12 16L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M3 12L12 17L21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1f2937; line-height: 1.3;">Measurement Trends</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #6b7280; line-height: 1.4;">Size trends over time</p>
                            </div>
                        </div>
                        <div style="width: 100%; height: 350px;">
                            <div id="adminSessionTrendsChart-${session.id}" style="width: 100%; height: 100%;"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Quality Analysis Section -->
                ${session.measurements && session.measurements.length > 0 ? (() => {
                    const measurements = session.measurements;
                    const totalMeasurements = measurements.length;
                    const compliantCount = measurements.filter(m => {
                        const size = parseFloat(m.avgSize || 0);
                        return size >= 8 && size <= 12;
                    }).length;
                    const sizeCompliance = totalMeasurements > 0 ? Math.round((compliantCount / totalMeasurements) * 100) : 0;
                    const sizes = measurements.map(m => parseFloat(m.avgSize || 0)).filter(s => s > 0);
                    let consistencyScore = 100;
                    let stdDev = 0;
                    if (sizes.length > 1) {
                        const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
                        const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
                        stdDev = Math.sqrt(variance);
                        consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / 3) * 100));
                    }
                    const optimalSizeScore = sizes.length > 0 ? (() => {
                        const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
                        const targetSize = 10;
                        const deviation = Math.abs(avgSize - targetSize);
                        return Math.max(0, Math.min(100, 100 - (deviation / 5) * 100));
                    })() : 0;
                    const completenessScore = Math.min(100, (totalMeasurements / 15) * 100);
                    
                    return `
                    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2.5rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.25); flex-shrink: 0;">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">Quality Analysis</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.4;">Detailed quality score breakdown</p>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
                            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%); border: 1.5px solid rgba(16, 185, 129, 0.15); border-radius: 1rem; padding: 1.5rem;">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                    <div style="width: 40px; height: 40px; background: rgba(16, 185, 129, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <svg style="width: 20px; height: 20px; stroke: #10b981; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <div style="flex: 1; min-width: 0;">
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Size Compliance</p>
                                        <p style="margin: 0; font-size: 1.125rem; color: var(--text-primary); font-weight: 700; line-height: 1.2;">${sizeCompliance}%</p>
                                        <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">${compliantCount} of ${totalMeasurements} pellet measurements</p>
                                    </div>
                                </div>
                            </div>
                            <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.08) 0%, rgba(47, 167, 110, 0.03) 100%); border: 1.5px solid rgba(47, 167, 110, 0.15); border-radius: 1rem; padding: 1.5rem;">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                    <div style="width: 40px; height: 40px; background: rgba(47, 167, 110, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <svg style="width: 20px; height: 20px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <div style="flex: 1; min-width: 0;">
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Consistency</p>
                                        <p style="margin: 0; font-size: 1.125rem; color: var(--text-primary); font-weight: 700; line-height: 1.2;">${Math.round(consistencyScore)}%</p>
                                        <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">Std Dev: ${stdDev.toFixed(2)}mm</p>
                                    </div>
                                </div>
                            </div>
                            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%); border: 1.5px solid rgba(139, 92, 246, 0.15); border-radius: 1rem; padding: 1.5rem;">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                    <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <svg style="width: 20px; height: 20px; stroke: #8b5cf6; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                            <path d="M12 8V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <div style="flex: 1; min-width: 0;">
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Optimal Targeting</p>
                                        <p style="margin: 0; font-size: 1.125rem; color: var(--text-primary); font-weight: 700; line-height: 1.2;">${Math.round(optimalSizeScore)}%</p>
                                        <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">Target: 10mm</p>
                                    </div>
                                </div>
                            </div>
                            <div style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.03) 100%); border: 1.5px solid rgba(251, 191, 36, 0.15); border-radius: 1rem; padding: 1.5rem;">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                    <div style="width: 40px; height: 40px; background: rgba(251, 191, 36, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <svg style="width: 20px; height: 20px; stroke: #fbbf24; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <div style="flex: 1; min-width: 0;">
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Completeness</p>
                                        <p style="margin: 0; font-size: 1.125rem; color: var(--text-primary); font-weight: 700; line-height: 1.2;">${Math.round(completenessScore)}%</p>
                                        <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">${totalMeasurements} pellet measurements</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                })() : ''}
                
                <!-- Recent Measurements Table -->
                <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);">
                            <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M8 8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">All Pellet Measurements</h3>
                            <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary);">Complete measurement records (${session.measurements.length} total)</p>
                        </div>
                    </div>
                    <div style="overflow-x: auto; max-height: 400px; overflow-y: auto; position: relative;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="position: sticky; top: 0; z-index: 20; background: linear-gradient(135deg, rgba(47, 167, 110, 0.12) 0%, rgba(47, 167, 110, 0.08) 100%); backdrop-filter: blur(8px);">
                                <tr style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.12) 0%, rgba(47, 167, 110, 0.08) 100%); border-bottom: 2px solid rgba(47, 167, 110, 0.15);">
                                    <th style="padding: 1rem; text-align: left; font-size: 0.8125rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Time</th>
                                    <th style="padding: 1rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Count</th>
                                    <th style="padding: 1rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Avg Size</th>
                                    <th style="padding: 1rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Min Size</th>
                                    <th style="padding: 1rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Max Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${session.measurements.slice().reverse().map((m, idx) => `
                                    <tr style="border-bottom: 1px solid rgba(47, 167, 110, 0.06); transition: background 0.2s ease;" onmouseover="this.style.background='rgba(47, 167, 110, 0.04)'" onmouseout="this.style.background='transparent'">
                                        <td style="padding: 1rem; font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">
                                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                <svg style="width: 16px; height: 16px; stroke: var(--text-secondary); opacity: 0.6;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                                </svg>
                                                ${new Date(m.timestamp || Date.now()).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td style="padding: 1rem; text-align: center; font-size: 0.9375rem; color: var(--text-primary); font-weight: 700;">${m.count || 0}</td>
                                        <td style="padding: 1rem; text-align: center; font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${parseFloat(m.avgSize || 0).toFixed(2)} mm</td>
                                        <td style="padding: 1rem; text-align: center; font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${parseFloat(m.minSize || 0).toFixed(2)} mm</td>
                                        <td style="padding: 1rem; text-align: center; font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">${parseFloat(m.maxSize || 0).toFixed(2)} mm</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
                
                <div style="display: flex; justify-content: center; gap: 1rem; padding-top: 1.5rem; border-top: 2px solid rgba(47, 167, 110, 0.08);">
                    <button class="btn-secondary" onclick="closeAdminSessionDetailsModal()" style="display: inline-flex; align-items: center; gap: 0.5rem; background: white; color: #2FA76E; padding: 0.875rem 2rem; border-radius: 0.75rem; border: 2px solid #2FA76E; font-weight: 600; font-size: 0.9375rem; cursor: pointer; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); transition: all 0.3s ease;" onmouseover="this.style.background='rgba(47, 167, 110, 0.05)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(47, 167, 110, 0.15)'" onmouseout="this.style.background='white'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.08)'">
                        <svg style="width: 18px; height: 18px; stroke: currentColor;" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0, 0, 0, 0.6)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.webkitBackdropFilter = 'blur(8px)';
    
    // Initialize charts if ApexCharts is available and session has measurements
    if (session.measurements && session.measurements.length > 0) {
        setTimeout(() => {
            initializeAdminSessionCharts(session);
        }, 500);
    }
}

function closeAdminSessionDetailsModal() {
    const modal = document.getElementById('sessionDetailsModal');
    if (modal) {
        // Destroy ApexCharts before removing modal
        const distChartElements = modal.querySelectorAll('[id^="adminSessionDistributionChart-"]');
        const trendsChartElements = modal.querySelectorAll('[id^="adminSessionTrendsChart-"]');
        distChartElements.forEach(element => {
            if (element.chart) {
                element.chart.destroy();
            }
        });
        trendsChartElements.forEach(element => {
            if (element.chart) {
                element.chart.destroy();
            }
        });
        modal.remove();
    }
}

function initializeAdminSessionCharts(session) {
    // Wait for ApexCharts to be available
    if (typeof ApexCharts === 'undefined') {
        console.log('ApexCharts not loaded yet, retrying...');
        setTimeout(() => initializeAdminSessionCharts(session), 100);
        return;
    }
    
    console.log('Initializing charts for session:', session.id);
    
    // Distribution Chart
    const distChartElement = document.getElementById(`adminSessionDistributionChart-${session.id}`);
    console.log('Distribution chart element:', distChartElement);
    
    if (distChartElement && session.measurements && session.measurements.length > 0) {
        // Destroy existing chart if it exists
        if (distChartElement.chart) {
            distChartElement.chart.destroy();
        }
        
        const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
        const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
        const counts = new Array(bins.length - 1).fill(0);
        
        session.measurements.forEach(m => {
            const size = parseFloat(m.avgSize || 0);
            for (let i = 0; i < bins.length - 1; i++) {
                if (size >= bins[i] && size < bins[i + 1]) {
                    counts[i]++;
                    break;
                }
            }
        });
        
        const distOptions = {
            series: [{
                name: 'Number of Measurements',
                data: counts
            }],
            chart: {
                type: 'bar',
                height: 350,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: false,
                        zoom: false,
                        zoomin: false,
                        zoomout: false,
                        pan: false,
                        reset: false
                    }
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            plotOptions: {
                bar: {
                    borderRadius: 8,
                    columnWidth: '80%',
                    distributed: false,
                    dataLabels: {
                        position: 'top'
                    }
                }
            },
            colors: ['#4ECDC4'],
            dataLabels: {
                enabled: false
            },
            xaxis: {
                categories: binLabels,
                title: {
                    text: 'Diameter Size Range (mm)',
                    style: {
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#6B7280'
                    }
                },
                labels: {
                    style: {
                        fontSize: '11px',
                        fontWeight: 500,
                        colors: '#6B7280'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Number of Measurements',
                    style: {
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#6B7280'
                    }
                },
                labels: {
                    style: {
                        fontSize: '11px',
                        fontWeight: 500,
                        colors: '#6B7280'
                    }
                }
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: function(value) {
                        return value + ' measurements';
                    }
                }
            },
            grid: {
                borderColor: '#e5e7eb',
                strokeDashArray: 0,
                xaxis: {
                    lines: {
                        show: false
                    }
                },
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            }
        };
        
        distChartElement.chart = new ApexCharts(distChartElement, distOptions);
        distChartElement.chart.render();
        console.log('Distribution chart rendered successfully');
    }
    
    // Trends Chart
    const trendsChartElement = document.getElementById(`adminSessionTrendsChart-${session.id}`);
    console.log('Trends chart element:', trendsChartElement);
    if (trendsChartElement && session.measurements && session.measurements.length > 0) {
        // Destroy existing chart if it exists
        if (trendsChartElement.chart) {
            trendsChartElement.chart.destroy();
        }
        
        const measurements = session.measurements.slice().reverse();
        // Limit to last 20 measurements for better readability
        const displayMeasurements = measurements.slice(-20);
        const labels = displayMeasurements.map((m, i) => String(i + 1));
        const avgSizes = displayMeasurements.map(m => parseFloat(m.avgSize || 0));
        const minSizes = displayMeasurements.map(m => parseFloat(m.minSize || 0));
        const maxSizes = displayMeasurements.map(m => parseFloat(m.maxSize || 0));
        
        const trendsOptions = {
            series: [
                {
                    name: 'Average Size',
                    data: avgSizes
                },
                {
                    name: 'Min Size',
                    data: minSizes
                },
                {
                    name: 'Max Size',
                    data: maxSizes
                }
            ],
            chart: {
                type: 'area',
                height: 350,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: false,
                        zoom: false,
                        zoomin: false,
                        zoomout: false,
                        pan: false,
                        reset: false
                    }
                },
                animations: {
                    enabled: true,
                    easing: 'easeinout',
                    speed: 800
                }
            },
            colors: ['#2FA76E', '#FF6B6B', '#FFE66D'],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: [3.5, 2.5, 2.5]
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'light',
                    type: 'vertical',
                    shadeIntensity: 0.2,
                    gradientToColors: ['#4ECDC4', '#FFA07A', '#FFD700'],
                    inverseColors: false,
                    opacityFrom: 0.5,
                    opacityTo: 0.05,
                    stops: [0, 90, 100]
                }
            },
            markers: {
                size: 4,
                strokeWidth: 2,
                strokeColors: '#fff',
                hover: {
                    size: 7
                }
            },
            xaxis: {
                categories: labels,
                title: {
                    text: 'Measurement Number',
                    style: {
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#6B7280'
                    }
                },
                labels: {
                    style: {
                        fontSize: '11px',
                        fontWeight: 500,
                        colors: '#6B7280'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Diameter Size (mm)',
                    style: {
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#6B7280'
                    }
                },
                labels: {
                    style: {
                        fontSize: '11px',
                        fontWeight: 500,
                        colors: '#6B7280'
                    },
                    formatter: function(value) {
                        return value.toFixed(1);
                    }
                }
            },
            tooltip: {
                theme: 'dark',
                shared: true,
                intersect: false,
                y: {
                    formatter: function(value) {
                        return value.toFixed(2) + ' mm';
                    }
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'center',
                fontSize: '12px',
                fontWeight: 600,
                labels: {
                    colors: '#374151'
                },
                markers: {
                    width: 12,
                    height: 12,
                    radius: 12
                }
            },
            grid: {
                borderColor: '#e5e7eb',
                strokeDashArray: 0,
                xaxis: {
                    lines: {
                        show: false
                    }
                },
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            }
        };
        
        trendsChartElement.chart = new ApexCharts(trendsChartElement, trendsOptions);
        trendsChartElement.chart.render();
        console.log('Trends chart rendered successfully');
    }
}

// Records Management
// Load user generated reports
function loadUserReports() {
    const reportsList = document.getElementById('userReportsList');
    if (!reportsList) return;
    
    const allReports = JSON.parse(localStorage.getItem('allReports') || '[]');
    
    if (allReports.length === 0) {
        reportsList.innerHTML = '<p class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">No user reports generated yet.</p>';
        return;
    }
    
    // Sort by most recent first
    const sortedReports = allReports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    
    reportsList.innerHTML = sortedReports.map(report => `
        <div class="report-card-admin" onclick="viewReportDetails(${report.id})">
            <div class="report-card-header">
                <div>
                    <h3>${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report</h3>
                    <p class="report-meta">Generated by ${report.generatedBy}</p>
                </div>
                <span class="report-format-badge">${report.format.toUpperCase()}</span>
            </div>
            <div class="report-card-body">
                <div class="report-info-item">
                    <span class="info-label">Date Range:</span>
                    <span class="info-value">${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}</span>
                </div>
                <div class="report-info-item">
                    <span class="info-label">Generated:</span>
                    <span class="info-value">${new Date(report.generatedAt).toLocaleString()}</span>
                </div>
                <div class="report-stats">
                    <div class="report-stat">
                        <span class="stat-value">${report.data.totalSessions}</span>
                        <span class="stat-label">Sessions</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-value">${report.data.totalPellets}</span>
                        <span class="stat-label">Pellets</span>
                    </div>
                    <div class="report-stat">
                        <span class="stat-value">${report.data.averageSize}mm</span>
                        <span class="stat-label">Avg Size</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// View report details
function viewReportDetails(reportId) {
    const allReports = JSON.parse(localStorage.getItem('allReports') || '[]');
    const report = allReports.find(r => r.id === reportId);
    
    if (!report) {
        alert('Report not found');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report Details</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="report-details-content" style="padding: 2rem;">
                <div class="report-details-header" style="margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid var(--border-color);">
                    <div class="detail-row" style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="font-weight: 600; color: var(--text-secondary);">Generated By:</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${report.generatedBy}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="font-weight: 600; color: var(--text-secondary);">Date Range:</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="font-weight: 600; color: var(--text-secondary);">Generated At:</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${new Date(report.generatedAt).toLocaleString()}</span>
                    </div>
                    <div class="detail-row" style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: var(--text-secondary);">Format:</span>
                        <span style="font-weight: 600; color: var(--text-primary);">${report.format.toUpperCase()}</span>
                    </div>
                </div>
                <div class="report-summary-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="summary-card" style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.1) 0%, rgba(47, 167, 110, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(47, 167, 110, 0.1);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem;">${report.data.totalSessions}</div>
                        <div style="color: var(--text-secondary); font-weight: 500;">Total Sessions</div>
                    </div>
                    <div class="summary-card" style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.1) 0%, rgba(47, 167, 110, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(47, 167, 110, 0.1);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem;">${report.data.totalMeasurements}</div>
                        <div style="color: var(--text-secondary); font-weight: 500;">Total Pellet Measurements</div>
                    </div>
                    <div class="summary-card" style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.1) 0%, rgba(47, 167, 110, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(47, 167, 110, 0.1);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem;">${report.data.totalPellets}</div>
                        <div style="color: var(--text-secondary); font-weight: 500;">Actual Total Pellet Count</div>
                    </div>
                    <div class="summary-card" style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.1) 0%, rgba(47, 167, 110, 0.05) 100%); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(47, 167, 110, 0.1);">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem;">${report.data.averageSize}mm</div>
                        <div style="color: var(--text-secondary); font-weight: 500;">Average Size</div>
                    </div>
                </div>
                <div class="report-sessions" style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Sessions Included (${report.data.sessions.length})</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: var(--bg-secondary);">
                                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color);">Start Time</th>
                                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color);">End Time</th>
                                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color);">Pellets</th>
                                    <th style="padding: 0.75rem; text-align: left; font-weight: 600; color: var(--text-primary); border-bottom: 2px solid var(--border-color);">Pellet Measurements</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.data.sessions.map(s => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 0.75rem; color: var(--text-primary);">${new Date(s.startTime).toLocaleString()}</td>
                                        <td style="padding: 0.75rem; color: var(--text-primary);">${new Date(s.endTime).toLocaleString()}</td>
                                        <td style="padding: 0.75rem; color: var(--text-primary);">${s.totalPellets}</td>
                                        <td style="padding: 0.75rem; color: var(--text-primary);">${s.measurements}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="modal-actions" style="padding: 1.5rem; border-top: 1px solid var(--border-color);">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    };
}

// Load comprehensive data summary for all users
function loadAllUsersDataSummary() {
    const summaryContainer = document.getElementById('allUsersDataSummary');
    if (!summaryContainer) return;
    
    const allRecords = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const operators = allUsers.filter(u => u.role === 'user');
    const completedSessions = allSessions.filter(s => s.endTime);
    
    // Calculate comprehensive statistics across all users
    const totalRecords = allRecords.length;
    const totalPellets = allRecords.reduce((sum, r) => sum + (parseInt(r.totalPellets) || 0), 0);
    const totalMeasurements = allSessions.reduce((sum, s) => sum + (s.measurements?.length || 0), 0);
    
    // Calculate size statistics
    const allSizes = allRecords.map(r => parseFloat(r.avgSize || 0)).filter(s => s > 0);
    const avgSize = allSizes.length > 0 
        ? (allSizes.reduce((a, b) => a + b, 0) / allSizes.length).toFixed(2)
        : '0.00';
    const minSize = allSizes.length > 0 ? Math.min(...allSizes).toFixed(2) : '0.00';
    const maxSize = allSizes.length > 0 ? Math.max(...allSizes).toFixed(2) : '0.00';
    
    // Calculate time statistics
    const totalSessionTime = completedSessions.reduce((sum, s) => {
        if (s.endTime && s.startTime) {
            return sum + (new Date(s.endTime) - new Date(s.startTime));
        }
        return sum;
    }, 0);
    const totalHours = Math.floor(totalSessionTime / 3600000);
    const totalMinutes = Math.floor((totalSessionTime % 3600000) / 60000);
    
    // Calculate today's activity
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = allRecords.filter(r => {
        const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
        return recordDate === today;
    }).length;
    const todaySessions = allSessions.filter(s => {
        const sessionDate = new Date(s.startTime || s.id).toISOString().split('T')[0];
        return sessionDate === today;
    }).length;
    
    // Calculate this week's activity
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekRecords = allRecords.filter(r => new Date(r.timestamp) >= weekAgo).length;
    const weekSessions = allSessions.filter(s => new Date(s.startTime || s.id) >= weekAgo).length;
    
    // Calculate averages
    const avgPelletsPerSession = completedSessions.length > 0
        ? (completedSessions.reduce((sum, s) => sum + (s.totalPellets || 0), 0) / completedSessions.length).toFixed(0)
        : '0';
    const avgMeasurementsPerSession = completedSessions.length > 0
        ? (completedSessions.reduce((sum, s) => sum + (s.measurements?.length || 0), 0) / completedSessions.length).toFixed(1)
        : '0.0';
    const avgSessionTime = completedSessions.length > 0
        ? Math.floor(totalSessionTime / completedSessions.length / 60000)
        : 0;
    const pelletsPerHour = totalSessionTime > 0
        ? (totalPellets / (totalSessionTime / 3600000)).toFixed(0)
        : '0';
    
    const activeSessions = allSessions.filter(s => !s.endTime).length;
    
    summaryContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.12) 0%, rgba(47, 167, 110, 0.05) 100%); padding: 2rem; border-radius: 1.25rem; border: 2px solid rgba(47, 167, 110, 0.15); text-align: center; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.1);">
                <div style="font-size: 3rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.75rem; line-height: 1.2;">${totalRecords}</div>
                <div style="font-size: 0.9375rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Total Records</div>
                <div style="font-size: 0.8125rem; color: var(--text-secondary);">${todayRecords} today • ${weekRecords} this week</div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(78, 205, 196, 0.12) 0%, rgba(78, 205, 196, 0.05) 100%); padding: 2rem; border-radius: 1.25rem; border: 2px solid rgba(78, 205, 196, 0.15); text-align: center; box-shadow: 0 4px 16px rgba(78, 205, 196, 0.1);">
                <div style="font-size: 3rem; font-weight: 700; color: #4ECDC4; margin-bottom: 0.75rem; line-height: 1.2;">${completedSessions.length}</div>
                <div style="font-size: 0.9375rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Completed Sessions</div>
                <div style="font-size: 0.8125rem; color: var(--text-secondary);">${todaySessions} today • ${weekSessions} this week</div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(255, 107, 107, 0.12) 0%, rgba(255, 107, 107, 0.05) 100%); padding: 2rem; border-radius: 1.25rem; border: 2px solid rgba(255, 107, 107, 0.15); text-align: center; box-shadow: 0 4px 16px rgba(255, 107, 107, 0.1);">
                <div style="font-size: 3rem; font-weight: 700; color: #FF6B6B; margin-bottom: 0.75rem; line-height: 1.2;">${totalPellets.toLocaleString()}</div>
                <div style="font-size: 0.9375rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Actual Total Pellet Count</div>
                <div style="font-size: 0.8125rem; color: var(--text-secondary);">${avgPelletsPerSession} avg per session</div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(255, 230, 109, 0.12) 0%, rgba(255, 230, 109, 0.05) 100%); padding: 2rem; border-radius: 1.25rem; border: 2px solid rgba(255, 230, 109, 0.15); text-align: center; box-shadow: 0 4px 16px rgba(255, 230, 109, 0.1);">
                <div style="font-size: 3rem; font-weight: 700; color: #FFE66D; margin-bottom: 0.75rem; line-height: 1.2;">${totalMeasurements}</div>
                <div style="font-size: 0.9375rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Total Pellet Measurements</div>
                <div style="font-size: 0.8125rem; color: var(--text-secondary);">${avgMeasurementsPerSession} avg per session</div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;">
            <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.12) 0%, rgba(47, 167, 110, 0.05) 100%); padding: 2rem; border-radius: 1.25rem; border: 2px solid rgba(47, 167, 110, 0.15); text-align: center; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.1);">
                <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.75rem;">${avgSize}mm</div>
                <div style="font-size: 0.9375rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Average Size</div>
                <div style="font-size: 0.8125rem; color: var(--text-secondary);">Range: ${minSize} - ${maxSize}mm</div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%); padding: 2rem; border-radius: 1.25rem; border: 2px solid rgba(16, 185, 129, 0.15); text-align: center; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);">
                <div style="font-size: 2.5rem; font-weight: 700; color: #10b981; margin-bottom: 0.75rem;">${totalHours}h ${totalMinutes}m</div>
                <div style="font-size: 0.9375rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Total Session Time</div>
                <div style="font-size: 0.8125rem; color: var(--text-secondary);">${avgSessionTime} min avg per session</div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.05) 100%); padding: 2rem; border-radius: 1.25rem; border: 2px solid rgba(139, 92, 246, 0.15); text-align: center; box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);">
                <div style="font-size: 2.5rem; font-weight: 700; color: #8b5cf6; margin-bottom: 0.75rem;">${pelletsPerHour}</div>
                <div style="font-size: 0.9375rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Pellets Per Hour</div>
                <div style="font-size: 0.8125rem; color: var(--text-secondary);">Overall production rate</div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.05) 100%); padding: 2rem; border-radius: 1.25rem; border: 2px solid rgba(236, 72, 153, 0.15); text-align: center; box-shadow: 0 4px 16px rgba(236, 72, 153, 0.1);">
                <div style="font-size: 2.5rem; font-weight: 700; color: #ec4899; margin-bottom: 0.75rem;">${operators.length}</div>
                <div style="font-size: 0.9375rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">Total Operators</div>
                <div style="font-size: 0.8125rem; color: var(--text-secondary);">${activeSessions} active sessions</div>
            </div>
        </div>
        
        <!-- Charts Section -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 2rem; margin-top: 3rem;">
            <div class="chart-card" style="animation: fadeInUp 0.5s ease 0.1s both;">
                <div class="chart-header">
                    <h2>
                        <svg style="width: 24px; height: 24px; margin-right: 0.75rem; stroke: var(--primary-color);" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Records Over Time
                    </h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">Last 7 days</p>
                </div>
                <div class="chart-container">
                    <div id="recordsSummaryChart"></div>
                </div>
            </div>
            <div class="chart-card" style="animation: fadeInUp 0.5s ease 0.2s both;">
                <div class="chart-header">
                    <h2>
                        <svg style="width: 24px; height: 24px; margin-right: 0.75rem; stroke: var(--primary-color);" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M3 9H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M9 3V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Pellet Size Distribution
                    </h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">All time data</p>
                </div>
                <div class="chart-container">
                    <div id="sizeDistributionSummaryChart"></div>
                </div>
            </div>
            <div class="chart-card" style="animation: fadeInUp 0.5s ease 0.3s both;">
                <div class="chart-header">
                    <h2>
                        <svg style="width: 24px; height: 24px; margin-right: 0.75rem; stroke: var(--primary-color);" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3L12 8L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M3 21L12 16L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M3 12L12 17L21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Average Size Trends
                    </h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">Last 7 days</p>
                </div>
                <div class="chart-container">
                    <div id="operatorActivitySummaryChart"></div>
                </div>
            </div>
            <div class="chart-card chart-card-enhanced" style="animation: fadeInUp 0.5s ease 0.4s both;">
                <div class="chart-header">
                    <h2>
                        <svg style="width: 24px; height: 24px; margin-right: 0.75rem; stroke: var(--primary-color);" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        User Activity
                    </h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">Sessions by user</p>
                </div>
                <div class="chart-container">
                    <div id="avgSizeTrendSummaryChart"></div>
                </div>
            </div>
        </div>
        
        <style>
            .chart-header {
                margin-bottom: 1.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .chart-header h2 {
                display: flex;
                align-items: center;
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 0;
            }
            
            .chart-header h2::before {
                content: '';
                width: 4px;
                height: 24px;
                background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%);
                border-radius: 2px;
                margin-right: 0.75rem;
                flex-shrink: 0;
            }
            
            .chart-header p {
                color: var(--text-secondary);
                margin: 0;
                font-size: 0.875rem;
                font-weight: 500;
            }
            
            .chart-card-enhanced {
                background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
                border: 2px solid #e5e7eb;
            }
            
            .chart-card-enhanced .chart-container {
                background: white;
                border-radius: 12px;
                padding: 1rem;
                margin-top: 1rem;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.04);
            }
        </style>
    `;
    
    // Initialize charts after DOM is updated
    setTimeout(() => {
        initializeRecordsSummaryCharts();
    }, 100);
}

function loadRecords() {
    // This function is kept for backward compatibility but no longer displays a table
    // The data summary replaces the table
    loadAllUsersDataSummary();
}

// Initialize charts for records summary
let recordsSummaryChart = null;
let sizeDistributionSummaryChart = null;
let operatorActivitySummaryChart = null;
let avgSizeTrendSummaryChart = null;

function initializeRecordsSummaryCharts() {
    if (typeof ApexCharts === 'undefined') {
        setTimeout(initializeRecordsSummaryCharts, 100);
        return;
    }
    
    // Destroy existing charts if they exist
    if (recordsSummaryChart) {
        try {
            recordsSummaryChart.destroy();
        } catch (e) {}
        recordsSummaryChart = null;
    }
    if (sizeDistributionSummaryChart) {
        try {
            sizeDistributionSummaryChart.destroy();
        } catch (e) {}
        sizeDistributionSummaryChart = null;
    }
    if (operatorActivitySummaryChart) {
        try {
            operatorActivitySummaryChart.destroy();
        } catch (e) {}
        operatorActivitySummaryChart = null;
    }
    if (avgSizeTrendSummaryChart) {
        try {
            avgSizeTrendSummaryChart.destroy();
        } catch (e) {}
        avgSizeTrendSummaryChart = null;
    }
    
    const allRecords = JSON.parse(localStorage.getItem('pelletRecords') || '[]');
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    const operators = allUsers.filter(u => u.role === 'user');
    
    // Records Over Time Chart
    const recordsCtx = document.getElementById('recordsSummaryChart');
    if (recordsCtx) {
        // Group records by date (last 7 days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const recordsByDate = last7Days.map(date => {
            return allRecords.filter(r => {
                const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
                return recordDate === date;
            }).length;
        });
        
        const dateLabels = last7Days.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        recordsSummaryChart = new ApexCharts(recordsCtx, {
            series: [{ name: 'Records', data: recordsByDate }],
            chart: {
                type: 'area',
                height: 280,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } },
                animations: { enabled: true, easing: 'easeinout', speed: 800 }
            },
            colors: ['#2FA76E'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            fill: { type: 'gradient', gradient: { opacityFrom: 0.7, opacityTo: 0.15, stops: [0, 90, 100] } },
            markers: { size: 5, strokeWidth: 2, strokeColors: '#ffffff', colors: ['#2FA76E'], hover: { size: 7 } },
            xaxis: { categories: dateLabels, title: { text: 'Date', style: { fontSize: '13px', fontWeight: 600, color: '#6B7280' } }, labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' } } },
            yaxis: { title: { text: 'Number of Records', style: { fontSize: '13px', fontWeight: 600, color: '#6B7280' } }, labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' } } },
            tooltip: { theme: 'dark', y: { formatter: function(value) { return value + ' records'; } } },
            grid: { borderColor: '#e5e7eb', strokeDashArray: 0, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } }
        });
        recordsSummaryChart.render();
    }
    
    // Size Distribution Chart
    const sizeCtx = document.getElementById('sizeDistributionSummaryChart');
    if (sizeCtx) {
        const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
        const binCounts = new Array(bins.length - 1).fill(0);
        
        allRecords.forEach(record => {
            const size = parseFloat(record.avgSize || 0);
            if (size > 0) {
                for (let i = 0; i < bins.length - 1; i++) {
                    if (size >= bins[i] && size < bins[i + 1]) {
                        binCounts[i]++;
                        break;
                    }
                }
            }
        });
        
        const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
        
        sizeDistributionSummaryChart = new ApexCharts(sizeCtx, {
            series: [{ name: 'Number of Pellets', data: binCounts }],
            chart: {
                type: 'bar',
                height: 280,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } },
                animations: { enabled: true, easing: 'easeinout', speed: 800 }
            },
            plotOptions: { bar: { borderRadius: 8, columnWidth: '80%', distributed: false, dataLabels: { position: 'top' } } },
            colors: ['#4ECDC4'],
            dataLabels: { enabled: false },
            xaxis: { categories: binLabels, title: { text: 'Diameter Size Range (mm)', style: { fontSize: '13px', fontWeight: 600, color: '#6B7280' } }, labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' } } },
            yaxis: { title: { text: 'Number of Records', style: { fontSize: '13px', fontWeight: 600, color: '#6B7280' } }, labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' } } },
            tooltip: { theme: 'dark', x: { formatter: function(value) { return 'Size Range: ' + value + ' mm'; } }, y: { formatter: function(value) { return value + ' pellets'; } } },
            grid: { borderColor: '#e5e7eb', strokeDashArray: 0, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } }
        });
        sizeDistributionSummaryChart.render();
    }
    
    // Average Size Trends Chart
    const activityCtx = document.getElementById('operatorActivitySummaryChart');
    if (activityCtx) {
        // Group records by date (last 7 days) and calculate average size per day
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const avgSizeByDate = last7Days.map(date => {
            const dayRecords = allRecords.filter(r => {
                if (!r.timestamp) return false;
                try {
                    const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
                    return recordDate === date;
                } catch (e) {
                    return false;
                }
            });
            
            if (dayRecords.length === 0) return 0;
            
            const sizes = dayRecords
                .map(r => parseFloat(r.avgSize || 0))
                .filter(s => !isNaN(s) && s > 0);
            
            if (sizes.length === 0) return 0;
            
            const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
            return parseFloat(avg.toFixed(2));
        });
        
        const sizeLabels = last7Days.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        operatorActivitySummaryChart = new ApexCharts(activityCtx, {
            series: [{ name: 'Average Size', data: avgSizeByDate }],
            chart: {
                type: 'area',
                height: 280,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } },
                animations: { enabled: true, easing: 'easeinout', speed: 800 }
            },
            colors: ['#FF6B6B'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            fill: { type: 'gradient', gradient: { opacityFrom: 0.7, opacityTo: 0.15, stops: [0, 90, 100] } },
            markers: { size: 5, strokeWidth: 2, strokeColors: '#ffffff', colors: ['#FF6B6B'], hover: { size: 7 } },
            xaxis: { categories: sizeLabels, title: { text: 'Date', style: { fontSize: '13px', fontWeight: 600, color: '#6B7280' } }, labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' } } },
            yaxis: { title: { text: 'Average Size (mm)', style: { fontSize: '13px', fontWeight: 600, color: '#6B7280' } }, labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' }, formatter: function(value) { return value !== null ? value.toFixed(1) : ''; } } },
            tooltip: { theme: 'dark', y: { formatter: function(value) { return value !== null ? value.toFixed(2) + ' mm' : 'No data'; } } },
            grid: { borderColor: '#e5e7eb', strokeDashArray: 0, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } }
        });
        operatorActivitySummaryChart.render();
    }
    
    // User Activity Chart
    const avgSizeTrendCtx = document.getElementById('avgSizeTrendSummaryChart');
    if (avgSizeTrendCtx) {
        // Get sessions per user (match by operator username)
        const userSessionCount = {};
        allSessions.forEach(session => {
            // Try to match by operator field (username) or userId
            const operatorName = session.operator || session.userId || 'Unknown';
            if (!userSessionCount[operatorName]) {
                userSessionCount[operatorName] = 0;
            }
            userSessionCount[operatorName]++;
        });
        
        // Get user names and match with session counts by username
        let userActivityData = operators.map(user => {
            // Match sessions by username (operator field in sessions)
            const sessionCount = userSessionCount[user.username] || userSessionCount[user.id] || 0;
            return {
                name: user.name || user.username || 'Unknown',
                count: sessionCount
            };
        });
        
        // Add any unknown users that don't match
        if (userSessionCount['Unknown'] && userSessionCount['Unknown'] > 0) {
            userActivityData.push({
                name: 'Unknown User',
                count: userSessionCount['Unknown']
            });
        }
        
        // Filter and sort
        userActivityData = userActivityData.filter(u => u.count > 0).sort((a, b) => b.count - a.count).slice(0, 10);
        
        // If no data, create placeholder
        if (userActivityData.length === 0) {
            userActivityData = [{ name: 'No Data Available', count: 0 }];
        }
        
        const userLabels = userActivityData.map(u => {
            const name = u.name;
            return name.length > 20 ? name.substring(0, 20) + '...' : name;
        });
        const userData = userActivityData.map(u => u.count);
        
        avgSizeTrendSummaryChart = new ApexCharts(avgSizeTrendCtx, {
            series: [{ name: 'Sessions', data: userData }],
            chart: {
                type: 'bar',
                height: 280,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } },
                animations: { enabled: true, easing: 'easeinout', speed: 800 }
            },
            plotOptions: { bar: { borderRadius: 8, columnWidth: '60%', distributed: false, dataLabels: { position: 'top' } } },
            colors: ['#8b5cf6'],
            dataLabels: { enabled: false },
            xaxis: { categories: userLabels, title: { text: 'User', style: { fontSize: '13px', fontWeight: 600, color: '#6B7280' } }, labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' }, rotate: -45, rotateAlways: false } },
            yaxis: { title: { text: 'Number of Sessions', style: { fontSize: '13px', fontWeight: 600, color: '#6B7280' } }, labels: { style: { fontSize: '11px', fontWeight: 500, colors: '#6B7280' } } },
            tooltip: { theme: 'dark', y: { formatter: function(value) { return value + ' sessions'; } } },
            grid: { borderColor: '#e5e7eb', strokeDashArray: 0, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } }
        });
        avgSizeTrendSummaryChart.render();
    }
}

function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add New Record';
    document.getElementById('recordForm').reset();
    document.getElementById('recordId').value = '';
    document.getElementById('recordModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('recordModal').style.display = 'none';
}

function editRecord(id) {
    const record = records.find(r => r.id === id);
    if (!record) return;

    document.getElementById('modalTitle').textContent = 'Edit Record';
    document.getElementById('recordId').value = record.id;
    document.getElementById('avgSize').value = record.avgSize;
    document.getElementById('minSize').value = record.minSize;
    document.getElementById('maxSize').value = record.maxSize;
    document.getElementById('totalPellets').value = record.totalPellets;
    document.getElementById('operator').value = record.operator;
    document.getElementById('notes').value = record.notes || '';
    document.getElementById('recordModal').style.display = 'block';
}

function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        records = records.filter(r => r.id !== id);
        localStorage.setItem('pelletRecords', JSON.stringify(records));
        loadRecords();
        if (window.location.pathname.includes('admin-dashboard.html')) {
            loadDashboardStats();
            loadRecentActivity();
        }
    }
}

// Record Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const recordForm = document.getElementById('recordForm');
    if (recordForm) {
        recordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const id = document.getElementById('recordId').value;
            const recordData = {
                avgSize: parseFloat(document.getElementById('avgSize').value),
                minSize: parseFloat(document.getElementById('minSize').value),
                maxSize: parseFloat(document.getElementById('maxSize').value),
                totalPellets: parseInt(document.getElementById('totalPellets').value),
                operator: document.getElementById('operator').value,
                notes: document.getElementById('notes').value,
                timestamp: new Date().toISOString()
            };

            if (id) {
                // Edit existing
                const index = records.findIndex(r => r.id === parseInt(id));
                if (index !== -1) {
                    records[index] = { ...records[index], ...recordData };
                }
            } else {
                // Add new
                const newId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
                records.push({ id: newId, ...recordData });
            }

            localStorage.setItem('pelletRecords', JSON.stringify(records));
            closeModal();
            loadRecords();
            if (window.location.pathname.includes('admin-dashboard.html')) {
                loadDashboardStats();
                loadRecentActivity();
            }
        });
    }

    // Close modal on outside click
    window.onclick = function(event) {
        const modal = document.getElementById('recordModal');
        if (event.target === modal) {
            closeModal();
        }
        const userModal = document.getElementById('userDetailsModal');
        if (event.target === userModal) {
            closeUserDetailsModal();
        }
    };
});

// System Monitoring
function loadMonitoringData() {
    updatePerformanceMetrics();
    loadSensorStatus();
    loadSystemEvents();
}

function updateMonitoringData() {
    updatePerformanceMetrics();
    loadSensorStatus();
}

function updatePerformanceMetrics() {
    // Check if elements exist (for old monitoring page structure)
    const cpuValue = document.getElementById('cpuValue');
    const cpuProgress = document.getElementById('cpuProgress');
    
    // If elements don't exist, this is the new operator monitoring page - skip
    if (!cpuValue || !cpuProgress) {
        return;
    }
    
    // Check system status
    const systemStatus = localStorage.getItem('systemStatus') !== 'false';
    
    let cpu, memory, disk, network;
    
    if (systemStatus) {
        // Simulate real-time data when system is online
        cpu = Math.floor(Math.random() * 30) + 30;
        memory = Math.floor(Math.random() * 30) + 50;
        disk = Math.floor(Math.random() * 20) + 30;
        network = Math.floor(Math.random() * 20) + 20;
    } else {
        // Set all values to 0 when system is off
        cpu = 0;
        memory = 0;
        disk = 0;
        network = 0;
    }

    cpuValue.textContent = cpu + '%';
    cpuProgress.style.width = cpu + '%';
    
    const memoryValue = document.getElementById('memoryValue');
    const memoryProgress = document.getElementById('memoryProgress');
    if (memoryValue && memoryProgress) {
        memoryValue.textContent = memory + '%';
        memoryProgress.style.width = memory + '%';
    }
    
    const diskValue = document.getElementById('diskValue');
    const diskProgress = document.getElementById('diskProgress');
    if (diskValue && diskProgress) {
        diskValue.textContent = disk + '%';
        diskProgress.style.width = disk + '%';
    }
    
    const networkValue = document.getElementById('networkValue');
    const networkProgress = document.getElementById('networkProgress');
    if (networkValue && networkProgress) {
        networkValue.textContent = network + '%';
        networkProgress.style.width = network + '%';
    }
}

function loadSensorStatus() {
    // Check sensor status
    const sensorsStatus = localStorage.getItem('sensorsStatus') !== 'false';
    
    const sensors = [
        { name: 'Camera Sensor', lastUpdate: '2s ago' },
        { name: 'Size Measurement Sensor', lastUpdate: '1s ago' },
        { name: 'Temperature Sensor', lastUpdate: '3s ago' },
        { name: 'Motion Sensor', lastUpdate: '1s ago' }
    ];

    const sensorList = document.getElementById('sensorList');
    if (sensorList) {
        sensorList.innerHTML = sensors.map(sensor => {
            const status = sensorsStatus ? 'online' : 'offline';
            return `
                <div class="sensor-item">
                    <div class="sensor-info">
                        <span class="sensor-name">${sensor.name}</span>
                        <span class="sensor-update">Updated ${sensor.lastUpdate}</span>
                    </div>
                    <span class="sensor-status status-${status}">${status}</span>
                </div>
            `;
        }).join('');
    }
}

function loadSystemEvents() {
    const savedEvents = JSON.parse(localStorage.getItem('systemEvents') || '[]');
    const defaultEvents = [
        { time: '2 minutes ago', message: 'Measurement session started', type: 'info', timestamp: new Date(Date.now() - 120000).toISOString() },
        { time: '5 minutes ago', message: 'New record added', type: 'success', timestamp: new Date(Date.now() - 300000).toISOString() },
        { time: '10 minutes ago', message: 'System check completed', type: 'info', timestamp: new Date(Date.now() - 600000).toISOString() },
        { time: '15 minutes ago', message: 'Camera calibration successful', type: 'success', timestamp: new Date(Date.now() - 900000).toISOString() }
    ];
    
    // Merge saved events with defaults if no saved events exist
    const events = savedEvents.length > 0 ? savedEvents : defaultEvents;
    
    // Sort by timestamp (newest first)
    events.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0);
        const timeB = new Date(b.timestamp || 0);
        return timeB - timeA;
    });

    const eventsList = document.getElementById('eventsList');
    if (eventsList) {
        if (events.length === 0) {
            eventsList.innerHTML = '<p class="no-data">No recent events</p>';
            return;
        }
        
        eventsList.innerHTML = events.slice(0, 10).map(event => {
            const timeText = event.time || getTimeAgo(event.timestamp);
            return `
                <div class="event-item event-${event.type}">
                    <span class="event-time">${timeText}</span>
                    <span class="event-message">${event.message}</span>
                </div>
            `;
        }).join('');
    }
}

function getTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

function refreshMonitoring() {
    const refreshBtn = document.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
        
        // Simulate refresh delay for better UX
        setTimeout(() => {
            loadMonitoringData();
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }, 500);
    } else {
        loadMonitoringData();
    }
}

// System and Sensor Controls
let systemStatus = true;
let sensorsStatus = true;
// performanceChart is now managed by monitoring-charts.js
// Removed duplicate declaration to prevent conflicts

function toggleSystem() {
    systemStatus = !systemStatus;
    const btn = document.getElementById('systemToggle');
    const text = document.getElementById('systemToggleText');
    
    if (systemStatus) {
        btn.className = 'btn-primary';
        text.textContent = 'Turn System Off';
        updateSystemHealth(true);
        updatePerformanceChartFromAdmin(true);
        updatePerformanceMetrics(); // Update metrics immediately
        addSystemEvent('System turned ON', 'success');
    } else {
        btn.className = 'btn-danger';
        text.textContent = 'Turn System On';
        updateSystemHealth(false);
        updatePerformanceChartFromAdmin(false);
        updatePerformanceMetrics(); // Set all metrics to 0 immediately
        addSystemEvent('System turned OFF', 'warning');
    }
    
    localStorage.setItem('systemStatus', systemStatus);
}

function toggleSensors() {
    sensorsStatus = !sensorsStatus;
    const btn = document.getElementById('sensorsToggle');
    const text = document.getElementById('sensorsToggleText');
    
    if (sensorsStatus) {
        btn.className = 'btn-secondary';
        text.textContent = 'Turn Sensors Off';
        updateSensorStatus(true);
        loadSensorStatus(); // Update sensor list immediately
        addSystemEvent('Sensors turned ON', 'success');
    } else {
        btn.className = 'btn-danger';
        text.textContent = 'Turn Sensors On';
        updateSensorStatus(false);
        loadSensorStatus(); // Update sensor list immediately to show offline
        addSystemEvent('Sensors turned OFF', 'warning');
    }
    
    localStorage.setItem('sensorsStatus', sensorsStatus);
}

function updateSystemHealth(isOnline) {
    const healthItems = document.querySelectorAll('.health-status');
    healthItems.forEach(item => {
        if (isOnline) {
            item.className = 'health-status status-online';
            item.textContent = 'Online';
        } else {
            item.className = 'health-status status-offline';
            item.textContent = 'Offline';
        }
    });
}

function updateSensorStatus(isOnline) {
    const sensorItems = document.querySelectorAll('.sensor-status');
    sensorItems.forEach(item => {
        if (isOnline) {
            item.className = 'sensor-status status-online';
            item.textContent = 'online';
        } else {
            item.className = 'sensor-status status-offline';
            item.textContent = 'offline';
        }
    });
    
    // Update sensor list to reflect status
    loadSensorStatus();
    
    // Update sensor chart
    if (typeof window.updateSensorChart === 'function') {
        window.updateSensorChart(isOnline);
    }
}

function updatePerformanceChartFromAdmin(isOnline) {
    if (typeof window.updatePerformanceChart === 'function') {
        window.updatePerformanceChart(isOnline);
    }
}

function addSystemEvent(message, type) {
    const events = JSON.parse(localStorage.getItem('systemEvents') || '[]');
    const event = {
        time: 'Just now',
        message: message,
        type: type,
        timestamp: new Date().toISOString()
    };
    events.unshift(event);
    // Keep only last 50 events
    if (events.length > 50) {
        events.pop();
    }
    localStorage.setItem('systemEvents', JSON.stringify(events));
    loadSystemEvents();
}

// Active Sessions Modal
window.openActiveSessionsModal = function openActiveSessionsModal() {
    loadActiveSessions();
    const modal = document.getElementById('activeSessionsModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

window.closeActiveSessionsModal = function closeActiveSessionsModal() {
    const modal = document.getElementById('activeSessionsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function loadActiveSessions() {
    const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const activeSessions = sessions.filter(s => {
        // Check if session is active (within last hour and no end time)
        const sessionTime = new Date(s.startTime);
        const now = new Date();
        return (now - sessionTime) < 3600000 && !s.endTime;
    });
    
    const list = document.getElementById('activeSessionsList');
    if (!list) return;
    
    if (activeSessions.length === 0) {
        list.innerHTML = '<p class="no-data">No active sessions</p>';
        return;
    }
    
    list.innerHTML = activeSessions.map(session => {
        const duration = Math.floor((new Date() - new Date(session.startTime)) / 1000);
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        return `
            <div class="session-card">
                <div class="session-card-header">
                    <div>
                        <h4>Session #${session.id}</h4>
                        <p class="session-user">User: ${session.operator || 'Unknown'}</p>
                    </div>
                    <span class="session-status-badge status-active">Active</span>
                </div>
                <div class="session-card-body">
                    <div class="session-stat">
                        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <div>
                            <span class="stat-value">${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</span>
                            <span class="stat-label">Duration</span>
                        </div>
                    </div>
                    <div class="session-stat">
                        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <div>
                            <span class="stat-value">${session.measurements?.length || 0}</span>
                            <span class="stat-label">Pellet Measurements</span>
                        </div>
                    </div>
                    <div class="session-stat">
                        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <div>
                            <span class="stat-value">${session.totalPellets || 0}</span>
                            <span class="stat-label">Actual Total Pellet Count</span>
                        </div>
                    </div>
                </div>
                <div class="session-card-footer">
                    <span class="session-time">Started: ${new Date(session.startTime).toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Initialize system status
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-monitoring.html')) {
        systemStatus = localStorage.getItem('systemStatus') !== 'false';
        sensorsStatus = localStorage.getItem('sensorsStatus') !== 'false';
        
        const systemBtn = document.getElementById('systemToggle');
        const sensorsBtn = document.getElementById('sensorsToggle');
        
        if (systemBtn && !systemStatus) {
            systemBtn.className = 'btn-danger';
            document.getElementById('systemToggleText').textContent = 'Turn System On';
            updateSystemHealth(false);
            updatePerformanceChartFromAdmin(false);
            updatePerformanceMetrics(); // Set metrics to 0 on page load if system is off
        } else if (systemBtn) {
            updateSystemHealth(true);
        }
        
        if (sensorsBtn && !sensorsStatus) {
            sensorsBtn.className = 'btn-danger';
            document.getElementById('sensorsToggleText').textContent = 'Turn Sensors On';
            updateSensorStatus(false);
            loadSensorStatus(); // Show sensors as offline on page load if sensors are off
        } else if (sensorsBtn) {
            updateSensorStatus(true);
        }
    }
    
    // Close modals on outside click
    window.addEventListener('click', function(event) {
        const activeModal = document.getElementById('activeSessionsModal');
        if (event.target === activeModal) {
            closeActiveSessionsModal();
        }
    });
});

// Remove location filter button if it exists
function removeLocationFilterButton() {
    // Remove any location filter buttons or dropdowns
    setTimeout(() => {
        const locationButtons = document.querySelectorAll('[class*="location"][class*="filter"], [class*="location"][class*="button"], [id*="location"][id*="filter"], [id*="location"][id*="button"]');
        locationButtons.forEach(btn => {
            const computedStyle = window.getComputedStyle(btn);
            if ((computedStyle.position === 'fixed' || computedStyle.position === 'absolute') && 
                computedStyle.bottom && computedStyle.left) {
                btn.remove();
            }
        });
        
        // Also check for any elements with location-related content in bottom-left position
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if ((style.position === 'fixed' || style.position === 'absolute') && 
                style.bottom && style.left) {
                const className = String(el.className || '').toLowerCase();
                const id = String(el.id || '').toLowerCase();
                const text = String(el.textContent || '').toLowerCase();
                if ((className.includes('location') || id.includes('location') || text.includes('location')) &&
                    (className.includes('filter') || className.includes('button') ||
                     className.includes('dropdown') || id.includes('filter') ||
                     id.includes('button') || id.includes('dropdown'))) {
                    el.remove();
                }
            }
        });
    }, 100);
}
