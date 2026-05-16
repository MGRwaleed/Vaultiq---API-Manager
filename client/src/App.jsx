import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ApiKeysPage from './pages/ApiKeysPage';
import UsagePage from './pages/UsagePage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';
import ComingSoon from './pages/ComingSoon';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login"  element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />

        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/keys"      element={<ProtectedRoute><AppLayout><ApiKeysPage /></AppLayout></ProtectedRoute>} />
        <Route path="/usage"     element={<ProtectedRoute><AppLayout><UsagePage /></AppLayout></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><AppLayout><LogsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/health"    element={<ProtectedRoute><AppLayout><ComingSoon title="Key Health Checks" /></AppLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
