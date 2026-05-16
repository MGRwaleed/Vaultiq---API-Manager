import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const PROVIDER_COLORS = {
  OpenAI: '#10a37f', Groq: '#f55036', Tavily: '#6366f1',
  Deepgram: '#13ef95', Anthropic: '#c96442', Gemini: '#4285f4', Other: '#8891aa',
};

const TABS = [
  { id: 'profile',     label: 'Profile',     icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { id: 'password',    label: 'Password',    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'appearance',  label: 'Appearance',  icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2' },
  { id: 'integration', label: 'Integration', icon: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3' },
  { id: 'contact',     label: 'Contact',     icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'danger',      label: 'Danger zone', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01', danger: true },
];

/* ── Primitives ─────────────────────────────────────────────────────────── */

const Label = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>{children}</div>
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

const Btn = ({ onClick, loading, disabled, label, variant = 'primary' }) => {
  const bg = variant === 'primary' ? 'var(--accent)' : 'transparent';
  const color = variant === 'primary' ? '#fff' : variant === 'danger' ? 'var(--error)' : 'var(--text-secondary)';
  const border = variant === 'danger' ? '1px solid var(--error)' : '1px solid var(--border)';
  return (
    <button onClick={onClick} disabled={loading || disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '9px 18px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
      background: loading || disabled ? 'var(--border)' : bg,
      color: loading || disabled ? 'var(--text-muted)' : color,
      border: loading || disabled ? '1px solid var(--border)' : border,
      cursor: loading || disabled ? 'not-allowed' : 'pointer',
      transition: 'all var(--transition)', fontFamily: 'var(--font-sans)',
    }}>
      {loading && <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: variant === 'primary' ? '#fff' : 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
      {label}
    </button>
  );
};

const Alert = ({ msg, type }) => msg ? (
  <div style={{
    padding: '9px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 16,
    background: type === 'error' ? 'var(--error-subtle)' : 'var(--success-subtle)',
    border: `1px solid ${type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
    color: type === 'error' ? 'var(--error)' : 'var(--success)',
  }}>{msg}</div>
) : null;

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }} style={{
      padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 500,
      background: 'transparent', border: '1px solid var(--border)',
      color: copied ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all var(--transition)', flexShrink: 0,
    }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

const SectionCard = ({ id, title, subtitle, children, danger, sectionRefs }) => (
  <div
    id={id}
    ref={el => { if (sectionRefs) sectionRefs.current[id] = el; }}
    style={{
      background: 'var(--bg-surface)', border: `1px solid ${danger ? 'rgba(248,113,113,0.35)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 20,
    }}
  >
    <div style={{
      padding: '14px 24px', borderBottom: `1px solid ${danger ? 'rgba(248,113,113,0.2)' : 'var(--border)'}`,
      background: danger ? 'rgba(248,113,113,0.06)' : 'var(--bg-elevated)',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: danger ? 'var(--error)' : 'var(--text-primary)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: danger ? 'rgba(248,113,113,0.8)' : 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
    </div>
    <div style={{ padding: 24 }}>{children}</div>
  </div>
);

const Field = ({ label, children, mb = 16 }) => (
  <div style={{ marginBottom: mb }}><Label>{label}</Label>{children}</div>
);

/* ── Main page ──────────────────────────────────────────────────────────── */

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('profile');
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef(null);

  // Theme
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

  // Integration
  const [integration, setIntegration] = useState(null);
  const [showToken, setShowToken] = useState(false);
  useEffect(() => {
    api.get('/settings/integration').then(res => setIntegration(res.data.data)).catch(() => {});
  }, []);

  // Profile
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });
  const [showPw, setShowPw] = useState(false);

  // Contact
  const [contact, setContact] = useState({ subject: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactMsg, setContactMsg] = useState({ text: '', type: '' });

  // Danger
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const token = localStorage.getItem('token');

  // Tab click → smooth scroll using getBoundingClientRect (works regardless of DOM nesting)
  const handleTabClick = (id) => {
    const el = sectionRefs.current[id];
    const container = scrollRef.current;
    if (!el || !container) return;

    setActive(id);
    isScrollingRef.current = true;
    clearTimeout(scrollTimerRef.current);

    const elTop = el.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    const scrollTarget = container.scrollTop + (elTop - containerTop) - 16;

    container.scrollTo({ top: scrollTarget, behavior: 'smooth' });

    scrollTimerRef.current = setTimeout(() => { isScrollingRef.current = false; }, 800);
  };

  // Scroll → update active tab via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      entries => {
        if (isScrollingRef.current) return;
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { root: container, rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    TABS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  /* handlers */
  const handleProfileSave = async () => {
    setProfileLoading(true); setProfileMsg({ text: '', type: '' });
    try {
      await api.patch('/settings/profile', { name: profileName });
      setProfileMsg({ text: 'Profile updated successfully.', type: 'success' });
    } catch (err) {
      setProfileMsg({ text: err.response?.data?.message || 'Failed to update.', type: 'error' });
    } finally { setProfileLoading(false); }
  };

  const handlePasswordSave = async () => {
    setPassMsg({ text: '', type: '' });
    if (passwords.new !== passwords.confirm) return setPassMsg({ text: 'Passwords do not match.', type: 'error' });
    setPassLoading(true);
    try {
      await api.patch('/settings/password', { currentPassword: passwords.current, newPassword: passwords.new });
      setPassMsg({ text: 'Password changed successfully.', type: 'success' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPassMsg({ text: err.response?.data?.message || 'Failed to change password.', type: 'error' });
    } finally { setPassLoading(false); }
  };

  const handleContactSubmit = async () => {
    if (!contact.subject || !contact.message) return setContactMsg({ text: 'Please fill in all fields.', type: 'error' });
    setContactLoading(true); setContactMsg({ text: '', type: '' });
    await new Promise(r => setTimeout(r, 900));
    setContactMsg({ text: "Message sent! We'll get back to you soon.", type: 'success' });
    setContact({ subject: '', message: '' });
    setContactLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/settings/account', { data: { password: deletePassword } });
      logout(); navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Sticky header */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ padding: '20px 32px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Settings</div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {TABS.map(tab => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px', fontSize: 13, fontWeight: isActive ? 500 : 400,
                    color: isActive
                      ? (tab.danger ? 'var(--error)' : 'var(--accent)')
                      : (tab.danger ? 'rgba(248,113,113,0.7)' : 'var(--text-secondary)'),
                    background: 'transparent', border: 'none',
                    borderBottom: isActive
                      ? `2px solid ${tab.danger ? 'var(--error)' : 'var(--accent)'}`
                      : '2px solid transparent',
                    marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all var(--transition)', fontFamily: 'var(--font-sans)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ maxWidth: 680 }}>

          {/* Profile */}
          <SectionCard id="profile" title="Profile" subtitle="Update your display name" sectionRefs={sectionRefs}>
            <Alert msg={profileMsg.text} type={profileMsg.type} />
            <Field label="Full name" mb={16}>
              <TextInput value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Email address" mb={16}>
              <TextInput value={user?.email || ''} readOnly />
            </Field>
            <Btn onClick={handleProfileSave} loading={profileLoading} label="Save changes" />
          </SectionCard>

          {/* Password */}
          <SectionCard id="password" title="Change password" subtitle="Use a strong password with at least 8 characters" sectionRefs={sectionRefs}>
            <Alert msg={passMsg.text} type={passMsg.type} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="Current password" mb={0}>
                <TextInput type={showPw ? 'text' : 'password'} value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
              </Field>
              <Field label="New password" mb={0}>
                <TextInput type={showPw ? 'text' : 'password'} value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} placeholder="Min. 8 characters" />
              </Field>
            </div>
            <Field label="Confirm new password">
              <TextInput type={showPw ? 'text' : 'password'} value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Btn onClick={handlePasswordSave} loading={passLoading} label="Update password" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} />
                Show passwords
              </label>
            </div>
          </SectionCard>

          {/* Appearance */}
          <SectionCard id="appearance" title="Appearance" subtitle="Choose your preferred color theme" sectionRefs={sectionRefs}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'dark',  label: 'Dark',  sub: 'Default theme',   preview: ['#0f1117', '#2a3047', '#4f8ef7'] },
                { key: 'light', label: 'Light', sub: 'Clean & minimal', preview: ['#f4f6f9', '#dde2ec', '#4f8ef7'] },
              ].map(t => (
                <button key={t.key} onClick={() => setTheme(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  border: theme === t.key ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: theme === t.key ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                  transition: 'all var(--transition)', textAlign: 'left',
                }}>
                  <div style={{ width: 52, height: 34, borderRadius: 6, background: t.preview[0], border: `1px solid ${t.preview[1]}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.preview[1] }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.preview[2] }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: theme === t.key ? 'var(--accent)' : 'var(--text-primary)' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Integration */}
          <SectionCard id="integration" title="Integration info" subtitle="Use these credentials to connect your apps to the proxy" sectionRefs={sectionRefs}>
            <Label>JWT token</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1, padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {showToken ? token : '••••••••••••••••••••••••••••••••••••••••••••••••'}
              </div>
              <button onClick={() => setShowToken(p => !p)} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, flexShrink: 0, fontFamily: 'var(--font-sans)' }}>
                {showToken ? 'Hide' : 'Show'}
              </button>
              <CopyBtn text={token} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
              Keep this private — use as <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: 3 }}>Authorization: Bearer &lt;token&gt;</code>
            </div>
            <Label>API key IDs</Label>
            {!integration ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
            ) : integration.keys.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No keys added yet.</div>
            ) : integration.keys.map(k => (
              <div key={k._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PROVIDER_COLORS[k.provider] || '#8891aa', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{k.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k._id}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: k.isActive ? 'var(--success-subtle)' : 'var(--bg-surface)', color: k.isActive ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}>
                  {k.isActive ? 'Active' : 'Inactive'}
                </span>
                <CopyBtn text={k._id} />
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <Label>Quick integration snippet</Label>
              <pre style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflowX: 'auto', lineHeight: 1.8, margin: 0 }}>{`const openai = new OpenAI({
  baseURL: 'http://localhost:5000/api/proxy/openai',
  apiKey: 'YOUR_JWT_TOKEN',
  defaultHeaders: {
    'x-api-key-id': 'YOUR_OPENAI_KEY_ID'
  }
});`}</pre>
            </div>
          </SectionCard>

          {/* Contact */}
          <SectionCard id="contact" title="Contact & support" subtitle="Send us a message and we'll get back to you" sectionRefs={sectionRefs}>
            <Alert msg={contactMsg.text} type={contactMsg.type} />
            <Field label="Subject">
              <TextInput value={contact.subject} onChange={e => setContact(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Feature request, Bug report..." />
            </Field>
            <Field label="Message">
              <textarea value={contact.message} onChange={e => setContact(p => ({ ...p, message: e.target.value }))} placeholder="Describe your issue or request in detail..." rows={4}
                style={{ width: '100%', padding: '9px 12px', boxSizing: 'border-box', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', resize: 'vertical', transition: 'border-color var(--transition)' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </Field>
            <Btn onClick={handleContactSubmit} loading={contactLoading} label="Send message" />
          </SectionCard>

          {/* Danger */}
          <SectionCard id="danger" title="Danger zone" subtitle="Irreversible actions — proceed with caution" danger sectionRefs={sectionRefs}>
            {!showDeleteConfirm ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Delete account</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 400 }}>Permanently deletes your account, all API keys, and all request logs. Cannot be undone.</div>
                </div>
                <Btn onClick={() => setShowDeleteConfirm(true)} label="Delete account" variant="danger" />
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: 'var(--error)', marginBottom: 16, fontWeight: 500 }}>Are you sure? This action is irreversible.</div>
                <Field label="Enter your password to confirm">
                  <TextInput type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="••••••••" />
                </Field>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn loading={deleteLoading} onClick={handleDeleteAccount} label="Yes, delete my account" variant="danger" disabled={!deletePassword} />
                  <Btn onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }} label="Cancel" variant="secondary" />
                </div>
              </div>
            )}
          </SectionCard>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SettingsPage;