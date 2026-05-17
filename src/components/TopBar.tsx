import { CATEGORIES } from '../data';
import { useHabits } from '../hooks/useHabits';

interface Props {
  onOpenSettings: () => void;
}

export function TopBar({ onOpenSettings }: Props) {
  const { data: habits = [] } = useHabits();
  const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // Global streak: max streak among all habits that have one
  const streak = habits.length > 0
    ? Math.max(...habits.map((h) => h.streak), 0)
    : 0;

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">気</div>
        <div>
          <div className="brand-title">Arcanum</div>
          <div className="brand-sub">Sześć żywiołów codzienności</div>
        </div>
      </div>

      <div className="elements-strip">
        {CATEGORIES.map((c) => (
          <span key={c.id} className="el-glyph" style={{ color: c.color }} title={c.element}>
            {c.rune}
          </span>
        ))}
      </div>

      <div className="day-strip">
        <div className="date">{today}</div>
        <div className="streak">
          <span className="flame">🔥</span>
          <div className="num">{streak}</div>
          <div className="lbl">Dzień<br />z rzędu</div>
        </div>
        <button className="icon-btn" onClick={onOpenSettings} title="Ustawienia" aria-label="Ustawienia">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
