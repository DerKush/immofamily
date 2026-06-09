import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAVITEMS = [
  { to: '/',           label: 'Tableau de bord',   icon: '📊', section: 'Principal' },
  { to: '/biens',      label: 'Biens immobiliers',  icon: '🏠' },
  { to: '/carte',      label: 'Carte interactive',  icon: '🗺️' },
  { to: '/locataires', label: 'Locataires',         icon: '👥', section: 'Gestion' },
  { to: '/paiements',  label: 'Loyers & Paiements', icon: '💰', dot: true },
  { to: '/tresorerie', label: 'Trésorerie',         icon: '🏦', section: 'Finances' },
  { to: '/depenses',   label: 'Dépenses',           icon: '💸' },
  { to: '/membres',    label: 'Membres & Parts',    icon: '🤝' },
  { to: '/rapports',   label: 'Rapports',           icon: '📋', section: 'Rapports' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{
      width: 'var(--sidebar-w)', minWidth: 'var(--sidebar-w)',
      background: 'var(--green)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 18, fontWeight: 600 }}>
          🏘 ImmoFamily
        </div>
        <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 11, marginTop: 2 }}>
          Gestion du patrimoine familial
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAVITEMS.map((item, i) => (
          <div key={item.to}>
            {item.section && (
              <div style={{
                padding: '10px 16px 4px',
                fontSize: 10, fontWeight: 500,
                color: 'rgba(255,255,255,.35)',
                textTransform: 'uppercase', letterSpacing: '.8px',
                marginTop: i > 0 ? 4 : 0,
              }}>
                {item.section}
              </div>
            )}
            <NavLink
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', cursor: 'pointer',
                color: isActive ? '#fff' : 'rgba(255,255,255,.65)',
                fontSize: 13,
                borderLeft: `3px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
                background: isActive ? 'rgba(255,255,255,.1)' : 'transparent',
                fontWeight: isActive ? 500 : 400,
                textDecoration: 'none', transition: 'all .15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.dot && (
                <span style={{
                  width: 7, height: 7, background: 'var(--terra)',
                  borderRadius: '50%', marginLeft: 'auto',
                }} />
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 8, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--gold)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, fontWeight: 500,
              color: 'var(--green)', flexShrink: 0,
            }}>
              {user?.nom?.slice(0, 2).toUpperCase() || 'FK'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{user?.nom || 'Famille'}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
                {user?.role === 'admin' ? 'Administrateur' : 'Membre'}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '5px', borderRadius: 5,
            background: 'rgba(255,255,255,.1)', border: 'none',
            color: 'rgba(255,255,255,.6)', fontSize: 11, cursor: 'pointer',
          }}>
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
