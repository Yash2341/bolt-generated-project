import { useTonConnectUI } from '@tonconnect/ui-react';
import './WithdrawPage.css';
import { RiCopperDiamondLine } from 'react-icons/ri';

const WithdrawPage = ({ data }) => {
  const [tonConnectUI] = useTonConnectUI();
  const gemBalance = data.user.balance;
  const tonEquivalent = (gemBalance / 100000).toFixed(4); // 100,000 GEM = 1 TON (example rate)
  const minWithdrawalTon = 0.025;
  const minReferrals = 3;
  const progress = Math.min((parseFloat(tonEquivalent) / minWithdrawalTon) * 100, 100);

  return (
    <div className="withdraw-page">
      <h2>Withdraw from Earning</h2>
      <p>Securely withdraw your balance to your TON wallet.</p>

      <div className="withdraw-card">
        <div className="balance-info">
          <div className="ton-balance">
            <img src="https://ton.org/download/ton_symbol.svg" alt="TON" />
            {tonEquivalent} TON
          </div>
          <div className="gem-equivalent">
            = {gemBalance} <RiCopperDiamondLine color="var(--gem-color)" />
          </div>
        </div>
        <div className="total-withdrawn">
          Total Withdrawn: 0.0000 TON
        </div>
        <div className="progress-to-withdrawal">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-labels">
            <span>{tonEquivalent} / {minWithdrawalTon} TON</span>
            <span>{data.user.referral_count} / {minReferrals} referrals</span>
          </div>
        </div>
        <button className="connect-wallet-btn" onClick={() => tonConnectUI.openModal()}>
          {data.user.wallet_address ? 'Withdraw' : 'Connect Wallet'}
        </button>
        <div className="withdrawal-conditions">
          <p>Add more GEM to reach {minWithdrawalTon} TON. Invite more friends to reach {minReferrals} referrals.</p>
          <p>After requesting a withdrawal, please allow 1 hour for processing and confirmation.</p>
        </div>
      </div>

      <div className="payment-history">
        <h3>Payment History</h3>
        <p>No transactions yet.</p>
      </div>
    </div>
  );
};

export default WithdrawPage;
