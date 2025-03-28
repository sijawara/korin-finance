# API Routes Documentation

This directory contains the API routes for the finance application. The API follows REST conventions and returns JSON responses.

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": { ... }  // or "message" for success messages
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Categories API

### GET /api/categories

Get all categories with their usage counts.

### POST /api/categories

Create a new category.

**Request Body:**

```json
{
  "name": "Category Name",
  "type": "income|expense",
  "color": "#hexcolor",
  "icon": "optional-icon-name",
  "description": "Optional description",
  "parent_id": "optional-parent-uuid",
  "is_parent": true|false
}
```

### GET /api/categories/:id

Get a specific category by ID.

### PATCH /api/categories/:id

Update a specific category.

**Request Body:**

```json
{
  "name": "Updated Name",
  "type": "income|expense"
  // Other fields are optional
}
```

### DELETE /api/categories/:id

Delete a specific category.

## Transactions API

### GET /api/transactions

Get all transactions.

**Query Parameters:**

- `category`: Filter by category ID
- `startDate`: Filter by start date (YYYY-MM-DD)
- `endDate`: Filter by end date (YYYY-MM-DD)
- `status`: Filter by status

### POST /api/transactions

Create a new transaction.

**Request Body:**

```json
{
  "date": "2024-03-28",
  "description": "Transaction description",
  "amount": 123.45,
  "status": "completed|pending",
  "notes": "Optional notes",
  "category_id": "optional-category-uuid"
}
```

### GET /api/transactions/:id

Get a specific transaction by ID.

### PATCH /api/transactions/:id

Update a specific transaction.

**Request Body:**

```json
{
  "date": "2024-03-28",
  "description": "Updated description"
  // Other fields are optional
}
```

### DELETE /api/transactions/:id

Delete a specific transaction.

### GET /api/transactions/summary

Get summary statistics about transactions.

**Query Parameters:**

- `startDate`: Start date (YYYY-MM-DD) - defaults to first day of current month
- `endDate`: End date (YYYY-MM-DD) - defaults to last day of current month

**Response:**

```json
{
  "success": true,
  "data": {
    "total_income": 3500.0,
    "total_expenses": 422.88,
    "net_balance": 3077.12
  },
  "meta": {
    "startDate": "2024-03-01",
    "endDate": "2024-03-31"
  }
}
```
