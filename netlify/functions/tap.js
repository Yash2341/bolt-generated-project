import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'User ID is required' }) };
    }

    const usersStore = getStore('users');
    const userData = await usersStore.get(userId, { type: 'json' });

    if (!userData) {
      return { statusCode: 404, body: JSON.stringify({ message: 'User not found. Please reload the app.' }) };
    }

    userData.balance += 10;
    await usersStore.setJSON(userId, userData);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newBalance: userData.balance }),
    };
  } catch (error) {
    console.error('Error in tap function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
