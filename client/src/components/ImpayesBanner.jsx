import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useDate } from '../context/DateContext';

const HIDDEN_ON = ['/login', '/carte'];

export default function ImpayesBanner() {
  const [impayes, setImpayes] = useState(0);
  const [visible, setVisible] = useState(true);
  const { mois, annee, label } = useDate();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    setVisible(true);
    api.get('/dashboard', { params: { mois, annee } })
      .then(r => setImpayes(r.data.stats.impayes))
      .catch(() => {});
  }, [mois, annee]);

  if (!visible || impayes === 0 || HIDDEN_ON.includes(pathname)) return null;

  return (
    <div style={{
      background: '#fef3c7', borderBottom: '1px solid #fbbf24',
      padding: '8px 24px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', fontSize: 13, flexShrink: 0,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#92400e' }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <strong>{impayes} loyer{impayes > 1 ? 's' : ''} impayé{impayes > 1 ? 's' : ''}</strong>
        &nbsp;en {label}
      </span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={() => navigate('/paiements')} style={{
          background: '#d97706', color: '#fff', border: 'none',
          padding: '4px 12px', borderRadius: 6, fontSize: 12,
          fontWeight: 500, cursor: 'pointer',
        }}>
          Régulariser →
        </button>
        <button onClick={() => setVisible(false)} style={{
          background: 'transparent', border: 'none',
          color: '#b45309', cursor: 'pointer', fontSize: 16,
        }}>×</button>
      </div>
    </div>
  );
}
