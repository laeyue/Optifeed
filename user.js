// User Dashboard Functionality

let isSessionActive = false;
let sessionInterval = null;
let clockInterval = null;
let measurements = [];
let currentImage = null;
let sessionStartTime = null;

// Function to update all sessions when username changes
function updateSessionOperators(oldUsername, newUsername) {
    if (!oldUsername || !newUsername || oldUsername === newUsername) return;
    
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    let updated = false;
    
    allSessions.forEach(session => {
        if (session.operator === oldUsername) {
            session.operator = newUsername;
            updated = true;
        }
    });
    
    if (updated) {
        localStorage.setItem('measurementSessions', JSON.stringify(allSessions));
        // Reload measurements if on measurements page
        if (window.location.pathname.includes('user-measurements.html')) {
            loadMeasurements();
        }
    }
}

// Function to update sidebar account info
function updateSidebarAccount() {
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
            accountAvatar.textContent = (userData.name || user.name || 'U').charAt(0).toUpperCase();
        }
        if (accountName) {
            accountName.textContent = userData.name || user.name || 'User';
        }
        if (accountUsername) {
            accountUsername.textContent = '@' + (userData.username || user.username || 'username');
        }
        if (accountRole) {
            accountRole.textContent = (userData.role || user.role) === 'admin' ? 'Administrator' : 'Factory Operator';
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

// Initialize user dashboard
document.addEventListener('DOMContentLoaded', function() {
    updateSidebarAccount();

    // Load dashboard
    if (window.location.pathname.includes('user-dashboard.html')) {
        initializeDashboard();
        
        // Hide data sections initially (except location)
        const measurementSection = document.querySelector('.real-time-measurements');
        const chartsSection = document.querySelector('.charts-section');
        
        if (measurementSection) {
            measurementSection.style.display = 'none';
        }
        if (chartsSection) {
            chartsSection.style.display = 'none';
        }
        
        // Load and display measurements from all sessions on page load
        updateMeasurements();
    }

    // Load measurements page
    // Note: user-measurements.js handles loading sessions from database
    // if (window.location.pathname.includes('user-measurements.html')) {
    //     loadMeasurements(); // Removed - now handled by user-measurements.js
    // }

    // Set default dates for reports
    if (window.location.pathname.includes('user-reports.html')) {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        document.getElementById('startDate').value = weekAgo.toISOString().split('T')[0];
        document.getElementById('endDate').value = today.toISOString().split('T')[0];
        loadMeasurementHistory();
    }
    
    // Initialize realtime clock on dashboard
    if (window.location.pathname.includes('user-dashboard.html')) {
        updateRealtimeClock();
        setInterval(updateRealtimeClock, 1000);
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
        const sidebarAccount = document.querySelector('.sidebar-account');
        
        // Don't interfere with sidebar account clicks
        if (sidebarAccount && sidebarAccount.contains(event.target)) {
            return;
        }
        
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(event.target) && sidebarToggle && !sidebarToggle.contains(event.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
});

// Toggle sidebar on mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// Dashboard Functions
async function initializeDashboard() {
    // Load user location
    loadUserLocation();
    
    // Update session stats display from database
    await updateSessionStats();
    
    // Initialize charts after a short delay to ensure DOM is ready
    setTimeout(() => {
        if (typeof initUserCharts === 'function') {
            initUserCharts();
        }
    }, 300);
}

async function updateSessionStats() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    try {
        // Fetch sessions from database
        const sessionsResponse = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS);
        const allSessions = sessionsResponse.sessions || [];
        const userSessions = allSessions.filter(s => s.user_id === currentUser.id || s.operator === currentUser.username);
        
        // Update total sessions count
        const totalSessionsEl = document.getElementById('totalSessionsCount');
        if (totalSessionsEl) {
            totalSessionsEl.textContent = userSessions.length;
        }
        
        // Update last session date
        const lastSessionEl = document.getElementById('lastSessionDate');
        if (lastSessionEl && userSessions.length > 0) {
            const lastSession = userSessions.sort((a, b) => {
                const dateA = new Date(a.end_time || a.start_time || 0);
                const dateB = new Date(b.end_time || b.start_time || 0);
                return dateB - dateA;
            })[0];
            const lastDate = new Date(lastSession.end_time || lastSession.start_time);
            const now = new Date();
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                lastSessionEl.textContent = 'Today';
            } else if (diffDays === 1) {
                lastSessionEl.textContent = 'Yesterday';
            } else if (diffDays < 7) {
                lastSessionEl.textContent = `${diffDays} days ago`;
            } else {
                lastSessionEl.textContent = lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        } else if (lastSessionEl) {
            lastSessionEl.textContent = 'Never';
        }
    } catch (error) {
        console.error('Failed to load session stats:', error);
    }
}

async function loadUserLocation() {
    const user = getCurrentUser();
    if (!user) return;
    
    const locationDisplay = document.getElementById('userLocationDisplay');
    if (!locationDisplay) return;
    
    try {
        // Fetch user profile from database
        const response = await apiRequest(API_CONFIG.ENDPOINTS.USER_PROFILE);
        if (response.success && response.user) {
            const location = response.user.location;
            locationDisplay.textContent = location || 'Location not set';
        } else {
            locationDisplay.textContent = 'Location not set';
        }
    } catch (error) {
        console.error('Failed to load user location:', error);
        // Fallback to user data from localStorage if API fails
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        locationDisplay.textContent = userData.location || 'Location not set';
    }
}

async function startSession() {
    if (isSessionActive) return;
    
    try {
        // Create session in database
        const startTime = new Date().toISOString();
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS, {
            method: 'POST',
            body: JSON.stringify({
                start_time: startTime,
                notes: ''
            })
        });
        
        // Store session ID globally
        window.currentSessionId = response.session.id;
        console.log('[startSession] Session created in database:', window.currentSessionId);
        
    isSessionActive = true;
    sessionStartTime = new Date();
    sessionStartTimeForRate = new Date();
    measurements = []; // Reset measurements for new session
    previousAvgSize = null;
    
    // Make measurements and isSessionActive globally accessible for charts
    if (typeof window !== 'undefined') {
        window.measurements = measurements;
        window.isSessionActive = true;
    }
        
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const sessionStatus = document.getElementById('sessionStatus');
        const statusIndicator = document.getElementById('statusIndicator');
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        sessionStatus.textContent = 'Session Active';
        sessionStatus.className = 'status-badge status-active';
        statusIndicator.classList.add('active');
        
        // Update current measurements and pellets count
        updateCurrentSessionStats();
        
        // Show data sections
        const measurementSection = document.querySelector('.real-time-measurements');
        const chartsSection = document.querySelector('.charts-section');
        
        if (measurementSection) {
            measurementSection.style.display = 'block';
            measurementSection.style.opacity = '0';
            setTimeout(() => {
                measurementSection.style.transition = 'opacity 0.5s ease';
                measurementSection.style.opacity = '1';
            }, 10);
        }
        if (chartsSection) {
            chartsSection.style.display = 'grid';
            chartsSection.style.opacity = '0';
            setTimeout(() => {
                chartsSection.style.transition = 'opacity 0.5s ease';
                chartsSection.style.opacity = '1';
            }, 10);
        }
        
        // Start timer
        sessionInterval = setInterval(updateSessionTimer, 1000);
        
        // Start realtime clock
        updateRealtimeClock();
        clockInterval = setInterval(updateRealtimeClock, 1000);
        
        // Reset charts to 0 for new session
        resetChartsForNewSession();
        
        // Simulate real-time measurements
        startMeasurementSimulation();
        
        // Start video feed
        startVideoFeed();
    } catch (error) {
        console.error('Failed to start session:', error);
        alert('Failed to start session: ' + error.message);
    }
}

function startVideoFeed() {
    const video = document.getElementById('measurementVideoFeed');
    const placeholder = document.getElementById('videoPlaceholder');
    
    if (!video || !placeholder) return;
    
    // Try to access user's camera
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment' // Use back camera if available
        } 
    })
    .then(stream => {
        video.srcObject = stream;
        video.style.display = 'block';
        placeholder.style.display = 'none';
    })
    .catch(err => {
        console.log('Camera access denied or unavailable:', err);
        // Show placeholder with message
        placeholder.innerHTML = `
            <svg style="width: 48px; height: 48px; stroke: currentColor; opacity: 0.5;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M2 10L12 15L22 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p style="margin: 0; font-size: 0.875rem;">Camera access required for video feed</p>
        `;
    });
}

function stopVideoFeed() {
    const video = document.getElementById('measurementVideoFeed');
    const placeholder = document.getElementById('videoPlaceholder');
    
    if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
        video.style.display = 'none';
    }
    
    if (placeholder) {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `
            <svg style="width: 48px; height: 48px; stroke: currentColor; opacity: 0.5;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M2 10L12 15L22 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p style="margin: 0; font-size: 0.875rem;">Video feed will appear when session is active</p>
        `;
    }
}

function updateCurrentSessionStats() {
    const currentMeasurementsEl = document.getElementById('currentMeasurementsCount');
    const currentPelletsEl = document.getElementById('currentPelletsCount');
    
    if (currentMeasurementsEl) {
        currentMeasurementsEl.textContent = measurements.length;
    }
    if (currentPelletsEl) {
        currentPelletsEl.textContent = measurements.reduce((sum, m) => sum + (m.count || 0), 0);
    }
}

function updateRealtimeClock() {
    const clockElements = document.querySelectorAll('#realtimeClock');
    clockElements.forEach(clockElement => {
        if (clockElement) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            clockElement.textContent = `${hours}:${minutes}:${seconds}`;
        }
    });
}

