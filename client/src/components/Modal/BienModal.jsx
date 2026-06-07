import { useState, useEffect } from 'react';
import api from '../../services/api';

const QUARTIERS = ['Cocody','Plateau','Riviera','Marcory','Yopougon','Angré','Treichville','Adjamé','Abobo','Koumassi','Port-Bouët'];
const STATUTS   = [{ v:'vacant',val:'Vacant' },{ v:'occupe',val:'Occupé' },{ v:'maintenance',val:'Maintenance' }];

const CATEGORIES = {
  Immeuble:   { icon:'🏢', types:['Immeuble'], description:'Bâtiment avec plusieurs unités locatives.' },
  Résidentiel:{ icon:'🏠', types:['Villa','Appartement','Studio','F1','F2','F3','F4','F5','Duplex','Chambre'], description:'Logement individuel.' },
  Commercial: { icon:'🏪', types:['Local commercial','Bureau','Magasin','Entrepôt'], description:'Espace à usage professionnel.' },
};

const EMPTY = {
  nom:'', quartier:'Cocody', type:'Appartement', categorie:'Résidentiel',
  superficie:'', loyer:'', statut:'vacant',
  latitude:'', longitude:'', description:'', adresse:'',
  parent_id: '',
};

export default function BienModal({ open, onClose, onSave, initial, parentImmeuble }) {
  const [form,      setForm]      = useState(EMPTY);
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState('');
  const [immeubles, setImmeubles] = useState([]);

  // Charger la liste des immeubles pour le select "Appartient à"
  useEffect(() => {
    api.get('/biens/immeubles/liste').then(r => setImmeubles(r.data)).catch(() => {});
  }, [open]);

  useEffect(() => {
    setErr('');
    if (initial) {
      // Déterminer la catégorie depuis le type
      const cat = Object.keys(CATEGORIES).find(c => CATEGORIES[c].types.includes(initial.type)) || 'Résidentiel';
      setForm({ ...EMPTY, ...initial, categorie: cat, parent_id: initial.parent_id || '' });
    } else if (parentImmeuble) {
      // Pré-rempli quand on ajoute une unité depuis un immeuble
      setForm({ ...EMPTY, quartier: parentImmeuble.quartier, parent_id: parentImmeuble.id, categorie: 'Résidentiel' });
    } else {
      setForm(EMPTY);
    }
  }, [initial, open, parentImmeuble]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isImmeuble = form.type === 'Immeuble';
  const isUnite    = !!form.parent_id;
  const typesDispos = CATEGORIES[form.categorie]?.types || [];

  const handleCategorieChange = (cat) => {
    const types = CATEGORIES[cat].types;
    set('categorie', cat);
    if (!types.includes(form.type)) set('type', types[0]);
    if (cat === 'Immeuble') { set('type', 'Immeuble'); set('loyer', ''); }
  };

  const handleSave = async () => {
    if (!form.nom)     return setErr('Le nom du bien est obligatoire.');
    if (!form.quartier) return setErr('Le quartier est obligatoire.');
    if (!isImmeuble && !form.loyer) return setErr('Le loyer mensuel est obligatoire.');
    if (!isImmeuble && Number(form.loyer) <= 0) return setErr('Le loyer doit être supérieur à 0.');

    setLoading(true); setErr('');
    try {
      await onSave({
        ...form,
        loyer:      isImmeuble ? 0 : Number(form.loyer),
        superficie: Number(form.superficie) || null,
        latitude:   form.latitude  ? Number(form.latitude)  : null,
        longitude:  form.longitude ? Number(form.longitude) : null,
        parent_id:  form.parent_id || null,
      });
    } catch (e) {
      setErr(e.response?.data?.error || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 560 }}>
        <div className="modal-header">
          <div className="modal-title">
            {initial
              ? 'Modifier le bien'
              : isUnite
              ? `Ajouter une unité${parentImmeuble ? ` — ${parentImmeuble.nom}` : ''}`
              : 'Ajouter un bien'
            }
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {err && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7,
            padding:'9px 12px', marginBottom:14, fontSize:13, color:'#991b1b' }}>
            ⚠️ {err}
          </div>
        )}

        {/* ── Sélecteur de catégorie (masqué si unité d'immeuble) ── */}
        {!isUnite && (
          <div className="form-group">
            <label className="form-label">Catégorie</label>
            <div style={{ display:'flex', gap:8 }}>
              {Object.entries(CATEGORIES).map(([cat, meta]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorieChange(cat)}
                  style={{
                    flex:1, padding:'10px 8px', borderRadius:9, border:'1px solid',
                    borderColor: form.categorie === cat ? 'var(--green)' : 'var(--border)',
                    background: form.categorie === cat ? 'var(--sand)' : 'var(--white)',
                    cursor:'pointer', textAlign:'center', transition:'all .13s',
                  }}
                >
                  <div style={{ fontSize:18, marginBottom:3 }}>{meta.icon}</div>
                  <div style={{ fontSize:12, fontWeight: form.categorie === cat ? 600 : 400 }}>{cat}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Appartient à un immeuble ── */}
        {!isImmeuble && immeubles.length > 0 && (
          <div className="form-group">
            <label className="form-label">Appartient à un immeuble (optionnel)</label>
            <select className="form-input" value={form.parent_id} onChange={e => set('parent_id', e.target.value)}>
              <option value="">— Bien indépendant —</option>
              {immeubles.map(imm => (
                <option key={imm.id} value={imm.id}>
                  🏢 {imm.nom} — {imm.quartier}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Nom ── */}
        <div className="form-group">
          <label className="form-label">
            {isImmeuble ? 'Nom de l\'immeuble *' : isUnite ? 'Nom de l\'unité *' : 'Nom du bien *'}
          </label>
          <input
            className="form-input"
            value={form.nom}
            onChange={e => set('nom', e.target.value)}
            placeholder={isImmeuble ? 'Ex: Résidence Les Palmiers' : isUnite ? 'Ex: Appt A1 – Rdc' : 'Ex: Villa F4 Cocody'}
          />
        </div>

        {/* ── Adresse (principalement pour immeubles) ── */}
        {(isImmeuble || isUnite) && (
          <div className="form-group">
            <label className="form-label">Adresse{isImmeuble ? ' *' : ''}</label>
            <input
              className="form-input"
              value={form.adresse}
              onChange={e => set('adresse', e.target.value)}
              placeholder="Ex: 12 Av. de la Paix, Cocody"
            />
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quartier *</label>
            <select className="form-input" value={form.quartier} onChange={e => set('quartier', e.target.value)}>
              {QUARTIERS.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
          {!isImmeuble && (
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                {typesDispos.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Loyer et superficie — masqués pour un immeuble */}
        {!isImmeuble && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Superficie (m²)</label>
              <input className="form-input" type="number" value={form.superficie}
                onChange={e => set('superficie', e.target.value)} placeholder="65" />
            </div>
            <div className="form-group">
              <label className="form-label">Loyer mensuel (FCFA) *</label>
              <input className="form-input" type="number" value={form.loyer}
                onChange={e => set('loyer', e.target.value)} placeholder="150000" />
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Statut</label>
            <select className="form-input" value={form.statut} onChange={e => set('statut', e.target.value)}>
              {STATUTS.map(s => <option key={s.v} value={s.v}>{s.val}</option>)}
            </select>
          </div>
          {isImmeuble && (
            <div className="form-group">
              <label className="form-label">Description courte</label>
              <input className="form-input" value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Ex: R+3, gardiennage 24h" />
            </div>
          )}
        </div>

        {/* GPS — uniquement pour biens indépendants et immeubles */}
        {!isUnite && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude (GPS)</label>
              <input className="form-input" type="number" step="0.0001" value={form.latitude}
                onChange={e => set('latitude', e.target.value)} placeholder="5.3560" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude (GPS)</label>
              <input className="form-input" type="number" step="0.0001" value={form.longitude}
                onChange={e => set('longitude', e.target.value)} placeholder="-3.9890" />
            </div>
          </div>
        )}

        {!isImmeuble && (
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={2} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Appartement lumineux, 2 chambres, balcon..." />
          </div>
        )}

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
