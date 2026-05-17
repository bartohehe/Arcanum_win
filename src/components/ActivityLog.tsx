import { useActivityLog } from '../hooks/useActivityLog';

export function ActivityLog() {
  const { data: log = [] } = useActivityLog(30);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Dziennik Czynów</h3>
        <span className="right">LOG</span>
      </div>
      <div className="panel-body">
        <div className="log">
          {log.length === 0 && (
            <div style={{ color: 'var(--ink-3)' }}>
              // Brak wpisów. Zacznij zaznaczać nawyki i questy.
            </div>
          )}
          {log.map((line) => (
            <div key={line.id} className="log-line">
              <span className="log-time">{line.time}</span>
              <span className="log-msg">{line.message}</span>
              {line.xp ? <span className="log-xp">+{line.xp} XP</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
