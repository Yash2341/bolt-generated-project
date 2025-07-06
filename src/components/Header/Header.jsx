import { useApp } from '../../contexts/AppContext';
import { FaPlus } from 'react-icons/fa';
import { RiCopperDiamondLine } from "react-icons/ri";
import './Header.css';

const Header = ({ balance }) => {
  const { setActivePage } = useApp();

  const formatBalance = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <header className="app-header">
      <div className="balance-display">
        <RiCopperDiamondLine size={24} color="var(--gem-color)" />
        <span>{formatBalance(balance)}</span>
      </div>
      <button className="new-task-btn" onClick={() => setActivePage('newTask')}>
        <FaPlus size={12} />
        <span>New Task</span>
      </button>
    </header>
  );
};

export default Header;
