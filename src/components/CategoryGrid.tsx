import { CATEGORIES } from '../data';
import { useCharacter } from '../hooks/useCharacter';
import { useUiStore } from '../store/uiStore';

export function CategoryGrid() {
  const { data: character } = useCharacter();
  const activeCat = useUiStore((s) => s.activeCategory);
  const setActiveCat = useUiStore((s) => s.setActiveCategory);

  const activeCatDef = activeCat ? CATEGORIES.find((c) => c.id === activeCat) : null;

  function getCatData(catId: string) {
    if (!character) return { level: 1, xp_in_level: 0, xp_to_next: 250, xp: 0 };
    return character.categories.find((c) => c.id === catId) ?? { level: 1, xp_in_level: 0, xp_to_next: 250, xp: 0 };
  }

  return (
    <div>
      <div className="section-title">
        <h2>Drzewo Umiejętności</h2>
        <span className="ornament">✦</span>
        <div className="line" />
      </div>

      <div className="cats">
        {CATEGORIES.map((cat) => {
          const c = getCatData(cat.id);
          const pct = (c.xp_in_level / c.xp_to_next) * 100;
          const isActive = activeCat === cat.id;
          return (
            <div
              key={cat.id}
              className={'cat' + (isActive ? ' active' : '')}
              style={{ '--accent': cat.color } as React.CSSProperties}
              onClick={() => setActiveCat(isActive ? null : cat.id)}
            >
              <div className="cat-head">
                <div className="cat-title">
                  <div className="cat-rune">{cat.rune}</div>
                  <div>
                    <div className="cat-name">{cat.name}</div>
                    <div className="cat-element" style={{ color: cat.color }}>Żywioł: {cat.element}</div>
                  </div>
                </div>
                <div className="cat-lvl">LV {c.level}</div>
              </div>
              <div className="cat-xp">
                <div className="fill" style={{ width: pct + '%' }} />
              </div>
              <div className="cat-meta">
                <span>{c.xp_in_level} / {c.xp_to_next} XP</span>
                <span>{c.xp} TOTAL</span>
              </div>
              <div className="cat-skills">
                {cat.skills.map((s, i) => (
                  <span key={s} className={'cat-skill' + (i < c.level - 1 ? ' unlocked' : '')}>{s}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activeCatDef && (
        <div
          className="detail"
          style={{ '--accent': activeCatDef.color, borderColor: activeCatDef.color } as React.CSSProperties}
        >
          <div className="detail-row">
            <div className="detail-rune" style={{ background: activeCatDef.color }}>{activeCatDef.rune}</div>
            <div style={{ flex: 1 }}>
              <div className="detail-title" style={{ color: activeCatDef.color }}>{activeCatDef.name}</div>
              <div className="detail-element">Żywioł {activeCatDef.element} · {activeCatDef.elementEn}</div>
            </div>
          </div>
          <div className="detail-desc">{activeCatDef.desc}</div>
        </div>
      )}
    </div>
  );
}
