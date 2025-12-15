// User Reports Management - Database Version

let currentSessions = [];
let savedReports = [];

// Initialize dates
function initializeDates() {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    // Format as YYYY-MM-DD in local timezone
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && endDateInput) {
        startDateInput.value = formatDate(sixMonthsAgo);
        endDateInput.value = formatDate(today);
        console.log('Dates initialized:', { 
            startDate: startDateInput.value, 
            endDate: endDateInput.value,
            today: formatDate(today),
            range: 'Last 6 months'
        });
    } else {
        console.error('Date input elements not found!');
    }
}

// Load sessions for report generation
async function loadSessionsForReport() {
    try {
        const authToken = getAuthToken();
        console.log('[user-reports.js] Loading sessions with auth token:', authToken ? 'Present' : 'Missing');
        
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        
        if (!startDate || !endDate) {
            console.warn('Date range not selected');
            return;
        }
        
        // Fetch sessions from database
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS, {
            method: 'GET'
        });
        
        console.log('[user-reports.js] API Response:', {
            totalSessions: response.sessions?.length || 0,
            sessionDetails: response.sessions?.map(s => ({
                id: s.id,
                start_time: s.start_time,
                operator: s.operator,
                user_id: s.user_id,
                status: s.status
            }))
        });
        
        if (response.sessions) {
            // Filter sessions by date range
            const start = new Date(startDate + 'T00:00:00');
            const end = new Date(endDate + 'T23:59:59');
            
            console.log('Date filter range:', { 
                startInput: startDate, 
                endInput: endDate,
                start, 
                end, 
                totalSessions: response.sessions.length
            });
            
            // Filter sessions by date range
            currentSessions = response.sessions.filter(session => {
                const sessionDate = new Date(session.start_time);
                const matches = sessionDate >= start && sessionDate <= end;
                if (!matches) {
                    console.log('Session excluded:', session.id, sessionDate, 'not in range');
                }
                return matches;
            });
            
            console.log('Filtered sessions:', {
                total: response.sessions.length,
                filtered: currentSessions.length,
                sessionIds: currentSessions.map(s => s.id),
                allSessionDates: response.sessions.map(s => ({ id: s.id, date: new Date(s.start_time).toLocaleDateString() })),
                filteredSessionDates: currentSessions.map(s => ({ id: s.id, date: new Date(s.start_time).toLocaleDateString() })),
                dateRange: { start: start.toLocaleDateString(), end: end.toLocaleDateString() }
            });
            
            await displaySessionsForReport(currentSessions);
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
        showNotification('Failed to load sessions', 'error');
    }
}

