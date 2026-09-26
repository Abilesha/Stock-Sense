import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Moon, Sun, User, LogOut, Package, ArrowDownLeft, ArrowUpRight, Repeat, Sliders, History, Settings, LayoutDashboard } from 'lucide-react';

export default function Navbar({ currentView, setView, theme, toggleTheme }) {
  const { user, logout } = useAuth();
  const [opsOpen, setOpsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const opsRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (opsRef.current && !opsRef.current.contains(e.target)) setOpsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOpsActive = ['receipts', 'receipt-detail', 'deliveries', 'delivery-detail', 'transfers', 'transfer-detail', 'adjustments', 'adjustment-detail'].includes(currentView);

  return (
    <header
      className="no-print"
      style={{
        background: 'var(--panel)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 20px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand & Left Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div
            onClick={() => setView('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <img
              src="/logo.png"
              alt="StockSense Logo"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                objectFit: 'cover',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              }}
            />
            <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: 'var(--text)' }}>
              StockSense
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className={`btn btn-ghost ${currentView === 'dashboard' ? 'active' : ''}`}
              style={{
                background: currentView === 'dashboard' ? 'var(--panel2)' : 'transparent',
                border: 'none',
                color: currentView === 'dashboard' ? 'var(--text)' : 'var(--text-muted)',
              }}
              onClick={() => setView('dashboard')}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>

            <button
              className={`btn btn-ghost ${currentView === 'products' ? 'active' : ''}`}
              style={{
                background: currentView === 'products' ? 'var(--panel2)' : 'transparent',
                border: 'none',
                color: currentView === 'products' ? 'var(--text)' : 'var(--text-muted)',
              }}
              onClick={() => setView('products')}
            >
              <Package size={16} />
              Products
            </button>

            {/* Operations Dropdown */}
            <div ref={opsRef} style={{ position: 'relative' }}>
              <button
                className={`btn btn-ghost ${isOpsActive ? 'active' : ''}`}
                style={{
                  background: isOpsActive ? 'var(--panel2)' : 'transparent',
                  border: 'none',
                  color: isOpsActive ? 'var(--text)' : 'var(--text-muted)',
                }}
                onClick={() => setOpsOpen(!opsOpen)}
              >
                Operations
                <ChevronDown size={14} style={{ transform: opsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {opsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '210px',
                    background: 'var(--panel)',
                    border: '1px solid var(--border2)',
                    borderRadius: '10px',
                    padding: '6px',
                    boxShadow: 'var(--shadow)',
                    zIndex: 200,
                  }}
                >
                  <button
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '9px 12px', fontSize: '13px' }}
                    onClick={() => { setView('receipts'); setOpsOpen(false); }}
                  >
                    <ArrowDownLeft size={16} color="var(--green)" />
                    Receipts (Incoming)
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '9px 12px', fontSize: '13px' }}
                    onClick={() => { setView('deliveries'); setOpsOpen(false); }}
                  >
                    <ArrowUpRight size={16} color="var(--blue)" />
                    Delivery Orders
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '9px 12px', fontSize: '13px' }}
                    onClick={() => { setView('transfers'); setOpsOpen(false); }}
                  >
                    <Repeat size={16} color="var(--purple)" />
                    Internal Transfers
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '9px 12px', fontSize: '13px' }}
                    onClick={() => { setView('adjustments'); setOpsOpen(false); }}
                  >
                    <Sliders size={16} color="var(--accent)" />
                    Stock Adjustments
                  </button>
                </div>
              )}
            </div>

            <button
              className={`btn btn-ghost ${currentView === 'move-history' ? 'active' : ''}`}
              style={{
                background: currentView === 'move-history' ? 'var(--panel2)' : 'transparent',
                border: 'none',
                color: currentView === 'move-history' ? 'var(--text)' : 'var(--text-muted)',
              }}
              onClick={() => setView('move-history')}
            >
              <History size={16} />
              Move History
            </button>

            <button
              className={`btn btn-ghost ${currentView === 'settings' ? 'active' : ''}`}
              style={{
                background: currentView === 'settings' ? 'var(--panel2)' : 'transparent',
                border: 'none',
                color: currentView === 'settings' ? 'var(--text)' : 'var(--text-muted)',
              }}
              onClick={() => setView('settings')}
            >
              <Settings size={16} />
              Settings
            </button>
          </nav>
        </div>

        {/* Right Action Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%', border: 'none' }}
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} color="var(--accent)" /> : <Moon size={17} />}
          </button>

          {/* User Profile */}
          <div ref={userRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--panel2)',
                border: '1px solid var(--border2)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </button>

            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '230px',
                  background: 'var(--panel)',
                  border: '1px solid var(--border2)',
                  borderRadius: '10px',
                  padding: '8px',
                  boxShadow: 'var(--shadow)',
                  zIndex: 200,
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{user?.name || 'Inventory Manager'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user?.email}</div>
                  <span className="badge badge-ready" style={{ marginTop: '6px', fontSize: '10.5px' }}>{user?.role || 'Manager'}</span>
                </div>

                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '8px 10px', fontSize: '13px' }}
                  onClick={() => { setView('profile'); setUserMenuOpen(false); }}
                >
                  <User size={15} />
                  My Profile
                </button>

                <button
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none', padding: '8px 10px', fontSize: '13px', color: 'var(--red)' }}
                  onClick={() => { logout(); setUserMenuOpen(false); }}
                >
                  <LogOut size={15} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
