-- Migration: Add User Settings
-- Description: Creates a user_settings table for storing user preferences

-- Create user_settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id VARCHAR(255) NOT NULL UNIQUE,
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on profile_id for faster user-specific queries
CREATE INDEX idx_user_settings_profile_id ON user_settings(profile_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comment on table and columns
COMMENT ON TABLE user_settings IS 'Stores user-specific application settings';
COMMENT ON COLUMN user_settings.profile_id IS 'Firebase user ID';
COMMENT ON COLUMN user_settings.currency IS 'User preferred currency code (e.g., IDR, USD)'; 