// Display sessions for report generation
async function displaySessionsForReport(sessions) {
    const sessionsList = document.getElementById('sessionsList');
    
    if (!sessionsList) {
        console.error('Sessions list element not found');
        return;
    }
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
                <p class="no-data" style="margin-bottom: 1rem;">No measurement sessions found in the selected date range</p>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                    Try adjusting the date range above or click "Show All Sessions" to see all your sessions
                </p>
                <button onclick="showAllSessions()" class="btn-primary" style="padding: 0.75rem 1.5rem;">
                    <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Show All Sessions
                </button>
            </div>
        `;
        return;
    }
    
    // Fetch records for each session from database to calculate stats
    const sessionsWithStats = await Promise.all(sessions.map(async (session) => {
        try {
            const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSION_RECORDS(session.id), {
                method: 'GET'
            });
            const records = response.records || [];
            
            // Calculate statistics from database records
            const totalMeasurements = records.length;
            const totalPellets = records.reduce((sum, r) => sum + (r.total_pellets || 0), 0);
            const sizes = records.map(r => parseFloat(r.avg_size) || 0).filter(s => s > 0);
            const avgSize = sizes.length > 0 ? (sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(2) : '0.00';
            const minSize = sizes.length > 0 ? Math.min(...sizes).toFixed(2) : '0.00';
            const maxSize = sizes.length > 0 ? Math.max(...sizes).toFixed(2) : '0.00';
            
            return { ...session, totalMeasurements, totalPellets, avgSize, minSize, maxSize };
        } catch (error) {
            console.error('Error fetching records for session:', session.id, error);
            return { ...session, totalMeasurements: 0, totalPellets: 0, avgSize: '0.00', minSize: '0.00', maxSize: '0.00' };
        }
    }));
    
    let html = '';
    for (const session of sessionsWithStats) {
        // Fetch records again for full calculation
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSION_RECORDS(session.id));
        const records = response.records || [];
        
        // Calculate duration
        const duration = session.end_time 
            ? Math.floor((new Date(session.end_time) - new Date(session.start_time)) / 1000)
            : 0;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        const durationText = duration > 0 
            ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            : 'N/A';

        // Calculate quality score
        let qualityScore = 0;
        if (session.totalMeasurements > 0) {
            const compliantCount = records.filter(r => {
                const size = parseFloat(r.avg_size || 0);
                return size >= 8 && size <= 12;
            }).length;
            const sizeCompliance = (compliantCount / session.totalMeasurements) * 100;
            
            const sizes = records.map(r => parseFloat(r.avg_size || 0)).filter(s => s > 0);
            let consistencyScore = 100;
            if (sizes.length > 1) {
                const avgSizeCalc = sizes.reduce((a, b) => a + b, 0) / sizes.length;
                const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSizeCalc, 2), 0) / sizes.length;
                const stdDev = Math.sqrt(variance);
                consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / 3) * 100));
            }
            
            let optimalSizeScore = 0;
            if (sizes.length > 0) {
                const avgSizeCalc = sizes.reduce((a, b) => a + b, 0) / sizes.length;
                const targetSize = 10;
                const deviation = Math.abs(avgSizeCalc - targetSize);
                optimalSizeScore = Math.max(0, Math.min(100, 100 - (deviation / 5) * 100));
            }
            
            const completenessScore = Math.min(100, (session.totalMeasurements / 15) * 100);
            
            qualityScore = Math.round(
                (sizeCompliance * 0.40) + 
                (consistencyScore * 0.35) + 
                (optimalSizeScore * 0.15) +
                (completenessScore * 0.10)
            );
            
            qualityScore = Math.max(0, Math.min(100, qualityScore));
        }

        const efficiency = duration > 0 && session.totalPellets
            ? Math.round((session.totalPellets / (duration / 60)) * 10) / 10
            : 0;
        const avgTimePerMeasurement = session.totalMeasurements > 0 && duration > 0
            ? Math.round((duration / session.totalMeasurements) * 10) / 10
            : 0;
        const measurementFrequency = duration > 0 && session.totalMeasurements > 0
            ? (session.totalMeasurements / (duration / 60)).toFixed(2)
            : '0.00';
        const sizeRange = parseFloat(session.maxSize) - parseFloat(session.minSize);

        const isCompleted = session.end_time ? true : false;
        const statusText = isCompleted ? 'Completed' : 'In Progress';
        const statusClass = isCompleted ? 'status-completed' : 'status-active';
        
        html += `
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
                            <span class="info-item-value operator-value">${session.operator || 'Unknown'}</span>
                        </div>
                        <div class="session-info-item">
                            <svg class="info-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <span class="info-item-label">Date:</span>
                            <span class="info-item-value">${new Date(session.start_time).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div class="session-info-item">
                            <svg class="info-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            <span class="info-item-label">Time:</span>
                            <span class="info-item-value">${new Date(session.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
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
                            <span class="stat-value">${session.totalPellets}</span>
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
                            <span class="stat-value">${session.totalMeasurements}</span>
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
                            <span class="stat-value">${session.avgSize} mm</span>
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
                            <span class="stat-value">${session.minSize} mm</span>
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
                            <span class="stat-value">${session.maxSize} mm</span>
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
                                        <span class="time-value">${new Date(session.start_time).toLocaleString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit', 
                                            hour12: true 
                                        })}</span>
                                    </div>
                                </div>
                                ${session.end_time ? `
                                <div class="time-item">
                                    <div class="time-item-badge time-badge-end">
                                        <svg class="time-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <div class="time-details">
                                        <span class="time-label">Ended</span>
                                        <span class="time-value">${new Date(session.end_time).toLocaleString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric', 
                                            hour: '2-digit', 
                                            minute: '2-digit', 
                                            hour12: true 
                                        })}</span>
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
                    <div class="session-footer-action" style="display: flex; align-items: center; gap: 1rem;">
                        <input type="checkbox" name="session" value="${session.id}" style="transform: scale(1.5);">
                        <label style="margin: 0;">Select for Report</label>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    
    sessionsList.innerHTML = html;
    
    // Update selection info after rendering
    setTimeout(() => updateSelectionInfo(), 100);
}

// Generate report from selected sessions or date range
async function generateReport() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (!startDateInput || !endDateInput) {
        console.error('Date inputs not found');
        return;
    }
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    console.log('Generate Report - Date range:', { startDate, endDate });
    
    if (!startDate || !endDate) {
        showNotification('Please select both start and end dates', 'error');
        return;
    }
    
    try {
        // Load sessions for the date range first
        await loadSessionsForReport();
        
        console.log('Generate Report - Sessions found:', currentSessions.length, currentSessions);
        
        if (currentSessions.length === 0) {
            document.getElementById('previewContent').innerHTML = 
                '<p class="no-data">No measurement sessions found in the selected date range. Try adjusting the dates or add measurements first.</p>';
            return;
        }
        
        // Check if user selected specific sessions
        const selectedCheckboxes = document.querySelectorAll('input[name="session"]:checked');
        let sessionsToInclude = [];
        
        if (selectedCheckboxes.length > 0) {
            // Use only selected sessions
            const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
            sessionsToInclude = currentSessions.filter(s => selectedIds.includes(s.id));
            console.log('Using selected sessions:', selectedIds, sessionsToInclude);
        } else {
            // Use all sessions in date range
            sessionsToInclude = currentSessions;
            console.log('Using all sessions in date range');
        }
        
        if (sessionsToInclude.length === 0) {
            document.getElementById('previewContent').innerHTML = 
                '<p class="no-data">No sessions selected. Please select at least one session or adjust the date range.</p>';
            return;
        }
        
        // Get all records for the selected sessions from database
        const allRecords = [];
        const sessionRecordsMap = new Map(); // Track records per session for accuracy
        
        for (const session of sessionsToInclude) {
            const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSION_RECORDS(session.id), {
                method: 'GET'
            });
            
            if (response.records && response.records.length > 0) {
                allRecords.push(...response.records);
                sessionRecordsMap.set(session.id, response.records);
            }
        }
        
        if (allRecords.length === 0) {
            document.getElementById('previewContent').innerHTML = 
                '<p class="no-data">No measurement records found for the selected sessions.</p>';
            return;
        }
        
        // Calculate accurate statistics from database records
        const totalMeasurements = allRecords.length;
        const totalPellets = allRecords.reduce((sum, r) => sum + (r.total_pellets || 0), 0);
        const avgSize = totalMeasurements > 0 
            ? (allRecords.reduce((sum, r) => sum + (parseFloat(r.avg_size) || 0), 0) / totalMeasurements).toFixed(2)
            : '0.00';
        
        // Calculate size range from actual records
        const sizes = allRecords.map(r => parseFloat(r.avg_size) || 0).filter(s => s > 0);
        const minSize = sizes.length > 0 ? Math.min(...sizes).toFixed(2) : '0.00';
        const maxSize = sizes.length > 0 ? Math.max(...sizes).toFixed(2) : '0.00';
        const sizeRange = (parseFloat(maxSize) - parseFloat(minSize)).toFixed(2);
        
        // Store for saving later
        window.currentReportData = {
            sessions: sessionsToInclude,
            records: allRecords,
            sessionRecordsMap: sessionRecordsMap,
            stats: {
                totalSessions: sessionsToInclude.length,
                totalMeasurements: totalMeasurements,
                totalPellets: totalPellets,
                avgSize: avgSize,
                minSize: minSize,
                maxSize: maxSize,
                sizeRange: sizeRange
            }
        };
        
        // Log report data for verification
        console.log('Report Generated:', {
            selectedSessions: sessionsToInclude.length,
            sessionIds: sessionsToInclude.map(s => s.id),
            totalRecords: allRecords.length,
            stats: window.currentReportData.stats
        });
        
        // Display preview
        const sessionDetailsHtml = sessionsToInclude.length <= 10 
            ? `<div class="report-session-list" style="margin-top: 1.5rem; padding: 1rem; background: rgba(47, 167, 110, 0.05); border-radius: 0.5rem;">
                    <h4 style="margin: 0 0 1rem 0; color: var(--primary-color); font-size: 1rem;">
                        <svg style="width: 20px; height: 20px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Included Sessions
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.75rem;">
                        ${sessionsToInclude.map(s => `
                            <div style="padding: 0.5rem; background: white; border-radius: 0.375rem; border: 1px solid rgba(47, 167, 110, 0.2);">
                                <div style="font-weight: 600; color: var(--primary-color);">Session #${s.id}</div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                    ${new Date(s.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        `).join('')}
                    </div>
               </div>`
            : `<div style="margin-top: 1rem; padding: 0.75rem; background: rgba(47, 167, 110, 0.05); border-radius: 0.375rem; color: var(--text-secondary); text-align: center;">
                    Including ${sessionsToInclude.length} sessions from ${new Date(sessionsToInclude[0].start_time).toLocaleDateString()} to ${new Date(sessionsToInclude[sessionsToInclude.length - 1].start_time).toLocaleDateString()}
               </div>`;
        
        const previewHTML = `
            <div class="report-summary">
                <h3>
                    <svg style="width: 24px; height: 24px; color: #2FA76E;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 17V7M12 17V11M15 17V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Report Summary
                </h3>
                <div class="summary-stats">
                    <div class="summary-item">
                        <div class="summary-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="summary-content">
                            <span class="summary-label">Date Range</span>
                            <span class="summary-value">${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12L14.5 14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div class="summary-content">
                            <span class="summary-label">Total Sessions ${selectedCheckboxes.length > 0 ? '(Selected)' : '(All in Range)'}</span>
                            <span class="summary-value">${sessionsToInclude.length.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2"/>
                                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="2"/>
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
                                <circle cx="8" cy="10" r="2.5" fill="currentColor" opacity="0.8"/>
                                <circle cx="16" cy="10" r="2.5" fill="currentColor" opacity="0.8"/>
                                <circle cx="12" cy="14" r="2.5" fill="currentColor" opacity="0.8"/>
                                <circle cx="6" cy="14" r="2" fill="currentColor" opacity="0.5"/>
                                <circle cx="18" cy="14" r="2" fill="currentColor" opacity="0.5"/>
                            </svg>
                        </div>
                        <div class="summary-content">
                            <span class="summary-label">Total Pellets</span>
                            <span class="summary-value">${totalPellets.toLocaleString()}</span>
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
                            <span class="summary-label">Average Size</span>
                            <span class="summary-value">${avgSize} mm</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 14L12 21L5 14M12 21V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="summary-content">
                            <span class="summary-label">Min Size</span>
                            <span class="summary-value">${minSize} mm</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 10L12 3L19 10M12 3V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div class="summary-content">
                            <span class="summary-label">Max Size</span>
                            <span class="summary-value">${maxSize} mm</span>
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 20H20M4 20L12 4M20 20L12 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="summary-content">
                            <span class="summary-label">Size Range</span>
                            <span class="summary-value">${sizeRange} mm</span>
                        </div>
                    </div>
                </div>
                ${sessionDetailsHtml}
            </div>
        `;
        
        document.getElementById('previewContent').innerHTML = previewHTML;
        
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Failed to generate report', 'error');
    }
}

// Save report to database
async function saveReport() {
    const reportNameInput = document.getElementById('reportName');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    const reportName = reportNameInput?.value?.trim();
    const startDate = startDateInput?.value;
    const endDate = endDateInput?.value;
    
    if (!reportName) {
        showNotification('Please enter a report name', 'error');
        return;
    }
    
    if (!startDate || !endDate) {
        showNotification('Please select date range first', 'error');
        return;
    }
    
    // Check if report was generated
    if (!window.currentReportData || !window.currentReportData.sessions || window.currentReportData.sessions.length === 0) {
        showNotification('No data to save. Generate a report first.', 'error');
        return;
    }
    
    try {
        // Use the accurate data from the generated report
        const reportData = window.currentReportData;
        const sessionsData = reportData.sessions;
        const stats = reportData.stats;
        const records = reportData.records || [];
        
        // Save to database with accurate session IDs and statistics
        const response = await apiRequest(API_CONFIG.ENDPOINTS.REPORTS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                report_name: reportName,
                report_type: 'summary',
                date_from: startDate,
                date_to: endDate,
                total_measurements: stats.totalMeasurements,
                total_pellets: stats.totalPellets,
                average_size: parseFloat(stats.avgSize),
                min_size: parseFloat(stats.minSize),
                max_size: parseFloat(stats.maxSize),
                report_data: {
                    sessions: sessionsData.map(s => ({
                        id: s.id,
                        operator: s.operator,
                        start_time: s.start_time,
                        end_time: s.end_time,
                        status: s.status
                    })),
                    records_count: records.length
                }
            })
        });
        
        if (response.report || response.message) {
            showNotification('Report saved successfully', 'success');
            reportNameInput.value = '';
            await loadSavedReports();
        } else {
            showNotification('Failed to save report', 'error');
        }
    } catch (error) {
        console.error('Error saving report:', error);
        showNotification('Failed to save report', 'error');
    }
}

// Load saved reports
async function loadSavedReports() {
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.REPORTS, {
            method: 'GET'
        });
        
        if (response.reports) {
            savedReports = response.reports;
            displaySavedReports(savedReports);
        }
    } catch (error) {
        console.error('Error loading saved reports:', error);
        showNotification('Failed to load saved reports', 'error');
    }
}

// Display saved reports
function displaySavedReports(reports) {
    const savedReportsList = document.getElementById('savedReportsList');
    
    if (!savedReportsList) {
        console.error('Saved reports list element not found');
        return;
    }
    
    if (reports.length === 0) {
        savedReportsList.innerHTML = '<p class="no-data">No saved reports yet. Generate and save a report to see it here.</p>';
        return;
    }
    
    let html = '';
    reports.forEach(report => {
        const generatedDate = new Date(report.generated_at);
        const dateFrom = new Date(report.date_from);
        const dateTo = new Date(report.date_to);
        html += `
            <div class="saved-report-item">
                <div class="report-item-info">
                    <h4>
                        <svg style="width: 20px; height: 20px; margin-right: 0.5rem;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 17V7M12 17V11M15 17V13" stroke="#2FA76E" stroke-width="2" stroke-linecap="round"/>
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="#2FA76E" stroke-width="2"/>
                        </svg>
                        ${report.report_name}
                    </h4>
                    <div class="report-item-meta">
                        <span>
                            <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            ${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}
                        </span>
                        <span>
                            <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12L14.5 14.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            Generated ${generatedDate.toLocaleDateString()}
                        </span>
                        <span>
                            <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2"/>
                                <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            ${report.total_measurements || 0} measurements
                        </span>
                        <span>
                            <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="8" cy="10" r="2" fill="currentColor" opacity="0.6"/>
                                <circle cx="16" cy="10" r="2" fill="currentColor" opacity="0.6"/>
                                <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.6"/>
                            </svg>
                            ${(report.total_pellets || 0).toLocaleString()} pellets
                        </span>
                        <span>
                            <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            Avg ${(parseFloat(report.average_size) || 0).toFixed(2)} mm
                        </span>
                    </div>
                </div>
                <div class="report-item-actions">
                    <button class="view-btn" onclick="viewReport(${report.id})" title="View Report">
                        <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        View
                    </button>
                    <button class="download-btn" onclick="downloadReport(${report.id})" title="Download">
                        <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 3V16M12 16L16 12M12 16L8 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M3 17V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Download
                    </button>
                    <button class="delete-btn" onclick="deleteReport(${report.id})" title="Delete">
                        <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    savedReportsList.innerHTML = html;
}

// View report details
async function viewReport(reportId) {
    try {
        const report = savedReports.find(r => r.id === reportId);
        if (!report) {
            showNotification('Report not found', 'error');
            return;
        }
        
        // Display report details in a modal or dedicated area
        const modalHTML = `
            <div class="modal-overlay" onclick="closeReportModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${report.report_name}</h3>
                        <button class="modal-close" onclick="closeReportModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="report-details">
                            <div class="detail-row">
                                <span class="detail-label">Report Type:</span>
                                <span class="detail-value">${report.report_type || 'Summary'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date Range:</span>
                                <span class="detail-value">${new Date(report.date_from).toLocaleDateString()} - ${new Date(report.date_to).toLocaleDateString()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Generated:</span>
                                <span class="detail-value">${new Date(report.generated_at).toLocaleString()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Total Measurements:</span>
                                <span class="detail-value">${report.total_measurements || 0}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Total Pellets:</span>
                                <span class="detail-value">${(report.total_pellets || 0).toLocaleString()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Average Size:</span>
                                <span class="detail-value">${(parseFloat(report.average_size) || 0).toFixed(2)} mm</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Min Size:</span>
                                <span class="detail-value">${(parseFloat(report.min_size) || 0).toFixed(2)} mm</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Max Size:</span>
                                <span class="detail-value">${(parseFloat(report.max_size) || 0).toFixed(2)} mm</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        console.error('Error viewing report:', error);
        showNotification('Failed to view report', 'error');
    }
}

// Close report modal
function closeReportModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Download report as JSON
async function downloadReport(reportId) {
    try {
        const report = savedReports.find(r => r.id === reportId);
        if (!report) {
            showNotification('Report not found', 'error');
            return;
        }
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.report_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Report downloaded', 'success');
    } catch (error) {
        console.error('Error downloading report:', error);
        showNotification('Failed to download report', 'error');
    }
}

// Delete report
async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) {
        return;
    }
    
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.REPORT_BY_ID(reportId), {
            method: 'DELETE'
        });
        
        if (response.message) {
            showNotification('Report deleted successfully', 'success');
            await loadSavedReports();
        } else {
            showNotification('Failed to delete report', 'error');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        showNotification('Failed to delete report', 'error');
    }
}

// Export report as PDF or CSV
async function exportReport(reportType, format = 'pdf') {
    try {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        
        if (!startDate || !endDate) {
            showNotification('Please select date range first', 'error');
            return;
        }
        
        // Make sure we have current sessions loaded
        if (currentSessions.length === 0) {
            showNotification('No sessions found for the selected date range', 'error');
            return;
        }
        
        // Get all records for these sessions from database
        const allRecords = [];
        for (const session of currentSessions) {
            const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSION_RECORDS(session.id), {
                method: 'GET'
            });
            
            if (response.records) {
                allRecords.push(...response.records);
            }
        }
        
        if (allRecords.length === 0) {
            showNotification('No measurement data found to export', 'error');
            return;
        }
        
        // For CSV export
        if (format === 'csv') {
            let csvContent = '';
            
            if (reportType === 'summary') {
                csvContent = 'Metric,Value\\n';
                csvContent += `Total Sessions,${currentSessions.length}\\n`;
                csvContent += `Total Measurements,${allRecords.length}\\n`;
                csvContent += `Total Pellets,${allRecords.reduce((sum, r) => sum + (r.total_pellets || 0), 0)}\\n`;
                const sizes = allRecords.map(r => parseFloat(r.avg_size) || 0).filter(s => s > 0);
                csvContent += `Average Size (mm),${sizes.length > 0 ? (sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(2) : '0.00'}\\n`;
                csvContent += `Min Size (mm),${sizes.length > 0 ? Math.min(...sizes).toFixed(2) : '0.00'}\\n`;
                csvContent += `Max Size (mm),${sizes.length > 0 ? Math.max(...sizes).toFixed(2) : '0.00'}\\n`;
            } else {
                // Detailed or distribution - export all records
                csvContent = 'Session ID,Timestamp,Avg Size (mm),Min Size (mm),Max Size (mm),Total Pellets\\n';
                allRecords.forEach(record => {
                    csvContent += `${record.session_id},${record.timestamp},${record.avg_size},${record.min_size},${record.max_size},${record.total_pellets}\\n`;
                });
            }
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}-report-${startDate}-to-${endDate}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Report exported successfully', 'success');
        } else {
            // PDF export would require a library like jsPDF
            showNotification('PDF export functionality coming soon', 'info');
        }
    } catch (error) {
        console.error('Error exporting report:', error);
        showNotification('Failed to export report', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#2FA76E' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Debug function to check database directly
async function debugDatabaseSessions() {
    try {
        console.log('=== DATABASE DEBUG ===');
        
        // Get current user info
        const currentUser = getCurrentUser() || {};
        const authToken = getAuthToken();
        console.log('1. Current User:', {
            username: currentUser.username,
            role: currentUser.role,
            name: currentUser.name,
            idNumber: currentUser.idNumber,
            hasAuthToken: !!authToken
        });
        
        // Decode JWT token to get user_id
        let tokenUserId = null;
        if (authToken) {
            try {
                const tokenParts = authToken.split('.');
                const payload = JSON.parse(atob(tokenParts[1]));
                tokenUserId = payload.id;
                console.log('1b. Token Payload:', {
                    userId: payload.id,
                    username: payload.username,
                    role: payload.role
                });
            } catch (e) {
                console.error('Failed to decode token:', e);
            }
        }
        
        // Get all sessions from API
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS, {
            method: 'GET'
        });
        
        console.log('2. API Response:', {
            totalReturned: response.sessions?.length || 0,
            sessions: response.sessions
        });
        
        if (response.sessions) {
            console.log('3. Session Details:');
            response.sessions.forEach((s, i) => {
                console.log(`   Session ${i + 1}:`, {
                    id: s.id,
                    operator: s.operator,
                    user_id: s.user_id,
                    start_time: new Date(s.start_time).toLocaleString(),
                    status: s.status,
                    belongsToCurrentUser: tokenUserId ? (s.user_id === tokenUserId) : 'Unknown (no token)'
                });
            });
        }
        
        console.log('=== END DEBUG ===');
        
        alert(`Database has ${response.sessions?.length || 0} sessions for this user.\nCheck console for details.`);
    } catch (error) {
        console.error('Debug error:', error);
        alert('Debug failed: ' + error.message);
    }
}

// Show all sessions by expanding date range
async function showAllSessions() {
    try {
        // Get all sessions from API
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS, {
            method: 'GET'
        });
        
        if (response.sessions && response.sessions.length > 0) {
            // Find earliest and latest session dates
            const dates = response.sessions.map(s => new Date(s.start_time));
            const earliest = new Date(Math.min(...dates));
            const latest = new Date(Math.max(...dates));
            
            // Add buffer (1 day before earliest, 1 day after latest)
            earliest.setDate(earliest.getDate() - 1);
            latest.setDate(latest.getDate() + 1);
            
            // Format dates
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            // Update date inputs
            document.getElementById('startDate').value = formatDate(earliest);
            document.getElementById('endDate').value = formatDate(latest);
            
            // Reload sessions with new date range
            await loadSessionsForReport();
            
            showNotification(`Showing all ${response.sessions.length} sessions`, 'success');
        } else {
            showNotification('No sessions found', 'info');
        }
    } catch (error) {
        console.error('Error loading all sessions:', error);
        showNotification('Failed to load sessions', 'error');
    }
}

// Selection management functions
function selectAllSessions() {
    const checkboxes = document.querySelectorAll('input[name="session"]');
    checkboxes.forEach(cb => cb.checked = true);
    updateSelectionInfo();
}

function clearAllSelections() {
    const checkboxes = document.querySelectorAll('input[name="session"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateSelectionInfo();
}

function updateSelectionInfo() {
    const selectedCount = document.querySelectorAll('input[name="session"]:checked').length;
    const totalCount = document.querySelectorAll('input[name="session"]').length;
    const infoElement = document.getElementById('selectionInfo');
    
    if (infoElement) {
        if (selectedCount === 0) {
            infoElement.textContent = `No sessions selected (${totalCount} available)`;
            infoElement.style.color = 'var(--text-secondary)';
        } else {
            infoElement.textContent = `${selectedCount} of ${totalCount} session${selectedCount !== 1 ? 's' : ''} selected`;
            infoElement.style.color = 'var(--primary-color)';
            infoElement.style.fontWeight = '600';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Reports page loading...');
    initializeDates();
    await loadSessionsForReport();
    await loadSavedReports();
    
    // Set up event listeners for date changes
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.addEventListener('change', () => loadSessionsForReport());
    }
    if (endDateInput) {
        endDateInput.addEventListener('change', () => loadSessionsForReport());
    }
    
    // Set up event delegation for checkbox changes
    document.addEventListener('change', (e) => {
        if (e.target.name === 'session') {
            updateSelectionInfo();
        }
    });
});
