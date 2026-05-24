import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const PROVIDERS = ['Anthropic', 'OpenAI', 'Groq', 'Tavily', 'Deepgram', 'Gemini', 'Deepseek', 'Other'];

const PROVIDER_COLORS = {
  Anthropic: '#c96442', OpenAI: '#10a37f', Groq: '#f55036',
  Tavily: '#6366f1', Deepgram: '#13ef95', Gemini: '#4285f4',
  Deepseek: '#4D6BFE', Other: '#737686',
};

const Badge = ({ active }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
    background: active ? 'var(--success-bg)' : 'var(--surface-container)',
    color: active ? 'var(--success-color)' : 'var(--on-surface-variant)',
    border: `1px solid ${active ? 'var(--success-border)' : 'var(--outline-variant)'}`,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#4ade80' : 'var(--outline)', display: 'inline-block' }} />
    {active ? 'Active' : 'Inactive'}
  </span>
);

const ProviderBadge = ({ provider }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
    background: `${PROVIDER_COLORS[provider] || PROVIDER_COLORS.Other}15`,
    color: PROVIDER_COLORS[provider] || PROVIDER_COLORS.Other,
    border: `1px solid ${PROVIDER_COLORS[provider] || PROVIDER_COLORS.Other}30`,
  }}>
    {provider}
  </span>
);

const IconBtn = ({ onClick, title, children, danger }) => (
  <button onClick={onClick} title={title} style={{
    width: 32, height: 32, borderRadius: 6,
    background: 'transparent', border: '1px solid var(--outline-variant)',
    color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all var(--transition)', flexShrink: 0,
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = danger ? 'var(--error)' : 'var(--primary)'; e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--primary)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.color = 'var(--on-surface-variant)'; }}>
    {children}
  </button>
);