async function stopSession() {
    if (!isSessionActive) return;
    
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const sessionStatus = document.getElementById('sessionStatus');
    const statusIndicator = document.getElementById('statusIndicator');
    
    // Add loading state
    stopBtn.classList.add('loading');
    
    try {
        // Stop intervals first
        if (measurementInterval) {
            clearInterval(measurementInterval);
            measurementInterval = null;
        }
        
        if (sessionInterval) {
            clearInterval(sessionInterval);
            sessionInterval = null;
        }
        
        if (clockInterval) {
            clearInterval(clockInterval);
            clockInterval = null;
        }
        
        // Stop video feed
        stopVideoFeed();
        
        // Update session in database
        const endTime = new Date();
        const durationSeconds = Math.floor((endTime - sessionStartTime) / 1000);
        
        if (window.currentSessionId) {
            try {
                // First, fetch all measurements for this session to calculate aggregated stats
                let calculatedAvgSize = 0;
                let calculatedMinSize = 0;
                let calculatedMaxSize = 0;
                
                try {
                    const recordsResponse = await apiRequest(API_CONFIG.ENDPOINTS.SESSION_RECORDS(window.currentSessionId));
                    const sessionRecords = recordsResponse.records || [];
                    
                    if (sessionRecords.length > 0) {
                        // Extract all sizes from measurements (including metadata)
                        const allSizes = [];
                        const allMinSizes = [];
                        const allMaxSizes = [];
                        
                        sessionRecords.forEach(record => {
                            const avgSize = parseFloat(record.avg_size || 0);
                            if (avgSize > 0) {
                                allSizes.push(avgSize);
                            }
                            
                            // Extract min/max from metadata
                            if (record.metadata) {
                                try {
                                    const meta = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
                                    if (meta.min_size) {
                                        allMinSizes.push(parseFloat(meta.min_size));
                                    }
                                    if (meta.max_size) {
                                        allMaxSizes.push(parseFloat(meta.max_size));
                                    }
                                } catch (e) {
                                    // If parsing fails, use avg_size as fallback
                                    if (avgSize > 0) {
                                        allMinSizes.push(avgSize);
                                        allMaxSizes.push(avgSize);
                                    }
                                }
                            } else {
                                // If no metadata, use avg_size as fallback
                                if (avgSize > 0) {
                                    allMinSizes.push(avgSize);
                                    allMaxSizes.push(avgSize);
                                }
                            }
                        });
                        
                        // Calculate aggregated values
                        if (allSizes.length > 0) {
                            calculatedAvgSize = allSizes.reduce((sum, size) => sum + size, 0) / allSizes.length;
                        }
                        if (allMinSizes.length > 0) {
                            calculatedMinSize = Math.min(...allMinSizes);
                        }
                        if (allMaxSizes.length > 0) {
                            calculatedMaxSize = Math.max(...allMaxSizes);
                        }
                        
                        console.log('[stopSession] Calculated aggregated stats:', {
                            avgSize: calculatedAvgSize.toFixed(2),
                            minSize: calculatedMinSize.toFixed(2),
                            maxSize: calculatedMaxSize.toFixed(2),
                            recordCount: sessionRecords.length
                        });
                    }
                } catch (error) {
                    console.error('[stopSession] Failed to fetch records for calculation:', error);
                }
                
                // Update session with calculated stats
                await apiRequest(API_CONFIG.ENDPOINTS.SESSION_BY_ID(window.currentSessionId), {
                    method: 'PUT',
                    body: JSON.stringify({
                        end_time: endTime.toISOString(),
                        duration_seconds: durationSeconds,
                        status: 'completed',
                        avg_size: calculatedAvgSize > 0 ? parseFloat(calculatedAvgSize.toFixed(2)) : null,
                        min_size: calculatedMinSize > 0 ? parseFloat(calculatedMinSize.toFixed(2)) : null,
                        max_size: calculatedMaxSize > 0 ? parseFloat(calculatedMaxSize.toFixed(2)) : null
                    })
                });
                console.log('[stopSession] Session updated in database with aggregated stats:', window.currentSessionId);
            } catch (error) {
                console.error('Failed to update session in database:', error);
            }
        }
        
        // Fetch the completed session from database to get all aggregated stats
        let sessionData = null;
        if (window.currentSessionId) {
            try {
                const sessionResponse = await apiRequest(API_CONFIG.ENDPOINTS.SESSION_BY_ID(window.currentSessionId));
                const dbMeasurements = sessionResponse.session.measurements || [];
                
                // Convert database measurements to format expected by showSessionStatistics
                // Database format has: avg_size, total_pellets, metadata (with min_size, max_size)
                const formattedMeasurements = dbMeasurements.map(m => {
                    let minSize = parseFloat(m.avg_size || 0);
                    let maxSize = parseFloat(m.avg_size || 0);
                    
                    // Extract min/max from metadata
                    if (m.metadata) {
                        try {
                            const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
                            if (meta.min_size) minSize = parseFloat(meta.min_size);
                            if (meta.max_size) maxSize = parseFloat(meta.max_size);
                        } catch (e) {
                            // If parsing fails, use avg_size
                        }
                    }
                    
                    return {
                        // Database format
                        avg_size: parseFloat(m.avg_size || 0),
                        total_pellets: parseInt(m.total_pellets || 0),
                        metadata: m.metadata,
                        // Also include local format for compatibility
                        avgSize: parseFloat(m.avg_size || 0).toFixed(2),
                        minSize: minSize.toFixed(2),
                        maxSize: maxSize.toFixed(2),
                        count: parseInt(m.total_pellets || 0)
                    };
                });
                
                sessionData = {
                    id: sessionResponse.session.id,
                    startTime: sessionResponse.session.start_time,
                    endTime: sessionResponse.session.end_time,
                    startTimeFormatted: new Date(sessionResponse.session.start_time).toLocaleString(),
                    endTimeFormatted: new Date(sessionResponse.session.end_time).toLocaleString(),
                    duration: sessionResponse.session.duration_seconds,
                    status: sessionResponse.session.status,
                    operator: sessionResponse.session.operator,
                    measurements: formattedMeasurements,
                    totalPellets: parseInt(sessionResponse.session.total_pellets) || formattedMeasurements.reduce((sum, m) => sum + (m.total_pellets || m.count || 0), 0),
                    measurementCount: parseInt(sessionResponse.session.measurement_count) || formattedMeasurements.length,
                    avgSize: sessionResponse.session.avg_size || '0.00'
                };
                console.log('[stopSession] Fetched session from database:', {
                    id: sessionData.id,
                    measurementCount: sessionData.measurementCount,
                    totalPellets: sessionData.totalPellets,
                    avgSize: sessionData.avgSize,
                    measurementsLength: sessionData.measurements.length,
                    firstMeasurement: sessionData.measurements[0]
                });
            } catch (error) {
                console.error('Failed to fetch session from database:', error);
                // Fallback to local data
                sessionData = {
                    id: window.currentSessionId || Date.now(),
                    startTime: sessionStartTime.toISOString(),
                    endTime: endTime.toISOString(),
                    startTimeFormatted: sessionStartTime.toLocaleString(),
                    endTimeFormatted: endTime.toLocaleString(),
                    measurements: [...measurements],
                    totalPellets: measurements.reduce((sum, m) => sum + m.count, 0),
                    operator: getCurrentUser()?.username || 'Unknown'
                };
            }
        } else {
            // Fallback if no session ID
            sessionData = {
                id: Date.now(),
                startTime: sessionStartTime.toISOString(),
                endTime: endTime.toISOString(),
                startTimeFormatted: sessionStartTime.toLocaleString(),
                endTimeFormatted: endTime.toLocaleString(),
                measurements: [...measurements],
                totalPellets: measurements.reduce((sum, m) => sum + m.count, 0),
                operator: getCurrentUser()?.username || 'Unknown'
            };
        }
        
        // Small delay for visual feedback
        setTimeout(() => {
            isSessionActive = false;
            
            startBtn.disabled = false;
            stopBtn.disabled = true;
            stopBtn.classList.remove('loading');
            sessionStatus.textContent = 'Session Inactive';
            sessionStatus.className = 'status-badge status-inactive';
            statusIndicator.classList.remove('active');
            
            // Update session stats and measurements display
            updateSessionStats();
            updateMeasurements();
            
            // Trigger chart updates
            if (typeof loadChartData === 'function') {
                setTimeout(() => {
                    // Force chart refresh
                    if (typeof window !== 'undefined' && window.dispatchEvent) {
                        window.dispatchEvent(new CustomEvent('chartsUpdate'));
                    }
                }, 500);
            }
            
            // Show session statistics modal with database data
            if (measurements.length > 0 || (sessionData && sessionData.measurementCount > 0)) {
                showSessionStatistics(sessionData);
            }
            
            // Reset measurements array for next session
            measurements = [];
            window.currentSessionId = null;
            
            // Mark session as inactive for chart functions
            if (typeof window !== 'undefined') {
                window.isSessionActive = false;
            }
            
            // Update current session stats to show 0
            updateCurrentSessionStats();
            
            // Reset real-time displays
            const avgSizeDisplay = document.getElementById('avgSizeDisplay');
            const minSizeDisplay = document.getElementById('minSizeDisplay');
            const maxSizeDisplay = document.getElementById('maxSizeDisplay');
            const totalPelletsDisplay = document.getElementById('totalPelletsDisplay');
            if (avgSizeDisplay) avgSizeDisplay.textContent = '0.00';
            if (minSizeDisplay) minSizeDisplay.textContent = '0.00';
            if (maxSizeDisplay) maxSizeDisplay.textContent = '0.00';
            if (totalPelletsDisplay) totalPelletsDisplay.textContent = '0';
            
            // Trigger chart refresh to show all historical data
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('chartsUpdate'));
            }
        }, 300);
    } catch (error) {
        console.error('Error stopping session:', error);
        stopBtn.classList.remove('loading');
        alert('Error stopping session: ' + error.message);
    }
}

