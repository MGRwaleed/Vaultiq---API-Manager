import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../lib/api';

/* ── Constants ────────────────────────────────────────────────── */
const PROVIDER_COLORS = {
  OpenAI:    '#10a37f',
  Groq:      '#f55036',
  Tavily:    '#6366f1',
  Deepgram:  '#ec4899',
  Deepseek:  '#00c2ff',
  Anthropic: '#c96442',
  Gemini:    '#f59e0b'
};

const CHART_STYLE = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 20,
};

/* ── Reusable components ──────────────────────────────────────── */
const SummaryCard = ({ label, value, sub, color }) => (
  <div style={{
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '18px 20px',
    borderLeft: `3px solid ${color || 'var(--accent)'}`,
  }}>
    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
  </div>
);

const ChartCard = ({ title, sub, children, fullWidth }) => (
  <div style={{ ...CHART_STYLE, gridColumn: fullWidth ? '1 / -1' : undefined }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
    {children}
  </div>
);

/* Custom tooltip shared across charts */
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '10px 14px',
      fontSize: 12, boxShadow: 'var(--shadow)',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Range Selector ───────────────────────────────────────────── */
const RANGES = ['7d', '14d', '30d'];

const RangeSelector = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {RANGES.map(r => (
      <button key={r} onClick={() => onChange(r)} style={{
        padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 500,
        cursor: 'pointer', border: '1px solid',
        borderColor: value === r ? 'var(--accent)' : 'var(--border)',
        background: value === r ? 'var(--accent-subtle)' : 'transparent',
        color: value === r ? 'var(--accent)' : 'var(--text-secondary)',
        transition: 'all var(--transition)',
      }}>{r}</button>
    ))}
  </div>
);

/* ── Main Page ────────────────────────────────────────────────── */
const UsagePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('14d');
  const [activeProviders, setActiveProviders] = useState(Object.keys(PROVIDER_COLORS));

  useEffect(() => {
    api.get('/usage/stats')
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const toggleProvider = (p) => {
    setActiveProviders(prev =>
      prev.includes(p)
        ? prev.length > 1 ? prev.filter(x => x !== p) : prev
        : [...prev, p]
    );
  };

  const sliceCount = range === '7d' ? 7 : range === '14d' ? 14 : 30;
  const requestsData = data?.requestsPerDay?.slice(-sliceCount) || [];
  const costData     = data?.costPerDay?.slice(-sliceCount) || [];
  const errorData    = data?.errorRatePerDay?.slice(-sliceCount) || [];
  const providers    = Object.keys(PROVIDER_COLORS);

  const tickInterval = sliceCount === 7 ? 0 : sliceCount === 14 ? 1 : 4;

  if (loading) return (
    <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
      <span style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
      Loading usage data...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const { summary, latencyByProvider, providerShare } = data;

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>Usage Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Monitor requests, costs, latency, and error rates across all your APIs.
          </p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        <SummaryCard label="Total Requests" value={summary.totalRequestsThisMonth.toLocaleString()} sub="this month" color="var(--accent)" />
        <SummaryCard label="Total Cost" value={`$${summary.totalCostThisMonth.toFixed(2)}`} sub="this month" color="var(--warning)" />
        <SummaryCard label="Avg Latency" value={`${summary.avgLatencyMs}ms`} sub="across all providers" color="var(--info)" />
        <SummaryCard label="Error Rate" value={`${summary.errorRatePercent}%`} sub="last 30 days" color="var(--error)" />
        <SummaryCard label="Top Provider" value={summary.topProvider} sub="by request volume" color={PROVIDER_COLORS[summary.topProvider]} />
      </div>

      {/* Provider Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>Filter:</span>
        {providers.map(p => (
          <button key={p} onClick={() => toggleProvider(p)} style={{
            padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
            cursor: 'pointer', border: '1px solid',
            borderColor: activeProviders.includes(p) ? PROVIDER_COLORS[p] : 'var(--border)',
            background: activeProviders.includes(p) ? `${PROVIDER_COLORS[p]}18` : 'transparent',
            color: activeProviders.includes(p) ? PROVIDER_COLORS[p] : 'var(--text-muted)',
            transition: 'all var(--transition)',
          }}>{p}</button>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Requests over time — stacked area */}
        <ChartCard title="Requests Over Time" sub="daily request volume by provider" fullWidth>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={requestsData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {providers.map(p => (
                  <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PROVIDER_COLORS[p]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={PROVIDER_COLORS[p]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} interval={tickInterval} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              {providers.filter(p => activeProviders.includes(p)).map(p => (
                <Area key={p} type="monotone" dataKey={p} stroke={PROVIDER_COLORS[p]} fill={`url(#grad-${p})`} strokeWidth={1.8} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Cost over time — stacked bar */}
        <ChartCard title="Cost Over Time" sub="daily spend in USD by provider">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} interval={tickInterval} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} width={40} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip prefix="$" />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              {providers.filter(p => activeProviders.includes(p)).map(p => (
                <Bar key={p} dataKey={p} stackId="cost" fill={PROVIDER_COLORS[p]} radius={p === providers[providers.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Error rate — line chart */}
        <ChartCard title="Error Rate" sub="% of requests that returned 4xx/5xx">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={errorData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} interval={tickInterval} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} width={36} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip suffix="%" />} />
              <Line type="monotone" dataKey="rate" stroke="var(--error)" strokeWidth={2} dot={false} name="Error Rate" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Provider share — donut */}
        <ChartCard title="Request Share" sub="total requests by provider this month">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={providerShare}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {providerShare.map(entry => (
                  <Cell key={entry.name} fill={PROVIDER_COLORS[entry.name] || '#8891aa'} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => val.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Latency table */}
        <ChartCard title="Latency by Provider" sub="p50 and p95 response times in ms" fullWidth>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Provider', 'p50 (median)', 'p95', 'Rating'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {latencyByProvider.map((row, i) => {
                const rating = row.p50 < 400
                  ? { label: 'Fast', color: 'var(--success)' }
                  : row.p50 < 900
                    ? { label: 'Good', color: 'var(--warning)' }
                    : { label: 'Slow', color: 'var(--error)' };
                return (
                  <tr key={row.provider} style={{ borderBottom: i < latencyByProvider.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '11px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: PROVIDER_COLORS[row.provider], display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{row.provider}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{row.p50}ms</td>
                    <td style={{ padding: '11px 12px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>{row.p95}ms</td>
                    <td style={{ padding: '11px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: rating.color, background: `${rating.color}18`, padding: '3px 10px', borderRadius: 99 }}>
                        {rating.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ChartCard>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default UsagePage;