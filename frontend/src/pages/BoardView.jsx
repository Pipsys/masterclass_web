import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api.js";
import KanbanBoard from "../components/KanbanBoard.jsx";
import useModalBodyClass from "../hooks/useModalBodyClass.js";
import styles from "./BoardView.module.css";

const TEXT = {
  back: "\u2190 \u041d\u0430\u0437\u0430\u0434",
  task: "+ \u0417\u0430\u0434\u0430\u0447\u0430",
  users: "\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0438",
  quickView: "\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u043e\u0431\u0437\u043e\u0440",
  close: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
  save: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",
  saving: "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435...",
  title: "\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a",
  description: "\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435",
  newTask: "\u041d\u043e\u0432\u0430\u044f \u0437\u0430\u0434\u0430\u0447\u0430",
  status: "\u0421\u0442\u0430\u0442\u0443\u0441",
  cancel: "\u041e\u0442\u043c\u0435\u043d\u0430",
  add: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c",
  noUsers: "\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u043e \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f\u0445",
  defaults: ["\u0421\u0434\u0435\u043b\u0430\u0442\u044c", "\u0412 \u0440\u0430\u0431\u043e\u0442\u0435", "\u0413\u043e\u0442\u043e\u0432\u043e"],
  done: "\u0413\u043e\u0442\u043e\u0432\u043e",
  progress: "\u0413\u043e\u0442\u043e\u0432\u043e {done} \u0438\u0437 {total} \u0437\u0430\u0434\u0430\u0447"
};

const SEARCH_PLACEHOLDER = String.fromCharCode(1055, 1086, 1080, 1089, 1082) + "...";

