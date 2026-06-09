const MOIS_FR = ['','Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export function exportPaiementsCsv(data, mois, annee) {
  const STATUT_FR = { paye: 'Payé', impaye: 'Impayé', en_attente: 'En attente' };
  const headers = ['Locataire','Bien','Quartier','Montant (FCFA)','Date paiement','Mode','Statut'];
  const rows = data.map(p => [
    p.locataire_nom || '', p.bien_nom || '', p.quartier || '',
    p.montant || 0, p.date_paiement || '', p.mode || '',
    STATUT_FR[p.statut] || p.statut,
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `paiements_${MOIS_FR[mois]}_${annee}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
