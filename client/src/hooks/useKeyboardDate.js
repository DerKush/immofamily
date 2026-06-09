import { useEffect } from 'react';
import { useDate } from '../context/DateContext';

export function useKeyboardDate() {
  const { prevMonth, nextMonth } = useDate();
  useEffect(() => {
    const IGNORED = ['INPUT', 'TEXTAREA', 'SELECT'];
    const onKeyDown = (e) => {
      if (IGNORED.includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prevMonth(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextMonth(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [prevMonth, nextMonth]);
}
