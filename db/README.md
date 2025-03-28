# Database Migrations

This directory contains the database migrations for the finance application.

## Structure

- `migrations/` - Contains the SQL migration files
  - `001_initial_schema.sql` - Creates the initial database schema
  - `001_initial_schema_down.sql` - Reverts the initial schema

## How to Apply Migrations

You can apply these migrations using a PostgreSQL client like `psql` or a migration tool like `migrate`, `flyway`, or `liquibase`.

### Using psql

```bash
# Connect to your database
psql -U your_user -d your_database

# Apply a migration
\i db/migrations/001_initial_schema.sql
```

### Using a Migration Tool

This project is set up to accommodate various migration tools. You can use the tool of your choice to apply these migrations.

## Database Schema

### Categories Table

The `categories` table has a hierarchical structure, allowing for parent-child relationships:

- `id` - Primary key (UUID)
- `name` - Category name
- `type` - Category type ('income' or 'expense')
- `color` - Color code for UI display
- `icon` - Icon name for UI display
- `description` - Category description
- `parent_id` - Reference to parent category (for hierarchical categories)
- `is_parent` - Flag indicating if this is a parent category
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Transactions Table

The `transactions` table stores all financial transactions:

- `id` - Primary key (UUID)
- `date` - Transaction date
- `description` - Transaction description
- `amount` - Transaction amount (positive for income, negative for expenses)
- `status` - Transaction status ('completed', 'pending', etc.)
- `notes` - Optional notes about the transaction
- `category_id` - Reference to the category
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Helper Functions

- `update_updated_at_column()` - Automatically updates the `updated_at` column on record updates
- `get_category_usage_count(UUID)` - Gets the number of transactions for a category
- `get_transaction_summary(DATE, DATE)` - Gets summary statistics for transactions in a date range
