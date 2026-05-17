import { useMemo } from 'react';
import { CATEGORIES, STAT_LABELS } from '../data';
import { useCharacter, useUpdateName } from '../hooks/useCharacter';
import type { StatAbbr } from '../types';

export function CharacterPanel() {
  const { data: character } = useCharacter();
  const updateName = useUpdateName();

  const name = character?.name ?? '';
  const level = character?.level ?? 1;
  const xpInLevel = character?.xp_in_level ?? 0;
  const xpToNext = character?.xp_to_next ?? 1000;
  const pct = (xpInLevel / xpToNext) * 100;

  const stats = useMemo(() => {
    if (!character) return {} as Record<StatAbbr, number>;
    const out = {} as Record<StatAbbr, number>;
    for (const cat of character.categories) {
      const def = CATEGORIES.find((c) => c.id === cat.id);
      if (def) out[def.stat] = cat.level;
    }
    return out;
  }, [character]);

  const classTitle = useMemo(() => {
    if (!character) return 'Awanturnik · Klasa życia';
    const top = [...character.categories].sort((a, b) => b.xp - a.xp)[0];
    const topDef = top ? CATEGORIES.find((c) => c.id === top.id) : null;
    return topDef ? `Mistrz ${topDef.element}u · Klasa życia` : 'Awanturnik · Klasa życia';
  }, [character]);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Bohater</h3>
        <span className="right">SHEET · 01</span>
      </div>
      <div className="character">
        <div className="avatar">
          <div className="glyph">{(name || 'A').charAt(0).toUpperCase()}</div>
        </div>

        <input
          className="char-name-input"
          value={name}
          onChange={(e) => updateName.mutate(e.target.value)}
          placeholder="Twoje imię"
        />
        <div className="char-class">{classTitle}</div>

        <div className="lvl-row">
          <div className="lvl-num">{level}</div>
          <div className="lvl-lbl">Poziom<br />postaci</div>
        </div>

        <div style={{ width: '100%' }}>
          <div className="xpbar">
            <div className="fill" style={{ width: pct + '%' }} />
            <div className="ticks" />
          </div>
          <div className="xpbar-meta">
            <span>{xpInLevel} XP</span>
            <span>/ {xpToNext} do nast. poziomu</span>
          </div>
        </div>

        <div className="stats">
          {(Object.entries(stats) as [StatAbbr, number][]).map(([abbr, lvl]) => (
            <div key={abbr} className="stat">
              <div className="abbr">{abbr}</div>
              <div className="val">{lvl}</div>
              <div className="delta">{STAT_LABELS[abbr]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
