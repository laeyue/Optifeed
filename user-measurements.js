// User Measurements Page - Database Version

// Prevent redeclaration errors if script is loaded twice
// Use window properties to avoid redeclaration issues
window.currentSessionId = window.currentSessionId || null;
window.measurementInterval = window.measurementInterval || null;

// Load all measurement sessions from database
async function loadMeasurementSessions() {
    try {
        console.log('[user-measurements.js] Loading sessions from:', API_CONFIG.ENDPOINTS.SESSIONS);
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS);
        console.log('[user-measurements.js] API Response:', response);
        
        const sessions = response.sessions || [];
        
        const currentUser = getCurrentUser() || {};
        console.log('[user-measurements.js] Loaded sessions:', {
            currentUser: currentUser.username || 'Unknown',
            userRole: currentUser.role,
            userId: currentUser.id,
            total: sessions.length,
            sessionIds: sessions.map(s => s.id),
            sessionDetails: sessions.map(s => ({
                id: s.id,
                operator: s.operator,
                user_id: s.user_id,
                start_time: new Date(s.start_time).toLocaleString(),
                status: s.status
            }))
        });
        
        displaySessionsList(sessions);
        return sessions;
    } catch (error) {
        console.error('[user-measurements.js] Failed to load measurement sessions:', error);
        const measurementsList = document.getElementById('measurementsList');
        if (measurementsList) {
            measurementsList.innerHTML = `
                <div class="no-sessions-message">
                    <p class="no-data">Error loading sessions</p>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">
                        ${error.message || 'Please try refreshing the page'}
                    </p>
                </div>
            `;
        }
        return [];
    }
}

