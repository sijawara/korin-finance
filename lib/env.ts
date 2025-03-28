/**
 * Environment variables for the application.
 * In a production environment, these would be loaded from
 * .env files or environment variables.
 */

// Default development configuration
const defaultEnv = {
  // Node environment
  NODE_ENV: "development",

  // Database configuration - using connection string for simplicity
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/finance_korin",

  // API configuration
  API_URL: "http://localhost:3000/api",

  // Application configuration
  APP_URL: "http://localhost:3000",
};

// Get environment variables with fallbacks to defaults
export const env = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || defaultEnv.NODE_ENV,

  // Database configuration - single connection string
  DATABASE_URL: process.env.DATABASE_URL || defaultEnv.DATABASE_URL,

  // API configuration
  API_URL: process.env.API_URL || defaultEnv.API_URL,

  // Application configuration
  APP_URL: process.env.APP_URL || defaultEnv.APP_URL,
};
