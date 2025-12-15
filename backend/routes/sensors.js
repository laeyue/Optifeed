// Sensor Routes
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all sensors (admin) or user's sensors
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query;
        let params = [];

        if (req.user.role === 'admin') {
            // Admin sees all sensors, but exclude admin accounts (only operators)
            query = `
                SELECT s.*, u.name as user_name
                FROM sensors s
                INNER JOIN users u ON s.user_id = u.id AND u.role = 'user' AND u.is_active = true
                ORDER BY s.created_at DESC
            `;
        } else {
            // Users see only their sensors
            query = `
                SELECT * FROM sensors
                WHERE user_id = $1
                ORDER BY created_at DESC
            `;
            params = [req.user.id];
        }

        const result = await db.query(query, params);
        res.json({ sensors: result.rows });

    } catch (error) {
        console.error('Get sensors error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single sensor by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const sensorId = parseInt(req.params.id);
        
        let query = `
            SELECT s.*, u.name as user_name
            FROM sensors s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = $1
        `;
        
        // Non-admin users can only see their own sensors
        if (req.user.role !== 'admin') {
            query += ' AND s.user_id = $2';
            var result = await db.query(query, [sensorId, req.user.id]);
        } else {
            var result = await db.query(query, [sensorId]);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sensor not found' });
        }

        res.json({ sensor: result.rows[0] });

    } catch (error) {
        console.error('Get sensor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new sensor
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Admins cannot create sensors
        if (req.user.role === 'admin') {
            return res.status(403).json({ error: 'Admins cannot create sensors' });
        }

        const { name, sensor_type, location_id, location_name, status, calibration_date, metadata } = req.body;

        if (!name || !sensor_type) {
            return res.status(400).json({ error: 'Name and sensor type required' });
        }

        const result = await db.query(
            `INSERT INTO sensors (name, sensor_type, location_id, location_name, status, username, user_id, calibration_date, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
             RETURNING *`,
            [name, sensor_type, location_id, location_name, status || 'offline', req.user.username, req.user.id, calibration_date === '' ? null : calibration_date, metadata ? JSON.stringify(metadata) : null]
        );

        // Log audit
        await db.query(
            'INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.user.id, req.user.username, 'CREATE_SENSOR', 'sensor', result.rows[0].id, JSON.stringify({ name, sensor_type })]
        );

        res.status(201).json({ sensor: result.rows[0] });

    } catch (error) {
        console.error('Create sensor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update sensor
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const sensorId = parseInt(req.params.id);
        const { name, sensor_type, location_id, location_name, status, calibration_date, metadata } = req.body;

        // Check if sensor exists and user has access
        const checkResult = await db.query(
            'SELECT * FROM sensors WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [sensorId, req.user.id] : [sensorId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Sensor not found' });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (sensor_type !== undefined) {
            updates.push(`sensor_type = $${paramCount++}`);
            values.push(sensor_type);
        }
        if (location_id !== undefined) {
            updates.push(`location_id = $${paramCount++}`);
            values.push(location_id);
        }
        if (location_name !== undefined) {
            updates.push(`location_name = $${paramCount++}`);
            values.push(location_name);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        if (calibration_date !== undefined) {
            updates.push(`calibration_date = $${paramCount++}`);
            values.push(calibration_date === '' ? null : calibration_date);
        }
        if (metadata !== undefined) {
            updates.push(`metadata = $${paramCount++}`);
            values.push(JSON.stringify(metadata));
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(sensorId);

        const result = await db.query(
            `UPDATE sensors SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = $${paramCount}
             RETURNING *`,
            values
        );

        // Log audit
        await db.query(
            'INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.user.id, req.user.username, 'UPDATE_SENSOR', 'sensor', sensorId, JSON.stringify(req.body)]
        );

        res.json({ sensor: result.rows[0] });

    } catch (error) {
        console.error('Update sensor error:', error);
        console.error('Request body:', req.body);
        console.error('Sensor ID:', req.params.id);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Delete sensor
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const sensorId = parseInt(req.params.id);

        // Check if sensor exists and user has access
        const checkResult = await db.query(
            'SELECT * FROM sensors WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [sensorId, req.user.id] : [sensorId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Sensor not found' });
        }

        await db.query('DELETE FROM sensors WHERE id = $1', [sensorId]);

        // Log audit
        await db.query(
            'INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.user.id, req.user.username, 'DELETE_SENSOR', 'sensor', sensorId, JSON.stringify(checkResult.rows[0])]
        );

        res.json({ message: 'Sensor deleted successfully' });

    } catch (error) {
        console.error('Delete sensor error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sensor readings
router.get('/:id/readings', authenticateToken, async (req, res) => {
    try {
        const sensorId = parseInt(req.params.id);
        const { hours = 24, limit = 100 } = req.query;

        // Check if sensor exists and user has access
        const checkResult = await db.query(
            'SELECT * FROM sensors WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [sensorId, req.user.id] : [sensorId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Sensor not found' });
        }

        const result = await db.query(
            `SELECT * FROM sensor_readings
             WHERE sensor_id = $1
               AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '${parseInt(hours)} hours'
             ORDER BY timestamp DESC
             LIMIT $2`,
            [sensorId, parseInt(limit)]
        );

        res.json({ readings: result.rows });

    } catch (error) {
        console.error('Get sensor readings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add sensor reading
router.post('/:id/readings', authenticateToken, async (req, res) => {
    try {
        const sensorId = parseInt(req.params.id);
        const { reading_value, unit, quality_status } = req.body;

        if (reading_value === undefined) {
            return res.status(400).json({ error: 'Reading value required' });
        }

        // Check if sensor exists and user has access
        const checkResult = await db.query(
            'SELECT * FROM sensors WHERE id = $1' + (req.user.role !== 'admin' ? ' AND user_id = $2' : ''),
            req.user.role !== 'admin' ? [sensorId, req.user.id] : [sensorId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Sensor not found' });
        }

        const result = await db.query(
            `INSERT INTO sensor_readings (sensor_id, reading_value, unit, quality_status, timestamp)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
             RETURNING *`,
            [sensorId, reading_value, unit, quality_status || 'good']
        );

        res.status(201).json({ reading: result.rows[0] });

    } catch (error) {
        console.error('Add sensor reading error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
