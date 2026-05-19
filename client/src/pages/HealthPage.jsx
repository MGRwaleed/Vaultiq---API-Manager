import { useState, useEffect } from 'react';
import api from '../lib/api';

const PROVIDER_COLORS = {
  OpenAI: '#10a37f', Groq: '#f55036', Tavily: '#6366f1',
  Deepgram: '#13ef95', Anthropic: '#c96442', Gemini: '#4285f4',
  Deepseek: '#4D6BFE', Other: '#8891aa',
};

const StatusBadge = ({ status }) => {
  const map = {
    healthy: { bg: 'var(--success-subtle)', color: 'var(--success)', label: 'Healthy' },
    invalid: { bg: 'var(--error-subtle)',   color: 'var(--error)',   label: 'Invalid'  },
    error:   { bg: 'var(--warning-subtle)', color: 'var(--warning)', label: 'Error'    },
    unknown: { bg: 'var(--bg-elevated)',    color: 'var(--text-muted)', label: 'Unknown' },
    checking:{ bg: 'var(--accent-subtle)',  color: 'var(--accent)',  label: 'Checking...' },
    idle:    { bg: 'var(--bg-elevated)',    color: 'var(--text-muted)', label: 'Not tested' },
  };
  const s = map[status] || map.idle;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block',
        animation: status === 'checking' ? 'pulse 1s ease-in-out infinite' : 'none',
      }} />
      {s.label}
    </span>
  );
};

const LatencyBar = ({ ms }) => {
  if (!ms) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>;
  const color = ms < 500 ? 'var(--success)' : ms < 1500 ? 'var(--warning)' : 'var(--error)';
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color }}>{ms}ms</span>
  );
};

const HealthPage = () => {
  const [keys, setKeys]         = useState([]);
  const [results, setResults]   = useState({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState({});
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    api.get('/keys').then(res => {
      setKeys(res.data.data);
      // Init all as idle
      const idle = {};
      res.data.data.forEach(k => { idle[k._id] = { status: 'idle' }; });
      setResults(idle);
    }).finally(() => setInitialLoad(false));
  }, []);

  const checkSingle = async (keyId) => {
    setLoadingKeys(p => ({ ...p, [keyId]: true }));
    setResults(p => ({ ...p, [keyId]: { status: 'checking' } }));
    try {
      const { data } = await api.post(`/health/check/${keyId}`);
      setResults(p => ({ ...p, [keyId]: data.data }));
    } catch {
      setResults(p => ({ ...p, [keyId]: { status: 'error', message: 'Request failed' } }));
    } finally {
      setLoadingKeys(p => ({ ...p, [keyId]: false }));
    }
  };

  const checkAll = async () => {
    setLoadingAll(true);
    // Set all to checking
    const checking = {};
    keys.forEach(k => { checking[k._id] = { status: 'checking' }; });
    setResults(checking);
    try {
      const { data } = await api.post('/health/check-all');
      const mapped = {};
      data.data.forEach(r => { mapped[r.keyId] = r; });
      setResults(mapped);
    } catch {
      const errored = {};
      keys.forEach(k => { errored[k._id] = { status: 'error', message: 'Request failed' }; });
      setResults(errored);
    } finally {
      setLoadingAll(false);
    }
  };

  const summary = {
    healthy: Object.values(results).filter(r => r.status === 'healthy').length,
    invalid: Object.values(results).filter(r => r.status === 'invalid').length,
    error:   Object.values(results).filter(r => r.status === 'error').length,
    untested: Object.values(results).filter(r => r.status === 'idle').length,
  };

  const relTime = (ts) => {
    if (!ts) return 'Never';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (initialLoad) return (
    <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
      <span style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      Loading keys...
    </div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>Key Health</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Test if your API keys are valid and measure their response time.
          </p>
        </div>
        <button
          onClick={checkAll} disabled={loadingAll || keys.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 20px', borderRadius: 'var(--radius-sm)',
            background: loadingAll ? 'var(--border)' : 'var(--accent)',
            color: loadingAll ? 'var(--text-muted)' : '#fff',
            border: 'none', fontSize: 13, fontWeight: 600,
            cursor: loadingAll ? 'not-allowed' : 'pointer',
            transition: 'background var(--transition)', fontFamily: 'var(--font-sans)',
          }}
        >
          {loadingAll
            ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          }
          {loadingAll ? 'Testing all keys...' : 'Test all keys'}
        </button>
      </div>

      {/* Summary cards */}
      {Object.values(results).some(r => r.status !== 'idle') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Healthy',  value: summary.healthy,  color: 'var(--success)' },
            { label: 'Invalid',  value: summary.invalid,  color: 'var(--error)'   },
            { label: 'Error',    value: summary.error,    color: 'var(--warning)' },
            { label: 'Untested', value: summary.untested, color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '14px 18px',
              borderLeft: `3px solid ${s.color}`,
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Keys table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {keys.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>🔑</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No API keys yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add keys from the API Keys page first.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                {['Key', 'Provider', 'Status', 'Latency', 'Last used', 'Message', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map(key => {
                const result = results[key._id] || { status: 'idle' };
                const isChecking = loadingKeys[key._id];
                return (
                  <tr key={key._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Name */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{key.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{key.keyPreview}</div>
                    </td>

                    {/* Provider */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PROVIDER_COLORS[key.provider] || '#8891aa', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{key.provider}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={isChecking ? 'checking' : result.status} />
                    </td>

                    {/* Latency */}
                    <td style={{ padding: '14px 16px' }}>
                      <LatencyBar ms={result.latencyMs} />
                    </td>

                    {/* Last used */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {relTime(key.stats?.lastUsed)}
                    </td>

                    {/* Message */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 220 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.message || '—'}
                      </span>
                    </td>

                    {/* Test button */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => checkSingle(key._id)}
                        disabled={isChecking || loadingAll}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                          background: 'transparent', border: '1px solid var(--border)',
                          color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
                          cursor: isChecking || loadingAll ? 'not-allowed' : 'pointer',
                          transition: 'all var(--transition)', fontFamily: 'var(--font-sans)',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { if (!isChecking && !loadingAll) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        {isChecking
                          ? <span style={{ width: 11, height: 11, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        }
                        {isChecking ? 'Testing...' : 'Test'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
};

export default HealthPage;