const AddKeyModal = ({ onClose, onAdded }) => {
  const [form, setForm] = useState({ name: '', provider: 'OpenAI', rawKey: '', notes: '' });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = { width: '100%', padding: '9px 12px', boxSizing: 'border-box', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', borderRadius: 8, color: 'var(--on-surface)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color var(--transition)' };
  const onFocus = e => e.target.style.borderColor = 'var(--primary)';
  const onBlur  = e => e.target.style.borderColor = 'var(--outline-variant)';

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/keys', form);
      onAdded(data.data); onClose();
    } catch (err) { setError(err.response?.data?.message || 'Failed to add key.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(19,27,46,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface-bright)', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-md)', border: '1px solid var(--outline-variant)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>Add API Key</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>Encrypted with AES-256 before storing</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 6, background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--error-container)', color: 'var(--on-error-container)', fontSize: 13 }}>{error}</div>}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--on-surface-variant)', marginBottom: 6 }}>Key Name</label>
            <input style={inputStyle} placeholder="e.g. Production OpenAI Key" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--on-surface-variant)', marginBottom: 6 }}>Provider</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.provider} onChange={e => setForm(p => ({...p, provider: e.target.value}))}>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--on-surface-variant)', marginBottom: 6 }}>API Key</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputStyle, paddingRight: 40, fontFamily: showKey ? 'var(--font-mono)' : 'var(--font-sans)' }} type={showKey ? 'text' : 'password'} placeholder="sk-••••••••••••" value={form.rawKey} onChange={e => setForm(p => ({...p, rawKey: e.target.value}))} required onFocus={onFocus} onBlur={onBlur} />
              <button type="button" onClick={() => setShowKey(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', padding: 2 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{showKey ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
              </button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--on-surface-variant)', marginBottom: 6 }}>Notes <span style={{ fontWeight: 400, color: 'var(--outline)' }}>(optional)</span></label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} placeholder="e.g. Used for production chatbot" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, background: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 20px', borderRadius: 8, background: loading ? 'var(--outline-variant)' : 'var(--primary)', color: 'var(--on-primary)', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              {loading && <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
              Add Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const KeyRow = ({ keyData, onToggle, onDelete }) => {
  const [revealed, setRevealed] = useState(false);
  const [revealedValue, setRevealedValue] = useState('');
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = async () => {
    if (revealed) { setRevealed(false); setRevealedValue(''); return; }
    setRevealing(true);
    try { const { data } = await api.get(`/keys/${keyData._id}/reveal`); setRevealedValue(data.data.key); setRevealed(true); }
    catch {} finally { setRevealing(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(revealed ? revealedValue : keyData.keyPreview);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${keyData.name}"?`)) return;
    try { await api.delete(`/keys/${keyData._id}`); onDelete(keyData._id); } catch {}
  };

  return (
    <tr style={{ borderTop: '1px solid var(--outline-variant)', transition: 'background var(--transition)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <td style={{ padding: '14px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{keyData.name}</div>
        {keyData.notes && <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>{keyData.notes}</div>}
      </td>
      <td style={{ padding: '14px 24px' }}><ProviderBadge provider={keyData.provider} /></td>
      <td style={{ padding: '14px 24px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: revealed ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
          {revealed ? revealedValue : keyData.keyPreview}
        </span>
      </td>
      <td style={{ padding: '14px 24px' }}><Badge active={keyData.isActive} /></td>
      <td style={{ padding: '14px 24px', fontSize: 12, color: 'var(--on-surface-variant)' }}>
        {new Date(keyData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
      <td style={{ padding: '14px 24px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <IconBtn onClick={handleReveal} title={revealed ? 'Hide' : 'Reveal'}>
            {revealing ? <span style={{ width: 10, height: 10, border: '2px solid var(--outline-variant)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              : revealed ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
          </IconBtn>
          <IconBtn onClick={handleCopy} title="Copy">
            {copied ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
          </IconBtn>
          <IconBtn onClick={() => onToggle(keyData._id)} title={keyData.isActive ? 'Deactivate' : 'Activate'}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64A9 9 0 1 1 5.64 5.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          </IconBtn>
          <IconBtn onClick={handleDelete} title="Delete" danger>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
          </IconBtn>
        </div>
      </td>
    </tr>
  );
};

const ApiKeysPage = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState('All');

  useEffect(() => { api.get('/keys').then(r => setKeys(r.data.data)).finally(() => setLoading(false)); }, []);

  const handleToggle = useCallback(async id => {
    const { data } = await api.patch(`/keys/${id}/toggle`);
    setKeys(p => p.map(k => k._id === id ? data.data : k));
  }, []);

  const handleDelete = useCallback(id => setKeys(p => p.filter(k => k._id !== id)), []);

  const providers = ['All', ...PROVIDERS.filter(p => keys.some(k => k.provider === p))];
  const filtered = keys.filter(k => {
    const ms = k.name.toLowerCase().includes(search.toLowerCase()) || k.provider.toLowerCase().includes(search.toLowerCase());
    const mp = filterProvider === 'All' || k.provider === filterProvider;
    return ms && mp;
  });
  const activeCount = keys.filter(k => k.isActive).length;

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>API Keys</h2>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>{keys.length} total · {activeCount} active · AES-256 encrypted at rest</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, background: 'var(--primary)', color: 'var(--on-primary)', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'opacity var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Key
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search by name or provider..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', background: 'var(--surface-bright)', border: '1px solid var(--outline-variant)', borderRadius: 8, color: 'var(--on-surface)', fontSize: 13, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--outline-variant)'} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {providers.map(p => (
            <button key={p} onClick={() => setFilterProvider(p)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: filterProvider === p ? 'var(--primary)' : 'var(--outline-variant)', background: filterProvider === p ? 'var(--surface-container)' : 'var(--surface-bright)', color: filterProvider === p ? 'var(--primary)' : 'var(--on-surface-variant)', transition: 'all var(--transition)' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface-bright)', border: '1px solid var(--outline-variant)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{keys.length === 0 ? 'No API keys yet' : 'No keys match'}</div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>{keys.length === 0 ? 'Click "Add Key" to get started.' : 'Try a different search.'}</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container-low)' }}>
                {['Name', 'Provider', 'Key', 'Status', 'Added', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(key => <KeyRow key={key._id} keyData={key} onToggle={handleToggle} onDelete={handleDelete} />)}
            </tbody>
          </table>
        )}
      </div>
      {showModal && <AddKeyModal onClose={() => setShowModal(false)} onAdded={k => setKeys(p => [k, ...p])} />}
    </div>
  );
};

export default ApiKeysPage;