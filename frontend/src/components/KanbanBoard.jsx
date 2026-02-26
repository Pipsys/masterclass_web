import { DndContext, DragOverlay, PointerSensor, closestCenter, defaultDropAnimationSideEffects, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import Column from "./Column.jsx";
import TaskCard from "./TaskCard.jsx";
import styles from "./KanbanBoard.module.css";

export default function KanbanBoard({ columns, tasks, onDeleteTask, onOpenTask, onDragEnd, searchTerm }) {
  const [activeId, setActiveId] = useState(null);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragStart = ({ active }) => {
    setActiveId(active?.id ?? null);
  };

  const handleDragEnd = async (event) => {
    setActiveId(null);
    onDragEnd?.(event);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) || null,
    [activeId, tasks]
  );

  const dropAnimation = {
    duration: 200,
    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5"
        }
      }
    })
  };

  const toggleColumn = (columnId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  return (
    <div className={styles.board}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
      >
        {columns.map((col) => (
          <SortableContext
            key={col.id}
            items={tasks.filter((t) => t.status === col.id).map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <Column
              column={col}
              tasks={tasks.filter((t) => t.status === col.id)}
              onDeleteTask={onDeleteTask}
              onOpenTask={onOpenTask}
              collapsed={collapsed.has(col.id)}
              onToggleCollapse={() => toggleColumn(col.id)}
              searchTerm={searchTerm}
            />
          </SortableContext>
        ))}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? (
            <div className={styles.dragOverlay}>
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
