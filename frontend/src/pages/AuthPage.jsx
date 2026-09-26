import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthPage({ setToast }) {
  const { login, signup } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'reset'

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('ppraveen2150@gmail.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('manager');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setToast({ type: 'success', message: 'Logged in successfully.' });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password, role);
      setToast({ type: 'success', message: 'Account registered successfully! Please log in.' });
      setAuthMode('login');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setOtp('');
      setAuthMode('reset');
      setToast({
        type: 'info',
        title: 'OTP Sent',
        message: `A 6-digit verification code was sent to ${email}.`,
      });
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.resetPassword(email, otp, newPassword);
      setToast({ type: 'success', message: 'Password reset successful! Please log in.' });
      setPassword(newPassword);
      setAuthMode('login');
    } catch (err) {
      setError(err.message || 'Invalid OTP or failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 16px',
        backgroundImage: `url('/auth-bg.png')`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#eef2f6',
      }}
    >
      {/* Frosted Glassy Glow Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          borderRadius: '24px',
          padding: '40px 36px',
          boxShadow: '0 20px 50px rgba(30, 41, 59, 0.12), 0 0 35px rgba(245, 158, 11, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <img
            src="/logo.png"
            alt="StockSense Logo"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              objectFit: 'cover',
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.18)',
            }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '-0.02em', color: '#0f172a' }}>
              StockSense
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Smart Inventory Management
            </div>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              padding: '11px 14px',
              color: '#dc2626',
              fontSize: '13px',
              marginBottom: '18px',
              lineHeight: 1.5,
              wordBreak: 'break-word',
              fontWeight: 500,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '7px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(203, 213, 225, 0.9)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(203, 213, 225, 0.9)';
                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.03)';
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', margin: 0 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setError(''); setAuthMode('forgot'); }}
                  style={{ background: 'none', border: 'none', color: '#d97706', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(203, 213, 225, 0.9)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f59e0b';
                    e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(203, 213, 225, 0.9)';
                    e.target.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.03)';
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#ffffff',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                transition: 'transform 0.15s ease, filter 0.15s ease',
              }}
              onMouseOver={(e) => e.target.style.filter = 'brightness(1.06)'}
              onMouseOut={(e) => e.target.style.filter = 'none'}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '13.5px', color: '#64748b' }}>
              No account?{' '}
              <button
                type="button"
                onClick={() => { setError(''); setAuthMode('signup'); }}
                style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 700, fontSize: '13.5px', padding: 0, cursor: 'pointer' }}
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* 2. SIGNUP MODE */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                placeholder="e.g. Jordan Lee"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(203, 213, 225, 0.9)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(203, 213, 225, 0.9)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Assigned Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(203, 213, 225, 0.9)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#0f172a',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              >
                <option value="manager">Inventory Manager (Receipts & Deliveries)</option>
                <option value="staff">Warehouse Staff (Transfers & Physical Counting)</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Password (Min. 6 characters)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(203, 213, 225, 0.9)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title={showSignupPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#ffffff',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
              }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13.5px', color: '#64748b' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setError(''); setAuthMode('login'); }}
                style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 700, fontSize: '13.5px', padding: 0, cursor: 'pointer' }}
              >
                Log in
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Reset Password
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                Enter your registered email address. We will dispatch a 6-digit verification code to your email inbox.
              </p>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(203, 213, 225, 0.9)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#0f172a',
                  fontSize: '14px',
                  outline: 'none',
                }}
                required
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#ffffff',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
              }}
              disabled={loading}
            >
              {loading ? 'Sending OTP Email...' : 'Send OTP Code'}
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setError(''); setAuthMode('login'); }}
                style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 600, fontSize: '13px', padding: 0, cursor: 'pointer' }}
              >
                ← Back to Log in
              </button>
            </div>
          </form>
        )}

        {/* 4. RESET PASSWORD WITH OTP */}
        {authMode === 'reset' && (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Verify & Set Password
              </h2>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                Enter the 6-digit code sent to <strong>{email}</strong>:
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                6-Digit OTP Code
              </label>
              <input
                className="mono"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(203, 213, 225, 0.9)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#0f172a',
                  fontSize: '18px',
                  letterSpacing: '4px',
                  fontWeight: 700,
                  outline: 'none',
                }}
                required
                maxLength={6}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                New Password (Min. 6 characters)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(203, 213, 225, 0.9)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#0f172a',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  title={showResetPassword ? 'Hide password' : 'Show password'}
                >
                  {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                color: '#ffffff',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
              }}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Reset Password & Log In'}
            </button>

            <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <button
                type="button"
                onClick={handleForgot}
                style={{ background: 'none', border: 'none', color: '#d97706', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => { setError(''); setAuthMode('login'); }}
                style={{ background: 'none', border: 'none', color: '#d97706', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Back to Log In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
