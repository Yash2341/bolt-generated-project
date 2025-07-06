noimport { getDb, SOCIAL_TASKS, MILESTONES } from './db.js';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const getOrCreateUser = async (db, user) => {
  let userData = await db.get('SELECT * FROM users WHERE telegram_id = ?', user.id);
  if (!userData) {
    await db.run(
      'INSERT INTO users (telegram_id, first_name, username, balance) VALUES (?, ?, ?, ?)',
      user.id, user.first_name, user.username, 0 // Start with 0 balance
    );
    userData = await db.get('SELECT * FROM users WHERE telegram_id = ?', user.id);
  }
  return userData;
};

const getInitialData = async (db, userId) => {
    const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', userId);
    if (!user) throw new Error('User not found');

    const referralCount = (await db.get('SELECT COUNT(*) as count FROM referrals WHERE referrer_id = ?', userId)).count;
    
    const now = Date.now();
    const dailyTasks = {
        checkIn: { claimed: user.last_daily_checkin && (now - user.last_daily_checkin < TWENTY_FOUR_HOURS_MS) },
        updateCheck: { claimed: user.last_update_check && (now - user.last_update_check < TWENTY_FOUR_HOURS_MS) }
    };

    const completedSocialTasks = await db.all('SELECT task_id FROM user_social_tasks WHERE user_id = ?', userId);
    const completedSocialIds = new Set(completedSocialTasks.map(t => t.task_id));
    const socialTasks = SOCIAL_TASKS.map(task => ({ ...task, completed: completedSocialIds.has(task.id) }));

    return {
        user: { ...user, referral_count: referralCount },
        dailyTasks,
        socialTasks,
        milestones: MILESTONES
    };
};

const handleClaim = async (db, body) => {
    const { userId, claimType, taskId } = body;
    const now = Date.now();
    const user = await db.get('SELECT * FROM users WHERE telegram_id = ?', userId);

    await db.run('BEGIN TRANSACTION');

    try {
        switch (claimType) {
            case 'daily_checkin':
                if (user.last_daily_checkin && (now - user.last_daily_checkin < TWENTY_FOUR_HOURS_MS)) {
                    throw new Error('Daily check-in already claimed.');
                }
                await db.run('UPDATE users SET balance = balance + ?, last_daily_checkin = ? WHERE telegram_id = ?', 50, now, userId);
                break;
            
            case 'update_check':
                 if (user.last_update_check && (now - user.last_update_check < TWENTY_FOUR_HOURS_MS)) {
                    throw new Error('Update reward already claimed.');
                }
                await db.run('UPDATE users SET balance = balance + ?, last_update_check = ? WHERE telegram_id = ?', 100, now, userId);
                break;

            case 'social':
                const task = SOCIAL_TASKS.find(t => t.id === taskId);
                if (!task) throw new Error('Task not found.');
                const isCompleted = await db.get('SELECT 1 FROM user_social_tasks WHERE user_id = ? AND task_id = ?', userId, taskId);
                if (isCompleted) throw new Error('Task already completed.');

                await db.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', task.reward, userId);
                await db.run('INSERT INTO user_social_tasks (user_id, task_id, completed_at) VALUES (?, ?, ?)', userId, taskId, now);
                break;

            default:
                throw new Error('Invalid claim type.');
        }
        await db.run('COMMIT');
        return { message: 'Claim successful' };
    } catch (error) {
        await db.run('ROLLBACK');
        throw error;
    }
};


async function handler(req) {
  const db = await getDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/.netlify/functions/api', '');
  const method = req.method;

  try {
    if (path === '/data' && method === 'GET') {
      const userId = url.searchParams.get('userId');
      const tgUser = JSON.parse(url.searchParams.get('user'));
      
      await getOrCreateUser(db, tgUser);
      const data = await getInitialData(db, userId);
      return { statusCode: 200, body: JSON.stringify(data) };
    }
    
    if (path.startsWith('/data')) { // Handle initial load with user data in query
        const userId = url.searchParams.get('userId');
        await getOrCreateUser(db, { id: userId, first_name: 'User', username: `user${userId}` });
        const data = await getInitialData(db, userId);
        return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (path === '/claim' && method === 'POST') {
        const body = JSON.parse(req.body);
        const result = await handleClaim(db, body);
        return { statusCode: 200, body: JSON.stringify(result) };
    }

    if (path === '/wallet' && method === 'POST') {
        const { telegramId, walletAddress } = JSON.parse(req.body);
        await db.run('UPDATE users SET wallet_address = ? WHERE telegram_id = ?', walletAddress, telegramId);
        return { statusCode: 200, body: JSON.stringify({ message: 'Wallet connected' }) };
    }

    return { statusCode: 404, body: 'Not Found' };
  } catch (error) {
    console.error('API Error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
}

export { handler };
