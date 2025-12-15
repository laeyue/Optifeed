// Admin Dashboard Functionality - Database Version

// Load dashboard stats from API
async function loadDashboardStats() {
    try {
        const stats = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_STATS);
        
        if (!stats.success) {
            console.error('Failed to load stats:', stats);
            return;
        }

        const data = stats.stats;

        // Update DOM elements
        if (document.getElementById('totalRecords')) {
            document.getElementById('totalRecords').textContent = data.records.total;
            document.getElementById('recordsChange').textContent = `+${data.records.today} today`;
        }
        
        if (document.getElementById('activeSessions')) {
            document.getElementById('activeSessions').textContent = data.sessions.active;
        }
        
        if (document.getElementById('avgPelletSize')) {
            const avgSize = data.measurements.avg_size > 0 ? data.measurements.avg_size.toFixed(2) : '0.00';
            const minSize = data.measurements.min_size > 0 ? data.measurements.min_size.toFixed(2) : '0.00';
            const maxSize = data.measurements.max_size > 0 ? data.measurements.max_size.toFixed(2) : '0.00';
            document.getElementById('avgPelletSize').textContent = avgSize;
            document.getElementById('sizeRange').textContent = `Range: ${minSize} - ${maxSize}mm`;
        }
        
        if (document.getElementById('systemStatus')) {
            // System status from localStorage (maintains original toggle behavior)
            const systemStatus = localStorage.getItem('systemStatus') !== 'false' ? 'Online' : 'Offline';
            const sensorsStatus = localStorage.getItem('sensorsStatus') !== 'false' ? 'Online' : 'Offline';
            document.getElementById('systemStatus').textContent = systemStatus;
            document.getElementById('sensorStatus').textContent = `Sensors: ${sensorsStatus}`;
        }
        
        if (document.getElementById('totalUsers')) {
            document.getElementById('totalUsers').textContent = data.users.total;
            document.getElementById('usersBreakdown').textContent = `${data.users.admins} Admins, ${data.users.operators} Operators`;
        }
        
        if (document.getElementById('totalReports')) {
            document.getElementById('totalReports').textContent = data.reports.total;
            document.getElementById('reportsChange').textContent = `+${data.reports.week} this week`;
        }
        
        if (document.getElementById('totalSessions')) {
            document.getElementById('totalSessions').textContent = data.sessions.total;
            document.getElementById('sessionsChange').textContent = `+${data.sessions.today} today`;
        }
        
        if (document.getElementById('totalPellets')) {
            document.getElementById('totalPellets').textContent = data.measurements.total_pellets.toLocaleString();
            document.getElementById('pelletsChange').textContent = `+${data.measurements.today_pellets} today`;
        }

    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        showNotification('Failed to load dashboard statistics', 'error');
    }
}

// Load recent activity from API
async function loadRecentActivity() {
    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_ACTIVITY + '?limit=10');
        
        if (!result.success) {
            console.error('Failed to load activity:', result);
            return;
        }

        const activityList = document.getElementById('activityList');
        const activityCount = document.getElementById('activityCount');
        
        if (!activityList) return;

        const activities = result.activities;

        // Update activity count
        if (activityCount) {
            activityCount.textContent = activities.length;
        }

        if (activities.length === 0) {
            activityList.innerHTML = '<div class="no-activity"><p>No recent activity</p></div>';
            return;
        }

        // Helper function to get time ago
        function getTimeAgo(timestamp) {
            const now = new Date();
            const time = new Date(timestamp);
            const diff = Math.floor((now - time) / 1000);

            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
            if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
            return time.toLocaleDateString();
        }


        // Render activities
        let html = '';
        activities.forEach(activity => {
            const timeAgo = getTimeAgo(activity.timestamp);
            const userName = activity.user_name || activity.operator || 'Unknown';
            const username = activity.username || activity.operator || 'unknown';

            if (activity.type === 'record') {
                const record = activity.data;
                html += `
                    <div class="activity-card record-type">
                        <div class="activity-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M14 2V8H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="activity-main-content">
                            <div class="activity-header">
                                <div>
                                    <h3 class="activity-title">
                                        ${userName}
                                        <span class="activity-type-badge record">Record</span>
                                    </h3>
                                </div>
                            </div>
                            <p style="margin: 0.5rem 0; color: var(--text-secondary);">Recorded measurements</p>
                            <div class="activity-details">
                                <div class="activity-detail-item">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                    <span>Avg: <strong>${parseFloat(record.avg_size || 0).toFixed(2)}mm</strong></span>
                                </div>
                                <div class="activity-detail-item">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <span>Total: <strong>${parseInt(record.total_pellets || 0)}</strong> pellets</span>
                                </div>
                            </div>
                        </div>
                        <div class="activity-time-section">
                            <div class="activity-time">${new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div class="activity-time-ago">${timeAgo}</div>
                        </div>
                    </div>
                `;
            } else if (activity.type === 'session') {
                const session = activity.data;
                html += `
                    <div class="activity-card session-type">
                        <div class="activity-icon-wrapper">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="activity-main-content">
                            <div class="activity-header">
                                <div>
                                    <h3 class="activity-title">
                                        ${userName}
                                        <span class="activity-type-badge session">Session</span>
                                    </h3>
                                </div>
                            </div>
                            <p style="margin: 0.5rem 0; color: var(--text-secondary);">Completed a measurement session</p>
                            <div class="activity-details">
                                <div class="activity-detail-item">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                    <span>Duration: <strong>${formatDuration(session.duration_seconds)}</strong></span>
                                </div>
                            </div>
                        </div>
                        <div class="activity-time-section">
                            <div class="activity-time">${new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                            <div class="activity-time-ago">${timeAgo}</div>
                        </div>
                    </div>
                `;
            }
        });

        activityList.innerHTML = html;

    } catch (error) {
        console.error('Failed to load recent activity:', error);
    }
}

