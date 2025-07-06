import './Toast.css';
import { FaCheckCircle } from 'react-icons/fa';

const Toast = ({ message, show }) => {
  return (
    <div className={`toast-container ${show ? 'show' : ''}`}>
      <FaCheckCircle color="var(--accent-green)" />
      <span>{message}</span>
    </div>
  );
};

export default Toast;
