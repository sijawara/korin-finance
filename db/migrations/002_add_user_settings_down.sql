-- Down Migration: Removes User Settings
-- Description: Drops the user_settings table

-- Drop the table
DROP TABLE IF EXISTS user_settings;

-- Drop the index (will be dropped with the table but included for clarity)
DROP INDEX IF EXISTS idx_user_settings_profile_id; 