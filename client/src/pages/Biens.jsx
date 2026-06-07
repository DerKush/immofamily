import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import Topbar    from '../components/Layout/Topbar';
import BienModal from '../components/Modal/BienModal';
import { BienBadge, QuartierBadge, fCFA } from '../components/UI';
import { useToast } from '../hooks/useToast';

const STATUT_IMMEUBLE = {
  occupe:   { label: 'Complet',    color: '#16a34a', bg: '#dcfce7' },
  partiel:  { label: 'Partiel',    color: '#d97706', bg: '#fef3c7' },
  vacant:   { label: 'Vacant',     color: '#dc2626', bg: '#fee2e2' },
  maintenance: { label: 'Maintenance', color: '#7c3aed', bg: '#ede9fe' },
};

export default function Biens() {
  const [biens,     setBiens]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [quartier,  setQuartier]  = useState('');
  const [statut,    setStatut]    = useState('');
  const [expanded,  setExpanded]  = useState({});       // { [imm.id]: true/false }
  const [modal,     setModal]     = useState({ open: false, data: null, parent: null });
  const { showToast, ToastEl } = useToast();

  const load = useCallback(() => {
    setLoading(true); setError(null);
    const params = {};
    if (quartier) params.quartier = quartier;
    if (statut)   params.statut   = statut;
    if (search)   params.q        = search;
    api.get('/biens', { params })
      .then(r => {
        setBiens(r.data);
        // Expand tous les immeubles par défaut au premier chargement
        setExpanded(prev => {
          const next = { ...prev };
          r.data.filter(b => b.type === 'Immeuble').forEach(b => {
            if (next[b.id] === undefined) next[b.id] = true;
          });
          return next;
        });
      })
      .catch(err => setError(err.userMessage || 'Impossible de charger les biens.'))
      .finally(() => setLoading(false));
  }, [search, quartier, statut]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    try {
      if (modal.data?.id) {
        await api.put(`/biens/${modal.data.id}`, form);
        showToast('Bien modifié');
      } else {
        await api.post('/biens', form);
        showToast(form.parent_id ? 'Unité ajoutée' : 'Bien ajouté');
      }
      setModal({ open: false, data: null, parent: null });
      load();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur.', 'error');
    }
  };

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;
    try {
      await api.delete(`/biens/${id}`);
      showToast('Bien supprimé');
      load();
    } catch { showToast('Erreur.', 'error'); }
  };

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const immeubles  = biens.filter(b => b.type === 'Immeuble');
  const standards  = biens.filter(b => b.type !== 'Immeuble');
  const totalLoyer = biens.reduce((s, b) => {
    if (b.type === 'Immeuble') return s + (b.revenuMensuel || 0);
    return s + (b.loyer || 0);
  }, 0);

  return (
    <>
      <Topbar onAdd={() => setModal({ open: true, data: null, parent: null })} addLabel="Ajouter un bien" />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Biens immobiliers</span></div>

        {/* ── Résumé global ── */}
        <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
          {[
            { label:'Total biens',      val: biens.length,                              color:'var(--green)' },
            { label:'Immeubles',        val: immeubles.length,                          color:'#7c3aed' },
            { label:'Loyer potentiel',  val: `${totalLoyer.toLocaleString('fr-FR')} FCFA`, color:'var(--green)' },
            { label:'Vacants',          val: standards.filter(b=>b.statut==='vacant').length +
                                              immeubles.reduce((s,i)=>s+(i.unites||[]).filter(u=>u.statut==='vacant').length,0),
                                              color:'#dc2626' },
          ].map(s => (
            <div key={s.label} style={{
              flex:1, minWidth:140, background:'var(--white)',
              border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px',
            }}>
              <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase',
                letterSpacing:'.5px', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:18, fontWeight:500, color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* ── Filtres ── */}
        <div className="filter-row">
          <input className="search-box" placeholder="🔍  Rechercher un bien, adresse…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-sel" value={quartier} onChange={e => setQuartier(e.target.value)}>
            <option value="">Tous les quartiers</option>
            {['Cocody','Plateau','Riviera','Marcory','Yopougon','Angré','Treichville','Adjamé','Abobo'].map(q =>
              <option key={q}>{q}</option>)}
          </select>
          <select className="filter-sel" value={statut} onChange={e => setStatut(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="occupe">Occupé / Complet</option>
            <option value="partiel">Partiellement occupé</option>
            <option value="vacant">Vacant</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8,
            padding:'10px 14px', marginBottom:14, fontSize:13, color:'#991b1b' }}>
            ⚠️ {error} <button onClick={load} style={{ marginLeft:10, cursor:'pointer',
              background:'none', border:'none', color:'#991b1b', textDecoration:'underline' }}>
              Réessayer</button>
          </div>
        )}

        {loading ? (
          <div className="loading">⏳ Chargement…</div>
        ) : biens.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <p>Aucun bien trouvé</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

            {/* ── Immeubles ── */}
            {immeubles.map(imm => {
              const s = STATUT_IMMEUBLE[imm.statut] || STATUT_IMMEUBLE.vacant;
              const isOpen = expanded[imm.id];
              return (
                <div key={imm.id} className="card" style={{ padding:0, overflow:'hidden' }}>
                  {/* En-tête immeuble */}
                  <div style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'13px 16px', background:'var(--white)',
                    cursor:'pointer', userSelect:'none',
                  }} onClick={() => toggle(imm.id)}>
                    <div style={{ fontSize:24, flexShrink:0 }}>🏢</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{imm.nom}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>
                        <QuartierBadge q={imm.quartier} />
                        {imm.adresse && <span style={{ marginLeft:8 }}>📍 {imm.adresse}</span>}
                      </div>
                    </div>
                    {/* Stats immeuble */}
                    <div style={{ display:'flex', gap:16, flexShrink:0, fontSize:12 }}>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontWeight:600, color:'var(--text)' }}>
                          {imm.nbOccupes}/{imm.nbUnites}
                        </div>
                        <div style={{ color:'var(--text-3)', fontSize:10 }}>Occupées</div>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontWeight:600, color:'var(--green)' }}>
                          {Number(imm.revenuMensuel).toLocaleString('fr-FR')}
                        </div>
                        <div style={{ color:'var(--text-3)', fontSize:10 }}>FCFA/mois</div>
                      </div>
                    </div>
                    <span style={{
                      padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:500,
                      background: s.bg, color: s.color, flexShrink:0,
                    }}>{s.label}</span>
                    <span style={{ fontSize:18, color:'var(--text-3)', flexShrink:0 }}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                    <div style={{ display:'flex', gap:6, flexShrink:0 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-outline btn-sm"
                        onClick={() => setModal({ open:true, data:imm, parent:null })}
                        title="Modifier l'immeuble">✏️</button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(imm.id, imm.nom)}
                        title="Supprimer">🗑️</button>
                    </div>
                  </div>

                  {/* Unités */}
                  {isOpen && (
                    <div style={{ borderTop:'1px solid var(--border-soft)' }}>
                      {(imm.unites || []).map((u, idx) => (
                        <div key={u.id} style={{
                          display:'flex', alignItems:'center', gap:10,
                          padding:'10px 16px 10px 44px',
                          borderBottom: idx < imm.unites.length - 1 ? '1px solid var(--border-soft)' : 'none',
                          background: 'var(--bg)',
                        }}>
                          <span style={{ fontSize:16, flexShrink:0 }}>
                            {u.statut === 'maintenance' ? '⚙️' : u.statut === 'vacant' ? '🔑' : '👤'}
                          </span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:500 }}>{u.nom}</div>
                            {u.locataire_nom && (
                              <div style={{ fontSize:11, color:'var(--text-3)' }}>
                                {u.locataire_nom}
                                {u.superficie && ` · ${u.superficie} m²`}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize:12, fontWeight:500, color:'var(--green)', flexShrink:0 }}>
                            {u.statut !== 'maintenance' ? fCFA(u.loyer) : '—'}
                          </div>
                          <BienBadge statut={u.statut} />
                          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                            <button className="btn btn-outline btn-sm"
                              onClick={() => setModal({ open:true, data:u, parent:imm })}
                              title="Modifier l'unité">✏️</button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(u.id, u.nom)}>🗑️</button>
                          </div>
                        </div>
                      ))}

                      {/* Bouton ajouter une unité */}
                      <div style={{ padding:'10px 16px 10px 44px', background:'var(--bg)' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setModal({ open:true, data:null, parent:imm })}
                          style={{ fontSize:12 }}
                        >
                          + Ajouter une unité
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Biens standards ── */}
            {standards.length > 0 && (
              <div className="card" style={{ padding:0, overflow:'hidden' }}>
                {immeubles.length > 0 && (
                  <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border-soft)',
                    fontSize:11, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.5px',
                    background:'var(--bg)' }}>
                    Biens indépendants ({standards.length})
                  </div>
                )}
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Bien</th><th>Quartier</th><th>Type</th>
                      <th>Superficie</th><th>Loyer</th><th>Locataire</th>
                      <th>Statut</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standards.map(b => (
                      <tr key={b.id}>
                        <td>
                          <div style={{ fontWeight:500 }}>{b.nom}</div>
                          {b.adresse && <div style={{ fontSize:11, color:'var(--text-3)' }}>📍 {b.adresse}</div>}
                        </td>
                        <td><QuartierBadge q={b.quartier} /></td>
                        <td>{b.type}</td>
                        <td>{b.superficie ? `${b.superficie} m²` : '—'}</td>
                        <td style={{ fontWeight:500 }}>{fCFA(b.loyer)}</td>
                        <td style={{ fontSize:12, color:'var(--text-3)' }}>{b.locataire_nom || '—'}</td>
                        <td><BienBadge statut={b.statut} /></td>
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            <button className="btn btn-outline btn-sm"
                              onClick={() => setModal({ open:true, data:b, parent:null })}>✏️</button>
                            <button className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(b.id, b.nom)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <BienModal
          open={modal.open}
          initial={modal.data}
          parentImmeuble={modal.parent}
          onClose={() => setModal({ open:false, data:null, parent:null })}
          onSave={handleSave}
        />
        {ToastEl}
      </div>
    </>
  );
}
