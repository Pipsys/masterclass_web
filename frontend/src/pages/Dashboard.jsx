import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import WorkspaceCreator from "../components/WorkspaceCreator.jsx";
import useModalBodyClass from "../hooks/useModalBodyClass.js";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showCreator, setShowCreator] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [editingNames, setEditingNames] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [typedTip, setTypedTip] = useState("");
  useModalBodyClass(Boolean(confirmDelete));
  const navigate = useNavigate();

  const tips = useMemo(
    () => [
      "Планируйте задачи на день и фиксируйте 1–2 главных приоритета.",
      "Делите большие задачи на короткие шаги — прогресс видно быстрее.",
      "Используйте теги и статусы, чтобы не терять контекст.",
      "Ставьте дедлайны только там, где они действительно нужны.",
      "Регулярно пересматривайте активные задачи и очищайте список.",
      "Документируйте решения рядом с задачами — меньше вопросов позже.",
      "Ограничьте количество активных задач, чтобы не распыляться.",
      "Проверяйте доску в начале и в конце дня — это держит фокус."
    ],
    []
  );

  const load = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
      setLoadError("");
    }
    try {
      const res = await api.get("/workspaces/");
      setWorkspaces(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      if (!silent) {
        const message = error?.response?.data?.detail || "Не удалось загрузить рабочие пространства.";
        setLoadError(message);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const res = await api.get("/workspaces/");
        if (!isMounted) return;
        setWorkspaces(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        if (!isMounted) return;
        const message = error?.response?.data?.detail || "Не удалось загрузить рабочие пространства.";
        setLoadError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let typingTimeout;
    let cycleTimeout;
    const fullText = tips[tipIndex % tips.length];
    const cycleMs = 30000;

    setTypedTip("");

    const typeNext = (i) => {
      if (i <= fullText.length) {
        setTypedTip(fullText.slice(0, i));
        typingTimeout = setTimeout(() => typeNext(i + 1), 32);
      } else {
        const remaining = Math.max(cycleMs - fullText.length * 32, 1500);
        cycleTimeout = setTimeout(
          () => setTipIndex((prev) => (prev + 1) % tips.length),
          remaining
        );
      }
    };

    typeNext(0);

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(cycleTimeout);
    };
  }, [tipIndex, tips]);

  useEffect(() => {
    if (workspaces.length === 0 && (editMode || deleteMode)) {
      setEditMode(false);
      setDeleteMode(false);
      setConfirmDelete(null);
      setEditingNames({});
    }
  }, [workspaces.length, editMode, deleteMode]);

  const createWorkspace = async (payload) => {
    await api.post("/workspaces/", payload);
    await load();
  };

  const handleSaveName = async (ws) => {
    const nextName = (editingNames[ws.id] ?? ws.name).trim();
    if (!nextName || nextName === ws.name) return;
    await api.put(`/workspaces/${ws.id}`, {
      name: nextName,
      description: ws.description
    });
    await load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await api.delete(`/workspaces/${confirmDelete.id}`);
    setConfirmDelete(null);
    await load();
  };

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
    setDeleteMode(false);
  };

  const toggleDeleteMode = () => {
    setDeleteMode((prev) => !prev);
    setEditMode(false);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingNames({});
  };

  const cancelDelete = () => {
    setDeleteMode(false);
    setConfirmDelete(null);
  };

  return (
    <div className={styles.page}>
      <aside className={`${styles.side} glass`}>
        <h3>Быстрые действия</h3>
        <button className={styles.sideButton} onClick={() => setShowCreator(true)}>
          Создать пространство
        </button>
        <button className={styles.sideButton} onClick={toggleEditMode}>
          Редактировать пространства
        </button>
        <button className={styles.sideButton} onClick={toggleDeleteMode}>
          Удалить пространства
        </button>
        <button className={styles.sideButton} onClick={() => navigate("/profile")}>
          Настройки
        </button>
        <div className={styles.sideHint}>
          <p className={styles.tipLine}>
            {typedTip}
            <span className={styles.tipCursor} aria-hidden="true">|</span>
          </p>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.header}>
          <h2>Рабочие пространства</h2>
          <div className={styles.headerActions}>
            {(editMode || deleteMode) && (
              <button
                className={styles.cancelButton}
                onClick={editMode ? cancelEdit : cancelDelete}
              >
                Отмена
              </button>
            )}
          </div>
        </div>
        {isLoading && <div className={`${styles.statusBox} glass`}>Загрузка рабочих пространств...</div>}
        {!isLoading && loadError && (
          <div className={`${styles.statusBox} ${styles.statusError} glass`}>
            <p>{loadError}</p>
            <button className={styles.sideButton} onClick={() => load()}>Повторить</button>
          </div>
        )}
        <div className={styles.grid}>
          {!isLoading && !loadError && workspaces.map((ws) => (
            <div
              key={ws.id}
              className={`${styles.card} glass ${editMode ? styles.cardEditMode : ""} ${deleteMode ? styles.cardDeleteMode : ""}`}
              onClick={() => (!editMode && !deleteMode) && navigate(`/workspace/${ws.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (!editMode && !deleteMode) && e.key === "Enter" && navigate(`/workspace/${ws.id}`)}
            >
              {editMode ? (
                <div className={styles.editRow}>
                  <input
                    className={styles.nameInput}
                    value={editingNames[ws.id] ?? ws.name}
                    onChange={(e) => setEditingNames((prev) => ({ ...prev, [ws.id]: e.target.value }))}
                  />
                  <button className={styles.saveButton} onClick={() => handleSaveName(ws)}>Сохранить</button>
                </div>
              ) : (
                <h3>{ws.name}</h3>
              )}
              <p>{ws.description}</p>
              {deleteMode && (
                <button className={styles.deleteButton} onClick={() => setConfirmDelete(ws)}>
                  Удалить
                </button>
              )}
            </div>
          ))}
          {!isLoading && !loadError && (!editMode && (!deleteMode || workspaces.length === 0)) && (
            <button
              type="button"
              className={styles.createCard}
              onClick={() => setShowCreator(true)}
              aria-label="Добавить пространство"
            >
              <span className={styles.createIcon}>+</span>
              <span className={styles.createText}>Добавить пространство</span>
            </button>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className={styles.confirmBackdrop} onClick={() => setConfirmDelete(null)}>
          <div className={`${styles.confirmModal} glass`} onClick={(e) => e.stopPropagation()}>
            <h3>Удалить пространство?</h3>
            <p>"{confirmDelete.name}" будет удалено без возможности восстановления.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelButton} onClick={() => setConfirmDelete(null)}>Отмена</button>
              <button className={styles.dangerButton} onClick={handleDelete}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      <WorkspaceCreator
        open={showCreator}
        onClose={() => setShowCreator(false)}
        onCreate={createWorkspace}
      />
    </div>
  );
}
