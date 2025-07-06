import { useState, useEffect } from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 10) + 1;
        return Math.min(prev + increment, 100);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container">
      <div className="logo-container">
        <img src="/logo.png" alt="Ton Basket Logo" className="logo" />
      </div>
      <p className="sync-text">Syncing profile...</p>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="progress-text">{progress}%</p>
      <div className="powered-by">
        <img src="https://ton.org/download/ton_symbol.svg" alt="TON Symbol" className="ton-symbol" />
        Powered by TON
      </div>
    </div>
  );
};

export default LoadingScreen;