// Session Statistics Modal
function showSessionStatistics(sessionData) {
    // Handle both database format (avg_size) and local format (avgSize)
    const measurements = sessionData.measurements || [];
    
    let avgSize = '0.00';
    let minSize = '0.00';
    let maxSize = '0.00';
    
    if (measurements.length > 0) {
        // Check if data is from database (has avg_size) or local (has avgSize)
        const isDatabaseFormat = measurements[0].hasOwnProperty('avg_size');
        
        if (isDatabaseFormat) {
            // Database format - extract from metadata and avg_size
            const sizes = measurements.map(m => {
                let min = parseFloat(m.avg_size || 0);
                let max = parseFloat(m.avg_size || 0);
                let avg = parseFloat(m.avg_size || 0);
                
                // Try to get min/max from metadata
                if (m.metadata) {
                    try {
                        const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
                        if (meta.min_size) min = parseFloat(meta.min_size);
                        if (meta.max_size) max = parseFloat(meta.max_size);
                    } catch (e) {
                        // If parsing fails, use avg_size
                    }
                }
                
                return { min, max, avg };
            }).filter(s => s.avg > 0);
            
            if (sizes.length > 0) {
                avgSize = (sizes.reduce((sum, s) => sum + s.avg, 0) / sizes.length).toFixed(2);
                minSize = Math.min(...sizes.map(s => s.min)).toFixed(2);
                maxSize = Math.max(...sizes.map(s => s.max)).toFixed(2);
            }
        } else {
            // Local format - use avgSize, minSize, maxSize directly
            const sizes = measurements.map(m => ({
                avg: parseFloat(m.avgSize || 0),
                min: parseFloat(m.minSize || m.avgSize || 0),
                max: parseFloat(m.maxSize || m.avgSize || 0)
            })).filter(s => s.avg > 0);
            
            if (sizes.length > 0) {
                avgSize = (sizes.reduce((sum, s) => sum + s.avg, 0) / sizes.length).toFixed(2);
                minSize = Math.min(...sizes.map(s => s.min)).toFixed(2);
                maxSize = Math.max(...sizes.map(s => s.max)).toFixed(2);
            }
        }
    } else if (sessionData.avgSize) {
        // Use aggregated value from database if available
        avgSize = parseFloat(sessionData.avgSize).toFixed(2);
    }
    
    // Calculate duration
    const duration = sessionData.duration 
        ? sessionData.duration 
        : Math.floor((new Date(sessionData.endTime) - new Date(sessionData.startTime)) / 1000);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    // Get measurement count
    const measurementCount = sessionData.measurementCount || measurements.length || 0;
    
    // Get total pellets
    const totalPellets = sessionData.totalPellets || 
        measurements.reduce((sum, m) => {
            // Handle both database format (total_pellets) and local format (count)
            return sum + (m.total_pellets || m.count || 0);
        }, 0);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'sessionStatsModal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content session-stats-modal" style="max-width: 700px;">
            <div class="modal-header">
                <h2>Session Completed</h2>
                <span class="close" onclick="closeSessionStatsModal()">&times;</span>
            </div>
            <div class="session-stats-content">
                <div class="stats-grid-session">
                    <div class="stat-item-session">
                        <div class="stat-icon-session">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-info-session">
                            <h4>${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}</h4>
                            <p>Duration</p>
                        </div>
                    </div>
                    <div class="stat-item-session">
                        <div class="stat-icon-session">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-info-session">
                            <h4>${measurementCount}</h4>
                            <p>Pellet Measurements</p>
                        </div>
                    </div>
                    <div class="stat-item-session">
                        <div class="stat-icon-session">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-info-session">
                            <h4>${totalPellets.toLocaleString()}</h4>
                            <p>Actual Total Pellet Count</p>
                        </div>
                    </div>
                    <div class="stat-item-session">
                        <div class="stat-icon-session">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-info-session">
                            <h4>${avgSize} mm</h4>
                            <p>Avg Size</p>
                        </div>
                    </div>
                    <div class="stat-item-session">
                        <div class="stat-icon-session">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-info-session">
                            <h4>${minSize} mm</h4>
                            <p>Min Size</p>
                        </div>
                    </div>
                    <div class="stat-item-session">
                        <div class="stat-icon-session">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-info-session">
                            <h4>${maxSize} mm</h4>
                            <p>Max Size</p>
                        </div>
                    </div>
                </div>
                <div class="modal-actions" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(47, 167, 110, 0.1); display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn-secondary" onclick="closeSessionStatsModal()" style="padding: 0.875rem 2rem; font-size: 0.95rem;">
                        <svg style="width: 18px; height: 18px; margin-right: 8px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>Close</span>
                    </button>
                    <button class="btn-primary" onclick="window.location.href='user-measurements.html'" style="padding: 0.875rem 2rem; font-size: 0.95rem;">
                        <svg style="width: 18px; height: 18px; margin-right: 8px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>View Details</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeSessionStatsModal();
        }
    };
}

function closeSessionStatsModal() {
    const modal = document.getElementById('sessionStatsModal');
    if (modal) {
        modal.remove();
    }
}

