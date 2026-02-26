import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api.js";
import DataTableView from "../components/DataTableView.jsx";
import styles from "./TableView.module.css";

const TEXT = {
  back: "← Назад",
  export: "Экспорт CSV",
  title: "Таблица",
  subtitle: "Интерактивная база без перезагрузки"
};

export default function TableView() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [snapshot, setSnapshot] = useState(() => ({ columns: [], rows: [] }));
  const [board, setBoard] = useState(null);

  useEffect(() => {
    if (!boardId) return;
    const load = async () => {
      try {
        const res = await api.get(`/boards/${boardId}/meta`);
        setBoard(res.data || null);
      } catch {
        setBoard(null);
      }
    };
    load();
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;
    try {
      const raw = localStorage.getItem(`gridlab-table:${boardId}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data?.columns && data?.rows) {
        setSnapshot({ columns: data.columns, rows: data.rows });
      }
    } catch {
      // ignore storage errors
    }
  }, [boardId]);

  const handleChange = (data) => {
    setSnapshot(data);
    if (!boardId) return;
    try {
      localStorage.setItem(`gridlab-table:${boardId}`, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  };

  const exportCsv = () => {
    const data = tableRef.current?.getData?.();
    if (!data?.columns?.length) return;
    const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const header = data.columns.map((c) => escapeCell(c.name));
    const lines = [header.join(",")];
    data.rows.forEach((row) => {
      const line = data.columns.map((col) => escapeCell(row.cells?.[col.id] ?? ""));
      lines.push(line.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `table-${boardId || "export"}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const goBack = () => {
    if (board?.workspace_id) {
      navigate(`/workspace/${board.workspace_id}`);
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.boardArea}>
          <div className={styles.topbar}>
            <div className={styles.topLeft}>
              <button className={styles.secondary} onClick={goBack}>
                {TEXT.back}
              </button>
              <button className={styles.primary} onClick={exportCsv}>
                {TEXT.export}
              </button>
            </div>
            <div className={styles.topCenter}>
              <h2>{board?.name || TEXT.title}</h2>
              <p className={styles.subtitle}>{TEXT.subtitle}</p>
            </div>
            <div className={styles.topRight} />
          </div>

          <section className={styles.sheetArea}>
            <DataTableView
              ref={tableRef}
              initialColumns={snapshot.columns}
              initialRows={snapshot.rows}
              onChange={handleChange}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
