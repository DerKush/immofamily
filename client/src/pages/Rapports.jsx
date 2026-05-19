import { useEffect, useState } from 'react';
import api from '../services/api';
import Topbar from '../components/Layout/Topbar';
import { StatCard, PayBadge, QuartierBadge, fCFA } from '../components/UI';

const MOIS_LABELS = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function Rapports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/rapports/mensuel?mois=5&annee=2025').then(r => setData(r.data));
  }, []);

  if (!data) return <><Topbar /><div className="loading">⏳ Chargement...</div></>;

  const { encaisse, attendu, taux, impayes, parQuartier, evolution } = data;

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Rapports</span></div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <StatCard accent label="Encaissé mai 2025" value={Number(encaisse).toLocaleString('fr-FR')} sub="FCFA" />
          <StatCard label="Loyers attendus" value={Number(attendu).toLocaleString('fr-FR')} sub="FCFA (biens occupés)" />
          <StatCard label="Taux recouvrement" value={`${taux}%`} sub={taux >= 85 ? '▲ Excellent' : '▼ À améliorer'} subClass={taux >= 85 ? 'up' : 'down'} />
          <StatCard label="Impayés" value={impayes.length} sub="Locataires en retard" subClass={impayes.length > 0 ? 'down' : 'up'} />
        </div>

        <div className="grid-2-equal" style={{ marginBottom: 16 }}>
          {/* Par quartier */}
          <div className="card">
            <div className="card-header"><div className="card-title">Revenus par quartier</div></div>
            <table className="tbl">
              <thead>
                <tr><th>Quartier</th><th>Biens</th><th>Revenus FCFA</th></tr>
              </thead>
              <tbody>
                {parQuartier.map(q => (
                  <tr key={q.quartier}>
                    <td><QuartierBadge q={q.quartier} /></td>
                    <td>{q.nb_biens}</td>
                    <td style={{ fontWeight: 500 }}>{Number(q.revenus).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Évolution mensuelle */}
          <div className="card">
            <div className="card-header"><div className="card-title">Évolution 2025</div></div>
            <table className="tbl">
              <thead><tr><th>Mois</th><th>Revenus (FCFA)</th></tr></thead>
              <tbody>
                {evolution.map(e => (
                  <tr key={e.mois}>
                    <td>{MOIS_LABELS[e.mois]}</td>
                    <td style={{ fontWeight: 500 }}>{Number(e.total).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
                {evolution.length === 0 && (
                  <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 20 }}>Aucune donnée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Impayés */}
        {impayes.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚠️ Impayés à régulariser</div>
              <span style={{ fontSize: 12, color: 'var(--red)' }}>{impayes.length} locataire(s)</span>
            </div>
            <table className="tbl">
              <thead>
                <tr><th>Locataire</th><th>Bien</th><th>Montant dû</th><th>Statut</th></tr>
              </thead>
              <tbody>
                {impayes.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.locataire_nom}</td>
                    <td>{p.bien_nom}</td>
                    <td style={{ fontWeight: 500, color: 'var(--red)' }}>{fCFA(p.montant)}</td>
                    <td><PayBadge statut={p.statut} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
