// Authentication and Session Management

// Function to generate a unique 5-digit ID number
function generateIdNumber() {
    // Generate a random 5-digit number (10000-99999)
    return Math.floor(10000 + Math.random() * 90000).toString();
}

// Function to ensure all existing users have ID numbers
function ensureAllUsersHaveIdNumbers() {
    const allUsers = localStorage.getItem('allUsers');
    if (!allUsers) return;
    
    const users = JSON.parse(allUsers);
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
}

// Demo credentials (In production, this would be handled by a backend)
const users = {
    admin: {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Administrator',
        idNumber: generateIdNumber()
    },
    user: {
        username: 'user',
        password: 'user123',
        role: 'user',
        name: 'Factory Operator',
        idNumber: generateIdNumber()
    },
    operator1: {
        username: 'operator1',
        password: 'op123',
        role: 'user',
        name: 'Operator 1',
        idNumber: generateIdNumber()
    }
};

// Ensure all users have ID numbers on load
document.addEventListener('DOMContentLoaded', function() {
    ensureAllUsersHaveIdNumbers();
});

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
}

// Get current user
function getCurrentUser() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Login function - Updated to use API
async function login(username, password) {
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (response.success && response.token) {
            // Store auth token
            setAuthToken(response.token);
            
            // Store user data
            localStorage.setItem('userData', JSON.stringify({
                username: response.user.username,
                role: response.user.role,
                name: response.user.name,
                email: response.user.email || '',
                phone: response.user.phone || '',
                location: response.user.location || '',
                idNumber: response.user.idNumber || ''
            }));
            
            return { success: true, user: response.user };
        }
        
        return { success: false, message: 'Invalid credentials' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: error.message || 'Login failed' };
    }
}

// Logout function
window.logout = function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Check authentication and redirect
function requireAuth(requiredRole = null) {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    
    const user = getCurrentUser();
    if (requiredRole && user.role !== requiredRole) {
        alert('You do not have permission to access this page.');
        window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
        return false;
    }
    
    return true;
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', function() {
    // Don't check auth on login page
    if (window.location.pathname.includes('login.html')) {
        // If already logged in, redirect to appropriate dashboard
        if (isAuthenticated()) {
            const user = getCurrentUser();
            window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
        }
        return;
    }
    
    // Check auth for dashboard pages
    if (window.location.pathname.includes('dashboard')) {
        const requiredRole = window.location.pathname.includes('admin') ? 'admin' : null;
        requireAuth(requiredRole);
    }
});




