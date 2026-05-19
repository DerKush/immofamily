import { useState, useEffect } from 'react';

const QUARTIERS = ['Cocody','Plateau','Riviera','Marcory','Yopougon','Angré','Treichville','Adjamé','Abobo','Koumassi','Port-Bouët'];
const TYPES     = ['Appartement','Villa','Studio','Local commercial','Chambre','Duplex','Immeuble'];
const STATUTS   = [{ v:'vacant',val:'Vacant' },{ v:'occupe',val:'Occupé' },{ v:'maintenance',val:'Maintenance' }];

const EMPTY = { nom:'', quartier:'Cocody', type:'Appartement', superficie:'', loyer:'', statut:'vacant', latitude:'', longitude:'', description:'' };

export default function BienModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setForm(initial ? { ...EMPTY, ...initial } : EMPTY); }, [initial, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nom || !form.quartier || !form.loyer) return alert('Nom, quartier et loyer sont obligatoires');
    setLoading(true);
    await onSave({ ...form, loyer: Number(form.loyer), superficie: Number(form.superficie) || null });
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{initial ? 'Modifier le bien' : 'Ajouter un bien'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Nom du bien *</label>
          <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Villa F4 Cocody Riviera" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quartier *</label>
            <select className="form-input" value={form.quartier} onChange={e => set('quartier', e.target.value)}>
              {QUARTIERS.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Superficie (m²)</label>
            <input className="form-input" type="number" value={form.superficie} onChange={e => set('superficie', e.target.value)} placeholder="65" />
          </div>
          <div className="form-group">
            <label className="form-label">Loyer mensuel (FCFA) *</label>
            <input className="form-input" type="number" value={form.loyer} onChange={e => set('loyer', e.target.value)} placeholder="150000" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Statut</label>
          <select className="form-input" value={form.statut} onChange={e => set('statut', e.target.value)}>
            {STATUTS.map(s => <option key={s.v} value={s.v}>{s.val}</option>)}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitude (GPS)</label>
            <input className="form-input" type="number" step="0.0001" value={form.latitude} onChange={e => set('latitude', e.target.value)} placeholder="5.3560" />
          </div>
          <div className="form-group">
            <label className="form-label">Longitude (GPS)</label>
            <input className="form-input" type="number" step="0.0001" value={form.longitude} onChange={e => set('longitude', e.target.value)} placeholder="-3.9890" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Appartement lumineux, 2 chambres, balcon, gardiennage..." />
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