function updateSessionTimer() {
    if (!sessionStartTime) return;
    
    const elapsed = Math.floor((new Date() - sessionStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    document.getElementById('sessionTime').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

let measurementInterval = null;

// Helper function to determine quality rating based on average size
function getQualityRating(avgSize) {
    const size = parseFloat(avgSize);
    if (size >= 4.5 && size <= 5.5) return 'excellent';
    if (size >= 3.5 && size <= 6.0) return 'good';
    if (size >= 2.5 && size <= 7.0) return 'fair';
    return 'poor';
}

async function startMeasurementSimulation() {
    if (measurementInterval) {
        clearInterval(measurementInterval);
    }
    
    measurementInterval = setInterval(async () => {
        if (!isSessionActive || !window.currentSessionId) {
            if (measurementInterval) {
                clearInterval(measurementInterval);
                measurementInterval = null;
            }
            return;
        }
        
        try {
            // Simulate realistic measurement data
            const baseSize = 4.0 + (Math.random() * 2); // Base size between 4.0-6.0mm
            const avgSize = parseFloat(baseSize.toFixed(2));
            const minSize = parseFloat((avgSize - 1.5 - Math.random() * 0.5).toFixed(2)); // Min: avg - 1.5 to 2.0
            const maxSize = parseFloat((avgSize + 1.5 + Math.random() * 1.0).toFixed(2)); // Max: avg + 1.5 to 2.5
            const count = Math.floor(Math.random() * 50 + 20); // 20-70 pellets
            const timestamp = new Date().toISOString();
            
            // Create measurement object for local UI updates
            const measurement = {
                timestamp: new Date(timestamp),
                avgSize: avgSize.toFixed(2),
                minSize: minSize.toFixed(2),
                maxSize: maxSize.toFixed(2),
                count: count
            };
            
            // Save measurement to database with all required fields
            const recordResponse = await apiRequest(API_CONFIG.ENDPOINTS.RECORDS, {
                method: 'POST',
                body: JSON.stringify({
                    session_id: window.currentSessionId,
                    avg_size: avgSize,
                    total_pellets: count,
                    quality_rating: getQualityRating(avgSize),
                    timestamp: timestamp,
                    metadata: {
                        min_size: minSize,
                        max_size: maxSize,
                        measurement_timestamp: timestamp
                    }
                })
            });
            
            console.log('[startMeasurementSimulation] Record saved to database:', {
                recordId: recordResponse.record.id,
                sessionId: window.currentSessionId,
                avgSize: avgSize,
                totalPellets: count,
                quality: getQualityRating(avgSize)
            });
            
            // Add to local measurements array for real-time UI updates
            measurements.push(measurement);
            
            // Update global measurements for charts
            if (typeof window !== 'undefined') {
                window.measurements = measurements;
            }
            
            updateMeasurements();
            updateCurrentSessionStats();
            
            // Update real-time display and charts
            updateRealtimeMeasurements();
        } catch (error) {
            console.error('Failed to save measurement to database:', error);
            // Continue with local measurement even if database save fails
            const baseSize = 4.0 + (Math.random() * 2);
            const avgSize = parseFloat(baseSize.toFixed(2));
            const minSize = parseFloat((avgSize - 1.5 - Math.random() * 0.5).toFixed(2));
            const maxSize = parseFloat((avgSize + 1.5 + Math.random() * 1.0).toFixed(2));
            const count = Math.floor(Math.random() * 50 + 20);
            
            const measurement = {
                timestamp: new Date(),
                avgSize: avgSize.toFixed(2),
                minSize: minSize.toFixed(2),
                maxSize: maxSize.toFixed(2),
                count: count
            };
            measurements.push(measurement);
            
            // Update global measurements for charts
            if (typeof window !== 'undefined') {
                window.measurements = measurements;
            }
            
            updateMeasurements();
            updateCurrentSessionStats();
            updateRealtimeMeasurements();
        }
    }, 3000);
}

// Reset charts to 0 when starting a new session
function resetChartsForNewSession() {
    // Make isSessionActive globally accessible for chart functions
    if (typeof window !== 'undefined') {
        window.isSessionActive = true;
    }
    
    // Reset distribution chart
    if (typeof window !== 'undefined' && window.distributionChart) {
        const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
        const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
        window.distributionChart.updateSeries([{
            name: 'Number of Measurements',
            data: new Array(binLabels.length).fill(0)
        }]);
    }
    
    // Reset trends chart
    if (typeof window !== 'undefined' && window.trendsChart) {
        const defaultLabels = Array.from({ length: 10 }, (_, i) => String(i + 1));
        window.trendsChart.updateOptions({
            xaxis: {
                categories: defaultLabels
            }
        });
        window.trendsChart.updateSeries([
            { name: 'Average Size', data: new Array(10).fill(0) },
            { name: 'Min Size', data: new Array(10).fill(0) },
            { name: 'Max Size', data: new Array(10).fill(0) }
        ]);
    }
    
    console.log('[resetChartsForNewSession] Charts reset to 0');
}

// Update real-time measurement displays and charts
function updateRealtimeMeasurements() {
    if (measurements.length === 0) {
        // Reset displays to 0 if no measurements
        const avgSizeDisplay = document.getElementById('avgSizeDisplay');
        const minSizeDisplay = document.getElementById('minSizeDisplay');
        const maxSizeDisplay = document.getElementById('maxSizeDisplay');
        const totalPelletsDisplay = document.getElementById('totalPelletsDisplay');
        if (avgSizeDisplay) avgSizeDisplay.textContent = '0.00';
        if (minSizeDisplay) minSizeDisplay.textContent = '0.00';
        if (maxSizeDisplay) maxSizeDisplay.textContent = '0.00';
        if (totalPelletsDisplay) totalPelletsDisplay.textContent = '0';
        return;
    }
    
    // Calculate current session stats
    const totalPellets = measurements.reduce((sum, m) => sum + (m.count || 0), 0);
    const avgSize = measurements.reduce((sum, m) => sum + parseFloat(m.avgSize || 0), 0) / measurements.length;
    const minSize = Math.min(...measurements.map(m => parseFloat(m.minSize || 0)));
    const maxSize = Math.max(...measurements.map(m => parseFloat(m.maxSize || 0)));
    
    // Update display elements
    const avgSizeDisplay = document.getElementById('avgSizeDisplay');
    const minSizeDisplay = document.getElementById('minSizeDisplay');
    const maxSizeDisplay = document.getElementById('maxSizeDisplay');
    const totalPelletsDisplay = document.getElementById('totalPelletsDisplay');
    const measurementCount = document.getElementById('measurementCount');
    
    if (avgSizeDisplay) avgSizeDisplay.textContent = avgSize.toFixed(2);
    if (minSizeDisplay) minSizeDisplay.textContent = minSize.toFixed(2);
    if (maxSizeDisplay) maxSizeDisplay.textContent = maxSize.toFixed(2);
    if (totalPelletsDisplay) totalPelletsDisplay.textContent = totalPellets.toLocaleString();
    if (measurementCount) measurementCount.textContent = `Pellet Measurements: ${measurements.length}`;
    
    // Update size range
    const sizeRange = document.getElementById('sizeRange');
    if (sizeRange) {
        const range = (maxSize - minSize).toFixed(2);
        sizeRange.textContent = `Range: ${range}mm`;
    }
    
    // Update consistency score
    const consistencyScore = document.getElementById('consistencyScore');
    if (consistencyScore && measurements.length > 1) {
        const variance = measurements.reduce((sum, m) => {
            const diff = parseFloat(m.avgSize) - avgSize;
            return sum + (diff * diff);
        }, 0) / measurements.length;
        const stdDev = Math.sqrt(variance);
        const consistency = stdDev < 0.5 ? 'Excellent' : stdDev < 1.0 ? 'Good' : stdDev < 1.5 ? 'Fair' : 'Poor';
        consistencyScore.textContent = `Consistency: ${consistency}`;
    }
    
    // Update pellets per minute
    const pelletsPerMin = document.getElementById('pelletsPerMin');
    if (pelletsPerMin && sessionStartTimeForRate) {
        const elapsedMinutes = (new Date() - sessionStartTimeForRate) / 60000;
        const rate = elapsedMinutes > 0 ? (totalPellets / elapsedMinutes).toFixed(1) : '0.0';
        pelletsPerMin.textContent = `Rate: ${rate}/min`;
    }
    
    // Update average pellets per measurement
    const avgPelletsPerMeasurement = document.getElementById('avgPelletsPerMeasurement');
    if (avgPelletsPerMeasurement) {
        const avg = measurements.length > 0 ? (totalPellets / measurements.length).toFixed(1) : '0.0';
        avgPelletsPerMeasurement.textContent = `Avg/Measurement: ${avg}`;
    }
    
    // Update charts with current session data
    updateChartsWithCurrentSession();
}

// Update charts with current session measurements
function updateChartsWithCurrentSession() {
    if (!measurements || measurements.length === 0) {
        // Reset charts to 0 if no measurements
        if (typeof window !== 'undefined' && window.distributionChart) {
            const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
            const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
            window.distributionChart.updateSeries([{
                name: 'Number of Measurements',
                data: new Array(binLabels.length).fill(0)
            }]);
        }
        if (typeof window !== 'undefined' && window.trendsChart) {
            const defaultLabels = Array.from({ length: 10 }, (_, i) => String(i + 1));
            window.trendsChart.updateSeries([
                { name: 'Average Size', data: new Array(10).fill(0) },
                { name: 'Min Size', data: new Array(10).fill(0) },
                { name: 'Max Size', data: new Array(10).fill(0) }
            ]);
        }
        return;
    }
    
    // Update distribution chart
    if (typeof window !== 'undefined' && window.distributionChart) {
        const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
        const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
        const counts = new Array(bins.length - 1).fill(0);
        
        measurements.forEach(measurement => {
            const size = parseFloat(measurement.avgSize || 0);
            for (let i = 0; i < bins.length - 1; i++) {
                if (size >= bins[i] && size < bins[i + 1]) {
                    counts[i]++;
                    break;
                }
            }
        });
        
        window.distributionChart.updateSeries([{
            name: 'Number of Measurements',
            data: counts
        }]);
    }
    
    // Update trends chart with current session measurements
    if (typeof window !== 'undefined' && window.trendsChart) {
        // Get last 20 measurements from current session
        const recent = measurements.slice(-20).map(m => ({
            avgSize: parseFloat(m.avgSize || 0),
            minSize: parseFloat(m.minSize || m.avgSize || 0),
            maxSize: parseFloat(m.maxSize || m.avgSize || 0)
        }));
        
        let labels = recent.map((m, i) => String(i + 1));
        let avgSizes = recent.map(m => m.avgSize);
        let minSizes = recent.map(m => m.minSize);
        let maxSizes = recent.map(m => m.maxSize);
        
        // Pad to show at least 10 points for better visualization
        const minPoints = Math.max(10, recent.length || 1);
        while (labels.length < minPoints) {
            labels.push(String(labels.length + 1));
        }
        while (avgSizes.length < minPoints) {
            avgSizes.push(0);
        }
        while (minSizes.length < minPoints) {
            minSizes.push(0);
        }
        while (maxSizes.length < minPoints) {
            maxSizes.push(0);
        }
        
        // Limit to 20 points max for readability
        const maxPoints = 20;
        window.trendsChart.updateOptions({
            xaxis: {
                categories: labels.slice(0, maxPoints)
            }
        });
        window.trendsChart.updateSeries([
            { name: 'Average Size', data: avgSizes.slice(0, maxPoints) },
            { name: 'Min Size', data: minSizes.slice(0, maxPoints) },
            { name: 'Max Size', data: maxSizes.slice(0, maxPoints) }
        ]);
    }
}

function updateMeasurements() {
    // Save measurements to localStorage for charts
    localStorage.setItem('userMeasurements', JSON.stringify(measurements));
    
    // If session is active, show only current session data
    // Otherwise, show all sessions data
    let displayMeasurements = [];
    
    if (isSessionActive && measurements.length > 0) {
        // Show only current session measurements
        displayMeasurements = measurements;
    } else {
        // Show all completed sessions data
        const currentUser = getCurrentUser();
        const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
        const userSessions = currentUser ? allSessions.filter(s => s.operator === currentUser.username) : [];
        
        userSessions.forEach(session => {
            if (session.measurements && session.measurements.length > 0) {
                displayMeasurements = displayMeasurements.concat(session.measurements);
            }
        });
    }
    
    if (displayMeasurements.length === 0) {
        document.getElementById('avgSizeDisplay').textContent = '0.00';
        document.getElementById('totalPelletsDisplay').textContent = '0';
        document.getElementById('minSizeDisplay').textContent = '0.00';
        document.getElementById('maxSizeDisplay').textContent = '0.00';
        // Reset details
        const avgSizeChangeEl = document.getElementById('avgSizeChange');
        const pelletsPerMinEl = document.getElementById('pelletsPerMin');
        const sizeRangeEl = document.getElementById('sizeRange');
        const consistencyEl = document.getElementById('consistencyScore');
        const measurementCountEl = document.getElementById('measurementCount');
        const avgPelletsPerMeasurementEl = document.getElementById('avgPelletsPerMeasurement');
        if (avgSizeChangeEl) avgSizeChangeEl.textContent = '—';
        if (pelletsPerMinEl) pelletsPerMinEl.textContent = 'Rate: 0/min';
        if (sizeRangeEl) sizeRangeEl.textContent = 'Range: 0.00mm';
        if (consistencyEl) consistencyEl.textContent = 'Consistency: —';
        if (measurementCountEl) measurementCountEl.textContent = 'Pellet Measurements: 0';
        if (avgPelletsPerMeasurementEl) avgPelletsPerMeasurementEl.textContent = 'Avg/Measurement: 0';
        return;
    }
    
    // Calculate stats from display measurements
    const avgSize = (displayMeasurements.reduce((sum, m) => sum + parseFloat(m.avgSize || 0), 0) / displayMeasurements.length).toFixed(2);
    const totalPellets = displayMeasurements.reduce((sum, m) => sum + (m.count || 0), 0);
    const minSize = Math.min(...displayMeasurements.map(m => parseFloat(m.minSize || 0))).toFixed(2);
    const maxSize = Math.max(...displayMeasurements.map(m => parseFloat(m.maxSize || 0))).toFixed(2);
    
    document.getElementById('avgSizeDisplay').textContent = avgSize;
    document.getElementById('totalPelletsDisplay').textContent = totalPellets;
    document.getElementById('minSizeDisplay').textContent = minSize;
    document.getElementById('maxSizeDisplay').textContent = maxSize;
    
    // Calculate and display additional details (use current session for active, all for inactive)
    updateMeasurementDetails(displayMeasurements, measurements);
}

let previousAvgSize = null;
let sessionStartTimeForRate = null;

function updateMeasurementDetails(displayMeasurements, currentSessionMeasurements) {
    // Average size change (trend) - compare recent vs older measurements
    const avgSizeChangeEl = document.getElementById('avgSizeChange');
    if (avgSizeChangeEl && displayMeasurements.length >= 2) {
        const recent = displayMeasurements.slice(-5);
        const older = displayMeasurements.slice(-10, -5);
        if (older.length > 0 && recent.length > 0) {
            const recentAvg = recent.reduce((sum, m) => sum + parseFloat(m.avgSize || 0), 0) / recent.length;
            const olderAvg = older.reduce((sum, m) => sum + parseFloat(m.avgSize || 0), 0) / older.length;
            const change = recentAvg - olderAvg;
            const changePercent = olderAvg > 0 ? ((change / olderAvg) * 100).toFixed(1) : '0.0';
            
            if (Math.abs(change) < 0.01) {
                avgSizeChangeEl.innerHTML = '<span style="color: var(--text-secondary);">→ Stable</span>';
            } else if (change > 0) {
                avgSizeChangeEl.innerHTML = `<span style="color: #10b981;">↗ +${changePercent}%</span>`;
            } else {
                avgSizeChangeEl.innerHTML = `<span style="color: #ef4444;">↘ ${changePercent}%</span>`;
            }
        } else {
            avgSizeChangeEl.textContent = '—';
        }
    } else if (avgSizeChangeEl) {
        avgSizeChangeEl.textContent = '—';
    }
    
    // Pellets per minute (only for current active session)
    const pelletsPerMinEl = document.getElementById('pelletsPerMin');
    if (pelletsPerMinEl && isSessionActive && sessionStartTime && currentSessionMeasurements.length > 0) {
        const elapsedMinutes = (new Date() - sessionStartTime) / (1000 * 60);
        const currentPellets = currentSessionMeasurements.reduce((sum, m) => sum + (m.count || 0), 0);
        const rate = elapsedMinutes > 0 ? (currentPellets / elapsedMinutes).toFixed(1) : '0';
        pelletsPerMinEl.textContent = `Rate: ${rate}/min`;
    } else if (pelletsPerMinEl) {
        // Calculate average rate from all sessions if inactive
        if (!isSessionActive && displayMeasurements.length > 0) {
            const totalPellets = displayMeasurements.reduce((sum, m) => sum + (m.count || 0), 0);
            pelletsPerMinEl.textContent = `Total: ${totalPellets}`;
        } else {
            pelletsPerMinEl.textContent = 'Rate: 0/min';
        }
    }
    
    // Size range (from display measurements - current session if active, all if inactive)
    const sizeRangeEl = document.getElementById('sizeRange');
    if (sizeRangeEl && displayMeasurements.length > 0) {
        const minSize = Math.min(...displayMeasurements.map(m => parseFloat(m.minSize || 0)));
        const maxSize = Math.max(...displayMeasurements.map(m => parseFloat(m.maxSize || 0)));
        const range = (maxSize - minSize).toFixed(2);
        sizeRangeEl.textContent = `Range: ${range}mm`;
    } else if (sizeRangeEl) {
        sizeRangeEl.textContent = 'Range: 0.00mm';
    }
    
    // Consistency score (coefficient of variation) - from display measurements
    const consistencyEl = document.getElementById('consistencyScore');
    if (consistencyEl && displayMeasurements.length > 0) {
        const sizes = displayMeasurements.map(m => parseFloat(m.avgSize || 0));
        const mean = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;
        const variance = sizes.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sizes.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
        const consistency = Math.max(0, 100 - cv).toFixed(0);
        consistencyEl.textContent = `Consistency: ${consistency}%`;
    } else if (consistencyEl) {
        consistencyEl.textContent = 'Consistency: —';
    }
    
    // Measurement count
    const measurementCountEl = document.getElementById('measurementCount');
    if (measurementCountEl) {
        measurementCountEl.textContent = `Pellet Measurements: ${displayMeasurements.length}`;
    }
    
    // Average pellets per measurement
    const avgPelletsPerMeasurementEl = document.getElementById('avgPelletsPerMeasurement');
    if (avgPelletsPerMeasurementEl && displayMeasurements.length > 0) {
        const totalPellets = displayMeasurements.reduce((sum, m) => sum + (m.count || 0), 0);
        const avgPellets = (totalPellets / displayMeasurements.length).toFixed(1);
        avgPelletsPerMeasurementEl.textContent = `Avg/Measurement: ${avgPellets}`;
    } else if (avgPelletsPerMeasurementEl) {
        avgPelletsPerMeasurementEl.textContent = 'Avg/Measurement: 0';
    }
}

// Image Capture
function captureImage() {
    // Simulate image capture
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Create a simple placeholder image
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Pellet Image', canvas.width / 2, canvas.height / 2);
    ctx.fillText(new Date().toLocaleTimeString(), canvas.width / 2, canvas.height / 2 + 30);
    
    currentImage = canvas.toDataURL('image/png');
    displayImage(currentImage);
    
    // Simulate measurement from image
    setTimeout(() => {
        if (isSessionActive) {
            const measurement = {
                timestamp: new Date(),
                avgSize: (Math.random() * 5 + 3).toFixed(2),
                minSize: (Math.random() * 2 + 2).toFixed(2),
                maxSize: (Math.random() * 3 + 5).toFixed(2),
                count: Math.floor(Math.random() * 50 + 20),
                image: currentImage
            };
            measurements.push(measurement);
            updateMeasurements();
        }
    }, 500);
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImage = e.target.result;
        displayImage(currentImage);
        
        // Simulate measurement from uploaded image
        setTimeout(() => {
            if (isSessionActive) {
                const measurement = {
                    timestamp: new Date(),
                    avgSize: (Math.random() * 5 + 3).toFixed(2),
                    minSize: (Math.random() * 2 + 2).toFixed(2),
                    maxSize: (Math.random() * 3 + 5).toFixed(2),
                    count: Math.floor(Math.random() * 50 + 20),
                    image: currentImage
            };
            measurements.push(measurement);
            updateMeasurements();
            }
        }, 500);
    };
    reader.readAsDataURL(file);
}

function displayImage(imageData) {
    const preview = document.getElementById('cameraPreview');
    preview.innerHTML = `<img src="${imageData}" alt="Captured pellet image" style="max-width: 100%; height: auto; border-radius: 0.5rem;">`;
}

// Charts are now handled by Recharts in user-charts.js

// Measurements History
function loadMeasurementHistory() {
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const currentUser = getCurrentUser();
    
    // Filter sessions to only show the logged-in user's sessions
    const sessions = allSessions.filter(session => {
        if (!currentUser) return false;
        // Match by operator username (operator field stores username)
        const sessionOperator = session.operator || '';
        return sessionOperator === currentUser.username;
    });
    
    const sessionsList = document.getElementById('sessionsList');
    
    if (!sessionsList) return;
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = '<div class="no-sessions-message"><p class="no-data">No measurement sessions found</p><p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">Start a measurement session to see history here</p></div>';
        return;
    }
    
    // Sort by date (newest first)
    sessions.sort((a, b) => {
        const timeA = new Date(a.startTime || a.id);
        const timeB = new Date(b.startTime || b.id);
        return timeB - timeA;
    });
    
    sessionsList.innerHTML = sessions.map(session => {
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
        
        const avgSize = session.measurements && session.measurements.length > 0
            ? (session.measurements.reduce((sum, m) => sum + parseFloat(m.avgSize || 0), 0) / session.measurements.length).toFixed(2)
            : '0.00';
        
        return `
            <div class="session-history-card" onclick="showSessionDetails(${session.id})">
                <div class="session-history-header">
                    <div class="session-id-section">
                        <div class="session-id-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M8 8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h4>Session #${session.id}</h4>
                            <p class="session-history-time">
                                <svg style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                ${startTime}
                            </p>
                        </div>
                    </div>
                    <span class="session-history-status">Completed</span>
                </div>
                <div class="session-history-body">
                    <div class="session-history-stat">
                        <div class="stat-icon-mini">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <span class="stat-label">Duration</span>
                            <span class="stat-value">${durationText}</span>
                        </div>
                    </div>
                    <div class="session-history-stat">
                        <div class="stat-icon-mini">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <span class="stat-label">Pellet Measurements</span>
                            <span class="stat-value">${session.measurements?.length || 0}</span>
                        </div>
                    </div>
                    <div class="session-history-stat">
                        <div class="stat-icon-mini">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div>
                            <span class="stat-label">Actual Total Pellet Count</span>
                            <span class="stat-value">${session.totalPellets || 0}</span>
                        </div>
                    </div>
                    <div class="session-history-stat">
                        <div class="stat-icon-mini">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <span class="stat-label">Avg Size</span>
                            <span class="stat-value">${avgSize} mm</span>
                        </div>
                    </div>
                </div>
                <div class="session-history-footer">
                    <div class="footer-item">
                        <svg style="width: 14px; height: 14px; margin-right: 6px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>Ended: ${endTime}</span>
                    </div>
                    <div class="footer-item">
                        <svg style="width: 14px; height: 14px; margin-right: 6px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>${session.operator || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showSessionDetails(sessionId) {
    const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        alert('Session not found');
        return;
    }
    
    // Check if we're on the user-reports page
    const isReportsPage = window.location.pathname.includes('user-reports.html') || window.location.href.includes('user-reports.html');
    
    // Get operator details from allUsers
    const allUsers = localStorage.getItem('allUsers');
    const users = allUsers ? JSON.parse(allUsers) : [];
    const operatorUser = users.find(u => u.username === session.operator) || null;
    
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
    
    // Calculate quality score (same as in session card)
    let qualityScore = 0;
    if (session.measurements && session.measurements.length > 0) {
        const measurements = session.measurements;
        const totalMeasurements = measurements.length;
        
        // Factor 1: Size compliance (pellets within 8-12mm range) - 40%
        const compliantCount = measurements.filter(m => {
            const size = parseFloat(m.avgSize || 0);
            return size >= 8 && size <= 12;
        }).length;
        const sizeCompliance = (compliantCount / totalMeasurements) * 100;
        
        // Factor 2: Size consistency (lower variance = higher score) - 35%
        const sizes = measurements.map(m => parseFloat(m.avgSize || 0)).filter(s => s > 0);
        let consistencyScore = 100;
        if (sizes.length > 1) {
            const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
            const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
            const stdDev = Math.sqrt(variance);
            consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / 3) * 100));
        }
        
        // Factor 3: Optimal size targeting (closer to 10mm = better) - 15%
        let optimalSizeScore = 0;
        if (sizes.length > 0) {
            const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
            const targetSize = 10;
            const deviation = Math.abs(avgSize - targetSize);
            optimalSizeScore = Math.max(0, Math.min(100, 100 - (deviation / 5) * 100));
        }
        
        // Factor 4: Measurement completeness - 10%
        const completenessScore = Math.min(100, (totalMeasurements / 15) * 100);
        
        // Weighted average
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
    
    // Format date and time
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
                <span class="close" onclick="closeSessionDetailsModal()" style="color: var(--text-secondary) !important; font-size: 2rem !important; font-weight: 300 !important; line-height: 1 !important; cursor: pointer !important; transition: all 0.3s ease !important; flex-shrink: 0 !important; margin-left: 1rem !important; width: 36px !important; height: 36px !important; display: flex !important; align-items: center !important; justify-content: center !important; border-radius: 50% !important;" onmouseover="this.style.color='var(--primary-color)'; this.style.background='rgba(47, 167, 110, 0.1)'; this.style.transform='rotate(90deg)';" onmouseout="this.style.color='var(--text-secondary)'; this.style.background='transparent'; this.style.transform='rotate(0deg)';">&times;</span>
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
                    <!-- Left Column: Operator Information -->
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
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.4;">Session operator details</p>
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
                                        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2"/>
                                        <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Location</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; word-break: break-word; overflow-wrap: break-word; line-height: 1.4;">${operatorLocation}</p>
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
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word; overflow-wrap: break-word;">${startTime}</p>
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
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word; overflow-wrap: break-word;">${endTime}</p>
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
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Avg Time/Measurement</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 500; line-height: 1.4; word-break: break-word;">${avgTimePerMeasurement}s</p>
                                </div>
                            </div>
                            ` : ''}
                            <div style="display: flex; align-items: flex-start; gap: 1rem; min-height: 60px;">
                                <div style="width: 40px; height: 40px; background: ${isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)'}; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 20px; height: 20px; stroke: ${isCompleted ? '#10b981' : '#fbbf24'}; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Status</p>
                                    <p style="margin: 0; font-size: 0.9375rem; color: var(--text-primary); font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; line-height: 1.4;">
                                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isCompleted ? '#10b981' : '#fbbf24'}; display: inline-block; flex-shrink: 0;"></span>
                                        <span style="word-break: break-word;">${statusText}</span>
                                    </p>
                                </div>
                            </div>
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
                    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06); overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #4ECDC4 0%, #44a5a0 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(78, 205, 196, 0.25); flex-shrink: 0;">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">Diameter Distribution</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.4;">Size distribution analysis</p>
                            </div>
                        </div>
                        <div style="position: relative; height: 360px; width: 100%;">
                            <div id="sessionDistributionChart-${session.id}" style="width: 100%; height: 100%;"></div>
                        </div>
                    </div>
                    
                    <!-- Trends Chart -->
                    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06); overflow: hidden;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25); flex-shrink: 0;">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 3L12 8L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M3 21L12 16L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M3 12L12 17L21 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">Measurement Trends</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.4;">Size trends over time</p>
                            </div>
                        </div>
                        <div style="position: relative; height: 360px; width: 100%;">
                            <div id="sessionTrendsChart-${session.id}" style="width: 100%; height: 100%;"></div>
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
                
                <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; padding-top: 2rem; border-top: 2px solid rgba(47, 167, 110, 0.08);">
                    ${isReportsPage ? `
                    <button class="btn-primary" onclick="exportSessionData(${session.id})" style="display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%); color: white; padding: 0.875rem 2rem; border-radius: 0.75rem; border: none; font-weight: 600; font-size: 0.9375rem; cursor: pointer; box-shadow: 0 2px 8px rgba(47, 167, 110, 0.25); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(47, 167, 110, 0.35)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(47, 167, 110, 0.25)'">
                        <svg style="width: 18px; height: 18px; stroke: currentColor; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Export Data
                    </button>
                    ` : ''}
                    <button class="btn-secondary" onclick="closeSessionDetailsModal()" style="display: inline-flex; align-items: center; gap: 0.5rem; background: white; color: #2FA76E; padding: 0.875rem 2rem; border-radius: 0.75rem; border: 2px solid #2FA76E; font-weight: 600; font-size: 0.9375rem; cursor: pointer; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); transition: all 0.3s ease;" onmouseover="this.style.background='rgba(47, 167, 110, 0.05)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(47, 167, 110, 0.15)'" onmouseout="this.style.background='white'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.08)'">
                        <svg style="width: 18px; height: 18px; stroke: currentColor;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    // Append to body to ensure it's on top of everything
    document.body.appendChild(modal);
    
    // Force modal to be visible and positioned correctly
    setTimeout(() => {
        modal.style.cssText = 'display: flex !important; position: fixed !important; z-index: 9999 !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; align-items: center !important; justify-content: center !important; background: rgba(0, 0, 0, 0.6) !important; overflow: auto !important;';
        
        // Also ensure modal content is visible
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.cssText = 'max-width: 1200px !important; width: 95% !important; max-height: 90vh !important; margin: auto !important; position: relative !important; background: white !important; border-radius: 1.25rem !important; overflow-y: auto !important; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;';
        }
        
        // Ensure session-details-content has proper padding
        const sessionContent = modal.querySelector('.session-details-content');
        if (sessionContent) {
            sessionContent.style.cssText = 'padding: 2.5rem !important;';
        }
        
        // Initialize charts if Chart.js is available and session has measurements
        if (session.measurements && session.measurements.length > 0) {
            // Wait a bit longer to ensure DOM is fully rendered
            setTimeout(() => {
                initializeSessionCharts(session);
            }, 300);
        }
    }, 100);
    
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeSessionDetailsModal();
        }
    };
}

