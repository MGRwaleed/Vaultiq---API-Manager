import { Key, Activity, DollarSign, ShieldCheck, TrendingUp, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import './DashboardPage.css';

// ── Dummy data (replace with real API calls in the next step) ──
const DUMMY_STATS = {
  totalKeysAdded: 8,
  activeKeys: 6,
  requestsToday: 1_243,
  estimatedCostThisMonth: 14.72,
  errorRate: 2.3,
  topProviders: [
    { _id: 'OpenAI',    count: 890 },
    { _id: 'Anthropic', count: 312 },
    { _id: 'Groq',      count: 198 },
    { _id: 'Tavily',    count: 87 },
    { _id: 'Deepgram',  count: 41 },
  ]
};

const DUMMY_LOGS = [
  { id: 1, provider: 'OpenAI',    endpoint: '/v1/chat/completions', status: 200, latency: 843,  time: '2m ago',  error: false },
  { id: 2, provider: 'Anthropic', endpoint: '/v1/messages',         status: 200, latency: 1120, time: '5m ago',  error: false },
  { id: 3, provider: 'Groq',      endpoint: '/openai/v1/chat/completions', status: 429, latency: 210, time: '8m ago', error: true },
  { id: 4, provider: 'OpenAI',    endpoint: '/v1/embeddings',        status: 200, latency: 340,  time: '12m ago', error: false },
  { id: 5, provider: 'Tavily',    endpoint: '/search',               status: 200, latency: 670,  time: '18m ago', error: false },
  { id: 6, provider: 'Deepgram',  endpoint: '/v1/listen',            status: 401, latency: 95,   time: '24m ago', error: true },
];

const PROVIDER_COLORS = {
  OpenAI: '#10b981', Anthropic: '#8b5cf6', Groq: '#f59e0b',
  Tavily: '#3b82f6', Deepgram: '#ec4899', Other: '#6b7280'
};

const maxCount = DUMMY_STATS.topProviders[0]?.count ?? 1;

export default function DashboardPage() {
  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your API usage and key health.</p>
        </div>
        <span className="dummy-badge">
          <TrendingUp size={12} /> Showing demo data
        </span>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard
          label="Total APIs Added"
          value={DUMMY_STATS.totalKeysAdded}
          sub={`${DUMMY_STATS.activeKeys} currently active`}
          icon={Key}
          accent="blue"
        />
        <StatCard
          label="Requests Today"
          value={DUMMY_STATS.requestsToday.toLocaleString()}
          sub="Across all providers"
          icon={Activity}
          accent="green"
        />
        <StatCard
          label="Est. Cost This Month"
          value={`$${DUMMY_STATS.estimatedCostThisMonth.toFixed(2)}`}
          sub="Tracked from request logs"
          icon={DollarSign}
          accent="amber"
        />
        <StatCard
          label="Error Rate"
          value={`${DUMMY_STATS.errorRate}%`}
          sub="Last 30 days"
          icon={ShieldCheck}
          accent={DUMMY_STATS.errorRate > 5 ? 'red' : 'green'}
        />
      </div>

      {/* Lower row */}
      <div className="dashboard-lower">
        {/* Top providers */}
        <section className="card provider-card">
          <div className="card-header">
            <h2 className="card-title">Most Used Providers</h2>
            <span className="card-hint">This month</span>
          </div>
          <div className="provider-list">
            {DUMMY_STATS.topProviders.map(({ _id, count }) => (
              <div key={_id} className="provider-row">
                <div className="provider-meta">
                  <span
                    className="provider-dot"
                    style={{ background: PROVIDER_COLORS[_id] ?? PROVIDER_COLORS.Other }}
                  />
                  <span className="provider-name">{_id}</span>
                  <span className="provider-count">{count.toLocaleString()}</span>
                </div>
                <div className="provider-bar-track">
                  <div
                    className="provider-bar-fill"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: PROVIDER_COLORS[_id] ?? PROVIDER_COLORS.Other
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section className="card logs-card">
          <div className="card-header">
            <h2 className="card-title">Recent Requests</h2>
            <a href="/logs" className="card-link">View all</a>
          </div>
          <table className="log-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_LOGS.map(log => (
                <tr key={log.id} className={log.error ? 'row-error' : ''}>
                  <td>
                    <span className="log-provider">
                      <span
                        className="provider-dot sm"
                        style={{ background: PROVIDER_COLORS[log.provider] ?? PROVIDER_COLORS.Other }}
                      />
                      {log.provider}
                    </span>
                  </td>
                  <td><code className="endpoint">{log.endpoint}</code></td>
                  <td>
                    <span className={`status-badge status-${log.error ? 'err' : 'ok'}`}>
                      {log.error
                        ? <XCircle size={11} />
                        : <CheckCircle2 size={11} />}
                      {log.status}
                    </span>
                  </td>
                  <td className="latency">{log.latency}ms</td>
                  <td>
                    <span className="log-time">
                      <Clock size={11} /> {log.time}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
