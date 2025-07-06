import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_FILE = '/tmp/miniapp.db';

let db = null;

const SOCIAL_TASKS = [
  { id: 'social_1', name: 'Join TonBasket Telegram', reward: 100, url: 'https://t.me/Airdrop' },
  { id: 'social_2', name: 'Join TradingGainX Telegram', reward: 100, url: 'https://t.me/Airdrop' },
  { id: 'social_3', name: 'Join TradingGain WhatsApp Channel', reward: 100, url: 'https://t.me/Airdrop' },
  { id: 'social_4', name: 'Join DevCrypto Calls Channel', reward: 50, url: 'https://t.me/Airdrop' },
  { id: 'social_5', name: 'Join Crypto WhatsApp Channel', reward: 100, url: 'https://t.me/Airdrop' },
];

const MILESTONES = [
    { id: 'milestone_1', name: 'Refer 5 Friends', required: 5, reward: 300 },
    { id: 'milestone_2', name: 'Refer 25 Friends', required: 25, reward: 1500 },
    { id: 'milestone_3', name: 'Refer 50 Friends', required: 50, reward: 3000 },
    { id: 'milestone_4', name: 'Refer 100 Friends', required: 100, reward: 6000 },
    { id: 'milestone_5', name: 'Refer 200 Friends', required: 200, reward: 12000 },
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
      last_daily_checkin INTEGER,
      last_update_check INTEGER
    );
    CREATE TABLE IF NOT EXISTS user_social_tasks (
      user_id INTEGER,
      task_id TEXT,
      completed_at INTEGER,
      PRIMARY KEY (user_id, task_id),
      FOREIGN KEY (user_id) REFERENCES users(telegram_id)
    );
    CREATE TABLE IF NOT EXISTS referrals (
      referrer_id INTEGER,
      referee_id INTEGER PRIMARY KEY,
      created_at INTEGER,
      FOREIGN KEY (referrer_id) REFERENCES users(telegram_id),
      FOREIGN KEY (referee_id) REFERENCES users(telegram_id)
    );
  `);

  return db;
}

export { SOCIAL_TASKS, MILESTONES };
