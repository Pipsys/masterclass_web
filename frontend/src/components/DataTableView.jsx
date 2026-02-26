import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import styles from "./DataTableView.module.css";

const makeId = () => Math.random().toString(36).slice(2, 10);

const createColumn = (index) => ({
  id: makeId(),
  name: `Колонка ${index + 1}`,
  width: 180
});

const createRow = () => ({
  id: makeId(),
  height: 40,
  cells: {}
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeText = (value) => (value == null ? "" : String(value));

const DataTableView = forwardRef(function DataTableView(
  { initialColumns = [], initialRows = [], onChange },
  ref
) {
  const [columns, setColumns] = useState(() =>
    initialColumns.length ? initialColumns : [createColumn(0), createColumn(1), createColumn(2)]
  );
  const [rows, setRows] = useState(() =>
    initialRows.length ? initialRows : Array(15).fill(null).map(() => createRow())
  );
  const [activeCell, setActiveCell] = useState({ r: 0, c: 0 });
  const [editing, setEditing] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const [selection, setSelection] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const tableRef = useRef(null);
  const resizeRef = useRef(null);
  const historyRef = useRef({ items: [], index: -1 });
  const didInitRef = useRef(false);
  const editInputRef = useRef(null);

  const rowCount = rows.length;
  const colCount = columns.length;

  useImperativeHandle(ref, () => ({
    getData: () => ({ columns, rows }),
    addColumn: () => addColumn(),
    addRow: () => addRow()
  }));

  useEffect(() => {
    if (didInitRef.current) return;
    if (initialColumns.length || initialRows.length) {
      setColumns(initialColumns.length ? initialColumns : [createColumn(0), createColumn(1), createColumn(2)]);
      setRows(initialRows.length ? initialRows : Array(15).fill(null).map(() => createRow()));
      didInitRef.current = true;
    }
  }, [initialColumns, initialRows]);

  useEffect(() => {
    onChange?.({ columns, rows });
  }, [columns, rows, onChange]);

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editing]);

  const pushHistory = () => {
    const snapshot = {
      columns: columns.map((c) => ({ ...c })),
      rows: rows.map((r) => ({ ...r, cells: { ...r.cells } }))
    };
    const history = historyRef.current;
    history.items = history.items.slice(0, history.index + 1);
    history.items.push(snapshot);
    history.index += 1;
    if (history.items.length > 50) {
      history.items.shift();
      history.index -= 1;
    }
  };

  const applyHistory = (direction) => {
    const history = historyRef.current;
    const nextIndex = history.index + direction;
    if (nextIndex < 0 || nextIndex >= history.items.length) return;
    history.index = nextIndex;
    const snapshot = history.items[history.index];
    setColumns(snapshot.columns.map((c) => ({ ...c })));
    setRows(snapshot.rows.map((r) => ({ ...r, cells: { ...r.cells } })));
  };

  const addColumn = () => {
    pushHistory();
    setColumns((prev) => [...prev, createColumn(prev.length)]);
  };

  const addRow = () => {
    pushHistory();
    setRows((prev) => [...prev, createRow()]);
  };

  const deleteColumn = (colIndex) => {
    if (colCount <= 1) return;
    pushHistory();
    const colId = columns[colIndex].id;
    setColumns((prev) => prev.filter((_, idx) => idx !== colIndex));
    setRows((prev) =>
      prev.map((row) => {
        const nextCells = { ...row.cells };
        delete nextCells[colId];
        return { ...row, cells: nextCells };
      })
    );
    setActiveCell((prev) => ({
      r: prev.r,
      c: Math.min(prev.c, colCount - 2)
    }));
  };

  const deleteRow = (rowIndex) => {
    if (rowCount <= 1) return;
    pushHistory();
    setRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
    setActiveCell((prev) => ({
      r: Math.min(prev.r, rowCount - 2),
      c: prev.c
    }));
  };

  const startEdit = (type, rowIndex, colIndex) => {
    if (type === "cell") {
      const col = columns[colIndex];
      const row = rows[rowIndex];
      if (!col || !row) return;
      const value = row.cells[col.id];
      setDraftValue(normalizeText(value));
      setEditing({ type, rowIndex, colIndex });
      return;
    }
    if (type === "header") {
      const col = columns[colIndex];
      if (!col) return;
      setDraftValue(col.name);
      setEditing({ type, colIndex });
    }
  };

  const commitEdit = () => {
    if (!editing) return;
    pushHistory();
    if (editing.type === "cell") {
      const { rowIndex, colIndex } = editing;
      const col = columns[colIndex];
      setRows((prev) =>
        prev.map((row, idx) => {
          if (idx !== rowIndex || !col) return row;
          return {
            ...row,
            cells: { ...row.cells, [col.id]: draftValue }
          };
        })
      );
    }
    if (editing.type === "header") {
      const { colIndex } = editing;
      setColumns((prev) =>
        prev.map((col, idx) =>
          idx === colIndex ? { ...col, name: draftValue || col.name } : col
        )
      );
    }
    setEditing(null);
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && !editing) {
      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        applyHistory(-1);
        return;
      }
      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        applyHistory(1);
        return;
      }
      if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        applyHistory(1);
        return;
      }
    }

    if (editing) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        commitEdit();
        if (editing.type === "cell") {
          setActiveCell((prev) => ({
            r: Math.min(prev.r + 1, rowCount - 1),
            c: prev.c
          }));
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEdit();
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      startEdit("cell", activeCell.r, activeCell.c);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const dir = event.shiftKey ? -1 : 1;
      let nextC = activeCell.c + dir;
      let nextR = activeCell.r;
      if (nextC >= colCount) {
        nextC = 0;
        nextR = Math.min(activeCell.r + 1, rowCount - 1);
      }
      if (nextC < 0) {
        nextC = colCount - 1;
        nextR = Math.max(activeCell.r - 1, 0);
      }
      setActiveCell({ r: nextR, c: nextC });
      return;
    }

    const moves = {
      ArrowDown: [1, 0],
      ArrowUp: [-1, 0],
      ArrowRight: [0, 1],
      ArrowLeft: [0, -1]
    };
    if (moves[event.key]) {
      event.preventDefault();
      const [dr, dc] = moves[event.key];
      setActiveCell((prev) => ({
        r: clamp(prev.r + dr, 0, rowCount - 1),
        c: clamp(prev.c + dc, 0, colCount - 1)
      }));
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      if (!editing) {
        event.preventDefault();
        pushHistory();
        const col = columns[activeCell.c];
        setRows((prev) =>
          prev.map((row, idx) => {
            if (idx !== activeCell.r) return row;
            const nextCells = { ...row.cells };
            delete nextCells[col.id];
            return { ...row, cells: nextCells };
          })
        );
      }
    }

    if (!editing && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      setDraftValue(event.key);
      setEditing({ type: "cell", rowIndex: activeCell.r, colIndex: activeCell.c });
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    setActiveCell({ r: rowIndex, c: colIndex });
    setSelection({ r1: rowIndex, c1: colIndex, r2: rowIndex, c2: colIndex });
  };

  const handleMouseDown = (rowIndex, colIndex) => {
    setSelection({ r1: rowIndex, c1: colIndex, r2: rowIndex, c2: colIndex });
  };

  const handleMouseEnter = (rowIndex, colIndex, isDragging) => {
    if (!isDragging) return;
    setSelection((prev) =>
      prev ? { ...prev, r2: rowIndex, c2: colIndex } : prev
    );
  };

  const handleContextMenu = (event, type, index) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type,
      index
    });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleContextMenuGlobal = (e) => {
      if (!e.target.closest(`.${styles.contextMenu}`)) {
        setContextMenu(null);
      }
    };
    window.addEventListener("click", handleClick);
    window.addEventListener("contextmenu", handleContextMenuGlobal);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("contextmenu", handleContextMenuGlobal);
    };
  }, []);

  useEffect(() => {
    const onMove = (event) => {
      if (!resizeRef.current) return;
      const { type, index, startX, startY, startSize } = resizeRef.current;
      if (type === "col") {
        const next = Math.max(120, startSize + (event.clientX - startX));
        setColumns((prev) =>
          prev.map((col, idx) => (idx === index ? { ...col, width: next } : col))
        );
      }
      if (type === "row") {
        const next = Math.max(32, startSize + (event.clientY - startY));
        setRows((prev) =>
          prev.map((row, idx) => (idx === index ? { ...row, height: next } : row))
        );
      }
    };

    const onUp = () => {
      if (resizeRef.current) {
        resizeRef.current = null;
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const selectionArea = useMemo(() => {
    if (!selection) return null;
    const r1 = Math.min(selection.r1, selection.r2);
    const r2 = Math.max(selection.r1, selection.r2);
    const c1 = Math.min(selection.c1, selection.c2);
    const c2 = Math.max(selection.c1, selection.c2);
    return { r1, r2, c1, c2 };
  }, [selection]);

  return (
    <div className={styles.wrap} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className={styles.toolbar}>
        <button className={styles.primaryButton} type="button" onClick={addColumn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          + Колонка
        </button>
        <button className={styles.primaryButton} type="button" onClick={addRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          + Строка
        </button>
        <div className={styles.divider} />
        <div className={styles.info}>
          <span className={styles.badge}>{rowCount} строк</span>
          <span className={styles.badge}>{colCount} колонок</span>
        </div>
        <div className={styles.spacer} />
        <div className={styles.cellInfo}>
          {activeCell && (
            <>
              <span className={styles.cellLabel}>Активно:</span>
              <span className={styles.cellAddress}>
                {columns[activeCell.c]?.name || "?"} ? Строка {activeCell.r + 1}
              </span>
            </>
          )}
        </div>
      </div>

      <div className={styles.tableScroller} ref={tableRef}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rowHeaderCorner}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </th>
              {columns.map((col, colIndex) => (
                <th
                  key={col.id}
                  className={styles.headerCell}
                  style={{ width: col.width }}
                  onDoubleClick={() => startEdit("header", 0, colIndex)}
                  onContextMenu={(e) => handleContextMenu(e, "column", colIndex)}
                >
                  <div className={styles.headerInner}>
                    {editing?.type === "header" && editing.colIndex === colIndex ? (
                      <input
                        ref={editInputRef}
                        className={styles.headerInput}
                        value={draftValue}
                        onChange={(e) => setDraftValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        onBlur={commitEdit}
                      />
                    ) : (
                      <>
                        <span className={styles.headerText}>{col.name}</span>
                        {colCount > 1 && (
                          <button
                            className={`${styles.deleteButton} ${styles.colDelete}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteColumn(colIndex);
                            }}
                            title="Удалить колонку"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <span
                    className={styles.colResize}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      resizeRef.current = {
                        type: "col",
                        index: colIndex,
                        startX: event.clientX,
                        startSize: col.width
                      };
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id} style={{ height: row.height }}>
                <th
                  className={styles.rowHeader}
                  onContextMenu={(e) => handleContextMenu(e, "row", rowIndex)}
                >
                  <div className={styles.rowHeaderInner}>
                    <span className={styles.rowNumber}>{rowIndex + 1}</span>
                    {rowCount > 1 && (
                      <button
                        className={`${styles.deleteButton} ${styles.rowDelete}`}
                        type="button"
                        onClick={() => deleteRow(rowIndex)}
                        title="Удалить строку"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <span
                    className={styles.rowResize}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      resizeRef.current = {
                        type: "row",
                        index: rowIndex,
                        startY: event.clientY,
                        startSize: row.height
                      };
                    }}
                  />
                </th>
                {columns.map((col, colIndex) => {
                  const value = row.cells[col.id] ?? "";
                  const isActive = activeCell.r === rowIndex && activeCell.c === colIndex;
                  const isSelected =
                    selectionArea &&
                    rowIndex >= selectionArea.r1 &&
                    rowIndex <= selectionArea.r2 &&
                    colIndex >= selectionArea.c1 &&
                    colIndex <= selectionArea.c2;

                  return (
                    <td
                      key={`${row.id}-${col.id}`}
                      className={`${styles.cell} ${isSelected ? styles.selected : ""} ${
                        isActive ? styles.active : ""
                      }`}
                      onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                      onMouseEnter={(event) =>
                        handleMouseEnter(rowIndex, colIndex, event.buttons === 1)
                      }
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      onDoubleClick={() => startEdit("cell", rowIndex, colIndex)}
                    >
                      {editing?.type === "cell" &&
                      editing.rowIndex === rowIndex &&
                      editing.colIndex === colIndex ? (
                        <input
                          ref={editInputRef}
                          className={styles.cellInput}
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) commitEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          onBlur={commitEdit}
                        />
                      ) : (
                        <span className={styles.cellText}>{normalizeText(value)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === "column" && (
            <>
              <button
                className={styles.contextMenuItem}
                onClick={() => {
                  startEdit("header", 0, contextMenu.index);
                  setContextMenu(null);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Переименовать колонку
              </button>
              {colCount > 1 && (
                <button
                  className={styles.contextMenuItem}
                  onClick={() => {
                    deleteColumn(contextMenu.index);
                    setContextMenu(null);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Удалить колонку
                </button>
              )}
            </>
          )}
          {contextMenu.type === "row" && rowCount > 1 && (
            <button
              className={styles.contextMenuItem}
              onClick={() => {
                deleteRow(contextMenu.index);
                setContextMenu(null);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Удалить строку
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default DataTableView;
