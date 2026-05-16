const ComingSoon = ({ title }) => (
  <div style={{
    padding: 32, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', minHeight: '60vh',
    textAlign: 'center', gap: 12,
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 8,
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>
    <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 320, lineHeight: 1.6 }}>
      This section is coming in the next phase. The backend routes and models will be wired up here.
    </p>
    <span style={{
      marginTop: 8, padding: '4px 12px', borderRadius: 99,
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
    }}>
      Phase 2
    </span>
  </div>
);

export default ComingSoon;
