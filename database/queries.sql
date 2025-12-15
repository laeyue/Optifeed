-- Common SQL Queries for OptiFeed Application

-- ============================================
-- USER MANAGEMENT QUERIES
-- ============================================

-- Get user by username (for login)
SELECT id, username, password_hash, name, email, role, id_number, last_login
FROM users
WHERE username = 'admin' AND is_active = true;

-- Update last login time
UPDATE users
SET last_login = CURRENT_TIMESTAMP
WHERE username = 'admin';

-- Get all users (for admin dashboard)
SELECT id, username, name, email, role, id_number, created_at, last_login, is_active
FROM users
ORDER BY created_at DESC;

-- Create new user
INSERT INTO users (username, password_hash, name, email, role, id_number)
VALUES ('newuser', '$2b$10$hashed_password_here', 'New User', 'new@optifeed.com', 'user', '10004')
RETURNING id, username, name, role, id_number;

-- Update user profile
UPDATE users
SET name = 'Updated Name',
    email = 'updated@optifeed.com'
WHERE id = 1
RETURNING *;

-- Deactivate user (soft delete)
UPDATE users
SET is_active = false
WHERE id = 5;


-- ============================================
-- SENSOR MANAGEMENT QUERIES
-- ============================================

-- Get all sensors for a specific user
SELECT id, name, sensor_type, location_name, status, calibration_date, created_at
FROM sensors
WHERE username = 'operator1'
ORDER BY created_at DESC;

-- Get all sensors (admin view)
SELECT s.id, s.name, s.sensor_type, s.location_name, s.status, 
       s.calibration_date, s.username, u.name as user_name
FROM sensors s
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- Get sensors by status
SELECT id, name, sensor_type, location_name, username
FROM sensors
WHERE status = 'online';

-- Create new sensor
INSERT INTO sensors (name, sensor_type, location_id, location_name, status, username, user_id, calibration_date)
VALUES ('New Sensor', 'moisture', 1, 'Factory A - Line 1', 'offline', 'user', 2, CURRENT_TIMESTAMP)
RETURNING id, name, sensor_type, location_name, status;

-- Update sensor status
UPDATE sensors
SET status = 'online',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1
RETURNING *;

-- Update sensor calibration
UPDATE sensors
SET calibration_date = CURRENT_TIMESTAMP,
    next_calibration_date = CURRENT_TIMESTAMP + INTERVAL '30 days'
WHERE id = 1
RETURNING id, name, calibration_date, next_calibration_date;

-- Delete sensor
DELETE FROM sensors WHERE id = 10;

-- Get sensors needing calibration (older than 30 days)
SELECT id, name, sensor_type, location_name, username, calibration_date,
       CURRENT_DATE - calibration_date::date as days_since_calibration
FROM sensors
WHERE calibration_date IS NOT NULL
  AND CURRENT_DATE - calibration_date::date > 30
ORDER BY calibration_date ASC;


-- ============================================
-- SENSOR READINGS QUERIES
-- ============================================

-- Get latest reading for a sensor
SELECT reading_value, unit, timestamp, quality_status
FROM sensor_readings
WHERE sensor_id = 1
ORDER BY timestamp DESC
LIMIT 1;

-- Get recent readings for a sensor (last 24 hours)
SELECT reading_value, unit, timestamp, quality_status
FROM sensor_readings
WHERE sensor_id = 1
  AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Get hourly average readings for last 7 days
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    AVG(reading_value) as avg_value,
    MIN(reading_value) as min_value,
    MAX(reading_value) as max_value,
    COUNT(*) as reading_count
FROM sensor_readings
WHERE sensor_id = 1
  AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour DESC;

-- Insert new sensor reading
INSERT INTO sensor_readings (sensor_id, reading_value, unit, quality_status, timestamp)
VALUES (1, 12.5, '%', 'good', CURRENT_TIMESTAMP)
RETURNING id, reading_value, timestamp;

