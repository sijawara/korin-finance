-- Migration: Initial Schema
-- Description: Creates the initial database schema for the finance application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table with hierarchical structure
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    color VARCHAR(50),
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_parent BOOLEAN NOT NULL DEFAULT false,
    profile_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on parent_id for faster hierarchical queries
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
-- Create index on profile_id for faster user-specific queries
CREATE INDEX idx_categories_profile_id ON categories(profile_id);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PAID', 'UNPAID')) DEFAULT 'UNPAID',
    notes TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    profile_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
-- Create index on profile_id for faster user-specific queries
CREATE INDEX idx_transactions_profile_id ON transactions(profile_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to calculate a category's usage count
CREATE OR REPLACE FUNCTION get_category_usage_count(category_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
   count_val INTEGER;
BEGIN
   SELECT COUNT(*) INTO count_val FROM transactions WHERE category_id = category_uuid;
   RETURN count_val;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate summary information for a specific profile
CREATE OR REPLACE FUNCTION get_transaction_summary(start_date DATE, end_date DATE, user_profile_id VARCHAR)
RETURNS TABLE (
    total_income DECIMAL(15, 2),
    total_expenses DECIMAL(15, 2),
    net_balance DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(amount), 0) as net_balance
    FROM 
        transactions
    WHERE 
        date BETWEEN start_date AND end_date
        AND profile_id = user_profile_id;
END;
$$ LANGUAGE plpgsql; 