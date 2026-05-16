import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

/* ── Tiny sparkline using SVG ─────────────────────────────────── */
const Sparkline = ({ data, color = 'var(--accent)', height = 40 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 120, h = height;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
};

/* ── Stat Card ────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, sparkData, sparkColor, trend, loading }) => (
  <div style={{
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: 20,
    display: 'flex', flexDirection: 'column', gap: 12,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.03em' }}>
            {label}
          </span>
        </div>
        {loading ? (
          <div style={{ width: 80, height: 28, background: 'var(--bg-elevated)', borderRadius: 4, animation: 'pulse 1.4s ease-in-out infinite' }} />
        ) : (
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {value}
          </div>
        )}
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{sub}</div>}
      </div>
      {sparkData && !loading && (
        <div style={{ opacity: 0.7 }}>
          <Sparkline data={sparkData} color={sparkColor} />
        </div>
      )}
    </div>
    {trend && !loading && (
      <div style={{
        fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
        color: trend.direction === 'up' ? 'var(--success)' : trend.direction === 'down' ? 'var(--error)' : 'var(--text-muted)',
      }}>
        {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '–'}
        {trend.label}
      </div>
    )}
  </div>
);

/* ── Status Badge ─────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const colors = {
    healthy: { bg: 'var(--success-subtle)', text: 'var(--success)', dot: 'var(--success)' },
    warning: { bg: 'var(--warning-subtle)', text: 'var(--warning)', dot: 'var(--warning)' },
    error:   { bg: 'var(--error-subtle)',   text: 'var(--error)',   dot: 'var(--error)' },
  };
  const c = colors[status] || colors.healthy;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 99,
      background: c.bg, color: c.text, fontSize: 11, fontWeight: 500,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {status}
    </span>
  );
};

/* ── Provider icons via initial letters ───────────────────────── */
const ProviderIcon = ({ name }) => (
  <div style={{
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  }}>
    {name[0]}
  </div>
);

/* ── Relative time helper ─────────────────────────────────────── */
const relTime = (ts) => {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

/* ── Dashboard Page ───────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Here's an overview of your API usage. All times in UTC.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          background: 'var(--error-subtle)', border: '1px solid rgba(248,113,113,0.3)',
          color: 'var(--error)', fontSize: 13, marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard
          loading={loading}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"/><line x1="8" y1="12" x2="16" y2="12"/></svg>}
          label="Total APIs Added"
          value={stats?.totalApis ?? '—'}
          sub={`${stats?.activeKeys ?? '—'} active`}
          trend={{ direction: 'up', label: '+1 this week' }}
        />
        <StatCard
          loading={loading}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
          label="Total Requests Today"
          value={stats?.totalRequestsToday?.toLocaleString() ?? '—'}
          sub="across all APIs"
          sparkData={stats?.requestsOverWeek}
          sparkColor="var(--accent)"
          trend={{ direction: 'up', label: '+23% vs yesterday' }}
        />
        <StatCard
          loading={loading}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
          label="Est. Cost This Month"
          value={stats ? `$${stats.estimatedCostThisMonth.toFixed(2)}` : '—'}
          sub="OpenAI accounts for 57%"
          sparkData={stats?.costOverWeek}
          sparkColor="var(--warning)"
          trend={{ direction: 'up', label: '+$4.10 this week' }}
        />
        <StatCard
          loading={loading}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
          label="Active Keys"
          value={stats?.activeKeys ?? '—'}
          sub={`of ${stats?.totalApis ?? '—'} total`}
          trend={{ direction: 'neutral', label: '1 key needs attention' }}
        />
      </div>

      {/* Lower section: Top APIs + Recent Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Top APIs */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Top APIs</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>by requests today</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {loading ? (
              [1,2,3,4].map(i => (
                <div key={i} style={{ padding: '10px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', animation: 'pulse 1.4s ease-in-out infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: 80, height: 12, background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
                    <div style={{ width: 120, height: 10, background: 'var(--bg-elevated)', borderRadius: 4, animation: 'pulse 1.4s ease-in-out infinite' }} />
                  </div>
                </div>
              ))
            ) : stats?.topApis?.map(api => (
              <div key={api.name} style={{
                padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--border)',
              }}>
                <ProviderIcon name={api.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{api.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {api.requests.toLocaleString()} req · ${api.cost.toFixed(2)}
                  </div>
                </div>
                <StatusBadge status={api.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Logs */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Recent Logs</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>last 5 requests</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <div key={i} style={{ padding: '10px 20px' }}>
                  <div style={{ width: '100%', height: 12, background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
                </div>
              ))
            ) : stats?.recentLogs?.map(log => {
              const statusColor = log.status < 300 ? 'var(--success)' : log.status < 500 ? 'var(--warning)' : 'var(--error)';
              return (
                <div key={log.id} style={{
                  padding: '10px 20px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: statusColor, minWidth: 30,
                  }}>
                    {log.status}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.api} · {log.endpoint}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{log.latency}ms</div>
                    <div>{relTime(log.timestamp)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
