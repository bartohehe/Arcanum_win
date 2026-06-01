import { useState, useMemo } from 'react';
import { CATEGORIES, todayISO } from '../data';
import { useHabits, useHabitLog, useToggleHabit, useCreateHabit, useDeleteHabit } from '../hooks/useHabits';
import {
  useNegativeHabits,
  useBlockedCats,
  useToggleNegativeHabit,
  useCreateNegativeHabit,
  useDeleteNegativeHabit,
} from '../hooks/useNegativeHabits';
import type { ElementId, NegativeHabitWithStatus } from '../types';

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

// ── Category picker shared by both positive and negative habit forms ─────────
function CatPicker({ value, onChange }: { value: ElementId; onChange: (id: ElementId) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
      {CATEGORIES.map((c) => (
        <span
          key={c.id}
          onClick={() => onChange(c.id)}
          className="cat-skill"
          style={{
            cursor: 'pointer',
            borderColor: value === c.id ? c.color : 'var(--line)',
            color: value === c.id ? c.color : 'var(--ink-3)',
          }}
        >
          {c.rune} {c.name.split(' ')[0]}
        </span>
      ))}
    </div>
  );
}

// ── Negative Habit Section ────────────────────────────────────────────────────
function NegativeHabitSection({ days, today }: {
  blockedCats: Set<string>;
  days: string[];
  today: string;
}) {
  const { data: negHabits = [] } = useNegativeHabits();
  const toggleNeg = useToggleNegativeHabit();
  const createNeg = useCreateNegativeHabit();
  const deleteNeg = useDeleteNegativeHabit();

  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<ElementId>('health');
  const [newXpBlock, setNewXpBlock] = useState(15);
  const [newPenalty, setNewPenalty] = useState(30);
  const [showHistory, setShowHistory] = useState(true);

  // Build a map from date -> Set<negHabitId> for the 7-day grid
  // We rely on logged_today for today; for past days we'd need a separate log.
  // Since the backend doesn't expose a full neg-habit log endpoint, we show
  // a mini grid only for today toggling — history grid uses logged_today only.
  // (full 7-day neg log can be added later as a dedicated command)

  function handleAdd() {
    if (!newName.trim()) return;
    createNeg.mutate({ name: newName.trim(), cat_id: newCat, xp_block: newXpBlock, penalty_xp: newPenalty });
    setNewName('');
  }

  return (
    <div>
      <div className="ornament-row" style={{ color: 'var(--c-health)', borderColor: 'var(--c-health)' }}>
        ✦ POKUSY ✦
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {negHabits.map((nh: NegativeHabitWithStatus) => {
          const cat = CATEGORIES.find((c) => c.id === nh.cat_id);
          const active = nh.logged_today;
          return (
            <div
              key={nh.id}
              className={'neg-habit' + (active ? ' active' : '')}
              onClick={() => toggleNeg.mutate({ habitId: nh.id })}
            >
              <div className="tick">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div className="neg-name">{nh.name}</div>

              {nh.bad_streak > 0 && (
                <span className={'neg-streak' + (nh.penalty_active ? ' pulse' : '')}>
                  {nh.penalty_active ? '💀' : '🔴'} {nh.bad_streak}
                </span>
              )}

              <span className="neg-block-info">
                {cat ? `blokuje +${nh.xp_block} XP (${cat.name.split(' ')[0]})` : `blokuje +${nh.xp_block} XP`}
              </span>

              <button
                className="btn danger"
                style={{ padding: '2px 6px', fontSize: 9, flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); deleteNeg.mutate(nh.id); }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* 7-day grid — today only shows live state; past days show nh.logged_today approximation */}
      {negHabits.length > 0 && (
        <>
          <div
            className="ornament-row"
            style={{ cursor: 'pointer', fontSize: 10 }}
            onClick={() => setShowHistory(!showHistory)}
          >
            ✦ HISTORIA {showHistory ? '▾' : '▸'} ✦
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
              {negHabits.map((nh: NegativeHabitWithStatus) => (
                <div key={nh.id} className="habit-grid" style={{ marginTop: 4 }}>
                  <div className="h">{nh.name.slice(0, 16)}</div>
                  {days.map((d) => {
                    const isToday = d === today;
                    // For today, use logged_today; past days: no per-day data without a new endpoint
                    const yielded = isToday ? nh.logged_today : false;
                    const hasData = isToday;
                    return (
                      <div
                        key={d}
                        className={
                          'cell' +
                          (isToday ? ' today' : '') +
                          (hasData && yielded ? ' neg-on' : '') +
                          (hasData && !yielded ? ' neg-off' : '')
                        }
                        onClick={isToday ? () => toggleNeg.mutate({ habitId: nh.id }) : undefined}
                        style={{ cursor: isToday ? 'pointer' : 'default' }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add new negative habit form */}
      <div style={{ marginTop: 8 }}>
        <div className="new-quest">
          <input
            placeholder="Nowa pokusa..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button className="btn danger" onClick={handleAdd}>
            + Dodaj
          </button>
        </div>
        <CatPicker value={newCat} onChange={setNewCat} />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <span className="cat-skill" style={{ borderColor: 'var(--c-health)', color: 'var(--c-health)' }}>
            Blokada:
            <input
              type="number"
              value={newXpBlock}
              onChange={(e) => setNewXpBlock(parseInt(e.target.value) || 0)}
              style={{ width: 36, background: 'transparent', border: 'none', color: 'var(--c-health)', fontFamily: 'inherit', textAlign: 'center' }}
            />
            XP
          </span>
          <span className="cat-skill" style={{ borderColor: 'var(--c-health)', color: 'var(--c-health)' }}>
            Kara:
            <input
              type="number"
              value={newPenalty}
              onChange={(e) => setNewPenalty(parseInt(e.target.value) || 0)}
              style={{ width: 36, background: 'transparent', border: 'none', color: 'var(--c-health)', fontFamily: 'inherit', textAlign: 'center' }}
            />
            XP
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main HabitTracker ────────────────────────────────────────────────────────
export function HabitTracker() {
  const { data: habits = [] } = useHabits();
  const { data: habitLogDays = [] } = useHabitLog(7);
  const { data: blockedCatsArr = [] } = useBlockedCats();
  const toggleHabit = useToggleHabit();
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();

  const today = todayISO();
  const days = getLast7Days();

  const [showHistory, setShowHistory] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<ElementId>('habit');
  const [newXp, setNewXp] = useState(15);

  const blockedCats = useMemo(() => new Set(blockedCatsArr), [blockedCatsArr]);

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
            const shadowBlocked = blockedCats.has(h.cat_id);
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
                  <span
                    className="habit-xp"
                    style={{
                      color: shadowBlocked ? 'var(--ink-3)' : (cat?.color ?? 'var(--gold)'),
                      textDecoration: shadowBlocked ? 'line-through' : 'none',
                    }}
                    title={shadowBlocked ? 'Bonus zablokowany przez Pokusę' : undefined}
                  >
                    +{h.xp_per_check} XP{shadowBlocked ? ' 🚫' : ''}
                  </span>
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

        {/* Shadow Habits section */}
        <NegativeHabitSection blockedCats={blockedCats} days={days} today={today} />
      </div>
    </div>
  );
}
