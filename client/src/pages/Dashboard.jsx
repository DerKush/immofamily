import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Topbar from '../components/Layout/Topbar';
import { StatCard, ProgBar, BienBadge, PayBadge, QuartierBadge, fCFA } from '../components/UI';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)); }, []);

  if (!data) return <><Topbar /><div className="loading">⏳ Chargement...</div></>;

  const { stats, parQuartier, derniersLoyers, tauxOccupation } = data;

  return (
    <>
      <Topbar onAdd={() => navigate('/biens')} addLabel="Ajouter un bien" />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Tableau de bord</span></div>

        {/* KPIs */}
        <div className="stats-grid">
          <StatCard accent label="Revenus mensuels" value={Number(stats.revenusMois).toLocaleString('fr-FR')} sub="FCFA / mois" />
          <StatCard label="Biens total"       value={stats.totalBiens} sub={`${stats.occupes} occupés`} subClass="up" />
          <StatCard label="Taux d'occupation" value={`${tauxOccupation}%`} sub="▲ Objectif : 90%" subClass="up" />
          <StatCard label="Impayés mai 2025"  value={stats.impayes} sub="À régulariser" subClass={stats.impayes > 0 ? 'down' : 'up'} />
        </div>

        <div className="grid-2" style={{ marginBottom: 16 }}>
          {/* Revenus par quartier */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Revenus par quartier — Mai 2025</div>
            </div>
            {parQuartier.map(q => (
              <div key={q.quartier} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{q.quartier}</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{Number(q.revenus).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="prog-wrap">
                  <div className="prog-bar" style={{
                    width: `${parQuartier[0].revenus ? Math.round((q.revenus / parQuartier[0].revenus) * 100) : 0}%`,
                    background: 'var(--green-light)',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Statut biens */}
          <div className="card">
            <div className="card-header"><div className="card-title">Statut des biens</div></div>
            <ProgBar label="Occupés" value={stats.occupes} max={stats.totalBiens} color="var(--green-light)" />
            <ProgBar label="Vacants" value={stats.vacants} max={stats.totalBiens} color="var(--terra-light)" />
            <ProgBar label="Maintenance" value={stats.maintenance} max={stats.totalBiens} color="var(--gold)" />

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--sand-2)' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 10 }}>Répartition par quartier</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {parQuartier.map(q => (
                  <div key={q.quartier} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <QuartierBadge q={q.quartier} />
                    <span style={{ color: 'var(--text-3)' }}>{q.nb_biens}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Derniers paiements */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Derniers paiements enregistrés</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/paiements')}>Voir tout</button>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Locataire</th><th>Bien</th><th>Quartier</th>
                <th>Montant</th><th>Date</th><th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {derniersLoyers.map(p => (
                <tr key={p.id}>
                  <td>{p.locataire_nom}</td>
                  <td>{p.bien_nom}</td>
                  <td><QuartierBadge q={p.quartier} /></td>
                  <td style={{ fontWeight: 500 }}>{fCFA(p.montant)}</td>
                  <td>{p.date_paiement || '—'}</td>
                  <td><PayBadge statut={p.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
