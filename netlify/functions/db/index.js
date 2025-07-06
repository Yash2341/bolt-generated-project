import { createClient } from '@libsql/client';

// Create a new client instance
const client = createClient({
  // IMPORTANT: Replace with your Turso DB URL and Auth Token
  // You should store these in Netlify environment variables
  url: process.env.DB_URL,
  authToken: process.env.DB_AUTH_TOKEN,
});

// Function to ensure the 'users' table exists
export async function initializeDatabase() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      first_name TEXT,
      username TEXT,
      balance INTEGER DEFAULT 0,
      referral_count INTEGER DEFAULT 0,
      referred_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export default client;
