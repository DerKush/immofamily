import { useState, useEffect } from 'react';

const MODES = ['Espèces','Virement','Mobile Money','Chèque','Orange Money','Wave'];
const EMPTY = { locataire_id:'', bien_id:'', montant:'', date_paiement:'', mode:'Mobile Money', statut:'paye', mois:5, annee:2025, notes:'' };

export default function PaiementModal({ open, onClose, onSave, locataires }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setForm(EMPTY); }, [open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLocChange = (locId) => {
    const loc = locataires?.find(l => l.id === Number(locId));
    setForm(f => ({ ...f, locataire_id: locId, bien_id: loc?.bien_id || '', montant: loc?.loyer || '' }));
  };

  const handleSave = async () => {
    if (!form.locataire_id || !form.montant) return alert('Locataire et montant requis');
    setLoading(true);
    await onSave({ ...form, montant: Number(form.montant) });
    setLoading(false);
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">Enregistrer un paiement</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Locataire *</label>
          <select className="form-input" value={form.locataire_id} onChange={e => handleLocChange(e.target.value)}>
            <option value="">— Sélectionner un locataire —</option>
            {(locataires || []).map(l => (
              <option key={l.id} value={l.id}>{l.nom} — {l.bien_nom}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Montant (FCFA) *</label>
            <input className="form-input" type="number" value={form.montant} onChange={e => set('montant', e.target.value)} placeholder="150000" />
          </div>
          <div className="form-group">
            <label className="form-label">Date de paiement</label>
            <input className="form-input" type="date" value={form.date_paiement} onChange={e => set('date_paiement', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mode de paiement</label>
            <select className="form-input" value={form.mode} onChange={e => set('mode', e.target.value)}>
              {MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Statut</label>
            <select className="form-input" value={form.statut} onChange={e => set('statut', e.target.value)}>
              <option value="paye">Payé</option>
              <option value="en_attente">En attente</option>
              <option value="impaye">Impayé</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mois</label>
            <select className="form-input" value={form.mois} onChange={e => set('mois', e.target.value)}>
              {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
                .map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Année</label>
            <input className="form-input" type="number" value={form.annee} onChange={e => set('annee', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes (optionnel)</label>
          <textarea className="form-input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Paiement partiel, avance sur loyer, etc." />
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
