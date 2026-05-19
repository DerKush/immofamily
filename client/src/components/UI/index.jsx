// ── Badge statut bien ──────────────────────────────────────────
export function BienBadge({ statut }) {
  const map = { occupe: ['badge-occ', 'Occupé'], vacant: ['badge-vac', 'Vacant'], maintenance: ['badge-maint', 'Maintenance'] };
  const [cls, label] = map[statut] || ['badge-occ', statut];
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Badge statut paiement ──────────────────────────────────────
export function PayBadge({ statut }) {
  const map = { paye: ['badge-paye', 'Payé'], impaye: ['badge-impaye', 'Impayé'], en_attente: ['badge-attente', 'En attente'] };
  const [cls, label] = map[statut] || ['badge-attente', statut];
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Stat Card ─────────────────────────────────────────────────
export function StatCard({ label, value, sub, subClass, accent }) {
  return (
    <div className={`stat-card${accent ? ' accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className={`stat-sub ${subClass || ''}`}>{sub}</div>}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgBar({ value, color = 'var(--green-light)', label, max = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 500 }}>{value} / {max}</span>
        </div>
      )}
      <div className="prog-wrap">
        <div className="prog-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Format currency ───────────────────────────────────────────
export function fCFA(n) {
  return Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
}

// ── Quartier color map ─────────────────────────────────────────
export const QUARTIER_COLORS = {
  Cocody: '#40916c', Riviera: '#e07b46', Plateau: '#1e6091',
  Angré: '#2c7873', Marcory: '#7b3f00', Yopougon: '#c4622d',
  Treichville: '#6b2d8b', Adjamé: '#b23a2f', Abobo: '#5c4033',
};
export function QuartierBadge({ q }) {
  const c = QUARTIER_COLORS[q] || '#888';
  return (
    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 500, background: c + '22', color: c }}>
      {q}
    </span>
  );
}
