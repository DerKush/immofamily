import { useLocation } from 'react-router-dom';

const TITLES = {
  '/':           'Tableau de bord',
  '/biens':      'Biens immobiliers',
  '/carte':      'Carte interactive',
  '/locataires': 'Locataires',
  '/paiements':  'Loyers & Paiements',
  '/rapports':   'Rapports',
};

export default function Topbar({ onAdd, addLabel }) {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || 'ImmoFamily';

  return (
    <div style={{
      background: 'var(--white)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px', height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 500 }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          background: 'var(--sand-2)', border: '1px solid var(--border)',
          padding: '4px 10px', borderRadius: 20, fontSize: 11, color: 'var(--text-2)', fontWeight: 500,
        }}>
          📅 Mai 2025
        </span>
        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd}>
            + {addLabel || 'Ajouter'}
          </button>
        )}
      </div>
    </div>
  );
}
