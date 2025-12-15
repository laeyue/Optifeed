// Sensor Calibration Management

let sensors = [];
let filteredSensors = [];

// Load sensors from API
async function loadSensors() {
    try {
        const response = await apiRequest(API_CONFIG.ENDPOINTS.SENSORS, {
            method: 'GET'
        });
        sensors = response.sensors || [];
        filteredSensors = [...sensors];
        updateSensorsStats();
        renderSensors();
    } catch (error) {
        console.error('Failed to load sensors:', error);
        sensors = [];
        filteredSensors = [];
        updateSensorsStats();
        renderSensors();
    }
}

// Update sensors stats bar
function updateSensorsStats() {
    const statsBar = document.getElementById('sensorsStatsBar');
    if (!statsBar) return;
    
    const totalSensors = sensors.length;
    const onlineSensors = sensors.filter(s => getDisplayStatus(s) === 'online').length;
    const offlineSensors = sensors.filter(s => getDisplayStatus(s) === 'offline').length;
    const needsCalibration = sensors.filter(s => {
        const calDate = s.calibration_date || s.calibrationDate;
        if (!calDate) return true;
        const daysSince = Math.floor((new Date() - new Date(calDate)) / (1000 * 60 * 60 * 24));
        return daysSince > 90; // More than 90 days
    }).length;
    
    statsBar.innerHTML = `
        <div style="background: linear-gradient(135deg, rgba(47, 167, 110, 0.08) 0%, rgba(47, 167, 110, 0.03) 100%); border: 1.5px solid rgba(47, 167, 110, 0.15); border-radius: 1rem; padding: 1.5rem; text-align: center; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(47, 167, 110, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25);">
                <svg style="width: 24px; height: 24px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </div>
            <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${totalSensors}</h3>
            <p style="margin: 0; font-size: 0.875rem; color: #64748b; font-weight: 500;">Total Sensors</p>
        </div>
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%); border: 1.5px solid rgba(16, 185, 129, 0.15); border-radius: 1rem; padding: 1.5rem; text-align: center; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(16, 185, 129, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
                <svg style="width: 24px; height: 24px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6V12L16 14"/>
                </svg>
            </div>
            <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${onlineSensors}</h3>
            <p style="margin: 0; font-size: 0.875rem; color: #64748b; font-weight: 500;">Online</p>
        </div>
        <div style="background: linear-gradient(135deg, rgba(107, 114, 128, 0.08) 0%, rgba(107, 114, 128, 0.03) 100%); border: 1.5px solid rgba(107, 114, 128, 0.15); border-radius: 1rem; padding: 1.5rem; text-align: center; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(107, 114, 128, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(107, 114, 128, 0.25);">
                <svg style="width: 24px; height: 24px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            </div>
            <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${offlineSensors}</h3>
            <p style="margin: 0; font-size: 0.875rem; color: #64748b; font-weight: 500;">Offline</p>
        </div>
        <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.03) 100%); border: 1.5px solid rgba(245, 158, 11, 0.15); border-radius: 1rem; padding: 1.5rem; text-align: center; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(245, 158, 11, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
            <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">
                <svg style="width: 24px; height: 24px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
            </div>
            <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem; font-weight: 700; color: #1e293b; line-height: 1.2;">${needsCalibration}</h3>
            <p style="margin: 0; font-size: 0.875rem; color: #64748b; font-weight: 500;">Need Calibration</p>
        </div>
    `;
}

// Filter and search sensors
function filterSensors() {
    const searchQuery = document.getElementById('sensorSearch')?.value.toLowerCase() || '';
    const filterValue = document.getElementById('sensorFilter')?.value || 'all';
    
    filteredSensors = sensors.filter(sensor => {
        // Search filter
        const matchesSearch = !searchQuery || 
            sensor.name.toLowerCase().includes(searchQuery) ||
            (sensor.sensor_type || sensor.type || '').toLowerCase().includes(searchQuery) ||
            (sensor.location_name || sensor.location || '').toLowerCase().includes(searchQuery);
        
        // Status filter
        let matchesFilter = true;
        if (filterValue === 'online') {
            matchesFilter = getDisplayStatus(sensor) === 'online';
        } else if (filterValue === 'offline') {
            matchesFilter = getDisplayStatus(sensor) === 'offline';
        } else if (filterValue !== 'all') {
            const sensorType = (sensor.sensor_type || sensor.type || '').toLowerCase();
            matchesFilter = sensorType === filterValue;
        }
        
        return matchesSearch && matchesFilter;
    });
    
    renderSensors();
}