function initializeSessionCharts(session) {
    // Wait for ApexCharts to be available
    if (typeof ApexCharts === 'undefined') {
        setTimeout(() => initializeSessionCharts(session), 100);
        return;
    }
    
    // Distribution Chart
    const distCanvas = document.getElementById(`sessionDistributionChart-${session.id}`);
    if (distCanvas && session.measurements && session.measurements.length > 0) {
        // Destroy existing chart if it exists
        if (distCanvas.chart) {
            distCanvas.chart.destroy();
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
        
        const options = {
            series: [{
                name: 'Number of Measurements',
                data: counts
            }],
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: true
                },
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            },
            colors: ['#4ECDC4'],
            plotOptions: {
                bar: {
                    borderRadius: 8,
                    columnWidth: '80%',
                    distributed: false
                }
            },
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
                },
                axisBorder: {
                    show: false
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
                    },
                    formatter: function(value) {
                        return Math.floor(value);
                    }
                }
            },
            grid: {
                borderColor: 'rgba(0, 0, 0, 0.08)',
                strokeDashArray: 0,
                padding: {
                    left: 20,
                    right: 20,
                    bottom: 20
                },
                xaxis: {
                    lines: {
                        show: false
                    }
                }
            },
            tooltip: {
                theme: 'dark',
                style: {
                    fontSize: '12px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                },
                y: {
                    formatter: function(value) {
                        return 'Measurements: ' + value;
                    }
                }
            },
            legend: {
                show: true,
                position: 'top',
                horizontalAlign: 'left',
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
            }
        };

        distCanvas.chart = new ApexCharts(distCanvas, options);
        distCanvas.chart.render();
    }
    
    // Trends Chart
    const trendsCanvas = document.getElementById(`sessionTrendsChart-${session.id}`);
    if (trendsCanvas && session.measurements && session.measurements.length > 0) {
        // Destroy existing chart if it exists
        if (trendsCanvas.chart) {
            trendsCanvas.chart.destroy();
        }
        
        const measurements = session.measurements.slice().reverse();
        // Limit to last 20 measurements for better readability
        const displayMeasurements = measurements.slice(-20);
        const labels = displayMeasurements.map((m, i) => String(i + 1));
        const avgSizes = displayMeasurements.map(m => parseFloat(m.avgSize || 0));
        const minSizes = displayMeasurements.map(m => parseFloat(m.minSize || 0));
        const maxSizes = displayMeasurements.map(m => parseFloat(m.maxSize || 0));
        
        const options = {
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
                toolbar: {
                    show: true
                },
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            },
            colors: ['#2FA76E', '#FF6B6B', '#FFE66D'],
            stroke: {
                curve: 'smooth',
                width: [3.5, 2.5, 2.5]
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    type: 'vertical',
                    opacityFrom: 0.5,
                    opacityTo: 0.05,
                    stops: [0, 100]
                }
            },
            dataLabels: {
                enabled: false
            },
            markers: {
                size: 4,
                strokeWidth: 2,
                strokeColors: '#ffffff',
                hover: {
                    size: 7,
                    sizeOffset: 2
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
            grid: {
                borderColor: 'rgba(0, 0, 0, 0.08)',
                strokeDashArray: 2,
                padding: {
                    left: 20,
                    right: 20,
                    bottom: 20
                }
            },
            tooltip: {
                theme: 'dark',
                shared: true,
                intersect: false,
                style: {
                    fontSize: '12px',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                },
                y: {
                    formatter: function(value) {
                        return value.toFixed(2);
                    }
                }
            },
            legend: {
                show: true,
                position: 'top',
                horizontalAlign: 'left',
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
            }
        };

        trendsCanvas.chart = new ApexCharts(trendsCanvas, options);
        trendsCanvas.chart.render();
    }
}

