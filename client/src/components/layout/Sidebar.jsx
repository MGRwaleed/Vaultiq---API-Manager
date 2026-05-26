import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Overview',   icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { to: '/keys',      label: 'API Keys',   icon: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4' },
  { to: '/usage',     label: 'Analytics',  icon: 'M18 20V10 M12 20V4 M6 20v-6' },
  { to: '/logs',      label: 'Logs',       icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { to: '/health',    label: 'Health',     icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { to: '/settings',  label: 'Settings',   icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
];

const Icon = ({ path }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {path.split(' M').map((d, i) => <path key={i} d={i === 0 ? d : 'M' + d} />)}
  </svg>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const W = collapsed ? 56 : 240;

  return (
    <>
      {/* Push main content over */}
      <div style={{ width: W, flexShrink: 0, transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)' }} />

      <aside style={{
        position: 'fixed', left: 0, top: 0, zIndex: 50,
        width: W, height: '100vh',
        background: 'var(--surface-bright)',
        borderRight: '1px solid var(--outline-variant)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '18px 14px 16px',
          borderBottom: '1px solid var(--outline-variant)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : 'auto',
            overflow: 'hidden',
            transition: 'opacity 0.15s, width 0.22s',
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.01em' }}>VaultIQ</div>
            <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontFamily: 'var(--font-mono)' }}>API Console</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
          {NAV.map(item => (
            <div key={item.to} style={{ position: 'relative' }} className="nav-item-wrap">
              <NavLink to={item.to} title={collapsed ? item.label : ''} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8,
                color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                background: isActive ? '#e8effc' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                transition: 'all var(--transition)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}>
                <Icon path={item.icon} />
                <span style={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : 'auto',
                  overflow: 'hidden',
                  transition: 'opacity 0.12s, width 0.22s',
                }}>
                  {item.label}
                </span>
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(p => !p)}
          style={{
            margin: '8px 8px',
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid var(--outline-variant)',
            background: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            color: 'var(--on-surface-variant)',
            fontSize: 13,
            transition: 'background var(--transition)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
            style={{ flexShrink: 0, transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s' }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <polyline points="5 8 8 12 5 16"/>
          </svg>
          <span style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : 'auto',
            overflow: 'hidden',
            transition: 'opacity 0.12s, width 0.22s',
          }}>
            Collapse
          </span>
        </button>

        {/* Add API Key button */}
        {!collapsed && (
          <div style={{ padding: '0 8px 8px' }}>
            <button
              onClick={() => navigate('/keys')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 8,
                background: 'var(--primary)', color: 'var(--on-primary)',
                fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                transition: 'opacity var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add API Key
            </button>
          </div>
        )}

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          borderTop: '1px solid var(--outline-variant)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#e8effc', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{
            flex: 1, minWidth: 0,
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : 'auto',
            overflow: 'hidden',
            transition: 'opacity 0.15s, width 0.22s',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
          {!collapsed && (
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Sign out"
              style={{ padding: 4, borderRadius: 4, color: 'var(--on-surface-variant)', cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;