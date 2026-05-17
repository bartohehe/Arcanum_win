import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { THEMES, todayISO } from '../data';
import { useUiStore } from '../store/uiStore';
import { resetData, exportJson } from '../lib/tauri';

type Section = 'general' | 'data' | 'about' | 'danger';

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const qc = useQueryClient();

  const [section, setSection] = useState<Section>('general');
  const [confirmReset, setConfirmReset] = useState(false);

  async function handleExport() {
    const data = await exportJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arcanum-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleReset() {
    await resetData();
    await qc.invalidateQueries();
    setConfirmReset(false);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Ustawienia</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Zamknij">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-nav">
            <button className={'nav-item' + (section === 'general' ? ' active' : '')} onClick={() => setSection('general')}>Ogólne</button>
            <button className={'nav-item' + (section === 'data' ? ' active' : '')} onClick={() => setSection('data')}>Dane</button>
            <button className={'nav-item' + (section === 'about' ? ' active' : '')} onClick={() => setSection('about')}>O aplikacji</button>
            <button className={'nav-item danger-nav' + (section === 'danger' ? ' active' : '')} onClick={() => setSection('danger')}>Strefa niebezpieczna</button>
          </div>

          <div className="modal-section">
            {section === 'general' && (
              <div>
                <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div className="setting-label">Motyw kolorystyczny</div>
                  <div className="setting-help" style={{ marginBottom: 12 }}>Wybierz paletę wizualną aplikacji.</div>
                  <div className="theme-grid">
                    {THEMES.map((t) => (
                      <div
                        key={t.value}
                        className={'theme-chip' + (theme === t.value ? ' active' : '')}
                        onClick={() => setTheme(t.value)}
                        title={t.label}
                      >
                        <div className="swatch" style={{ background: t.swatch }} />
                        <div className="name">{t.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Wersja</div>
                    <div className="setting-help mono">Arcanum 1.0 · {todayISO()}</div>
                  </div>
                </div>
              </div>
            )}

            {section === 'data' && (
              <div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Eksport danych</div>
                    <div className="setting-help">Pobierz wszystkie swoje postępy jako plik JSON.</div>
                  </div>
                  <button className="btn ghost" onClick={handleExport}>Pobierz JSON</button>
                </div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Dane lokalne</div>
                    <div className="setting-help">Wszystkie dane są zapisywane lokalnie w bazie SQLite. Nic nie trafia na serwer.</div>
                  </div>
                </div>
              </div>
            )}

            {section === 'about' && (
              <div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Arcanum</div>
                    <div className="setting-help">RPG tracker życia oparty na sześciu żywiołach: Ogień, Woda, Ziemia, Powietrze, Metal, Duch. Każda kategoria to osobne drzewo umiejętności z własnym poziomem i XP.</div>
                  </div>
                </div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label">Filozofia</div>
                    <div className="setting-help">"Ogień bez kontroli pochłania. Woda bez kierunku rozlewa się. Równowaga sześciu żywiołów buduje legendę."</div>
                  </div>
                </div>
              </div>
            )}

            {section === 'danger' && (
              <div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label" style={{ color: 'var(--c-health)' }}>Reset postępu</div>
                    <div className="setting-help">Usuwa wszystkie dane: postać, XP, nawyki, questy, dziennik. Tej operacji nie można cofnąć.</div>
                  </div>
                  {confirmReset ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn ghost" onClick={() => setConfirmReset(false)}>Anuluj</button>
                      <button className="btn danger" onClick={handleReset}>Potwierdź</button>
                    </div>
                  ) : (
                    <button className="btn danger" onClick={() => setConfirmReset(true)}>Resetuj</button>
                  )}
                </div>
                <div className="setting-row">
                  <div>
                    <div className="setting-label" style={{ color: 'var(--c-health)' }}>Eksport przed resetem</div>
                    <div className="setting-help">Przed zresetowaniem warto pobrać kopię swoich danych.</div>
                  </div>
                  <button className="btn ghost" onClick={handleExport}>Pobierz JSON</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
