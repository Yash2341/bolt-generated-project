import { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from './contexts/AppContext';

import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import Header from './components/Header/Header';
import BottomNav from './components/BottomNav/BottomNav';
import HomePage from './pages/Home/HomePage';
import EarnPage from './pages/Earn/EarnPage';
import FriendsPage from './pages/Friends/FriendsPage';
import WithdrawPage from './pages/Withdraw/WithdrawPage';
import NewTaskPage from './pages/NewTask/NewTaskPage';

const fetchInitialData = async (user) => {
  if (!user || !user.id) return null;
  const response = await fetch(`/api/data?userId=${user.id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

function App() {
  const { activePage, setActivePage, showToast } = useApp();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const queryClient = useQueryClient();
  const tg = window.Telegram.WebApp;

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ['initialData', tg.initDataUnsafe?.user?.id],
    queryFn: () => fetchInitialData(tg.initDataUnsafe?.user),
    enabled: !!tg.initDataUnsafe?.user?.id,
    refetchOnWindowFocus: false,
  });

  const connectWalletMutation = useMutation({
    mutationFn: async (walletData) => {
      const response = await fetch(`/api/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walletData),
      });
      if (!response.ok) throw new Error('Failed to connect wallet');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['initialData', tg.initDataUnsafe?.user?.id]);
      showToast('Wallet Connected!');
    },
  });

  useEffect(() => {
    tg.ready();
    tg.expand();
    tg.setHeaderColor('secondary_bg_color');
    tg.setBackgroundColor('secondary_bg_color');
  }, [tg]);

  useEffect(() => {
    if (wallet && data && !data.user.wallet_address) {
      connectWalletMutation.mutate({
        telegramId: tg.initDataUnsafe.user.id,
        walletAddress: wallet.account.address,
      });
    }
  }, [wallet, data, connectWalletMutation, tg.initDataUnsafe.user]);

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage data={data} />;
      case 'earn':
        return <EarnPage data={data} />;
      case 'friends':
        return <FriendsPage data={data} />;
      case 'withdraw':
        return <WithdrawPage data={data} />;
      case 'newTask':
        return <NewTaskPage />;
      default:
        return <HomePage data={data} />;
    }
  };

  if (isLoading || !isSuccess) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header balance={data.user.balance} />
      <main style={{ flexGrow: 1, padding: '16px', paddingTop: '70px', paddingBottom: '90px' }}>
        {renderPage()}
      </main>
      <BottomNav />
    </div>
  );
}

export default App;
