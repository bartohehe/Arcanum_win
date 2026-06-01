import { useState } from 'react';
import { CATEGORIES, todayISO } from '../data';
import {
  useNegativeHabits,
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

// Category picker for the negative-habit form
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

export function NegativeHabitTracker() {
  const { data: negHabits = [] } = useNegativeHabits();
  const toggleNeg = useToggleNegativeHabit();
  const createNeg = useCreateNegativeHabit();
  const deleteNeg = useDeleteNegativeHabit();

  const today = todayISO();
  const days = getLast7Days();

  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<ElementId>('health');
  const [newXpBlock, setNewXpBlock] = useState(15);
  const [newPenalty, setNewPenalty] = useState(30);
  const [showHistory, setShowHistory] = useState(true);

  const yieldedToday = negHabits.filter((nh) => nh.logged_today).length;

  function handleAdd() {
    if (!newName.trim()) return;
    createNeg.mutate({ name: newName.trim(), cat_id: newCat, xp_block: newXpBlock, penalty_xp: newPenalty });
    setNewName('');
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Pokusy</h3>
        <span className="right" style={{ color: 'var(--c-health)' }}>
          ULEGŁEŚ · {yieldedToday} / {negHabits.length}
        </span>
      </div>
      <div className="panel-body">
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

        {/* 7-day grid — today only shows live state */}
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
        <div className="ornament-row" style={{ color: 'var(--c-health)', borderColor: 'var(--c-health)' }}>
          ✦ NOWA POKUSA ✦
        </div>
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
