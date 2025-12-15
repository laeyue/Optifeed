-- Migration: Add phone and location columns to users table
-- Created: 2025-12-13

-- Add phone column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add location column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location VARCHAR(200);

-- Add comment
COMMENT ON COLUMN users.phone IS 'User phone number';
COMMENT ON COLUMN users.location IS 'User location/address';

-- Update existing users to have NULL values for these fields (already default)
-- No action needed as ALTER TABLE ADD COLUMN sets NULL by default

SELECT 'Migration completed: phone and location columns added to users table' AS status;
