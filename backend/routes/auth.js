// Authentication Routes
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Get user from database
        const result = await db.query(
            'SELECT id, username, password_hash, name, email, role, id_number, phone, location FROM users WHERE username = $1 AND is_active = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await db.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Log audit
        await db.query(
            'INSERT INTO audit_log (user_id, username, action, details) VALUES ($1, $2, $3, $4)',
            [user.id, user.username, 'LOGIN', JSON.stringify({ ip: req.ip })]
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                idNumber: user.id_number,
                phone: user.phone,
                location: user.location
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Signup endpoint
router.post('/signup', async (req, res) => {
    try {
        const { username, password, name, email } = req.body;

        if (!username || !password || !name) {
            return res.status(400).json({ error: 'Username, password, and name required' });
        }

        // Check if username already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

        // Generate unique ID number
        const idNumber = Math.floor(10000 + Math.random() * 90000).toString();

        // Get phone and location from request
        const { phone, location } = req.body;

        // Insert user
        const result = await db.query(
            `INSERT INTO users (username, password_hash, name, email, role, id_number, phone, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, username, name, email, role, id_number, phone, location`,
            [username, passwordHash, name, email, 'user', idNumber, phone || null, location || null]
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // Log audit
        await db.query(
            'INSERT INTO audit_log (user_id, username, action, details) VALUES ($1, $2, $3, $4)',
            [user.id, user.username, 'SIGNUP', JSON.stringify({ ip: req.ip })]
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                idNumber: user.id_number,
                phone: user.phone,
                location: user.location
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Public endpoint to get list of locations (for signup form)
// This must be placed BEFORE /profile route to avoid conflicts
router.get('/locations', async (req, res) => {
    console.log('[AUTH] GET /locations endpoint hit');
    try {
        // Get all locations from locations table
        const locationsFromTable = await db.query(
            'SELECT DISTINCT name FROM locations ORDER BY name'
        );

        // Get all unique location names from users that don't exist in locations table
        const userLocations = await db.query(
            `SELECT DISTINCT u.location as name
             FROM users u
             WHERE u.location IS NOT NULL 
                   AND u.location != ''
                   AND u.is_active = true
                   AND u.location NOT IN (SELECT name FROM locations)
             ORDER BY u.location`
        );

        // Combine and deduplicate location names
        const allLocations = new Set();
        locationsFromTable.rows.forEach(row => allLocations.add(row.name));
        userLocations.rows.forEach(row => allLocations.add(row.name));

        const locationNames = Array.from(allLocations).sort();

        console.log('[AUTH] Returning locations:', locationNames.length);

        res.json({
            success: true,
            locations: locationNames.map(name => ({ name }))
        });

    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users (for viewing accounts)
router.get('/users', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, username, name, email, role, id_number, 
                    created_at, last_login, is_active 
             FROM users 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            users: result.rows.map(user => ({
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                idNumber: user.id_number,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                isActive: user.is_active
            }))
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user profile (authenticated user)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await db.query(
            `SELECT id, username, name, email, phone, location, role, id_number, 
                    created_at, last_login, is_active
             FROM users 
             WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.location,
                role: user.role,
                idNumber: user.id_number,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                isActive: user.is_active
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update current user profile (authenticated user can update their own profile)
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, phone, location } = req.body;

        // Validate required fields
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Check if email is already taken by another user
        if (email) {
            const emailCheck = await db.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        const result = await db.query(
            `UPDATE users 
             SET name = $1, email = $2, phone = $3, location = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING id, username, name, email, phone, location, role, id_number`,
            [name.trim(), email || null, phone || null, location || null, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.location,
                role: user.role,
                idNumber: user.id_number
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
