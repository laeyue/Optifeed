// User Dashboard Functions - Database Version

// Load dashboard statistics from API
async function loadDashboardStats() {
    try {
        const stats = await apiRequest(API_CONFIG.ENDPOINTS.DASHBOARD_STATS);
        
        // Update measurement statistics
        if (document.getElementById('totalPelletsDisplay')) {
            document.getElementById('totalPelletsDisplay').textContent = stats.measurements.total_pellets.toLocaleString();
        }
        if (document.getElementById('avgSizeDisplay')) {
            document.getElementById('avgSizeDisplay').textContent = stats.measurements.avg_size;
        }
        if (document.getElementById('minSizeDisplay')) {
            document.getElementById('minSizeDisplay').textContent = stats.measurements.min_size;
        }
        if (document.getElementById('maxSizeDisplay')) {
            document.getElementById('maxSizeDisplay').textContent = stats.measurements.max_size;
        }
        if (document.getElementById('measurementCount')) {
            document.getElementById('measurementCount').textContent = `Pellet Measurements: ${stats.measurements.total_measurements}`;
        }
        if (document.getElementById('avgPelletsPerMeasurement')) {
            const avgPerMeasurement = stats.measurements.total_measurements > 0
                ? (stats.measurements.total_pellets / stats.measurements.total_measurements).toFixed(1)
                : '0.0';
            document.getElementById('avgPelletsPerMeasurement').textContent = `Avg/Measurement: ${avgPerMeasurement}`;
        }
        
        // Update sensor statistics
        if (document.getElementById('totalSensors')) {
            document.getElementById('totalSensors').textContent = stats.sensors.total;
        }
        if (document.getElementById('onlineSensors')) {
            document.getElementById('onlineSensors').textContent = stats.sensors.online;
        }
        if (document.getElementById('offlineSensors')) {
            document.getElementById('offlineSensors').textContent = stats.sensors.offline;
        }
        
        // Update session statistics
        if (document.getElementById('totalSessions')) {
            document.getElementById('totalSessions').textContent = stats.measurements.total_sessions;
        }
        if (document.getElementById('activeSessions')) {
            document.getElementById('activeSessions').textContent = stats.measurements.active_sessions;
        }
        
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    loadDashboardStats();
    
    // Refresh stats every 30 seconds
    setInterval(loadDashboardStats, 30000);
});
