// Admin-specific API Routes
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ============================================
// ADMIN DASHBOARD STATS
// ============================================

// Get comprehensive dashboard statistics for admin
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get all sessions (exclude admin accounts - only operators)
        const sessionsResult = await db.query(
            `SELECT COUNT(*) as total_sessions,
                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_sessions
             FROM measurement_sessions s
             INNER JOIN users u ON s.user_id = u.id
             WHERE u.role = 'user' AND u.is_active = true`
        );

        // Get all records with aggregates (exclude admin accounts - only operators)
        const recordsResult = await db.query(
            `SELECT COUNT(*) as total_records,
                    SUM(total_pellets) as total_pellets,
                    AVG(avg_size) as avg_size,
                    MIN(avg_size) as min_size,
                    MAX(avg_size) as max_size
             FROM pellet_records r
             INNER JOIN users u ON r.user_id = u.id
             WHERE u.role = 'user' AND u.is_active = true`
        );

        // Get today's records and sessions (exclude admin accounts - only operators)
        const todayResult = await db.query(
            `SELECT 
                (SELECT COUNT(*) FROM pellet_records r 
                 INNER JOIN users u ON r.user_id = u.id 
                 WHERE DATE(r.timestamp) = CURRENT_DATE AND u.role = 'user' AND u.is_active = true) as today_records,
                (SELECT COUNT(*) FROM measurement_sessions s 
                 INNER JOIN users u ON s.user_id = u.id 
                 WHERE DATE(s.start_time) = CURRENT_DATE AND u.role = 'user' AND u.is_active = true) as today_sessions,
                (SELECT SUM(r.total_pellets) FROM pellet_records r 
                 INNER JOIN users u ON r.user_id = u.id 
                 WHERE DATE(r.timestamp) = CURRENT_DATE AND u.role = 'user' AND u.is_active = true) as today_pellets`
        );

        // Get user counts
        const usersResult = await db.query(
            `SELECT COUNT(*) as total_users,
                    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
                    COUNT(CASE WHEN role = 'user' THEN 1 END) as operator_count
             FROM users WHERE is_active = true`
        );

        // Get sensor counts (exclude admin accounts - only operators)
        const sensorsResult = await db.query(
            `SELECT COUNT(*) as total_sensors,
                    COUNT(CASE WHEN s.status = 'online' THEN 1 END) as online_sensors,
                    COUNT(CASE WHEN s.status = 'offline' THEN 1 END) as offline_sensors
             FROM sensors s
             INNER JOIN users u ON s.user_id = u.id
             WHERE u.role = 'user' AND u.is_active = true`
        );

        // Get reports count (exclude admin accounts - only operators)
        const reportsResult = await db.query(
            `SELECT COUNT(*) as total_reports,
                    COUNT(CASE WHEN r.generated_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_reports
             FROM reports r
             INNER JOIN users u ON r.user_id = u.id
             WHERE u.role = 'user' AND u.is_active = true`
        );

        res.json({
            success: true,
            stats: {
                sessions: {
                    total: parseInt(sessionsResult.rows[0].total_sessions),
                    active: parseInt(sessionsResult.rows[0].active_sessions),
                    today: parseInt(todayResult.rows[0].today_sessions) || 0
                },
                records: {
                    total: parseInt(recordsResult.rows[0].total_records) || 0,
                    today: parseInt(todayResult.rows[0].today_records) || 0
                },
                measurements: {
                    total_pellets: parseInt(recordsResult.rows[0].total_pellets) || 0,
                    today_pellets: parseInt(todayResult.rows[0].today_pellets) || 0,
                    avg_size: parseFloat(recordsResult.rows[0].avg_size) || 0,
                    min_size: parseFloat(recordsResult.rows[0].min_size) || 0,
                    max_size: parseFloat(recordsResult.rows[0].max_size) || 0
                },
                users: {
                    total: parseInt(usersResult.rows[0].total_users),
                    admins: parseInt(usersResult.rows[0].admin_count),
                    operators: parseInt(usersResult.rows[0].operator_count)
                },
                sensors: {
                    total: parseInt(sensorsResult.rows[0].total_sensors) || 0,
                    online: parseInt(sensorsResult.rows[0].online_sensors) || 0,
                    offline: parseInt(sensorsResult.rows[0].offline_sensors) || 0
                },
                reports: {
                    total: parseInt(reportsResult.rows[0].total_reports) || 0,
                    week: parseInt(reportsResult.rows[0].week_reports) || 0
                }
            }
        });

    } catch (error) {
        console.error('Get admin dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent activity (records and sessions)
router.get('/dashboard/activity', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Get recent records (exclude admin accounts - only operators)
        const recordsResult = await db.query(
            `SELECT r.*, u.name as user_name, u.username
             FROM pellet_records r
             INNER JOIN users u ON r.user_id = u.id
             WHERE u.role = 'user' AND u.is_active = true
             ORDER BY r.timestamp DESC
             LIMIT $1`,
            [limit]
        );

        // Get recent completed sessions (exclude admin accounts - only operators)
        const sessionsResult = await db.query(
            `SELECT s.*, u.name as user_name, u.username
             FROM measurement_sessions s
             INNER JOIN users u ON s.user_id = u.id
             WHERE s.status = 'completed' AND u.role = 'user' AND u.is_active = true
             ORDER BY s.end_time DESC
             LIMIT $1`,
            [limit]
        );

        // Combine and sort by timestamp
        const activities = [
            ...recordsResult.rows.map(r => ({
                type: 'record',
                id: r.id,
                operator: r.operator,
                username: r.username,
                user_name: r.user_name,
                timestamp: r.timestamp,
                data: r
            })),
            ...sessionsResult.rows.map(s => ({
                type: 'session',
                id: s.id,
                operator: s.operator,
                username: s.username,
                user_name: s.user_name,
                timestamp: s.end_time,
                data: s
            }))
        ];

        // Sort by timestamp and limit
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const limitedActivities = activities.slice(0, limit);

        res.json({
            success: true,
            activities: limitedActivities
        });

    } catch (error) {
        console.error('Get admin activity error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get chart data for admin dashboard
router.get('/dashboard/charts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        // Ensure days is a valid number between 1 and 365
        const validDays = Math.max(1, Math.min(365, days));

        // Records over time (last N days) - Exclude admin accounts
        const recordsTimeResult = await db.query(
            `SELECT DATE(r.timestamp)::text as date, COUNT(*) as count
             FROM pellet_records r
             INNER JOIN users u ON r.user_id = u.id
             WHERE r.timestamp >= CURRENT_DATE - INTERVAL '1 day' * $1
                   AND u.role = 'user' AND u.is_active = true
             GROUP BY DATE(r.timestamp)
             ORDER BY date ASC`,
            [validDays]
        );

        // Sessions over time (last N days) - Exclude admin accounts
        const sessionsTimeResult = await db.query(
            `SELECT DATE(s.start_time)::text as date, COUNT(*) as count
             FROM measurement_sessions s
             INNER JOIN users u ON s.user_id = u.id
             WHERE s.start_time >= CURRENT_DATE - INTERVAL '1 day' * $1
                   AND u.role = 'user' AND u.is_active = true
             GROUP BY DATE(s.start_time)
             ORDER BY date ASC`,
            [validDays]
        );

        // Size distribution (bins) - Exclude admin accounts
        const sizeDistResult = await db.query(
            `SELECT r.avg_size
             FROM pellet_records r
             INNER JOIN users u ON r.user_id = u.id
             WHERE r.avg_size > 0 AND u.role = 'user' AND u.is_active = true
             ORDER BY r.avg_size`
        );

        // User activity (sessions by user) - Only show operators (exclude admins)
        // Group by user ID to ensure each user appears only once
        const userActivityResult = await db.query(
            `SELECT u.id, u.name, u.username, COUNT(*) as session_count
             FROM measurement_sessions s
             INNER JOIN users u ON s.user_id = u.id
             WHERE u.role = 'user' AND u.is_active = true
             GROUP BY u.id, u.name, u.username
             ORDER BY session_count DESC
             LIMIT 10`
        );

        // Average size trend (last 30 days) - Exclude admin accounts
        const avgSizeTrendResult = await db.query(
            `SELECT DATE(r.timestamp)::text as date,
                    AVG(r.avg_size)::numeric(10,2) as avg_size,
                    MIN(r.avg_size)::numeric(10,2) as min_size,
                    MAX(r.avg_size)::numeric(10,2) as max_size
             FROM pellet_records r
             INNER JOIN users u ON r.user_id = u.id
             WHERE r.timestamp >= CURRENT_DATE - INTERVAL '30 days' 
                   AND r.avg_size > 0 
                   AND u.role = 'user' AND u.is_active = true
             GROUP BY DATE(r.timestamp)
             ORDER BY date ASC`
        );

        res.json({
            success: true,
            charts: {
                recordsOverTime: recordsTimeResult.rows,
                sessionsOverTime: sessionsTimeResult.rows,
                sizeDistribution: sizeDistResult.rows.map(r => r.avg_size),
                userActivity: userActivityResult.rows,
                avgSizeTrend: avgSizeTrendResult.rows
            }
        });

    } catch (error) {
        console.error('Get admin chart data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users with statistics
router.get('/users/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const usersResult = await db.query(
            `SELECT u.*,
                    COUNT(DISTINCT CASE WHEN u.role = 'user' THEN s.id END) as total_sessions,
                    COUNT(DISTINCT CASE WHEN u.role = 'user' AND s.status = 'completed' THEN s.id END) as completed_sessions,
                    COUNT(DISTINCT CASE WHEN u.role = 'user' THEN r.id END) as total_records,
                    SUM(CASE WHEN u.role = 'user' THEN r.total_pellets ELSE 0 END) as total_pellets
             FROM users u
             LEFT JOIN measurement_sessions s ON u.id = s.user_id AND u.role = 'user'
             LEFT JOIN pellet_records r ON u.id = r.user_id AND u.role = 'user'
             WHERE u.is_active = true
             GROUP BY u.id
             ORDER BY u.created_at DESC`
        );

        res.json({
            success: true,
            users: usersResult.rows.map(user => ({
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                idNumber: user.id_number,
                phone: user.phone,
                location: user.location,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                isActive: user.is_active,
                stats: {
                    totalSessions: parseInt(user.total_sessions) || 0,
                    completedSessions: parseInt(user.completed_sessions) || 0,
                    totalRecords: parseInt(user.total_records) || 0,
                    totalPellets: parseInt(user.total_pellets) || 0
                }
            }))
        });

    } catch (error) {
        console.error('Get users with stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, phone, location, role, is_active } = req.body;

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (email !== undefined) {
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramCount++}`);
            values.push(phone);
        }
        if (location !== undefined) {
            updates.push(`location = $${paramCount++}`);
            values.push(location);
        }
        if (role !== undefined) {
            updates.push(`role = $${paramCount++}`);
            values.push(role);
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);

        const result = await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Log audit
        await db.query(
            'INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.user.id, req.user.username, 'UPDATE_USER', 'user', userId, JSON.stringify(req.body)]
        );

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete user (admin only) - HARD DELETE: Removes user and all associated data
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Don't allow deleting own account
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Check if user exists
        const userCheck = await db.query('SELECT id, username FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const username = userCheck.rows[0].username;

        // Log audit BEFORE deletion (so we have record of who deleted what)
        await db.query(
            'INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.user.id, req.user.username, 'DELETE_USER', 'user', userId, JSON.stringify({ 
                deleted_username: username,
                hard_delete: true,
                cascading_deletes: {
                    sensors: 'CASCADE',
                    sensor_readings: 'CASCADE (via sensors)',
                    measurement_sessions: 'CASCADE',
                    pellet_records: 'CASCADE',
                    reports: 'CASCADE',
                    user_preferences: 'CASCADE'
                }
            })]
        );

        // HARD DELETE - This will CASCADE delete all related data:
        // - sensors (ON DELETE CASCADE) -> sensor_readings (ON DELETE CASCADE)
        // - measurement_sessions (ON DELETE CASCADE)
        // - pellet_records (ON DELETE CASCADE)
        // - reports (ON DELETE CASCADE)
        // - user_preferences (ON DELETE CASCADE)
        // Note: audit_log entries are kept (ON DELETE SET NULL) for compliance
        // Note: locations.created_by is set to NULL (ON DELETE SET NULL) to preserve locations
        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: `User "${username}" and all associated data deleted successfully`,
            deleted: {
                user_id: userId,
                username: username,
                cascaded_deletes: {
                    sensors: 'All sensors owned by user',
                    sensor_readings: 'All readings from deleted sensors',
                    measurement_sessions: 'All sessions created by user',
                    pellet_records: 'All records created by user',
                    reports: 'All reports created by user',
                    user_preferences: 'User preferences'
                }
            }
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Get locations with statistics
router.get('/locations/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get all locations from locations table
        // Only count sensors that belong to active users/operators at this location
        const locationsFromTable = await db.query(
            `SELECT l.*,
                    COUNT(DISTINCT u.id) as user_count,
                    COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as admin_count,
                    COUNT(DISTINCT CASE WHEN u.role = 'user' THEN u.id END) as operator_count
             FROM locations l
             LEFT JOIN users u ON u.location = l.name AND u.is_active = true
             GROUP BY l.id`
        );

        // Get sensor counts for locations from table - only count sensors belonging to active operators (not admins)
        const locationSensorCounts = await db.query(
            `SELECT l.id, l.name, COUNT(DISTINCT s.id) as sensor_count
             FROM locations l
             INNER JOIN users u ON u.location = l.name AND u.is_active = true AND u.role = 'user'
             LEFT JOIN sensors s ON s.user_id = u.id
             GROUP BY l.id, l.name`
        );

        // Create a map of sensor counts for locations from table
        const locationSensorCountMap = {};
        locationSensorCounts.rows.forEach(row => {
            locationSensorCountMap[row.id] = parseInt(row.sensor_count) || 0;
        });

        // Get all unique location names from users that don't exist in locations table
        const userLocations = await db.query(
            `SELECT DISTINCT u.location as name,
                    COUNT(DISTINCT u.id) as user_count,
                    COUNT(DISTINCT CASE WHEN u.role = 'admin' THEN u.id END) as admin_count,
                    COUNT(DISTINCT CASE WHEN u.role = 'user' THEN u.id END) as operator_count
             FROM users u
             WHERE u.location IS NOT NULL 
                   AND u.location != ''
                   AND u.is_active = true
                   AND u.location NOT IN (SELECT name FROM locations)
             GROUP BY u.location`
        );

        // Get sensor counts for user locations (by location_name)
        // Only count sensors that belong to active operators (not admins) at this location
        const userLocationSensorCounts = await db.query(
            `SELECT s.location_name, COUNT(DISTINCT s.id) as sensor_count
             FROM sensors s
             INNER JOIN users u ON s.user_id = u.id AND u.is_active = true AND u.role = 'user'
             WHERE s.location_name IS NOT NULL
                   AND s.location_name != ''
                   AND s.location_name NOT IN (SELECT name FROM locations)
                   AND u.location = s.location_name
             GROUP BY s.location_name`
        );

        // Create a map of sensor counts for user locations
        const sensorCountMap = {};
        userLocationSensorCounts.rows.forEach(row => {
            sensorCountMap[row.location_name] = parseInt(row.sensor_count) || 0;
        });

        // Combine locations from table and user locations
        const allLocations = [];

        // Add locations from locations table
        locationsFromTable.rows.forEach(loc => {
            // Only show sensors if there are active users at this location
            const userCount = parseInt(loc.user_count) || 0;
            const sensorCount = userCount > 0 ? (locationSensorCountMap[loc.id] || 0) : 0;
            
            allLocations.push({
                id: loc.id,
                name: loc.name,
                description: loc.description,
                address: loc.address,
                createdAt: loc.created_at,
                isFromTable: true,
                stats: {
                    sensors: sensorCount,
                    users: userCount,
                    admins: parseInt(loc.admin_count) || 0,
                    operators: parseInt(loc.operator_count) || 0
                }
            });
        });

        // Add locations from users (that don't exist in locations table)
        userLocations.rows.forEach(loc => {
            // Only show sensors if there are active users at this location
            const userCount = parseInt(loc.user_count) || 0;
            const sensorCount = userCount > 0 ? (sensorCountMap[loc.name] || 0) : 0;
            
            allLocations.push({
                id: null, // No ID since it doesn't exist in locations table
                name: loc.name,
                description: null,
                address: null,
                createdAt: null,
                isFromTable: false,
                stats: {
                    sensors: sensorCount,
                    users: userCount,
                    admins: parseInt(loc.admin_count) || 0,
                    operators: parseInt(loc.operator_count) || 0
                }
            });
        });

        // Sort by name for consistency
        allLocations.sort((a, b) => {
            // Locations from table first, then by name
            if (a.isFromTable && !b.isFromTable) return -1;
            if (!a.isFromTable && b.isFromTable) return 1;
            return a.name.localeCompare(b.name);
        });

        res.json({
            success: true,
            locations: allLocations
        });

    } catch (error) {
        console.error('Get locations with stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new location
router.post('/locations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, address } = req.body;
        const userId = req.user.id;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Location name is required' });
        }

        // Check if location name already exists
        const existingLocation = await db.query(
            'SELECT id FROM locations WHERE name = $1',
            [name.trim()]
        );

        if (existingLocation.rows.length > 0) {
            return res.status(400).json({ error: 'Location with this name already exists' });
        }

        const result = await db.query(
            `INSERT INTO locations (name, description, address, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, description, address, created_at`,
            [name.trim(), description || null, address || null, userId]
        );

        res.json({
            success: true,
            location: {
                id: result.rows[0].id,
                name: result.rows[0].name,
                description: result.rows[0].description,
                address: result.rows[0].address,
                createdAt: result.rows[0].created_at,
                stats: {
                    sensors: 0,
                    users: 0,
                    admins: 0,
                    operators: 0
                }
            }
        });

    } catch (error) {
        console.error('Create location error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update location
router.put('/locations/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const locationId = parseInt(req.params.id);
        const { name, description, address } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Location name is required' });
        }

        // Check if location exists
        const existingLocation = await db.query(
            'SELECT id FROM locations WHERE id = $1',
            [locationId]
        );

        if (existingLocation.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }

        // Check if another location with the same name exists
        const duplicateCheck = await db.query(
            'SELECT id FROM locations WHERE name = $1 AND id != $2',
            [name.trim(), locationId]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Location with this name already exists' });
        }

        const result = await db.query(
            `UPDATE locations 
             SET name = $1, description = $2, address = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING id, name, description, address, created_at`,
            [name.trim(), description || null, address || null, locationId]
        );

        res.json({
            success: true,
            location: {
                id: result.rows[0].id,
                name: result.rows[0].name,
                description: result.rows[0].description,
                address: result.rows[0].address,
                createdAt: result.rows[0].created_at
            }
        });

    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete location
router.delete('/locations/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const locationId = parseInt(req.params.id);

        // Check if location exists
        const existingLocation = await db.query(
            'SELECT id, name FROM locations WHERE id = $1',
            [locationId]
        );

        if (existingLocation.rows.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }

        // Check if location has active users assigned
        const usersCheck = await db.query(
            'SELECT COUNT(*) as user_count FROM users WHERE location = $1 AND is_active = true',
            [existingLocation.rows[0].name]
        );

        if (parseInt(usersCheck.rows[0].user_count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete location with assigned users. Please reassign users first.' 
            });
        }

        // Check if location has sensors belonging to active users
        // Only prevent deletion if there are sensors that belong to active users at this location
        const sensorsCheck = await db.query(
            `SELECT COUNT(*) as sensor_count 
             FROM sensors s
             INNER JOIN users u ON s.user_id = u.id AND u.is_active = true
             WHERE s.location_id = $1 AND u.location = $2`,
            [locationId, existingLocation.rows[0].name]
        );

        if (parseInt(sensorsCheck.rows[0].sensor_count) > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete location with assigned sensors. Please reassign sensors first.' 
            });
        }

        // Clean up orphaned sensors (sensors with location_id but no active users)
        // Set their location_id to NULL before deleting the location
        await db.query(
            `UPDATE sensors 
             SET location_id = NULL, location_name = NULL
             WHERE location_id = $1 
             AND (user_id IS NULL OR user_id NOT IN (SELECT id FROM users WHERE is_active = true))`,
            [locationId]
        );

        await db.query('DELETE FROM locations WHERE id = $1', [locationId]);

        res.json({
            success: true,
            message: 'Location deleted successfully'
        });

    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
