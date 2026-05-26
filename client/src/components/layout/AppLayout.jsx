import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <TopBar />
      <main style={{ marginTop: 'var(--topbar-height)', flex: 1, padding: 32 }}>
        {children}
      </main>
    </div>
  </div>
);

export default AppLayout;