import React, { createContext, useState, useContext } from 'react';
import Toast from '../components/Toast/Toast';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [activePage, setActivePage] = useState('home');
  const [toast, setToast] = useState({ message: '', show: false });

  const showToast = (message) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };

  const value = {
    activePage,
    setActivePage,
    showToast,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toast message={toast.message} show={toast.show} />
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
