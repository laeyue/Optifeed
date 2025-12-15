// API Configuration
const API_CONFIG = {
    // Always hit same-origin API; avoids hard-coded hosts and caches
    BASE_URL: '/api',
    ENDPOINTS: {
        LOGIN: '/auth/login',
        SIGNUP: '/auth/signup',
        SENSORS: '/sensors',
        SENSOR_READINGS: (id) => `/sensors/${id}/readings`,
        SESSIONS: '/measurements/sessions',
        SESSION_BY_ID: (id) => `/measurements/sessions/${id}`,
        SESSION_RECORDS: (id) => `/measurements/sessions/${id}/records`,
        RECORDS: '/measurements/records',
        RECORD_BY_ID: (id) => `/measurements/records/${id}`,
        REPORTS: '/measurements/reports',
        REPORT_BY_ID: (id) => `/measurements/reports/${id}`,
        DASHBOARD_STATS: '/measurements/dashboard/stats',
        // Admin endpoints
        ADMIN_DASHBOARD_STATS: '/admin/dashboard/stats',
        ADMIN_ACTIVITY: '/admin/dashboard/activity',
        ADMIN_CHARTS: '/admin/dashboard/charts',
        ADMIN_USERS_STATS: '/admin/users/stats',
        ADMIN_USER_UPDATE: (id) => `/admin/users/${id}`,
        ADMIN_USER_DELETE: (id) => `/admin/users/${id}`,
        ADMIN_LOCATIONS_STATS: '/admin/locations/stats',
        ADMIN_LOCATION_CREATE: '/admin/locations',
        ADMIN_LOCATION_UPDATE: (id) => `/admin/locations/${id}`,
        ADMIN_LOCATION_DELETE: (id) => `/admin/locations/${id}`,
        // User profile endpoints
        USER_PROFILE: '/auth/profile',
        USER_PROFILE_UPDATE: '/auth/profile',
        // Public endpoints
        PUBLIC_LOCATIONS: '/auth/locations'
    }
};

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Helper function to set auth token
function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

// Helper function to remove auth token
function removeAuthToken() {
    localStorage.removeItem('authToken');
}

// Helper function to make authenticated API requests
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, apiRequest, getAuthToken, setAuthToken, removeAuthToken };
}
