import { useState } from 'react';
import { CATEGORIES } from '../data';
import { useQuests, useToggleQuest, useCreateQuest, useDeleteQuest } from '../hooks/useQuests';
import type { QuestBucket, Rarity, ElementId } from '../types';

const TABS: { id: QuestBucket; label: string }[] = [
  { id: 'daily', label: 'Dzienne' },
  { id: 'weekly', label: 'Tygodniowe' },
  { id: 'epic', label: 'Epickie' },
];

const RARITY_XP: Record<QuestBucket, number> = { daily: 30, weekly: 150, epic: 1000 };
const RARITY_FOR_BUCKET: Record<QuestBucket, Rarity> = { daily: 'common', weekly: 'rare', epic: 'epic' };

export function QuestPanel() {
  const [tab, setTab] = useState<QuestBucket>('daily');
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<ElementId>('work');

  const { data: dailyQuests = [] } = useQuests('daily');
  const { data: weeklyQuests = [] } = useQuests('weekly');
  const { data: epicQuests = [] } = useQuests('epic');
  const toggleQuest = useToggleQuest();
  const createQuest = useCreateQuest();
  const deleteQuest = useDeleteQuest(tab);

  const questsByBucket: Record<QuestBucket, typeof dailyQuests> = {
    daily: dailyQuests,
    weekly: weeklyQuests,
    epic: epicQuests,
  };
  const quests = questsByBucket[tab];
  const pendingByBucket: Record<QuestBucket, number> = {
    daily: dailyQuests.filter((q) => !q.done).length,
    weekly: weeklyQuests.filter((q) => !q.done).length,
    epic: epicQuests.filter((q) => !q.done).length,
  };

  function handleAdd() {
    if (!newName.trim()) return;
    createQuest.mutate({
      title: newName.trim(),
      bucket: tab,
      cat_id: newCat,
      xp_reward: RARITY_XP[tab],
      rarity: RARITY_FOR_BUCKET[tab],
    });
    setNewName('');
  }

  const bucketLabel = tab === 'daily' ? 'dzienne' : tab === 'weekly' ? 'tygodniowe' : 'epickie';

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Zadania (Questy)</h3>
        <span className="right">SCROLL · 02</span>
      </div>
      <div className="panel-body">
        <div className="quest-tabs">
          {TABS.map((t) => (
            <div
              key={t.id}
              className={'quest-tab' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
            >
              {t.label} · {pendingByBucket[t.id]}
            </div>
          ))}
        </div>

        <div>
          {quests.length === 0 && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', padding: '20px 0', textAlign: 'center' }}>
              Brak zadań. Dodaj nowe poniżej.
            </div>
          )}
          {quests.map((q) => {
            const cat = CATEGORIES.find((c) => c.id === q.cat_id);
            const catColor = cat?.color ?? 'var(--gold)';
            return (
              <div
                key={q.id}
                className={'quest' + (q.done ? ' done' : '')}
                style={{ '--accent': catColor, borderLeftColor: catColor, borderLeftWidth: 3 } as React.CSSProperties}
                onClick={() => toggleQuest.mutate(q.id)}
              >
                <div className="q-row">
                  <div className="q-left">
                    <div className="q-tick" />
                    <span className="q-tag" style={{ borderColor: catColor, color: catColor }}>
                      {cat?.rune ?? '?'} {cat?.name.split(' ')[0] ?? q.cat_id}
                    </span>
                    <div className="q-name">{q.title}</div>
                  </div>
                  <div className="q-right">
                    <span className={'q-rarity r-' + q.rarity}>{q.rarity}</span>
                    <span className="q-xp">+{q.xp_reward}</span>
                    <button
                      className="btn danger"
                      style={{ padding: '2px 6px', fontSize: 9 }}
                      onClick={(e) => { e.stopPropagation(); deleteQuest.mutate(q.id); }}
                    >×</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="new-quest">
          <input
            placeholder={`Nowe zadanie ${bucketLabel}...`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button className="btn" onClick={handleAdd}>+ Dodaj</button>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <span
              key={c.id}
              onClick={() => setNewCat(c.id)}
              className="cat-skill"
              style={{ cursor: 'pointer', borderColor: newCat === c.id ? c.color : 'var(--line)', color: newCat === c.id ? c.color : 'var(--ink-3)' }}
            >{c.rune}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