export default function BoardView() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [usersOpen, setUsersOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [query, setQuery] = useState("");
  useModalBodyClass(Boolean(selected || createOpen || usersOpen));

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [tasksRes, boardRes] = await Promise.all([
        api.get(`/tasks/?board_id=${boardId}`),
        api.get(`/boards/${boardId}/meta`)
      ]);
      setTasks(tasksRes.data);
      setBoard(boardRes.data);
      if (boardRes.data?.config?.length) {
        setNewStatus(boardRes.data.config[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshTasks = async () => {
    try {
      const tasksRes = await api.get(`/tasks/?board_id=${boardId}`);
      setTasks(tasksRes.data);
    } catch {
      // ignore background refresh errors
    }
  };

  useEffect(() => {
    loadInitial();
    const timer = setInterval(refreshTasks, 8000);
    return () => clearInterval(timer);
  }, [boardId]);

  useEffect(() => {
    if (!board?.config?.length) return;
    const fallback = board.config[0];
    const missing = tasks.filter((t) => !t.status);
    if (!missing.length) return;
    const updated = tasks.map((t) => (t.status ? t : { ...t, status: fallback }));
    setTasks(updated);
    missing.forEach((t) => api.put(`/tasks/${t.id}`, { status: fallback }));
  }, [board, tasks]);

  useEffect(() => {
    if (query.includes("\\u")) {
      setQuery(decodeUnicodeEscapes(query));
    }
  }, [query]);

  const columns = useMemo(() => {
    const list = board?.config?.length ? board.config : TEXT.defaults;
    return list.map((title) => ({ id: title, title }));
  }, [board]);

  const doneColumnId = useMemo(() => {
    const keyword = TEXT.done.toLowerCase();
    const match = columns.find((col) => col.title.toLowerCase().includes(keyword));
    if (match) return match.id;
    return columns.length ? columns[columns.length - 1].id : null;
  }, [columns]);

  const totalTasks = tasks.length;
  const doneTasks = doneColumnId ? tasks.filter((t) => t.status === doneColumnId).length : 0;
  const progressText = TEXT.progress.replace("{done}", String(doneTasks)).replace("{total}", String(totalTasks));

  const openTask = (task) => {
    setSelected(task);
    setDraftTitle(task.title || "");
    setDraftDescription(task.description || "");
  };

  const closeModal = () => {
    setSelected(null);
  };

  const saveTask = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.put(`/tasks/${selected.id}`, {
        title: draftTitle,
        description: draftDescription
      });
      setTasks((prev) => prev.map((t) => (t.id === selected.id ? res.data : t)));
      setSelected(res.data);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const position = tasks.filter((t) => t.status === newStatus).length;
    const res = await api.post("/tasks/", {
      board_id: Number(boardId),
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      status: newStatus,
      position
    });
    setTasks((prev) => [...prev, res.data]);
    setNewTitle("");
    setNewDescription("");
    setCreateOpen(false);
  };

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const nextStatus = resolveStatus(over.id, tasks, columns);
    const moved = tasks.find((t) => t.id === active.id);
    const wasDone = doneColumnId && moved?.status === doneColumnId;
    const next = reorderTasks(tasks, active.id, over.id, nextStatus, columns);
    setTasks(next);

    const items = buildReorderItems(next, columns);
    try {
      await api.put(`/boards/${boardId}/tasks/reorder`, { items });
    } catch {
      refreshTasks();
    }

    if (doneColumnId && nextStatus === doneColumnId && !wasDone) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1200);
    }
  };

  const rawUsers = board?.users || board?.members || [];
  const users = Array.isArray(rawUsers) ? rawUsers : [];

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.boardArea}>
          <div className={styles.topbar}>
            <div className={styles.topLeft}>
              <button
                className={styles.secondary}
                onClick={() => navigate(board?.workspace_id ? `/workspace/${board.workspace_id}` : "/dashboard")}
              >
                {TEXT.back}
              </button>
              <button className={styles.primary} onClick={() => setCreateOpen(true)}>
                {TEXT.task}
              </button>
              <button className={styles.secondary} onClick={() => setUsersOpen(true)}>
                {TEXT.users}
              </button>
            </div>
            <div className={styles.topCenter}>
              <h2>{board?.name || "\u041f\u0440\u043e\u0435\u043a\u0442"}</h2>
            </div>
            <div className={styles.topRight}>
              <input
                className={styles.search}
                value={query}
                onChange={(e) => setQuery(decodeUnicodeEscapes(e.target.value))}
                placeholder={SEARCH_PLACEHOLDER}
              />
            </div>
          </div>
          <div className={styles.progressWrap}>
            <div className={styles.progressBar} aria-hidden="true">
              {totalTasks === 0 ? (
                <div className={styles.progressEmpty} />
              ) : (
                columns.map((col) => {
                  const count = tasks.filter((t) => t.status === col.id).length;
                  const flex = count > 0 ? count : 0.5;
                  return (
                    <div
                      key={col.id}
                      className={styles.progressSegment}
                      style={{ flexGrow: flex, backgroundColor: colorFromStatus(col.id) }}
                      title={`${col.title}: ${count}`}
                    />
                  );
                })
              )}
            </div>
            <div className={styles.progressMeta}>{progressText}</div>
          </div>
          {celebrate && <div className={styles.confetti} />}

          {loading ? (
            <div className={styles.skeletonBoard}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className={styles.skeletonColumn}>
                  <div className={styles.skeletonHeader} />
                  <div className={styles.skeletonCard} />
                  <div className={styles.skeletonCard} />
                  <div className={styles.skeletonCardSm} />
                </div>
              ))}
            </div>
          ) : (
            <KanbanBoard
              columns={columns}
              tasks={tasks}
              onDeleteTask={(id) => api.delete(`/tasks/${id}`).then(() => setTasks((prev) => prev.filter((t) => t.id !== id)))}
              onOpenTask={openTask}
              onDragEnd={onDragEnd}
              searchTerm={query}
            />
          )}
        </div>
      </div>

      {selected && <div className={styles.modalBackdrop} onClick={closeModal} />}
      <div className={`${styles.modal} ${selected ? styles.modalOpen : ""}`}>
        <div className={styles.modalHeader}>
          <h3>{TEXT.quickView}</h3>
          <button className={styles.iconButton} onClick={closeModal} aria-label={TEXT.close}>x</button>
        </div>
        <div className={styles.modalBody}>
          <label>
            {TEXT.title}
            <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
          </label>
          <label>
            {TEXT.description}
            <textarea value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} rows={6} />
          </label>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.secondary} onClick={closeModal}>{TEXT.close}</button>
          <button className={styles.primary} onClick={saveTask} disabled={saving}>
            {saving ? TEXT.saving : TEXT.save}
          </button>
        </div>
      </div>

      {createOpen && <div className={styles.modalBackdrop} onClick={() => setCreateOpen(false)} />}
      <div className={`${styles.modal} ${createOpen ? styles.modalOpen : ""}`}>
        <div className={styles.modalHeader}>
          <h3>{TEXT.newTask}</h3>
          <button className={styles.iconButton} onClick={() => setCreateOpen(false)} aria-label={TEXT.close}>x</button>
        </div>
        <div className={styles.modalBody}>
          <label>
            {TEXT.title}
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          </label>
          <label>
            {TEXT.description}
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={4} />
          </label>
          <label>
            {TEXT.status}
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.secondary} onClick={() => setCreateOpen(false)}>{TEXT.cancel}</button>
          <button className={styles.primary} onClick={handleCreate}>{TEXT.add}</button>
        </div>
      </div>

      {usersOpen && <div className={styles.modalBackdrop} onClick={() => setUsersOpen(false)} />}
      <div className={`${styles.modal} ${usersOpen ? styles.modalOpen : ""}`}>
        <div className={styles.modalHeader}>
          <h3>{TEXT.users}</h3>
          <button className={styles.iconButton} onClick={() => setUsersOpen(false)} aria-label={TEXT.close}>x</button>
        </div>
        <div className={styles.modalBody}>
          {users.length ? (
            <div className={styles.userList}>
              {users.map((user, idx) => {
                const name = typeof user === "string" ? user : (user.username || user.email || `User ${idx + 1}`);
                const meta = typeof user === "string" ? "" : (user.email || "");
                const initials = name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();

                return (
                  <div key={`${name}-${idx}`} className={styles.userRow}>
                    <div className={styles.userAvatar}>{initials || "U"}</div>
                    <div className={styles.userText}>
                      <div className={styles.userName}>{name}</div>
                      {meta && <div className={styles.userMeta}>{meta}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyUsers}>{TEXT.noUsers}</div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.secondary} onClick={() => setUsersOpen(false)}>{TEXT.close}</button>
        </div>
      </div>
    </div>
  );
}

function resolveStatus(overId, tasks, columns) {
  const column = columns.find((c) => c.id === overId);
  if (column) return column.id;
  const task = tasks.find((t) => t.id === overId);
  return task?.status;
}

function reorderTasks(items, activeId, overId, nextStatus, columns) {
  const byStatus = new Map();
  columns.forEach((c) => byStatus.set(c.id, items.filter((t) => t.status === c.id)));

  const activeTask = items.find((t) => t.id === activeId);
  if (!activeTask) return items;

  const fromStatus = activeTask.status;
  const targetStatus = nextStatus || fromStatus;

  const fromList = byStatus.get(fromStatus) || [];
  const toList = byStatus.get(targetStatus) || [];

  const removeIndex = fromList.findIndex((t) => t.id === activeId);
  if (removeIndex >= 0) fromList.splice(removeIndex, 1);

  const overTask = items.find((t) => t.id === overId);
  if (overTask && overTask.status === targetStatus) {
    const insertIndex = toList.findIndex((t) => t.id === overId);
    toList.splice(insertIndex < 0 ? toList.length : insertIndex, 0, { ...activeTask, status: targetStatus });
  } else {
    toList.push({ ...activeTask, status: targetStatus });
  }

  byStatus.set(fromStatus, fromList);
  byStatus.set(targetStatus, toList);

  const next = [];
  columns.forEach((c) => {
    const colTasks = byStatus.get(c.id) || [];
    colTasks.forEach((t) => next.push(t));
  });
  return next;
}

function buildReorderItems(items, columns) {
  const result = [];
  columns.forEach((c) => {
    const colTasks = items.filter((t) => t.status === c.id);
    colTasks.forEach((task, idx) => {
      result.push({ task_id: task.id, status: c.id, position: idx });
    });
  });
  return result;
}

function decodeUnicodeEscapes(value) {
  const withSlashes = value.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );
  return withSlashes.replace(/\bu([0-9a-fA-F]{4})\b/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );
}

const ACCENT_COLORS = [
  "#61D16E",
  "#34C759",
  "#9BE47A",
  "#4BBF7A",
  "#7FE28C",
  "#58C56B"
];

function colorFromStatus(status) {
  if (!status) return ACCENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < status.length; i += 1) {
    hash = (hash * 31 + status.charCodeAt(i)) % 997;
  }
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
}
