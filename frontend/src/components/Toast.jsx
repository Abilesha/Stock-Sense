import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2000,
        minWidth: '320px',
        maxWidth: '460px',
        background: 'var(--panel2)',
        border: `1px solid ${isError ? 'var(--red)' : isSuccess ? 'var(--green)' : 'var(--border2)'}`,
        borderRadius: '10px',
        padding: '14px 16px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        animation: 'slideUp 0.25s ease-out',
      }}
    >
      <div style={{ marginTop: '2px', flexShrink: 0 }}>
        {isError && <AlertCircle size={20} color="var(--red)" />}
        {isSuccess && <CheckCircle size={20} color="var(--green)" />}
        {!isError && !isSuccess && <Info size={20} color="var(--blue)" />}
      </div>
      <div style={{ flex: 1 }}>
        {toast.title && <div style={{ fontWeight: 600, fontSize: '13.5px', marginBottom: '2px' }}>{toast.title}</div>}
        <div style={{ fontSize: '13px', color: 'var(--text)', wordBreak: 'break-word' }}>{toast.message}</div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '2px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
