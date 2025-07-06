import db from './db/index.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'User ID is required' }) };
    }

    // Increment balance by 10
    await db.execute({
      sql: 'UPDATE users SET balance = balance + 10 WHERE id = ?',
      args: [userId],
    });

    // Fetch the new balance
    const result = await db.execute({
      sql: 'SELECT balance FROM users WHERE id = ?',
      args: [userId],
    });

    const newBalance = result.rows.length > 0 ? result.rows[0].balance : 0;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newBalance }),
    };
  } catch (error) {
    console.error('Error in tap function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