// Render sensors to the grid
function renderSensors() {
    const grid = document.getElementById('sensorsGrid');
    if (!grid) return;
    
    if (filteredSensors.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: white; border-radius: 1rem; border: 2px dashed rgba(47, 167, 110, 0.2);">
                <svg style="width: 64px; height: 64px; color: #94a3b8; margin: 0 auto 1.5rem; display: block;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; color: #1e293b;">${sensors.length === 0 ? 'No sensors configured' : 'No sensors match your filters'}</h3>
                <p style="margin: 0; font-size: 0.9375rem; color: #64748b;">${sensors.length === 0 ? 'Click "Add Sensor" to get started.' : 'Try adjusting your search or filter criteria.'}</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filteredSensors.map(sensor => {
        // Calculate days since calibration
        let calibrationInfo = 'Never calibrated';
        let daysSinceCal = null;
        const calibrationDate = sensor.calibration_date || sensor.calibrationDate;
        if (calibrationDate) {
            const calDate = new Date(calibrationDate);
            const now = new Date();
            daysSinceCal = Math.floor((now - calDate) / (1000 * 60 * 60 * 24));
            if (daysSinceCal === 0) {
                calibrationInfo = 'Calibrated today';
            } else if (daysSinceCal === 1) {
                calibrationInfo = 'Calibrated yesterday';
            } else if (daysSinceCal < 30) {
                calibrationInfo = `Calibrated ${daysSinceCal} days ago`;
            } else {
                calibrationInfo = `Calibrated ${calDate.toLocaleDateString()}`;
            }
        }
        
        // Calculate days since creation
        let createdInfo = '';
        const createdAt = sensor.created_at || sensor.createdAt;
        if (createdAt) {
            const createdDate = new Date(createdAt);
            const now = new Date();
            const daysSinceCreated = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            if (daysSinceCreated === 0) {
                createdInfo = 'Added today';
            } else if (daysSinceCreated === 1) {
                createdInfo = 'Added yesterday';
            } else if (daysSinceCreated < 30) {
                createdInfo = `Added ${daysSinceCreated} days ago`;
            } else {
                createdInfo = `Added ${createdDate.toLocaleDateString()}`;
            }
        }
        
        // Get sensor type and location
        const sensorType = sensor.sensor_type || sensor.type;
        const sensorLocation = sensor.location_name || sensor.location;
        const calibrationNotes = sensor.metadata?.calibration_notes || sensor.calibrationNotes || '';
        
        const status = getDisplayStatus(sensor);
        const statusColor = status === 'online' ? '#10b981' : '#6b7280';
        const needsCal = daysSinceCal !== null && daysSinceCal > 90;
        
        return `
        <div class="sensor-card" style="background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(249, 251, 253, 0.98) 100%); border: 1.5px solid rgba(47, 167, 110, 0.12); border-radius: 1.25rem; padding: 2rem; box-shadow: 0 4px 16px rgba(47, 167, 110, 0.06); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 8px 24px rgba(47, 167, 110, 0.12)'; this.style.borderColor='rgba(47, 167, 110, 0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(47, 167, 110, 0.06)'; this.style.borderColor='rgba(47, 167, 110, 0.12)'">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #2FA76E 0%, #4ECDC4 100%);"></div>
            
            <div class="sensor-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 2px solid rgba(47, 167, 110, 0.08);">
                <div style="display: flex; align-items: flex-start; gap: 1rem; flex: 1;">
                    <div style="width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #2FA76E 0%, #4ECDC4 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.25); flex-shrink: 0;">
                        <svg style="width: 28px; height: 28px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="9"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <h3 style="margin: 0 0 0.375rem 0; font-size: 1.375rem; font-weight: 700; color: #1e293b; letter-spacing: -0.02em; line-height: 1.3;">${sensor.name}</h3>
                        <p class="sensor-type" style="margin: 0; font-size: 0.875rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">${getSensorTypeLabel(sensorType)}</p>
                    </div>
                </div>
                <span class="sensor-status-badge status-${status}" style="padding: 0.5rem 1rem; border-radius: 0.75rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; background: ${statusColor}; color: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.375rem;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: white; display: inline-block;"></span>
                    ${status}
                </span>
            </div>
            
            <div class="sensor-card-body" style="margin-bottom: 1.5rem; flex: 1; display: flex; flex-direction: column; gap: 1rem;">
                <div class="sensor-info-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%); border-radius: 0.75rem; border: 1px solid rgba(47, 167, 110, 0.1); transition: all 0.2s ease;" onmouseover="this.style.background='linear-gradient(135deg, rgba(47, 167, 110, 0.08) 0%, rgba(47, 167, 110, 0.04) 100%)'; this.style.borderColor='rgba(47, 167, 110, 0.15)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(47, 167, 110, 0.05) 0%, rgba(47, 167, 110, 0.02) 100%)'; this.style.borderColor='rgba(47, 167, 110, 0.1)'">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(47, 167, 110, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <svg style="width: 20px; height: 20px; color: #2FA76E;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <span style="display: block; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Location</span>
                        <span style="display: block; font-size: 1rem; font-weight: 600; color: #1e293b;">${sensorLocation || 'Not specified'}</span>
                    </div>
                </div>
                
                <div class="sensor-info-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%); border-radius: 0.75rem; border: 1px solid rgba(59, 130, 246, 0.1); transition: all 0.2s ease;" onmouseover="this.style.background='linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)'; this.style.borderColor='rgba(59, 130, 246, 0.15)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)'; this.style.borderColor='rgba(59, 130, 246, 0.1)'">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(59, 130, 246, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <svg style="width: 20px; height: 20px; color: #3b82f6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="4" y="2" width="6" height="6" rx="0.5"/>
                            <path d="M7 8L7 20"/>
                            <path d="M5 4L9 4"/>
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <span style="display: block; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Last Calibration</span>
                        <span style="display: block; font-size: 1rem; font-weight: 600; color: #1e293b; ${needsCal ? 'color: #f59e0b;' : ''}">${calibrationInfo}</span>
                    </div>
                </div>
                
                <div class="sensor-info-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%); border-radius: 0.75rem; border: 1px solid rgba(139, 92, 246, 0.1); transition: all 0.2s ease;" onmouseover="this.style.background='linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)'; this.style.borderColor='rgba(139, 92, 246, 0.15)'" onmouseout="this.style.background='linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%)'; this.style.borderColor='rgba(139, 92, 246, 0.1)'">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(139, 92, 246, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <svg style="width: 20px; height: 20px; color: #8b5cf6;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
                            <path d="M12 6V12L16 14"/>
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <span style="display: block; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Added</span>
                        <span style="display: block; font-size: 1rem; font-weight: 600; color: #1e293b;">${createdInfo || 'Unknown'}</span>
                    </div>
                </div>
                
                ${calibrationNotes ? `
                    <div class="sensor-notes" style="margin-top: 0.5rem; padding: 1rem; background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%); border-radius: 0.75rem; border: 1px solid rgba(245, 158, 11, 0.1);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                            <svg style="width: 18px; height: 18px; color: #f59e0b;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8L14 2Z"/>
                                <path d="M14 2V8H19"/>
                            </svg>
                            <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Calibration Notes</span>
                        </div>
                        <p style="margin: 0; font-size: 0.875rem; color: #475569; line-height: 1.6;">${calibrationNotes}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="sensor-card-actions" style="display: flex; gap: 0.75rem; padding-top: 1.5rem; border-top: 2px solid rgba(47, 167, 110, 0.08); margin-top: auto;">
                <button class="btn-secondary btn-edit" onclick="editSensor(${sensor.id})" style="flex: 1; padding: 0.75rem 1rem; border-radius: 0.625rem; font-weight: 600; font-size: 0.875rem; border: 2px solid rgba(47, 167, 110, 0.2); background: white; color: #2FA76E; transition: all 0.2s ease;" onmouseover="this.style.background='rgba(47, 167, 110, 0.05)'; this.style.borderColor='rgba(47, 167, 110, 0.3)'" onmouseout="this.style.background='white'; this.style.borderColor='rgba(47, 167, 110, 0.2)'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"/>
                        <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"/>
                    </svg>
                    Edit
                </button>
                <button class="btn-primary btn-calibrate" onclick="calibrateSensor(${sensor.id})" style="flex: 1; padding: 0.75rem 1rem; border-radius: 0.625rem; font-weight: 600; font-size: 0.875rem; background: linear-gradient(135deg, #2FA76E 0%, #1F8A54 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(47, 167, 110, 0.3); transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(47, 167, 110, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(47, 167, 110, 0.3)'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <circle cx="12" cy="12" r="8"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                        <path d="M12 4V8"/>
                        <path d="M12 16V20"/>
                        <path d="M4 12H8"/>
                        <path d="M16 12H20"/>
                    </svg>
                    Calibrate
                </button>
                <button class="btn-danger btn-delete" onclick="deleteSensor(${sensor.id})" style="flex: 1; padding: 0.75rem 1rem; border-radius: 0.625rem; font-weight: 600; font-size: 0.875rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(239, 68, 68, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.3)'">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6H5H21"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"/>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `;
    }).join('');
}

// Get display status for sensor (respects global toggle)
function getDisplayStatus(sensor) {
    // Get per-operator sensorsStatus (same logic as monitoring page)
    const currentUser = getCurrentUser();
    let sensorsStatus;
    if (currentUser && currentUser.username) {
        const operatorStatus = localStorage.getItem(`sensorsStatus_${currentUser.username}`);
        sensorsStatus = operatorStatus !== null ? operatorStatus !== 'false' : localStorage.getItem('sensorsStatus') !== 'false';
    } else {
        sensorsStatus = localStorage.getItem('sensorsStatus') !== 'false';
    }
    
    if (!sensorsStatus) {
        // Global toggle is off, show offline regardless of individual status
        return 'offline';
    }
    // Global toggle is on, use individual sensor status
    return sensor.status || 'online';
}

function getSensorTypeLabel(type) {
    const labels = {
        'camera': 'Camera Sensor',
        'measurement': 'Size Measurement Sensor',
        'temperature': 'Temperature Sensor',
        'motion': 'Motion Sensor',
        'pressure': 'Pressure Sensor'
    };
    return labels[type] || type;
}

// Load locations from database for sensor modal
async function loadLocationsForSensorModal() {
    try {
        const sensorLocation = document.getElementById('sensorLocation');
        if (!sensorLocation) {
            console.warn('sensorLocation element not found');
            return;
        }
        
        console.log('Loading locations for sensor modal...');
        
        // Try admin endpoint first (if user is admin), fallback to public endpoint
        let response;
        try {
            response = await apiRequest(API_CONFIG.ENDPOINTS.ADMIN_LOCATIONS_STATS);
            console.log('Loaded locations from admin endpoint:', response);
        } catch (adminError) {
            // If admin endpoint fails (user not admin), use public endpoint
            console.log('Admin endpoint not accessible, using public endpoint');
            try {
                response = await apiRequest(API_CONFIG.ENDPOINTS.PUBLIC_LOCATIONS);
                console.log('Loaded locations from public endpoint:', response);
            } catch (publicError) {
                console.error('Both endpoints failed:', publicError);
                throw publicError;
            }
        }
        
        if (response && response.success && response.locations && Array.isArray(response.locations)) {
            // Store current value before clearing
            const currentValue = sensorLocation.value;
            
            // Clear existing options
            sensorLocation.innerHTML = '<option value="">Select a location</option>';
            
            // Add locations from database
            response.locations.forEach(location => {
                const locationName = location.name || location;
                if (locationName) {
                    const option = document.createElement('option');
                    option.value = locationName;
                    option.textContent = locationName;
                    sensorLocation.appendChild(option);
                }
            });
            
            console.log(`Loaded ${response.locations.length} locations into dropdown`);
            
            // Restore previous value if it exists
            if (currentValue) {
                sensorLocation.value = currentValue;
            }
        } else {
            console.warn('Invalid response format:', response);
        }
    } catch (error) {
        console.error('Failed to load locations:', error);
        // Keep default option if all fails
        const sensorLocation = document.getElementById('sensorLocation');
        if (sensorLocation) {
            if (sensorLocation.options.length <= 1) {
                sensorLocation.innerHTML = '<option value="">Select a location</option>';
            }
        }
    }
}

// Open add sensor modal
async function openAddSensorModal() {
    console.log('openAddSensorModal called');
    try {
        const modal = document.getElementById('sensorModal');
        const form = document.getElementById('sensorForm');
        const title = document.getElementById('sensorModalTitle');
        
        if (!modal || !form || !title) {
            console.error('Modal elements not found:', { modal, form, title });
            alert('Error: Modal elements not found. Please refresh the page.');
            return;
        }
        
        title.textContent = 'Add New Sensor';
        form.reset();
        document.getElementById('sensorId').value = '';
        
        // Show modal first
        modal.style.display = 'block';
        
        // Wait a bit to ensure modal is fully rendered
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Load locations from database
        await loadLocationsForSensorModal();
        
        // Hide status toggle for adding new sensor
        const statusGroup = document.getElementById('sensorStatusGroup');
        if (statusGroup) {
            statusGroup.style.display = 'none';
        }
        
        // Hide delete button for adding new sensor (if exists)
        const deleteSensorGroup = document.getElementById('deleteSensorGroup');
        if (deleteSensorGroup) {
            deleteSensorGroup.style.display = 'none';
        }
        window.currentEditingSensorId = null;
        
        modal.style.display = 'block';
        console.log('Modal opened successfully');
    } catch (error) {
        console.error('Error opening modal:', error);
        alert('Error opening modal: ' + error.message);
    }
}

// Delete sensor from modal
async function deleteSensorFromModal() {
    if (!window.currentEditingSensorId) return;
    if (!confirm('Are you sure you want to delete this sensor?')) return;
    
    try {
        // Delete from database
        await apiRequest(`${API_CONFIG.ENDPOINTS.SENSORS}/${window.currentEditingSensorId}`, {
            method: 'DELETE'
        });
        
        // Reload sensors from database
        await loadSensors();
        closeSensorModal();
        
        // Trigger update in monitoring page
        window.dispatchEvent(new CustomEvent('sensorsUpdated'));
        if (typeof loadSensorData === 'function') {
            loadSensorData();
        }
    } catch (error) {
        console.error('Failed to delete sensor:', error);
        alert('Failed to delete sensor. Please try again.');
    }
}

// Close sensor modal
function closeSensorModal() {
    document.getElementById('sensorModal').style.display = 'none';
}

// Edit sensor
async function editSensor(id) {
    const sensor = sensors.find(s => s.id === id);
    if (!sensor) return;
    
    // Show modal first
    document.getElementById('sensorModal').style.display = 'block';
    
    // Wait a bit to ensure modal is fully rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Load locations from database first
    await loadLocationsForSensorModal();
    
    document.getElementById('sensorModalTitle').textContent = 'Edit Sensor';
    document.getElementById('sensorId').value = sensor.id;
    document.getElementById('sensorName').value = sensor.name;
    document.getElementById('sensorType').value = sensor.sensor_type || sensor.type;
    
    // Set location value after locations are loaded
    const sensorLocation = document.getElementById('sensorLocation');
    if (sensorLocation) {
        sensorLocation.value = sensor.location_name || sensor.location || '';
    }
    
    document.getElementById('calibrationDate').value = sensor.calibration_date || sensor.calibrationDate || '';
    document.getElementById('calibrationNotes').value = sensor.metadata?.calibration_notes || sensor.calibrationNotes || '';
    
    // Show status toggle for editing
    const statusGroup = document.getElementById('sensorStatusGroup');
    const statusCheckbox = document.getElementById('sensorStatus');
    const statusLabel = document.getElementById('sensorStatusLabel');
    
    statusGroup.style.display = 'block';
    const currentStatus = sensor.status || 'online';
    statusCheckbox.checked = (currentStatus === 'online');
    statusLabel.textContent = currentStatus === 'online' ? 'Online' : 'Offline';
    
    // Update label when toggle changes
    statusCheckbox.onchange = function() {
        statusLabel.textContent = this.checked ? 'Online' : 'Offline';
    };
    
    window.currentEditingSensorId = id;
}

// Save sensor
async function saveSensor() {
    const id = document.getElementById('sensorId').value;
    const name = document.getElementById('sensorName').value;
    const type = document.getElementById('sensorType').value;
    const location = document.getElementById('sensorLocation').value;
    const calibrationDate = document.getElementById('calibrationDate').value;
    const calibrationNotes = document.getElementById('calibrationNotes').value.trim();
    
    // Validate required fields
    if (!name || !type) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Require notes when adding a new sensor (not when editing)
    if (!id && !calibrationNotes) {
        alert('Calibration notes are required when adding a new sensor.');
        document.getElementById('calibrationNotes').focus();
        return;
    }
    
    try {
        if (id) {
            // Edit existing sensor
            const statusCheckbox = document.getElementById('sensorStatus');
            const status = statusCheckbox.checked ? 'online' : 'offline';
            
            await apiRequest(`${API_CONFIG.ENDPOINTS.SENSORS}/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name,
                    sensor_type: type,
                    location_name: location,
                    calibration_date: calibrationDate,
                    status,
                    metadata: { calibration_notes: calibrationNotes }
                })
            });
        } else {
            // Add new sensor
            await apiRequest(API_CONFIG.ENDPOINTS.SENSORS, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    sensor_type: type,
                    location_name: location,
                    calibration_date: calibrationDate,
                    status: 'online',
                    metadata: { calibration_notes: calibrationNotes }
                })
            });
        }
        
        // Reload sensors and close modal
        await loadSensors();
        closeSensorModal();
        
        // Trigger update events for monitoring page
        window.dispatchEvent(new CustomEvent('sensorsUpdated'));
        window.dispatchEvent(new CustomEvent('sensorStatusChanged'));
        if (typeof loadSensorData === 'function') {
            loadSensorData();
        }
    } catch (error) {
        console.error('Failed to save sensor:', error);
        alert('Failed to save sensor. Please try again.');
    }
}

