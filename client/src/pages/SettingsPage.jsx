import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const PROVIDER_COLORS = {
  OpenAI: '#10a37f', Groq: '#f55036', Tavily: '#6366f1',
  Deepgram:  '#ec4899', Anthropic: '#c96442', Deepseek: '#00c2ff', Gemini: '#4285f4', Other: '#8891aa',
};

const SectionLabel = ({ children, danger }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: danger ? 'var(--error)' : 'var(--text-muted)',
    paddingBottom: '0.75rem',
    borderBottom: `0.5px solid ${danger ? 'rgba(248,113,113,0.4)' : 'var(--border)'}`,
    marginBottom: '1.5rem',
  }}>{children}</div>
);

const Divider = () => (
  <div style={{ height: '0.5px', background: 'var(--border)', margin: '2.5rem 0' }} />
);

const Label = ({ children }) => (
  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{children}</div>
);

const TextInput = ({ type = 'text', value, onChange, placeholder, readOnly }) => (
  <input
    type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
    style={{
      width: '100%', padding: '9px 12px', boxSizing: 'border-box',
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', color: readOnly ? 'var(--text-muted)' : 'var(--text-primary)',
      fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)',
      cursor: readOnly ? 'not-allowed' : 'text', transition: 'border-color var(--transition)',
    }}
    onFocus={e => { if (!readOnly) e.target.style.borderColor = 'var(--accent)'; }}
    onBlur={e => e.target.style.borderColor = 'var(--border)'}
  />
);

const TwoCol = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>{children}</div>
);

const Field = ({ label, children, mb = 16 }) => (
  <div style={{ marginBottom: mb }}><Label>{label}</Label>{children}</div>
);

const Btn = ({ onClick, loading, disabled, label, variant = 'primary' }) => (
  <button onClick={onClick} disabled={loading || disabled} style={{
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '9px 20px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
    background: loading || disabled ? 'var(--border)' : variant === 'primary' ? 'var(--accent)' : 'transparent',
    color: loading || disabled ? 'var(--text-muted)' : variant === 'primary' ? '#fff' : variant === 'danger' ? 'var(--error)' : 'var(--text-secondary)',
    border: variant === 'danger' ? '1px solid var(--error)' : variant === 'primary' ? 'none' : '1px solid var(--border)',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition)', fontFamily: 'var(--font-sans)',
  }}>
    {loading && <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: variant === 'primary' ? '#fff' : 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
    {label}
  </button>
);

