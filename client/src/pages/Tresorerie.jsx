import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import Topbar from '../components/Layout/Topbar';
import { useDate } from '../context/DateContext';
import { useToast } from '../hooks/useToast';

const STATUT_CFG = {
  en_attente: { label: 'En attente', bg: '#FEF3C7', color: '#92400E' },
  vire:       { label: 'Viré ✓',    bg: '#D1FAE5', color: '#065F46' },
  recu:       { label: 'Reçu ✓',    bg: '#DBEAFE', color: '#1E40AF' },
};

export default function Tresorerie() {
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [editSolde,    setEditSolde]    = useState(false);
  const [cashDebut,    setCashDebut]    = useState('');
  const [genLoading,   setGenLoading]   = useState(false);
  const { mois, annee, label }          = useDate();
  const { showToast, ToastEl }          = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/finances/tresorerie', { params: { mois, annee } });
      setData(r.data);
      setCashDebut(r.data.cashDebut);
    } catch { showToast('Erreur de chargement', 'error'); }
    finally   { setLoading(false); }
  }, [mois, annee]);

  useEffect(() => { load(); }, [load]);

  const saveSolde = async () => {
    try {
      await api.put('/finances/solde', { cash_debut: Number(cashDebut) }, { params: { mois, annee } });
      showToast('Solde mis à jour');
      setEditSolde(false);
      load();
    } catch { showToast('Erreur', 'error'); }
  };

  const genererRepartition = async () => {
    setGenLoading(true);
    try {
      await api.post('/finances/repartitions/generer',
        { montant_total: data.aRepartir },
        { params: { mois, annee } }
      );
      showToast('Répartition générée');
      load();
    } catch { showToast('Erreur', 'error'); }
    finally { setGenLoading(false); }
  };

  const updateRepartition = async (id, field, value) => {
    try {
      const rep = data.repartitions.find(r => r.id === id);
      await api.put(`/finances/repartitions/${id}`, { ...rep, [field]: value });
      load();
    } catch { showToast('Erreur', 'error'); }
  };

  if (loading) return (
    <>
      <Topbar />
      <div className="loading">⏳ Chargement…</div>
    </>
  );

  const {
    cashDebut: cd, revenusLoyers, detailRevenus,
    depenses, totalDepenses, aRepartir,
    repartitions, totalReparti, cashFin,
  } = data;

  return (
    <>
      <Topbar />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Trésorerie — {label}</span></div>

        {/* ── KPIs ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {[
            { label:'Cash début de mois', val:cd,             icon:'🏦', color:'#4F46E5', editable:true },
            { label:'Revenus locatifs',   val:revenusLoyers,  icon:'📈', color:'#10B981' },
            { label:'Total dépenses',     val:totalDepenses,  icon:'💸', color:'#EF4444' },
            { label:'Cash fin de mois',   val:cashFin,        icon:'💰', color:cashFin>=0?'#10B981':'#EF4444' },
          ].map((k,i) => (
            <div key={i} style={{ background:'var(--white)', border:'1px solid var(--border)',
              borderRadius:12, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:20 }}>{k.icon}</span>
                {k.editable && !editSolde && (
                  <button onClick={() => setEditSolde(true)} style={{ fontSize:11,
                    background:'transparent', border:'1px solid var(--border)',
                    borderRadius:6, padding:'2px 8px', cursor:'pointer', color:'var(--text-3)' }}>
                    ✏️ Modifier
                  </button>
                )}
              </div>
              <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase',
                letterSpacing:'.5px', marginBottom:4 }}>{k.label}</div>
              {k.editable && editSolde ? (
                <div style={{ display:'flex', gap:6 }}>
                  <input
                    type="number"
                    className="form-input"
                    value={cashDebut}
                    onChange={e => setCashDebut(e.target.value)}
                    style={{ fontSize:14, padding:'4px 8px' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={saveSolde}>✓</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditSolde(false)}>✕</button>
                </div>
              ) : (
                <div style={{ fontSize:20, fontWeight:600, color:k.color }}>
                  {Number(k.val).toLocaleString('fr-FR')}
                  <span style={{ fontSize:11, fontWeight:400, color:'var(--text-3)', marginLeft:4 }}>FCFA</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

          {/* ── Revenus locatifs ── */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">📈 Revenus locatifs</div>
                <div className="card-sub">Loyers encaissés — {label}</div>
              </div>
              <div style={{ fontWeight:600, fontSize:16, color:'#10B981' }}>
                {Number(revenusLoyers).toLocaleString('fr-FR')} FCFA
              </div>
            </div>
            {detailRevenus.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-3)', fontSize:13 }}>
                Aucun loyer encaissé pour {label}
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Bien</th><th>Quartier</th><th>Montant</th></tr></thead>
                <tbody>
                  {detailRevenus.map((d,i) => (
                    <tr key={i}>
                      <td style={{ fontSize:12 }}>{d.bien_nom}</td>
                      <td><span style={{ fontSize:10, padding:'2px 7px', borderRadius:5,
                        background:'#EEF2FF', color:'#4F46E5', fontWeight:500 }}>{d.quartier}</span></td>
                      <td style={{ fontWeight:500 }}>{Number(d.total).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Dépenses ── */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">💸 Dépenses du mois</div>
                <div className="card-sub">Fixes + variables — {label}</div>
              </div>
              <div style={{ fontWeight:600, fontSize:16, color:'#EF4444' }}>
                {Number(totalDepenses).toLocaleString('fr-FR')} FCFA
              </div>
            </div>
            {depenses.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-3)', fontSize:13 }}>
                Aucune dépense pour {label}
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Libellé</th><th>Catégorie</th><th>Montant</th></tr></thead>
                <tbody>
                  {depenses.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontSize:12 }}>
                        {d.libelle}
                        {d.recurrent && <span style={{ marginLeft:5, fontSize:9,
                          background:'#EEF2FF', color:'#4F46E5', padding:'1px 5px',
                          borderRadius:8 }}>Récurrent</span>}
                      </td>
                      <td><span style={{ fontSize:10, color:'var(--text-3)' }}>{d.categorie}</span></td>
                      <td style={{ fontWeight:500, color:'#EF4444' }}>
                        {Number(d.montant).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Répartition ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">👥 Répartition entre membres — {label}</div>
              <div className="card-sub">
                À répartir : <strong style={{ color:'#4F46E5' }}>
                  {Number(aRepartir).toLocaleString('fr-FR')} FCFA
                </strong>
                {' '}(Revenus {Number(revenusLoyers).toLocaleString('fr-FR')} − Dépenses {Number(totalDepenses).toLocaleString('fr-FR')})
              </div>
            </div>
            {repartitions.length === 0 && (
              <button
                className="btn btn-primary btn-sm"
                onClick={genererRepartition}
                disabled={genLoading || aRepartir <= 0}
              >
                {genLoading ? '⏳…' : '⚡ Générer la répartition'}
              </button>
            )}
          </div>

          {repartitions.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-3)' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>👥</div>
              <div style={{ marginBottom:6 }}>Aucune répartition pour {label}</div>
              <div style={{ fontSize:12 }}>Cliquez sur "Générer la répartition" pour distribuer les revenus</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {repartitions.map(r => {
                const pct = aRepartir > 0 ? Math.round((r.montant / aRepartir) * 100) : 0;
                const sc  = STATUT_CFG[r.statut] || STATUT_CFG.en_attente;
                return (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:14,
                    padding:'12px 14px', background:'var(--bg)', borderRadius:9,
                    border:'1px solid var(--border)' }}>
                    <div style={{ width:40, height:40, borderRadius:'50%',
                      background:r.couleur, display:'flex', alignItems:'center',
                      justifyContent:'center', color:'#fff', fontWeight:600,
                      fontSize:14, flexShrink:0 }}>
                      {r.initiales}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <div>
                          <span style={{ fontWeight:500, fontSize:13 }}>{r.nom}</span>
                          {r.role && <span style={{ marginLeft:8, fontSize:11,
                            color:'var(--text-3)' }}>{r.role}</span>}
                        </div>
                        <span style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>
                          {Number(r.montant).toLocaleString('fr-FR')} FCFA
                          <span style={{ fontWeight:400, fontSize:11, color:'var(--text-3)', marginLeft:4 }}>
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div style={{ background:'var(--border-soft)', borderRadius:4, height:5, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`,
                          background:r.couleur, borderRadius:4,
                          transition:'width 0.8s ease' }} />
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:8,
                        background:sc.bg, color:sc.color, fontWeight:500 }}>
                        {sc.label}
                      </span>
                      <select
                        value={r.statut}
                        onChange={e => updateRepartition(r.id, 'statut', e.target.value)}
                        style={{ fontSize:11, padding:'3px 7px', borderRadius:6,
                          border:'1px solid var(--border)', background:'var(--white)',
                          cursor:'pointer' }}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="vire">Viré</option>
                        <option value="recu">Reçu</option>
                      </select>
                    </div>
                  </div>
                );
              })}

              <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px',
                background:'var(--bg)', borderRadius:9, border:'1px solid var(--border)',
                fontSize:13, marginTop:4 }}>
                <span style={{ color:'var(--text-2)' }}>Total réparti</span>
                <span style={{ fontWeight:600 }}>
                  {Number(totalReparti).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          )}
        </div>

        {ToastEl}
      </div>
    </>
  );
}