// Helper function to format duration
function formatDuration(seconds) {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add CSS for notifications
function addNotificationStyles() {
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            z-index: 10000;
            max-width: 400px;
        }
        .notification.show {
            opacity: 1;
            transform: translateX(0);
        }
        .notification-success {
            border-left: 4px solid #10b981;
        }
        .notification-error {
            border-left: 4px solid #ef4444;
        }
        .notification-info {
            border-left: 4px solid #3b82f6;
        }
    `;
    document.head.appendChild(style);
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Add notification styles
    addNotificationStyles();

    // Load dashboard data
    if (window.location.pathname.includes('admin-dashboard.html')) {
        loadDashboardStats();
        loadRecentActivity();

        // Auto-refresh every 30 seconds
        setInterval(() => {
            loadDashboardStats();
            loadRecentActivity();
        }, 30000);
    }

    // Load records page
    if (window.location.pathname.includes('admin-records.html')) {
        loadRecords();
    }
});

// Load records from API
async function loadRecords() {
    try {
        const sessions = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS);
        const records = await apiRequest(API_CONFIG.ENDPOINTS.RECORDS + '?limit=1000');

        const recordsList = document.getElementById('recordsList');
        if (!recordsList) return;

        if (!records.records || records.records.length === 0) {
            recordsList.innerHTML = '<div class="no-data-container"><p class="no-data">No records found</p></div>';
            return;
        }

        // Sort by timestamp descending
        const sortedRecords = records.records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        let html = '';
        sortedRecords.forEach(record => {
            const timestamp = new Date(record.timestamp).toLocaleString();
            html += `
                <div class="record-card">
                    <div class="record-header">
                        <h3>Record #${record.id}</h3>
                        <span class="record-time">${timestamp}</span>
                    </div>
                    <div class="record-details">
                        <div class="record-stat">
                            <span class="stat-label">Operator</span>
                            <span class="stat-value">${record.operator || 'Unknown'}</span>
                        </div>
                        <div class="record-stat">
                            <span class="stat-label">Avg Size</span>
                            <span class="stat-value">${parseFloat(record.avg_size || 0).toFixed(2)} mm</span>
                        </div>
                        <div class="record-stat">
                            <span class="stat-label">Total Pellets</span>
                            <span class="stat-value">${parseInt(record.total_pellets || 0)}</span>
                        </div>
                        ${record.session_id ? `
                        <div class="record-stat">
                            <span class="stat-label">Session</span>
                            <span class="stat-value">#${record.session_id}</span>
                        </div>
                        ` : ''}
                    </div>
                    ${record.notes ? `<div class="record-notes">${record.notes}</div>` : ''}
                    <div class="record-actions">
                        <button class="btn-secondary btn-sm" onclick="viewRecordDetails(${record.id})">View Details</button>
                        <button class="btn-danger btn-sm" onclick="deleteRecord(${record.id})">Delete</button>
                    </div>
                </div>
            `;
        });

        recordsList.innerHTML = html;

    } catch (error) {
        console.error('Failed to load records:', error);
        showNotification('Failed to load records', 'error');
    }
}

// Delete record
async function deleteRecord(id) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
        await apiRequest(API_CONFIG.ENDPOINTS.RECORD_BY_ID(id), {
            method: 'DELETE'
        });

        showNotification('Record deleted successfully', 'success');
        loadRecords();

        // Reload dashboard if on dashboard page
        if (window.location.pathname.includes('admin-dashboard.html')) {
            loadDashboardStats();
            loadRecentActivity();
        }

    } catch (error) {
        console.error('Failed to delete record:', error);
        showNotification('Failed to delete record', 'error');
    }
}

// View record details (placeholder)
function viewRecordDetails(id) {
    showNotification('Record details view coming soon', 'info');
}

// Make functions globally available
window.loadDashboardStats = loadDashboardStats;
window.loadRecentActivity = loadRecentActivity;
window.loadRecords = loadRecords;
window.deleteRecord = deleteRecord;
window.viewRecordDetails = viewRecordDetails;
window.showNotification = showNotification;
