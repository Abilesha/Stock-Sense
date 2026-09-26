import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">User credentials and access role permissions.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '24px',
            }}
          >
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{user?.name || 'Inventory Manager'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
              <Shield size={16} /> Access Role
            </div>
            <span className="badge badge-ready" style={{ textTransform: 'capitalize' }}>
              {user?.role || 'manager'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
              <Mail size={16} /> Email Address
            </div>
            <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{user?.email}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
              <Calendar size={16} /> Database Engine
            </div>
            <span className="mono" style={{ fontSize: '12.5px', color: 'var(--accent)' }}>
              PostgreSQL 18 (Local)
            </span>
          </div>
        </div>

        <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
          <button className="btn btn-danger" onClick={logout} style={{ gap: '8px' }}>
            <LogOut size={16} /> Log Out from StockSense
          </button>
        </div>
      </div>
    </div>
  );
}
