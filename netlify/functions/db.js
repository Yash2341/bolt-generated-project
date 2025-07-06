import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_FILE = '/tmp/miniapp.db';

let db = null;

const ALL_TASKS = [
  { id: 'daily_1', name: 'Daily Reward', reward: 100, type: 'daily' },
  { id: 'social_1', name: 'Join Telegram', reward: 500, type: 'social', url: 'https://t.me/Airdrop', icon: '/telegram.svg' },
  { id: 'social_2', name: 'Follow on X', reward: 500, type: 'social', url: 'https://t.me/Airdrop', icon: '/x.svg' },
  { id: 'social_3', name: 'Subscribe YouTube', reward: 500, type: 'social', url: 'https://t.me/Airdrop', icon: '/youtube.svg' },
];

export async function getDb() {
  if (db) return db;

  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      first_name TEXT,
      username TEXT,
      balance INTEGER DEFAULT 0,
      wallet_address TEXT,
      last_daily_claim INTEGER
    );
    CREATE TABLE IF NOT EXISTS user_tasks (
      user_id INTEGER,
      task_id TEXT,
      completed_at INTEGER,
      PRIMARY KEY (user_id, task_id),
      FOREIGN KEY (user_id) REFERENCES users(telegram_id)
    );
    CREATE TABLE IF NOT EXISTS referrals (
      referrer_id INTEGER,
      referee_id INTEGER PRIMARY KEY,
      reward_claimed INTEGER DEFAULT 0,
      FOREIGN KEY (referrer_id) REFERENCES users(telegram_id),
      FOREIGN KEY (referee_id) REFERENCES users(telegram_id)
    );
  `);

  return db;
}

export { ALL_TASKS };