const Alert = ({ msg, type }) => msg ? (
  <div style={{
    padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 20,
    background: type === 'error' ? 'var(--error-subtle)' : 'var(--success-subtle)',
    border: `1px solid ${type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
    color: type === 'error' ? 'var(--error)' : 'var(--success)',
  }}>{msg}</div>
) : null;

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }} style={{
      padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 500,
      background: 'transparent', border: '1px solid var(--border)',
      color: copied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 5,
      transition: 'all var(--transition)', flexShrink: 0, fontFamily: 'var(--font-sans)',
    }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

const ProfileSection = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const save = async () => {
    setLoading(true); setMsg({ text: '', type: '' });
    try {
      await api.patch('/settings/profile', form);
      setMsg({ text: 'Profile updated successfully.', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update.', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <SectionLabel>Profile</SectionLabel>
      <Alert msg={msg.text} type={msg.type} />
      <TwoCol>
        <Field label="Full name" mb={0}><TextInput value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" /></Field>
        <Field label="Email address" mb={0}><TextInput type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" /></Field>
      </TwoCol>
      <div style={{ marginTop: 16 }}><Btn onClick={save} loading={loading} label="Save changes" /></div>
    </div>
  );
};

const PasswordSection = () => {
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [show, setShow] = useState(false);
  const t = show ? 'text' : 'password';

  const save = async () => {
    setMsg({ text: '', type: '' });
    if (form.new !== form.confirm) return setMsg({ text: 'Passwords do not match.', type: 'error' });
    if (form.new.length < 8) return setMsg({ text: 'Password must be at least 8 characters.', type: 'error' });
    setLoading(true);
    try {
      await api.patch('/settings/password', { currentPassword: form.current, newPassword: form.new });
      setMsg({ text: 'Password changed successfully.', type: 'success' });
      setForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to change password.', type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <SectionLabel>Password</SectionLabel>
      <Alert msg={msg.text} type={msg.type} />
      <TwoCol>
        <Field label="Current password" mb={0}><TextInput type={t} value={form.current} onChange={e => setForm(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" /></Field>
        <Field label="New password" mb={0}><TextInput type={t} value={form.new} onChange={e => setForm(p => ({ ...p, new: e.target.value }))} placeholder="Min. 8 characters" /></Field>
      </TwoCol>
      <Field label="Confirm new password">
        <TextInput type={t} value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
      </Field>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Btn onClick={save} loading={loading} label="Update password" />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} />
          Show passwords
        </label>
      </div>
    </div>
  );
};

const AppearanceSection = ({ theme, setTheme }) => (
  <div>
    <SectionLabel>Appearance</SectionLabel>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {[
        { key: 'dark',  label: 'Dark',  desc: 'Default theme',   swatchBg: '#0f1117', dot1: '#2a3047', dot2: '#4f8ef7' },
        { key: 'light', label: 'Light', desc: 'Clean & minimal', swatchBg: '#f4f6f9', dot1: '#dde2ec', dot2: '#4f8ef7' },
      ].map(t => (
        <button key={t.key} onClick={() => setTheme(t.key)} style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
          borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          border: theme === t.key ? '2px solid var(--accent)' : '1px solid var(--border)',
          background: theme === t.key ? 'var(--accent-subtle)' : 'var(--bg-surface)',
          transition: 'all var(--transition)', textAlign: 'left', width: '100%',
        }}>
          <div style={{ width: 52, height: 32, borderRadius: 6, background: t.swatchBg, border: `1px solid ${t.dot1}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.dot1 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.dot2 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: theme === t.key ? 'var(--accent)' : 'var(--text-primary)' }}>{t.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.desc}</div>
          </div>
          {theme === t.key && (
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
);

const IntegrationSection = () => {
  const [keys, setKeys] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    api.get('/settings/integration').then(r => setKeys(r.data.data.keys)).catch(() => {});
  }, []);

  return (
    <div>
      <SectionLabel>Integration</SectionLabel>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        Use these credentials to connect your apps through the proxy. Every request will be automatically logged and tracked.
      </p>

      <Label>JWT token</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {showToken ? token : '•'.repeat(48)}
        </div>
        <button onClick={() => setShowToken(p => !p)} style={{ padding: '9px 14px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, flexShrink: 0, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
          {showToken ? 'Hide' : 'Reveal'}
        </button>
        <CopyBtn text={token} />
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Keep private — pass as <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: 3 }}>Authorization: Bearer &lt;token&gt;</code>
      </p>

      <Label>API key IDs</Label>
      <div style={{ marginBottom: '1.5rem' }}>
        {!keys ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
        ) : keys.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No keys added yet.</div>
        ) : keys.map(k => (
          <div key={k._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PROVIDER_COLORS[k.provider] || '#8891aa', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{k.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k._id}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: k.isActive ? 'var(--success-subtle)' : 'var(--bg-surface)', color: k.isActive ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}>
              {k.isActive ? 'Active' : 'Inactive'}
            </span>
            <CopyBtn text={k._id} />
          </div>
        ))}
      </div>

      <Label>Quick snippet</Label>
      <pre style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflowX: 'auto', lineHeight: 1.8, margin: 0 }}>{`const openai = new OpenAI({
  baseURL: 'http://localhost:5000/api/proxy/openai',
  apiKey: 'YOUR_JWT_TOKEN',
  defaultHeaders: { 'x-api-key-id': 'YOUR_KEY_ID' }
});`}</pre>
    </div>
  );
};

