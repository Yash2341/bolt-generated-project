import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userId, firstName, username, referrerId } = event.queryStringParameters;

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'User ID is required' }) };
    }

    const usersStore = getStore('users');
    let userData = await usersStore.get(userId, { type: 'json' });

    // If user does not exist, create them
    if (!userData) {
      const referredBy = referrerId && referrerId !== userId ? referrerId : null;
      
      userData = {
        id: userId,
        firstName,
        username,
        balance: 0,
        referral_count: 0,
        referred_by: referredBy,
      };
      
      await usersStore.setJSON(userId, userData);

      // If they were referred, reward the referrer
      if (referredBy) {
        const referrerData = await usersStore.get(referredBy, { type: 'json' });
        // Ensure the referrer exists before trying to update
        if (referrerData) {
          referrerData.balance += 500;
          referrerData.referral_count += 1;
          await usersStore.setJSON(referredBy, referrerData);
        }
      }
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
