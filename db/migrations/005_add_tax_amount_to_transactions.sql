-- Migration: Add tax_amount to transactions
-- Description: Adds a tax_amount column to the transactions table to track taxes separately

-- Add the tax_amount column
ALTER TABLE transactions ADD tax_amount DECIMAL(15, 2);

-- Create an index for the tax_amount column to optimize queries
CREATE INDEX idx_transactions_tax_amount ON transactions(tax_amount);

-- UP Migration finished

-- DOWN Migration (rollback)
-- ALTER TABLE transactions DROP COLUMN tax_amount; 