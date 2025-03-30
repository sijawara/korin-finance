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

## Currency Information

All GET API responses include the user's preferred currency code from user settings. This allows clients to correctly format monetary values according to the user's preferences.

## Authentication

All API endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Categories API

### GET /api/categories

Get all categories with pagination and filtering options.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Filter by category type (INCOME or EXPENSE)
- `parentOnly`: Filter to only show parent categories (true/false)
- `search`: Search in name and description

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Category Name",
      "type": "INCOME|EXPENSE",
      "color": "#hexcolor",
      "description": "Description text",
      "parent_id": "parent-uuid",
      "is_parent": true|false,
      "profile_id": "user-uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "usage_count": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "meta": {
    "currency": "IDR"
  }
}
```

### POST /api/categories

Create a new category.

**Request Body:**

```json
{
  "name": "Category Name",
  "type": "INCOME|EXPENSE",
  "color": "#hexcolor",
  "description": "Optional description",
  "parent_id": "optional-parent-uuid",
  "is_parent": true|false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "name": "Category Name",
    "type": "INCOME|EXPENSE",
    "color": "#hexcolor",
    "description": "Optional description",
    "parent_id": "optional-parent-uuid",
    "is_parent": true|false,
    "profile_id": "user-uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### GET /api/categories/:id

Get a specific category by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Category Name",
    "type": "INCOME|EXPENSE",
    "color": "#hexcolor",
    "description": "Description text",
    "parent_id": "parent-uuid",
    "is_parent": true|false,
    "profile_id": "user-uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "usage_count": 5
  },
  "meta": {
    "currency": "IDR"
  }
}
```

### PATCH /api/categories/:id

Update a specific category.

**Request Body:**

```json
{
  "name": "Updated Name",
  "type": "INCOME|EXPENSE",
  "color": "#newcolor",
  "description": "Updated description",
  "parent_id": "new-parent-uuid",
  "is_parent": true|false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "type": "INCOME|EXPENSE",
    "color": "#newcolor",
    "description": "Updated description",
    "parent_id": "new-parent-uuid",
    "is_parent": true|false,
    "profile_id": "user-uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### DELETE /api/categories/:id

Delete a specific category.

**Response:**

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

## Transactions API

### GET /api/transactions

Get all transactions with pagination and filtering options.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category ID
- `startDate`: Filter by start date (YYYY-MM-DD)
- `endDate`: Filter by end date (YYYY-MM-DD)
- `status`: Filter by status (PAID or UNPAID)
- `search`: Search in description and notes

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "date": "2024-03-28",
      "description": "Transaction description",
      "amount": 123.45,
      "status": "PAID|UNPAID",
      "notes": "Optional notes",
      "category_id": "category-uuid",
      "profile_id": "user-uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "category_name": "Category Name",
      "category_color": "#hexcolor"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "meta": {
    "currency": "IDR"
  }
}
```

### POST /api/transactions

Create a new transaction.

**Request Body:**

```json
{
  "date": "2024-03-28",
  "description": "Transaction description",
  "amount": 123.45,
  "status": "PAID|UNPAID",
  "notes": "Optional notes",
  "category_id": "category-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "date": "2024-03-28",
    "description": "Transaction description",
    "amount": 123.45,
    "status": "PAID|UNPAID",
    "notes": "Optional notes",
    "category_id": "category-uuid",
    "profile_id": "user-uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### GET /api/transactions/:id

Get a specific transaction by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2024-03-28",
    "description": "Transaction description",
    "amount": 123.45,
    "status": "PAID|UNPAID",
    "notes": "Optional notes",
    "category_id": "category-uuid",
    "profile_id": "user-uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "category_name": "Category Name",
    "category_color": "#hexcolor"
  },
  "meta": {
    "currency": "IDR"
  }
}
```

### PATCH /api/transactions/:id

Update a specific transaction.

**Request Body:**

```json
{
  "date": "2024-03-29",
  "description": "Updated description",
  "amount": 150.0,
  "status": "PAID|UNPAID",
  "notes": "Updated notes",
  "category_id": "new-category-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2024-03-29",
    "description": "Updated description",
    "amount": 150.0,
    "status": "PAID|UNPAID",
    "notes": "Updated notes",
    "category_id": "new-category-uuid",
    "profile_id": "user-uuid",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### DELETE /api/transactions/:id

Delete a specific transaction.

**Response:**

```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

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
    "endDate": "2024-03-31",
    "currency": "IDR"
  }
}
```

## Reports API

Reports provide advanced analytics and insights on financial data.

### Common Query Parameters for All Report Endpoints

All report endpoints accept the following query parameter:

- `period`: Time period for report data (default: "this-month")
  - Options: "this-month", "last-month", "last-3-months", "last-6-months", "year-to-date", "last-year", "all-time"

### GET /api/reports/overview

Get a comprehensive financial overview with health metrics, income and spending metrics, time series data, and recommendations.

**Response:**

```json
{
  "success": true,
  "data": {
    "financialHealth": {
      "score": 78,
      "description": "Good",
      "netIncome": 3077.12,
      "savingsRate": 25.8,
      "expenseToIncomeRatio": 74.2,
      "monthlyChange": -5.3,
      "budgetStatus": "On track"
    },
    "incomeMetrics": {
      "totalIncome": 5500.0,
      "incomeToExpenseRatio": 1.35,
      "disposableIncome": 3077.12,
      "incomeSources": 3,
      "primarySourcePercentage": 60.2
    },
    "spendingMetrics": {
      "totalExpenses": 2422.88,
      "dailyAverage": 78.16,
      "volatility": 15.3,
      "topCategory": {
        "name": "Housing",
        "percentage": 35.4
      },
      "categoriesCount": 8
    },
    "timeSeries": {
      "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
      "income": [1200, 1800, 1500, 1000],
      "expenses": [600, 800, 500, 522.88]
    },
    "recommendations": {
      "shouldIncreaseSavings": false,
      "shouldImproveIncomeOutflow": false,
      "shouldBudget": false,
      "shouldDiversifyIncome": false,
      "shouldInvest": true
    },
    "period": {
      "startDate": "2024-03-01",
      "endDate": "2024-03-31",
      "label": "March 2024"
    }
  },
  "meta": {
    "currency": "IDR"
  }
}
```

### GET /api/reports/categories

Get detailed breakdown of income and expense categories with usage statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "incomeCategories": [
      {
        "name": "Salary",
        "amount": 3300.0,
        "percentage": 60.0,
        "transactions": 1
      },
      {
        "name": "Freelance",
        "amount": 1200.0,
        "percentage": 21.8,
        "transactions": 3
      },
      {
        "name": "Investments",
        "amount": 1000.0,
        "percentage": 18.2,
        "transactions": 2
      }
    ],
    "expenseCategories": [
      {
        "name": "Housing",
        "amount": 850.0,
        "percentage": 35.1,
        "transactions": 1
      },
      {
        "name": "Food",
        "amount": 520.5,
        "percentage": 21.5,
        "transactions": 12
      },
      {
        "name": "Transportation",
        "amount": 325.38,
        "percentage": 13.4,
        "transactions": 8
      }
    ],
    "summary": {
      "totalIncome": 5500.0,
      "totalExpenses": 2422.88,
      "incomeCategoriesCount": 3,
      "expenseCategoriesCount": 8,
      "topIncomeCategory": "Salary",
      "topIncomePercentage": 60.0,
      "topExpenseCategory": "Housing",
      "topExpensePercentage": 35.1
    },
    "period": {
      "startDate": "2024-03-01",
      "endDate": "2024-03-31",
      "label": "March 2024"
    }
  },
  "meta": {
    "currency": "IDR"
  }
}
```

### GET /api/reports/spending-trends

Get spending trend analysis with time series data and insights.

**Response:**

```json
{
  "success": true,
  "data": {
    "timeSeries": {
      "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
      "expenses": [600, 800, 500, 522.88],
      "income": [1200, 1800, 1500, 1000]
    },
    "topCategories": [
      {
        "name": "Housing",
        "amount": 850.0,
        "percentage": 35.1,
        "transactions": 1
      },
      {
        "name": "Food",
        "amount": 520.5,
        "percentage": 21.5,
        "transactions": 12
      },
      {
        "name": "Transportation",
        "amount": 325.38,
        "percentage": 13.4,
        "transactions": 8
      }
    ],
    "insights": {
      "fastestGrowingCategory": "Food",
      "monthWithHighestSpending": "March 2024",
      "averageMonthlySpending": 2422.88,
      "changeFromPrevious": -5.3
    },
    "totals": {
      "totalExpenses": 2422.88,
      "totalIncome": 5500.0,
      "netSavings": 3077.12,
      "savingsRate": 55.9
    },
    "periodLabel": "March 2024"
  },
  "meta": {
    "currency": "IDR"
  }
}
```

### GET /api/reports/income-statement

Get a detailed income statement with categorized income and expenses.

**Response:**

```json
{
  "success": true,
  "data": {
    "income": [
      {
        "category": "Salary",
        "amount": 3300.0,
        "percentage": 60.0
      },
      {
        "category": "Freelance",
        "amount": 1200.0,
        "percentage": 21.8
      },
      {
        "category": "Investments",
        "amount": 1000.0,
        "percentage": 18.2
      }
    ],
    "expenses": [
      {
        "category": "Housing",
        "subcategory": "Rent",
        "amount": 850.0,
        "percentage": 35.1
      },
      {
        "category": "Food",
        "subcategory": "Groceries",
        "amount": 320.5,
        "percentage": 13.2
      },
      {
        "category": "Food",
        "subcategory": "Dining Out",
        "amount": 200.0,
        "percentage": 8.3
      }
    ],
    "totals": {
      "totalIncome": 5500.0,
      "totalExpenses": 2422.88,
      "netIncome": 3077.12,
      "savingsRate": 55.9
    },
    "periodLabel": "March 2024"
  },
  "meta": {
    "currency": "IDR"
  }
}
```

### GET /api/reports/accounts

Get accounts receivable and payable information with transaction details.

**Response:**

```json
{
  "success": true,
  "receivable": {
    "total": 1200.0,
    "paid": 0,
    "unpaid": 1200.0,
    "overdue": 500.0,
    "count": 3,
    "overdueCount": 1,
    "transactions": [
      {
        "id": "uuid",
        "description": "Client Project Payment",
        "transactionDate": "2024-03-15",
        "dueDate": "2024-04-15",
        "amount": 700.0,
        "status": "UNPAID",
        "daysOverdue": -10
      },
      {
        "id": "uuid",
        "description": "Freelance Work",
        "transactionDate": "2024-02-28",
        "dueDate": "2024-03-28",
        "amount": 500.0,
        "status": "UNPAID",
        "daysOverdue": 5
      }
    ]
  },
  "payable": {
    "total": 750.0,
    "paid": 0,
    "unpaid": 750.0,
    "overdue": 0,
    "count": 2,
    "overdueCount": 0,
    "transactions": [
      {
        "id": "uuid",
        "description": "Office Supplies",
        "transactionDate": "2024-03-20",
        "dueDate": "2024-04-20",
        "amount": 250.0,
        "status": "UNPAID",
        "daysOverdue": -15
      },
      {
        "id": "uuid",
        "description": "Contractor Payment",
        "transactionDate": "2024-03-25",
        "dueDate": "2024-04-25",
        "amount": 500.0,
        "status": "UNPAID",
        "daysOverdue": -20
      }
    ]
  },
  "periodLabel": "March 2024",
  "meta": {
    "currency": "IDR"
  }
}
```

## Settings API

### GET /api/settings

Get user-specific application settings.

**Response:**

```json
{
  "success": true,
  "data": {
    "profile_id": "user-uuid",
    "currency": "IDR",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### POST /api/settings

Create or update user settings.

**Request Body:**

```json
{
  "currency": "USD"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "profile_id": "user-uuid",
    "currency": "USD",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```
