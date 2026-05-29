import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import Topbar from '../components/Layout/Topbar';
import PaiementModal from '../components/Modal/PaiementModal';
import { PayBadge, StatCard, QuartierBadge, fCFA } from '../components/UI';
import { useToast } from '../hooks/useToast';
import { useDate } from '../context/DateContext';

export default function Paiements() {
  const [paiements,  setPaiements]  = useState([]);
  const [locataires, setLocataires] = useState([]);
  const [modal,      setModal]      = useState(false);
  const { showToast, ToastEl }      = useToast();
  const { mois, annee, label }      = useDate();

  const load = useCallback(() => {
    api.get('/paiements', { params: { mois, annee } })
      .then(r => setPaiements(r.data));
  }, [mois, annee]);

  useEffect(() => {
    api.get('/locataires').then(r => setLocataires(r.data));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    await api.post('/paiements', form);
    showToast('Paiement enregistré');
    setModal(false);
    load();
  };

  const markPaid = async (p) => {
    await api.put(`/paiements/${p.id}`, {
      ...p,
      statut: 'paye',
      date_paiement: new Date().toISOString().split('T')[0],
    });
    showToast(`Paiement de ${p.locataire_nom} marqué comme payé`);
    load();
  };

  const encaisse = paiements.filter(p => p.statut === 'paye').reduce((s, p) => s + p.montant, 0);
  const impayes  = paiements.filter(p => p.statut === 'impaye').reduce((s, p) => s + p.montant, 0);
  const attente  = paiements.filter(p => p.statut === 'en_attente').reduce((s, p) => s + p.montant, 0);
  const total    = encaisse + impayes + attente;
  const taux     = total ? Math.round((encaisse / total) * 100) : 0;

  return (
    <>
      <Topbar onAdd={() => setModal(true)} addLabel="Enregistrer un paiement" />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Loyers & Paiements — {label}</span></div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard accent label="Encaissé"     value={Number(encaisse).toLocaleString('fr-FR')} sub="FCFA" />
          <StatCard label="Impayés"             value={Number(impayes).toLocaleString('fr-FR')}  sub="FCFA" subClass="down" />
          <StatCard label="En attente"          value={Number(attente).toLocaleString('fr-FR')}  sub="FCFA" />
          <StatCard label="Taux recouvrement"   value={`${taux}%`}
            sub={taux >= 85 ? '▲ Bon mois' : '▼ À améliorer'}
            subClass={taux >= 85 ? 'up' : 'down'} />
        </div>

        {/* Table */}
        <div className="card">
          {paiements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
              Aucun paiement pour {label}
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Locataire</th><th>Bien</th><th>Quartier</th>
                  <th>Montant</th><th>Date</th><th>Mode</th><th>Statut</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.locataire_nom}</td>
                    <td style={{ fontSize: 12 }}>{p.bien_nom}</td>
                    <td><QuartierBadge q={p.quartier} /></td>
                    <td style={{ fontWeight: 500 }}>{fCFA(p.montant)}</td>
                    <td style={{ fontSize: 12 }}>{p.date_paiement || '—'}</td>
                    <td style={{ fontSize: 12 }}>{p.mode || '—'}</td>
                    <td><PayBadge statut={p.statut} /></td>
                    <td>
                      {p.statut !== 'paye' && (
                        <button className="btn btn-outline btn-sm" onClick={() => markPaid(p)}>
                          ✓ Marquer payé
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <PaiementModal
          open={modal}
          locataires={locataires}
          moisDefaut={mois}
          anneeDefaut={annee}
          onClose={() => setModal(false)}
          onSave={handleSave}
        />
        {ToastEl}
      </div>
    </>
  );
}
