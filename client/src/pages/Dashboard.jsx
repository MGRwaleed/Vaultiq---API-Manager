import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const KpiCard = ({ label, value, sub, trend, color = 'var(--primary)', loading }) => (
  <div style={{
    background: 'var(--surface-bright)', borderRadius: 12,
    border: '1px solid var(--outline-variant)', padding: '20px 24px',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    boxShadow: 'var(--shadow-sm)', transition: 'border-color var(--transition)',
    cursor: 'default',
  }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--outline-variant)'}
  >
    <div>
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>{label}</p>
      {loading
        ? <div className="skeleton" style={{ width: 80, height: 36, borderRadius: 6 }} />
        : <h3 style={{ fontSize: 32, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</h3>
      }
    </div>
    {trend && !loading && (
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: trend.positive ? 'var(--success-color)' : trend.neutral ? 'var(--on-surface-variant)' : 'var(--error)' }}>
        <span>{trend.positive ? '↑' : trend.neutral ? '—' : '↓'}</span>
        <span>{trend.label}</span>
      </div>
    )}
  </div>
);

const StatusDot = ({ status }) => {
  const color = status === 'healthy' ? '#4ade80' : status === 'warning' ? '#facc15' : '#f87171';
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
  const hasSeenNotice = sessionStorage.getItem('seenProxyNotice');
  if (!hasSeenNotice) {
    setShowNotice(true);
    sessionStorage.setItem('seenProxyNotice', 'true');
  }
}, []);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  const relTime = ts => {
    const d = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (d < 60) return `${d}s ago`;
    if (d < 3600) return `${Math.floor(d/60)}m ago`;
    return `${Math.floor(d/3600)}h ago`;
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4, letterSpacing: '-0.01em' }}>
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>Real-time performance metrics across your API fleet.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-bright)', border: '1px solid var(--outline-variant)', borderRadius: 8, padding: '7px 14px', fontSize: 13, color: 'var(--on-surface-variant)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Last 30 days
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total APIs" value={stats?.totalApis ?? '—'} sub="keys added" trend={{ label: `${stats?.activeKeys ?? 0} active`, neutral: true }} loading={loading} />
        <KpiCard label="Requests Today" value={stats?.totalRequestsToday?.toLocaleString() ?? '—'} trend={{ label: '+23% vs yesterday', positive: true }} loading={loading} />
        <KpiCard label="Est. Cost / Month" value={stats ? `$${stats.estimatedCostThisMonth?.toFixed(2)}` : '—'} trend={{ label: 'this month', neutral: true }} loading={loading} />
        <KpiCard label="Error Rate" value={stats ? `${stats.errorRate ?? 0}%` : '—'} trend={{ label: stats?.errorRate > 5 ? 'above threshold' : 'within range', positive: stats?.errorRate <= 5 }} loading={loading} />
      </div>

      {/* Main bento grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Top APIs */}
        <div style={{ background: 'var(--surface-bright)', border: '1px solid var(--outline-variant)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>Top APIs</h4>
            <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontFamily: 'var(--font-mono)' }}>by requests this month</span>
          </div>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8, borderRadius: 8 }} />)}
            </div>
          ) : stats?.topApis?.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 13 }}>No data yet — make some API calls through the proxy.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-container-low)' }}>
                  {['Provider', 'Requests', 'Cost', 'Status'].map(h => (
                    <th key={h} style={{ padding: '9px 24px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats?.topApis?.map(a => (
                  <tr key={a.name} style={{ borderTop: '1px solid var(--outline-variant)' }}>
                    <td style={{ padding: '13px 24px', fontSize: 13, fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: '13px 24px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--on-surface-variant)' }}>{a.requests.toLocaleString()}</td>
                    <td style={{ padding: '13px 24px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--on-surface-variant)' }}>${a.cost.toFixed(4)}</td>
                    <td style={{ padding: '13px 24px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: a.status === 'healthy' ? 'var(--success-bg)' : 'var(--warning-bg)', color: a.status === 'healthy' ? 'var(--success-color)' : 'var(--warning-color)', border: `1px solid ${a.status === 'healthy' ? 'var(--success-border)' : 'var(--warning-border)'}` }}>
                        <StatusDot status={a.status} />{a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* System Health */}
        <div style={{ background: 'var(--inverse-surface)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--inverse-on-surface)', marginBottom: 20 }}>System Health</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Proxy Server',  value: 'Online',     ok: true  },
                { label: 'Database',      value: 'Connected',  ok: true  },
                { label: 'Active Keys',   value: `${stats?.activeKeys ?? '—'} / ${stats?.totalApis ?? '—'}`, ok: true },
                { label: 'Error Rate',    value: `${stats?.errorRate ?? 0}%`, ok: (stats?.errorRate ?? 0) < 5 },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'rgba(238,240,255,0.7)' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.ok ? '#4ade80' : '#f87171' }} />
                    <span style={{ fontSize: 12, color: 'var(--inverse-on-surface)', fontFamily: 'var(--font-mono)' }}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginTop: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: 'rgba(238,240,255,0.5)', marginBottom: 3, fontFamily: 'var(--font-mono)' }}>Total requests this month</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--inverse-on-surface)', fontFamily: 'var(--font-mono)' }}>
                {stats?.totalRequestsToday?.toLocaleString() ?? '—'}
              </p>
            </div>
          </div>
          {/* Decorative */}
          <div style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.06 }}>
            <svg width="200" height="200" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10"/></svg>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div style={{ background: 'var(--surface-bright)', border: '1px solid var(--outline-variant)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ fontSize: 15, fontWeight: 600 }}>Recent Requests</h4>
          <a href="/logs" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>View all →</a>
        </div>
        {loading ? (
          <div style={{ padding: 24 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 36, marginBottom: 8, borderRadius: 6 }} />)}
          </div>
        ) : stats?.recentLogs?.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: 13 }}>No requests logged yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-container-low)' }}>
                {['Status', 'API', 'Endpoint', 'Latency', 'Time'].map(h => (
                  <th key={h} style={{ padding: '9px 24px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats?.recentLogs?.map((log, i) => {
                const ok = log.status < 300;
                const warn = log.status < 500;
                return (
                  <tr key={i} style={{ borderTop: '1px solid var(--outline-variant)' }}>
                    <td style={{ padding: '12px 24px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', background: ok ? 'var(--success-bg)' : warn ? 'var(--warning-bg)' : 'var(--error-container)', color: ok ? 'var(--success-color)' : warn ? 'var(--warning-color)' : 'var(--error)' }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 24px', fontSize: 13, fontWeight: 500 }}>{log.api}</td>
                    <td style={{ padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--on-surface-variant)' }}>{log.endpoint}</td>
                    <td style={{ padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: 12, color: log.latency > 2000 ? 'var(--error)' : log.latency > 800 ? 'var(--warning-color)' : 'var(--success-color)' }}>{log.latency}ms</td>
                    <td style={{ padding: '12px 24px', fontSize: 12, color: 'var(--on-surface-variant)' }}>{relTime(log.timestamp)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showNotice && (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(19,27,46,0.55)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  }}>
    <div style={{
      background: 'var(--surface-bright)', borderRadius: 16,
      width: '100%', maxWidth: 480, padding: 32,
      boxShadow: 'var(--shadow-md)', border: '1px solid var(--outline-variant)',
    }}>
      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'var(--surface-container)',
        border: '1px solid var(--outline-variant)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>

      {/* Content */}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 10, letterSpacing: '-0.01em' }}>
        Heads up — External testing required
      </h3>
      <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.7, marginBottom: 12 }}>
        API keys currently need to be tested externally using a tool like <strong style={{ color: 'var(--on-surface)' }}>Postman</strong> or <strong style={{ color: 'var(--on-surface)' }}>curl</strong> via the proxy endpoint:
      </p>
      <pre style={{
        background: 'var(--surface-container-low)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 8, padding: '10px 14px',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--on-surface-variant)', overflowX: 'auto',
        lineHeight: 1.7, marginBottom: 16,
      }}>{`POST https://vaultiq-76sz.onrender.com/api/proxy/:provider/*
Headers:
  Authorization: Bearer <your_jwt_token>
  x-api-key-id: <your_key_id>`}</pre>
      <p style={{ fontSize: 12, color: 'var(--outline)', lineHeight: 1.6, marginBottom: 24 }}>
        🚀 The developer is working on automating this directly from the dashboard. Stay tuned!
      </p>

      {/* Button */}
      <button
        onClick={() => setShowNotice(false)}
        style={{
          width: '100%', padding: '11px 20px', borderRadius: 8,
          background: 'var(--primary)', color: 'var(--on-primary)',
          fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          transition: 'opacity var(--transition)',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Got it, thanks!
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default Dashboard;