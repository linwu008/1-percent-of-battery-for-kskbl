export type DecisionView = "action" | "intel" | "log";

export default function DecisionControls({ view, onView, label, canConfirm, typing, onConfirm }: {
  view: DecisionView;
  onView: (view: DecisionView) => void;
  label?: string;
  canConfirm: boolean;
  typing: boolean;
  onConfirm: () => void;
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
      <button className="confirm-action" data-testid="confirm-action" disabled={!canConfirm}
        onClick={onConfirm} title={label ? `确认：${label}` : "请先选择一个行动"}>
        <span><small>{typing ? "先读完，再决定" : label ? "已选定 · 等待确认" : "尚未选择行动"}</small>
          <strong>{typing && label ? "显示完整剧情" : label ? `确认：${label}` : "选择后确认"}</strong></span>
        <span className="enter-key" aria-hidden="true">↵</span>
      </button>
    </nav>
  );
}
