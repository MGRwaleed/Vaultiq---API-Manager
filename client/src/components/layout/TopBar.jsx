import { useState } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard Overview',
  '/keys':      'API Keys',
  '/usage':     'Analytics',
  '/logs':      'Request Logs',
  '/health':    'Key Health',
  '/settings':  'Settings',
};

const TopBar = () => {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'VaultIQ';
  const [search, setSearch] = useState('');

  return (
    <header style={{
      position: 'fixed', top: 0, right: 0,
      left: 'var(--sidebar-width)', zIndex: 40,
      height: 'var(--topbar-height)',
      background: 'var(--surface-bright)',
      borderBottom: '1px solid var(--outline-variant)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      gap: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', whiteSpace: 'nowrap' }}>{title}</h2>
        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search resources..."
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)',
              borderRadius: 8, fontSize: 13, color: 'var(--on-surface)', outline: 'none',
              transition: 'border-color var(--transition)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--outline-variant)'}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Notifications */}
        <button style={{ padding: 8, borderRadius: '50%', color: 'var(--on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>

        {/* Help */}
        <button style={{ padding: 8, borderRadius: '50%', color: 'var(--on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-high)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--outline-variant)', margin: '0 4px' }} />

        {/* Profile avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--surface-container-high)',
          border: '1px solid var(--outline-variant)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: 'var(--primary)',
          cursor: 'pointer',
        }}>
          W
        </div>
      </div>
    </header>
  );
};

export default TopBar;