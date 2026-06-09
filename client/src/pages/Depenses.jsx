import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import Topbar from '../components/Layout/Topbar';
import { useDate } from '../context/DateContext';
import { useToast } from '../hooks/useToast';
import { fCFA } from '../components/UI';

const CATEGORIES = ['Maison familiale','Personnel','Provisions','Charges immeuble','Électricité','Eau','Autre'];
const TYPES      = [
  { v:'fixe',        label:'Fixe',        color:'#4F46E5', desc:'Dépense qui revient chaque mois' },
  { v:'variable',    label:'Variable',    color:'#F59E0B', desc:'Dépense ponctuelle ce mois' },
  { v:'provision',   label:'Provision',   color:'#EF4444', desc:'Mise en réserve (impôts, épargne…)' },
];
const EMPTY = { libelle:'', montant:'', categorie:'Maison familiale', type:'fixe', recurrent:false, notes:'' };

export default function Depenses() {
  const [depenses, setDepenses] = useState([]);
  const [modal,    setModal]    = useState({ open:false, data:null });
  const [form,     setForm]     = useState(EMPTY);
  const { mois, annee, label }  = useDate();
  const { showToast, ToastEl }  = useToast();

  const load = useCallback(async () => {
    const r = await api.get('/finances/depenses', { params:{ mois, annee } });
    setDepenses(r.data);
  }, [mois, annee]);

  useEffect(() => { load(); }, [load]);

  const openModal = (dep = null) => {
    setForm(dep ? { ...dep } : { ...EMPTY, mois, annee });
    setModal({ open:true, data:dep });
  };

  const handleSave = async () => {
    try {
      if (modal.data?.id) {
        await api.put(`/finances/depenses/${modal.data.id}`, { ...form, montant:Number(form.montant) });
        showToast('Dépense modifiée');
      } else {
        await api.post('/finances/depenses', { ...form, montant:Number(form.montant), mois, annee });
        showToast('Dépense ajoutée');
      }
      setModal({ open:false, data:null });
      load();
    } catch { showToast('Erreur', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    await api.delete(`/finances/depenses/${id}`);
    showToast('Supprimée');
    load();
  };

  // Totaux par type
  const totaux = TYPES.reduce((acc, t) => {
    acc[t.v] = depenses.filter(d => d.type === t.v).reduce((s,d) => s+Number(d.montant), 0);
    return acc;
  }, {});
  const total = depenses.reduce((s,d) => s+Number(d.montant), 0);

  // Grouper par catégorie
  const byCategorie = depenses.reduce((acc, d) => {
    if (!acc[d.categorie]) acc[d.categorie] = [];
    acc[d.categorie].push(d);
    return acc;
  }, {});

  return (
    <>
      <Topbar onAdd={() => openModal()} addLabel="Ajouter une dépense" />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Dépenses — {label}</span></div>

        {/* Résumé */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {[
            { label:'Total du mois', val:total,          color:'#EF4444', icon:'💸' },
            { label:'Fixes',         val:totaux.fixe,     color:'#4F46E5', icon:'📌' },
            { label:'Variables',     val:totaux.variable, color:'#F59E0B', icon:'📊' },
            { label:'Provisions',    val:totaux.provision,color:'#EF4444', icon:'🏦' },
          ].map((k,i) => (
            <div key={i} style={{ background:'var(--white)', border:'1px solid var(--border)',
              borderRadius:12, padding:16 }}>
              <div style={{ fontSize:20, marginBottom:8 }}>{k.icon}</div>
              <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase',
                letterSpacing:'.5px', marginBottom:4 }}>{k.label}</div>
              <div style={{ fontSize:20, fontWeight:600, color:k.color }}>
                {Number(k.val||0).toLocaleString('fr-FR')}
                <span style={{ fontSize:11, fontWeight:400, color:'var(--text-3)', marginLeft:4 }}>FCFA</span>
              </div>
            </div>
          ))}
        </div>

        {/* Liste par catégorie */}
        {Object.entries(byCategorie).map(([cat, items]) => (
          <div key={cat} className="card" style={{ marginBottom:12 }}>
            <div className="card-header">
              <div className="card-title">
                {cat}
                <span style={{ marginLeft:8, fontSize:12, color:'var(--text-3)', fontWeight:400 }}>
                  ({items.length} dépense{items.length>1?'s':''})
                </span>
              </div>
              <div style={{ fontWeight:600, color:'#EF4444' }}>
                {items.reduce((s,d)=>s+Number(d.montant),0).toLocaleString('fr-FR')} FCFA
              </div>
            </div>
            <table className="tbl">
              <thead>
                <tr><th>Libellé</th><th>Type</th><th>Récurrent</th><th>Montant</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {items.map(d => {
                  const t = TYPES.find(x=>x.v===d.type)||TYPES[0];
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight:500 }}>
                        {d.libelle}
                        {d.notes && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{d.notes}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8,
                          background:t.color+'15', color:t.color, fontWeight:500 }}>
                          {t.label}
                        </span>
                      </td>
                      <td>
                        {d.recurrent
                          ? <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8,
                              background:'#EEF2FF', color:'#4F46E5' }}>↺ Oui</span>
                          : <span style={{ fontSize:11, color:'var(--text-3)' }}>—</span>
                        }
                      </td>
                      <td style={{ fontWeight:600, color:'#EF4444' }}>
                        {Number(d.montant).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openModal(d)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {depenses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💸</div>
            <div className="empty-msg">Aucune dépense pour {label}</div>
            <button className="btn btn-primary" style={{ marginTop:14 }} onClick={() => openModal()}>
              + Ajouter une dépense
            </button>
          </div>
        )}

        {/* Modal */}
        {modal.open && (
          <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal({open:false,data:null})}>
            <div className="modal-box">
              <div className="modal-header">
                <div className="modal-title">{modal.data ? 'Modifier' : 'Ajouter'} une dépense</div>
                <button className="modal-close" onClick={() => setModal({open:false,data:null})}>✕</button>
              </div>

              <div className="form-group">
                <label className="form-label">Libellé *</label>
                <input className="form-input" value={form.libelle}
                  onChange={e => setForm(f=>({...f,libelle:e.target.value}))}
                  placeholder="Ex: Virement Maman" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Montant (FCFA) *</label>
                  <input className="form-input" type="number" value={form.montant}
                    onChange={e => setForm(f=>({...f,montant:e.target.value}))}
                    placeholder="200000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Catégorie</label>
                  <select className="form-input" value={form.categorie}
                    onChange={e => setForm(f=>({...f,categorie:e.target.value}))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display:'flex', gap:8 }}>
                  {TYPES.map(t => (
                    <button key={t.v} type="button"
                      onClick={() => setForm(f=>({...f,type:t.v}))}
                      style={{ flex:1, padding:'8px 6px', borderRadius:8,
                        border:'1px solid', fontSize:12,
                        borderColor: form.type===t.v ? t.color : 'var(--border)',
                        background: form.type===t.v ? t.color+'15' : 'transparent',
                        color: form.type===t.v ? t.color : 'var(--text-2)',
                        cursor:'pointer', fontWeight: form.type===t.v ? 500 : 400,
                      }}>
                      <div>{t.label}</div>
                      <div style={{ fontSize:10, opacity:.7, marginTop:2 }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.recurrent}
                    onChange={e => setForm(f=>({...f,recurrent:e.target.checked}))} />
                  <span className="form-label" style={{ margin:0 }}>
                    Dépense récurrente (apparaît chaque mois automatiquement)
                  </span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optionnel)</label>
                <input className="form-input" value={form.notes}
                  onChange={e => setForm(f=>({...f,notes:e.target.value}))}
                  placeholder="Précisions…" />
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setModal({open:false,data:null})}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSave}>✓ Enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {ToastEl}
      </div>
    </>
  );
}
