import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Sign-up failed — please try again.');
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

        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Start managing your API keys in one place.</p>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name" type="text" className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Jane Smith"
              value={form.name} onChange={set('name')} required
            />
            {errors.name && <span className="form-error-msg">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={form.email} onChange={set('email')} required
            />
            {errors.email && <span className="form-error-msg">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" type="password" className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Min. 8 characters"
              value={form.password} onChange={set('password')} required
            />
            {errors.password && <span className="form-error-msg">{errors.password}</span>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading && <Loader2 size={16} className="spin-icon" />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