// Calibrate sensor
async function calibrateSensor(id) {
    const sensor = sensors.find(s => s.id === id);
    if (!sensor) return;
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        await apiRequest(`${API_CONFIG.ENDPOINTS.SENSORS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                calibration_date: today,
                status: 'online'
            })
        });
        
        await loadSensors();
        
        // Trigger update events
        window.dispatchEvent(new CustomEvent('sensorsUpdated'));
        if (typeof loadSensorData === 'function') {
            loadSensorData();
        }
        
        alert(`Sensor "${sensor.name}" has been calibrated successfully!`);
    } catch (error) {
        console.error('Failed to calibrate sensor:', error);
        alert('Failed to calibrate sensor. Please try again.');
    }
}

// Delete sensor
async function deleteSensor(id) {
    if (!confirm('Are you sure you want to delete this sensor?')) return;
    
    try {
        await apiRequest(`${API_CONFIG.ENDPOINTS.SENSORS}/${id}`, {
            method: 'DELETE'
        });
        
        await loadSensors();
        
        // Trigger update events
        window.dispatchEvent(new CustomEvent('sensorsUpdated'));
        if (typeof loadSensorData === 'function') {
            loadSensorData();
        }
    } catch (error) {
        console.error('Failed to delete sensor:', error);
        alert('Failed to delete sensor. Please try again.');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSensors();
    
    // Add search and filter event listeners
    const searchInput = document.getElementById('sensorSearch');
    const filterSelect = document.getElementById('sensorFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterSensors);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', filterSensors);
    }
    
    // Listen for sensor status updates from monitoring page
    window.addEventListener('sensorsUpdated', function() {
        loadSensors();
    });
    
    // Listen for status changes from monitoring page toggle
    window.addEventListener('sensorStatusChanged', function() {
        loadSensors();
    });
    
    // Close modal on outside click
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('sensorModal');
        if (event.target === modal) {
            closeSensorModal();
        }
    });
});


