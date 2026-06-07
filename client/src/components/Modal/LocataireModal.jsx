import { useState, useEffect } from 'react';
import api from '../../services/api';

const STATUT_LABEL = { occupe:'Occupé', vacant:'Libre', maintenance:'Maintenance' };
const STATUT_COLOR = { occupe:'#ef4444', vacant:'#22c55e', maintenance:'#f59e0b' };

export default function LocataireModal({ open, onClose, onSave, initial, biens }) {
  const [form,    setForm]    = useState({ nom:'', email:'', telephone:'', bien_id:'', date_entree:'', date_echeance:'' });
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    setErr('');
    setForm(initial
      ? { nom:'', email:'', telephone:'', bien_id:'', date_entree:'', date_echeance:'', ...initial }
      : { nom:'', email:'', telephone:'', bien_id:'', date_entree:'', date_echeance:'' }
    );
  }, [initial, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Préparer la liste des biens pour le select ─────────────────────────────
  // 1. Exclure les immeubles eux-mêmes (on ne peut louer qu'une unité)
  // 2. Pour les unités (parent_id != null), afficher "Nom Immeuble > Unité"
  // 3. Trier : libres d'abord, puis occupés
  const biensSelectables = [...(biens || [])]
    .filter(b => b.type !== 'Immeuble')
    .sort((a, b) => {
      const ordre = { vacant:0, maintenance:1, occupe:2 };
      return (ordre[a.statut] ?? 3) - (ordre[b.statut] ?? 3);
    });

  // Grouper : unités d'immeuble + biens indépendants
  const biensByImmeuble = {};
  const biensIndep = [];
  biensSelectables.forEach(b => {
    if (b.parent_id) {
      if (!biensByImmeuble[b.parent_id]) biensByImmeuble[b.parent_id] = { name: b.immeuble_nom || `Immeuble #${b.parent_id}`, items: [] };
      biensByImmeuble[b.parent_id].items.push(b);
    } else {
      biensIndep.push(b);
    }
  });

  const bienSelectionne = biensSelectables.find(b => b.id === Number(form.bien_id));
  const occupeParAutre  = bienSelectionne?.statut === 'occupe' && bienSelectionne?.id !== initial?.bien_id;

  const handleSave = async () => {
    if (!form.nom) return setErr('Le nom est obligatoire.');
    setLoading(true); setErr('');
    try {
      await onSave({ ...form, bien_id: form.bien_id || null });
    } catch (e) {
      setErr(e.response?.data?.error || 'Une erreur est survenue.');
    } finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{initial ? 'Modifier le locataire' : 'Ajouter un locataire'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {err && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7,
            padding:'9px 12px', marginBottom:14, fontSize:13, color:'#991b1b' }}>
            ⚠️ {err}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Nom complet *</label>
          <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)}
            placeholder="Ex: M. Kouassi Yao" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="email@domaine.ci" />
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input className="form-input" value={form.telephone}
              onChange={e => set('telephone', e.target.value)} placeholder="07 00 00 00 00" />
          </div>
        </div>

        {/* ── Sélecteur de bien ── */}
        <div className="form-group">
          <label className="form-label">
            Bien loué
            <span style={{ fontWeight:400, color:'var(--text-3)', marginLeft:8 }}>
              ({biensSelectables.length} disponibles)
            </span>
          </label>
          <select className="form-input" value={form.bien_id} onChange={e => set('bien_id', e.target.value)}>
            <option value="">— Sélectionner un bien —</option>

            {/* Unités d'immeuble groupées */}
            {Object.values(biensByImmeuble).map(grp => (
              <optgroup key={grp.name} label={`🏢 ${grp.name}`}>
                {grp.items.map(b => (
                  <option key={b.id} value={b.id}>
                    {STATUT_LABEL[b.statut] === 'Libre' ? '✓' : STATUT_LABEL[b.statut] === 'Occupé' ? '●' : '⚙'}{' '}
                    {b.nom} — {b.type} [{STATUT_LABEL[b.statut]}]
                    {b.loyer ? ` · ${Number(b.loyer).toLocaleString('fr-FR')} FCFA` : ''}
                  </option>
                ))}
              </optgroup>
            ))}

            {/* Biens indépendants */}
            {biensIndep.length > 0 && (
              <optgroup label="🏠 Biens indépendants">
                {biensIndep.map(b => (
                  <option key={b.id} value={b.id}>
                    {STATUT_LABEL[b.statut] === 'Libre' ? '✓' : STATUT_LABEL[b.statut] === 'Occupé' ? '●' : '⚙'}{' '}
                    {b.nom} — {b.quartier} [{STATUT_LABEL[b.statut]}]
                    {b.loyer ? ` · ${Number(b.loyer).toLocaleString('fr-FR')} FCFA` : ''}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Aperçu */}
          {bienSelectionne && (
            <div style={{
              marginTop:8, padding:'8px 12px', borderRadius:7, fontSize:12,
              background: occupeParAutre ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${occupeParAutre ? '#fecaca' : '#bbf7d0'}`,
              color: occupeParAutre ? '#991b1b' : '#166534',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <span style={{
                width:8, height:8, borderRadius:'50%',
                background: STATUT_COLOR[bienSelectionne.statut],
                display:'inline-block', flexShrink:0,
              }} />
              {occupeParAutre
                ? `⚠️ Occupé par ${bienSelectionne.locataire_nom || 'un locataire'}. Il sera réaffecté.`
                : `${bienSelectionne.type} · ${bienSelectionne.superficie ? bienSelectionne.superficie + ' m² · ' : ''}${Number(bienSelectionne.loyer).toLocaleString('fr-FR')} FCFA/mois`
              }
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date d'entrée</label>
            <input className="form-input" type="date" value={form.date_entree}
              onChange={e => set('date_entree', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Date d'échéance bail</label>
            <input className="form-input" type="date" value={form.date_echeance}
              onChange={e => set('date_echeance', e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Enregistrement...' : '✓ Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
