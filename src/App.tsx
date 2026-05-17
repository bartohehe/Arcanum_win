import { useEffect } from 'react';
import { useUiStore } from './store/uiStore';

export default function App() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <div style={{ padding: 24, color: 'white' }}>Arcanum loading...</div>;
}
