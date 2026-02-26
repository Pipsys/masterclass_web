import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api.js";
import WorkspaceEditor from "../components/WorkspaceEditor.jsx";
import useModalBodyClass from "../hooks/useModalBodyClass.js";
import styles from "./Workspace.module.css";

export default function Workspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showBoardCreate, setShowBoardCreate] = useState(false);
  const [showTableCreate, setShowTableCreate] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [boardName, setBoardName] = useState("");
  const [tableName, setTableName] = useState("");
  const [editName, setEditName] = useState("");
  useModalBodyClass(Boolean(showBoardCreate || showTableCreate || editTarget || deleteTarget || showEditor));

  const load = async () => {
    const [boardsRes, workspaceRes] = await Promise.all([
      api.get(`/boards/${workspaceId}/`),
      api.get(`/workspaces/${workspaceId}`)
    ]);
    setBoards(boardsRes.data);
    setWorkspace(workspaceRes.data);
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  useEffect(() => {
    if (!activeMenu) return;
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [activeMenu]);

  const kanbanBoards = boards.filter((b) => b.type === "kanban");
  const tableBoards = boards.filter((b) => b.type === "table");

  const createBoardWithType = async ({ name, type }) => {
    const fallback = type === "table" ? "Новая таблица" : "Новая доска";
    const payloadName = (name || fallback).trim() || fallback;
    const res = await api.post("/boards/", {
      workspace_id: Number(workspaceId),
      name: payloadName,
      type,
      config: type === "kanban" ? ["Сделать", "В работе", "Готово"] : null
    });
    await load();
    return res.data;
  };

  const openCreateBoardModal = () => {
    setBoardName("");
    setShowBoardCreate(true);
  };

  const openCreateTableModal = () => {
    setTableName("");
    setShowTableCreate(true);
  };

  const saveObjectName = async () => {
    if (!editTarget) return;
    const nextName = editName.trim();
    if (!nextName) return;
    await api.put(`/boards/${editTarget.id}`, { name: nextName });
    setEditTarget(null);
    await load();
  };

  const deleteObject = async () => {
    if (!deleteTarget) return;
    await api.delete(`/boards/${deleteTarget.id}`);
    setDeleteTarget(null);
    setActiveMenu(null);
    await load();
  };

  const openEditObject = (item) => {
    setEditTarget(item);
    setEditName(item.name || "");
    setActiveMenu(null);
  };

  const openDeleteObject = (item) => {
    setDeleteTarget(item);
    setActiveMenu(null);
  };

  const toggleMenu = (event, key) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveMenu((prev) => (prev === key ? null : key));
  };

  const saveWorkspace = async (payload) => {
    await api.put(`/workspaces/${workspaceId}`, payload);
    await load();
  };

  return (
    <div className={styles.page}>
      <aside className={`${styles.side} glass`}>
        <button className={styles.backLink} onClick={() => navigate("/dashboard")}>
          ← Ко всем пространствам
        </button>
        <div className={styles.sideTitle}>
          <h2>{workspace?.name || `Пространство #${workspaceId}`}</h2>
          {workspace?.description && <p>{workspace.description}</p>}
        </div>
        <div className={styles.sideGroup}>
          <button className={styles.sideButton} onClick={openCreateBoardModal}>Новая доска</button>
          <button className={styles.sideButton} onClick={openCreateTableModal}>Новая таблица</button>
          <button className={styles.sideButton} onClick={() => navigate(`/workspace/${workspaceId}/users`)}>
            Пользователи
          </button>
          <button className={styles.sideButton} onClick={() => setShowEditor(true)}>
            Настройки
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <section className={`${styles.section} ${styles.sectionKanban}`}>
          <div className={styles.grid}>
            {kanbanBoards.length === 0 && (
              <div className={`${styles.emptyCard} glass`}>
                <p>Пока нет досок.</p>
                <button className={styles.primary} onClick={openCreateBoardModal}>Новая доска</button>
              </div>
            )}
            {kanbanBoards.map((b) => (
              <div key={b.id} className={styles.cardShell}>
                <Link className={`${styles.card} ${styles.kanbanCard} glass`} to={`/board/${b.id}`}>
                  <div className={styles.cardHeader}>
                    <h4>{b.name}</h4>
                    <span className={`${styles.typeTag} ${styles.kanbanTag}`}>Kanban</span>
                  </div>
                  <div className={styles.cardIcon} aria-hidden="true">
                    <svg viewBox="0 0 64 64">
                      <rect x="6" y="10" width="52" height="44" rx="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <rect x="14" y="20" width="12" height="10" rx="2" fill="currentColor" opacity="0.7"/>
                      <rect x="30" y="20" width="12" height="18" rx="2" fill="currentColor" opacity="0.5"/>
                      <rect x="46" y="20" width="8" height="26" rx="2" fill="currentColor" opacity="0.35"/>
                      <rect x="14" y="34" width="12" height="12" rx="2" fill="currentColor" opacity="0.4"/>
                    </svg>
                  </div>
                </Link>
                <button className={styles.menuButton} onClick={(e) => toggleMenu(e, `board-${b.id}`)} aria-label="Управление объектом">
                  ...
                </button>
                {activeMenu === `board-${b.id}` && (
                  <div className={`${styles.menuPopover} glass`} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.menuItem} onClick={() => openEditObject(b)}>Редактировать</button>
                    <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => openDeleteObject(b)}>
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionTable}`}>
          <div className={styles.grid}>
            {tableBoards.length === 0 && (
              <div className={`${styles.emptyCard} glass`}>
                <p>Пока нет таблиц.</p>
                <button className={styles.primary} onClick={openCreateTableModal}>Создать таблицу</button>
              </div>
            )}
            {tableBoards.map((t) => (
              <div key={t.id} className={styles.cardShell}>
                <Link className={`${styles.card} ${styles.tableCard} glass`} to={`/table/${t.id}`}>
                  <div className={styles.cardHeader}>
                    <h4>{t.name}</h4>
                    <span className={`${styles.typeTag} ${styles.tableTag}`}>Таблица</span>
                  </div>
                  <div className={styles.cardIcon} aria-hidden="true">
                    <svg viewBox="0 0 64 64">
                      <rect x="8" y="12" width="48" height="40" rx="6" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <line x1="8" y1="26" x2="56" y2="26" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
                      <line x1="8" y1="38" x2="56" y2="38" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                      <line x1="24" y1="12" x2="24" y2="52" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
                      <line x1="40" y1="12" x2="40" y2="52" stroke="currentColor" strokeWidth="2" opacity="0.35"/>
                    </svg>
                  </div>
                </Link>
                <button className={styles.menuButton} onClick={(e) => toggleMenu(e, `table-${t.id}`)} aria-label="Управление объектом">
                  ...
                </button>
                {activeMenu === `table-${t.id}` && (
                  <div className={`${styles.menuPopover} glass`} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.menuItem} onClick={() => openEditObject(t)}>Редактировать</button>
                    <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => openDeleteObject(t)}>
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {showBoardCreate && (
        <div className={styles.confirmBackdrop} onClick={() => setShowBoardCreate(false)}>
          <div className={`${styles.confirmModal} glass`} onClick={(e) => e.stopPropagation()}>
            <h3>Новая доска</h3>
            <input
              className={styles.modalInput}
              placeholder="Название доски"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
            />
            <div className={styles.confirmActions}>
              <button className={styles.secondary} onClick={() => setShowBoardCreate(false)}>Отмена</button>
              <button
                className={styles.primary}
                onClick={async () => {
                  await createBoardWithType({ name: boardName, type: "kanban" });
                  setShowBoardCreate(false);
                }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {showTableCreate && (
        <div className={styles.confirmBackdrop} onClick={() => setShowTableCreate(false)}>
          <div className={`${styles.confirmModal} glass`} onClick={(e) => e.stopPropagation()}>
            <h3>Новая таблица</h3>
            <input
              className={styles.modalInput}
              placeholder="Название таблицы"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
            />
            <div className={styles.confirmActions}>
              <button className={styles.secondary} onClick={() => setShowTableCreate(false)}>Отмена</button>
              <button
                className={styles.primary}
                onClick={async () => {
                  await createBoardWithType({ name: tableName, type: "table" });
                  setShowTableCreate(false);
                }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <div className={styles.confirmBackdrop} onClick={() => setEditTarget(null)}>
          <div className={`${styles.confirmModal} glass`} onClick={(e) => e.stopPropagation()}>
            <h3>{editTarget.type === "table" ? "Редактировать таблицу" : "Редактировать доску"}</h3>
            <input
              className={styles.modalInput}
              placeholder="Новое название"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className={styles.confirmActions}>
              <button className={styles.secondary} onClick={() => setEditTarget(null)}>Отмена</button>
              <button className={styles.primary} onClick={saveObjectName}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.confirmBackdrop} onClick={() => setDeleteTarget(null)}>
          <div className={`${styles.confirmModal} glass`} onClick={(e) => e.stopPropagation()}>
            <h3>{deleteTarget.type === "table" ? "Удалить таблицу?" : "Удалить доску?"}</h3>
            <p>"{deleteTarget.name}" будет удалено без возможности восстановления.</p>
            <div className={styles.confirmActions}>
              <button className={styles.secondary} onClick={() => setDeleteTarget(null)}>Отмена</button>
              <button className={styles.danger} onClick={deleteObject}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      <WorkspaceEditor
        open={showEditor}
        initial={workspace}
        onClose={() => setShowEditor(false)}
        onSave={saveWorkspace}
      />
    </div>
  );
}