function exportSessionData(sessionId) {
    const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    
    const data = {
        sessionId: session.id,
        startTime: session.startTimeFormatted || new Date(session.startTime || session.id).toLocaleString(),
        endTime: session.endTimeFormatted || (session.endTime ? new Date(session.endTime).toLocaleString() : 'In Progress'),
        operator: session.operator || 'Unknown',
        totalMeasurements: session.measurements?.length || 0,
        totalPellets: session.totalPellets || 0,
        measurements: session.measurements || []
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function closeSessionDetailsModal() {
    const modal = document.getElementById('sessionDetailsModal');
    if (modal) {
        modal.remove();
    }
}


function loadMeasurements() {
    // Ensure any existing modal is closed
    const existingModal = document.getElementById('sessionDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const currentUser = getCurrentUser();
    
    // Filter sessions to only show the logged-in user's sessions
    const sessions = allSessions.filter(session => {
        if (!currentUser) return false;
        // Match by operator username (operator field now stores username)
        const sessionOperator = session.operator || '';
        return sessionOperator === currentUser.username;
    });
    
    const measurementsList = document.getElementById('measurementsList');
    
    if (!measurementsList) return;
    
    // Get all users to look up operator ID numbers
    const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]');
    
    if (sessions.length === 0) {
        measurementsList.innerHTML = `
            <div class="no-sessions-message">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p class="no-data">No measurement sessions found</p>
                <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">Start a measurement session on the dashboard to see history here</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    sessions.sort((a, b) => {
        const timeA = new Date(a.startTime || a.id);
        const timeB = new Date(b.startTime || b.id);
        return timeB - timeA;
    });
    
    measurementsList.innerHTML = sessions.map(session => {
        // Get operator's ID number
        const operatorUser = allUsers.find(u => u.username === session.operator);
        const operatorIdNumber = operatorUser?.idNumber || session.operator || 'Unknown';
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
        
        const avgSize = session.measurements && session.measurements.length > 0
            ? (session.measurements.reduce((sum, m) => sum + parseFloat(m.avgSize || 0), 0) / session.measurements.length).toFixed(2)
            : '0.00';
        const minSize = session.measurements && session.measurements.length > 0
            ? Math.min(...session.measurements.map(m => parseFloat(m.minSize || 0))).toFixed(2)
            : '0.00';
        const maxSize = session.measurements && session.measurements.length > 0
            ? Math.max(...session.measurements.map(m => parseFloat(m.maxSize || 0))).toFixed(2)
            : '0.00';
        
        const isCompleted = session.endTime ? true : false;
        const statusText = isCompleted ? 'Completed' : 'In Progress';
        const statusClass = isCompleted ? 'status-completed' : 'status-active';
        // Calculate overall quality score with enhanced factors
        let qualityScore = 0;
        if (session.measurements && session.measurements.length > 0) {
            const measurements = session.measurements;
            const totalMeasurements = measurements.length;
            
            // Factor 1: Size compliance (pellets within 8-12mm range) - 40%
            const compliantCount = measurements.filter(m => {
                const size = parseFloat(m.avgSize || 0);
                return size >= 8 && size <= 12;
            }).length;
            const sizeCompliance = (compliantCount / totalMeasurements) * 100;
            
            // Factor 2: Size consistency (lower variance = higher score) - 35%
            const sizes = measurements.map(m => parseFloat(m.avgSize || 0)).filter(s => s > 0);
            let consistencyScore = 100;
            if (sizes.length > 1) {
                const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
                const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
                const stdDev = Math.sqrt(variance);
                // Improved calculation: max 3mm std dev = 0 score, 0mm = 100 score
                consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / 3) * 100));
            }
            
            // Factor 3: Optimal size targeting (closer to 10mm = better) - 15%
            let optimalSizeScore = 0;
            if (sizes.length > 0) {
                const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
                const targetSize = 10; // Optimal size
                const deviation = Math.abs(avgSize - targetSize);
                // Score decreases as deviation from 10mm increases (max 5mm deviation = 0)
                optimalSizeScore = Math.max(0, Math.min(100, 100 - (deviation / 5) * 100));
            }
            
            // Factor 4: Measurement completeness (more measurements = better) - 10%
            const completenessScore = Math.min(100, (totalMeasurements / 15) * 100);
            
            // Weighted average: 40% compliance, 35% consistency, 15% optimal size, 10% completeness
            qualityScore = Math.round(
                (sizeCompliance * 0.40) + 
                (consistencyScore * 0.35) + 
                (optimalSizeScore * 0.15) +
                (completenessScore * 0.10)
            );
            
            // Ensure score is between 0-100
            qualityScore = Math.max(0, Math.min(100, qualityScore));
        }
        const efficiency = duration > 0 && session.totalPellets
            ? Math.round((session.totalPellets / (duration / 60)) * 10) / 10
            : 0;
        const avgTimePerMeasurement = session.measurements && session.measurements.length > 0 && duration > 0
            ? Math.round((duration / session.measurements.length) * 10) / 10
            : 0;
        const measurementFrequency = duration > 0 && session.measurements && session.measurements.length > 0
            ? (session.measurements.length / (duration / 60)).toFixed(2)
            : '0.00';
        const sizeRange = parseFloat(maxSize) - parseFloat(minSize);
        const consistencyScore = session.measurements && session.measurements.length > 0
            ? Math.round((1 - (sizeRange / parseFloat(avgSize))) * 100)
            : 0;
        
        return `
        <div class="measurement-session-card" data-session-id="${session.id}">
            <div class="session-card-header">
                <div class="session-header-top">
                    <div class="session-title-section">
                        <div class="session-icon-wrapper">
                            <svg class="session-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M8 8H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 16H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="session-title-content">
                            <h3>Session #${session.id}</h3>
                            <div class="session-meta-info">
                                <span class="session-status-badge ${statusClass}">
                                    <span class="status-dot"></span>
                                    ${statusText}
                                </span>
                                <span class="session-id-display">ID: ${session.id}</span>
                            </div>
                        </div>
                    </div>
                    <div class="session-header-stats">
                        <div class="header-stat-item">
                            <svg class="header-stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div class="header-stat-content">
                                <span class="header-stat-value">${qualityScore}%</span>
                                <span class="header-stat-label">Quality</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="session-header-bottom">
                    <div class="session-info-row">
                        <div class="session-info-item">
                            <svg class="info-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span class="info-item-label">Operator ID:</span>
                            <span class="info-item-value operator-value" title="${operatorIdNumber}">${operatorIdNumber}</span>
                        </div>
                        <div class="session-info-item">
                            <svg class="info-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <span class="info-item-label">Date:</span>
                            <span class="info-item-value">${new Date(session.startTime || session.id).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div class="session-info-item">
                            <svg class="info-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <span class="info-item-label">Time:</span>
                            <span class="info-item-value">${new Date(session.startTime || session.id).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="session-card-body">
                <div class="session-stats-grid">
                    <div class="session-stat-item">
                        <div class="stat-icon-wrapper">
                            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <span class="stat-value">${durationText}</span>
                            <span class="stat-label">Duration</span>
                        </div>
                    </div>
                    <div class="session-stat-item">
                        <div class="stat-icon-wrapper">
                            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <span class="stat-value">${session.totalPellets || 0}</span>
                            <span class="stat-label">Actual Total Pellet Count</span>
                        </div>
                    </div>
                    <div class="session-stat-item">
                        <div class="stat-icon-wrapper">
                            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <span class="stat-value">${session.measurements?.length || 0}</span>
                            <span class="stat-label">Pellet Measurements</span>
                        </div>
                    </div>
                    <div class="session-stat-item">
                        <div class="stat-icon-wrapper">
                            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <span class="stat-value">${avgSize} mm</span>
                            <span class="stat-label">Avg Size</span>
                        </div>
                    </div>
                    <div class="session-stat-item">
                        <div class="stat-icon-wrapper">
                            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <span class="stat-value">${minSize} mm</span>
                            <span class="stat-label">Min Size</span>
                        </div>
                    </div>
                    <div class="session-stat-item">
                        <div class="stat-icon-wrapper">
                            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="stat-content">
                            <span class="stat-value">${maxSize} mm</span>
                            <span class="stat-label">Max Size</span>
                        </div>
                    </div>
                </div>
                <div class="session-footer">
                    <div class="session-footer-content">
                        <div class="session-time-section">
                            <div class="time-header">
                                <svg class="time-section-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                <span class="time-section-title">Session Timeline</span>
                            </div>
                            <div class="session-time-info">
                                <div class="time-item">
                                    <div class="time-item-badge time-badge-start">
                                        <svg class="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <div class="time-details">
                                        <span class="time-label">Started</span>
                                        <span class="time-value">${formatDateTime(session.startTime || session.id)}</span>
                                    </div>
                                </div>
                                ${session.endTime ? `
                                <div class="time-item">
                                    <div class="time-item-badge time-badge-end">
                                        <svg class="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <div class="time-details">
                                        <span class="time-label">Ended</span>
                                        <span class="time-value">${formatDateTime(session.endTime)}</span>
                                    </div>
                                </div>
                                ` : `
                                <div class="time-item">
                                    <div class="time-item-badge time-badge-active">
                                        <svg class="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <div class="time-details">
                                        <span class="time-label">Status</span>
                                        <span class="time-value">In Progress</span>
                                    </div>
                                </div>
                                `}
                                ${avgTimePerMeasurement > 0 ? `
                                <div class="time-item">
                                    <div class="time-item-badge time-badge-metric">
                                        <svg class="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <div class="time-details">
                                        <span class="time-label">Avg Time/Measurement</span>
                                        <span class="time-value">${avgTimePerMeasurement}s</span>
                                    </div>
                                </div>
                                ` : ''}
                                ${measurementFrequency !== '0.00' ? `
                                <div class="time-item">
                                    <div class="time-item-badge time-badge-frequency">
                                        <svg class="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <div class="time-details">
                                        <span class="time-label">Measurement Frequency</span>
                                        <span class="time-value">${measurementFrequency} per min</span>
                                    </div>
                                </div>
                                ` : ''}
                                ${sizeRange > 0 ? `
                                <div class="time-item">
                                    <div class="time-item-badge time-badge-range">
                                        <svg class="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                            <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <div class="time-details">
                                        <span class="time-label">Size Range</span>
                                        <span class="time-value">${sizeRange.toFixed(2)} mm</span>
                                    </div>
                                </div>
                                ` : ''}
                                ${efficiency > 0 ? `
                                <div class="time-item">
                                    <div class="time-item-badge time-badge-efficiency">
                                        <svg class="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </div>
                                    <div class="time-details">
                                        <span class="time-label">Production Rate</span>
                                        <span class="time-value">${efficiency} pellets/min</span>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="session-footer-action">
                        <button class="btn-delete-session" type="button" data-session-id="${session.id}" title="Delete Session">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Delete
                        </button>
                        <button class="btn-view-details" type="button" data-session-id="${session.id}">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" stroke-width="2"/>
                                <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            View Full Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // Add event listeners to cards and buttons after rendering
    setTimeout(() => {
        const cards = document.querySelectorAll('.measurement-session-card');
        cards.forEach(card => {
            const sessionId = parseInt(card.getAttribute('data-session-id'));
            if (sessionId) {
                card.addEventListener('click', function(e) {
                    // Don't trigger if clicking the button or sidebar
                    if (e.target.closest('.btn-view-details') || e.target.closest('.sidebar')) {
                        return;
                    }
                    showSessionDetails(sessionId);
                });
            }
        });
        
        const buttons = document.querySelectorAll('.btn-view-details');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const sessionId = parseInt(this.getAttribute('data-session-id'));
                if (sessionId) {
                    showSessionDetails(sessionId);
                }
            });
        });
        
        const deleteButtons = document.querySelectorAll('.btn-delete-session');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const sessionId = parseInt(this.getAttribute('data-session-id'));
                if (sessionId) {
                    deleteSession(sessionId);
                }
            });
        });
    }, 100);
}

function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
        return;
    }
    
    const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem('measurementSessions', JSON.stringify(filteredSessions));
    
    // Reload the measurements list
    loadMeasurements();
}

function formatDuration(start, end) {
    const diff = Math.floor((new Date(end) - new Date(start)) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    // If less than 24 hours ago, show relative time
    if (diff < 86400) {
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    }
    
    // Otherwise show formatted date and time
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Reports
function generateReport() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const currentUser = getCurrentUser();
    
    // Filter sessions by date range AND current user
    const filtered = allSessions.filter(s => {
        const sessionDate = new Date(s.startTime).toISOString().split('T')[0];
        const dateMatch = sessionDate >= startDate && sessionDate <= endDate;
        
        // Also filter by current user's username
        if (!currentUser) return false;
        const sessionOperator = s.operator || '';
        const userMatch = sessionOperator === currentUser.username;
        
        return dateMatch && userMatch;
    });
    
    if (filtered.length === 0) {
        document.getElementById('previewContent').innerHTML = '<p class="no-data">No data found for selected date range</p>';
        return;
    }
    
    const totalPellets = filtered.reduce((sum, s) => sum + s.totalPellets, 0);
    const totalMeasurements = filtered.reduce((sum, s) => sum + s.measurements.length, 0);
    
    // Calculate additional statistics
    const allSizes = [];
    filtered.forEach(s => {
        s.measurements.forEach(m => {
            const size = parseFloat(m.avgSize || 0);
            if (size > 0) allSizes.push(size);
        });
    });
    
    const avgSize = allSizes.length > 0 ? allSizes.reduce((sum, s) => sum + s, 0) / allSizes.length : 0;
    const minSize = allSizes.length > 0 ? Math.min(...allSizes) : 0;
    const maxSize = allSizes.length > 0 ? Math.max(...allSizes) : 0;
    
    // Calculate total duration
    const totalDuration = filtered.reduce((sum, s) => {
        if (s.endTime && s.startTime) {
            return sum + (new Date(s.endTime) - new Date(s.startTime));
        }
        return sum;
    }, 0);
    const totalHours = Math.floor(totalDuration / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60));
    
    // Calculate average pellets per session
    const avgPelletsPerSession = filtered.length > 0 ? (totalPellets / filtered.length).toFixed(1) : 0;
    
    // Calculate measurement rate
    const measurementRate = totalDuration > 0 ? (totalMeasurements / (totalDuration / (1000 * 60))).toFixed(1) : 0;
    
    const preview = `
        <div class="report-summary">
            <div class="summary-stats">
                <div class="summary-item">
                    <div class="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 3V7M16 3V7M4 9H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Date Range</span>
                        <span class="summary-value">${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Total Sessions</span>
                        <span class="summary-value">${filtered.length}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Total Measurements</span>
                        <span class="summary-value">${totalMeasurements.toLocaleString()}</span>
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="7" cy="7" r="3" fill="currentColor" opacity="0.8"/>
                            <circle cx="17" cy="7" r="3" fill="currentColor" opacity="0.8"/>
                            <circle cx="12" cy="12" r="3.5" fill="currentColor"/>
                            <circle cx="7" cy="17" r="3" fill="currentColor" opacity="0.8"/>
                            <circle cx="17" cy="17" r="3" fill="currentColor" opacity="0.8"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Total Pellet Count</span>
                        <span class="summary-value">${totalPellets.toLocaleString()}</span>
                    </div>
                </div>
                ${avgSize > 0 ? `
                <div class="summary-item">
                    <div class="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 3V7M12 17V21M3 12H7M17 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Average Size</span>
                        <span class="summary-value">${avgSize.toFixed(2)} mm</span>
                    </div>
                </div>
                ` : ''}
                ${minSize > 0 && maxSize > 0 ? `
                <div class="summary-item">
                    <div class="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 3L3 8L8 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 11L21 16L16 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M3 8H13M11 16H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Size Range</span>
                        <span class="summary-value">${minSize.toFixed(2)} - ${maxSize.toFixed(2)} mm</span>
                    </div>
                </div>
                ` : ''}
                ${totalDuration > 0 ? `
                <div class="summary-item">
                    <div class="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 7V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Total Duration</span>
                        <span class="summary-value">${totalHours}h ${totalMinutes}m</span>
                    </div>
                </div>
                ` : ''}
                ${avgPelletsPerSession > 0 ? `
                <div class="summary-item">
                    <div class="summary-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 3V12L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="summary-content">
                        <span class="summary-label">Avg Pellets/Session</span>
                        <span class="summary-value">${avgPelletsPerSession}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('previewContent').innerHTML = preview;
}

function exportReport(type, format = 'pdf') {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please generate a report first');
        return;
    }
    
    const allSessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
    const currentUser = getCurrentUser();
    
    // Filter sessions by date range AND current user
    const filtered = allSessions.filter(s => {
        const sessionDate = new Date(s.startTime).toISOString().split('T')[0];
        const dateMatch = sessionDate >= startDate && sessionDate <= endDate;
        
        // Also filter by current user's username
        if (!currentUser) return false;
        const sessionOperator = s.operator || '';
        const userMatch = sessionOperator === currentUser.username;
        
        return dateMatch && userMatch;
    });
    
    if (filtered.length === 0) {
        alert('No data found for selected date range');
        return;
    }
    
    const totalPellets = filtered.reduce((sum, s) => sum + s.totalPellets, 0);
    const totalMeasurements = filtered.reduce((sum, s) => sum + s.measurements.length, 0);
    const avgSize = filtered.reduce((sum, s) => {
        const sessionAvg = s.measurements.reduce((mSum, m) => mSum + parseFloat(m.avgSize), 0) / s.measurements.length;
        return sum + sessionAvg;
    }, 0) / filtered.length;
    
    const user = getCurrentUser();
    const report = {
        id: Date.now(),
        type: type,
        format: format,
        startDate: startDate,
        endDate: endDate,
        generatedBy: user ? user.name : 'Unknown User',
        generatedByUsername: user ? user.username : 'unknown',
        generatedAt: new Date().toISOString(),
        data: {
            totalSessions: filtered.length,
            totalMeasurements: totalMeasurements,
            totalPellets: totalPellets,
            averageSize: avgSize.toFixed(2),
            sessions: filtered.map(s => ({
                id: s.id,
                startTime: s.startTime,
                endTime: s.endTime,
                totalPellets: s.totalPellets,
                measurements: s.measurements.length
            }))
        }
    };
    
    // Save to shared reports storage
    const allReports = JSON.parse(localStorage.getItem('allReports') || '[]');
    allReports.push(report);
    localStorage.setItem('allReports', JSON.stringify(allReports));
    
    // Simulate export
    alert(`${type.charAt(0).toUpperCase() + type.slice(1)} report exported as ${format.toUpperCase()}!\n\nReport has been saved and is now visible to administrators.`);
    
    console.log(`Exporting ${type} report as ${format} from ${startDate} to ${endDate}`);
}

// Charts are now handled by Recharts which handles resizing automatically

