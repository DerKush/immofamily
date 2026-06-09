import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import Topbar from '../components/Layout/Topbar';
import { useToast } from '../hooks/useToast';

const COULEURS = ['#4F46E5','#EA580C','#10B981','#8B5CF6','#F59E0B','#EF4444','#0EA5E9','#EC4899'];
const EMPTY    = { nom:'', initiales:'', couleur:'#4F46E5', role:'', part_pourcentage:25, ordre:99 };

export default function Membres() {
  const [membres, setMembres] = useState([]);
  const [modal,   setModal]   = useState({ open:false, data:null });
  const [form,    setForm]    = useState(EMPTY);
  const { showToast, ToastEl } = useToast();

  const load = useCallback(async () => {
    const r = await api.get('/finances/membres');
    setMembres(r.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openModal = (m = null) => {
    setForm(m ? { ...m } : { ...EMPTY });
    setModal({ open:true, data:m });
  };

  const handleSave = async () => {
    try {
      if (modal.data?.id) {
        await api.put(`/finances/membres/${modal.data.id}`, form);
        showToast('Membre modifié');
      } else {
        await api.post('/finances/membres', form);
        showToast('Membre ajouté');
      }
      setModal({ open:false, data:null });
      load();
    } catch { showToast('Erreur', 'error'); }
  };

  const totalParts = membres.reduce((s,m) => s + Number(m.part_pourcentage), 0);

  return (
    <>
      <Topbar onAdd={() => openModal()} addLabel="Ajouter un membre" />
      <div className="page-content">
        <div className="breadcrumb">ImmoFamily › <span>Membres — Répartition</span></div>

        {/* Info */}
        <div style={{ background:'#EEF2FF', border:'1px solid #C7D2FE',
          borderRadius:10, padding:'12px 16px', marginBottom:20,
          fontSize:13, color:'#3730A3' }}>
          💡 Les parts définissent comment les revenus sont divisés entre membres à chaque mois.
          Total des parts actuel : <strong>{totalParts}%</strong>
          {totalParts !== 100 && <span style={{ color:'#EF4444', marginLeft:8 }}>⚠️ Le total devrait être 100%</span>}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:14, marginBottom:20 }}>
          {membres.map(m => (
            <div key={m.id} style={{ background:'var(--white)', border:'1px solid var(--border)',
              borderRadius:12, padding:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:46, height:46, borderRadius:'50%',
                  background:m.couleur, display:'flex', alignItems:'center',
                  justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16 }}>
                  {m.initiales || m.nom[0]}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:15 }}>{m.nom}</div>
                  {m.role && <div style={{ fontSize:11, color:'var(--text-3)' }}>{m.role}</div>}
                </div>
              </div>

              <div style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:12 }}>
                  <span style={{ color:'var(--text-3)' }}>Part de répartition</span>
                  <span style={{ fontWeight:600, color:m.couleur }}>{m.part_pourcentage}%</span>
                </div>
                <div style={{ background:'var(--border-soft)', borderRadius:4, height:6, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${m.part_pourcentage}%`,
                    background:m.couleur, borderRadius:4 }} />
                </div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button className="btn btn-outline btn-sm" style={{ flex:1 }}
                  onClick={() => openModal(m)}>✏️ Modifier</button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {modal.open && (
          <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal({open:false,data:null})}>
            <div className="modal-box">
              <div className="modal-header">
                <div className="modal-title">{modal.data ? 'Modifier' : 'Ajouter'} un membre</div>
                <button className="modal-close" onClick={() => setModal({open:false,data:null})}>✕</button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input className="form-input" value={form.nom}
                    onChange={e => setForm(f=>({...f,nom:e.target.value}))} placeholder="Ex: Ali" />
                </div>
                <div className="form-group">
                  <label className="form-label">Initiales</label>
                  <input className="form-input" value={form.initiales} maxLength={2}
                    onChange={e => setForm(f=>({...f,initiales:e.target.value.toUpperCase()}))} placeholder="AL" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rôle / Description</label>
                  <input className="form-input" value={form.role}
                    onChange={e => setForm(f=>({...f,role:e.target.value}))} placeholder="Ex: Gestion Finances" />
                </div>
                <div className="form-group">
                  <label className="form-label">Part de répartition (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={form.part_pourcentage}
                    onChange={e => setForm(f=>({...f,part_pourcentage:Number(e.target.value)}))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Couleur</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {COULEURS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f=>({...f,couleur:c}))}
                      style={{ width:32, height:32, borderRadius:'50%', background:c, border:
                        form.couleur===c ? '3px solid var(--text)' : '2px solid transparent',
                        cursor:'pointer' }} />
                  ))}
                </div>
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
