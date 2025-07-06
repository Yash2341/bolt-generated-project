import './FriendsPage.css';
import { RiCopperDiamondLine } from 'react-icons/ri';
import { FaRegCopy, FaTelegramPlane } from 'react-icons/fa';
import { useApp } from '../../contexts/AppContext';

const FriendsPage = ({ data }) => {
  const { showToast } = useApp();
  const tg = window.Telegram.WebApp;
  const botUsername = "W7eurudbot"; // Replace with your bot username

  const inviteLink = `https://t.me/${botUsername}?start=${tg.initDataUnsafe?.user?.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      showToast('Invite link copied!');
    });
  };

  const shareOnTelegram = () => {
    const text = `Join me on Ton Basket and get rewards! 🔥\n\n${inviteLink}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="friends-page">
      <div className="leaderboard-timer">
        Leaderboard Reward Distribution in: 5d 15h 43m 26s
      </div>

      <h2>Invite Friends</h2>
      <p>You've invited {data.user.referral_count} friends</p>

      <div className="invite-card">
        Earn <RiCopperDiamondLine color="var(--gem-color)" /> 200 GEM + 10% of their total earnings!
      </div>

      <div className="unclaimed-reward-card">
        <div className="unclaimed-info">
          <RiCopperDiamondLine size={24} color="var(--ton-blue)" />
          <div>
            <span>0 GEM</span>
            <small>Unclaimed Reward</small>
          </div>
        </div>
        <button className="claim-btn">Claim</button>
      </div>

      <div className="action-buttons">
        <button onClick={copyToClipboard}><FaRegCopy /> Copy Invite Link</button>
        <button className="telegram-share" onClick={shareOnTelegram}><FaTelegramPlane /> Share via Telegram</button>
      </div>

      <div className="user-rank-card">
        <span>{tg.initDataUnsafe?.user?.first_name || 'You'}</span>
        <span>{data.user.referral_count} Refers</span>
        <span>#{data.user.rank || 'N/A'}</span>
      </div>

      <div className="leaderboard">
        <h3>Top 10 Referrals</h3>
        <ul className="leaderboard-list">
          {/* Placeholder data */}
          <li className="leaderboard-item"><span>1. TradingGain Official</span> <span>5 TON</span></li>
          <li className="leaderboard-item"><span>2. Chauhan Dev</span> <span>3 TON</span></li>
          <li className="leaderboard-item"><span>3. Nadir</span> <span>2 TON</span></li>
        </ul>
      </div>
    </div>
  );
};

export default FriendsPage;
