import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InputField = ({ label, id, type = 'text', value, onChange, placeholder, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label htmlFor={id} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 14px',
        color: 'var(--text-primary)',
        fontSize: 14,
        outline: 'none',
        transition: 'border-color var(--transition)',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  </div>
);

const AuthPage = ({ mode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      {/* Subtle background grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.3,
      }} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 400,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 36,
        boxShadow: 'var(--shadow)',
      }}>
        {/* Logo / Brand */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--accent-subtle)',
            border: '1px solid rgba(79,142,247,0.3)',
            marginBottom: 14,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Vaultiq
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {isLogin ? 'Welcome back. Sign in to continue.' : 'Create your account to get started.'}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--error-subtle)', border: '1px solid rgba(248,113,113,0.3)',
            color: 'var(--error)', fontSize: 13, marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!isLogin && (
            <InputField
              label="Full Name" id="name" value={form.name}
              onChange={handleChange('name')} placeholder="Jane Smith" required
            />
          )}
          <InputField
            label="Email" id="email" type="email" value={form.email}
            onChange={handleChange('email')} placeholder="jane@example.com" required
          />
          <InputField
            label="Password" id="password" type="password" value={form.password}
            onChange={handleChange('password')} placeholder="••••••••" required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '11px 20px',
              background: loading ? 'var(--border)' : 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: 14,
              transition: 'background var(--transition)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading && (
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', display: 'inline-block',
              }} />
            )}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link
            to={isLogin ? '/signup' : '/login'}
            style={{ color: 'var(--accent)', fontWeight: 500 }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuthPage;
