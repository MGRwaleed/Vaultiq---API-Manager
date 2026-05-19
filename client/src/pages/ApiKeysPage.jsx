import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const PROVIDERS = ['Anthropic', 'OpenAI', 'Groq', 'Tavily', 'Deepgram', 'Deepseek', 'Other'];

const PROVIDER_COLORS = {
  Anthropic: '#c96442',
  OpenAI:    '#10a37f',
  Groq:      '#f55036',
  Tavily:    '#6366f1',
  Deepgram:  '#ec4899',
  Deepseek:  '#00c2ff',
  Other:     '#f59e0b',

};

/* ── Small reusable components ────────────────────────────────── */

const ProviderBadge = ({ provider }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
    background: `${PROVIDER_COLORS[provider] || PROVIDER_COLORS.Other}18`,
    color: PROVIDER_COLORS[provider] || PROVIDER_COLORS.Other,
    border: `1px solid ${PROVIDER_COLORS[provider] || PROVIDER_COLORS.Other}33`,
  }}>
    {provider}
  </span>
);

const StatusBadge = ({ active }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500,
    background: active ? 'var(--success-subtle)' : 'var(--bg-elevated)',
    color: active ? 'var(--success)' : 'var(--text-muted)',
    border: `1px solid ${active ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block' }} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

const IconBtn = ({ onClick, title, children, danger }) => (
  <button
    onClick={onClick} title={title}
    style={{
      width: 30, height: 30, borderRadius: 'var(--radius-sm)',
      background: 'transparent', border: '1px solid var(--border)',
      color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'all var(--transition)', flexShrink: 0,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = danger ? 'var(--error)' : 'var(--accent)';
      e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--accent)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.color = 'var(--text-muted)';
    }}
  >
    {children}
  </button>
);

/* ── Add Key Modal ────────────────────────────────────────────── */
const AddKeyModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ name: '', provider: 'OpenAI', rawKey: '', notes: '' });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/keys', form);
      onAdded(data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add key.');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6, display: 'block' };
  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color var(--transition)', boxSizing: 'border-box' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 480,
        boxShadow: 'var(--shadow)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Add API Key</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Key will be encrypted before storing</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && (
            <div style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--error-subtle)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--error)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label style={labelStyle}>Key Name</label>
            <input style={inputStyle} placeholder="e.g. Production OpenAI Key" value={form.name} onChange={handleChange('name')} required
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {/* Provider */}
          <div>
            <label style={labelStyle}>Provider</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.provider} onChange={handleChange('provider')}>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label style={labelStyle}>API Key</label>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: 40, fontFamily: showKey ? 'var(--font-mono)' : 'var(--font-sans)', letterSpacing: showKey ? 'normal' : '0.1em' }}
                type={showKey ? 'text' : 'password'}
                placeholder="sk-••••••••••••••••"
                value={form.rawKey}
                onChange={handleChange('rawKey')}
                required
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button type="button" onClick={() => setShowKey(p => !p)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2,
              }}>
                {showKey
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 68 }}
              placeholder="e.g. Used for production chatbot"
              value={form.notes}
              onChange={handleChange('notes')}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', borderRadius: 'var(--radius-sm)', background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              padding: '9px 20px', borderRadius: 'var(--radius-sm)',
              background: loading ? 'var(--border)' : 'var(--accent)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {loading && <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              Add Key
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ── Key Row ──────────────────────────────────────────────────── */
const KeyRow = ({ keyData, onToggle, onDelete }) => {
  const [revealed, setRevealed] = useState(false);
  const [revealedValue, setRevealedValue] = useState('');
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleReveal = async () => {
    if (revealed) { setRevealed(false); setRevealedValue(''); return; }
    setRevealing(true);
    try {
      const { data } = await api.get(`/keys/${keyData._id}/reveal`);
      setRevealedValue(data.data.key);
      setRevealed(true);
    } catch { } finally { setRevealing(false); }
  };

  const handleCopy = async () => {
    const val = revealed ? revealedValue : keyData.keyPreview;
    await navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${keyData.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/keys/${keyData._id}`);
      onDelete(keyData._id);
    } catch { setDeleting(false); }
  };

  const displayKey = revealed ? revealedValue : keyData.keyPreview;

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Name + notes */}
      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{keyData.name}</div>
        {keyData.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{keyData.notes}</div>}
      </td>

      {/* Provider */}
      <td style={{ padding: '14px 16px' }}>
        <ProviderBadge provider={keyData.provider} />
      </td>

      {/* Key value */}
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: revealed ? 'var(--text-primary)' : 'var(--text-secondary)',
          letterSpacing: revealed ? 'normal' : '0.05em',
          wordBreak: 'break-all',
        }}>
          {displayKey}
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: '14px 16px' }}>
        <StatusBadge active={keyData.isActive} />
      </td>

      {/* Added date */}
      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
        {new Date(keyData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Reveal */}
          <IconBtn onClick={handleReveal} title={revealed ? 'Hide key' : 'Reveal key'}>
            {revealing
              ? <span style={{ width: 10, height: 10, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              : revealed
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </IconBtn>

          {/* Copy */}
          <IconBtn onClick={handleCopy} title="Copy key">
            {copied
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            }
          </IconBtn>

          {/* Toggle active */}
          <IconBtn onClick={() => onToggle(keyData._id)} title={keyData.isActive ? 'Deactivate' : 'Activate'}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64A9 9 0 1 1 5.64 5.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          </IconBtn>

          {/* Delete */}
          <IconBtn onClick={handleDelete} title="Delete key" danger>
            {deleting
              ? <span style={{ width: 10, height: 10, border: '2px solid var(--border)', borderTopColor: 'var(--error)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            }
          </IconBtn>
        </div>
      </td>
    </tr>
  );
};

/* ── Main Page ────────────────────────────────────────────────── */
const ApiKeysPage = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState('All');

  useEffect(() => {
    api.get('/keys')
      .then(res => setKeys(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleAdded = (newKey) => setKeys(prev => [newKey, ...prev]);

  const handleToggle = useCallback(async (id) => {
    const { data } = await api.patch(`/keys/${id}/toggle`);
    setKeys(prev => prev.map(k => k._id === id ? data.data : k));
  }, []);

  const handleDelete = useCallback((id) => {
    setKeys(prev => prev.filter(k => k._id !== id));
  }, []);

  const providers = ['All', ...PROVIDERS.filter(p => keys.some(k => k.provider === p))];

  const filtered = keys.filter(k => {
    const matchSearch = k.name.toLowerCase().includes(search.toLowerCase()) || k.provider.toLowerCase().includes(search.toLowerCase());
    const matchProvider = filterProvider === 'All' || k.provider === filterProvider;
    return matchSearch && matchProvider;
  });

  const activeCount = keys.filter(k => k.isActive).length;

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>API Keys</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {keys.length} total · {activeCount} active · Keys are AES-256 encrypted at rest
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', border: 'none', transition: 'background var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Key
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name or provider..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '8px 12px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {providers.map(p => (
            <button key={p} onClick={() => setFilterProvider(p)} style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', border: '1px solid',
              borderColor: filterProvider === p ? 'var(--accent)' : 'var(--border)',
              background: filterProvider === p ? 'var(--accent-subtle)' : 'transparent',
              color: filterProvider === p ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'all var(--transition)',
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            <span style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', marginRight: 8 }} />
            Loading keys...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              {keys.length === 0 ? 'No API keys yet' : 'No keys match your search'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {keys.length === 0 ? 'Click "Add Key" to add your first API key.' : 'Try a different search or filter.'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                {['Name', 'Provider', 'Key', 'Status', 'Added', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(key => (
                <KeyRow key={key._id} keyData={key} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddKeyModal onClose={() => setShowModal(false)} onAdded={handleAdded} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ApiKeysPage;
