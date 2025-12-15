// Data Migration Script - LocalStorage to Database
// Run this in the browser console to migrate existing localStorage data to the database

async function migrateDataToDatabase() {
    console.log('=== OptiFeed Data Migration ===');
    console.log('Starting migration from localStorage to PostgreSQL database...\n');
    
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('ERROR: Not authenticated. Please log in first.');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    console.log(`Logged in as: ${currentUser.username}\n`);
    
    let migrationStats = {
        sessions: { total: 0, migrated: 0, failed: 0 },
        records: { total: 0, migrated: 0, failed: 0 },
        errors: []
    };
    
    try {
        // 1. Migrate Measurement Sessions
        console.log('--- Migrating Measurement Sessions ---');
        const sessions = JSON.parse(localStorage.getItem('measurementSessions') || '[]');
        const userSessions = sessions.filter(s => s.operator === currentUser.username);
        migrationStats.sessions.total = userSessions.length;
        
        console.log(`Found ${userSessions.length} sessions to migrate`);
        
        for (const session of userSessions) {
            try {
                // Calculate duration if not present
                let durationSeconds = session.durationSeconds;
                if (!durationSeconds && session.startTime && session.endTime) {
                    durationSeconds = Math.floor((new Date(session.endTime) - new Date(session.startTime)) / 1000);
                }
                
                // Create session
                const sessionResponse = await fetch('http://localhost:3000/api/measurements/sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        start_time: session.startTime || new Date(session.id).toISOString(),
                        end_time: session.endTime || null,
                        duration_seconds: durationSeconds || null,
                        status: session.endTime ? 'completed' : 'active',
                        notes: session.notes || ''
                    })
                });
                
                if (!sessionResponse.ok) {
                    throw new Error(`HTTP ${sessionResponse.status}`);
                }
                
                const sessionData = await sessionResponse.json();
                const newSessionId = sessionData.session.id;
                
                console.log(`✓ Migrated session #${session.id} → DB ID: ${newSessionId}`);
                migrationStats.sessions.migrated++;
                
                // 2. Migrate measurements for this session
                if (session.measurements && session.measurements.length > 0) {
                    console.log(`  Migrating ${session.measurements.length} measurements...`);
                    
                    for (const measurement of session.measurements) {
                        try {
                            const recordResponse = await fetch('http://localhost:3000/api/measurements/records', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    session_id: newSessionId,
                                    avg_size: parseFloat(measurement.avgSize || 0),
                                    total_pellets: parseInt(measurement.count || 0),
                                    quality_rating: measurement.quality || 'good',
                                    notes: measurement.notes || '',
                                    timestamp: measurement.timestamp || new Date().toISOString(),
                                    metadata: {
                                        min_size: measurement.minSize,
                                        max_size: measurement.maxSize,
                                        image: measurement.image
                                    }
                                })
                            });
                            
                            if (!recordResponse.ok) {
                                throw new Error(`HTTP ${recordResponse.status}`);
                            }
                            
                            migrationStats.records.migrated++;
                        } catch (error) {
                            console.error(`  ✗ Failed to migrate measurement: ${error.message}`);
                            migrationStats.records.failed++;
                            migrationStats.errors.push(`Measurement in session ${session.id}: ${error.message}`);
                        }
                    }
                    
                    migrationStats.records.total += session.measurements.length;
                    console.log(`  ✓ Migrated ${session.measurements.length} measurements`);
                }
                
            } catch (error) {
                console.error(`✗ Failed to migrate session #${session.id}: ${error.message}`);
                migrationStats.sessions.failed++;
                migrationStats.errors.push(`Session ${session.id}: ${error.message}`);
            }
        }
        
        // 3. Summary
        console.log('\n=== Migration Summary ===');
        console.log(`Sessions: ${migrationStats.sessions.migrated}/${migrationStats.sessions.total} migrated, ${migrationStats.sessions.failed} failed`);
        console.log(`Records: ${migrationStats.records.migrated}/${migrationStats.records.total} migrated, ${migrationStats.records.failed} failed`);
        
        if (migrationStats.errors.length > 0) {
            console.log('\nErrors:');
            migrationStats.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
        }
        
        console.log('\n=== Migration Complete ===');
        console.log('Your data has been migrated to the database.');
        console.log('You can now refresh the page to see your data from the database.');
        console.log('\nIMPORTANT: Your localStorage data is still intact. If you want to remove it after verifying the migration, run:');
        console.log('  clearLocalStorageData()');
        
        return migrationStats;
        
    } catch (error) {
        console.error('MIGRATION FAILED:', error);
        console.error('Your localStorage data is still intact.');
        return null;
    }
}

// Function to clear localStorage data (run ONLY after verifying migration)
function clearLocalStorageData() {
    if (!confirm('Are you sure you want to clear localStorage data? This cannot be undone!')) {
        return;
    }
    
    console.log('Clearing localStorage data...');
    localStorage.removeItem('measurementSessions');
    localStorage.removeItem('userMeasurements');
    localStorage.removeItem('pelletRecords');
    console.log('✓ localStorage data cleared');
    console.log('Refresh the page to load data from database.');
}

// Function to backup localStorage before migration
function backupLocalStorage() {
    const backup = {
        timestamp: new Date().toISOString(),
        data: {
            measurementSessions: localStorage.getItem('measurementSessions'),
            userMeasurements: localStorage.getItem('userMeasurements'),
            pelletRecords: localStorage.getItem('pelletRecords'),
            currentUser: localStorage.getItem('currentUser')
        }
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optifeed-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✓ Backup saved');
}

// Instructions
console.log('=== OptiFeed Data Migration Tool ===');
console.log('\nAvailable functions:');
console.log('1. backupLocalStorage() - Save a backup of your data');
console.log('2. migrateDataToDatabase() - Migrate data from localStorage to database');
console.log('3. clearLocalStorageData() - Remove localStorage data (ONLY after verifying migration)');
console.log('\nRecommended workflow:');
console.log('1. Run: backupLocalStorage()');
console.log('2. Run: migrateDataToDatabase()');
console.log('3. Verify data in the application');
console.log('4. Optionally run: clearLocalStorageData()');
console.log('\nTo start migration, run: migrateDataToDatabase()');
