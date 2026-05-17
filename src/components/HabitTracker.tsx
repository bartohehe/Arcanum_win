import { useState, useMemo } from 'react';
import { CATEGORIES, todayISO } from '../data';
import { useHabits, useHabitLog, useToggleHabit, useCreateHabit, useDeleteHabit } from '../hooks/useHabits';
import type { ElementId } from '../types';

function getLast7Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  return ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'][d.getDay()];
}

export function HabitTracker() {
  const { data: habits = [] } = useHabits();
  const { data: habitLogDays = [] } = useHabitLog(7);
  const toggleHabit = useToggleHabit();
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();

  const today = todayISO();
  const days = getLast7Days();

  const [showHistory, setShowHistory] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<ElementId>('habit');
  const [newXp, setNewXp] = useState(15);

  // Build a map from date -> Set<habitId> for fast lookup
  const logMap = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const day of habitLogDays) {
      map.set(day.date, new Set(day.habit_ids));
    }
    return map;
  }, [habitLogDays]);

  const todayDone = habits.filter((h) => h.logged_today).length;

  function handleAdd() {
    if (!newName.trim()) return;
    createHabit.mutate({ name: newName.trim(), cat_id: newCat, xp_per_check: newXp });
    setNewName('');
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Habit Tracker</h3>
        <span className="right">DAILY · {todayDone} / {habits.length}</span>
      </div>
      <div className="panel-body">
        <div className="habit-list">
          {habits.map((h) => {
            const cat = CATEGORIES.find((c) => c.id === h.cat_id)!;
            const done = h.logged_today;
            return (
              <div
                key={h.id}
                className={'habit' + (done ? ' done' : '')}
                style={{ '--accent': cat?.color ?? 'var(--gold)' } as React.CSSProperties}
                onClick={() => toggleHabit.mutate({ habitId: h.id })}
              >
                <div className="tick">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="habit-name">{h.name}</div>
                <div className="habit-meta">
                  <span className="habit-cat-dot" style={{ background: cat?.color ?? 'var(--gold)' }} />
                  <span className="habit-streak" title="Streak">🔥{h.streak}</span>
                  <span className="habit-xp" style={{ color: cat?.color ?? 'var(--gold)' }}>+{h.xp_per_check} XP</span>
                  <button
                    className="btn danger"
                    style={{ padding: '2px 6px', fontSize: 9 }}
                    onClick={(e) => { e.stopPropagation(); deleteHabit.mutate(h.id); }}
                  >×</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ornament-row">✦ NOWY NAWYK ✦</div>
        <div className="new-quest">
          <input
            placeholder="Nazwa nawyku..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button className="btn" onClick={handleAdd}>+ Dodaj</button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {CATEGORIES.map((c) => (
            <span
              key={c.id}
              onClick={() => setNewCat(c.id)}
              className="cat-skill"
              style={{ cursor: 'pointer', borderColor: newCat === c.id ? c.color : 'var(--line)', color: newCat === c.id ? c.color : 'var(--ink-3)' }}
            >{c.rune} {c.name.split(' ')[0]}</span>
          ))}
          <span className="cat-skill" style={{ marginLeft: 'auto', borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            XP:
            <input
              type="number"
              value={newXp}
              onChange={(e) => setNewXp(parseInt(e.target.value) || 0)}
              style={{ width: 40, background: 'transparent', border: 'none', color: 'var(--gold)', fontFamily: 'inherit', textAlign: 'center' }}
            />
          </span>
        </div>

        <div className="ornament-row" onClick={() => setShowHistory(!showHistory)} style={{ cursor: 'pointer' }}>
          ✦ OSTATNIE 7 DNI {showHistory ? '▾' : '▸'} ✦
        </div>
        {showHistory && (
          <div>
            <div className="habit-grid">
              <div className="h" />
              {days.map((d) => (
                <div key={d} className="col-h">
                  {dayLabel(d)}<br />
                  <span style={{ opacity: 0.5 }}>{d.slice(8)}</span>
                </div>
              ))}
            </div>
            {habits.map((h) => {
              const cat = CATEGORIES.find((c) => c.id === h.cat_id)!;
              return (
                <div key={h.id} className="habit-grid" style={{ marginTop: 4 }}>
                  <div className="h">{h.name.slice(0, 16)}</div>
                  {days.map((d) => {
                    const on = logMap.get(d)?.has(h.id) ?? false;
                    const isToday = d === today;
                    return (
                      <div
                        key={d}
                        className={'cell' + (on ? ' on' : '') + (isToday ? ' today' : '')}
                        style={on ? { background: cat?.color, borderColor: cat?.color } as React.CSSProperties : undefined}
                        onClick={() => toggleHabit.mutate({ habitId: h.id, date: d })}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
