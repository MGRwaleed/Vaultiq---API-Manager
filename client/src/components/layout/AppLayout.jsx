import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main style={{ marginTop: 'var(--topbar-height)', flex: 1, padding: 32, minWidth: 0 }}>
        {children}
      </main>
    </div>
  </div>
);

export default AppLayout;