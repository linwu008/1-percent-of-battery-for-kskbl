export type DecisionView = "action" | "intel" | "log";

export default function DecisionControls({ view, onView }: {
  view: DecisionView;
  onView: (view: DecisionView) => void;
}) {
  return (
    <nav className="decision-controls" aria-label="决策操作">
      <div className="command-tabs">
        {([["action", "行动", "01"], ["intel", "已知信息", "02"], ["log", "行动记录", "03"]] as const).map(([id, name, code]) => (
          <button key={id} className={view === id ? "command active" : "command"} aria-pressed={view === id}
            aria-label={name} onClick={() => onView(id)}>
            <span aria-hidden="true">{code}</span><b>{name}</b>
          </button>
        ))}
      </div>
    </nav>
  );
}
