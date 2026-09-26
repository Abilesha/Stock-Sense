import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import OperationsListPage from './pages/OperationsListPage';
import OperationDetailPage from './pages/OperationDetailPage';
import MoveHistoryPage from './pages/MoveHistoryPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setView] = useState('dashboard');
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [toast, setToast] = useState(null);

  // Theme support (dark by default, light optional)
  const [theme, setTheme] = useState(() => localStorage.getItem('stocksense_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stocksense_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 500 }}>
          Connecting to StockSense...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage setToast={setToast} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage setView={setView} setSelectedDocId={setSelectedDocId} setToast={setToast} />;
      case 'products':
        return <ProductsPage setToast={setToast} />;
      case 'receipts':
        return <OperationsListPage type="receipt" setView={setView} setSelectedDocId={setSelectedDocId} setToast={setToast} />;
      case 'receipt-detail':
        return <OperationDetailPage docId={selectedDocId} type="receipt" setView={setView} setToast={setToast} />;
      case 'deliveries':
        return <OperationsListPage type="delivery" setView={setView} setSelectedDocId={setSelectedDocId} setToast={setToast} />;
      case 'delivery-detail':
        return <OperationDetailPage docId={selectedDocId} type="delivery" setView={setView} setSelectedDocId={setSelectedDocId} setToast={setToast} />;
      case 'transfers':
        return <OperationsListPage type="transfer" setView={setView} setSelectedDocId={setSelectedDocId} setToast={setToast} />;
      case 'transfer-detail':
        return <OperationDetailPage docId={selectedDocId} type="transfer" setView={setView} setSelectedDocId={setSelectedDocId} setToast={setToast} />;
      case 'adjustments':
        return <OperationsListPage type="adjustment" setView={setView} setSelectedDocId={setSelectedDocId} setToast={setToast} />;
      case 'adjustment-detail':
        return <OperationDetailPage docId={selectedDocId} type="adjustment" setView={setView} setSelectedDocId={setSelectedDocId} setToast={setToast} />;
      case 'move-history':
        return <MoveHistoryPage setToast={setToast} />;
      case 'settings':
        return <SettingsPage setToast={setToast} />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <DashboardPage setView={setView} setSelectedDocId={setSelectedDocId} setToast={setToast} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        setView={setView}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="main-content">
        {renderCurrentView()}
      </main>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
