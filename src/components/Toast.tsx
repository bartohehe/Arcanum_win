import { useUiStore } from '../store/uiStore';

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={'toast' + (t.type === 'lvlup' ? ' lvlup' : '')}
          onClick={() => removeToast(t.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="tlabel">{t.type === 'lvlup' ? 'LEVEL UP!' : 'XP'}</div>
          <div>{t.type === 'xp' && t.xp ? `+${t.xp} XP — ` : ''}{t.message}</div>
        </div>
      ))}
    </div>
  );
}
