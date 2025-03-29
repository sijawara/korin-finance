-- Migration: Add due_date to transactions
-- Description: Adds a nullable due_date column to the transactions table to support accounts receivable/payable reporting

-- Add the due_date column
ALTER TABLE transactions ADD due_date DATE;

-- Create an index for the due_date column to optimize queries
CREATE INDEX idx_transactions_due_date ON transactions(due_date);

-- UP Migration finished

-- DOWN Migration (rollback)
-- ALTER TABLE transactions DROP COLUMN due_date; 