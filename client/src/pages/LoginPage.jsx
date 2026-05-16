import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <Zap size={20} className="auth-logo-icon" />
          KeyVault
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your dashboard.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email" type="email" className="form-input"
              placeholder="you@example.com"
              value={form.email} onChange={set('email')} required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" type="password" className="form-input"
              placeholder="••••••••"
              value={form.password} onChange={set('password')} required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin-icon" /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
