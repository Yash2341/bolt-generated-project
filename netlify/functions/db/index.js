import { createClient } from '@libsql/client';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Define the path for the SQLite file in the temporary directory
const dbPath = '/tmp/data.sqlite';
const dbDir = dirname(dbPath);

// Ensure the directory exists because Netlify's temp environment can be empty
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Create a new client instance pointing to the local file.
// WARNING: This file will be deleted when the function execution ends.
// ALL DATA WILL BE LOST.
const client = createClient({
  url: `file:${dbPath}`,
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
