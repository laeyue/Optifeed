-- Migration: Add Pellet Measurements and Sessions Tables
-- Created: 2025-12-12

-- Measurement sessions table (tracks feeding/measurement sessions)
CREATE TABLE IF NOT EXISTS measurement_sessions (
    id SERIAL PRIMARY KEY,
    operator VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER, -- Calculated duration in seconds
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON measurement_sessions(user_id);
CREATE INDEX idx_sessions_operator ON measurement_sessions(operator);
CREATE INDEX idx_sessions_start_time ON measurement_sessions(start_time DESC);
CREATE INDEX idx_sessions_status ON measurement_sessions(status);

-- Pellet records table (individual measurements within sessions)
CREATE TABLE IF NOT EXISTS pellet_records (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES measurement_sessions(id) ON DELETE CASCADE,
    operator VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avg_size DECIMAL(10, 2) NOT NULL, -- Average pellet size in mm
    total_pellets INTEGER NOT NULL DEFAULT 0, -- Count of pellets in this measurement
    quality_rating VARCHAR(20) CHECK (quality_rating IN ('excellent', 'good', 'fair', 'poor')),
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB -- Store additional measurement data
);

CREATE INDEX idx_records_session_id ON pellet_records(session_id);
CREATE INDEX idx_records_user_id ON pellet_records(user_id);
CREATE INDEX idx_records_operator ON pellet_records(operator);
CREATE INDEX idx_records_timestamp ON pellet_records(timestamp DESC);

-- Reports table (generated reports from measurement data)
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- e.g., 'daily', 'weekly', 'custom'
    operator VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    total_measurements INTEGER DEFAULT 0,
    total_pellets INTEGER DEFAULT 0,
    average_size DECIMAL(10, 2),
    min_size DECIMAL(10, 2),
    max_size DECIMAL(10, 2),
    report_data JSONB, -- Store full report data and charts
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT false
);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_operator ON reports(operator);
CREATE INDEX idx_reports_generated_at ON reports(generated_at DESC);
CREATE INDEX idx_reports_date_range ON reports(date_from, date_to);

-- Apply updated_at trigger to new tables
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON measurement_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for session statistics
CREATE OR REPLACE VIEW session_statistics AS
SELECT 
    s.id,
    s.operator,
    s.user_id,
    s.start_time,
    s.end_time,
    s.duration_seconds,
    s.status,
    COUNT(r.id) as measurement_count,
    SUM(r.total_pellets) as total_pellets,
    AVG(r.avg_size) as avg_size,
    MIN(r.avg_size) as min_size,
    MAX(r.avg_size) as max_size,
    u.name as user_name
FROM measurement_sessions s
LEFT JOIN pellet_records r ON s.id = r.session_id
LEFT JOIN users u ON s.user_id = u.id
GROUP BY s.id, s.operator, s.user_id, s.start_time, s.end_time, s.duration_seconds, s.status, u.name;

COMMENT ON TABLE measurement_sessions IS 'Tracks feeding/measurement session periods';
COMMENT ON TABLE pellet_records IS 'Individual pellet measurements and quality records';
COMMENT ON TABLE reports IS 'Generated reports from measurement data';
