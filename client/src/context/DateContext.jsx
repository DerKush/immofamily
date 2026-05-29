import { createContext, useContext, useState, useCallback } from 'react';

const DateContext = createContext(null);

const MOIS_LABELS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function DateProvider({ children }) {
  const now = new Date();
  const [mois,  setMois]  = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());

  const prevMonth = useCallback(() => {
    setMois(m => {
      if (m === 1) { setAnnee(a => a - 1); return 12; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    const isCurrentMonth = mois === now.getMonth() + 1 && annee === now.getFullYear();
    if (isCurrentMonth) return; // pas de futur
    setMois(m => {
      if (m === 12) { setAnnee(a => a + 1); return 1; }
      return m + 1;
    });
  }, [mois, annee]);

  const goToMonth = useCallback((m, a) => {
    setMois(Number(m));
    setAnnee(Number(a));
  }, []);

  const isCurrentMonth =
    mois  === now.getMonth() + 1 &&
    annee === now.getFullYear();

  const label = `${MOIS_LABELS[mois]} ${annee}`;

  return (
    <DateContext.Provider value={{ mois, annee, label, prevMonth, nextMonth, goToMonth, isCurrentMonth, MOIS_LABELS }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const ctx = useContext(DateContext);
  if (!ctx) throw new Error('useDate doit être utilisé dans <DateProvider>');
  return ctx;
}
