import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  {
    section: 'Immobilier',
    items: [
      { to: '/',           label: 'Tableau de bord',   icon: '▦' },
      { to: '/biens',      label: 'Mes biens',          icon: '⌂' },
      { to: '/carte',      label: 'Carte interactive',  icon: '◎' },
    ],
  },
  {
    section: 'Gestion',
    items: [
      { to: '/locataires', label: 'Locataires',         icon: '⊕' },
      { to: '/paiements',  label: 'Paiements',          icon: '◈', dot: true },
    ],
  },
  {
    section: 'Finances',
    items: [
      { to: '/tresorerie', label: 'Trésorerie',         icon: '💰' },
      { to: '/depenses',   label: 'Dépenses',           icon: '💸' },
      { to: '/membres',    label: 'Membres & Parts',    icon: '👥' },
    ],
  },
  {
    section: 'Rapports',
    items: [
      { to: '/rapports',   label: 'Rapports mensuels',  icon: '◉' },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.nom
    ? user.nom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'FK';

  return (
    <aside style={{
      width: 'var(--sidebar-w)', minWidth: 'var(--sidebar-w)',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{
        padding: '18px 16px 15px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, background: 'var(--primary)',
          borderRadius: 9, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, color: '#fff' }}>⌂</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>ImmoFamily</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Abidjan · Patrimoine</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.section}>
            <div style={{
              fontSize: 9.5, fontWeight: 600, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: '0.9px',
              padding: '12px 10px 4px',
            }}>
              {group.section}
            </div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px',
                  borderRadius: 8, margin: '1px 0',
                  borderLeft: `2px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                  background: isActive ? 'var(--primary-soft)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-2)',
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                  textDecoration: 'none', transition: 'all 0.13s',
                })}
              >
                <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
                {item.dot && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--danger)',
                    color: '#fff', fontSize: 9, padding: '1px 5px',
                    borderRadius: 10, fontWeight: 600,
                  }}>3</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 10px', borderRadius: 9,
          background: 'var(--bg)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nom || 'Famille Koné'}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
              {user?.role === 'admin' ? 'Administrateur' : 'Membre'}
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Déconnexion"
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 6, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', fontSize: 13, cursor: 'pointer',
              flexShrink: 0,
            }}
          >⏻</button>
        </div>
      </div>
    </aside>
  );
}
