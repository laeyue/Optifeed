// Admin Records - Database Version

// Load user profiles from database
async function loadUserProfiles() {
    const profilesList = document.getElementById('userProfilesList');
    if (!profilesList) return;
    
    try {
        // Get users with statistics from API
        const usersResponse = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USERS_STATS);
        
        if (!usersResponse || !usersResponse.success) {
            profilesList.innerHTML = '<p class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">Failed to load operators</p>';
            return;
        }
        
        // Filter to only show operators (users with role 'user')
        const operators = usersResponse.users.filter(u => u.role === 'user');
        
        if (operators.length === 0) {
            profilesList.innerHTML = '<p class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">No operators found</p>';
            return;
        }
        
        // Update operator count in header
        const operatorCountEl = document.getElementById('operatorCount');
        if (operatorCountEl) {
            operatorCountEl.textContent = `${operators.length} Active Operator${operators.length !== 1 ? 's' : ''}`;
        }
        
        profilesList.innerHTML = operators.map((user, index) => {
            const stats = user.stats || {};
            const totalRecords = stats.totalRecords || 0;
            const completedSessions = stats.completedSessions || 0;
            const totalPellets = stats.totalPellets || 0;
            const avgSize = stats.avgSize ? parseFloat(stats.avgSize).toFixed(2) : '0.00';
            
            // Calculate productivity (pellets per session)
            const productivity = completedSessions > 0 ? Math.round(totalPellets / completedSessions) : 0;
            
            return `
                <div class="user-profile-card" onclick="showUserDetails('${user.username}')" style="
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 1rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                    position: relative;
                    overflow: hidden;
                    animation: fadeInUp 0.4s ease ${0.05 * (index + 1)}s both;
                " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(0, 0, 0, 0.08)'; this.style.borderColor='#2FA76E'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.04)'; this.style.borderColor='#e2e8f0'">
                    
                    <!-- Card Header -->
                    <div style="padding: 1.5rem 1.5rem 1.25rem; border-bottom: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="
                                width: 56px;
                                height: 56px;
                                border-radius: 14px;
                                background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 1.5rem;
                                font-weight: 700;
                                box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25);
                                flex-shrink: 0;
                            ">${(user.name || user.username || 'U').charAt(0).toUpperCase()}</div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.125rem; font-weight: 700; color: #1e293b; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name || user.username}</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #64748b; font-weight: 500;">@${user.username}</p>
                                ${user.location ? `<div style="margin-top: 0.375rem; display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: #94a3b8;">
                                    <svg style="width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    ${user.location}
                                </div>` : ''}
                            </div>
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 32px;
                                height: 32px;
                                border-radius: 8px;
                                background: #f8fafc;
                                color: #94a3b8;
                                transition: all 0.2s ease;
                            ">
                                <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 18l6-6-6-6"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Stats Grid -->
                    <div style="padding: 1.25rem 1.5rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
                        <div style="text-align: center; padding: 0.75rem 0.5rem; background: #f8fafc; border-radius: 0.625rem;">
                            <div style="font-size: 1.375rem; font-weight: 700; color: #2FA76E; line-height: 1.2;">${totalRecords}</div>
                            <div style="font-size: 0.6875rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 0.25rem;">Records</div>
                        </div>
                        <div style="text-align: center; padding: 0.75rem 0.5rem; background: #f8fafc; border-radius: 0.625rem;">
                            <div style="font-size: 1.375rem; font-weight: 700; color: #4ECDC4; line-height: 1.2;">${completedSessions}</div>
                            <div style="font-size: 0.6875rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 0.25rem;">Sessions</div>
                        </div>
                        <div style="text-align: center; padding: 0.75rem 0.5rem; background: #f8fafc; border-radius: 0.625rem;">
                            <div style="font-size: 1.375rem; font-weight: 700; color: #8b5cf6; line-height: 1.2;">${formatCompactNumber(totalPellets)}</div>
                            <div style="font-size: 0.6875rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 0.25rem;">Pellets</div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="padding: 0.875rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #64748b;">
                            <svg style="width: 14px; height: 14px; color: #2FA76E;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371"/>
                            </svg>
                            <span style="font-weight: 600;">${productivity.toLocaleString()}</span> pellets/session avg
                        </div>
                        <span style="font-size: 0.6875rem; color: #94a3b8; font-weight: 500;">Click to view details</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Helper function for compact numbers
        function formatCompactNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }
    } catch (error) {
        console.error('Failed to load user profiles:', error);
        profilesList.innerHTML = '<p class="no-data" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">Error loading operators</p>';
    }
}

// Show user details modal with sessions
async function showUserDetails(username) {
    const modal = document.getElementById('userDetailsModal');
    const content = document.getElementById('userDetailsContent');
    const title = document.getElementById('userDetailsTitle');
    
    if (!modal || !content || !title) return;
    
    try {
        // Get user info
        const usersResponse = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USERS_STATS);
        const user = usersResponse.users.find(u => u.username === username);
        
        if (!user) {
            alert('User not found');
            return;
        }
        
        // Get user's records and sessions
        const recordsResponse = await apiRequest(API_CONFIG.ENDPOINTS.RECORDS);
        const sessionsResponse = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS);
        
        const userRecords = (recordsResponse.records || []).filter(r => r.user_id === user.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const userSessions = (sessionsResponse.sessions || []).filter(s => s.user_id === user.id)
            .sort((a, b) => new Date(b.start_time || b.id) - new Date(a.start_time || a.id));
        const completedSessions = userSessions.filter(s => s.status === 'completed');
        
        // Calculate statistics
        const stats = user.stats || {};
        const totalPellets = stats.totalPellets || 0;
        const totalRecords = stats.totalRecords || 0;
        const completedSessionsCount = stats.completedSessions || 0;
        
        // Calculate size statistics from records
        const allSizes = userRecords.map(r => parseFloat(r.avg_size || 0)).filter(s => s > 0);
        const avgSize = allSizes.length > 0 
            ? (allSizes.reduce((a, b) => a + b, 0) / allSizes.length).toFixed(2)
            : '0.00';
        const minSize = allSizes.length > 0 ? Math.min(...allSizes).toFixed(2) : '0.00';
        const maxSize = allSizes.length > 0 ? Math.max(...allSizes).toFixed(2) : '0.00';
        
        // Calculate total session time from completed sessions
        const totalSessionTime = completedSessions.reduce((sum, s) => {
            if (s.duration_seconds) {
                return sum + s.duration_seconds;
            } else if (s.end_time && s.start_time) {
                return sum + Math.floor((new Date(s.end_time) - new Date(s.start_time)) / 1000);
            }
            return sum;
        }, 0);
        const totalHours = Math.floor(totalSessionTime / 3600);
        const totalMinutes = Math.floor((totalSessionTime % 3600) / 60);
        const totalTimeText = totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`;
        
        // Calculate today's activity
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = userRecords.filter(r => {
            const recordDate = new Date(r.timestamp).toISOString().split('T')[0];
            return recordDate === today;
        }).length;
        const todaySessions = userSessions.filter(s => {
            const sessionDate = new Date(s.start_time).toISOString().split('T')[0];
            return sessionDate === today;
        }).length;
        
        // Calculate this week's activity
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekRecords = userRecords.filter(r => new Date(r.timestamp) >= weekAgo).length;
        const weekSessions = userSessions.filter(s => new Date(s.start_time) >= weekAgo).length;
        
        // Calculate average pellets per session
        const avgPelletsPerSession = completedSessions.length > 0
            ? (completedSessions.reduce((sum, s) => sum + (parseInt(s.total_pellets || 0)), 0) / completedSessions.length).toFixed(0)
            : '0';
        
        // Calculate average records per session
        const avgRecordsPerSession = completedSessions.length > 0
            ? (completedSessions.reduce((sum, s) => sum + (parseInt(s.measurement_count || 0)), 0) / completedSessions.length).toFixed(1)
            : '0.0';
        
        // Calculate pellets per hour
        const pelletsPerHour = totalSessionTime > 0 
            ? ((totalPellets / totalSessionTime) * 3600).toFixed(0)
            : '0';
        
        // Calculate records per hour
        const recordsPerHour = totalSessionTime > 0
            ? ((totalRecords / totalSessionTime) * 3600).toFixed(1)
            : '0.0';
        
        title.textContent = `${user.name || user.username}'s Activity Summary`;
        
        // Build sessions list
        let sessionsHtml = '';
        if (userSessions.length === 0) {
            sessionsHtml = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No sessions found</p>';
        } else {
            sessionsHtml = userSessions.map(session => {
                const startTime = new Date(session.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const startTimeStr = new Date(session.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const duration = session.duration_seconds 
                    ? formatDuration(session.duration_seconds)
                    : (session.end_time && session.start_time 
                        ? formatDuration(Math.floor((new Date(session.end_time) - new Date(session.start_time)) / 1000))
                        : '-');
                
                const statusColor = session.status === 'completed' ? '#10b981' : session.status === 'active' ? '#3b82f6' : '#94a3b8';
                const statusBg = session.status === 'completed' ? '#ecfdf5' : session.status === 'active' ? '#eff6ff' : '#f1f5f9';
                
                return `
                    <div style="
                        display: flex;
                        align-items: center;
                        padding: 1.25rem 1.5rem;
                        border-bottom: 1px solid rgba(47, 167, 110, 0.08);
                        cursor: pointer;
                        transition: all 0.2s ease;
                        background: white;
                    " onclick="showUserSessionDetails(${session.id})" 
                    onmouseover="this.style.background='linear-gradient(135deg, rgba(47, 167, 110, 0.04) 0%, rgba(78, 205, 196, 0.02) 100%)'; this.style.transform='translateX(4px)'" 
                    onmouseout="this.style.background='white'; this.style.transform='translateX(0)'">
                        <div style="
                            width: 48px;
                            height: 48px;
                            border-radius: 12px;
                            background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.06) 100%);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-right: 1.25rem;
                            flex-shrink: 0;
                            border: 1.5px solid rgba(139, 92, 246, 0.15);
                        ">
                            <span style="font-size: 0.9375rem; font-weight: 700; color: #8b5cf6;">#${session.id}</span>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="
                                font-size: 1rem;
                                font-weight: 700;
                                color: #1e293b;
                                margin-bottom: 0.375rem;
                            ">${startTime} at ${startTimeStr}</div>
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 1rem;
                                font-size: 0.875rem;
                                color: #64748b;
                            ">
                                <span style="display: flex; align-items: center; gap: 0.375rem;">
                                    <svg style="width: 14px; height: 14px; color: #2FA76E;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 3V21H21"/>
                                        <path d="M7 16L12 11L16 15L21 10"/>
                                    </svg>
                                    ${session.measurement_count || 0} records
                                </span>
                                <span style="display: flex; align-items: center; gap: 0.375rem;">
                                    <svg style="width: 14px; height: 14px; color: #4ECDC4;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 6V12L16 14"/>
                                    </svg>
                                    ${(session.total_pellets || 0).toLocaleString()} pellets
                                </span>
                            </div>
                        </div>
                        <div style="text-align: right; margin-left: 1.5rem; margin-right: 1rem;">
                            <div style="
                                font-size: 0.9375rem;
                                font-weight: 700;
                                color: #1e293b;
                                margin-bottom: 0.5rem;
                            ">${duration}</div>
                            <span style="
                                display: inline-block;
                                padding: 0.375rem 0.75rem;
                                border-radius: 0.5rem;
                                font-size: 0.75rem;
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 0.3px;
                                background: ${statusBg};
                                color: ${statusColor};
                                border: 1px solid ${statusColor}20;
                            ">${session.status || 'idle'}</span>
                        </div>
                        <div style="
                            width: 40px;
                            height: 40px;
                            border-radius: 10px;
                            background: linear-gradient(135deg, rgba(47, 167, 110, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-shrink: 0;
                            transition: all 0.2s ease;
                        ">
                            <svg style="width: 20px; height: 20px; color: #2FA76E; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 18l6-6-6-6"/>
                            </svg>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        content.innerHTML = `
            <!-- Enhanced Operator Profile Header -->
            <div style="
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border-radius: 1.25rem;
                padding: 2.5rem;
                margin-bottom: 2rem;
                position: relative;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            ">
                <!-- Decorative background elements -->
                <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; border-radius: 50%; background: rgba(47, 167, 110, 0.1);"></div>
                <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; border-radius: 50%; background: rgba(78, 205, 196, 0.1);"></div>
                
                <div style="display: flex; align-items: center; gap: 2rem; position: relative; z-index: 1;">
                    <div style="
                        width: 96px;
                        height: 96px;
                        border-radius: 20px;
                        background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 2.25rem;
                        font-weight: 700;
                        flex-shrink: 0;
                        box-shadow: 0 8px 24px rgba(47, 167, 110, 0.4);
                        border: 3px solid rgba(255, 255, 255, 0.2);
                    ">${(user.name || user.username || 'U').charAt(0).toUpperCase()}</div>
                    <div style="flex: 1; min-width: 0;">
                        <h2 style="margin: 0; font-size: 1.875rem; font-weight: 700; color: white; letter-spacing: -0.02em;">${user.name || user.username}</h2>
                        <p style="margin: 0.375rem 0 0 0; font-size: 1rem; color: rgba(255, 255, 255, 0.8); font-weight: 500;">@${user.username}</p>
                        ${user.location ? `
                        <div style="margin-top: 0.75rem; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(255, 255, 255, 0.15); border-radius: 0.75rem; backdrop-filter: blur(8px);">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: rgba(255, 255, 255, 0.9);">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span style="font-size: 0.875rem; color: white; font-weight: 500;">${user.location}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div style="text-align: right; padding: 1rem 1.5rem; background: rgba(255, 255, 255, 0.1); border-radius: 1rem; backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2);">
                        <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.375rem; font-weight: 600;">Member Since</div>
                        <div style="font-size: 1rem; font-weight: 700; color: white;">${user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}</div>
                    </div>
                </div>
            </div>

            <!-- User Details Section -->
            <div style="
                background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%);
                border-radius: 1.25rem;
                border: 1.5px solid rgba(47, 167, 110, 0.12);
                padding: 2rem;
                margin-bottom: 2rem;
                box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);
            ">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                    <div style="
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
                    ">
                        <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">User Information</h3>
                        <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b;">Contact details and account information</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;">
                    ${user.email ? `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(59, 130, 246, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width: 44px; height: 44px; background: rgba(59, 130, 246, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <svg style="width: 20px; height: 20px; color: #3b82f6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
                                <polyline points="22,6 12,13 2,6"/>
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Email</div>
                            <div style="font-size: 0.9375rem; font-weight: 600; color: #1e293b; word-break: break-word;">${user.email}</div>
                        </div>
                    </div>
                    ` : ''}
                    ${user.phone ? `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(16, 185, 129, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width: 44px; height: 44px; background: rgba(16, 185, 129, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <svg style="width: 20px; height: 20px; color: #10b981;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92V19.92C22 20.97 21.03 21.92 20 21.92C8.95 21.92 0 12.97 0 1.92C0 0.87 0.95 -0.08 2 -0.08H5C6.05 -0.08 7 0.87 7 1.92V4.92C7 5.97 6.05 6.92 5 6.92H3.5C4.4 9.82 6.18 11.6 9.08 12.5V11C9.08 9.95 10.03 9 11.08 9H14.08C15.13 9 16.08 9.95 16.08 11V13.92C16.08 14.97 17.03 15.92 18.08 15.92H21.08C22.13 15.92 23.08 16.87 23.08 17.92V20.92"/>
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Phone</div>
                            <div style="font-size: 0.9375rem; font-weight: 600; color: #1e293b;">${user.phone}</div>
                        </div>
                    </div>
                    ` : ''}
                    ${user.id_number || user.idNumber ? `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(139, 92, 246, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width: 44px; height: 44px; background: rgba(139, 92, 246, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <svg style="width: 20px; height: 20px; color: #8b5cf6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">ID Number</div>
                            <div style="font-size: 0.9375rem; font-weight: 600; color: #1e293b;">${user.id_number || user.idNumber || 'N/A'}</div>
                        </div>
                    </div>
                    ` : ''}
                    ${user.last_login || user.lastLogin ? `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(251, 191, 36, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(251, 191, 36, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width: 44px; height: 44px; background: rgba(251, 191, 36, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <svg style="width: 20px; height: 20px; color: #fbbf24;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12,6 12,12 16,14"/>
                            </svg>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Last Login</div>
                            <div style="font-size: 0.9375rem; font-weight: 600; color: #1e293b;">${user.last_login || user.lastLogin ? new Date(user.last_login || user.lastLogin).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Enhanced Key Performance Metrics -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2rem;">
                <div style="
                    background: linear-gradient(135deg, rgba(47, 167, 110, 0.08) 0%, rgba(47, 167, 110, 0.03) 100%);
                    padding: 1.75rem 1.5rem;
                    border-radius: 1rem;
                    border: 1.5px solid rgba(47, 167, 110, 0.15);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.2s ease;
                    box-shadow: 0 4px 12px rgba(47, 167, 110, 0.08);
                ">
                    <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; background: rgba(47, 167, 110, 0.1);"></div>
                    <div style="position: relative; z-index: 1;">
                        <div style="font-size: 2.25rem; font-weight: 700; color: #2FA76E; margin-bottom: 0.5rem; line-height: 1;">${totalRecords}</div>
                        <div style="font-size: 0.8125rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Records</div>
                    </div>
                </div>
                <div style="
                    background: linear-gradient(135deg, rgba(78, 205, 196, 0.08) 0%, rgba(78, 205, 196, 0.03) 100%);
                    padding: 1.75rem 1.5rem;
                    border-radius: 1rem;
                    border: 1.5px solid rgba(78, 205, 196, 0.15);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.08);
                ">
                    <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; background: rgba(78, 205, 196, 0.1);"></div>
                    <div style="position: relative; z-index: 1;">
                        <div style="font-size: 2.25rem; font-weight: 700; color: #4ECDC4; margin-bottom: 0.5rem; line-height: 1;">${completedSessionsCount}</div>
                        <div style="font-size: 0.8125rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Sessions</div>
                    </div>
                </div>
                <div style="
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.03) 100%);
                    padding: 1.75rem 1.5rem;
                    border-radius: 1rem;
                    border: 1.5px solid rgba(239, 68, 68, 0.15);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
                ">
                    <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; background: rgba(239, 68, 68, 0.1);"></div>
                    <div style="position: relative; z-index: 1;">
                        <div style="font-size: 2.25rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem; line-height: 1;">${totalPellets.toLocaleString()}</div>
                        <div style="font-size: 0.8125rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Pellets</div>
                    </div>
                </div>
                <div style="
                    background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.03) 100%);
                    padding: 1.75rem 1.5rem;
                    border-radius: 1rem;
                    border: 1.5px solid rgba(139, 92, 246, 0.15);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.08);
                ">
                    <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; background: rgba(139, 92, 246, 0.1);"></div>
                    <div style="position: relative; z-index: 1;">
                        <div style="font-size: 2.25rem; font-weight: 700; color: #8b5cf6; margin-bottom: 0.5rem; line-height: 1;">${avgSize}mm</div>
                        <div style="font-size: 0.8125rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Avg Size</div>
                    </div>
                </div>
            </div>

            <!-- Enhanced Detailed Statistics -->
            <div style="
                background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%);
                border-radius: 1.25rem;
                border: 1.5px solid rgba(47, 167, 110, 0.12);
                padding: 2rem;
                margin-bottom: 2rem;
                box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);
            ">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                    <div style="
                        width: 48px;
                        height: 48px;
                        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 12px rgba(251, 191, 36, 0.25);
                    ">
                        <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 20V10"/>
                            <path d="M12 20V4"/>
                            <path d="M6 20V14"/>
                        </svg>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">Performance Breakdown</h4>
                        <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b;">Detailed activity metrics and analytics</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(16, 185, 129, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: rgba(16, 185, 129, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <svg style="width: 20px; height: 20px; color: #10b981;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12,6 12,12 16,14"/>
                                </svg>
                            </div>
                            <span style="font-size: 0.875rem; color: #64748b; font-weight: 500;">Today's Records</span>
                        </div>
                        <span style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">${todayRecords}</span>
                    </div>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(59, 130, 246, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: rgba(59, 130, 246, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <svg style="width: 20px; height: 20px; color: #3b82f6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                            </div>
                            <span style="font-size: 0.875rem; color: #64748b; font-weight: 500;">This Week's Records</span>
                        </div>
                        <span style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">${weekRecords}</span>
                    </div>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(139, 92, 246, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <svg style="width: 20px; height: 20px; color: #8b5cf6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12,6 12,12 16,14"/>
                                </svg>
                            </div>
                            <span style="font-size: 0.875rem; color: #64748b; font-weight: 500;">Total Session Time</span>
                        </div>
                        <span style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">${totalTimeText}</span>
                    </div>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(239, 68, 68, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: rgba(239, 68, 68, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <svg style="width: 20px; height: 20px; color: #ef4444;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/>
                                </svg>
                            </div>
                            <span style="font-size: 0.875rem; color: #64748b; font-weight: 500;">Pellets Per Hour</span>
                        </div>
                        <span style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">${pelletsPerHour}</span>
                    </div>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(47, 167, 110, 0.06) 0%, rgba(47, 167, 110, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(47, 167, 110, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: rgba(47, 167, 110, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <svg style="width: 20px; height: 20px; color: #2FA76E;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 3V21H21"/>
                                    <path d="M7 16L12 11L16 15L21 10"/>
                                </svg>
                            </div>
                            <span style="font-size: 0.875rem; color: #64748b; font-weight: 500;">Records Per Hour</span>
                        </div>
                        <span style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">${recordsPerHour}</span>
                    </div>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(251, 191, 36, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(251, 191, 36, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: rgba(251, 191, 36, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <svg style="width: 20px; height: 20px; color: #fbbf24;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                                </svg>
                            </div>
                            <span style="font-size: 0.875rem; color: #64748b; font-weight: 500;">Avg Pellets/Session</span>
                        </div>
                        <span style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">${avgPelletsPerSession}</span>
                    </div>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(236, 72, 153, 0.06) 0%, rgba(236, 72, 153, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(236, 72, 153, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: rgba(236, 72, 153, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <svg style="width: 20px; height: 20px; color: #ec4899;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 3V21H21"/>
                                    <path d="M7 16L12 11L16 15L21 10"/>
                                </svg>
                            </div>
                            <span style="font-size: 0.875rem; color: #64748b; font-weight: 500;">Avg Records/Session</span>
                        </div>
                        <span style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">${avgRecordsPerSession}</span>
                    </div>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.25rem 1.5rem;
                        background: linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(14, 165, 233, 0.02) 100%);
                        border-radius: 0.75rem;
                        border: 1px solid rgba(14, 165, 233, 0.12);
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 40px; height: 40px; background: rgba(14, 165, 233, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                <svg style="width: 20px; height: 20px; color: #0ea5e9;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 9L12 15L18 9"/>
                                    <path d="M18 15L12 9L6 15"/>
                                </svg>
                            </div>
                            <span style="font-size: 0.875rem; color: #64748b; font-weight: 500;">Size Range</span>
                        </div>
                        <span style="font-size: 1.125rem; font-weight: 700; color: #1e293b;">${minSize} - ${maxSize}mm</span>
                    </div>
                </div>
            </div>
            
            <!-- Enhanced Sessions List -->
            <div>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid rgba(47, 167, 110, 0.08);
                ">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="
                            width: 48px;
                            height: 48px;
                            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                            border-radius: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
                        ">
                            <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8L14 2Z"/>
                                <path d="M14 2V8H19"/>
                                <path d="M16 13H8"/>
                                <path d="M16 17H8"/>
                            </svg>
                        </div>
                        <div>
                            <h4 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">Session History</h4>
                            <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b;">Click any session to view detailed analytics</p>
                        </div>
                    </div>
                    <span style="
                        font-size: 0.875rem;
                        color: white;
                        background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%);
                        padding: 0.5rem 1rem;
                        border-radius: 1rem;
                        font-weight: 600;
                        box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25);
                    ">${userSessions.length} total</span>
                </div>
                <div style="
                    max-height: 450px;
                    overflow-y: auto;
                    border: 1.5px solid rgba(47, 167, 110, 0.12);
                    border-radius: 1rem;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%);
                    box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);
                ">
                    ${sessionsHtml}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Failed to load user details:', error);
        alert('Failed to load user details');
    }
}

// Show session details modal
let sessionDetailsModal = null;

async function showUserSessionDetails(sessionId) {
    try {
        // Fetch session data from database
        const sessionResponse = await apiRequest(API_CONFIG.ENDPOINTS.SESSION_BY_ID(sessionId));
        const session = sessionResponse.session;
        
        if (!session) {
            showNotification('Session not found', 'error');
            return;
        }
        
        // Get records for this session from database
        const recordsResponse = await apiRequest(API_CONFIG.ENDPOINTS.SESSION_RECORDS(sessionId));
        const measurements = recordsResponse.records || [];
        
        // Calculate statistics from database data
        const totalPellets = measurements.reduce((sum, m) => sum + (parseInt(m.total_pellets) || 0), 0);
        const avgSize = measurements.length > 0
            ? (measurements.reduce((sum, m) => sum + parseFloat(m.avg_size || 0), 0) / measurements.length).toFixed(2)
            : '0.00';
        
        const startTime = new Date(session.start_time).toLocaleString();
        const endTime = session.end_time ? new Date(session.end_time).toLocaleString() : 'In Progress';
        
        // Calculate duration from database timestamps
        const durationSeconds = session.duration_seconds || (session.end_time && session.start_time 
            ? Math.floor((new Date(session.end_time) - new Date(session.start_time)) / 1000)
            : 0);
        
        // Remove existing modal if present
        const existingModal = document.getElementById('sessionDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Calculate additional stats
        const allSizes = measurements.map(m => parseFloat(m.avg_size || 0)).filter(s => s > 0);
        const minSize = allSizes.length > 0 ? Math.min(...allSizes).toFixed(2) : '0.00';
        const maxSize = allSizes.length > 0 ? Math.max(...allSizes).toFixed(2) : '0.00';
        const sizeRange = allSizes.length > 0 ? (parseFloat(maxSize) - parseFloat(minSize)).toFixed(2) : '0.00';
        
        // Calculate session performance metrics
        const durationMinutes = durationSeconds > 0 ? durationSeconds / 60 : 0;
        const measurementFrequency = durationMinutes > 0 && measurements.length > 0
            ? (measurements.length / durationMinutes).toFixed(2)
            : '0.00';
        const avgTimePerMeasurement = measurements.length > 0 && durationSeconds > 0
            ? Math.round((durationSeconds / measurements.length) * 10) / 10
            : 0;
        const efficiency = durationMinutes > 0 && totalPellets > 0
            ? Math.round((totalPellets / durationMinutes) * 10) / 10
            : 0;
        
        // Quality breakdown
        const qualityBreakdown = { excellent: 0, good: 0, fair: 0, poor: 0 };
        measurements.forEach(m => {
            const r = (m.quality_rating || '').toLowerCase();
            if (r === 'excellent') qualityBreakdown.excellent++;
            else if (r === 'good') qualityBreakdown.good++;
            else if (r === 'fair') qualityBreakdown.fair++;
            else if (r === 'poor') qualityBreakdown.poor++;
        });
        
        // Calculate quality analysis scores
        const totalMeasurements = measurements.length;
        const compliantCount = measurements.filter(m => {
            const size = parseFloat(m.avg_size || 0);
            return size >= 8 && size <= 12;
        }).length;
        const sizeCompliance = totalMeasurements > 0 ? Math.round((compliantCount / totalMeasurements) * 100) : 0;
        
        const sizes = measurements.map(m => parseFloat(m.avg_size || 0)).filter(s => s > 0);
        let consistencyScore = 100;
        let stdDev = 0;
        if (sizes.length > 1) {
            const avgSizeCalc = sizes.reduce((a, b) => a + b, 0) / sizes.length;
            const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSizeCalc, 2), 0) / sizes.length;
            stdDev = Math.sqrt(variance);
            consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / 3) * 100));
        }
        
        const optimalSizeScore = sizes.length > 0 ? (() => {
            const avgSizeCalc = sizes.reduce((a, b) => a + b, 0) / sizes.length;
            const targetSize = 10;
            const deviation = Math.abs(avgSizeCalc - targetSize);
            return Math.max(0, Math.min(100, 100 - (deviation / 5) * 100));
        })() : 0;
        
        const completenessScore = Math.min(100, (totalMeasurements / 15) * 100);
        
        // Session status
        const isCompleted = session.status === 'completed';
        const statusText = isCompleted ? 'Completed' : (session.status === 'active' ? 'Active' : 'In Progress');
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'sessionDetailsModal';
        modal.style.display = 'block';
        
        // Build modal HTML with enhanced professional styling
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 960px; border-radius: 1rem; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                <!-- Header with gradient -->
                <div style="
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    padding: 1.75rem 2rem;
                    position: relative;
                    overflow: hidden;
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
                                <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: white; letter-spacing: -0.02em;">Session #${session.id}</h2>
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
                
                <div style="padding: 2rem; background: #f8fafc;">
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
                                <div style="font-size: 0.9375rem; font-weight: 600; color: #1e293b;">${durationSeconds > 0 ? formatDuration(durationSeconds) : 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Session Timeline Section -->
                    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">Session Timeline</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b;">Start, end, and performance metrics</p>
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
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Started</p>
                                        <p style="margin: 0; font-size: 0.875rem; color: #1e293b; font-weight: 500; word-break: break-word;">${startTime}</p>
                                    </div>
                                </div>
                            </div>
                            ${session.end_time ? `
                            <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%); border: 1px solid rgba(239, 68, 68, 0.12); border-radius: 1rem; padding: 1.25rem;">
                                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                                    <div style="width: 36px; height: 36px; background: rgba(239, 68, 68, 0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        <svg style="width: 18px; height: 18px; stroke: #ef4444; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                    <div style="flex: 1; min-width: 0;">
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Ended</p>
                                        <p style="margin: 0; font-size: 0.875rem; color: #1e293b; font-weight: 500; word-break: break-word;">${endTime}</p>
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
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Status</p>
                                        <p style="margin: 0; font-size: 0.875rem; color: #1e293b; font-weight: 500;">${statusText}</p>
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
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Avg Time/Measurement</p>
                                        <p style="margin: 0; font-size: 0.875rem; color: #1e293b; font-weight: 500;">${avgTimePerMeasurement}s</p>
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
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Measurement Frequency</p>
                                        <p style="margin: 0; font-size: 0.875rem; color: #1e293b; font-weight: 500;">${measurementFrequency} per min</p>
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
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Size Range</p>
                                        <p style="margin: 0; font-size: 0.875rem; color: #1e293b; font-weight: 500;">${sizeRange} mm</p>
                                    </div>
                                </div>
                            </div>
                            ` : '<div></div>'}
                        </div>
                    </div>
                    
                    <!-- Measurement Statistics -->
                    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.25);">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 3V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">Measurement Statistics</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b;">Size analysis and metrics</p>
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
                                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: #1e293b;">${avgSize} mm</h4>
                                <p style="margin: 0; font-size: 0.8125rem; color: #64748b; font-weight: 600;">Average Size</p>
                            </div>
                            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.02) 100%); border: 1px solid rgba(16, 185, 129, 0.12); border-radius: 1rem; padding: 1.5rem; text-align: center;">
                                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
                                    <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: #1e293b;">${minSize} mm</h4>
                                <p style="margin: 0; font-size: 0.8125rem; color: #64748b; font-weight: 600;">Minimum Size</p>
                            </div>
                            <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%); border: 1px solid rgba(239, 68, 68, 0.12); border-radius: 1rem; padding: 1.5rem; text-align: center;">
                                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);">
                                    <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: #1e293b;">${maxSize} mm</h4>
                                <p style="margin: 0; font-size: 0.8125rem; color: #64748b; font-weight: 600;">Maximum Size</p>
                            </div>
                            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%); border: 1px solid rgba(139, 92, 246, 0.12); border-radius: 1rem; padding: 1.5rem; text-align: center;">
                                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);">
                                    <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </div>
                                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: #1e293b;">${sizeRange} mm</h4>
                                <p style="margin: 0; font-size: 0.8125rem; color: #64748b; font-weight: 600;">Size Range</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Statistics Cards -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="background: white; border-radius: 0.75rem; padding: 1.25rem; border: 1px solid #e2e8f0; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: 700; color: #2FA76E; line-height: 1.2;">${measurements.length}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; margin-top: 0.25rem;">Measurements</div>
                        </div>
                        <div style="background: white; border-radius: 0.75rem; padding: 1.25rem; border: 1px solid #e2e8f0; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: 700; color: #4ECDC4; line-height: 1.2;">${totalPellets.toLocaleString()}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; margin-top: 0.25rem;">Total Pellets</div>
                        </div>
                        <div style="background: white; border-radius: 0.75rem; padding: 1.25rem; border: 1px solid #e2e8f0; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: 700; color: #8b5cf6; line-height: 1.2;">${avgSize}<span style="font-size: 0.875rem; font-weight: 500;">mm</span></div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; margin-top: 0.25rem;">Avg Size</div>
                        </div>
                        <div style="background: white; border-radius: 0.75rem; padding: 1.25rem; border: 1px solid #e2e8f0; text-align: center;">
                            <div style="font-size: 1.75rem; font-weight: 700; color: #f59e0b; line-height: 1.2;">${minSize}-${maxSize}</div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 500; margin-top: 0.25rem;">Size Range (mm)</div>
                        </div>
                    </div>
                    
                    <!-- Quality Breakdown -->
                    ${measurements.length > 0 ? `
                    <div style="background: white; border-radius: 0.75rem; padding: 1rem 1.5rem; border: 1px solid #e2e8f0; margin-bottom: 1.5rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="font-size: 0.8125rem; font-weight: 600; color: #1e293b;">Quality Distribution</div>
                            <div style="display: flex; align-items: center; gap: 1.25rem;">
                                <div style="display: flex; align-items: center; gap: 0.375rem;">
                                    <span style="width: 10px; height: 10px; border-radius: 2px; background: #10b981;"></span>
                                    <span style="font-size: 0.75rem; color: #64748b;">${qualityBreakdown.excellent} Excellent</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.375rem;">
                                    <span style="width: 10px; height: 10px; border-radius: 2px; background: #3b82f6;"></span>
                                    <span style="font-size: 0.75rem; color: #64748b;">${qualityBreakdown.good} Good</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.375rem;">
                                    <span style="width: 10px; height: 10px; border-radius: 2px; background: #f59e0b;"></span>
                                    <span style="font-size: 0.75rem; color: #64748b;">${qualityBreakdown.fair} Fair</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.375rem;">
                                    <span style="width: 10px; height: 10px; border-radius: 2px; background: #ef4444;"></span>
                                    <span style="font-size: 0.75rem; color: #64748b;">${qualityBreakdown.poor} Poor</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Quality Analysis Section -->
                    ${measurements.length > 0 ? `
                    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06);">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.75rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.25); flex-shrink: 0;">
                                <svg style="width: 24px; height: 24px; stroke: white; fill: none;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div style="flex: 1; min-width: 0;">
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; line-height: 1.3;">Quality Analysis</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b; line-height: 1.4;">Detailed quality score breakdown</p>
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
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Size Compliance</p>
                                        <p style="margin: 0; font-size: 1.125rem; color: #1e293b; font-weight: 700; line-height: 1.2;">${sizeCompliance}%</p>
                                        <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #64748b; line-height: 1.3;">${compliantCount} of ${totalMeasurements} pellet measurements</p>
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
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Consistency</p>
                                        <p style="margin: 0; font-size: 1.125rem; color: #1e293b; font-weight: 700; line-height: 1.2;">${Math.round(consistencyScore)}%</p>
                                        <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #64748b; line-height: 1.3;">Std Dev: ${stdDev.toFixed(2)}mm</p>
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
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Optimal Targeting</p>
                                        <p style="margin: 0; font-size: 1.125rem; color: #1e293b; font-weight: 700; line-height: 1.2;">${Math.round(optimalSizeScore)}%</p>
                                        <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #64748b; line-height: 1.3;">Target: 10mm</p>
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
                                        <p style="margin: 0 0 0.25rem 0; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">Completeness</p>
                                        <p style="margin: 0; font-size: 1.125rem; color: #1e293b; font-weight: 700; line-height: 1.2;">${Math.round(completenessScore)}%</p>
                                        <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; color: #64748b; line-height: 1.3;">${totalMeasurements} pellet measurements</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Charts Section -->
                    ${measurements.length > 0 ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
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
                                <div id="adminSessionDistributionChart-${session.id}" style="width: 100%; height: 100%;"></div>
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
                                <div id="adminSessionTrendsChart-${session.id}" style="width: 100%; height: 100%;"></div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Measurements Table -->
                    ${measurements.length > 0 ? `
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
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">All Pellet Measurements</h3>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.8125rem; color: #64748b;">Complete measurement records (${measurements.length} total)</p>
                            </div>
                        </div>
                        <div style="overflow-x: auto; max-height: 400px; overflow-y: auto; position: relative;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead style="position: sticky; top: 0; z-index: 20; background: linear-gradient(135deg, rgba(47, 167, 110, 0.12) 0%, rgba(47, 167, 110, 0.08) 100%); backdrop-filter: blur(8px);">
                                    <tr style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.12) 0%, rgba(47, 167, 110, 0.08) 100%); border-bottom: 2px solid rgba(47, 167, 110, 0.15);">
                                        <th style="padding: 1rem; text-align: left; font-size: 0.8125rem; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Time</th>
                                        <th style="padding: 1rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Count</th>
                                        <th style="padding: 1rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Avg Size</th>
                                        <th style="padding: 1rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Min Size</th>
                                        <th style="padding: 1rem; text-align: center; font-size: 0.8125rem; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; background: transparent;">Max Size</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${measurements.map((m, idx) => `
                                        <tr style="border-bottom: 1px solid rgba(47, 167, 110, 0.08); transition: background 0.15s ease;" onmouseover="this.style.background='rgba(47, 167, 110, 0.03)'" onmouseout="this.style.background='transparent'">
                                            <td style="padding: 1rem; font-size: 0.875rem; color: #1e293b; font-weight: 500;">${new Date(m.timestamp).toLocaleTimeString()}</td>
                                            <td style="padding: 1rem; text-align: center; font-size: 0.875rem; font-weight: 600; color: #2FA76E;">${(parseInt(m.total_pellets) || 0).toLocaleString()}</td>
                                            <td style="padding: 1rem; text-align: center; font-size: 0.875rem; color: #1e293b; font-weight: 500;">${parseFloat(m.avg_size || 0).toFixed(2)} mm</td>
                                            <td style="padding: 1rem; text-align: center; font-size: 0.875rem; color: #1e293b; font-weight: 500;">${parseFloat(m.min_size || 0).toFixed(2)} mm</td>
                                            <td style="padding: 1rem; text-align: center; font-size: 0.875rem; color: #1e293b; font-weight: 500;">${parseFloat(m.max_size || 0).toFixed(2)} mm</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ` : `
                    <div style="background: white; border-radius: 0.75rem; border: 1px solid #e2e8f0; padding: 3rem 2rem; text-align: center;">
                        <svg style="width: 48px; height: 48px; color: #cbd5e1; margin: 0 auto 1rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                            <path d="M2 17L12 22L22 17"/>
                            <path d="M2 12L12 17L22 12"/>
                        </svg>
                        <p style="margin: 0; font-size: 0.9375rem; color: #64748b; font-weight: 500;">No measurements recorded for this session.</p>
                    </div>
                    `}
                </div>
                
                <!-- Footer -->
                <div style="padding: 1.25rem 2rem; background: white; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;">
                    <button onclick="closeSessionDetailsModal()" style="
                        padding: 0.75rem 1.75rem;
                        border-radius: 0.5rem;
                        border: 1px solid #e2e8f0;
                        background: white;
                        color: #1e293b;
                        font-size: 0.875rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#2FA76E'" onmouseout="this.style.background='white'; this.style.borderColor='#e2e8f0'">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Force modal to be visible and positioned correctly
        setTimeout(() => {
            modal.style.cssText = 'display: flex !important; position: fixed !important; z-index: 9999 !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; align-items: center !important; justify-content: center !important; background: rgba(0, 0, 0, 0.6) !important; overflow: auto !important;';
            
            // Also ensure modal content is visible
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.cssText = 'max-width: 1200px !important; width: 95% !important; max-height: 90vh !important; margin: auto !important; position: relative !important; background: white !important; border-radius: 1.25rem !important; overflow-y: auto !important; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;';
            }
            
            // Initialize charts if ApexCharts is available and session has measurements
            if (measurements.length > 0) {
                setTimeout(() => {
                    initializeAdminSessionCharts(session, measurements);
                }, 300);
            }
        }, 100);
        
        modal.onclick = function(event) {
            if (event.target === modal) {
                closeSessionDetailsModal();
            }
        };
        
        sessionDetailsModal = modal;
    } catch (error) {
        console.error('Failed to load session details:', error);
        showNotification('Failed to load session details', 'error');
    }
}

// Initialize charts for admin session details
function initializeAdminSessionCharts(session, measurements) {
    // Wait for ApexCharts to be available
    if (typeof ApexCharts === 'undefined') {
        setTimeout(() => initializeAdminSessionCharts(session, measurements), 100);
        return;
    }
    
    // Distribution Chart
    const distCanvas = document.getElementById(`adminSessionDistributionChart-${session.id}`);
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
    const trendsCanvas = document.getElementById(`adminSessionTrendsChart-${session.id}`);
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
        
        const options = {
            series: [
                {
                    name: 'Average Size',
                    data: avgSizes
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
            colors: ['#2FA76E'],
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

// Helper function to get quality color styling
function getQualityColor(rating) {
    const r = (rating || '').toLowerCase();
    if (r === 'excellent') return { bg: '#ecfdf5', text: '#059669' };
    if (r === 'good') return { bg: '#eff6ff', text: '#3b82f6' };
    if (r === 'fair') return { bg: '#fffbeb', text: '#d97706' };
    if (r === 'poor') return { bg: '#fef2f2', text: '#dc2626' };
    return { bg: '#f1f5f9', text: '#64748b' };
}

// Close session details modal
function closeSessionDetailsModal() {
    const modal = document.getElementById('sessionDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Expose functions globally
window.showUserDetails = showUserDetails;
window.showUserSessionDetails = showUserSessionDetails;
window.closeSessionDetailsModal = closeSessionDetailsModal;

// Close user details modal
function closeUserDetailsModal() {
    const modal = document.getElementById('userDetailsModal');
    if (modal) {
        modal.style.display = 'none';
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

// Chart instances for analytics overview
let recordsSummaryChart = null;
let sizeDistributionSummaryChart = null;
let avgSizeTrendSummaryChart = null;
let userActivitySummaryChart = null;

// Get quality breakdown from records
async function getQualityBreakdown() {
    try {
        // Fetch all records to calculate quality breakdown
        const recordsResponse = await apiRequest(API_CONFIG.ENDPOINTS.RECORDS);
        const records = recordsResponse.records || recordsResponse.data || [];
        
        const breakdown = {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0,
            total: records.length
        };
        
        records.forEach(record => {
            const rating = (record.quality_rating || '').toLowerCase();
            if (rating === 'excellent') breakdown.excellent++;
            else if (rating === 'good') breakdown.good++;
            else if (rating === 'fair') breakdown.fair++;
            else if (rating === 'poor') breakdown.poor++;
        });
        
        return breakdown;
    } catch (error) {
        console.error('Failed to get quality breakdown:', error);
        return { excellent: 0, good: 0, fair: 0, poor: 0, total: 0 };
    }
}

// Load all users data summary from database
async function loadAllUsersDataSummary() {
    const summaryContainer = document.getElementById('allUsersDataSummary');
    if (!summaryContainer) return;
    
    try {
        // Get dashboard stats from API
        const statsResponse = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD_STATS);
        const usersResponse = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_USERS_STATS);
        
        if (!statsResponse || !statsResponse.success) {
            summaryContainer.innerHTML = '<p class="no-data">Failed to load data summary</p>';
            return;
        }
        
        const stats = statsResponse.stats;
        const operators = (usersResponse.users || []).filter(u => u.role === 'user');
        
        // Calculate completion rate
        const completedSessions = operators.reduce((sum, op) => sum + (op.stats?.completedSessions || 0), 0);
        const completionRate = stats.sessions.total > 0 ? ((completedSessions / stats.sessions.total) * 100).toFixed(1) : '0.0';
        
        // Calculate average pellets per session
        const avgPelletsPerSession = stats.sessions.total > 0 ? (stats.measurements.total_pellets / stats.sessions.total).toFixed(0) : '0';
        
        // Calculate average records per session
        const avgRecordsPerSession = stats.sessions.total > 0 ? (stats.records.total / stats.sessions.total).toFixed(1) : '0.0';
        
        // Get quality ratings breakdown from records (we'll fetch this separately)
        const qualityBreakdown = await getQualityBreakdown();
        
        // Create stat card helper function
        function createStatCard(value, label, subtext, iconPath, color, bgColor) {
            return `
                <div style="
                    background: white;
                    border-radius: 0.875rem;
                    padding: 1.25rem 1.5rem;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: all 0.2s ease;
                " onmouseover="this.style.borderColor='${color}'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.06)'" onmouseout="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'">
                    <div style="
                        width: 48px;
                        height: 48px;
                        border-radius: 12px;
                        background: ${bgColor};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    ">
                        <svg style="width: 22px; height: 22px; color: ${color};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            ${iconPath}
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${value}</div>
                        <div style="font-size: 0.8125rem; color: #64748b; font-weight: 500; margin-top: 0.125rem;">${label}</div>
                        ${subtext ? `<div style="font-size: 0.6875rem; color: #94a3b8; margin-top: 0.25rem;">${subtext}</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        summaryContainer.innerHTML = `
            ${createStatCard(
                stats.records.total.toLocaleString(),
                'Total Records',
                `${stats.records.today} today · ${avgRecordsPerSession} avg/session`,
                '<path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8L14 2Z"/><path d="M14 2V8H19"/><path d="M16 13H8"/><path d="M16 17H8"/>',
                '#2FA76E',
                'rgba(47, 167, 110, 0.1)'
            )}
            ${createStatCard(
                stats.sessions.total.toLocaleString(),
                'Total Sessions',
                `${stats.sessions.active} active · ${completionRate}% completed`,
                '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
                '#4ECDC4',
                'rgba(78, 205, 196, 0.1)'
            )}
            ${createStatCard(
                stats.measurements.total_pellets.toLocaleString(),
                'Total Pellets',
                `${stats.measurements.today_pellets.toLocaleString()} today · ${avgPelletsPerSession} avg/session`,
                '<circle cx="12" cy="12" r="3"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="12" cy="18" r="2"/>',
                '#FF6B6B',
                'rgba(255, 107, 107, 0.1)'
            )}
            ${createStatCard(
                stats.measurements.avg_size.toFixed(2) + 'mm',
                'Average Size',
                `Range: ${stats.measurements.min_size.toFixed(2)} - ${stats.measurements.max_size.toFixed(2)}mm`,
                '<path d="M21 3H3"/><path d="M21 21H3"/><path d="M12 3V21"/>',
                '#8b5cf6',
                'rgba(139, 92, 246, 0.1)'
            )}
            ${createStatCard(
                operators.length.toString(),
                'Active Operators',
                `${stats.users.admins} admins in system`,
                '<path d="M17 21V19C17 16.791 15.209 15 13 15H5C2.791 15 1 16.791 1 19V21"/><circle cx="9" cy="7" r="4"/><path d="M23 21V19C23 17.139 21.807 15.52 20.169 15"/><path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232"/>',
                '#ec4899',
                'rgba(236, 72, 153, 0.1)'
            )}
            ${createStatCard(
                completionRate + '%',
                'Completion Rate',
                `${completedSessions} of ${stats.sessions.total} sessions`,
                '<path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818"/><path d="M22 4L12 14.01L9 11.01"/>',
                '#3b82f6',
                'rgba(59, 130, 246, 0.1)'
            )}
            ${createStatCard(
                (stats.sensors?.total || 0).toString(),
                'Total Sensors',
                `${stats.sensors?.online || 0} online · ${stats.sensors?.offline || 0} offline`,
                '<path d="M12 2L2 7L12 12L22 7L12 2Z"/><path d="M2 17L12 22L22 17"/><path d="M2 12L12 17L22 12"/>',
                '#f59e0b',
                'rgba(245, 158, 11, 0.1)'
            )}
            ${createStatCard(
                (qualityBreakdown.excellent || 0).toString(),
                'Excellent Quality',
                `${qualityBreakdown.good || 0} good · ${qualityBreakdown.fair || 0} fair`,
                '<path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839"/><path d="M8 2.83C5.51472 3.72976 3.72976 5.51472 2.83 8"/>',
                '#10b981',
                'rgba(16, 185, 129, 0.1)'
            )}
        `;
        
        // Initialize charts after DOM is updated
        setTimeout(() => {
            initializeAnalyticsCharts();
        }, 100);
    } catch (error) {
        console.error('Failed to load data summary:', error);
        summaryContainer.innerHTML = '<p class="no-data">Error loading data summary</p>';
    }
}

// Initialize analytics charts with database data - Session focused
async function initializeAnalyticsCharts() {
    if (typeof ApexCharts === 'undefined') {
        setTimeout(initializeAnalyticsCharts, 100);
        return;
    }

    try {
        // Load chart data from API
        const chartData = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_CHARTS + '?days=7');
        const sessionsResponse = await apiRequest(API_CONFIG.ENDPOINTS.SESSIONS);
        
        if (!chartData || !chartData.success || !chartData.charts) {
            console.error('Failed to load chart data:', chartData);
            return;
        }

        const sessions = sessionsResponse.sessions || [];

        // Initialize Session Duration Chart
        initializeSessionDurationChart(sessions);
        
        // Initialize Session Productivity Chart
        initializeSessionProductivityChart(sessions);
        
        // Initialize Session Status Chart
        initializeSessionStatusChart(sessions);
        
        // Initialize User Activity Chart
        initializeUserActivitySummaryChart(chartData.charts);

        console.log('Analytics charts initialized successfully');
    } catch (error) {
        console.error('Failed to initialize analytics charts:', error);
    }
}

// Session Duration Analysis Chart
let sessionDurationChart = null;
function initializeSessionDurationChart(sessions) {
    const ctx = document.getElementById('sessionDurationChart');
    if (!ctx) return;

    if (sessionDurationChart) {
        try { sessionDurationChart.destroy(); } catch (e) {}
    }

    // Get last 10 completed sessions
    const completedSessions = sessions
        .filter(s => s.status === 'completed' && s.duration_seconds)
        .slice(0, 10)
        .reverse();

    const sessionLabels = completedSessions.map(s => `#${s.id}`);
    const durations = completedSessions.map(s => {
        const mins = Math.round((s.duration_seconds || 0) / 60);
        return mins;
    });

    const options = {
        series: [{ name: 'Duration (min)', data: durations }],
        chart: {
            type: 'bar',
            height: 350,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: { show: true, tools: { download: true, zoom: true, pan: true, reset: true } },
            animations: { enabled: true, speed: 800, easing: 'easeinout' }
        },
        colors: ['#8b5cf6'],
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '60%',
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function(val) { return val + 'm'; },
            offsetY: -20,
            style: { fontSize: '11px', colors: ['#64748b'] }
        },
        xaxis: {
            categories: sessionLabels,
            labels: { style: { colors: '#64748b', fontSize: '12px', fontWeight: 500 } },
            title: { text: 'Session', style: { color: '#64748b', fontSize: '13px', fontWeight: 600 } }
        },
        yaxis: {
            labels: { style: { colors: '#64748b', fontSize: '12px', fontWeight: 500 } },
            title: { text: 'Duration (minutes)', style: { color: '#64748b', fontSize: '13px', fontWeight: 600 } }
        },
        legend: { position: 'top', horizontalAlign: 'center', fontSize: '13px', fontWeight: 600 },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
        tooltip: { theme: 'light', y: { formatter: function(val) { return val + ' minutes'; } } }
    };

    sessionDurationChart = new ApexCharts(ctx, options);
    sessionDurationChart.render();
}

// Session Productivity Chart
let sessionProductivityChart = null;
function initializeSessionProductivityChart(sessions) {
    const ctx = document.getElementById('sessionProductivityChart');
    if (!ctx) return;

    if (sessionProductivityChart) {
        try { sessionProductivityChart.destroy(); } catch (e) {}
    }

    // Get last 10 completed sessions with pellets data
    const completedSessions = sessions
        .filter(s => s.status === 'completed')
        .slice(0, 10)
        .reverse();

    const sessionLabels = completedSessions.map(s => `#${s.id}`);
    const pelletCounts = completedSessions.map(s => s.total_pellets || 0);
    const recordCounts = completedSessions.map(s => s.measurement_count || 0);

    const options = {
        series: [
            { name: 'Pellets', data: pelletCounts },
            { name: 'Records', data: recordCounts }
        ],
        chart: {
            type: 'area',
            height: 350,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: { show: true, tools: { download: true, zoom: true, pan: true, reset: true } },
            animations: { enabled: true, speed: 800, easing: 'easeinout' }
        },
        colors: ['#2FA76E', '#FF6B6B'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 }
        },
        xaxis: {
            categories: sessionLabels,
            labels: { style: { colors: '#64748b', fontSize: '12px', fontWeight: 500 } },
            title: { text: 'Session', style: { color: '#64748b', fontSize: '13px', fontWeight: 600 } }
        },
        yaxis: [
            {
                seriesName: 'Pellets',
                labels: { style: { colors: '#2FA76E', fontSize: '12px', fontWeight: 500 } },
                title: { text: 'Pellets', style: { color: '#2FA76E', fontSize: '13px', fontWeight: 600 } }
            },
            {
                seriesName: 'Records',
                opposite: true,
                labels: { style: { colors: '#FF6B6B', fontSize: '12px', fontWeight: 500 } },
                title: { text: 'Records', style: { color: '#FF6B6B', fontSize: '13px', fontWeight: 600 } }
            }
        ],
        legend: { position: 'top', horizontalAlign: 'center', fontSize: '13px', fontWeight: 600, itemMargin: { horizontal: 15, vertical: 8 } },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
        tooltip: { theme: 'light', shared: true, intersect: false }
    };

    sessionProductivityChart = new ApexCharts(ctx, options);
    sessionProductivityChart.render();
}

// Session Status Overview Chart
let sessionStatusChart = null;
function initializeSessionStatusChart(sessions) {
    const ctx = document.getElementById('sessionStatusChart');
    if (!ctx) return;

    if (sessionStatusChart) {
        try { sessionStatusChart.destroy(); } catch (e) {}
    }

    // Count sessions by status
    const statusCounts = {
        completed: sessions.filter(s => s.status === 'completed').length,
        active: sessions.filter(s => s.status === 'active').length,
        idle: sessions.filter(s => s.status === 'idle' || !s.status).length
    };

    const options = {
        series: [statusCounts.completed, statusCounts.active, statusCounts.idle],
        chart: {
            type: 'donut',
            height: 350,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            animations: { enabled: true, speed: 800, easing: 'easeinout' }
        },
        labels: ['Completed', 'Active', 'Idle'],
        colors: ['#10b981', '#3b82f6', '#94a3b8'],
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        name: { show: true, fontSize: '14px', fontWeight: 600 },
                        value: { show: true, fontSize: '24px', fontWeight: 700 },
                        total: {
                            show: true,
                            label: 'Total Sessions',
                            fontSize: '14px',
                            fontWeight: 500,
                            formatter: function(w) { return w.globals.seriesTotals.reduce((a, b) => a + b, 0); }
                        }
                    }
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function(val, opts) {
                return opts.w.config.series[opts.seriesIndex];
            },
            style: { fontSize: '14px', fontWeight: 600 }
        },
        legend: { position: 'bottom', horizontalAlign: 'center', fontSize: '13px', fontWeight: 600, itemMargin: { horizontal: 10, vertical: 5 } },
        tooltip: { theme: 'light', y: { formatter: function(val) { return val + ' sessions'; } } }
    };

    sessionStatusChart = new ApexCharts(ctx, options);
    sessionStatusChart.render();
}

// User activity chart for analytics
function initializeUserActivitySummaryChart(chartData) {
    const ctx = document.getElementById('userActivitySummaryChart');
    if (!ctx) return;

    if (userActivitySummaryChart) {
        try {
            userActivitySummaryChart.destroy();
        } catch (e) {}
    }

    const userActivity = chartData.userActivity || [];

    if (!userActivity || userActivity.length === 0) {
        ctx.innerHTML = '<p style="text-align: center; padding: 2rem; color: #64748b;">No user activity data</p>';
        return;
    }

    const labels = userActivity.map(u => {
        const name = u.name || u.operator || 'Unknown';
        return name.length > 15 ? name.substring(0, 15) + '...' : name;
    });
    const data = userActivity.map(u => {
        const count = parseInt(u.session_count);
        return isNaN(count) ? 0 : count;
    });
    const solidColors = [
        '#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b',
        '#ef4444', '#ec4899', '#14b8a6', '#a855f7', '#3b82f6'
    ];
    const chartColors = data.map((_, i) => solidColors[i % solidColors.length]);

    const options = {
        series: [{ name: 'Sessions', data: data }],
        chart: {
            type: 'bar',
            height: 350,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                }
            }
        },
        colors: chartColors,
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '60%',
                distributed: true
            }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: labels,
            labels: {
                rotate: -45,
                style: { colors: '#64748b', fontSize: '12px', fontWeight: 500 }
            },
            title: { text: 'User', style: { color: '#64748b', fontSize: '13px', fontWeight: 600 } }
        },
        yaxis: {
            labels: { style: { colors: '#64748b', fontSize: '12px', fontWeight: 500 } },
            title: { text: 'Sessions', style: { color: '#64748b', fontSize: '13px', fontWeight: 600 } }
        },
        legend: { show: false },
        grid: {
            borderColor: '#e2e8f0',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
            padding: { top: 10, right: 10, bottom: 10, left: 10 }
        },
        tooltip: {
            theme: 'light',
            style: { fontSize: '12px' },
            y: { formatter: function(val) { return val; } }
        }
    };

    userActivitySummaryChart = new ApexCharts(ctx, options);
    userActivitySummaryChart.render();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-records.html')) {
        // Load data when page is ready
        setTimeout(() => {
            if (typeof loadUserProfiles === 'function') {
                loadUserProfiles();
            }
            if (typeof loadAllUsersDataSummary === 'function') {
                loadAllUsersDataSummary();
            }
        }, 200);
    }
});

// Show notification helper
function showNotification(message, type = 'info') {
    // Check if notification already exists
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
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
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
    `;
    notification.innerHTML = `
        <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' : 
              type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' :
              '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Make functions globally available
window.loadUserProfiles = loadUserProfiles;
window.showUserDetails = showUserDetails;
window.showUserSessionDetails = showUserSessionDetails;
window.closeUserDetailsModal = closeUserDetailsModal;
window.closeSessionDetailsModal = closeSessionDetailsModal;
window.loadAllUsersDataSummary = loadAllUsersDataSummary;
window.initializeAnalyticsCharts = initializeAnalyticsCharts;
window.showNotification = showNotification;

