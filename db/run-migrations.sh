#!/bin/bash

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-finance_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Directory containing migration files
MIGRATIONS_DIR="./migrations"

# Check for operation type (up or down)
OPERATION=${1:-"up"}

echo "Running database migrations ($OPERATION)..."

if [ "$OPERATION" = "up" ]; then
  # UP migrations - Apply in ascending order
  echo "Running 001_initial_schema.sql..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/001_initial_schema.sql"

  echo "Running 002_accounts_functions.sql..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/002_accounts_functions.sql"
  
  echo "Running 004_add_due_date_to_transactions.sql..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/004_add_due_date_to_transactions.sql"

elif [ "$OPERATION" = "down" ]; then
  # DOWN migrations - Apply in descending order
  echo "Rolling back 004_add_due_date_to_transactions.sql..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "ALTER TABLE transactions DROP COLUMN IF EXISTS due_date;"
  
  echo "Rolling back 003_drop_accounts_functions.sql..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/003_drop_accounts_functions.sql"

  # Add other down migrations here in reverse order if needed
else
  echo "Invalid operation: $OPERATION. Use 'up' or 'down'."
  exit 1
fi

echo "Database migrations completed successfully." 