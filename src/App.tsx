import { useEffect } from 'react';
import { useUiStore } from './store/uiStore';
import { TopBar } from './components/TopBar';
import { CharacterPanel } from './components/CharacterPanel';
import { CategoryGrid } from './components/CategoryGrid';
import { HabitTracker } from './components/HabitTracker';
import { QuestPanel } from './components/QuestPanel';
import { ActivityLog } from './components/ActivityLog';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';

export default function App() {
  const theme = useUiStore((s) => s.theme);
  const settingsOpen = useUiStore((s) => s.settingsOpen);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} />
      <div className="grid">
        <div className="col-left"><CharacterPanel /></div>
        <div className="col-mid">
          <CategoryGrid />
          <div style={{ height: 22 }} />
          <HabitTracker />
        </div>
        <div className="col-right">
          <QuestPanel />
          <div style={{ height: 22 }} />
          <ActivityLog />
        </div>
      </div>
      <ToastContainer />
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
