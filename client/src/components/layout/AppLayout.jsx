import Sidebar from './Sidebar';

const AppLayout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
      {children}
    </main>
  </div>
);

export default AppLayout;