// Display sessions list
function displaySessionsList(sessions) {
    const sessionsList = document.getElementById('measurementsList');
    if (!sessionsList) {
        console.error('[user-measurements.js] Element with id "measurementsList" not found');
        return;
    }
    
    if (sessions.length === 0) {
        sessionsList.innerHTML = `
            <div class="no-sessions-message">
                <p class="no-data">No measurement sessions found</p>
                <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">
                    Start a measurement session to see history here
                </p>
            </div>
        `;
        return;
    }
    
    // Sort by start_time descending
    sessions.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    
    sessionsList.innerHTML = sessions.map(session => {
        const startTime = new Date(session.start_time).toLocaleString();
        const endTime = session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress';
        const duration = session.duration_seconds || 0;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        const durationText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const statusClass = session.status === 'completed' ? 'status-completed' : 'status-active';
        const statusText = session.status === 'completed' ? 'Completed' : session.status === 'active' ? 'Active' : 'Cancelled';
        
        // Get stats from database (these are aggregated values from the backend query)
        const measurementCount = parseInt(session.measurement_count) || 0;
        const totalPellets = parseInt(session.total_pellets) || 0;
        const avgSize = session.avg_size ? parseFloat(session.avg_size).toFixed(2) : '0.00';
        
        return `
            <div class="session-history-card" onclick="viewSessionDetails(${session.id})">
                <div class="session-history-header">
                    <div class="session-id-section">
                        <div class="session-id-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div>
                            <h4>Session #${session.id}</h4>
                            <p class="session-history-time">
                                <svg style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                ${startTime}
                            </p>
                        </div>
                    </div>
                    <span class="session-history-status ${statusClass}">${statusText}</span>
                </div>
                <div class="session-history-body">
                    <div class="session-history-stat">
                        <div class="stat-icon-mini">
                            <svg viewBox="0 0 24 24" fill="none">
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
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <span class="stat-label">Measurements</span>
                            <span class="stat-value">${measurementCount}</span>
                        </div>
                    </div>
                    <div class="session-history-stat">
                        <div class="stat-icon-mini">
                            <svg viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </div>
                        <div>
                            <span class="stat-label">Total Pellets</span>
                            <span class="stat-value">${totalPellets.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="session-history-stat">
                        <div class="stat-icon-mini">
                            <svg viewBox="0 0 24 24" fill="none">
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
                        <span>Ended: ${endTime}</span>
                    </div>
                    <div class="footer-item">
                        <span>${session.operator || 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// View session details
async function viewSessionDetails(sessionId) {
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSION_BY_ID(sessionId));
        const session = response.session;
        
        if (!session) {
            alert('Session not found');
            return;
        }
        
        // Show session details modal with measurements
        showSessionDetailsModal(session);
    } catch (error) {
        console.error('Failed to load session details:', error);
        alert('Failed to load session details');
    }
}

// Show session details modal - ALL DATA FROM DATABASE
function showSessionDetailsModal(session) {
    // All data comes from database - session object from API
    const measurements = session.measurements || [];
    
    // Use database aggregated values (these come from the backend query)
    const totalPellets = session.total_pellets 
        ? parseInt(session.total_pellets) 
        : measurements.reduce((sum, m) => sum + (m.total_pellets || 0), 0);
    
    const avgSize = session.avg_size 
        ? parseFloat(session.avg_size).toFixed(2)
        : measurements.length > 0
            ? (measurements.reduce((sum, m) => sum + parseFloat(m.avg_size || 0), 0) / measurements.length).toFixed(2)
            : '0.00';
    
    const measurementCount = session.measurement_count 
        ? parseInt(session.measurement_count)
        : measurements.length;
    
    // Calculate min and max from database measurements (extract from metadata)
    let minSize = '0.00';
    let maxSize = '0.00';
    let sizeRange = '0.00';
    let qualityBreakdown = { excellent: 0, good: 0, fair: 0, poor: 0 };
    
    if (measurements.length > 0) {
        // Extract sizes from metadata (stored in database)
        const sizesFromMetadata = measurements
            .map(m => {
                let min = parseFloat(m.avg_size || 0);
                let max = parseFloat(m.avg_size || 0);
                
                if (m.metadata) {
                    try {
                        const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
                        if (meta.min_size) min = parseFloat(meta.min_size);
                        if (meta.max_size) max = parseFloat(meta.max_size);
                    } catch (e) {
                        // If parsing fails, use avg_size
                    }
                }
                
                // Count quality ratings
                if (m.quality_rating) {
                    const rating = (m.quality_rating || '').toLowerCase();
                    if (qualityBreakdown.hasOwnProperty(rating)) {
                        qualityBreakdown[rating]++;
                    }
                }
                
                return {
                    min: min,
                    max: max,
                    avg: parseFloat(m.avg_size || 0)
                };
            })
            .filter(s => s.avg > 0);
        
        if (sizesFromMetadata.length > 0) {
            minSize = Math.min(...sizesFromMetadata.map(s => s.min)).toFixed(2);
            maxSize = Math.max(...sizesFromMetadata.map(s => s.max)).toFixed(2);
            sizeRange = (parseFloat(maxSize) - parseFloat(minSize)).toFixed(2);
        } else {
            // Fallback: calculate from avg_size
            const sizes = measurements.map(m => parseFloat(m.avg_size || 0)).filter(s => s > 0);
            if (sizes.length > 0) {
                minSize = Math.min(...sizes).toFixed(2);
                maxSize = Math.max(...sizes).toFixed(2);
                sizeRange = (parseFloat(maxSize) - parseFloat(minSize)).toFixed(2);
            }
        }
    }
    
    // Calculate additional statistics from database
    const durationSeconds = session.duration_seconds || 0;
    const durationMinutes = durationSeconds / 60;
    const measurementRate = durationMinutes > 0 && measurementCount > 0 
        ? (measurementCount / durationMinutes).toFixed(2)
        : '0.00';
    const pelletsPerMinute = durationMinutes > 0 && totalPellets > 0
        ? (totalPellets / durationMinutes).toFixed(1)
        : '0.0';
    const avgTimePerMeasurement = measurementCount > 0 && durationSeconds > 0
        ? (durationSeconds / measurementCount).toFixed(1)
        : '0.0';
    
    // All time data from database
    const startTime = new Date(session.start_time).toLocaleString();
    const endTime = session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress';
    
    // Duration text (durationSeconds already calculated above)
    const durationText = durationSeconds > 0 ? formatSessionDuration(durationSeconds) : 'N/A';
    
    // Session ID from database
    const sessionId = session.id;
    
    // Helper function for quality colors
    function getQualityStyle(rating) {
        const r = (rating || '').toLowerCase();
        if (r === 'excellent') return 'background: #ecfdf5; color: #059669;';
        if (r === 'good') return 'background: #eff6ff; color: #3b82f6;';
        if (r === 'fair') return 'background: #fffbeb; color: #d97706;';
        if (r === 'poor') return 'background: #fef2f2; color: #dc2626;';
        return 'background: #f1f5f9; color: #64748b;';
    }
    
    // Calculate additional performance metrics
    const consistencyScore = measurements.length > 1 ? (() => {
        const sizes = measurements.map(m => parseFloat(m.avg_size || 0)).filter(s => s > 0);
        if (sizes.length < 2) return 100;
        const avgSizeCalc = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSizeCalc, 2), 0) / sizes.length;
        const stdDev = Math.sqrt(variance);
        return Math.max(0, Math.min(100, Math.round(100 - (stdDev / 3) * 100)));
    })() : 100;
    
    const completenessScore = Math.min(100, Math.round((measurementCount / 15) * 100));
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'sessionDetailsModal';
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.zIndex = '9999';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0, 0, 0, 0.6)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.overflow = 'auto';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 960px; width: 95%; max-height: 90vh; margin: auto; border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display: flex; flex-direction: column; overflow: hidden; background: white;">
            <!-- Header with gradient -->
            <div style="
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                padding: 1.75rem 2rem;
                position: relative;
                overflow: hidden;
                flex-shrink: 0;
            ">
                <div style="position: absolute; top: 0; right: 0; width: 200px; height: 100%; background: linear-gradient(135deg, rgba(47, 167, 110, 0.15) 0%, transparent 70%);"></div>
                <div style="position: absolute; bottom: -30px; right: 20px; width: 100px; height: 100px; border-radius: 50%; background: rgba(78, 205, 196, 0.1);"></div>
                
                <div style="display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="
                            width: 52px;
                            height: 52px;
                            border-radius: 14px;
                            background: linear-gradient(135deg, #2FA76E, #4ECDC4);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 8px 20px rgba(47, 167, 110, 0.35);
                        ">
                            <svg style="width: 26px; height: 26px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8L14 2Z"/>
                                <path d="M14 2V8H19"/>
                                <path d="M16 13H8"/>
                                <path d="M16 17H8"/>
                            </svg>
                        </div>
                        <div>
                            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: white; letter-spacing: -0.02em;">Session #${sessionId}</h2>
                            <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">${session.operator || 'Unknown Operator'}</p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            gap: 0.375rem;
                            padding: 0.5rem 1rem;
                            border-radius: 2rem;
                            font-size: 0.8125rem;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.3px;
                            background: ${session.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : session.status === 'active' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.2)'};
                            color: ${session.status === 'completed' ? '#34d399' : session.status === 'active' ? '#60a5fa' : '#94a3b8'};
                        ">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: currentColor;"></span>
                            ${session.status || 'active'}
                        </span>
                        <button onclick="closeSessionDetailsModal()" style="
                            width: 36px;
                            height: 36px;
                            border-radius: 8px;
                            border: none;
                            background: rgba(255, 255, 255, 0.1);
                            color: white;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: background 0.2s ease;
                        " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                            <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <div style="padding: 2rem; background: #f8fafc; flex: 1; overflow-y: auto; min-height: 0;">
                <!-- Time & Duration Info -->
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    padding: 1rem 1.5rem;
                    background: white;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 1.5rem;
                ">
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(47, 167, 110, 0.1); display: flex; align-items: center; justify-content: center;">
                            <svg style="width: 20px; height: 20px; color: #2FA76E;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                        </div>
                        <div>
                            <div style="font-size: 0.6875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Started</div>
                            <div style="font-size: 0.9375rem; font-weight: 600; color: #1e293b;">${startTime}</div>
                        </div>
                    </div>
                    <div style="width: 1px; height: 40px; background: #e2e8f0;"></div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center;">
                            <svg style="width: 20px; height: 20px; color: #ef4444;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                        </div>
                        <div>
                            <div style="font-size: 0.6875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Ended</div>
                            <div style="font-size: 0.9375rem; font-weight: 600; color: #1e293b;">${endTime}</div>
                        </div>
                    </div>
                    <div style="width: 1px; height: 40px; background: #e2e8f0;"></div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(139, 92, 246, 0.1); display: flex; align-items: center; justify-content: center;">
                            <svg style="width: 20px; height: 20px; color: #8b5cf6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 22h14"/>
                                <path d="M5 2h14"/>
                                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
                                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
                            </svg>
                        </div>
                        <div>
                            <div style="font-size: 0.6875rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">Duration</div>
                            <div style="font-size: 0.9375rem; font-weight: 600; color: #1e293b;">${durationText}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Key Performance Metrics -->
                <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                            <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">Key Performance Metrics</h3>
                            <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b;">Session statistics and measurements</p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem;">
                        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(16, 185, 129, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #10b981; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Measurements</p>
                                    <h4 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${measurementCount}</h4>
                                </div>
                            </div>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.06) 0%, rgba(47, 167, 110, 0.02) 100%); border: 1px solid rgba(47, 167, 110, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(47, 167, 110, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #2FA76E; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Total Pellets</p>
                                    <h4 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${totalPellets.toLocaleString()}</h4>
                                </div>
                            </div>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%); border: 1px solid rgba(59, 130, 246, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(59, 130, 246, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #3b82f6; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Avg Size</p>
                                    <h4 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${avgSize} mm</h4>
                                </div>
                            </div>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%); border: 1px solid rgba(139, 92, 246, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                <div style="width: 36px; height: 36px; background: rgba(139, 92, 246, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <svg style="width: 18px; height: 18px; stroke: #8b5cf6; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Size Range</p>
                                    <h4 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${sizeRange} mm</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Performance Breakdown -->
                <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
                            <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">Performance Breakdown</h3>
                            <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b;">Detailed size analysis</p>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem;">
                        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Min Size</p>
                            <h4 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${minSize} mm</h4>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%); border: 1px solid rgba(59, 130, 246, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Max Size</p>
                            <h4 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${maxSize} mm</h4>
                        </div>
                        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%); border: 1px solid rgba(139, 92, 246, 0.12); border-radius: 1rem; padding: 1.25rem;">
                            <p style="margin: 0 0 0.5rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Consistency</p>
                            <h4 style="margin: 0; font-size: 1.75rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${consistencyScore}%</h4>
                        </div>
                    </div>
                </div>
                
                ${measurements.length > 0 ? `
                <!-- Measurements Table -->
                <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25); flex-shrink: 0;">
                            <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; line-height: 1.3;">Measurement Records</h3>
                            <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b; line-height: 1.4;">Individual measurement details</p>
                        </div>
                    </div>
                    <div style="max-height: 400px; overflow-y: auto; border: 1px solid rgba(47, 167, 110, 0.1); border-radius: 0.75rem; background: white;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="position: sticky; top: 0; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); z-index: 10;">
                                <tr style="border-bottom: 2px solid rgba(47, 167, 110, 0.1);">
                                    <th style="padding: 1rem 0.75rem; text-align: left; font-size: 0.8125rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Time</th>
                                    <th style="padding: 1rem 0.75rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Pellets</th>
                                    <th style="padding: 1rem 0.75rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Avg Size</th>
                                    <th style="padding: 1rem 0.75rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Quality</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${measurements.map(m => `
                                    <tr style="border-bottom: 1px solid rgba(226, 232, 240, 0.5); transition: all 0.2s ease;" onmouseover="this.style.background='rgba(47, 167, 110, 0.03)'; this.style.transform='translateX(2px)'" onmouseout="this.style.background='white'; this.style.transform='translateX(0)'">
                                        <td style="padding: 1rem 0.75rem; font-size: 0.875rem; color: #1e293b; font-weight: 500;">${new Date(m.timestamp).toLocaleTimeString()}</td>
                                        <td style="padding: 1rem 0.75rem; text-align: center; font-size: 0.875rem; font-weight: 700; color: #2FA76E;">${(m.total_pellets || 0).toLocaleString()}</td>
                                        <td style="padding: 1rem 0.75rem; text-align: center; font-size: 0.875rem; font-weight: 600; color: #1e293b;">${parseFloat(m.avg_size || 0).toFixed(2)} mm</td>
                                        <td style="padding: 1rem 0.75rem; text-align: center;">
                                            <span style="display: inline-block; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; ${getQualityStyle(m.quality_rating)}">${m.quality_rating || 'N/A'}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : '<div style="background: white; border-radius: 1rem; padding: 3rem; text-align: center; border: 1px solid #e2e8f0;"><p style="color: #64748b; font-size: 0.9375rem; margin: 0;">No measurements recorded for this session.</p></div>'}
                
                ${measurements.length > 0 ? `
                <!-- Charts Section -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; margin-bottom: 2rem;">
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
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; line-height: 1.3;">Diameter Distribution</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b; line-height: 1.4;">Size distribution analysis</p>
                            </div>
                        </div>
                        <div style="position: relative; height: 360px; width: 100%;">
                            <div id="userSessionDistributionChart-${sessionId}" style="width: 100%; height: 100%;"></div>
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
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; line-height: 1.3;">Measurement Trends</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b; line-height: 1.4;">Size trends over time</p>
                            </div>
                        </div>
                        <div style="position: relative; height: 360px; width: 100%;">
                            <div id="userSessionTrendsChart-${sessionId}" style="width: 100%; height: 100%;"></div>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(47, 167, 110, 0.1); display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick="closeSessionDetailsModal()" style="
                        padding: 0.875rem 2rem;
                        border-radius: 0.75rem;
                        font-weight: 600;
                        font-size: 0.9375rem;
                        border: 2px solid rgba(47, 167, 110, 0.2);
                        background: white;
                        color: #2FA76E;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='rgba(47, 167, 110, 0.05)'; this.style.borderColor='rgba(47, 167, 110, 0.3)'" onmouseout="this.style.background='white'; this.style.borderColor='rgba(47, 167, 110, 0.2)'">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeSessionDetailsModal();
        }
    };
    
    // Initialize charts if measurements exist
    if (measurements.length > 0) {
        setTimeout(() => {
            initializeUserSessionCharts(session, measurements);
        }, 500);
    }
}

// Helper function to format session duration
function formatSessionDuration(seconds) {
    if (!seconds || seconds <= 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}

function closeSessionDetailsModal() {
    const modal = document.getElementById('sessionDetailsModal');
    if (modal) {
        // Destroy charts before removing modal
        const distChart = document.querySelector('[id^="userSessionDistributionChart-"]');
        const trendsChart = document.querySelector('[id^="userSessionTrendsChart-"]');
        if (distChart && distChart.chart) {
            distChart.chart.destroy();
        }
        if (trendsChart && trendsChart.chart) {
            trendsChart.chart.destroy();
        }
        modal.remove();
    }
}

// Initialize charts for user session details
function initializeUserSessionCharts(session, measurements) {
    // Wait for ApexCharts to be available
    if (typeof ApexCharts === 'undefined') {
        setTimeout(() => initializeUserSessionCharts(session, measurements), 100);
        return;
    }
    
    const sessionId = session.id;
    
    // Distribution Chart
    const distCanvas = document.getElementById(`userSessionDistributionChart-${sessionId}`);
    if (distCanvas && measurements && measurements.length > 0) {
        // Destroy existing chart if it exists
        if (distCanvas.chart) {
            distCanvas.chart.destroy();
        }
        
        const bins = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
        const binLabels = bins.slice(0, -1).map((b, i) => `${b}-${bins[i + 1]}`);
        const counts = new Array(bins.length - 1).fill(0);
        
        measurements.forEach(m => {
            const size = parseFloat(m.avg_size || 0);
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
    const trendsCanvas = document.getElementById(`userSessionTrendsChart-${sessionId}`);
    if (trendsCanvas && measurements && measurements.length > 0) {
        // Destroy existing chart if it exists
        if (trendsCanvas.chart) {
            trendsCanvas.chart.destroy();
        }
        
        // Sort measurements by timestamp
        const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        // Limit to last 20 measurements for better readability
        const displayMeasurements = sortedMeasurements.slice(-20);
        const labels = displayMeasurements.map((m, i) => String(i + 1));
        const avgSizes = displayMeasurements.map(m => parseFloat(m.avg_size || 0));
        
        // Calculate min and max sizes from metadata
        const minSizes = displayMeasurements.map(m => {
            let min = parseFloat(m.avg_size || 0);
            if (m.metadata) {
                try {
                    const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
                    if (meta.min_size) min = parseFloat(meta.min_size);
                } catch (e) {
                    // If parsing fails, use avg_size
                }
            }
            return min;
        });
        
        const maxSizes = displayMeasurements.map(m => {
            let max = parseFloat(m.avg_size || 0);
            if (m.metadata) {
                try {
                    const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
                    if (meta.max_size) max = parseFloat(meta.max_size);
                } catch (e) {
                    // If parsing fails, use avg_size
                }
            }
            return max;
        });
        
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
            colors: ['#2FA76E', '#3b82f6', '#f59e0b'],
            stroke: {
                curve: 'smooth',
                width: 3.5
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
                        return value.toFixed(2) + ' mm';
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

// Start a new measurement session
async function startNewSession() {
    try {
        const startTime = new Date().toISOString();
        console.log('[startNewSession] Creating new session with start_time:', startTime);
        
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS, {
            method: 'POST',
            body: JSON.stringify({
                start_time: startTime,
                notes: ''
            })
        });
        
        window.currentSessionId = response.session.id;
        
        console.log('[startNewSession] Session created successfully:', {
            id: window.currentSessionId,
            start_time: response.session.start_time,
            operator: response.session.operator,
            user_id: response.session.user_id,
            status: response.session.status,
            fullResponse: response.session
        });
        
        alert('New session started! Session ID: ' + window.currentSessionId + '\nCheck console for details.');
        
        // Reload sessions list to verify it appears
        console.log('[startNewSession] Reloading sessions list...');
        const sessions = await loadMeasurementSessions();
        console.log('[startNewSession] Sessions after reload:', sessions.length);
        
        // Verify the new session is in the list
        const newSession = sessions.find(s => s.id === window.currentSessionId);
        if (newSession) {
            console.log('[startNewSession] ✓ New session FOUND in list:', newSession);
        } else {
            console.log('[startNewSession] ✗ New session NOT FOUND in list! Session ID:', window.currentSessionId);
            console.log('[startNewSession] Available session IDs:', sessions.map(s => s.id));
        }
    } catch (error) {
        console.error('Failed to start session:', error);
        alert('Failed to start session: ' + error.message);
    }
}

// End current session
async function endCurrentSession() {
    if (!window.currentSessionId) {
        alert('No active session');
        return;
    }
    
    try {
        const endTime = new Date().toISOString();
        const sessionStart = new Date(); // Should get from session data
        const durationSeconds = Math.floor((new Date() - sessionStart) / 1000);
        
        await apiRequest(API_CONFIG.ENDPOINTS.SESSION_BY_ID(window.currentSessionId), {
            method: 'PUT',
            body: JSON.stringify({
                end_time: endTime,
                duration_seconds: durationSeconds,
                status: 'completed'
            })
        });
        
        alert('Session ended successfully!');
        window.currentSessionId = null;
        
        // Reload sessions list
        await loadMeasurementSessions();
    } catch (error) {
        console.error('Failed to end session:', error);
        alert('Failed to end session');
    }
}

// Add a measurement to current session
async function addMeasurement() {
    if (!window.currentSessionId) {
        alert('Please start a session first');
        return;
    }
    
    // Get values from form
    const avgSize = parseFloat(document.getElementById('avgSizeInput')?.value || 0);
    const totalPellets = parseInt(document.getElementById('totalPelletsInput')?.value || 0);
    const qualityRating = document.getElementById('qualityRatingSelect')?.value || 'good';
    const notes = document.getElementById('measurementNotesInput')?.value || '';
    
    if (!avgSize || !totalPellets) {
        alert('Please enter average size and total pellets');
        return;
    }
    
    try {
        await apiRequest(API_CONFIG.ENDPOINTS.RECORDS, {
            method: 'POST',
            body: JSON.stringify({
                session_id: window.currentSessionId,
                avg_size: avgSize,
                total_pellets: totalPellets,
                quality_rating: qualityRating,
                notes: notes,
                timestamp: new Date().toISOString()
            })
        });
        
        alert('Measurement added successfully!');
        
        // Clear form
        if (document.getElementById('avgSizeInput')) document.getElementById('avgSizeInput').value = '';
        if (document.getElementById('totalPelletsInput')) document.getElementById('totalPelletsInput').value = '';
        if (document.getElementById('measurementNotesInput')) document.getElementById('measurementNotesInput').value = '';
        
        // Reload sessions to show updated data
        await loadMeasurementSessions();
        
    } catch (error) {
        console.error('Failed to add measurement:', error);
        alert('Failed to add measurement');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    loadMeasurementSessions();
    
    // Refresh every 30 seconds
    setInterval(loadMeasurementSessions, 30000);
});
