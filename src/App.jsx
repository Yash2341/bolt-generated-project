import { useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './App.css';
import TaskList from './components/TaskList';

const fetchUserData = async (user) => {
  if (!user || !user.id) return null;
  const response = await fetch(`/api/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user }),
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

const connectWallet = async ({ wallet, user }) => {
  if (!wallet || !user) return null;
  const response = await fetch(`/api/wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegramId: user.id,
      walletAddress: wallet.account.address,
    }),
  });
  if (!response.ok) throw new Error('Failed to connect wallet');
  return response.json();
};

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const queryClient = useQueryClient();
  const tg = window.Telegram.WebApp;

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user', tg.initDataUnsafe?.user?.id],
    queryFn: () => fetchUserData(tg.initDataUnsafe?.user),
    enabled: !!tg.initDataUnsafe?.user?.id,
  });

  const walletMutation = useMutation({
    mutationFn: connectWallet,
    onSuccess: () => {
      queryClient.invalidateQueries(['user', tg.initDataUnsafe?.user?.id]);
    },
  });

  useEffect(() => {
    tg.ready();
    tg.expand();
    
    const referrerId = tg.initDataUnsafe?.start_param;
    if (referrerId && tg.initDataUnsafe?.user) {
      fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refereeId: tg.initDataUnsafe.user.id,
          referrerId: referrerId,
        }),
      });
    }
  }, [tg]);

  useEffect(() => {
    if (wallet && userData && !userData.wallet_address) {
      walletMutation.mutate({ wallet, user: tg.initDataUnsafe.user });
    }
  }, [wallet, userData, walletMutation, tg.initDataUnsafe.user]);

  const formatBalance = (balance) => {
    return new Intl.NumberFormat().format(balance);
  };

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (error) {
    return <div className="loading-screen">Error: {error.message}</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="balance-card">
          <div className="balance-info">
            <p>Your Balance</p>
            <h2>
              <img src="/gem.svg" alt="Gem" className="gem-icon" />
              {formatBalance(userData?.balance || 0)}
            </h2>
          </div>
          <div className="wallet-connector">
            <button onClick={() => tonConnectUI.openModal()}>
              <img src="/ton.svg" alt="TON" className="ton-icon" />
              {wallet ? 'Wallet Connected' : 'Connect Wallet'}
            </button>
            {wallet && <p className="wallet-address">{`${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}`}</p>}
          </div>
        </div>
      </header>

      <main className="main-content">
        <TaskList user={tg.initDataUnsafe?.user} />
      </main>

      <footer className="footer">
        <div className="referral-card">
          <h3>Refer a friend</h3>
          <p>Invite a friend and get <span>200 Gems</span></p>
          <p className="referral-count">Your referrals: {userData?.referral_count || 0}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