-- Bulk insert readings
INSERT INTO sensor_readings (sensor_id, reading_value, unit, timestamp)
VALUES 
    (1, 12.3, '%', CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
    (1, 12.5, '%', CURRENT_TIMESTAMP - INTERVAL '4 minutes'),
    (1, 12.4, '%', CURRENT_TIMESTAMP - INTERVAL '3 minutes');

-- Get readings for all sensors in a time range
SELECT sr.sensor_id, s.name as sensor_name, sr.reading_value, sr.timestamp
FROM sensor_readings sr
JOIN sensors s ON sr.sensor_id = s.id
WHERE sr.timestamp BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY sr.timestamp DESC;

-- Calculate statistics for a sensor
SELECT 
    COUNT(*) as total_readings,
    AVG(reading_value) as average,
    MIN(reading_value) as minimum,
    MAX(reading_value) as maximum,
    STDDEV(reading_value) as std_deviation
FROM sensor_readings
WHERE sensor_id = 1
  AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '24 hours';


-- ============================================
-- DASHBOARD QUERIES
-- ============================================

-- Get dashboard overview for user
SELECT 
    COUNT(*) FILTER (WHERE status = 'online') as online_sensors,
    COUNT(*) FILTER (WHERE status = 'offline') as offline_sensors,
    COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_sensors,
    COUNT(*) FILTER (WHERE CURRENT_DATE - calibration_date::date > 30) as needs_calibration
FROM sensors
WHERE username = 'user';

-- Get sensor status summary for admin
SELECT 
    status,
    COUNT(*) as count
FROM sensors
GROUP BY status
ORDER BY count DESC;

-- Get recent activity (last 10 sensor updates)
SELECT s.name, s.sensor_type, s.status, s.updated_at, u.name as updated_by
FROM sensors s
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.updated_at DESC
LIMIT 10;

-- Get sensors with latest readings using the view
SELECT *
FROM sensor_dashboard
WHERE username = 'user'
ORDER BY latest_reading_time DESC NULLS LAST;


-- ============================================
-- LOCATION QUERIES
-- ============================================

-- Get all locations
SELECT id, name, description, address, created_at
FROM locations
ORDER BY name;

-- Get sensors by location
SELECT l.name as location_name, 
       COUNT(s.id) as sensor_count,
       COUNT(s.id) FILTER (WHERE s.status = 'online') as online_count
FROM locations l
LEFT JOIN sensors s ON l.id = s.location_id
GROUP BY l.id, l.name
ORDER BY l.name;

-- Create new location
INSERT INTO locations (name, description, address, created_by)
VALUES ('New Factory Line', 'Production line 3', '123 Factory St', 1)
RETURNING id, name;


-- ============================================
-- AUDIT LOG QUERIES
-- ============================================

-- Log user action
INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details, ip_address)
VALUES (1, 'admin', 'UPDATE_SENSOR_STATUS', 'sensor', 5, '{"old_status": "offline", "new_status": "online"}', '192.168.1.100');

-- Get recent audit logs
SELECT al.id, al.username, al.action, al.entity_type, al.timestamp, al.details
FROM audit_log al
ORDER BY al.timestamp DESC
LIMIT 50;

-- Get audit logs for specific user
SELECT action, entity_type, entity_id, details, timestamp
FROM audit_log
WHERE user_id = 1
ORDER BY timestamp DESC;

-- Get audit logs for specific sensor
SELECT al.username, al.action, al.details, al.timestamp
FROM audit_log al
WHERE al.entity_type = 'sensor' 
  AND al.entity_id = 1
ORDER BY al.timestamp DESC;


-- ============================================
-- PERFORMANCE OPTIMIZATION QUERIES
-- ============================================

-- Analyze table statistics
ANALYZE sensor_readings;

-- Vacuum old data
VACUUM ANALYZE sensor_readings;

-- Delete old readings (older than 90 days)
DELETE FROM sensor_readings
WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days';

-- Create partition for sensor_readings by month (for large datasets)
-- This is advanced - only use if you have millions of records
CREATE TABLE sensor_readings_2025_01 PARTITION OF sensor_readings
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');


-- ============================================
-- USEFUL HELPER QUERIES
-- ============================================

-- Check database size
SELECT pg_size_pretty(pg_database_size('optifeed')) as database_size;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'sensors', COUNT(*) FROM sensors
UNION ALL
SELECT 'sensor_readings', COUNT(*) FROM sensor_readings
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log;

-- Check active connections
SELECT 
    datname as database,
    usename as username,
    application_name,
    state,
    query
FROM pg_stat_activity
WHERE datname = 'optifeed';
