import db, { initializeDatabase } from './db/index.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await initializeDatabase();

    const { userId, firstName, username, referrerId } = event.queryStringParameters;

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'User ID is required' }) };
    }

    let userData;
    const tx = await db.transaction('write');
    try {
      // Check if user exists
      const existingUser = await tx.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        args: [userId],
      });

      if (existingUser.rows.length > 0) {
        userData = existingUser.rows[0];
      } else {
        // New user, create an entry
        const referredBy = referrerId && referrerId !== userId ? referrerId : null;
        
        await tx.execute({
          sql: 'INSERT INTO users (id, first_name, username, referred_by) VALUES (?, ?, ?, ?)',
          args: [userId, firstName, username, referredBy],
        });

        // If referred, reward the referrer
        if (referredBy) {
          await tx.execute({
            sql: 'UPDATE users SET balance = balance + 500, referral_count = referral_count + 1 WHERE id = ?',
            args: [referredBy],
          });
        }
        
        // Fetch the newly created user data
        const newUser = await tx.execute({
            sql: 'SELECT * FROM users WHERE id = ?',
            args: [userId],
        });
        userData = newUser.rows[0];
      }
      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        balance: userData.balance,
        referral_count: userData.referral_count,
      }),
    };
  } catch (error) {
    console.error('Error in getUserData:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
