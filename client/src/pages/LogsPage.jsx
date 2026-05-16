import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const PROVIDERS = ['All', 'Anthropic', 'OpenAI', 'Groq', 'Tavily', 'Deepgram'];
const STATUS_FILTERS = ['All', '2xx', '4xx', '5xx'];

const PROVIDER_COLORS = {
  OpenAI:    '#10a37f',
  Groq:      '#f55036',
  Tavily:    '#6366f1',
  Deepgram:  '#13ef95',
  Anthropic: '#c96442',
  Gemini:    '#f59e0b',
  Deepseek:  '#14b8a6'
};

const STATUS_COLOR = (code) => {
  if (code >= 200 && code < 300) return { text: 'var(--success)', bg: 'var(--success-subtle)' };
  if (code >= 400 && code < 500) return { text: 'var(--warning)', bg: 'var(--warning-subtle)' };
  return { text: 'var(--error)', bg: 'var(--error-subtle)' };
};

const relTime = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const FilterBar = ({ filters, onChange, onExport, exporting, total }) => (
  <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
    <input
      type="text"
      placeholder="Search endpoint..."
      value={filters.endpoint}
      onChange={e => onChange('endpoint', e.target.value)}
      style={{
        flex: 1, minWidth: 180, padding: '8px 12px',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
    <select
      value={filters.provider}
      onChange={e => onChange('provider', e.target.value)}
      style={{
        padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', cursor: 'pointer',
      }}
    >
      {PROVIDERS.map(p => <option key={p} value={p}>{p === 'All' ? 'All Providers' : p}</option>)}
    </select>
    <div style={{ display: 'flex', gap: 4 }}>
      {STATUS_FILTERS.map(s => (
        <button key={s} onClick={() => onChange('status', s)} style={{
          padding: '7px 13px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500,
          cursor: 'pointer', border: '1px solid',
          borderColor: filters.status === s ? 'var(--accent)' : 'var(--border)',
          background: filters.status === s ? 'var(--accent-subtle)' : 'transparent',
          color: filters.status === s ? 'var(--accent)' : 'var(--text-secondary)',
          transition: 'all var(--transition)',
        }}>{s}</button>
      ))}
    </div>
    <input
      type="date" value={filters.from}
      onChange={e => onChange('from', e.target.value)}
      style={{
        padding: '7px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', colorScheme: 'dark',
      }}
    />
    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>to</span>
    <input
      type="date" value={filters.to}
      onChange={e => onChange('to', e.target.value)}
      style={{
        padding: '7px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 12, outline: 'none', colorScheme: 'dark',
      }}
    />
    <button
      onClick={onExport} disabled={exporting}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
        background: 'transparent', border: '1px solid var(--border)',
        color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
        cursor: exporting ? 'not-allowed' : 'pointer', transition: 'all var(--transition)', marginLeft: 'auto',
      }}
      onMouseEnter={e => { if (!exporting) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {exporting
        ? <span style={{ width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
      }
      Export CSV {total > 0 && `(${total})`}
    </button>
  </div>
);

const LogRow = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_COLOR(log.statusCode);

  return (
    <>
      <tr
        onClick={() => setExpanded(p => !p)}
        style={{ borderBottom: expanded ? 'none' : '1px solid var(--border)', cursor: 'pointer', transition: 'background var(--transition)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <td style={{ padding: '11px 14px', width: 64 }}>
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', background: sc.bg, color: sc.text }}>
            {log.statusCode}
          </span>
        </td>
        <td style={{ padding: '11px 14px', maxWidth: 280 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>
              {log.method}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {log.endpoint}
            </span>
          </div>
        </td>
        <td style={{ padding: '11px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: PROVIDER_COLORS[log.provider] || '#8891aa', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>{log.provider}</span>
          </div>
        </td>
        <td style={{ padding: '11px 14px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: log.latencyMs > 2000 ? 'var(--error)' : log.latencyMs > 800 ? 'var(--warning)' : 'var(--success)' }}>
            {log.latencyMs}ms
          </span>
        </td>
        <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
          {log.tokensUsed ? log.tokensUsed.toLocaleString() : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
        <td style={{ padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
          {log.costUsd ? `$${log.costUsd.toFixed(5)}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
        <td style={{ padding: '11px 14px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {relTime(log.requestedAt)}
        </td>
        <td style={{ padding: '11px 14px', textAlign: 'right' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition)' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td colSpan={8} style={{ padding: '0 14px 14px 14px' }}>
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '14px 16px',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, fontSize: 12,
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Full Endpoint</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{log.endpoint}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Key Name</div>
                <div>{log.keyName}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Timestamp</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{new Date(log.requestedAt).toISOString()}</div>
              </div>
              {log.errorMessage && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Error</div>
                  <div style={{ color: 'var(--error)', fontFamily: 'var(--font-mono)' }}>{log.errorMessage}</div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const LogsPage = () => {
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [meta, setMeta]             = useState({ total: 0, hasMore: false, page: 1 });
  const [filters, setFilters]       = useState({ endpoint: '', provider: 'All', status: 'All', from: '', to: '' });

  const buildParams = (overrides = {}) => {
    const f = { ...filters, ...overrides };
    const p = new URLSearchParams();
    if (f.provider && f.provider !== 'All') p.set('provider', f.provider);
    if (f.status   && f.status   !== 'All') p.set('status',   f.status);
    if (f.endpoint) p.set('endpoint', f.endpoint);
    if (f.from)     p.set('from', f.from);
    if (f.to)       p.set('to',   f.to);
    return p;
  };

  const fetchLogs = useCallback(async (page = 1) => {
    if (page === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = buildParams();
      params.set('page', page);
      params.set('limit', 25);
      const { data } = await api.get(`/logs?${params}`);
      setLogs(page === 1 ? data.data : prev => [...prev, ...data.data]);
      setMeta({ ...data.meta, page });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]); // eslint-disable-line

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(1), filters.endpoint ? 350 : 0);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const handleLoadMore = () => fetchLogs(meta.page + 1);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = buildParams();
      const res = await api.get(`/logs/export?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const COLS = ['Status', 'Method / Endpoint', 'Provider', 'Latency', 'Tokens', 'Cost', 'Time', ''];

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>Request Logs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {meta.total > 0 ? `${meta.total} logs found` : 'Full history of API requests across all your keys.'}
        </p>
      </div>

      <FilterBar filters={filters} onChange={handleFilterChange} onExport={handleExport} exporting={exporting} total={meta.total} />

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No logs found</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try adjusting your filters.</div>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  {COLS.map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => <LogRow key={`${log._id}-${i}`} log={log} />)}
              </tbody>
            </table>
            {meta.hasMore && (
              <div style={{ padding: '16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <button
                  onClick={handleLoadMore} disabled={loadingMore}
                  style={{
                    padding: '9px 24px', borderRadius: 'var(--radius-sm)',
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => { if (!loadingMore) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {loadingMore && <span style={{ width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
                  {loadingMore ? 'Loading...' : `Load more (${meta.total - logs.length} remaining)`}
                </button>
              </div>
            )}
            {!meta.hasMore && logs.length > 0 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                Showing all {logs.length} logs
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LogsPage;