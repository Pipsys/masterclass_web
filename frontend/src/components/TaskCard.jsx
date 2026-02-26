import styles from "./TaskCard.module.css";

const ACCENT_COLORS = [
  "#8AB4F8",
  "#B5EAD7",
  "#FFD6A5",
  "#FFB3C1",
  "#BDB2FF",
  "#CDE7FF"
];

function colorFromStatus(status) {
  if (!status) return ACCENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < status.length; i += 1) {
    hash = (hash * 31 + status.charCodeAt(i)) % 997;
  }
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
}

export default function TaskCard({ task, onDelete, onOpen, dimmed }) {
  const accent = colorFromStatus(task.status);
  const checklistItems = Array.isArray(task.checklist)
    ? task.checklist
    : Array.isArray(task.checklist?.items)
      ? task.checklist.items
      : [];
  const checklistTotal = checklistItems.length;
  const checklistDone = checklistItems.filter((item) =>
    item && (item.done || item.checked || item.completed)
  ).length;

  return (
    <article
      className={`${styles.card} glass ${dimmed ? styles.dimmed : ""}`}
      style={{ "--accent": accent }}
      onClick={() => onOpen?.(task)}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onOpen) return;
        if (e.key === "Enter") onOpen(task);
      }}
    >
      <div className={styles.header}>
        <h4>{task.title}</h4>
        <button
          className={styles.delete}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(task.id);
          }}
          title="\u0423\u0434\u0430\u043b\u0438\u0442\u044c"
          aria-label="\u0423\u0434\u0430\u043b\u0438\u0442\u044c"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {task.description && <p>{task.description}</p>}
      {checklistTotal > 0 && (
        <div className={styles.checklist}>
          <span>{`\u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u043e ${checklistDone}/${checklistTotal}`}</span>
          <div className={styles.checklistBar}>
            <span style={{ width: `${Math.round((checklistDone / checklistTotal) * 100)}%` }} />
          </div>
        </div>
      )}
    </article>
  );
}
