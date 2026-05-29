import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDate } from '../../context/DateContext';

const TITLES = {
  '/':           'Tableau de bord',
  '/biens':      'Biens immobiliers',
  '/carte':      'Carte interactive',
  '/locataires': 'Locataires',
  '/paiements':  'Loyers & Paiements',
  '/rapports':   'Rapports',
};

const DATE_PAGES   = ['/', '/paiements', '/rapports'];
const currentYear  = new Date().getFullYear();
const ANNEES       = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export default function Topbar({ onAdd, addLabel }) {
  const { pathname } = useLocation();
  const { mois, annee, label, prevMonth, nextMonth, goToMonth, isCurrentMonth, MOIS_LABELS } = useDate();
  const [open, setOpen] = useState(false);
  const title = TITLES[pathname] || 'ImmoFamily';
  const showPicker = DATE_PAGES.includes(pathname);

  const navBtn = (action, icon, disabled, title_) => (
    <button onClick={action} disabled={disabled} title={title_} style={{
      background: 'transparent', border: 'none',
      padding: '4px 9px', cursor: disabled ? 'not-allowed' : 'pointer',
      color: disabled ? 'var(--text-3)' : 'var(--text-2)',
      fontSize: 14, lineHeight: 1, transition: 'background .12s',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--sand-3)'; }}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {icon}
    </button>
  );

  return (
    <div style={{
      background: 'var(--white)', borderBottom: '1px solid var(--border)',
      padding: '0 24px', height: 56, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'relative', zIndex: 10,
    }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 500 }}>
        {title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {showPicker && (
          <div style={{ position: 'relative' }}>
            {/* Pill avec flèches nav */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              background: 'var(--sand-2)', border: '1px solid var(--border)',
              borderRadius: 20, overflow: 'hidden',
            }}>
              {navBtn(prevMonth, '‹', false, 'Mois précédent')}
              <button onClick={() => setOpen(p => !p)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '5px 8px', fontSize: 12, fontWeight: 500, color: 'var(--green)',
                minWidth: 110, textAlign: 'center',
              }}>
                📅 {label}
              </button>
              {navBtn(nextMonth, '›', isCurrentMonth, isCurrentMonth ? 'Mois en cours' : 'Mois suivant')}
            </div>

            {/* Dropdown */}
            {open && (
              <>
                <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 99,
                  background: 'var(--white)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 14, width: 240,
                }}>
                  {/* Années */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                    {ANNEES.map(a => (
                      <button key={a} onClick={() => goToMonth(mois, a)} style={{
                        flex: 1, padding: '4px 0', borderRadius: 6, fontSize: 11,
                        border: '1px solid var(--border)',
                        background: a === annee ? 'var(--green)' : 'transparent',
                        color: a === annee ? '#fff' : 'var(--text-2)',
                        cursor: 'pointer', fontWeight: a === annee ? 500 : 400,
                      }}>{a}</button>
                    ))}
                  </div>

                  {/* Mois */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                    {MOIS_LABELS.slice(1).map((m, i) => {
                      const idx = i + 1;
                      const isFuture = annee === new Date().getFullYear() && idx > new Date().getMonth() + 1;
                      const isSelected = idx === mois && annee === annee;
                      return (
                        <button key={idx} disabled={isFuture} onClick={() => { goToMonth(idx, annee); setOpen(false); }}
                          style={{
                            padding: '5px 2px', borderRadius: 6, fontSize: 11,
                            border: `1px solid ${isSelected ? 'var(--green)' : 'transparent'}`,
                            background: isSelected ? 'var(--green)' : 'transparent',
                            color: isSelected ? '#fff' : isFuture ? 'var(--text-3)' : 'var(--text-2)',
                            cursor: isFuture ? 'not-allowed' : 'pointer',
                            fontWeight: isSelected ? 500 : 400,
                          }}>
                          {m.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={() => { goToMonth(new Date().getMonth() + 1, new Date().getFullYear()); setOpen(false); }}
                    style={{
                      marginTop: 10, width: '100%', padding: '5px', borderRadius: 6,
                      fontSize: 11, background: 'var(--sand-2)', border: '1px solid var(--border)',
                      color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500,
                    }}>
                    Aller au mois actuel
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd}>
            + {addLabel || 'Ajouter'}
          </button>
        )}
      </div>
    </div>
  );
}
