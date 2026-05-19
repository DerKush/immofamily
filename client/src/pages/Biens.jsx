import { useEffect, useState } from 'react';
import api from '../services/api';
import Topbar from '../components/Layout/Topbar';
import BienModal from '../components/Modal/BienModal';
import { BienBadge, QuartierBadge, fCFA } from '../components/UI';
import { useToast } from '../hooks/useToast';

export default function Biens() {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [quartier, setQuartier] = useState('');
  const [statut, setStatut] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });
  const { showToast, ToastEl } = useToast();

  const load = () => {
    setLoading(true);
    const params = {};
    if (quartier) params.quartier = quartier;
    if (statut)   params.statut   = statut;
    if (search)   params.q        = search;
    api.get('/biens', { params }).then(r => { setBiens(r.data); setLoading(false); });
  };

  useEffect(() => { load(); }, [search, quartier, statut]);

  const handleSave = async (form) => {
    if (modal.data?.id) {
      await api.put(`/biens/${modal.data.id}`, form);
      showToast('Bien modifié avec succès');
    } else {
      await api.post('/biens', form);
      showToast('Bien ajouté avec succès');
    }
    setModal({ open: false, data: null });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bien ?')) return;
    await api.delete(`/biens/${id}`);
    showToast('Bien supprimé');
    load();
  };

  return (
    <>
      <Topbar onAdd={() => setModal({ open: true, data: null })} addLabel="Ajouter un bien" />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Biens immobiliers</span></div>

        <div className="filter-row">
          <input className="search-box" placeholder="🔍  Rechercher un bien..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-sel" value={quartier} onChange={e => setQuartier(e.target.value)}>
            <option value="">Tous les quartiers</option>
            {['Cocody','Plateau','Riviera','Marcory','Yopougon','Angré','Treichville','Adjamé','Abobo'].map(q =>
              <option key={q}>{q}</option>)}
          </select>
          <select className="filter-sel" value={statut} onChange={e => setStatut(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="occupe">Occupé</option>
            <option value="vacant">Vacant</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading">⏳ Chargement...</div>
          ) : biens.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <p>Aucun bien trouvé</p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Bien</th><th>Quartier</th><th>Type</th>
                  <th>Superficie</th><th>Loyer mensuel</th><th>Locataire</th><th>Statut</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {biens.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.nom}</strong></td>
                    <td><QuartierBadge q={b.quartier} /></td>
                    <td>{b.type}</td>
                    <td>{b.superficie ? `${b.superficie} m²` : '—'}</td>
                    <td style={{ fontWeight: 500 }}>{fCFA(b.loyer)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{b.locataire_nom || '—'}</td>
                    <td><BienBadge statut={b.statut} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setModal({ open: true, data: b })}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <BienModal
          open={modal.open}
          initial={modal.data}
          onClose={() => setModal({ open: false, data: null })}
          onSave={handleSave}
        />
        {ToastEl}
      </div>
    </>
  );
}
