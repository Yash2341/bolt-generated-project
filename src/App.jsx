import React, { useState, useEffect, useCallback } from 'react';

const tg = window.Telegram.WebApp;

// Updated with your bot details
const YOUR_BOT_USERNAME = "W7eurudbot"; 
const YOUR_TMA_NAME = "myapp";

function App() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [floatingTexts, setFloatingTexts] = useState([]);

  const showFloatingText = () => {
    const newText = { id: Date.now(), x: Math.random() * 50 - 25, y: Math.random() * 50 - 25 };
    setFloatingTexts(prev => [...prev, newText]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
    }, 1000);
  };

  const fetchUserData = useCallback(async () => {
    try {
      if (!tg.initDataUnsafe?.user) {
        // Mock user data for local development if needed
        if (window.location.hostname === 'localhost') {
          console.log("Running in dev mode, using mock user.");
          const mockUser = { id: 12345, first_name: 'Dev', username: 'devuser' };
          const mockReferrerId = null;
          setUser(mockUser);
          const queryParams = new URLSearchParams({
            userId: mockUser.id,
            firstName: mockUser.first_name,
            username: mockUser.username,
            referrerId: mockReferrerId || ''
          });
          const response = await fetch(`/api/getUserData?${queryParams.toString()}`);
          if (!response.ok) throw new Error('Failed to fetch mock user data.');
          const data = await response.json();
          setBalance(data.balance);
          setReferralCount(data.referral_count);
          setLoading(false);
          return;
        }
        setError("Could not verify Telegram user.");
        setLoading(false);
        return;
      }

      const userData = tg.initDataUnsafe.user;
      const referrerId = tg.initDataUnsafe.start_param;
      
      setUser(userData);

      const queryParams = new URLSearchParams({
        userId: userData.id,
        firstName: userData.first_name,
        username: userData.username || '',
        referrerId: referrerId || ''
      });

      const response = await fetch(`/api/getUserData?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data from server.');
      }
      const data = await response.json();
      setBalance(data.balance);
      setReferralCount(data.referral_count);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    tg.ready();
    tg.expand();
    fetchUserData();
  }, [fetchUserData]);

  const handleTap = async () => {
    if (!user) return;

    showFloatingText();

    // Optimistic update
    setBalance(prev => prev + 10);

    try {
      const response = await fetch('/api/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        // Revert on error
        setBalance(prev => prev - 10);
        throw new Error('Tap failed on server.');
      }
      
      const data = await response.json();
      // Sync with server state
      setBalance(data.newBalance);

    } catch (err) {
      console.error(err);
      // Optionally show an error to the user
    }
  };

  const handleCopyReferral = () => {
    if (!user) return;
    const referralLink = `https://t.me/${YOUR_BOT_USERNAME}/${YOUR_TMA_NAME}?startapp=${user.id}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      tg.showAlert('Referral link copied!');
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="loading">Error: {error}</div>;
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="user-info">Welcome, {user?.first_name}</div>
        <div className="balance-container">
          <img src="/coin.png" alt="coin" className="coin-icon-small" />
          <span className="balance">{balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="main-content">
        <button className="tap-button" onClick={handleTap}>
          <img src="/coin.png" alt="Tap Coin" className="coin-image" />
        </button>
        <p className="tap-info">+10 per tap</p>
        {floatingTexts.map(text => (
          <div 
            key={text.id} 
            className="floating-text"
            style={{ transform: `translate(${text.x}px, ${text.y}px)` }}
          >
            +10
          </div>
        ))}
      </div>

      <div className="referral-section">
        <p className="referral-info">
          You have <strong>{referralCount}</strong> referrals.
          <br />
          Earn <strong>500</strong> coins for each friend you invite!
        </p>
        <button className="copy-button" onClick={handleCopyReferral}>
          Copy Referral Link
        </button>
      </div>
    </div>
  );
}

export default App;
