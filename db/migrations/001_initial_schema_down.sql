-- Down Migration: Initial Schema
-- Description: Reverts the initial database schema

-- Drop triggers
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_category_usage_count(UUID);
DROP FUNCTION IF EXISTS get_transaction_summary(DATE, DATE);

-- Drop tables (order matters due to foreign key constraints)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS categories;

-- Drop the UUID extension if it was created by this migration
-- Note: Only do this if no other tables in your database use UUIDs
-- DROP EXTENSION IF EXISTS "uuid-ossp"; 