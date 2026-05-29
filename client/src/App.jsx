import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DateProvider }          from './context/DateContext';
import Sidebar    from './components/Layout/Sidebar';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Biens      from './pages/Biens';
import Carte      from './pages/Carte';
import Locataires from './pages/Locataires';
import Paiements  from './pages/Paiements';
import Rapports   from './pages/Rapports';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" style={{ height: '100vh' }}>⏳ Chargement...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/biens"      element={<Biens />} />
          <Route path="/carte"      element={<Carte />} />
          <Route path="/locataires" element={<Locataires />} />
          <Route path="/paiements"  element={<Paiements />} />
          <Route path="/rapports"   element={<Rapports />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DateProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          } />
        </Routes>
      </DateProvider>
    </AuthProvider>
  );
}
