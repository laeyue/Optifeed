-- OptiFeed Database Schema for PostgreSQL
-- Feed Quality Sensor Monitoring System

-- Create database (run this separately as postgres superuser)
-- CREATE DATABASE optifeed;
-- \c optifeed;

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Store hashed passwords, never plain text
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
    id_number VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create index for faster username lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    address TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sensor types enum (for reference)
-- Types: moisture, temperature, protein, fat, fiber, ash, particle_size, color_spectrum, chemical

-- Sensors table
CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    location_name VARCHAR(100), -- Denormalized for quick access
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance', 'error')),
    username VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    calibration_date TIMESTAMP WITH TIME ZONE,
    next_calibration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB -- Store additional sensor-specific config
);

CREATE INDEX idx_sensors_user_id ON sensors(user_id);
CREATE INDEX idx_sensors_username ON sensors(username);
CREATE INDEX idx_sensors_status ON sensors(status);
CREATE INDEX idx_sensors_location_id ON sensors(location_id);

-- Sensor readings table (time-series data)
CREATE TABLE sensor_readings (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    reading_value DECIMAL(10, 4) NOT NULL,
    unit VARCHAR(20), -- e.g., %, °C, ppm
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    quality_status VARCHAR(20) CHECK (quality_status IN ('good', 'warning', 'critical', 'unknown')),
    metadata JSONB -- Store additional reading context
);

-- Create indexes for time-series queries
CREATE INDEX idx_sensor_readings_sensor_timestamp ON sensor_readings(sensor_id, timestamp DESC);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);

-- Sensor status history (track status changes)
CREATE TABLE sensor_status_history (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

CREATE INDEX idx_status_history_sensor ON sensor_status_history(sensor_id, changed_at DESC);

-- User preferences table
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    preferences JSONB, -- Store additional preferences
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table for tracking important actions
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- e.g., 'sensor', 'user', 'location'
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for sensor dashboard
CREATE VIEW sensor_dashboard AS
SELECT 
    s.id,
    s.name,
    s.sensor_type,
    s.location_name,
    s.status,
    s.username,
    s.calibration_date,
    s.next_calibration_date,
    u.name as user_name,
    u.role as user_role,
    CASE 
        WHEN s.calibration_date IS NULL THEN NULL
        WHEN CURRENT_DATE - s.calibration_date::date > 30 THEN 'overdue'
        WHEN CURRENT_DATE - s.calibration_date::date > 21 THEN 'due_soon'
        ELSE 'current'
    END as calibration_status,
    (SELECT reading_value 
     FROM sensor_readings 
     WHERE sensor_id = s.id 
     ORDER BY timestamp DESC 
     LIMIT 1) as latest_reading,
    (SELECT timestamp 
     FROM sensor_readings 
     WHERE sensor_id = s.id 
     ORDER BY timestamp DESC 
     LIMIT 1) as latest_reading_time
FROM sensors s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.status != 'offline' OR s.status IS NULL;

-- Insert default admin and demo users (passwords should be hashed with bcrypt in production)
-- Password for both: 'admin123' and 'user123' (these are just examples - HASH THEM!)
INSERT INTO users (username, password_hash, name, email, role, id_number) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin@optifeed.com', 'admin', '10001'),
('user', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Factory Operator', 'operator@optifeed.com', 'user', '10002'),
('operator1', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Operator 1', 'operator1@optifeed.com', 'user', '10003')
ON CONFLICT (username) DO NOTHING;

-- Insert sample locations
INSERT INTO locations (name, description, address, created_by) VALUES
('Factory A - Line 1', 'Main production line for feed mixing', '123 Industrial Blvd, Building A', 1),
('Factory A - Line 2', 'Secondary production line', '123 Industrial Blvd, Building A', 1),
('Factory B - Quality Lab', 'Quality control laboratory', '456 Quality St, Building B', 1),
('Warehouse - Storage Area', 'Raw materials storage', '789 Storage Ave, Building C', 1)
ON CONFLICT DO NOTHING;

-- Insert sample sensors
INSERT INTO sensors (name, sensor_type, location_id, location_name, status, username, user_id, calibration_date) VALUES
('Moisture Sensor MS-01', 'moisture', 1, 'Factory A - Line 1', 'online', 'admin', 1, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('Temperature Sensor TS-01', 'temperature', 1, 'Factory A - Line 1', 'online', 'admin', 1, CURRENT_TIMESTAMP - INTERVAL '10 days'),
('Protein Analyzer PA-01', 'protein', 3, 'Factory B - Quality Lab', 'online', 'user', 2, CURRENT_TIMESTAMP - INTERVAL '7 days'),
('Color Spectrum CS-01', 'color_spectrum', 2, 'Factory A - Line 2', 'online', 'operator1', 3, CURRENT_TIMESTAMP - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

-- Function to generate sample sensor readings (for testing)
CREATE OR REPLACE FUNCTION generate_sample_readings(
    p_sensor_id INTEGER,
    p_hours_back INTEGER DEFAULT 24,
    p_interval_minutes INTEGER DEFAULT 5
)
RETURNS void AS $$
DECLARE
    v_timestamp TIMESTAMP WITH TIME ZONE;
    v_value DECIMAL(10,4);
    v_sensor_type VARCHAR(50);
BEGIN
    -- Get sensor type
    SELECT sensor_type INTO v_sensor_type FROM sensors WHERE id = p_sensor_id;
    
    v_timestamp := CURRENT_TIMESTAMP - (p_hours_back || ' hours')::INTERVAL;
    
    WHILE v_timestamp <= CURRENT_TIMESTAMP LOOP
        -- Generate random values based on sensor type
        CASE v_sensor_type
            WHEN 'moisture' THEN v_value := 10 + (random() * 5);
            WHEN 'temperature' THEN v_value := 20 + (random() * 10);
            WHEN 'protein' THEN v_value := 15 + (random() * 10);
            WHEN 'fat' THEN v_value := 3 + (random() * 2);
            WHEN 'fiber' THEN v_value := 2 + (random() * 3);
            ELSE v_value := random() * 100;
        END CASE;
        
        INSERT INTO sensor_readings (sensor_id, reading_value, timestamp, quality_status)
        VALUES (p_sensor_id, v_value, v_timestamp, 'good');
        
        v_timestamp := v_timestamp + (p_interval_minutes || ' minutes')::INTERVAL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate sample readings for the demo sensors (24 hours of data, every 5 minutes)
SELECT generate_sample_readings(1, 24, 5);
SELECT generate_sample_readings(2, 24, 5);
SELECT generate_sample_readings(3, 24, 5);
SELECT generate_sample_readings(4, 24, 5);

COMMENT ON TABLE users IS 'System users with authentication credentials';
COMMENT ON TABLE sensors IS 'Sensor devices deployed across locations';
COMMENT ON TABLE sensor_readings IS 'Time-series data from sensor measurements';
COMMENT ON TABLE locations IS 'Physical locations where sensors are deployed';
COMMENT ON TABLE audit_log IS 'Audit trail for security and compliance';
