import { useApp } from '../../contexts/AppContext';
import { GoHome, GoTasklist, GoPeople } from 'react-icons/go';
import { LiaWalletSolid } from "react-icons/lia";
import './BottomNav.css';

const navItems = [
  { id: 'home', icon: GoHome, label: 'Home' },
  { id: 'earn', icon: GoTasklist, label: 'Earn' },
  { id: 'friends', icon: GoPeople, label: 'Friends' },
  { id: 'withdraw', icon: LiaWalletSolid, label: 'Withdraw' },
];

const BottomNav = () => {
  const { activePage, setActivePage } = useApp();

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${activePage === item.id ? 'active' : ''}`}
          onClick={() => setActivePage(item.id)}
        >
          <item.icon size={24} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
