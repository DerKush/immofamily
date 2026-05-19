import { useEffect, useState } from 'react';
import api from '../services/api';
import Topbar from '../components/Layout/Topbar';
import LocataireModal from '../components/Modal/LocataireModal';
import { PayBadge, QuartierBadge, fCFA } from '../components/UI';
import { useToast } from '../hooks/useToast';

export default function Locataires() {
  const [locs, setLocs] = useState([]);
  const [biens, setBiens] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });
  const { showToast, ToastEl } = useToast();

  const load = () => {
    api.get('/locataires', { params: { q: search || undefined } }).then(r => setLocs(r.data));
  };

  useEffect(() => {
    api.get('/biens').then(r => setBiens(r.data));
  }, []);

  useEffect(() => { load(); }, [search]);

  const handleSave = async (form) => {
    if (modal.data?.id) {
      await api.put(`/locataires/${modal.data.id}`, form);
      showToast('Locataire modifié');
    } else {
      await api.post('/locataires', form);
      showToast('Locataire ajouté');
    }
    setModal({ open: false, data: null });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce locataire ?')) return;
    await api.delete(`/locataires/${id}`);
    showToast('Locataire supprimé');
    load();
  };

  // Check if bail expires within 2 months
  const isExpiringSoon = (date) => {
    if (!date) return false;
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff < 60;
  };

  return (
    <>
      <Topbar onAdd={() => setModal({ open: true, data: null })} addLabel="Ajouter un locataire" />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Locataires</span></div>

        <div className="filter-row">
          <input className="search-box" placeholder="🔍  Rechercher par nom, bien..." value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{locs.length} locataire(s)</span>
        </div>

        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Locataire</th><th>Bien loué</th><th>Quartier</th>
                <th>Téléphone</th><th>Entrée</th><th>Échéance bail</th>
                <th>Loyer</th><th>Paiement mai</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locs.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{l.nom}</div>
                    {l.email && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{l.email}</div>}
                  </td>
                  <td>{l.bien_nom || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td>{l.quartier ? <QuartierBadge q={l.quartier} /> : '—'}</td>
                  <td style={{ fontSize: 12 }}>{l.telephone || '—'}</td>
                  <td style={{ fontSize: 12 }}>{l.date_entree || '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {l.date_echeance || '—'}
                    {isExpiringSoon(l.date_echeance) && (
                      <span style={{ marginLeft: 4, fontSize: 10, background: '#fff3e0', color: '#e67e22', padding: '1px 5px', borderRadius: 8 }}>
                        Bientôt
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{fCFA(l.loyer)}</td>
                  <td>
                    {l.statut_paiement ? <PayBadge statut={l.statut_paiement} /> : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setModal({ open: true, data: l })}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {locs.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Aucun locataire trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <LocataireModal
          open={modal.open}
          initial={modal.data}
          biens={biens}
          onClose={() => setModal({ open: false, data: null })}
          onSave={handleSave}
        />
        {ToastEl}
      </div>
    </>
  );
}
