This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Database Setup

This project uses PostgreSQL for data storage. Follow these steps to set up the database:

1. Install PostgreSQL on your machine if you haven't already
2. Create a new PostgreSQL database:
   ```bash
   createdb finance_korin
   ```
3. Run the database migration:
   ```bash
   psql -d finance_korin -f db/migrations/001_initial_schema.sql
   ```

### Environment Variables

Create a `.env` file in the root directory with the following content (adjust values as needed):

```
# Database Connection String
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_korin
```

### Running the App

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Structure

- `app/` - Next.js application code
  - `dashboard/` - Dashboard pages
    - `transactions/` - Transactions management pages
    - `categories/` - Categories management pages
  - `api/` - Backend API routes
    - `categories/` - Category management endpoints
    - `transactions/` - Transaction management endpoints
- `components/` - Reusable React components
- `db/` - Database migrations and documentation
- `lib/` - Utility functions and shared code
  - `db.ts` - Database connection and query functions
  - `env.ts` - Environment configuration
- `types/` - TypeScript type definitions

## API Routes

The application provides a RESTful API for managing transactions and categories. See the [API Documentation](app/api/README.md) for details on available endpoints.

Key API features:

- Category management (CRUD operations)
- Transaction management (CRUD operations with filtering)
- Transaction summary statistics

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
