import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard.jsx";
import styles from "./Column.module.css";

const EMPTY_PREFIX = "Здесь будут задачи в статусе";
const EMPTY_HINT = "Перетащите сюда задачу, чтобы начать ее выполнение";

export default function Column({ column, tasks, onDeleteTask, onOpenTask, collapsed, onToggleCollapse, searchTerm }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const term = (searchTerm || "").trim().toLowerCase();

  return (
    <section
      ref={setNodeRef}
      className={`${styles.column} glass ${collapsed ? styles.collapsed : ""}`}
      data-over={isOver ? "true" : "false"}
      data-column-id={column.id}
    >
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h3>{column.title}</h3>
          <span>{tasks.length}</span>
        </div>
        <button
          type="button"
          className={styles.collapse}
          onClick={onToggleCollapse}
          aria-label={collapsed ? "\u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c" : "\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {collapsed ? (
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
      </header>
      <div className={styles.list} data-collapsed={collapsed ? "true" : "false"}>
        {tasks.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>{`${EMPTY_PREFIX} "${column.title}"`}</div>
            <div className={styles.emptyHint}>{EMPTY_HINT}</div>
          </div>
        ) : (
          tasks.map((task) => {
            const haystack = `${task.title || ""} ${task.description || ""}`.toLowerCase();
            const matches = term.length === 0 || haystack.includes(term);
            return (
              <SortableCard
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                onOpen={onOpenTask}
                dimmed={!matches}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

function SortableCard({ task, onDelete, onOpen, dimmed }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-dragging={isDragging ? "true" : "false"}
      data-dimmed={dimmed ? "true" : "false"}
      className={styles.cardWrap}
    >
      <TaskCard task={task} onDelete={onDelete} onOpen={onOpen} dimmed={dimmed} />
    </div>
  );
}
