// API Routes for Measurement Sessions and Pellet Records
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// MEASUREMENT SESSIONS
// ============================================

// Get all sessions for current user (or all for admin)
router.get('/sessions', authenticateToken, async (req, res) => {
    try {
        // Query now includes aggregated pellet and record counts from pellet_records
        // Admins see all sessions, but exclude admin accounts (only operators)
        const query = req.user.role === 'admin' 
            ? `SELECT s.*, 
                      u.name as user_name,
                      COALESCE(COUNT(r.id), 0) as measurement_count,
                      COALESCE(SUM(r.total_pellets), 0) as total_pellets,
                      COALESCE(AVG(r.avg_size), 0) as avg_size
               FROM measurement_sessions s
               INNER JOIN users u ON s.user_id = u.id AND u.role = 'user' AND u.is_active = true
               LEFT JOIN pellet_records r ON s.id = r.session_id
               GROUP BY s.id, u.name
               ORDER BY s.start_time DESC`
            : `SELECT s.*, 
                      u.name as user_name,
                      COALESCE(COUNT(r.id), 0) as measurement_count,
                      COALESCE(SUM(r.total_pellets), 0) as total_pellets,
                      COALESCE(AVG(r.avg_size), 0) as avg_size
               FROM measurement_sessions s
               LEFT JOIN users u ON s.user_id = u.id
               LEFT JOIN pellet_records r ON s.id = r.session_id
               WHERE s.user_id = $1
               GROUP BY s.id, u.name
               ORDER BY s.start_time DESC`;
        
        const values = req.user.role === 'admin' ? [] : [req.user.id];
        const result = await db.query(query, values);
        
        // Parse numeric fields
        const sessions = result.rows.map(session => ({
            ...session,
            measurement_count: parseInt(session.measurement_count) || 0,
            total_pellets: parseInt(session.total_pellets) || 0,
            avg_size: session.avg_size ? parseFloat(session.avg_size).toFixed(2) : '0.00'
        }));
        
        res.json({ sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single session with all records
router.get('/sessions/:id', authenticateToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        
        // Get session
        const sessionQuery = req.user.role === 'admin'
            ? 'SELECT * FROM measurement_sessions WHERE id = $1'
            : 'SELECT * FROM measurement_sessions WHERE id = $1 AND user_id = $2';
        
        const sessionValues = req.user.role === 'admin' ? [sessionId] : [sessionId, req.user.id];
        const sessionResult = await db.query(sessionQuery, sessionValues);
        
        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Get records for this session
        const recordsResult = await db.query(
            'SELECT * FROM pellet_records WHERE session_id = $1 ORDER BY timestamp ASC',
            [sessionId]
        );
        
        const session = sessionResult.rows[0];
        session.measurements = recordsResult.rows;
        
        res.json({ session });
    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new session
router.post('/sessions', authenticateToken, async (req, res) => {
    try {
        // Admins cannot create sessions
        if (req.user.role === 'admin') {
            return res.status(403).json({ error: 'Admins cannot create measurement sessions' });
        }
        
        const { start_time, notes } = req.body;
        
        const result = await db.query(
            `INSERT INTO measurement_sessions (operator, user_id, start_time, notes, status)
             VALUES ($1, $2, $3, $4, 'active')
             RETURNING *`,
            [req.user.username, req.user.id, start_time || new Date().toISOString(), notes || '']
        );
        
        res.status(201).json({ session: result.rows[0] });
    } catch (error) {
        console.error('Create session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update session (end session, add notes, etc.)
router.put('/sessions/:id', authenticateToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const { end_time, duration_seconds, status, notes, avg_size, min_size, max_size } = req.body;
        
        // Check if session exists and user has access
        const checkResult = await db.query(
            'SELECT * FROM measurement_sessions WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [sessionId, req.user.id] : [sessionId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (end_time !== undefined) {
            updates.push(`end_time = $${paramCount++}`);
            values.push(end_time);
        }
        if (duration_seconds !== undefined) {
            updates.push(`duration_seconds = $${paramCount++}`);
            values.push(duration_seconds);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        if (notes !== undefined) {
            updates.push(`notes = $${paramCount++}`);
            values.push(notes);
        }
        // Calculate and store aggregated size stats from all records
        // Get all records for this session to calculate accurate stats
        const recordsResult = await db.query(
            'SELECT avg_size, metadata FROM pellet_records WHERE session_id = $1',
            [sessionId]
        );
        
        if (recordsResult.rows.length > 0) {
            const allSizes = [];
            const allMinSizes = [];
            const allMaxSizes = [];
            
            recordsResult.rows.forEach(record => {
                const avg = parseFloat(record.avg_size || 0);
                if (avg > 0) {
                    allSizes.push(avg);
                }
                
                // Extract min/max from metadata
                if (record.metadata) {
                    try {
                        const meta = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
                        if (meta.min_size) allMinSizes.push(parseFloat(meta.min_size));
                        if (meta.max_size) allMaxSizes.push(parseFloat(meta.max_size));
                    } catch (e) {
                        // If parsing fails, use avg_size as fallback
                        if (avg > 0) {
                            allMinSizes.push(avg);
                            allMaxSizes.push(avg);
                        }
                    }
                } else if (avg > 0) {
                    // If no metadata, use avg_size as fallback
                    allMinSizes.push(avg);
                    allMaxSizes.push(avg);
                }
            });
            
            // Calculate aggregated values
            const calculatedAvg = allSizes.length > 0 
                ? allSizes.reduce((sum, size) => sum + size, 0) / allSizes.length 
                : (avg_size !== undefined && avg_size !== null ? avg_size : null);
            const calculatedMin = allMinSizes.length > 0 
                ? Math.min(...allMinSizes) 
                : (min_size !== undefined && min_size !== null ? min_size : null);
            const calculatedMax = allMaxSizes.length > 0 
                ? Math.max(...allMaxSizes) 
                : (max_size !== undefined && max_size !== null ? max_size : null);
            
            // Store calculated values in notes field as JSON (since table doesn't have these columns)
            // This allows us to retrieve them later without modifying the schema
            const existingNotes = checkResult.rows[0].notes || '';
            let notesObj = {};
            try {
                if (existingNotes && existingNotes.trim().startsWith('{')) {
                    notesObj = JSON.parse(existingNotes);
                } else if (existingNotes) {
                    // If notes contains text, preserve it
                    notesObj.user_notes = existingNotes;
                }
            } catch (e) {
                // If notes is not JSON, preserve it as user_notes
                notesObj.user_notes = existingNotes;
            }
            
            // Add calculated stats
            notesObj.session_stats = {
                avg_size: calculatedAvg !== null ? parseFloat(calculatedAvg.toFixed(2)) : null,
                min_size: calculatedMin !== null ? parseFloat(calculatedMin.toFixed(2)) : null,
                max_size: calculatedMax !== null ? parseFloat(calculatedMax.toFixed(2)) : null,
                calculated_at: new Date().toISOString()
            };
            
            // Only update notes if not explicitly provided in request
            if (notes === undefined) {
                updates.push(`notes = $${paramCount++}`);
                values.push(JSON.stringify(notesObj));
            }
            
            console.log('[Update Session] Calculated and stored aggregated stats:', notesObj.session_stats);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(sessionId);
        
        const result = await db.query(
            `UPDATE measurement_sessions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${paramCount}
             RETURNING *`,
            values
        );
        
        res.json({ session: result.rows[0] });
    } catch (error) {
        console.error('Update session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete session
router.delete('/sessions/:id', authenticateToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        
        // Check if session exists and user has access
        const checkResult = await db.query(
            'SELECT * FROM measurement_sessions WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [sessionId, req.user.id] : [sessionId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await db.query('DELETE FROM measurement_sessions WHERE id = $1', [sessionId]);
        
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// PELLET RECORDS
// ============================================

// Get all records for current user (or all for admin)
router.get('/records', authenticateToken, async (req, res) => {
    try {
        // Admins see all records, but exclude admin accounts (only operators)
        const query = req.user.role === 'admin'
            ? `SELECT r.*, s.start_time as session_start, u.name as user_name
               FROM pellet_records r
               INNER JOIN users u ON r.user_id = u.id AND u.role = 'user' AND u.is_active = true
               LEFT JOIN measurement_sessions s ON r.session_id = s.id
               ORDER BY r.timestamp DESC`
            : `SELECT r.*, s.start_time as session_start, u.name as user_name
               FROM pellet_records r
               LEFT JOIN measurement_sessions s ON r.session_id = s.id
               LEFT JOIN users u ON r.user_id = u.id
               WHERE r.user_id = $1
               ORDER BY r.timestamp DESC`;
        
        const values = req.user.role === 'admin' ? [] : [req.user.id];
        const result = await db.query(query, values);
        
        res.json({ records: result.rows });
    } catch (error) {
        console.error('Get records error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get records for specific session
router.get('/sessions/:sessionId/records', authenticateToken, async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        
        // Verify session access
        const sessionCheck = await db.query(
            'SELECT * FROM measurement_sessions WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [sessionId, req.user.id] : [sessionId]
        );
        
        if (sessionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        const result = await db.query(
            'SELECT * FROM pellet_records WHERE session_id = $1 ORDER BY timestamp ASC',
            [sessionId]
        );
        
        res.json({ records: result.rows });
    } catch (error) {
        console.error('Get session records error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new record
router.post('/records', authenticateToken, async (req, res) => {
    try {
        // Admins cannot create records
        if (req.user.role === 'admin') {
            return res.status(403).json({ error: 'Admins cannot create measurement records' });
        }
        
        const { session_id, avg_size, total_pellets, quality_rating, notes, timestamp, metadata } = req.body;
        
        if (avg_size === undefined || total_pellets === undefined) {
            return res.status(400).json({ error: 'avg_size and total_pellets are required' });
        }
        
        // If session_id provided, verify access
        if (session_id) {
            const sessionCheck = await db.query(
                'SELECT * FROM measurement_sessions WHERE id = $1 AND user_id = $2',
                [session_id, req.user.id]
            );
            
            if (sessionCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Session not found' });
            }
        }
        
        const result = await db.query(
            `INSERT INTO pellet_records (session_id, operator, user_id, avg_size, total_pellets, quality_rating, notes, timestamp, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                session_id || null,
                req.user.username,
                req.user.id,
                avg_size,
                total_pellets,
                quality_rating || null,
                notes || null,
                timestamp || new Date().toISOString(),
                metadata ? JSON.stringify(metadata) : null
            ]
        );
        
        res.status(201).json({ record: result.rows[0] });
    } catch (error) {
        console.error('Create record error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Update record
router.put('/records/:id', authenticateToken, async (req, res) => {
    try {
        const recordId = parseInt(req.params.id);
        const { avg_size, total_pellets, quality_rating, notes, metadata } = req.body;
        
        // Check if record exists and user has access
        const checkResult = await db.query(
            'SELECT * FROM pellet_records WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [recordId, req.user.id] : [recordId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (avg_size !== undefined) {
            updates.push(`avg_size = $${paramCount++}`);
            values.push(avg_size);
        }
        if (total_pellets !== undefined) {
            updates.push(`total_pellets = $${paramCount++}`);
            values.push(total_pellets);
        }
        if (quality_rating !== undefined) {
            updates.push(`quality_rating = $${paramCount++}`);
            values.push(quality_rating);
        }
        if (notes !== undefined) {
            updates.push(`notes = $${paramCount++}`);
            values.push(notes);
        }
        if (metadata !== undefined) {
            updates.push(`metadata = $${paramCount++}`);
            values.push(JSON.stringify(metadata));
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(recordId);
        
        const result = await db.query(
            `UPDATE pellet_records SET ${updates.join(', ')}
             WHERE id = $${paramCount}
             RETURNING *`,
            values
        );
        
        res.json({ record: result.rows[0] });
    } catch (error) {
        console.error('Update record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete record
router.delete('/records/:id', authenticateToken, async (req, res) => {
    try {
        const recordId = parseInt(req.params.id);
        
        // Check if record exists and user has access
        const checkResult = await db.query(
            'SELECT * FROM pellet_records WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [recordId, req.user.id] : [recordId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        
        await db.query('DELETE FROM pellet_records WHERE id = $1', [recordId]);
        
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Delete record error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================
// REPORTS
// ============================================

// Get all reports for current user (or all for admin)
router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const query = req.user.role === 'admin'
            ? `SELECT r.*, u.name as user_name
               FROM reports r
               LEFT JOIN users u ON r.user_id = u.id
               ORDER BY r.generated_at DESC`
            : `SELECT r.*, u.name as user_name
               FROM reports r
               LEFT JOIN users u ON r.user_id = u.id
               WHERE r.user_id = $1 OR r.is_public = true
               ORDER BY r.generated_at DESC`;
        
        const values = req.user.role === 'admin' ? [] : [req.user.id];
        const result = await db.query(query, values);
        
        res.json({ reports: result.rows });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single report
router.get('/reports/:id', authenticateToken, async (req, res) => {
    try {
        const reportId = parseInt(req.params.id);
        
        const query = req.user.role === 'admin'
            ? 'SELECT * FROM reports WHERE id = $1'
            : 'SELECT * FROM reports WHERE id = $1 AND (user_id = $2 OR is_public = true)';
        
        const values = req.user.role === 'admin' ? [reportId] : [reportId, req.user.id];
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        res.json({ report: result.rows[0] });
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new report
router.post('/reports', authenticateToken, async (req, res) => {
    try {
        const {
            report_name,
            report_type,
            date_from,
            date_to,
            total_measurements,
            total_pellets,
            average_size,
            min_size,
            max_size,
            report_data,
            is_public
        } = req.body;
        
        if (!report_name || !date_from || !date_to) {
            return res.status(400).json({ error: 'report_name, date_from, and date_to are required' });
        }
        
        const result = await db.query(
            `INSERT INTO reports (
                report_name, report_type, operator, user_id, date_from, date_to,
                total_measurements, total_pellets, average_size, min_size, max_size,
                report_data, is_public
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                report_name,
                report_type || 'custom',
                req.user.username,
                req.user.id,
                date_from,
                date_to,
                total_measurements || 0,
                total_pellets || 0,
                average_size || null,
                min_size || null,
                max_size || null,
                report_data ? JSON.stringify(report_data) : null,
                is_public || false
            ]
        );
        
        res.status(201).json({ report: result.rows[0] });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Delete report
router.delete('/reports/:id', authenticateToken, async (req, res) => {
    try {
        const reportId = parseInt(req.params.id);
        
        // Check if report exists and user has access
        const checkResult = await db.query(
            'SELECT * FROM reports WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [reportId, req.user.id] : [reportId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        await db.query('DELETE FROM reports WHERE id = $1', [reportId]);
        
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        // Get counts and aggregates for user's data
        // Admins see all data, but exclude admin accounts (only operators)
        const statsQuery = req.user.role === 'admin'
            ? `SELECT
                COUNT(DISTINCT s.id) as total_sessions,
                COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_sessions,
                COUNT(r.id) as total_measurements,
                SUM(r.total_pellets) as total_pellets,
                AVG(r.avg_size) as avg_size,
                MIN(r.avg_size) as min_size,
                MAX(r.avg_size) as max_size
               FROM measurement_sessions s
               INNER JOIN users u ON s.user_id = u.id AND u.role = 'user' AND u.is_active = true
               LEFT JOIN pellet_records r ON s.id = r.session_id`
            : `SELECT
                COUNT(DISTINCT s.id) as total_sessions,
                COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_sessions,
                COUNT(r.id) as total_measurements,
                SUM(r.total_pellets) as total_pellets,
                AVG(r.avg_size) as avg_size,
                MIN(r.avg_size) as min_size,
                MAX(r.avg_size) as max_size
               FROM measurement_sessions s
               LEFT JOIN pellet_records r ON s.id = r.session_id
               WHERE s.user_id = $1`;
        
        const statsValues = req.user.role === 'admin' ? [] : [req.user.id];
        const statsResult = await db.query(statsQuery, statsValues);
        
        // Get sensor counts (exclude admin accounts - only operators)
        const sensorQuery = req.user.role === 'admin'
            ? `SELECT s.status, COUNT(*) as count 
               FROM sensors s
               INNER JOIN users u ON s.user_id = u.id AND u.role = 'user' AND u.is_active = true
               GROUP BY s.status`
            : `SELECT status, COUNT(*) as count FROM sensors WHERE user_id = $1 GROUP BY status`;
        
        const sensorValues = req.user.role === 'admin' ? [] : [req.user.id];
        const sensorResult = await db.query(sensorQuery, sensorValues);
        
        const stats = statsResult.rows[0];
        const sensorCounts = {};
        sensorResult.rows.forEach(row => {
            sensorCounts[row.status] = parseInt(row.count);
        });
        
        res.json({
            measurements: {
                total_sessions: parseInt(stats.total_sessions) || 0,
                active_sessions: parseInt(stats.active_sessions) || 0,
                total_measurements: parseInt(stats.total_measurements) || 0,
                total_pellets: parseInt(stats.total_pellets) || 0,
                avg_size: stats.avg_size ? parseFloat(stats.avg_size).toFixed(2) : '0.00',
                min_size: stats.min_size ? parseFloat(stats.min_size).toFixed(2) : '0.00',
                max_size: stats.max_size ? parseFloat(stats.max_size).toFixed(2) : '0.00'
            },
            sensors: {
                online: sensorCounts.online || 0,
                offline: sensorCounts.offline || 0,
                maintenance: sensorCounts.maintenance || 0,
                error: sensorCounts.error || 0,
                total: Object.values(sensorCounts).reduce((a, b) => a + b, 0)
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