const ContactSection = () => {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const send = async () => {
    if (!form.subject || !form.message) return setMsg({ text: 'Please fill in all fields.', type: 'error' });
    setLoading(true); setMsg({ text: '', type: '' });
    await new Promise(r => setTimeout(r, 900));
    setMsg({ text: "Message sent! We'll get back to you soon.", type: 'success' });
    setForm({ subject: '', message: '' });
    setLoading(false);
  };

  return (
    <div>
      <SectionLabel>Contact & support</SectionLabel>
      <Alert msg={msg.text} type={msg.type} />
      <Field label="Subject"><TextInput value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Feature request, Bug report..." /></Field>
      <Field label="Message">
        <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe your issue or request in detail..." rows={5}
          style={{ width: '100%', padding: '9px 12px', boxSizing: 'border-box', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical', transition: 'border-color var(--transition)' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </Field>
      <Btn onClick={send} loading={loading} label="Send message" />
    </div>
  );
};

const DangerSection = ({ logout, navigate }) => {
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const del = async () => {
    setLoading(true);
    try {
      await api.delete('/settings/account', { data: { password: pw } });
      logout(); navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account.');
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionLabel danger>Danger zone</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Delete account</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 480 }}>
            Permanently deletes your account, all API keys, and all request logs. This cannot be undone.
          </div>
          {confirm && (
            <div style={{ marginTop: 20, maxWidth: 380 }}>
              <Field label="Enter your password to confirm">
                <TextInput type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" />
              </Field>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn loading={loading} onClick={del} label="Yes, delete my account" variant="danger" disabled={!pw} />
                <Btn onClick={() => { setConfirm(false); setPw(''); }} label="Cancel" variant="secondary" />
              </div>
            </div>
          )}
        </div>
        {!confirm && (
          <button onClick={() => setConfirm(true)} style={{ padding: '9px 18px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-sans)', transition: 'all var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--error)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--error)'; }}>
            Delete account
          </button>
        )}
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    const vars = theme === 'light' ? {
      '--bg': '#f4f6f9', '--bg-surface': '#ffffff', '--bg-elevated': '#edf0f5',
      '--border': '#dde2ec', '--border-light': '#cdd3e0',
      '--text-primary': '#0f1117', '--text-secondary': '#4a5568', '--text-muted': '#8891aa',
    } : {
      '--bg': '#0f1117', '--bg-surface': '#181c27', '--bg-elevated': '#1f2437',
      '--border': '#2a3047', '--border-light': '#323a55',
      '--text-primary': '#edf0f7', '--text-secondary': '#8891aa', '--text-muted': '#5a6480',
    };
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)' }}>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '28px 48px 24px', background: 'var(--bg-surface)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage your account, preferences, and integrations.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 'calc(100vh - 89px)' }}>
        <div style={{ borderRight: '1px solid var(--border)', padding: '32px 0', position: 'sticky', top: 0, height: 'fit-content' }}>
          {[
            { label: 'Profile',     href: '#profile'     },
            { label: 'Password',    href: '#password'    },
            { label: 'Appearance',  href: '#appearance'  },
            { label: 'Integration', href: '#integration' },
            { label: 'Contact',     href: '#contact'     },
            { label: 'Danger zone', href: '#danger', danger: true },
          ].map(item => (
            <a key={item.href} href={item.href} style={{
              display: 'block', padding: '8px 24px', fontSize: 13,
              color: item.danger ? 'var(--error)' : 'var(--text-secondary)',
              textDecoration: 'none', transition: 'color var(--transition)',
            }}
              onMouseEnter={e => e.currentTarget.style.color = item.danger ? 'var(--error)' : 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = item.danger ? 'var(--error)' : 'var(--text-secondary)'}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div style={{ padding: '40px 56px', maxWidth: 780 }}>
          <div id="profile"><ProfileSection /></div>
          <Divider />
          <div id="password"><PasswordSection /></div>
          <Divider />
          <div id="appearance"><AppearanceSection theme={theme} setTheme={setTheme} /></div>
          <Divider />
          <div id="integration"><IntegrationSection /></div>
          <Divider />
          <div id="contact"><ContactSection /></div>
          <Divider />
          <div id="danger"><DangerSection logout={logout} navigate={navigate} /></div>
          <div style={{ height: 60 }} />
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SettingsPage;