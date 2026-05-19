import { useState, useEffect } from 'react';

const EMPTY = { nom:'', email:'', telephone:'', bien_id:'', date_entree:'', date_echeance:'' };

export default function LocataireModal({ open, onClose, onSave, initial, biens }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setForm(initial ? { ...EMPTY, ...initial } : EMPTY); }, [initial, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nom) return alert('Le nom est obligatoire');
    setLoading(true);
    await onSave({ ...form, bien_id: form.bien_id || null });
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{initial ? 'Modifier le locataire' : 'Ajouter un locataire'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Nom complet *</label>
          <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: M. Kouassi Yao" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@domaine.ci" />
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input className="form-input" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="07 00 00 00 00" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Bien loué</label>
          <select className="form-input" value={form.bien_id} onChange={e => set('bien_id', e.target.value)}>
            <option value="">— Sélectionner un bien —</option>
            {(biens || []).filter(b => b.statut !== 'occupe' || b.id === Number(form.bien_id)).map(b => (
              <option key={b.id} value={b.id}>{b.nom} — {b.quartier}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date d'entrée</label>
            <input className="form-input" type="date" value={form.date_entree} onChange={e => set('date_entree', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Date d'échéance bail</label>
            <input className="form-input" type="date" value={form.date_echeance} onChange={e => set('date_echeance', e.target.value)} />
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
