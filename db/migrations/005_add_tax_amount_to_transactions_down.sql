-- Migration: Remove tax_amount from transactions (DOWN migration)
-- Description: Removes the tax_amount column from the transactions table

-- Drop the index first
DROP INDEX IF EXISTS idx_transactions_tax_amount;

-- Remove the tax_amount column
ALTER TABLE transactions DROP COLUMN tax_amount; 