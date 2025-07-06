import { getDb, ALL_TASKS } from './db.js';

const REWARD_FOR_REFERRER = 200;
const SOCIAL_TASKS_FOR_REWARD = 3;

async function handler(req) {
  const db = await getDb();
  const url = new URL(req.url);
  const path = url.pathname.replace('/.netlify/functions/api', '');
  const method = req.method;

  try {
    // User creation/retrieval
    if (path === '/user' && method === 'POST') {
      const { user } = JSON.parse(req.body);
      let userData = await db.get('SELECT * FROM users WHERE telegram_id = ?', user.id);
      if (!userData) {
        await db.run(
          'INSERT INTO users (telegram_id, first_name, username, balance) VALUES (?, ?, ?, ?)',
          user.id, user.first_name, user.username, 500 // Initial balance
        );
        userData = await db.get('SELECT * FROM users WHERE telegram_id = ?', user.id);
      }
      const referralCount = await db.get('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?', user.id);
      return {
        statusCode: 200,
        body: JSON.stringify({ ...userData, referral_count: referralCount.count }),
      };
    }

    // Get tasks status
    if (path === '/tasks' && method === 'GET') {
      const userId = url.searchParams.get('userId');
      const completedTasks = await db.all('SELECT task_id, completed_at FROM user_tasks WHERE user_id = ?', userId);
      const completedMap = new Map(completedTasks.map(t => [t.task_id, t.completed_at]));
      
      const user = await db.get('SELECT last_daily_claim FROM users WHERE telegram_id = ?', userId);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      const tasksWithStatus = ALL_TASKS.map(task => {
        let completed = completedMap.has(task.id);
        if (task.type === 'daily' && user.last_daily_claim && (now - user.last_daily_claim < twentyFourHours)) {
            completed = true;
        } else if (task.type === 'daily') {
            completed = false; // Can be claimed again
        }
        return { ...task, completed };
      });
      return { statusCode: 200, body: JSON.stringify(tasksWithStatus) };
    }

    // Claim task
    if (path === '/claim' && method === 'POST') {
      const { userId, taskId, taskType } = JSON.parse(req.body);
      const task = ALL_TASKS.find(t => t.id === taskId);
      if (!task) return { statusCode: 404, body: JSON.stringify({ message: 'Task not found' }) };

      const now = Date.now();
      await db.run('BEGIN TRANSACTION');

      if (taskType === 'daily') {
        const user = await db.get('SELECT last_daily_claim FROM users WHERE telegram_id = ?', userId);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (user.last_daily_claim && (now - user.last_daily_claim < twentyFourHours)) {
          await db.run('ROLLBACK');
          return { statusCode: 400, body: JSON.stringify({ message: 'Daily reward already claimed within 24h' }) };
        }
        await db.run('UPDATE users SET balance = balance + ?, last_daily_claim = ? WHERE telegram_id = ?', task.reward, now, userId);
      } else { // social task
        const existingClaim = await db.get('SELECT * FROM user_tasks WHERE user_id = ? AND task_id = ?', userId, taskId);
        if (existingClaim) {
          await db.run('ROLLBACK');
          return { statusCode: 400, body: JSON.stringify({ message: 'Task already completed' }) };
        }
        await db.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', task.reward, userId);
        await db.run('INSERT INTO user_tasks (user_id, task_id, completed_at) VALUES (?, ?, ?)', userId, taskId, now);
        
        // Check for referral reward
        const referral = await db.get('SELECT * FROM referrals WHERE referee_id = ? AND reward_claimed = 0', userId);
        if (referral) {
          const completedSocialTasks = await db.get(
            `SELECT COUNT(*) as count FROM user_tasks ut JOIN users u ON ut.user_id = u.telegram_id WHERE u.telegram_id = ? AND ut.task_id LIKE 'social_%'`,
            userId
          );
          if (completedSocialTasks.count >= SOCIAL_TASKS_FOR_REWARD) {
            await db.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', REWARD_FOR_REFERRER, referral.referrer_id);
            await db.run('UPDATE referrals SET reward_claimed = 1 WHERE referee_id = ?', userId);
          }
        }
      }
      
      await db.run('COMMIT');
      return { statusCode: 200, body: JSON.stringify({ message: 'Claim successful' }) };
    }

    // Connect wallet
    if (path === '/wallet' && method === 'POST') {
        const { telegramId, walletAddress } = JSON.parse(req.body);
        await db.run('UPDATE users SET wallet_address = ? WHERE telegram_id = ?', walletAddress, telegramId);
        return { statusCode: 200, body: JSON.stringify({ message: 'Wallet connected' }) };
    }

    // Handle referral
    if (path === '/referral' && method === 'POST') {
        const { refereeId, referrerId } = JSON.parse(req.body);
        if (refereeId !== referrerId) {
            await db.run('INSERT OR IGNORE INTO referrals (referrer_id, referee_id) VALUES (?, ?)', referrerId, refereeId);
        }
        return { statusCode: 200, body: JSON.stringify({ message: 'Referral processed' }) };
    }

    return { statusCode: 404, body: 'Not Found' };
  } catch (error) {
    console.error(error);
    await db.run('ROLLBACK').catch(() => {});
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
}

export const handler;
